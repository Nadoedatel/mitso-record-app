import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConflictError } from '../common/errors';
import { Prisma } from '@prisma/client';
import { UnrecoverableError, Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { backgroundJobsTotal } from '../metrics';
import { createStudentSchema, StudentsService } from '../students';
import { JobResult } from './dto';
import {
  EXPORT_STUDENT_JOB,
  IMPORT_STUDENTS_JOB,
  JOBS_QUEUE,
  WORKER_CONCURRENCY,
  XLSX_MIME,
} from './jobs.constants';
import { AppJob, ExportStudentJobData, ImportStudentsJobData, JobsService } from './jobs.service';
import { buildRecordBook, studentFullName } from './record-book.xlsx';
import { describeIssues, readStudentCsv, toStudentInput } from './student-import';

/**
 * JobsWorker - takes jobs from the queue and runs them inside the API process.
 * One process is enough for this app; a separate worker process would only need to create the same Worker.
 *
 * Failure rules: a problem of one CSV row is data (it goes into the result and the job still completes);
 * a problem of the system (database or Redis hiccup) is thrown, and BullMQ retries the job with backoff;
 * a job that can never succeed (the student is gone) throws UnrecoverableError and is not retried.
 */
@Injectable()
export class JobsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsWorker.name);
  private worker: Worker<unknown, JobResult | undefined> | null = null;

  constructor(
    private jobs: JobsService,
    private prisma: PrismaService,
    private students: StudentsService,
  ) {}

  onModuleInit(): void {
    if (!this.jobs.connection) {
      this.logger.log('Background jobs are off: REDIS_URL is not set');
      return;
    }
    this.worker = new Worker(JOBS_QUEUE, (job) => this.process(job as AppJob), {
      connection: this.jobs.connection,
      concurrency: WORKER_CONCURRENCY,
    });
    this.worker.on('error', (error) => this.logger.warn(`Worker error: ${error.message}`));
    this.worker.on('completed', (job) => backgroundJobsTotal.inc({ job: job.name, result: 'completed' }));
    this.worker.on('failed', (job, error) => {
      backgroundJobsTotal.inc({ job: job?.name ?? 'unknown', result: 'failed' });
      this.logger.warn(`Job ${job?.id} (${job?.name}) failed on attempt ${job?.attemptsMade}: ${error.message}`);
    });
    this.logger.log('Background jobs worker started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  /** Dispatch by job name */
  async process(job: AppJob): Promise<JobResult> {
    switch (job.name) {
      case EXPORT_STUDENT_JOB:
        return this.exportStudent(job as AppJob, job.data as ExportStudentJobData);
      case IMPORT_STUDENTS_JOB:
        return this.importStudents(job as AppJob, job.data as ImportStudentsJobData);
      default:
        throw new UnrecoverableError(`Unknown job: ${job.name}`);
    }
  }

  /** Builds the record book .xlsx of a student and stores it for download */
  async exportStudent(job: AppJob, data: ExportStudentJobData): Promise<JobResult> {
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        group: { select: { name: true } },
        specialization: { select: { name: true, code: true } },
        grades: {
          include: {
            subject: { select: { name: true, code: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!student) throw new UnrecoverableError(`Student ${data.studentId} not found`);

    await job.updateProgress(50);
    const buffer = await buildRecordBook(student);
    const fileName = `Зачётка ${studentFullName(student)}.xlsx`;
    await this.jobs.saveFile(String(job.id), fileName, buffer);
    await job.updateProgress(100);
    this.logger.log(`Export ${job.id}: ${buffer.length} bytes (${XLSX_MIME})`);
    return { fileName, size: buffer.length };
  }

  /**
   * Creates the students of a CSV file one by one and reports progress.
   * Safe to run twice: a row whose email is already registered is skipped, not an error.
   * (If a retry happens after a system error, rows created by the first attempt count as skipped.)
   */
  async importStudents(job: AppJob, data: ImportStudentsJobData): Promise<JobResult> {
    const rows = readStudentCsv(data.csv);
    const result = { total: rows.length, created: 0, skipped: 0, failed: 0, errors: [] as { row: number; reason: string }[] };

    for (const [index, row] of rows.entries()) {
      const parsed = createStudentSchema.safeParse(toStudentInput(row));
      if (!parsed.success) {
        result.failed++;
        result.errors.push({ row: row.line, reason: describeIssues(parsed.error.issues) });
      } else {
        try {
          await this.students.create(parsed.data);
          result.created++;
        } catch (error) {
          const reason = rowErrorReason(error);
          if (reason === 'skip') result.skipped++;
          else if (reason) {
            result.failed++;
            result.errors.push({ row: row.line, reason });
          } else {
            throw error; // not a problem of this row: let BullMQ retry the job
          }
        }
      }
      await job.updateProgress(Math.round(((index + 1) / rows.length) * 100));
    }
    return result;
  }
}

/**
 * Classifies an error of creating one student:
 * 'skip' = already registered, a string = a problem of this row's data, null = not the row's fault (retry).
 */
export function rowErrorReason(error: unknown): 'skip' | string | null {
  if (error instanceof ConflictError) return 'skip';
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'Номер зачётной книжки уже занят';
    if (error.code === 'P2003') return 'Группа или специальность не найдены';
  }
  return null;
}

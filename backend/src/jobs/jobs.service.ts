import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ForbiddenError, InvalidInputError, NotFoundError, UnavailableError } from '../common/errors';
import { Job, JobsOptions, Queue } from 'bullmq';
import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { Role } from '@prisma/client';
import { createRedisClient } from '../cache';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CsvError } from './csv';
import { JobResult, JobStatus } from './dto';
import {
  COMPLETED_JOB_TTL_SECONDS,
  EXPORT_STUDENT_JOB,
  FAILED_JOB_TTL_SECONDS,
  FILE_TTL_SECONDS,
  IMPORT_STUDENTS_JOB,
  JOBS_QUEUE,
  JOB_ATTEMPTS,
  JOB_BACKOFF_MS,
} from './jobs.constants';
import { parseRedisUrl } from './redis-connection';
import { readStudentCsv } from './student-import';

export interface ExportStudentJobData {
  userId: number;
  studentId: number;
}

export interface ImportStudentsJobData {
  userId: number;
  csv: string;
}

export type JobData = ExportStudentJobData | ImportStudentsJobData;
export type AppJob = Job<JobData, JobResult | undefined>;

/** BullMQ states in which a job with the same id must not be started a second time */
const IN_PROGRESS_STATES = ['waiting', 'active', 'delayed', 'prioritized', 'waiting-children'];

/**
 * JobsService - puts background jobs into the queue and reports their state.
 * The queue lives in Redis; without REDIS_URL the service is disabled and every call answers 503,
 * the rest of the application is not affected.
 */
@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly queue: Queue<JobData, JobResult | undefined> | null;
  private readonly files: Redis | null;
  readonly connection = process.env.REDIS_URL ? parseRedisUrl(process.env.REDIS_URL) : null;

  constructor(private prisma: PrismaService) {
    if (this.connection && process.env.REDIS_URL) {
      this.queue = new Queue(JOBS_QUEUE, { connection: this.connection });
      // Without a listener an 'error' event would crash the process
      this.queue.on('error', (error) => this.logger.warn(`Queue error: ${error.message}`));
      this.files = createRedisClient(process.env.REDIS_URL, new Logger('JobsFiles'));
    } else {
      this.queue = null;
      this.files = null;
    }
  }

  get enabled(): boolean {
    return this.queue !== null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
    this.files?.disconnect();
  }

  /**
   * Queue the Excel export of a student's record book.
   * A student may export only their own record book; ADMIN and TEACHER any.
   * @throws NotFoundError if the student does not exist
   * @throws ForbiddenError if a student asks for someone else's record book
   */
  async requestStudentExport(studentId: number, user: AuthUser): Promise<JobStatus> {
    this.assertEnabled();
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) throw new NotFoundError(`Студент с ID ${studentId} не найден`);
    if (user.role === Role.STUDENT && student.userId !== user.id) throw new ForbiddenError('Доступ запрещён');

    const data: ExportStudentJobData = { userId: user.id, studentId };
    return this.toStatus(await this.enqueue(EXPORT_STUDENT_JOB, data, `export-student-${studentId}-${user.id}`));
  }

  /**
   * Queue the import of students from CSV text. The file is checked here (columns, size, row count),
   * so a broken file is rejected at once instead of failing in the background.
   * The same file from the same user is never processed twice at the same time: it gets one job id.
   * @throws InvalidInputError if the file is not a usable CSV
   */
  async requestStudentImport(csv: string, user: AuthUser): Promise<JobStatus> {
    this.assertEnabled();
    try {
      readStudentCsv(csv);
    } catch (error) {
      if (error instanceof CsvError) throw new InvalidInputError(error.message);
      throw error;
    }

    const data: ImportStudentsJobData = { userId: user.id, csv };
    const hash = createHash('sha256').update(`${user.id}\n${csv}`).digest('hex').slice(0, 32);
    return this.toStatus(await this.enqueue(IMPORT_STUDENTS_JOB, data, `import-students-${hash}`));
  }

  /**
   * State of a job. Jobs are private: another user's job looks like a job that does not exist.
   * @throws NotFoundError
   */
  async getStatus(jobId: string, user: AuthUser): Promise<JobStatus> {
    this.assertEnabled();
    return this.toStatus(await this.getOwnJob(jobId, user));
  }

  /**
   * File produced by a finished export job.
   * @throws NotFoundError if the job is unknown, is not an export, is not finished or the file has expired
   */
  async getFile(jobId: string, user: AuthUser): Promise<{ buffer: Buffer; fileName: string }> {
    this.assertEnabled();
    const job = await this.getOwnJob(jobId, user);
    const [buffer, fileName] = await Promise.all([
      job.name === EXPORT_STUDENT_JOB ? this.files?.getBuffer(this.fileKey(jobId)) : null,
      this.files?.get(`${this.fileKey(jobId)}:name`),
    ]);
    if (!buffer || !fileName) throw new NotFoundError('Файл не найден или срок его хранения истёк');
    return { buffer, fileName };
  }

  /** Called by the worker: keep the generated file next to the queue, it expires on its own */
  async saveFile(jobId: string, fileName: string, buffer: Buffer): Promise<void> {
    if (!this.files) throw new UnavailableError('Redis недоступен');
    await this.files
      .multi()
      .set(this.fileKey(jobId), buffer, 'EX', FILE_TTL_SECONDS)
      .set(`${this.fileKey(jobId)}:name`, fileName, 'EX', FILE_TTL_SECONDS)
      .exec();
  }

  private fileKey(jobId: string): string {
    return `jobs:file:${jobId}`;
  }

  private assertEnabled(): void {
    if (!this.queue) throw new UnavailableError('Фоновые задачи недоступны: не задан REDIS_URL');
  }

  private async getOwnJob(jobId: string, user: AuthUser): Promise<AppJob> {
    const job = await this.queue?.getJob(jobId);
    if (!job || job.data.userId !== user.id) throw new NotFoundError('Задача не найдена');
    return job;
  }

  /**
   * Adds a job unless one with the same id is still waiting or running (then that one is returned).
   * A finished job with the same id is replaced: the work is idempotent (an import skips existing emails),
   * so running it again is safe and the user gets a fresh result.
   */
  private async enqueue(name: string, data: JobData, jobId: string): Promise<AppJob> {
    const queue = this.queue;
    if (!queue) throw new UnavailableError('Фоновые задачи недоступны: не задан REDIS_URL');

    const existing = await queue.getJob(jobId);
    if (existing) {
      if (IN_PROGRESS_STATES.includes(await existing.getState())) return existing;
      await existing.remove();
    }

    const options: JobsOptions = {
      jobId,
      attempts: JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: JOB_BACKOFF_MS },
      removeOnComplete: { age: COMPLETED_JOB_TTL_SECONDS },
      removeOnFail: { age: FAILED_JOB_TTL_SECONDS },
    };
    return queue.add(name, data, options);
  }

  private async toStatus(job: AppJob): Promise<JobStatus> {
    const state = await job.getState();
    const failed = state === 'failed';
    if (failed) this.logger.warn(`Job ${job.id} failed: ${job.failedReason}`);
    return {
      id: String(job.id),
      kind: job.name === EXPORT_STUDENT_JOB ? EXPORT_STUDENT_JOB : IMPORT_STUDENTS_JOB,
      state: state === 'completed' || state === 'failed' || state === 'active' || state === 'delayed' ? state : 'waiting',
      progress: typeof job.progress === 'number' ? Math.min(100, Math.max(0, Math.round(job.progress))) : 0,
      attemptsMade: job.attemptsMade,
      // The real reason (it may be a database error) goes to the log, the client gets a safe text
      failedReason: failed ? 'Не удалось выполнить задачу. Попробуйте ещё раз позже.' : null,
      result: state === 'completed' ? (job.returnvalue ?? null) : null,
    };
  }
}

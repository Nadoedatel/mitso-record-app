import { Prisma } from '@prisma/client';
import { ConflictError } from '../common/errors';
import { UnrecoverableError } from 'bullmq';
import { AppJob, JobsService } from './jobs.service';
import { JobsWorker, rowErrorReason } from './jobs.worker';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from '../students/students.service';

const HEADER = 'email,password,firstName,lastName,studentId,course,enrollmentYear';
const row = (n: number) => `s${n}@mitso.by,password123,Иван,Иванов,ST${n},2,2023`;

function fakeJob(overrides: Partial<AppJob> = {}) {
  const progress: number[] = [];
  const job = {
    id: 'job-1',
    name: 'import-students',
    data: {},
    updateProgress: jest.fn(async (value: number) => void progress.push(value)),
    ...overrides,
  } as unknown as AppJob;
  return { job, progress };
}

describe('JobsWorker', () => {
  const create = jest.fn();
  const saveFile = jest.fn();
  const findStudent = jest.fn();
  let worker: JobsWorker;

  beforeEach(() => {
    jest.resetAllMocks();
    worker = new JobsWorker(
      { connection: null, saveFile } as unknown as JobsService,
      { student: { findUnique: findStudent } } as unknown as PrismaService,
      { create } as unknown as StudentsService,
    );
  });

  describe('importStudents', () => {
    it('creates every valid row and reports progress up to 100', async () => {
      const { job, progress } = fakeJob();
      const csv = [HEADER, row(1), row(2)].join('\n');

      const result = await worker.importStudents(job, { userId: 1, csv });

      expect(result).toEqual({ total: 2, created: 2, skipped: 0, failed: 0, errors: [] });
      expect(create).toHaveBeenCalledTimes(2);
      expect(progress).toEqual([50, 100]);
    });

    it('counts invalid rows as failed with the file line, and keeps going', async () => {
      const { job } = fakeJob();
      const csv = [HEADER, 'bad-email,short,Иван,Иванов,ST1,abc,2023', row(2)].join('\n');

      const result = await worker.importStudents(job, { userId: 1, csv });

      expect(result).toMatchObject({ total: 2, created: 1, failed: 1 });
      expect(result.errors).toEqual([{ row: 2, reason: expect.any(String) }]);
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('skips an already registered email, so running the same file twice is safe', async () => {
      const { job } = fakeJob();
      create.mockRejectedValueOnce(new ConflictError('exists')).mockResolvedValueOnce({});

      const result = await worker.importStudents(job, { userId: 1, csv: [HEADER, row(1), row(2)].join('\n') });

      expect(result).toMatchObject({ created: 1, skipped: 1, failed: 0 });
    });

    it('reports a taken student number or an unknown group as a row problem', async () => {
      const { job } = fakeJob();
      create
        .mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }))
        .mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('fk', { code: 'P2003', clientVersion: 'x' }));

      const result = await worker.importStudents(job, { userId: 1, csv: [HEADER, row(1), row(2)].join('\n') });

      expect(result.failed).toBe(2);
      expect(result.errors?.map((e) => e.reason)).toEqual([
        'Номер зачётной книжки уже занят',
        'Группа или специальность не найдены',
      ]);
    });

    it('rethrows a system error so BullMQ retries the job', async () => {
      const { job } = fakeJob();
      create.mockRejectedValueOnce(new Error('connection lost'));

      await expect(worker.importStudents(job, { userId: 1, csv: [HEADER, row(1)].join('\n') })).rejects.toThrow('connection lost');
    });
  });

  describe('exportStudent', () => {
    it('stores the generated file and returns its name and size', async () => {
      const { job } = fakeJob({ name: 'export-student' });
      findStudent.mockResolvedValue({
        firstName: 'Мария',
        lastName: 'Петрова',
        middleName: null,
        studentId: 'ST2',
        course: 2,
        group: { name: 'ИС-21' },
        specialization: null,
        grades: [],
      });

      const result = await worker.exportStudent(job, { userId: 1, studentId: 2 });

      expect(result.fileName).toBe('Зачётка Петрова Мария.xlsx');
      expect(result.size).toBeGreaterThan(0);
      expect(saveFile).toHaveBeenCalledWith('job-1', 'Зачётка Петрова Мария.xlsx', expect.any(Buffer));
    });

    it('does not retry when the student no longer exists', async () => {
      const { job } = fakeJob({ name: 'export-student' });
      findStudent.mockResolvedValue(null);

      await expect(worker.exportStudent(job, { userId: 1, studentId: 9 })).rejects.toBeInstanceOf(UnrecoverableError);
    });
  });

  it('refuses a job with an unknown name without retries', async () => {
    const { job } = fakeJob({ name: 'something-else' });
    await expect(worker.process(job)).rejects.toBeInstanceOf(UnrecoverableError);
  });
});

describe('rowErrorReason', () => {
  it('treats unknown errors as not the row’s fault', () => {
    expect(rowErrorReason(new Error('boom'))).toBeNull();
    expect(rowErrorReason(new Prisma.PrismaClientKnownRequestError('x', { code: 'P1001', clientVersion: 'x' }))).toBeNull();
  });
});

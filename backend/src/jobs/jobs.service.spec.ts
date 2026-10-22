import { Role } from '@prisma/client';
import { UnavailableError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

const admin = { id: 1, email: 'admin@mitso.by', role: Role.ADMIN };

describe('JobsService without Redis', () => {
  const previous = process.env.REDIS_URL;
  let service: JobsService;

  beforeEach(() => {
    delete process.env.REDIS_URL;
    service = new JobsService({} as PrismaService);
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previous;
  });

  it('is disabled and has no worker connection', () => {
    expect(service.enabled).toBe(false);
    expect(service.connection).toBeNull();
  });

  it.each([
    ['export', () => service.requestStudentExport(1, admin)],
    ['import', () => service.requestStudentImport('a,b\n1,2', admin)],
    ['status', () => service.getStatus('x', admin)],
    ['file', () => service.getFile('x', admin)],
  ])('answers 503 for %s instead of failing obscurely', async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(UnavailableError);
  });
});

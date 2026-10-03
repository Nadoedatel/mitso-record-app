import { NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { PrismaService } from '../prisma/prisma.service';
import { FacultiesService } from './faculties.service';

/**
 * Caching behavior of a reference-data service with the real CacheService (memory store)
 * and a mocked database: how many times the database is asked is the thing under test.
 */
describe('FacultiesService caching', () => {
  const prisma = {
    faculty: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: FacultiesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new FacultiesService(prisma as unknown as PrismaService, new CacheService(new MemoryCacheStore()));
    prisma.faculty.findMany.mockResolvedValue([{ id: 1, name: 'ФИТ' }]);
    prisma.faculty.count.mockResolvedValue(1);
    prisma.faculty.findUnique.mockResolvedValue({ id: 1, name: 'ФИТ' });
    prisma.faculty.update.mockResolvedValue({ id: 1, name: 'Новое' });
    prisma.faculty.create.mockResolvedValue({ id: 2 });
    prisma.faculty.delete.mockResolvedValue({ id: 1 });
  });

  it('asks the database once for the same list query', async () => {
    await service.findAll({ page: 1 });
    await service.findAll({ page: 1 });

    expect(prisma.faculty.findMany).toHaveBeenCalledTimes(1);
  });

  it('caches each filter combination separately', async () => {
    await service.findAll({ page: 1 });
    await service.findAll({ page: 2 });
    await service.findAll({ page: 1, search: 'ИТ' });

    expect(prisma.faculty.findMany).toHaveBeenCalledTimes(3);
  });

  it('serves findOne from the cache', async () => {
    await service.findOne(1);
    await service.findOne(1);

    expect(prisma.faculty.findUnique).toHaveBeenCalledTimes(1);
  });

  it('does not cache a missing faculty', async () => {
    prisma.faculty.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 9, name: 'Новый' });

    await expect(service.findOne(9)).rejects.toBeInstanceOf(NotFoundException);

    expect(await service.findOne(9)).toMatchObject({ id: 9 });
  });

  it.each([
    ['create', () => service.create({ name: 'X' })],
    ['update', () => service.update(1, { name: 'Новое' })],
    ['remove', () => service.remove(1)],
  ])('%s makes the next reads hit the database again', async (_name, write) => {
    await service.findAll({});
    await service.findOne(1);
    prisma.faculty.findMany.mockClear();
    prisma.faculty.findUnique.mockClear();

    await write();
    prisma.faculty.findMany.mockClear(); // ignore reads made by the write itself
    prisma.faculty.findUnique.mockClear();
    await service.findAll({});
    await service.findOne(1);

    expect(prisma.faculty.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.faculty.findUnique).toHaveBeenCalledTimes(1);
  });

  it('checks existence for update/remove against the database, not a possibly stale cache', async () => {
    await service.findOne(1); // cached as existing
    prisma.faculty.findUnique.mockResolvedValue(null); // deleted behind the cache's back

    await expect(service.update(1, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.faculty.update).not.toHaveBeenCalled();
  });
});

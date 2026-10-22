import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import { StudentsRepository } from './students.repository';
import { ConflictError, ForbiddenError, NotFoundError } from '../common/errors';
import { AuthUserCache, CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { CreateStudentDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

/** The service holds the rules; the repository (database access) is replaced by a fake here. */
describe('StudentsService', () => {
  const repo = {
    emailTaken: jest.fn(),
    createWithAccount: jest.fn(),
    findPage: jest.fn(),
    findById: jest.fn(),
    findIdByUserId: jest.fn(),
    findCard: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    deleteAccount: jest.fn(),
  };
  const authUsers = { invalidate: jest.fn() };
  const service = new StudentsService(
    repo as unknown as StudentsRepository,
    new CacheService(new MemoryCacheStore()),
    authUsers as unknown as AuthUserCache,
  );

  const admin: AuthUser = { id: 1, email: 'admin@mitso.by', role: Role.ADMIN };
  const studentUser: AuthUser = { id: 9, email: 's@mitso.by', role: Role.STUDENT };

  const dto: CreateStudentDto = {
    email: 'new@mitso.by',
    password: 'secret123',
    firstName: 'Иван',
    lastName: 'Иванов',
    studentId: '2025-001',
    course: 1,
    enrollmentYear: 2025,
    birthDate: '2005-03-01T00:00:00.000Z',
  };

  beforeEach(() => jest.resetAllMocks());

  describe('create', () => {
    it('rejects an email that is already taken and creates nothing', async () => {
      repo.emailTaken.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictError);
      expect(repo.createWithAccount).not.toHaveBeenCalled();
    });

    it('hashes the password and keeps it out of the profile', async () => {
      repo.emailTaken.mockResolvedValue(false);
      repo.createWithAccount.mockResolvedValue({ id: 7 });

      await service.create(dto);

      const [account, profile, birthDate] = repo.createWithAccount.mock.calls[0];
      expect(account.email).toBe('new@mitso.by');
      expect(account.passwordHash).not.toBe(dto.password);
      expect(account.passwordHash).toMatch(/^\$2[aby]\$/); // a bcrypt hash
      expect(profile).not.toHaveProperty('password');
      expect(profile).not.toHaveProperty('email');
      expect(profile).toMatchObject({ firstName: 'Иван', studentId: '2025-001' });
      expect(birthDate).toBeInstanceOf(Date);
    });

    it('passes no birth date as null', async () => {
      repo.emailTaken.mockResolvedValue(false);

      await service.create({ ...dto, birthDate: undefined });

      expect(repo.createWithAccount.mock.calls[0][2]).toBeNull();
    });
  });

  describe('findAll', () => {
    it('asks for the requested page and computes the page count', async () => {
      repo.findPage.mockResolvedValue({ data: [], total: 41 });

      const result = await service.findAll({ search: 'иван', groupId: 3, page: 2, limit: 20 });

      expect(repo.findPage).toHaveBeenCalledWith({ search: 'иван', groupId: 3 }, 2, 20);
      expect(result).toMatchObject({ total: 41, page: 2, limit: 20, totalPages: 3 });
    });

    it('defaults to the first page of 20', async () => {
      repo.findPage.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({});

      expect(repo.findPage).toHaveBeenCalledWith({ search: undefined, groupId: undefined }, 1, 20);
    });
  });

  describe('findOne: a student sees only their own record', () => {
    it('lets a student read themselves', async () => {
      repo.findIdByUserId.mockResolvedValue(5);
      repo.findCard.mockResolvedValue({ id: 5 });

      expect(await service.findOne(5, studentUser)).toEqual({ id: 5 });
    });

    it('refuses a student who asks for another student, before loading that record', async () => {
      repo.findIdByUserId.mockResolvedValue(5);

      await expect(service.findOne(6, studentUser)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.findCard).not.toHaveBeenCalled();
    });

    it('refuses a student account that has no student profile', async () => {
      repo.findIdByUserId.mockResolvedValue(null);

      await expect(service.findOne(5, studentUser)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('lets staff read anyone, and answers 404 for a missing student', async () => {
      repo.findCard.mockResolvedValueOnce({ id: 6 });
      expect(await service.findOne(6, admin)).toEqual({ id: 6 });
      expect(repo.findIdByUserId).not.toHaveBeenCalled();

      repo.findCard.mockResolvedValueOnce(null);
      await expect(service.findOne(7, admin)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('findByUserId, update', () => {
    it('findByUserId answers 404 when the user has no student profile', async () => {
      repo.findByUserId.mockResolvedValue(null);
      await expect(service.findByUserId(9)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('update changes a student that exists, turning the birth date into a Date', async () => {
      repo.findById.mockResolvedValue({ id: 3 });
      repo.update.mockResolvedValue({ id: 3 });

      await service.update(3, { phone: '+375291112233', birthDate: '2005-03-01T00:00:00.000Z' });

      expect(repo.update).toHaveBeenCalledWith(3, {
        phone: '+375291112233',
        birthDate: new Date('2005-03-01T00:00:00.000Z'),
      });
    });

    it('update leaves the birth date alone when it is not sent, and 404s a missing student', async () => {
      repo.findById.mockResolvedValueOnce({ id: 3 });
      await service.update(3, { phone: '1' });
      expect(repo.update.mock.calls[0][1].birthDate).toBeUndefined();

      repo.findById.mockResolvedValueOnce(null);
      await expect(service.update(4, { phone: '1' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

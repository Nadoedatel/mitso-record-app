import { ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto';

describe('StudentsService.create', () => {
  const tx = {
    user: { create: jest.fn() },
    student: { create: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const service = new StudentsService(prisma as unknown as PrismaService);

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

  beforeEach(() => jest.clearAllMocks());

  it('rejects an email that is already taken and creates nothing', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates the user and the student profile in one transaction, hashing the password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    tx.user.create.mockResolvedValue({ id: 42 });
    tx.student.create.mockResolvedValue({ id: 7 });

    await service.create(dto);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const userData = tx.user.create.mock.calls[0][0].data;
    expect(userData.role).toBe('STUDENT');
    expect(userData.password).not.toBe(dto.password);

    const studentData = tx.student.create.mock.calls[0][0].data;
    expect(studentData.userId).toBe(42);
    expect(studentData).not.toHaveProperty('password');
    expect(studentData.birthDate).toBeInstanceOf(Date);
  });
});

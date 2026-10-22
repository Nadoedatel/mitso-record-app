import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConflictError, ForbiddenError, NotFoundError } from '../common/errors';
import { AuthUserCache, CacheService, InvalidatesCache } from '../cache';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { StudentsRepository } from './students.repository';

/**
 * StudentsService - the rules of student management: who may see which record, hashing of the password,
 * cache invalidation, what happens to the login account. Database access is in StudentsRepository.
 */
@Injectable()
export class StudentsService {
  // `cache` is read by the @InvalidatesCache decorator (it expects this property name)
  constructor(
    private students: StudentsRepository,
    private cache: CacheService,
    private authUsers: AuthUserCache,
  ) {}

  /**
   * Create a new student with a linked user account in a single transaction
   * @throws ConflictError if the email is already taken
   */
  @InvalidatesCache()
  async create(dto: CreateStudentDto) {
    const { email, password, birthDate, ...profileData } = dto;

    if (await this.students.emailTaken(email)) {
      throw new ConflictError('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.students.createWithAccount(
      { email, passwordHash },
      profileData,
      birthDate ? new Date(birthDate) : null,
    );
  }

  /**
   * Find all students with optional search and pagination
   * @param query - pagination and search parameters
   */
  async findAll(query: QueryStudentDto) {
    const { search, groupId, page = 1, limit = 20 } = query;

    const { data, total } = await this.students.findPage({ search, groupId }, page, limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find student by ID (internal, no auth check)
   */
  private async findById(id: number) {
    const student = await this.students.findById(id);
    if (!student) {
      throw new NotFoundError(`Студент с ID ${id} не найден`);
    }
    return student;
  }

  /**
   * Find student by ID
   * Students can only access their own record
   */
  async findOne(id: number, user: AuthUser) {
    if (user.role === Role.STUDENT && (await this.students.findIdByUserId(user.id)) !== id) {
      throw new ForbiddenError('Доступ запрещён');
    }

    const student = await this.students.findCard(id);
    if (!student) {
      throw new NotFoundError(`Студент с ID ${id} не найден`);
    }

    return student;
  }

  /**
   * Find student by user ID
   */
  async findByUserId(userId: number) {
    const student = await this.students.findByUserId(userId);

    if (!student) {
      throw new NotFoundError(`Студент для пользователя ${userId} не найден`);
    }

    return student;
  }

  /**
   * Update student
   */
  @InvalidatesCache()
  async update(id: number, dto: UpdateStudentDto) {
    // Check if student exists
    await this.findById(id);

    return this.students.update(id, {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });
  }

  /**
   * Delete student together with their login account.
   * The relation's `onDelete: Cascade` lives on the student's `userId`, i.e. deleting a USER removes
   * the student (and, through the student, the grades), but deleting a student row leaves the user row
   * behind, and that user could still log in. So the user is deleted, and the cascade does the rest.
   */
  @InvalidatesCache()
  async remove(id: number) {
    // Check if student exists
    const student = await this.findById(id);

    await this.students.deleteAccount(student.userId);
    await this.authUsers.invalidate(student.userId);

    return { message: 'Студент удалён' };
  }
}

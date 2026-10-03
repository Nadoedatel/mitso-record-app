import { createStudentSchema, updateStudentSchema, queryStudentSchema } from '../../students/dto';
import { createTeacherSchema, updateTeacherSchema, assignSubjectsSchema, setTeacherSubjectsSchema } from '../../teachers/dto';
import { createSubjectSchema, querySubjectSchema, assignGroupsSchema } from '../../subjects/dto';
import { createGroupSchema, updateGroupSchema } from '../../groups/dto';
import { createSpecializationSchema, querySpecializationSchema } from '../../specializations/dto';

/**
 * Contract tests for the DTO schemas, without Nest or a database.
 * Each case is something a real client sends (or must be refused).
 */
describe('DTO schemas', () => {
  const student = {
    email: 'new@mitso.by',
    password: 'secret123',
    firstName: 'Иван',
    lastName: 'Иванов',
    studentId: '2025-001',
    course: 1,
    enrollmentYear: 2025,
  };

  describe('students', () => {
    it('accepts the minimal student', () => {
      expect(createStudentSchema.safeParse(student).success).toBe(true);
    });

    it('accepts null for optional fields (the API returns null for an unset group, the edit form sends it back)', () => {
      const result = updateStudentSchema.safeParse({ groupId: null, specializationId: null, middleName: null, birthDate: null });
      expect(result.success).toBe(true);
    });

    it.each(['2005-03-01', '2005-03-01T00:00:00.000Z'])('accepts birthDate %s', (birthDate) => {
      expect(createStudentSchema.safeParse({ ...student, birthDate }).success).toBe(true);
    });

    it.each([
      ['course 7', { course: 7 }],
      ['enrollmentYear 1999', { enrollmentYear: 1999 }],
      ['a weak password', { password: '123' }],
      ['an unknown field', { role: 'ADMIN' }],
      ['a string course', { course: '1' }],
    ])('rejects %s on create', (_label, patch) => {
      expect(createStudentSchema.safeParse({ ...student, ...patch }).success).toBe(false);
    });

    it('does not let credentials through the profile update', () => {
      expect(updateStudentSchema.safeParse({ email: 'x@mitso.by' }).success).toBe(false);
      expect(updateStudentSchema.safeParse({ password: 'secret123' }).success).toBe(false);
    });

    it('parses the list query', () => {
      expect(queryStudentSchema.parse({ page: '2', limit: '10', groupId: '3', search: 'Ив' })).toEqual({
        page: 2,
        limit: 10,
        groupId: 3,
        search: 'Ив',
      });
      expect(queryStudentSchema.safeParse({ limit: '501' }).success).toBe(false);
      expect(queryStudentSchema.safeParse({ groupId: 'abc' }).success).toBe(false);
    });
  });

  describe('teachers', () => {
    const teacher = {
      email: 't@mitso.by',
      password: 'secret123',
      firstName: 'Пётр',
      lastName: 'Петров',
      department: 'IT',
      position: 'Доцент',
    };

    it('accepts a minimal teacher and a partial update', () => {
      expect(createTeacherSchema.safeParse(teacher).success).toBe(true);
      expect(updateTeacherSchema.safeParse({ phone: null }).success).toBe(true);
      expect(updateTeacherSchema.safeParse({}).success).toBe(true);
    });

    it('requires department and position on create', () => {
      expect(createTeacherSchema.safeParse({ ...teacher, department: undefined }).success).toBe(false);
    });

    it('assign needs at least one id, set may be empty (it replaces the whole set)', () => {
      expect(assignSubjectsSchema.safeParse({ subjectIds: [] }).success).toBe(false);
      expect(assignSubjectsSchema.safeParse({ subjectIds: [1, 2] }).success).toBe(true);
      expect(setTeacherSubjectsSchema.safeParse({ subjectIds: [] }).success).toBe(true);
    });

    it.each([[[1.5]], [['1']], [[0]], [[-2]]])('rejects the id list %j', (subjectIds) => {
      expect(setTeacherSubjectsSchema.safeParse({ subjectIds }).success).toBe(false);
    });
  });

  describe('subjects', () => {
    const subject = { name: 'Математика', code: 'MATH101', credits: 4, semester: 1 };

    it('validates ranges', () => {
      expect(createSubjectSchema.safeParse(subject).success).toBe(true);
      expect(createSubjectSchema.safeParse({ ...subject, credits: 11 }).success).toBe(false);
      expect(createSubjectSchema.safeParse({ ...subject, semester: 13 }).success).toBe(false);
      expect(createSubjectSchema.safeParse({ ...subject, description: null }).success).toBe(true);
    });

    it('coerces query filters', () => {
      expect(querySubjectSchema.parse({ teacherId: '2', semester: '3' })).toEqual({ teacherId: 2, semester: 3 });
    });

    it('assign-groups needs at least one group', () => {
      expect(assignGroupsSchema.safeParse({ groupIds: [] }).success).toBe(false);
    });
  });

  describe('groups', () => {
    it('accepts a group with or without a faculty, and a null faculty on update', () => {
      expect(createGroupSchema.safeParse({ name: 'ИТ-21', course: 2 }).success).toBe(true);
      expect(createGroupSchema.safeParse({ name: 'ИТ-21', course: 2, facultyId: 1 }).success).toBe(true);
      expect(updateGroupSchema.safeParse({ facultyId: null }).success).toBe(true);
    });

    it('rejects a course outside 1-6', () => {
      expect(createGroupSchema.safeParse({ name: 'ИТ-21', course: 0 }).success).toBe(false);
    });
  });

  describe('specializations', () => {
    it('requires a faculty', () => {
      expect(createSpecializationSchema.safeParse({ name: 'ПИ' }).success).toBe(false);
      expect(createSpecializationSchema.safeParse({ name: 'ПИ', facultyId: 1 }).success).toBe(true);
    });

    it('parses the query', () => {
      expect(querySpecializationSchema.parse({ facultyId: '1', page: '2' })).toEqual({ facultyId: 1, page: 2 });
    });
  });
});

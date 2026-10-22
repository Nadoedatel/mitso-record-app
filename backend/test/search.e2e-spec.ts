import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createUser } from './helpers/factories';

/** Name search: Cyrillic, any case, several words, patronymic, and the trigram indexes behind it. */
describe('Name search (e2e)', () => {
  let ctx: TestApp;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.prisma, ctx.cache);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  let seq = 0;
  async function student(lastName: string, firstName: string, middleName: string | null = null) {
    const n = ++seq;
    const user = await createUser(ctx.prisma);
    return ctx.prisma.student.create({
      data: { userId: user.id, firstName, lastName, middleName, studentId: `КН-${n}`, course: 1, enrollmentYear: 2025 },
    });
  }

  async function search(path: 'students' | 'teachers', text: string): Promise<string[]> {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const res = await http()
      .get(`/api/${path}`)
      .query({ search: text })
      .set('Authorization', await bearerFor(ctx.app, admin))
      .expect(200);
    return res.body.data.map((row: { lastName: string; firstName: string }) => `${row.lastName} ${row.firstName}`).sort();
  }

  describe('students', () => {
    beforeEach(async () => {
      await student('Иванов', 'Иван', 'Сергеевич');
      await student('Иванов', 'Пётр', 'Иванович');
      await student('Петров', 'Иван', 'Петрович');
      await student('Сидорова', 'Анна');
    });

    it('finds a Cyrillic fragment whatever the case (lower, upper, mixed)', async () => {
      const expected = ['Иванов Иван', 'Иванов Пётр', 'Петров Иван'];
      expect(await search('students', 'иван')).toEqual(expected);
      expect(await search('students', 'ИВАН')).toEqual(expected);
      expect(await search('students', 'иВаН')).toEqual(expected);
    });

    it('several words: every word must be found, each in any field ("Иванов Иван" is one person)', async () => {
      expect(await search('students', 'Иванов Иван')).toEqual(['Иванов Иван']);
      expect(await search('students', 'Иван Иванов')).toEqual(['Иванов Иван']); // order does not matter
      expect(await search('students', 'иванов  иван ')).toEqual(['Иванов Иван']); // extra spaces do not matter
    });

    it('looks into the patronymic and the record book number too', async () => {
      expect(await search('students', 'сергеевич')).toEqual(['Иванов Иван']);
      expect(await search('students', 'Иван Петрович')).toEqual(['Петров Иван']);
      expect(await search('students', 'КН-4')).toEqual(['Сидорова Анна']);
    });

    it('finds nobody when one of the words matches nothing', async () => {
      expect(await search('students', 'Иванов Анна')).toEqual([]);
    });

    it('treats % and _ as plain characters, not as wildcards', async () => {
      expect(await search('students', '%')).toEqual([]);
      expect(await search('students', 'Ива_')).toEqual([]);
    });

    it('an empty search lists everybody', async () => {
      expect(await search('students', '   ')).toHaveLength(4);
    });
  });

  describe('teachers', () => {
    it('finds by name words and department, several words together', async () => {
      const make = async (lastName: string, firstName: string, department: string) => {
        const user = await createUser(ctx.prisma, { role: Role.TEACHER });
        await ctx.prisma.teacher.create({ data: { userId: user.id, firstName, lastName, department, position: 'Доцент' } });
      };
      await make('Козлов', 'Дмитрий', 'Кафедра информационных технологий');
      await make('Новикова', 'Елена', 'Кафедра математики');

      expect(await search('teachers', 'козлов дмитрий')).toEqual(['Козлов Дмитрий']);
      expect(await search('teachers', 'математики')).toEqual(['Новикова Елена']);
      expect(await search('teachers', 'кафедра Елена')).toEqual(['Новикова Елена']);
    });
  });

  describe('the database', () => {
    it('has pg_trgm and it indexes Cyrillic (otherwise the trigram indexes are empty and useless)', async () => {
      const [{ trigrams }] = await ctx.prisma.$queryRaw<{ trigrams: string[] }[]>`SELECT show_trgm('иванов') AS trigrams`;
      const [{ collate }] = await ctx.prisma.$queryRaw<{ collate: string }[]>`
        SELECT datcollate AS collate FROM pg_database WHERE datname = current_database()`;

      if (trigrams.length < 4) {
        // "  и", " ив", "ива", ...: a Cyrillic word gives many trigrams; in the C locale it gives none
        throw new Error(`pg_trgm does not index Cyrillic (collation ${collate}): recreate the database with a UTF-8 locale`);
      }
    });

    it('has the four trigram indexes on students', async () => {
      const rows = await ctx.prisma.$queryRaw<{ indexname: string }[]>`
        SELECT indexname FROM pg_indexes WHERE tablename = 'students' AND indexdef LIKE '%gin_trgm_ops%'`;

      expect(rows.map((r) => r.indexname).sort()).toEqual([
        'students_first_name_trgm_idx',
        'students_last_name_trgm_idx',
        'students_middle_name_trgm_idx',
        'students_student_id_trgm_idx',
      ]);
    });
  });
});

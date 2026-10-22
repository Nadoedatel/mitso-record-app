import { CsvError } from './csv';
import { createStudentSchema } from '../students/dto';
import { MAX_CSV_ROWS } from './jobs.constants';
import { describeIssues, readStudentCsv, toStudentInput } from './student-import';

const HEADER = 'email,password,firstName,lastName,studentId,course,enrollmentYear';
const ROW = 'ivan@mitso.by,password123,Иван,Иванов,ST1,2,2023';

describe('readStudentCsv', () => {
  it('reads rows by header name, ignoring case and column order', () => {
    const rows = readStudentCsv('LastName,Email,password,firstName,studentId,course,enrollmentYear\nИванов,a@mitso.by,password123,Иван,ST1,2,2023');
    expect(rows).toEqual([
      {
        line: 2,
        values: {
          lastName: 'Иванов',
          email: 'a@mitso.by',
          password: 'password123',
          firstName: 'Иван',
          studentId: 'ST1',
          course: '2',
          enrollmentYear: '2023',
        },
      },
    ]);
  });

  it('rejects unknown and missing columns with a readable message', () => {
    expect(() => readStudentCsv(`${HEADER},color\n${ROW},red`)).toThrow('Неизвестные колонки: «color»');
    expect(() => readStudentCsv('email,password\na@mitso.by,password123')).toThrow(/Нет обязательных колонок: .*firstName/);
  });

  it('rejects an empty file, a file without data and a file that is too long', () => {
    expect(() => readStudentCsv('')).toThrow(CsvError);
    expect(() => readStudentCsv(HEADER)).toThrow('В файле нет строк с данными');
    const tooMany = [HEADER, ...Array.from({ length: MAX_CSV_ROWS + 1 }, () => ROW)].join('\n');
    expect(() => readStudentCsv(tooMany)).toThrow(/Слишком много строк/);
  });
});

describe('toStudentInput', () => {
  it('turns numeric columns into numbers and drops empty cells', () => {
    const [row] = readStudentCsv(`${HEADER},phone\n${ROW},`);
    expect(toStudentInput(row)).toMatchObject({ course: 2, enrollmentYear: 2023, studentId: 'ST1' });
    expect(toStudentInput(row)).not.toHaveProperty('phone');
  });

  it('produces input the creation schema accepts, and a readable message when it does not', () => {
    const [good] = readStudentCsv(`${HEADER}\n${ROW}`);
    expect(createStudentSchema.safeParse(toStudentInput(good)).success).toBe(true);

    const [bad] = readStudentCsv(`${HEADER}\nnot-an-email,short,Иван,Иванов,ST1,abc,2023`);
    const result = createStudentSchema.safeParse(toStudentInput(bad));
    expect(result.success).toBe(false);
    if (!result.success) expect(describeIssues(result.error.issues)).toMatch(/email|password|course/);
  });
});

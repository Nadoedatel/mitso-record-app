import { Workbook } from 'exceljs';
import { buildRecordBook, RecordBookStudent, studentFullName } from './record-book.xlsx';

const student: RecordBookStudent = {
  firstName: 'Мария',
  lastName: 'Петрова',
  middleName: 'Сергеевна',
  studentId: 'ST2024002',
  course: 2,
  group: { name: 'ИС-21' },
  specialization: { name: 'Информационные системы', code: '1-40 01 01' },
  grades: [
    { gradeType: 'EXAM', gradeValue: 9, examDate: new Date('2024-01-10'), subject: { name: 'Базы данных', code: 'DB201' }, teacher: { firstName: 'Дмитрий', lastName: 'Козлов' } },
    { gradeType: 'CREDIT', gradeValue: 0, examDate: new Date('2024-06-15'), subject: { name: 'Линейная алгебра', code: 'MATH102' }, teacher: null },
  ],
};

async function read(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook.worksheets[0];
}

describe('buildRecordBook', () => {
  it('writes the student header block', async () => {
    const sheet = await read(await buildRecordBook(student));
    expect(sheet.getCell('B1').value).toBe('Петрова Мария Сергеевна');
    expect(sheet.getCell('B2').value).toBe('ST2024002');
    expect(sheet.getCell('B3').value).toBe('ИС-21');
    expect(sheet.getCell('B4').value).toBe('Информационные системы (1-40 01 01)');
  });

  it('lists grades newest first, with a credit shown as words', async () => {
    const sheet = await read(await buildRecordBook(student));
    expect(sheet.getRow(7).values).toEqual(expect.arrayContaining(['Предмет', 'Оценка']));
    expect(sheet.getRow(8).getCell(1).value).toBe('Линейная алгебра');
    expect(sheet.getRow(8).getCell(4).value).toBe('Не зачёт');
    expect(sheet.getRow(9).getCell(1).value).toBe('Базы данных');
    expect(sheet.getRow(9).getCell(4).value).toBe(9);
    expect(sheet.getRow(9).getCell(6).value).toBe('Козлов Дмитрий');
  });

  it('copes with a student without group, specialization and grades', async () => {
    const sheet = await read(await buildRecordBook({ ...student, group: null, specialization: null, grades: [] }));
    expect(sheet.getCell('B3').value).toBe('Без группы');
    expect(sheet.getCell('B4').value).toBe('—');
    expect(sheet.rowCount).toBe(7);
  });
});

describe('studentFullName', () => {
  it('skips a missing middle name', () => {
    expect(studentFullName({ firstName: 'Иван', lastName: 'Иванов', middleName: null })).toBe('Иванов Иван');
  });
});

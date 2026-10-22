import { Workbook } from 'exceljs';

/** Student with the relations the record book needs (see JobsWorker.exportStudent) */
export interface RecordBookStudent {
  firstName: string;
  lastName: string;
  middleName: string | null;
  studentId: string;
  course: number;
  group: { name: string } | null;
  specialization: { name: string; code: string | null } | null;
  grades: {
    gradeType: 'EXAM' | 'CREDIT' | 'COURSEWORK' | 'TEST' | 'LAB';
    gradeValue: number;
    examDate: Date | null;
    subject: { name: string; code: string };
    teacher: { firstName: string; lastName: string } | null;
  }[];
}

const GRADE_TYPE_LABELS: Record<RecordBookStudent['grades'][number]['gradeType'], string> = {
  EXAM: 'Экзамен',
  CREDIT: 'Зачёт',
  COURSEWORK: 'Курсовая',
  TEST: 'Контрольная',
  LAB: 'Лабораторная',
};

/** CREDIT is stored as 1 (passed) or 0 (not passed); other types are marks 1-10 */
function gradeText(type: string, value: number): string | number {
  if (type === 'CREDIT') return value === 1 ? 'Зачёт' : 'Не зачёт';
  return value;
}

/** Full name for the file name and the header, e.g. "Иванов Иван Иванович" */
export function studentFullName(student: Pick<RecordBookStudent, 'firstName' | 'lastName' | 'middleName'>): string {
  return [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ');
}

/**
 * Builds the record book (зачётная книжка) of one student as an .xlsx file: a header block and a table of grades,
 * newest first. A pure function of its input, so it is easy to test without a database.
 */
export async function buildRecordBook(student: RecordBookStudent): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Зачётная книжка');

  sheet.addRow(['Студент', studentFullName(student)]);
  sheet.addRow(['Номер зачётной книжки', student.studentId]);
  sheet.addRow(['Группа', student.group?.name ?? 'Без группы']);
  sheet.addRow(['Специальность', student.specialization ? `${student.specialization.name}${student.specialization.code ? ` (${student.specialization.code})` : ''}` : '—']);
  sheet.addRow(['Курс', student.course]);
  sheet.addRow([]);

  const header = sheet.addRow(['Предмет', 'Код', 'Тип', 'Оценка', 'Дата', 'Преподаватель']);
  header.font = { bold: true };

  const grades = [...student.grades].sort((a, b) => (b.examDate?.getTime() ?? 0) - (a.examDate?.getTime() ?? 0));
  for (const grade of grades) {
    sheet.addRow([
      grade.subject.name,
      grade.subject.code,
      GRADE_TYPE_LABELS[grade.gradeType],
      gradeText(grade.gradeType, grade.gradeValue),
      grade.examDate ?? '',
      grade.teacher ? `${grade.teacher.lastName} ${grade.teacher.firstName}` : '',
    ]);
  }

  sheet.getColumn(5).numFmt = 'dd.mm.yyyy';
  [28, 12, 14, 10, 12, 24].forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.getColumn(1).width = 30;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

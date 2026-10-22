import { createStudentSchema } from '../students';
import { MAX_CSV_ROWS } from './jobs.constants';
import { CsvError, parseCsv } from './csv';

/** Columns of the import file: the keys of the student creation schema, in this order in the template */
type StudentColumn = keyof typeof createStudentSchema.shape;
export const STUDENT_CSV_COLUMNS = Object.keys(createStudentSchema.shape) as StudentColumn[];

const NUMERIC_COLUMNS = new Set<string>(['groupId', 'course', 'specializationId', 'enrollmentYear']);

export interface CsvStudentRow {
  /** 1-based line in the file, for messages */
  line: number;
  values: Record<string, string>;
}

/**
 * Reads the import file: checks the header and the size, returns the data rows.
 * Header names are matched ignoring case; unknown or missing required columns are an error for the whole file.
 * @throws CsvError with a message for the user
 */
export function readStudentCsv(text: string): CsvStudentRow[] {
  const [header, ...body] = parseCsv(text);
  if (!header) throw new CsvError('Файл пустой');

  const byLowerCase = new Map<string, string>(STUDENT_CSV_COLUMNS.map((name) => [name.toLowerCase(), name]));
  const columns = header.cells.map((cell) => byLowerCase.get(cell.trim().toLowerCase()));

  const unknown = header.cells.filter((_, index) => !columns[index]).map((cell) => `«${cell.trim()}»`);
  if (unknown.length > 0) throw new CsvError(`Неизвестные колонки: ${unknown.join(', ')}`);

  const required = STUDENT_CSV_COLUMNS.filter((name) => !createStudentSchema.shape[name].safeParse(undefined).success);
  const missing = required.filter((name) => !columns.includes(name));
  if (missing.length > 0) throw new CsvError(`Нет обязательных колонок: ${missing.join(', ')}`);

  if (body.length === 0) throw new CsvError('В файле нет строк с данными');
  if (body.length > MAX_CSV_ROWS) throw new CsvError(`Слишком много строк: ${body.length}, максимум ${MAX_CSV_ROWS}`);

  return body.map(({ line, cells }) => {
    const values: Record<string, string> = {};
    columns.forEach((name, index) => {
      if (name) values[name] = (cells[index] ?? '').trim();
    });
    return { line, values };
  });
}

/**
 * Converts the text cells of a row into the shape of the creation schema:
 * empty cell = value not given, numeric columns become numbers (a non-number stays text and fails validation).
 */
export function toStudentInput(row: CsvStudentRow): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(row.values)) {
    if (value === '') continue;
    input[name] = NUMERIC_COLUMNS.has(name) && value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;
  }
  return input;
}

/** One-line description of the first validation problems of a row, in Russian (the schema's locale is ru) */
export function describeIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => `${issue.path.map(String).join('.') || 'строка'}: ${issue.message}`)
    .join('; ');
}

/** Thrown for a CSV that cannot be processed at all; the message is shown to the user */
export class CsvError extends Error {}

/**
 * Parses CSV text into rows of cells (RFC 4180: quoted cells, "" for a quote, commas and line breaks inside quotes).
 * The delimiter is `,` or `;` (Excel with a Russian locale saves `;`), chosen by the header line.
 * A BOM and blank lines are skipped. Each row keeps its 1-based line number for error messages.
 */
export function parseCsv(text: string): { line: number; cells: string[] }[] {
  const source = text.replace(/^﻿/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = count(firstLine, ';') > count(firstLine, ',') ? ';' : ',';

  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = '';
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;

  const endCell = () => {
    cells.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (cells.some((value) => value.trim() !== '')) rows.push({ line: rowLine, cells });
    cells = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === '\n') line++;
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      endRow();
      line++;
      rowLine = line;
    } else {
      cell += char;
    }
  }
  if (inQuotes) throw new CsvError('В файле не закрыта кавычка');
  if (cell !== '' || cells.length > 0) endRow();
  return rows;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

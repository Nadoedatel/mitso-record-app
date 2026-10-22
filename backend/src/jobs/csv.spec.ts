import { CsvError, parseCsv } from './csv';

describe('parseCsv', () => {
  it('splits rows and cells and remembers line numbers', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['1', '2'] },
      { line: 3, cells: ['3', '4'] },
    ]);
  });

  it('handles CRLF, a BOM and blank lines', () => {
    const rows = parseCsv('﻿a,b\r\n\r\n1,2\r\n');
    expect(rows).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 3, cells: ['1', '2'] },
    ]);
  });

  it('reads quoted cells with delimiters, quotes and line breaks inside', () => {
    const rows = parseCsv('a,b\n"x, y","say ""hi"""\n"two\nlines",z\nlast,row');
    expect(rows[1].cells).toEqual(['x, y', 'say "hi"']);
    expect(rows[2].cells).toEqual(['two\nlines', 'z']);
    expect(rows[3]).toEqual({ line: 5, cells: ['last', 'row'] });
  });

  it('picks the semicolon delimiter from the header line', () => {
    expect(parseCsv('a;b\n1,5;2')).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['1,5', '2'] },
    ]);
  });

  it('keeps empty cells', () => {
    expect(parseCsv('a,b,c\n1,,3')[1].cells).toEqual(['1', '', '3']);
  });

  it('rejects an unclosed quote', () => {
    expect(() => parseCsv('a,b\n"oops,1')).toThrow(CsvError);
  });
});

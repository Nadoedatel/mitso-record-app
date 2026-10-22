import { GradeType } from '@prisma/client';
import { InvalidInputError } from '../common/errors';
import { assertGradeValue } from './grade-rules';

describe('assertGradeValue', () => {
  it.each([GradeType.EXAM, GradeType.COURSEWORK, GradeType.TEST, GradeType.LAB])(
    'accepts 1..10 for %s',
    (type) => {
      expect(() => assertGradeValue(type, 1)).not.toThrow();
      expect(() => assertGradeValue(type, 10)).not.toThrow();
    },
  );

  it.each([0, 11, 100])('rejects %d for an exam', (value) => {
    expect(() => assertGradeValue(GradeType.EXAM, value)).toThrow(InvalidInputError);
  });

  it('accepts only 0 (not passed) and 1 (passed) for CREDIT', () => {
    expect(() => assertGradeValue(GradeType.CREDIT, 0)).not.toThrow();
    expect(() => assertGradeValue(GradeType.CREDIT, 1)).not.toThrow();
    expect(() => assertGradeValue(GradeType.CREDIT, 2)).toThrow(InvalidInputError);
    expect(() => assertGradeValue(GradeType.CREDIT, 10)).toThrow(InvalidInputError);
  });
});

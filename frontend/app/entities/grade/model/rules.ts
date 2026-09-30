import { GradeType } from './types'

export const GRADE_MIN = 1
export const GRADE_MAX = 10

/** Stored gradeValue for pass/fail types (must match backend grades/grade-rules.ts) */
export const CREDIT_PASSED = 1
export const CREDIT_FAILED = 0

/** Types graded as "зачёт / не зачёт" instead of 1-10 */
export const PASS_FAIL_TYPES: GradeType[] = [GradeType.CREDIT]

export const GRADE_TYPE_OPTIONS: { value: GradeType; label: string }[] = [
  { value: GradeType.EXAM, label: 'Экзамен' },
  { value: GradeType.CREDIT, label: 'Зачёт' },
  { value: GradeType.COURSEWORK, label: 'Курсовая' },
  { value: GradeType.TEST, label: 'Контрольная' },
  { value: GradeType.LAB, label: 'Лабораторная' },
]

/** Select options for pass/fail types. Values are strings: <select> always emits strings */
export const PASS_FAIL_OPTIONS = [
  { value: String(CREDIT_PASSED), label: 'Зачёт' },
  { value: String(CREDIT_FAILED), label: 'Не зачёт' },
]

export function isPassFailType(type: GradeType | string | null | undefined): boolean {
  return PASS_FAIL_TYPES.includes(type as GradeType)
}

/**
 * Check that a value is allowed for a grade type
 * (pass/fail: 0 or 1, otherwise integer 1-10)
 */
export function isValidGradeValue(type: GradeType, value: number): boolean {
  if (isPassFailType(type)) return value === CREDIT_PASSED || value === CREDIT_FAILED
  return Number.isInteger(value) && value >= GRADE_MIN && value <= GRADE_MAX
}

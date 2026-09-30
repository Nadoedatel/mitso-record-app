import { describe, expect, it } from 'vitest'
import { GradeType, isPassFailType, isValidGradeValue } from '~/entities/grade'

describe('grade rules', () => {
  it('accepts integers 1-10 for numeric types', () => {
    for (const type of [GradeType.EXAM, GradeType.COURSEWORK, GradeType.TEST, GradeType.LAB]) {
      expect(isValidGradeValue(type, 1)).toBe(true)
      expect(isValidGradeValue(type, 10)).toBe(true)
      expect(isValidGradeValue(type, 0)).toBe(false)
      expect(isValidGradeValue(type, 11)).toBe(false)
      expect(isValidGradeValue(type, 5.5)).toBe(false)
    }
  })

  it('accepts only 0 (не зачёт) and 1 (зачёт) for CREDIT', () => {
    expect(isPassFailType(GradeType.CREDIT)).toBe(true)
    expect(isValidGradeValue(GradeType.CREDIT, 0)).toBe(true)
    expect(isValidGradeValue(GradeType.CREDIT, 1)).toBe(true)
    expect(isValidGradeValue(GradeType.CREDIT, 2)).toBe(false)
    expect(isValidGradeValue(GradeType.CREDIT, 10)).toBe(false)
  })

  it('does not treat numeric types as pass/fail', () => {
    expect(isPassFailType(GradeType.EXAM)).toBe(false)
    expect(isPassFailType(null)).toBe(false)
  })
})

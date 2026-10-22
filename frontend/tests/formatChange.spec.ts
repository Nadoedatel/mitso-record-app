import { describe, expect, it } from 'vitest'
import type { GradeSnapshot } from '~/entities/audit'
import { formatChange, formatSnapshot } from '~/features/audit/model/formatChange'

const exam = (gradeValue: number): GradeSnapshot => ({
  studentId: 1,
  subjectId: 2,
  gradeType: 'EXAM',
  gradeValue,
  examDate: null,
  notes: null,
  teacherId: null,
})

describe('audit change formatting', () => {
  it('shows a mark with its type', () => {
    expect(formatSnapshot(exam(8))).toBe('Экзамен: 8')
  })

  it('shows a credit as words, not as 0 and 1', () => {
    expect(formatSnapshot({ ...exam(1), gradeType: 'CREDIT' })).toBe('Зачёт: зачёт')
    expect(formatSnapshot({ ...exam(0), gradeType: 'CREDIT' })).toBe('Зачёт: не зачёт')
  })

  it('shows both sides of an edit, one side of a creation or a deletion', () => {
    expect(formatChange(exam(5), exam(8))).toBe('Экзамен: 5 → Экзамен: 8')
    expect(formatChange(null, exam(8))).toBe('Экзамен: 8')
    expect(formatChange(exam(8), null)).toBe('Экзамен: 8')
    expect(formatChange(null, null)).toBe('—')
  })
})

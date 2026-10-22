import type { AuditAction, GradeSnapshot } from '~/entities/audit'
import { GRADE_TYPE_OPTIONS, isPassFailType, type GradeType } from '~/entities/grade'

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  GRADE_CREATE: 'Оценка выставлена',
  GRADE_UPDATE: 'Оценка изменена',
  GRADE_DELETE: 'Оценка удалена',
}

export const AUDIT_ACTION_OPTIONS = (Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((value) => ({
  value,
  label: AUDIT_ACTION_LABELS[value],
}))

/** "Экзамен: 8", "Зачёт: не зачёт"; a missing snapshot is a dash */
export function formatSnapshot(snapshot: GradeSnapshot | null): string {
  if (!snapshot) return '—'
  const type = GRADE_TYPE_OPTIONS.find((option) => option.value === snapshot.gradeType)?.label ?? snapshot.gradeType
  const value = isPassFailType(snapshot.gradeType as GradeType) ? (snapshot.gradeValue === 1 ? 'зачёт' : 'не зачёт') : snapshot.gradeValue
  return `${type}: ${value}`
}

/** What changed, for the table: "Экзамен: 5 → Экзамен: 8", a creation or a deletion shows one side */
export function formatChange(before: GradeSnapshot | null, after: GradeSnapshot | null): string {
  if (before && after) return `${formatSnapshot(before)} → ${formatSnapshot(after)}`
  return formatSnapshot(after ?? before)
}

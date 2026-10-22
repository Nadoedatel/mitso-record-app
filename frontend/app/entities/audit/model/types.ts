import type { ApiSchemas } from '~/shared/api/generated'

/** One record of the audit log: who changed a grade, and the values before and after */
export type AuditRecord = ApiSchemas['AuditLogListResponseDto']['data'][number]

export type AuditAction = AuditRecord['action']

/** The audited fields of a grade at one moment (`before` and `after` of a record) */
export type GradeSnapshot = NonNullable<AuditRecord['before']>

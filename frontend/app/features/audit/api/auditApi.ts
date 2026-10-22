import type { AuditAction, AuditRecord } from '~/entities/audit'
import { payload, useApiClient } from '~/shared/api/apiClient'

export interface AuditQuery {
  action?: AuditAction
  studentId?: number
  /** Dates as `YYYY-MM-DD` (from the date inputs); `to` includes that whole day */
  from?: string
  to?: string
  /** `nextCursor` of the previous page; leave out for the first page */
  cursor?: string
  limit?: number
}

/** A page of the log read by cursor: no total, `nextCursor` is null on the last page */
export interface AuditPage {
  data: AuditRecord[]
  nextCursor: string | null
  limit: number
}

export const auditApi = {
  /** Audit log of grade changes, newest first (ADMIN only) */
  async fetchAuditLog(query: AuditQuery, signal?: AbortSignal): Promise<AuditPage> {
    const api = useApiClient()
    return payload(
      await api.GET('/api/audit-log', {
        params: {
          query: {
            action: query.action || undefined,
            studentId: query.studentId || undefined,
            from: query.from || undefined,
            to: query.to || undefined,
            cursor: query.cursor || undefined,
            limit: query.limit || undefined,
          },
        },
        signal,
      }),
    )
  },
}

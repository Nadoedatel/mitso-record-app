import { beforeEach, describe, expect, it, vi } from 'vitest'

const auditApi = vi.hoisted(() => ({ fetchAuditLog: vi.fn() }))
vi.mock('~/features/audit/api/auditApi', () => ({ auditApi }))

import { useAuditLog } from '~/features/audit/model/useAuditLog'
import type { AuditRecord } from '~/entities/audit'

const record = (id: number) => ({ id }) as AuditRecord
const page = (ids: number[], nextCursor: string | null) => ({ data: ids.map(record), nextCursor, limit: 20 })

describe('useAuditLog', () => {
  beforeEach(() => auditApi.fetchAuditLog.mockReset())

  it('loads the first page without a cursor', async () => {
    auditApi.fetchAuditLog.mockResolvedValue(page([3, 2], 'c-1'))
    const log = useAuditLog()

    await log.load()

    expect(auditApi.fetchAuditLog.mock.calls[0][0]).toMatchObject({ cursor: undefined, limit: 20 })
    expect(log.items.value.map((r) => r.id)).toEqual([3, 2])
    expect(log.nextCursor.value).toBe('c-1')
    expect(log.loading.value).toBe(false)
  })

  it('"show more" sends the cursor and appends the next page', async () => {
    auditApi.fetchAuditLog.mockResolvedValueOnce(page([3, 2], 'c-1')).mockResolvedValueOnce(page([1], null))
    const log = useAuditLog()

    await log.load()
    await log.loadMore()

    expect(auditApi.fetchAuditLog.mock.calls[1][0].cursor).toBe('c-1')
    expect(log.items.value.map((r) => r.id)).toEqual([3, 2, 1]) // appended, not replaced
    expect(log.nextCursor.value).toBeNull()
  })

  it('does nothing on the last page', async () => {
    auditApi.fetchAuditLog.mockResolvedValue(page([1], null))
    const log = useAuditLog()
    await log.load()

    await log.loadMore()

    expect(auditApi.fetchAuditLog).toHaveBeenCalledTimes(1)
  })

  it('a new load (a filter changed) replaces the list and starts from the first page again', async () => {
    auditApi.fetchAuditLog.mockResolvedValueOnce(page([3, 2], 'c-1')).mockResolvedValueOnce(page([9], null))
    const log = useAuditLog()
    await log.load()

    log.action.value = 'GRADE_DELETE'
    await log.load()

    expect(auditApi.fetchAuditLog.mock.calls[1][0]).toMatchObject({ action: 'GRADE_DELETE', cursor: undefined })
    expect(log.items.value.map((r) => r.id)).toEqual([9])
  })

  it('keeps the filters when it loads more', async () => {
    auditApi.fetchAuditLog.mockResolvedValueOnce(page([3], 'c-1')).mockResolvedValueOnce(page([2], null))
    const log = useAuditLog()
    log.from.value = '2026-10-01'
    await log.load()

    await log.loadMore()

    expect(auditApi.fetchAuditLog.mock.calls[1][0]).toMatchObject({ from: '2026-10-01', cursor: 'c-1' })
  })

  it('shows the error and keeps what was already loaded', async () => {
    auditApi.fetchAuditLog.mockResolvedValueOnce(page([3], 'c-1')).mockRejectedValueOnce(new Error('Нет связи'))
    const log = useAuditLog()
    await log.load()

    await log.loadMore()

    expect(log.error.value).toBe('Нет связи')
    expect(log.items.value.map((r) => r.id)).toEqual([3])
    expect(log.loadingMore.value).toBe(false)
  })
})

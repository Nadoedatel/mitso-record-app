import { ref, type Ref } from 'vue'
import type { AuditAction, AuditRecord } from '~/entities/audit'
import { useAbortable } from '~/shared/lib/useAbortable'
import { auditApi } from '../api/auditApi'

const PAGE_SIZE = 20

/**
 * Audit log of grade changes with filters (action, period), read by cursor: the first page, then
 * "show more" appends the next one. The log only grows, so there are no page numbers and no total.
 * The latest request wins: a slow answer for an old filter is aborted and never shown.
 */
export function useAuditLog() {
  const abortable = useAbortable()

  const action = ref<AuditAction | ''>('')
  const from = ref('')
  const to = ref('')

  // ref<T[]> would deep-unwrap T; the cast keeps the item type intact
  const items = ref<AuditRecord[]>([]) as Ref<AuditRecord[]>
  const nextCursor = ref<string | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')

  async function fetchPage(cursor: string | undefined) {
    const signal = abortable.next()
    error.value = ''
    try {
      const page = await auditApi.fetchAuditLog(
        { action: action.value || undefined, from: from.value, to: to.value, cursor, limit: PAGE_SIZE },
        signal,
      )
      items.value = cursor ? [...items.value, ...page.data] : page.data
      nextCursor.value = page.nextCursor
    } catch (err: unknown) {
      if (abortable.isAbort(err)) return
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
    } finally {
      if (!signal.aborted) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  /** First page for the current filters (also used when a filter changes) */
  function load() {
    loading.value = true
    loadingMore.value = false
    return fetchPage(undefined)
  }

  /** The page after the last one shown; does nothing on the last page */
  function loadMore() {
    if (!nextCursor.value || loadingMore.value) return Promise.resolve()
    loadingMore.value = true
    return fetchPage(nextCursor.value)
  }

  return { items, nextCursor, loading, loadingMore, error, action, from, to, load, loadMore }
}

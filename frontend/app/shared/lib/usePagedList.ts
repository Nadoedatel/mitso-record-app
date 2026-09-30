import { ref, type Ref } from 'vue'
import type { PaginatedResponse } from '~/shared/api/types'
import { useAbortable } from '~/shared/lib/useAbortable'

export interface PagedQuery {
  search?: string
  page: number
  limit: number
}

/**
 * Server-side search + pagination for a list.
 * The latest request wins: a slow response for an old query is aborted, never shown.
 * Extra filters live in the caller's closure; call `load({ resetPage: true })` when they change.
 */
export function usePagedList<T>(
  fetcher: (query: PagedQuery, signal: AbortSignal) => Promise<PaginatedResponse<T>>,
  options: { limit?: number } = {},
) {
  const abortable = useAbortable()

  // ref<T[]> would deep-unwrap T; the cast keeps the caller's item type intact
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref('')
  const search = ref('')
  const page = ref(1)
  const limit = options.limit ?? 20
  const total = ref(0)
  const totalPages = ref(0)

  async function load(opts: { resetPage?: boolean } = {}) {
    if (opts.resetPage) page.value = 1
    const signal = abortable.next()
    loading.value = true
    error.value = ''
    try {
      const result = await fetcher(
        { search: search.value.trim() || undefined, page: page.value, limit },
        signal,
      )
      items.value = result.data
      total.value = result.total
      totalPages.value = result.totalPages
      // Deleting the last item of the last page leaves an empty page: step back
      if (result.data.length === 0 && page.value > 1 && result.totalPages > 0) {
        page.value = result.totalPages
        await load()
      }
    } catch (err: unknown) {
      if (abortable.isAbort(err)) return
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  function changePage(next: number) {
    page.value = next
    return load()
  }

  return { items, loading, error, search, page, total, totalPages, load, changePage }
}

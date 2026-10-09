export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

/** Empty values always go last, whatever the direction (a missing date is not "the smallest date") */
const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === ''

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  // Strings in Russian alphabetical order, numbers inside text compared as numbers ("ИС-2" before "ИС-10")
  return String(a).localeCompare(String(b), 'ru', { numeric: true, sensitivity: 'base' })
}

/**
 * Sorted copy of the rows by one column. The input array is not changed; the sort is stable,
 * so rows with equal values keep their order.
 */
export function sortRows<T extends Record<string, unknown>>(rows: readonly T[], state: SortState): T[] {
  const sign = state.direction === 'asc' ? 1 : -1
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const a = left.row[state.key]
      const b = right.row[state.key]
      if (isEmpty(a) && isEmpty(b)) return left.index - right.index
      if (isEmpty(a)) return 1
      if (isEmpty(b)) return -1
      return compareValues(a, b) * sign || left.index - right.index
    })
    .map((entry) => entry.row)
}

/** Click on a sortable header: none -> ascending -> descending -> none */
export function nextSortState(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }
  return null
}

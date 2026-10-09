import { describe, expect, it } from 'vitest'
import { nextSortState, sortRows } from '~/shared/ui/Table/sortRows'

const rows = [
  { id: 1, name: 'Петров', group: 'ИС-10', score: 7, date: '2026-01-15' },
  { id: 2, name: 'Иванов', group: 'ИС-2', score: 9, date: null },
  { id: 3, name: 'Яковлев', group: 'ИС-2', score: 5, date: '2025-12-01' },
]

const ids = (list: { id: number }[]) => list.map((row) => row.id)

describe('sortRows', () => {
  it('sorts numbers ascending and descending', () => {
    expect(ids(sortRows(rows, { key: 'score', direction: 'asc' }))).toEqual([3, 1, 2])
    expect(ids(sortRows(rows, { key: 'score', direction: 'desc' }))).toEqual([2, 1, 3])
  })

  it('sorts Russian text alphabetically', () => {
    expect(ids(sortRows(rows, { key: 'name', direction: 'asc' }))).toEqual([2, 1, 3])
  })

  it('compares numbers inside text as numbers (ИС-2 before ИС-10)', () => {
    expect(ids(sortRows(rows, { key: 'group', direction: 'asc' }))).toEqual([2, 3, 1])
  })

  it('keeps the order of equal values (stable)', () => {
    expect(ids(sortRows(rows, { key: 'group', direction: 'asc' }))).toEqual([2, 3, 1])
    expect(ids(sortRows(rows, { key: 'group', direction: 'desc' }))).toEqual([1, 2, 3])
  })

  it('puts empty values last in both directions', () => {
    expect(ids(sortRows(rows, { key: 'date', direction: 'asc' }))).toEqual([3, 1, 2])
    expect(ids(sortRows(rows, { key: 'date', direction: 'desc' }))).toEqual([1, 3, 2])
  })

  it('does not change the original array', () => {
    const copy = [...rows]
    sortRows(rows, { key: 'score', direction: 'desc' })
    expect(rows).toEqual(copy)
  })
})

describe('nextSortState', () => {
  it('cycles none -> asc -> desc -> none on the same column', () => {
    const first = nextSortState(null, 'name')
    expect(first).toEqual({ key: 'name', direction: 'asc' })
    const second = nextSortState(first, 'name')
    expect(second).toEqual({ key: 'name', direction: 'desc' })
    expect(nextSortState(second, 'name')).toBeNull()
  })

  it('starts ascending when another column is clicked', () => {
    expect(nextSortState({ key: 'name', direction: 'desc' }, 'score')).toEqual({ key: 'score', direction: 'asc' })
  })
})

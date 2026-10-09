<template>
  <div
    :class="['table-wrapper', `table-wrapper-${mobile}`, { 'table-wrapper-bordered': bordered }]"
    :style="maxHeight ? { maxHeight } : undefined"
  >
    <table :class="tableClasses" role="table" :aria-busy="loading || undefined">
      <caption v-if="caption" class="table-caption">{{ caption }}</caption>
      <thead>
        <tr role="row">
          <th
            v-for="column in columns"
            :key="String(column.key)"
            :style="{ width: column.width, textAlign: column.align || 'left' }"
            :class="['table-header-cell', { 'table-header-sortable': column.sortable }]"
            :aria-sort="ariaSort(column)"
            role="columnheader"
            scope="col"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="table-sort-button"
              @click="toggleSort(column)"
            >
              <span>{{ column.label }}</span>
              <Icon :name="sortIcon(column)" :size="14" />
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr v-for="n in skeletonRows" :key="`skeleton-${n}`" role="row" class="table-row">
          <td
            v-for="column in columns"
            :key="String(column.key)"
            :data-label="column.label"
            class="table-cell"
            role="cell"
          >
            <Skeleton width="70%" />
          </td>
        </tr>
      </tbody>

      <tbody v-else-if="rows.length > 0">
        <tr
          v-for="(row, index) in rows"
          :key="rowKeyOf(row, index)"
          :class="rowClasses(index)"
          role="row"
          :tabindex="clickable ? 0 : undefined"
          @click="handleRowClick(row, index)"
          @keydown.enter="clickable && handleRowClick(row, index)"
        >
          <td
            v-for="column in columns"
            :key="String(column.key)"
            :style="{ textAlign: column.align || 'left' }"
            :data-label="column.label"
            class="table-cell"
            role="cell"
          >
            <slot :name="`cell-${String(column.key)}`" :row="row" :value="getCellValue(row, column)">
              {{ formatCellValue(row, column) }}
            </slot>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr role="row">
          <td :colspan="columns.length" class="table-empty" role="cell">
            <slot name="empty">
              <Icon name="inbox" :size="28" />
              <span>{{ emptyText }}</span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref } from 'vue'
import { Icon, type IconName } from '../Icon'
import { Skeleton } from '../Skeleton'
import type { TableProps, TableEmits, TableColumn } from './types'
import { nextSortState, sortRows, type SortState } from './sortRows'

/**
 * Table Component
 *
 * Универсальная таблица: типизация, слоты ячеек, сортировка по клику на заголовок, скелетон при загрузке,
 * на узком экране карточки (у каждой ячейки видна подпись колонки), закреплённая шапка при `maxHeight`.
 *
 * @example
 * <Table
 *   :columns="[
 *     { key: 'name', label: 'Имя', sortable: true },
 *     { key: 'age', label: 'Возраст', align: 'center', sortable: true }
 *   ]"
 *   :data="students"
 *   row-key="id"
 *   caption="Список студентов"
 * />
 */

const props = withDefaults(defineProps<TableProps<T>>(), {
  striped: false,
  hoverable: true,
  bordered: true,
  loading: false,
  emptyText: 'Нет данных',
  clickable: false,
  mobile: 'cards',
  maxHeight: undefined,
  manualSort: false,
  caption: undefined,
})

const emit = defineEmits<TableEmits<T>>()

const skeletonRows = 5

const sortState = ref<SortState | null>(null)

const rows = computed<T[]>(() =>
  props.manualSort || !sortState.value ? props.data : sortRows(props.data, sortState.value),
)

const tableClasses = computed(() => ['table', { 'table-sticky': !!props.maxHeight }])

const rowClasses = (index: number) => [
  'table-row',
  {
    'table-row-striped': props.striped && index % 2 === 1,
    'table-row-hoverable': props.hoverable,
    'table-row-clickable': props.clickable,
  },
]

const rowKeyOf = (row: T, index: number) =>
  props.rowKey ? (row[props.rowKey] as string | number) : index

const getCellValue = (row: T, column: TableColumn<T>) => {
  const key = column.key as keyof T
  return row[key]
}

const formatCellValue = (row: T, column: TableColumn<T>) => {
  const value = getCellValue(row, column)

  if (column.formatter) {
    return column.formatter(value, row)
  }

  return value
}

const handleRowClick = (row: T, index: number) => {
  emit('rowClick', row, index)
}

const toggleSort = (column: TableColumn<T>) => {
  sortState.value = nextSortState(sortState.value, String(column.key))
  emit('sort', sortState.value)
}

const activeDirection = (column: TableColumn<T>) =>
  sortState.value?.key === String(column.key) ? sortState.value.direction : null

const sortIcon = (column: TableColumn<T>): IconName => {
  const direction = activeDirection(column)
  if (direction === 'asc') return 'chevron-up'
  if (direction === 'desc') return 'chevron-down'
  return 'chevrons-up-down'
}

const ariaSort = (column: TableColumn<T>) => {
  if (!column.sortable) return undefined
  const direction = activeDirection(column)
  if (direction === 'asc') return 'ascending'
  if (direction === 'desc') return 'descending'
  return 'none'
}
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.table-wrapper {
  width: 100%;

  @include scroll-x;
}

.table-wrapper[style*='max-height'] {
  overflow-y: auto;
}

.table-wrapper-bordered {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-base);
  background-color: var(--color-surface);
}

.table-caption {
  @include visually-hidden;
}

.table-header-cell {
  padding: var(--padding-table-cell);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.table-sticky .table-header-cell {
  position: sticky;
  top: 0;
  z-index: 1;
}

.table-sort-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--transition-duration-fast) var(--transition-timing-ease);

  &:hover {
    color: var(--color-text-primary);
  }

  @include focus-ring;
}

.table-header-cell[aria-sort='ascending'] .table-sort-button,
.table-header-cell[aria-sort='descending'] .table-sort-button {
  color: var(--color-primary);
}

.table-cell {
  padding: var(--padding-table-cell);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
}

.table-row:last-child .table-cell {
  border-bottom: none;
}

.table-row-striped {
  background-color: var(--color-bg-subtle);
}

.table-row-hoverable {
  transition: background-color var(--transition-duration-fast) var(--transition-timing-ease);
}

.table-row-hoverable:hover {
  background-color: var(--color-bg-hover);
}

.table-row-clickable {
  cursor: pointer;

  @include focus-ring(inset 0 0 0 2px var(--color-primary));
}

.table-empty {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-base);

  > :deep(svg) {
    display: block;
    margin: 0 auto var(--spacing-2);
  }
}

/* Small screens: smaller type and padding for every table, then the 'cards' layout below 640px */
@include respond-down(md) {
  .table {
    font-size: var(--font-size-sm);
  }

  .table-header-cell,
  .table-cell {
    padding: var(--spacing-2);
  }
}

@include respond-down(sm) {
  /* One card per row, the column label is printed in front of each value (data-label) */
  .table-wrapper-cards {
    border: 0;
    background: none;
    overflow-x: visible;

    .table,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    .table {
      background: none;
    }

    /* The header row is not shown, screen readers still get it */
    thead {
      @include visually-hidden;
    }

    .table-row {
      margin-bottom: var(--spacing-3);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      overflow: hidden;
    }

    .table-cell {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--spacing-2) var(--spacing-4);
      border-bottom: 1px solid var(--color-border-light);
      text-align: right !important;
    }

    .table-row .table-cell:last-child {
      border-bottom: none;
    }

    .table-cell::before {
      content: attr(data-label);
      flex-shrink: 0;
      max-width: 45%;
      text-align: left;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-tertiary);
    }

    /* A column without a label (row actions) has nothing to print */
    .table-cell[data-label='']::before {
      content: none;
    }

    .table-cell[data-label=''] {
      justify-content: flex-end;
    }

    .table-empty {
      display: block;
      border: 1px dashed var(--color-border-dark);
      border-radius: var(--radius-lg);
    }
  }
}
</style>

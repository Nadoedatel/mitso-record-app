<template>
  <div class="table-wrapper">
    <table :class="tableClasses">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="String(column.key)"
            :style="{ width: column.width, textAlign: column.align || 'left' }"
            class="table-header-cell"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="!loading && data.length > 0">
        <tr
          v-for="(row, index) in data"
          :key="index"
          :class="rowClasses(index)"
          @click="handleRowClick(row, index)"
        >
          <td
            v-for="column in columns"
            :key="String(column.key)"
            :style="{ textAlign: column.align || 'left' }"
            class="table-cell"
          >
            <slot :name="`cell-${String(column.key)}`" :row="row" :value="getCellValue(row, column)">
              {{ formatCellValue(row, column) }}
            </slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="loading">
        <tr>
          <td :colspan="columns.length" class="table-empty">
            Загрузка...
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="columns.length" class="table-empty">
            {{ emptyText || 'Нет данных' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import type { TableProps, TableEmits, TableColumn } from './types'

/**
 * Table Component
 *
 * Универсальная таблица с поддержкой типизации, слотов и форматирования
 *
 * @example
 * <Table
 *   :columns="[
 *     { key: 'name', label: 'Имя' },
 *     { key: 'age', label: 'Возраст', align: 'center' }
 *   ]"
 *   :data="students"
 *   striped
 *   hoverable
 *   @row-click="handleRowClick"
 * />
 */

const props = withDefaults(defineProps<TableProps<T>>(), {
  striped: false,
  hoverable: true,
  bordered: true,
  loading: false,
  emptyText: 'Нет данных',
})

const emit = defineEmits<TableEmits<T>>()

const tableClasses = computed(() => {
  const classes = ['table']

  if (props.bordered) {
    classes.push('table-bordered')
  }

  return classes.join(' ')
})

const rowClasses = (index: number) => {
  const classes = ['table-row']

  if (props.striped && index % 2 === 1) {
    classes.push('table-row-striped')
  }

  if (props.hoverable) {
    classes.push('table-row-hoverable')
  }

  return classes.join(' ')
}

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
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-base);
  background-color: var(--color-white);
}

.table-bordered {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.table-header-cell {
  padding: var(--padding-table-cell);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background-color: var(--color-gray-50);
  border-bottom: 2px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.table-cell {
  padding: var(--padding-table-cell);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.table-row:last-child .table-cell {
  border-bottom: none;
}

.table-row-striped {
  background-color: var(--color-gray-50);
}

.table-row-hoverable {
  transition: background-color var(--transition-duration-fast) var(--transition-timing-ease);
  cursor: pointer;
}

.table-row-hoverable:hover {
  background-color: var(--color-bg-hover);
}

.table-empty {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-base);
}

/* Responsive */
@media (max-width: 768px) {
  .table {
    font-size: var(--font-size-sm);
  }

  .table-header-cell,
  .table-cell {
    padding: var(--spacing-2);
  }
}
</style>

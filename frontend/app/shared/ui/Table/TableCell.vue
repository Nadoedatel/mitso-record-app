<template>
  <td :class="cellClasses" :style="cellStyles">
    <slot />
  </td>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableCellProps } from './types'

/**
 * TableCell Component
 *
 * Ячейка таблицы (для ручного создания таблицы)
 *
 * @example
 * <TableRow>
 *   <TableCell align="left">Value 1</TableCell>
 *   <TableCell align="center">Value 2</TableCell>
 *   <TableCell align="right">Value 3</TableCell>
 * </TableRow>
 */

const props = withDefaults(defineProps<TableCellProps>(), {
  align: 'left',
})

const cellClasses = computed(() => {
  return ['table-cell']
})

const cellStyles = computed(() => {
  return {
    textAlign: props.align,
    width: props.width,
  }
})
</script>

<style scoped>
.table-cell {
  padding: var(--padding-table-cell);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}
</style>

<template>
  <tr :class="rowClasses" @click="handleClick">
    <slot />
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableRowProps, TableRowEmits } from './types'

/**
 * TableRow Component
 *
 * Строка таблицы (для ручного создания таблицы)
 *
 * @example
 * <table>
 *   <tbody>
 *     <TableRow clickable hoverable>
 *       <TableCell>Value 1</TableCell>
 *       <TableCell>Value 2</TableCell>
 *     </TableRow>
 *   </tbody>
 * </table>
 */

const props = withDefaults(defineProps<TableRowProps>(), {
  clickable: false,
  hoverable: false,
  striped: false,
})

const emit = defineEmits<TableRowEmits>()

const rowClasses = computed(() => {
  const classes = ['table-row']

  if (props.clickable) {
    classes.push('table-row-clickable')
  }

  if (props.hoverable) {
    classes.push('table-row-hoverable')
  }

  if (props.striped && props.index !== undefined && props.index % 2 === 1) {
    classes.push('table-row-striped')
  }

  return classes.join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.table-row-clickable {
  cursor: pointer;
}

.table-row-hoverable {
  transition: background-color var(--transition-duration-fast) var(--transition-timing-ease);
}

.table-row-hoverable:hover {
  background-color: var(--color-bg-hover);
}

.table-row-striped {
  background-color: var(--color-gray-50);
}
</style>

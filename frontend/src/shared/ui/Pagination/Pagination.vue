<template>
  <div class="pagination">
    <button
      class="pagination-button"
      :disabled="currentPage === 1"
      @click="handlePageChange(currentPage - 1)"
    >
      ←
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      :class="pageClasses(page)"
      @click="handlePageChange(page)"
    >
      {{ page }}
    </button>

    <button
      class="pagination-button"
      :disabled="currentPage === totalPages"
      @click="handlePageChange(currentPage + 1)"
    >
      →
    </button>

    <div v-if="total" class="pagination-info">
      Всего: {{ total }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationProps, PaginationEmits } from './types'

const props = withDefaults(defineProps<PaginationProps>(), {
  perPage: 10,
})

const emit = defineEmits<PaginationEmits>()

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5

  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    const start = Math.max(1, props.currentPage - 2)
    const end = Math.min(props.totalPages, props.currentPage + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const pageClasses = (page: number) => {
  const classes = ['pagination-button']
  if (page === props.currentPage) {
    classes.push('pagination-button-active')
  }
  return classes.join(' ')
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
    emit('change', page)
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.pagination-button {
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--transition-colors);
  min-width: 36px;
}

.pagination-button:hover:not(:disabled):not(.pagination-button-active) {
  background-color: var(--color-gray-50);
  border-color: var(--color-primary);
}

.pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-button-active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.pagination-info {
  margin-left: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>

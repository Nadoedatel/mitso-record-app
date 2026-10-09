<template>
  <div class="loading-state" role="status" aria-live="polite">
    <LoadingSpinner :size="size" />
    <p class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'
import type { LoadingStateProps } from './types'

// @ts-ignore - props used in template
const props = withDefaults(defineProps<LoadingStateProps>(), {
  message: 'Загрузка...',
  size: 'md',
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8);
}

.loading-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>

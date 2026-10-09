<template>
  <div class="empty-state">
    <Icon :name="icon" :size="32" class="empty-icon" />
    <p class="empty-message">{{ message }}</p>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '../Icon'
import type { EmptyStateProps } from './types'

// @ts-ignore - props used in template
const props = withDefaults(defineProps<EmptyStateProps>(), {
  message: 'Нет данных',
  icon: 'inbox',
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8);
  text-align: center;
}

.empty-icon {
  margin-bottom: var(--spacing-2);
  color: var(--color-text-tertiary);
}

.empty-message {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-2) 0;
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
  margin: 0;
}
</style>

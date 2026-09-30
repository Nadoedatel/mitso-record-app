<template>
  <div class="header">
    <h1 v-if="title" class="header-title">{{ title }}</h1>
    <slot v-else name="title" />

    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HeaderProps } from './types'

// @ts-ignore - props used in template
const props = defineProps<HeaderProps>()
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.header-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}
</style>

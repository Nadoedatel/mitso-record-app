<template>
  <div role="group" :aria-labelledby="labelId" class="dropdown-group">
    <div :id="labelId" class="dropdown-group-label">{{ label }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { DropdownGroupProps } from './types'

/** Captioned set of Dropdown items, for one-of-several options (theme and the like) */
defineProps<DropdownGroupProps>()

const labelId = useId()
</script>

<style scoped>
.dropdown-group {
  display: flex;
  flex-direction: column;
}

.dropdown-group-label {
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>

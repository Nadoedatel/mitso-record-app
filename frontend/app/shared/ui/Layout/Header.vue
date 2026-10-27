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

.header-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

/* Phone: title above, actions below at full width. In one row the actions (nowrap buttons) pushed the page wider than the screen */
@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    font-size: var(--font-size-xl);
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

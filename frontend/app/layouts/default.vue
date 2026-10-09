<template>
  <div class="layout-default">
    <slot />
    <ThemeToggle class="theme-corner" />
  </div>
</template>

<script setup lang="ts">
import { ThemeToggle } from '~/shared/ui'
</script>

<style scoped>
.layout-default {
  min-height: 100dvh;
  background: var(--color-bg-page);
  padding: var(--spacing-5);
}

.theme-corner {
  position: fixed;
  right: var(--spacing-4);
  bottom: var(--spacing-4);
  z-index: var(--z-fixed);
}
</style>

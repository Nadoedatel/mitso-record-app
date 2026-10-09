<template>
  <div class="layout-centered">
    <slot />
    <ThemeToggle class="theme-corner" />
  </div>
</template>

<script setup lang="ts">
import { ThemeToggle } from '~/shared/ui'
</script>

<style scoped>
.layout-centered {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
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

<template>
  <div class="layout-default">
    <slot />
  </div>
</template>

<style scoped>
.layout-default {
  min-height: 100dvh;
  background: var(--color-bg-page);
  padding: var(--spacing-5);
}
</style>

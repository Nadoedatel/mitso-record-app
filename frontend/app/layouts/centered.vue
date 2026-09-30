<template>
  <div class="layout-centered">
    <slot />
  </div>
</template>

<style scoped>
.layout-centered {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
  padding: var(--spacing-5);
}
</style>

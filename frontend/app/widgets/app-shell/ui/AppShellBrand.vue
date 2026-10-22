<template>
  <NuxtLink :to="to" class="app-shell-brand">
    <Icon name="school" :size="22" class="app-shell-brand-icon" />
    <span>МИТСО <span class="app-shell-brand-sub">Зачётка</span></span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Icon } from '~/shared/ui'

/** App name linking to the home page of the role (top bar on phones, head of the side panel) */
defineProps<{ to: string }>()
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.app-shell-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition: var(--transition-colors);

  &:hover {
    background-color: var(--color-bg-muted);
  }

  @include focus-ring;
}

.app-shell-brand-icon {
  color: var(--color-primary);
}

.app-shell-brand-sub {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-regular);
}
</style>

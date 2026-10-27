<template>
  <nav class="side-nav" aria-label="Разделы">
    <ul class="side-nav-list">
      <li v-for="item in items" :key="`${item.path}-${item.section ?? ''}`">
        <NuxtLink
          :to="navItemLink(item)"
          :class="['side-nav-link', { 'side-nav-link-active': isActive(item) }]"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <Icon :name="item.icon" :size="18" />
          <span class="side-nav-label">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Icon } from '~/shared/ui'
import { isNavItemActive, navItemLink, type NavItem } from '../model/navigation'

/** Sections of the signed-in role; the current one is highlighted and marked for screen readers */
defineProps<{ items: NavItem[] }>()

const route = useRoute()
const isActive = (item: NavItem) => isNavItemActive(item, route.path, route.query)
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.side-nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.side-nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: var(--transition-colors);

  &:hover {
    background-color: var(--color-bg-muted);
    color: var(--color-text-primary);
  }

  @include focus-ring;
}

.side-nav-link-active,
.side-nav-link-active:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.side-nav-label {
  @include truncate;
}
</style>

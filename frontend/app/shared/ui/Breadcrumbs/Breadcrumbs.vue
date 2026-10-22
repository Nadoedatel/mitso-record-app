<template>
  <nav class="breadcrumbs" aria-label="Путь к странице">
    <ol class="breadcrumbs-list">
      <li v-for="(item, index) in items" :key="`${index}-${item.label}`" class="breadcrumbs-item">
        <NuxtLink v-if="item.to && index < items.length - 1" :to="item.to" class="breadcrumbs-link">
          {{ item.label }}
        </NuxtLink>
        <span v-else class="breadcrumbs-current" :aria-current="index === items.length - 1 ? 'page' : undefined">
          {{ item.label }}
        </span>
        <Icon v-if="index < items.length - 1" name="chevron-right" :size="14" class="breadcrumbs-separator" />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { Icon } from '../Icon'
import type { BreadcrumbsProps } from './types'

/**
 * Breadcrumbs: where the nested page sits inside its section. The last item is the current page (not a link).
 *
 * @example
 * <Breadcrumbs :items="[{ label: 'Студенты', to: '/students' }, { label: 'Петрова А.' }]" />
 */
defineProps<BreadcrumbsProps>()
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.breadcrumbs {
  margin-bottom: var(--spacing-3);
  font-size: var(--font-size-sm);
}

.breadcrumbs-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumbs-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 0;
}

.breadcrumbs-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: var(--transition-colors);

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }

  @include focus-ring;
}

.breadcrumbs-current {
  @include truncate;
  max-width: 40ch;
  color: var(--color-text-primary);
}

.breadcrumbs-separator {
  color: var(--color-text-tertiary);
}
</style>

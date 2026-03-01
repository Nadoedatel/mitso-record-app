<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BadgeProps } from './types'

/**
 * Badge Component
 *
 * Универсальный badge для отображения статусов, меток и т.д.
 *
 * @example
 * <Badge variant="success">Активен</Badge>
 * <Badge variant="danger" pill>Ошибка</Badge>
 */

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'primary',
  size: 'md',
  pill: false,
  outlined: false,
})

const badgeClasses = computed(() => {
  const classes = ['badge']
  classes.push(`badge-${props.variant}`)
  classes.push(`badge-${props.size}`)

  if (props.pill) {
    classes.push('badge-pill')
  }

  if (props.outlined) {
    classes.push('badge-outlined')
  }

  return classes.join(' ')
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-badge);
  white-space: nowrap;
  transition: var(--transition-colors);
}

/* Sizes */
.badge-sm {
  padding: var(--padding-badge-sm);
  font-size: var(--font-size-xs);
}

.badge-md {
  padding: var(--padding-badge-md);
  font-size: var(--font-size-sm);
}

.badge-lg {
  padding: var(--padding-badge-lg);
  font-size: var(--font-size-base);
}

/* Pill */
.badge-pill {
  border-radius: var(--radius-badge-pill);
}

/* Variants - Solid */
.badge-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.badge-secondary {
  background-color: var(--color-gray-500);
  color: var(--color-white);
}

.badge-success {
  background-color: var(--color-success);
  color: var(--color-white);
}

.badge-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.badge-warning {
  background-color: var(--color-warning);
  color: var(--color-white);
}

.badge-info {
  background-color: var(--color-info);
  color: var(--color-white);
}

/* Outlined */
.badge-outlined {
  background-color: transparent;
  border: 1px solid currentColor;
}

.badge-primary.badge-outlined {
  color: var(--color-primary);
}

.badge-secondary.badge-outlined {
  color: var(--color-gray-600);
}

.badge-success.badge-outlined {
  color: var(--color-success);
}

.badge-danger.badge-outlined {
  color: var(--color-danger);
}

.badge-warning.badge-outlined {
  color: var(--color-warning);
}

.badge-info.badge-outlined {
  color: var(--color-info);
}
</style>

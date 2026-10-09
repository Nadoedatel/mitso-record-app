<template>
  <div :class="cardClasses" @click="handleClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardProps, CardEmits } from './types'

/**
 * Card Component
 *
 * Базовая карточка для отображения контента
 *
 * @example
 * <Card variant="elevated" hoverable>
 *   <h3>Title</h3>
 *   <p>Content</p>
 * </Card>
 */

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  clickable: false,
})

const emit = defineEmits<CardEmits>()

const cardClasses = computed(() => {
  const classes = ['card']
  classes.push(`card-${props.variant}`)
  classes.push(`card-padding-${props.padding}`)

  if (props.hoverable) {
    classes.push('card-hoverable')
  }

  if (props.clickable) {
    classes.push('card-clickable')
  }

  return classes.join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  transition: var(--transition-all);
}

/* Variants */
.card-default {
  border: 1px solid var(--color-border);
}

.card-bordered {
  border: 2px solid var(--color-border);
}

.card-elevated {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

/* Padding */
.card-padding-sm {
  padding: var(--padding-card-sm);
}

.card-padding-md {
  padding: var(--padding-card-md);
}

.card-padding-lg {
  padding: var(--padding-card-lg);
}

/* Hoverable */
.card-hoverable:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

/* Clickable */
.card-clickable {
  cursor: pointer;
}

.card-clickable:active {
  transform: translateY(0);
}
</style>

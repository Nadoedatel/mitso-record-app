<template>
  <span :class="badgeClasses">
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GradeValueBadgeProps } from './types'

/**
 * GradeValueBadge Component
 *
 * Badge для отображения значения оценки (отлично, хорошо и т.д.)
 *
 * @example
 * <GradeValueBadge value="ОТЛИЧНО" />
 * <GradeValueBadge value="ЗАЧТЕНО" size="md" />
 * <GradeValueBadge :value="5" />
 * <GradeValueBadge :value="0" type="CREDIT" />  // Не зачёт
 */

const props = withDefaults(defineProps<GradeValueBadgeProps>(), {
  size: 'sm',
})

const valueMap: Record<string, { text: string; variant: string }> = {
  ОТЛИЧНО: { text: 'Отлично', variant: 'excellent' },
  ХОРОШО: { text: 'Хорошо', variant: 'good' },
  УДОВЛЕТВОРИТЕЛЬНО: { text: 'Удовл.', variant: 'satisfactory' },
  НЕУДОВЛЕТВОРИТЕЛЬНО: { text: 'Неудовл.', variant: 'poor' },
  ЗАЧТЕНО: { text: 'Зачтено', variant: 'excellent' },
  НЕ_ЗАЧТЕНО: { text: 'Не зачтено', variant: 'poor' },
}

const getNumericVariant = (value: number): string => {
  if (value >= 9) return 'excellent'
  if (value >= 7) return 'good'
  if (value >= 5) return 'satisfactory'
  return 'poor'
}

const isPassFail = computed(() => typeof props.value === 'number' && props.type === 'CREDIT')

const displayText = computed(() => {
  if (isPassFail.value) {
    return (props.value as number) > 0 ? 'Зачёт' : 'Не зачёт'
  }
  if (typeof props.value === 'number') {
    return props.value.toString()
  }
  return valueMap[props.value]?.text || props.value
})

const badgeClasses = computed(() => {
  const classes = ['grade-value-badge']

  let variant: string
  if (isPassFail.value) {
    variant = (props.value as number) > 0 ? 'excellent' : 'poor'
  } else if (typeof props.value === 'number') {
    variant = getNumericVariant(props.value)
  } else {
    variant = valueMap[props.value]?.variant || 'satisfactory'
  }

  classes.push(`grade-value-${variant}`)
  classes.push(`grade-value-${props.size}`)

  return classes.join(' ')
})
</script>

<style scoped>
.grade-value-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-badge);
  white-space: nowrap;
}

/* Sizes */
.grade-value-sm {
  padding: var(--padding-badge-sm);
  font-size: var(--font-size-xs);
}

.grade-value-md {
  padding: var(--padding-badge-md);
  font-size: var(--font-size-sm);
}

.grade-value-lg {
  padding: var(--padding-badge-lg);
  font-size: var(--font-size-base);
}

/* Grade Value Colors */
.grade-value-excellent {
  background-color: var(--color-grade-excellent-bg);
  color: var(--color-grade-excellent-text);
}

.grade-value-good {
  background-color: var(--color-grade-good-bg);
  color: var(--color-grade-good-text);
}

.grade-value-satisfactory {
  background-color: var(--color-grade-satisfactory-bg);
  color: var(--color-grade-satisfactory-text);
}

.grade-value-poor {
  background-color: var(--color-grade-poor-bg);
  color: var(--color-grade-poor-text);
}
</style>

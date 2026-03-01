<template>
  <span :class="badgeClasses">
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GradeTypeBadgeProps, GradeType } from './types'

/**
 * GradeTypeBadge Component
 *
 * Badge для отображения типа оценки (экзамен, зачет и т.д.)
 *
 * @example
 * <GradeTypeBadge type="EXAM" />
 * <GradeTypeBadge type="CREDIT" size="md" />
 */

const props = withDefaults(defineProps<GradeTypeBadgeProps>(), {
  size: 'sm',
})

const gradeTypeMap: Record<GradeType, { text: string; color: string }> = {
  EXAM: { text: 'Экзамен', color: 'exam' },
  CREDIT: { text: 'Зачет', color: 'credit' },
  DIFFERENTIAL_CREDIT: { text: 'Диф. зачет', color: 'diff-credit' },
  COURSEWORK: { text: 'Курсовая', color: 'coursework' },
  LAB: { text: 'Лабораторная', color: 'lab' },
  TEST: { text: 'Тест', color: 'test' },
}

const displayText = computed(() => {
  return gradeTypeMap[props.type]?.text || props.type
})

const badgeClasses = computed(() => {
  const classes = ['grade-type-badge']
  const color = gradeTypeMap[props.type]?.color || 'exam'
  classes.push(`grade-type-${color}`)
  classes.push(`grade-type-${props.size}`)
  return classes.join(' ')
})
</script>

<style scoped>
.grade-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-badge);
  white-space: nowrap;
}

/* Sizes */
.grade-type-sm {
  padding: var(--padding-badge-sm);
  font-size: var(--font-size-xs);
}

.grade-type-md {
  padding: var(--padding-badge-md);
  font-size: var(--font-size-sm);
}

.grade-type-lg {
  padding: var(--padding-badge-lg);
  font-size: var(--font-size-base);
}

/* Grade Type Colors */
.grade-type-exam {
  background-color: var(--color-grade-exam-bg);
  color: var(--color-grade-exam-text);
}

.grade-type-credit {
  background-color: var(--color-grade-credit-bg);
  color: var(--color-grade-credit-text);
}

.grade-type-diff-credit {
  background-color: var(--color-grade-credit-bg);
  color: var(--color-grade-credit-text);
}

.grade-type-coursework {
  background-color: var(--color-grade-coursework-bg);
  color: var(--color-grade-coursework-text);
}

.grade-type-lab {
  background-color: var(--color-grade-lab-bg);
  color: var(--color-grade-lab-text);
}

.grade-type-test {
  background-color: var(--color-grade-test-bg);
  color: var(--color-grade-test-text);
}
</style>

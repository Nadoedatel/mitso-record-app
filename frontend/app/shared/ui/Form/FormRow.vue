<template>
  <div :class="rowClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormRowProps } from './types'

/**
 * FormRow Component
 *
 * Строка формы с grid layout для расположения полей в несколько колонок
 *
 * @example
 * <FormRow :columns="3" gap="lg">
 *   <FormField label="First Name">
 *     <Input v-model="firstName" />
 *   </FormField>
 *   <FormField label="Last Name">
 *     <Input v-model="lastName" />
 *   </FormField>
 *   <FormField label="Middle Name">
 *     <Input v-model="middleName" />
 *   </FormField>
 * </FormRow>
 */

const props = withDefaults(defineProps<FormRowProps>(), {
  columns: 2,
  gap: 'md',
})

const rowClasses = computed(() => {
  const classes = ['form-row']
  classes.push(`form-row-gap-${props.gap}`)
  return classes.join(' ')
})
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
}

.form-row-gap-sm {
  gap: var(--spacing-sm);
}

.form-row-gap-md {
  gap: var(--spacing-md);
}

.form-row-gap-lg {
  gap: var(--spacing-lg);
}

/* Responsive: на малых экранах 1 колонка */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

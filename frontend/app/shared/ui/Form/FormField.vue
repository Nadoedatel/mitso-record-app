<template>
  <div class="form-field">
    <label v-if="label" :for="htmlFor" class="form-field-label">
      {{ label }}
      <span v-if="required" class="form-field-required">*</span>
    </label>

    <div class="form-field-input">
      <slot />
    </div>

    <span v-if="error" class="form-field-error">
      {{ error }}
    </span>

    <span v-if="hint && !error" class="form-field-hint">
      {{ hint }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { FormFieldProps } from './types'

/**
 * FormField Component
 *
 * Обертка для поля формы с label, error и hint
 *
 * @example
 * <FormField label="Email" for="email" required error="Invalid email">
 *   <Input id="email" v-model="email" />
 * </FormField>
 */

// @ts-ignore - props used in template
const props = withDefaults(defineProps<FormFieldProps>(), {
  required: false,
})
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.form-field-required {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold);
}

.form-field-input {
  width: 100%;
}

.form-field-error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  margin-top: calc(var(--spacing-1) * -1);
}

.form-field-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: calc(var(--spacing-1) * -1);
}
</style>

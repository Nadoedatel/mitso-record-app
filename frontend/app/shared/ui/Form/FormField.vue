<template>
  <div class="form-field">
    <label v-if="label" :for="fieldId" class="form-field-label">
      {{ label }}
      <span v-if="required" class="form-field-required">*</span>
    </label>

    <div class="form-field-input">
      <slot />
    </div>

    <span v-if="error" :id="`${fieldId}-error`" class="form-field-error" role="alert">
      {{ error }}
    </span>

    <span v-if="hint && !error" :id="`${fieldId}-hint`" class="form-field-hint">
      {{ hint }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, useId } from 'vue'
import type { FormFieldProps } from './types'
import { FIELD_CONTEXT_KEY } from './fieldContext'

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

const props = withDefaults(defineProps<FormFieldProps>(), {
  required: false,
})

// The control inside takes this id (see fieldContext.ts); an explicit `for` still wins
const generatedId = useId()
const fieldId = computed(() => props.htmlFor ?? generatedId)

provide(FIELD_CONTEXT_KEY, {
  id: fieldId.value,
  describedBy: computed(() => {
    if (props.error) return `${fieldId.value}-error`
    if (props.hint) return `${fieldId.value}-hint`
    return undefined
  }),
  invalid: computed(() => !!props.error),
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

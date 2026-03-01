<template>
  <div class="select-wrapper" :class="wrapperClasses">
    <select
      :id="id"
      ref="selectRef"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="selectClasses"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <option v-if="placeholder" value="" disabled selected>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="String(option.value)"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>

    <span class="select-arrow">▼</span>

    <span v-if="error && errorMessage" class="select-error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number = string">
import { ref, computed } from 'vue'
import type { SelectProps, SelectEmits } from './types'

/**
 * Select Component
 *
 * Универсальный select с поддержкой типизированных опций
 *
 * @example
 * <Select
 *   v-model="selectedValue"
 *   :options="options"
 *   placeholder="Выберите опцию"
 * />
 */

const props = withDefaults(defineProps<SelectProps<T>>(), {
  placeholder: 'Выберите...',
  size: 'md',
  disabled: false,
  required: false,
  error: false,
  fullWidth: false,
})

const emit = defineEmits<SelectEmits<T>>()

const selectRef = ref<HTMLSelectElement | null>(null)

const wrapperClasses = computed(() => {
  const classes = ['select-container']

  if (props.fullWidth) {
    classes.push('select-full-width')
  }

  if (props.error) {
    classes.push('select-has-error')
  }

  return classes.join(' ')
})

const selectClasses = computed(() => {
  const classes = ['select']
  classes.push(`select-${props.size}`)
  if (props.error) {
    classes.push('select-error')
  }
  return classes.join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value as T
  emit('update:modelValue', value)
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur(),
})
</script>

<style scoped>
.select-wrapper {
  display: inline-flex;
  flex-direction: column;
  position: relative;
}

.select-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.select-full-width {
  width: 100%;
}

.select-full-width .select {
  width: 100%;
}

/* Base Select Styles */
.select {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  outline: none;
  transition: var(--transition-colors);
  cursor: pointer;
  appearance: none;
  padding-right: 36px;
}

.select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.select:disabled {
  background-color: var(--color-gray-50);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Select Sizes */
.select-sm {
  padding: var(--padding-input-sm);
  font-size: var(--font-size-sm);
}

.select-md {
  padding: var(--padding-input-md);
  font-size: var(--font-size-base);
}

.select-lg {
  padding: var(--padding-input-lg);
  font-size: var(--font-size-md);
}

/* Select Arrow */
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: 10px;
  pointer-events: none;
}

/* Error State */
.select-error {
  border-color: var(--color-danger);
}

.select-error:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

.select-error-message {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

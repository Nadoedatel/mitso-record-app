<template>
  <div class="number-input-wrapper" :class="{ 'number-full-width': fullWidth }">
    <div class="number-input-container" :class="{ 'has-controls': showControls }">
      <button
        v-if="showControls"
        type="button"
        class="number-control number-decrement"
        :disabled="disabled || isMinDisabled"
        @click="decrement"
        aria-label="Уменьшить"
      >
        −
      </button>

      <input
        :id="id"
        ref="inputRef"
        type="number"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :autofocus="autofocus"
        :class="inputClasses"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
      />

      <button
        v-if="showControls"
        type="button"
        class="number-control number-increment"
        :disabled="disabled || isMaxDisabled"
        @click="increment"
        aria-label="Увеличить"
      >
        +
      </button>
    </div>

    <span v-if="error && errorMessage" class="number-error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { NumberInputProps, InputEmits } from './types'

/**
 * NumberInput Component
 *
 * Инпут для числовых значений с опциональными кнопками управления
 *
 * @example
 * <NumberInput
 *   v-model="grade"
 *   :min="0"
 *   :max="100"
 *   :step="1"
 *   showControls
 * />
 */

const props = withDefaults(defineProps<NumberInputProps>(), {
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  error: false,
  autofocus: false,
  fullWidth: false,
  step: 1,
  showControls: false,
})

const emit = defineEmits<InputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)

const inputClasses = computed(() => {
  const classes = ['number-input']
  classes.push(`number-input-${props.size}`)
  if (props.error) {
    classes.push('number-input-error')
  }
  return classes.join(' ')
})

const isMinDisabled = computed(() => {
  if (props.min === undefined || props.modelValue === undefined) {
    return false
  }
  return Number(props.modelValue) <= props.min
})

const isMaxDisabled = computed(() => {
  if (props.max === undefined || props.modelValue === undefined) {
    return false
  }
  return Number(props.modelValue) >= props.max
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value === '' ? '' : Number(target.value)
  emit('update:modelValue', value)
  emit('input', event)
}

const handleChange = (event: Event) => {
  emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const increment = () => {
  if (props.disabled || props.readonly) return

  const currentValue = Number(props.modelValue) || 0
  let newValue = currentValue + props.step

  if (props.max !== undefined && newValue > props.max) {
    newValue = props.max
  }

  emit('update:modelValue', newValue)
}

const decrement = () => {
  if (props.disabled || props.readonly) return

  const currentValue = Number(props.modelValue) || 0
  let newValue = currentValue - props.step

  if (props.min !== undefined && newValue < props.min) {
    newValue = props.min
  }

  emit('update:modelValue', newValue)
}

onMounted(() => {
  if (props.autofocus && inputRef.value) {
    inputRef.value.focus()
  }
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  increment,
  decrement,
})
</script>

<style scoped>
/* Number Input Wrapper */
.number-input-wrapper {
  display: inline-flex;
  flex-direction: column;
  position: relative;
}

.number-full-width {
  width: 100%;
}

.number-input-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.number-input-container.has-controls {
  gap: var(--spacing-1);
}

/* Base Number Input Styles */
.number-input {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  outline: none;
  transition: var(--transition-colors);
  width: 100%;
  text-align: left;
}

.number-input::placeholder {
  color: var(--color-text-disabled);
}

.number-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.number-input:disabled {
  background-color: var(--color-gray-50);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Remove default number input arrows */
.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input[type='number'] {
  -moz-appearance: textfield;
}

/* Number Input Sizes */
.number-input-sm {
  padding: var(--padding-input-sm);
  font-size: var(--font-size-sm);
}

.number-input-md {
  padding: var(--padding-input-md);
  font-size: var(--font-size-base);
}

.number-input-lg {
  padding: var(--padding-input-lg);
  font-size: var(--font-size-md);
}

/* Number Controls (+ / -) */
.number-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--color-gray-100);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: var(--transition-colors);
  flex-shrink: 0;
}

.number-control:hover:not(:disabled) {
  background-color: var(--color-gray-200);
  border-color: var(--color-primary);
}

.number-control:active:not(:disabled) {
  transform: scale(0.95);
}

.number-control:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

/* Error State */
.number-input-error {
  border-color: var(--color-danger);
}

.number-input-error:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

.number-error-message {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

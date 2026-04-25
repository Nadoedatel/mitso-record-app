<template>
  <div class="input-wrapper" :class="wrapperClasses">
    <span v-if="iconLeft" class="input-icon-left">{{ iconLeft }}</span>

    <input
      :id="id"
      ref="inputRef"
      :type="type"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :class="inputClasses"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
    />

    <span v-if="iconRight" class="input-icon-right">{{ iconRight }}</span>

    <span v-if="error && errorMessage" class="input-error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { InputProps, InputEmits } from './types'

/**
 * Input Component
 *
 * Универсальный текстовый инпут с поддержкой иконок, валидации и различных состояний
 *
 * @example
 * <Input
 *   v-model="value"
 *   placeholder="Введите текст"
 *   :error="hasError"
 *   errorMessage="Поле обязательно"
 * />
 */

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  error: false,
  autofocus: false,
  fullWidth: false,
})

const emit = defineEmits<InputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)

const wrapperClasses = computed(() => {
  const classes = ['input-container']

  if (props.fullWidth) {
    classes.push('input-full-width')
  }

  if (props.error) {
    classes.push('input-has-error')
  }

  if (props.iconLeft) {
    classes.push('input-has-icon-left')
  }

  if (props.iconRight) {
    classes.push('input-has-icon-right')
  }

  return classes.join(' ')
})

const inputClasses = computed(() => {
  const classes = ['input']

  classes.push(`input-${props.size}`)

  if (props.error) {
    classes.push('input-error')
  }

  return classes.join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
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

onMounted(() => {
  if (props.autofocus && inputRef.value) {
    inputRef.value.focus()
  }
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>

<style scoped>
/* Input Wrapper */
.input-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-full-width {
  width: 100%;
}

.input-full-width .input {
  width: 100%;
}

/* Base Input Styles */
.input {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  outline: none;
  transition: var(--transition-colors);
  width: 100%;
}

.input::placeholder {
  color: var(--color-text-disabled);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input:disabled {
  background-color: var(--color-gray-50);
  cursor: not-allowed;
  opacity: 0.6;
}

.input:readonly {
  background-color: var(--color-gray-50);
  cursor: default;
}

/* Input Sizes */
.input-sm {
  padding: var(--padding-input-sm);
  font-size: var(--font-size-sm);
}

.input-md {
  padding: var(--padding-input-md);
  font-size: var(--font-size-base);
}

.input-lg {
  padding: var(--padding-input-lg);
  font-size: var(--font-size-md);
}

/* Icons */
.input-has-icon-left .input {
  padding-left: 36px;
}

.input-has-icon-right .input {
  padding-right: 36px;
}

.input-icon-left,
.input-icon-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
  pointer-events: none;
}

.input-icon-left {
  left: 12px;
}

.input-icon-right {
  right: 12px;
}

/* Error State */
.input-error {
  border-color: var(--color-danger);
}

.input-error:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

.input-error-message {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

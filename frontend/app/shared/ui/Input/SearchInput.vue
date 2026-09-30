<template>
  <div class="search-input-wrapper" :class="{ 'search-full-width': fullWidth }">
    <div class="search-input-container">
      <span class="search-icon">🔍</span>

      <input
        :id="id"
        ref="inputRef"
        type="search"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder || 'Поиск...'"
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

      <button
        v-if="clearable && modelValue"
        type="button"
        class="clear-button"
        @click="handleClear"
        aria-label="Очистить"
      >
        ✕
      </button>
    </div>

    <span v-if="error && errorMessage" class="search-error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SearchInputProps, InputEmits } from './types'

/**
 * SearchInput Component
 *
 * Специализированный инпут для поиска с иконкой и кнопкой очистки
 *
 * @example
 * <SearchInput
 *   v-model="searchQuery"
 *   placeholder="Поиск студентов..."
 *   :debounce="300"
 *   clearable
 * />
 */

const props = withDefaults(defineProps<SearchInputProps>(), {
  type: 'search',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  error: false,
  autofocus: false,
  fullWidth: false,
  clearable: true,
  debounce: 0,
})

const emit = defineEmits<InputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const inputClasses = computed(() => {
  const classes = ['search-input']
  classes.push(`search-input-${props.size}`)
  if (props.error) {
    classes.push('search-input-error')
  }
  return classes.join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (props.debounce > 0) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    debounceTimeout = setTimeout(() => {
      emit('update:modelValue', value)
    }, props.debounce)
  } else {
    emit('update:modelValue', value)
  }

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

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

onMounted(() => {
  if (props.autofocus && inputRef.value) {
    inputRef.value.focus()
  }
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: handleClear,
})
</script>

<style scoped>
/* Search Input Wrapper */
.search-input-wrapper {
  display: inline-flex;
  flex-direction: column;
  position: relative;
}

.search-full-width {
  width: 100%;
}

.search-input-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

/* Base Search Input Styles */
.search-input {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  outline: none;
  transition: var(--transition-colors);
  width: 100%;
  padding-left: 40px;
  padding-right: 40px;
}

.search-input::placeholder {
  color: var(--color-text-disabled);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input:disabled {
  background-color: var(--color-gray-50);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Remove default search input styling */
.search-input::-webkit-search-cancel-button,
.search-input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

/* Search Input Sizes */
.search-input-sm {
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: var(--font-size-sm);
}

.search-input-md {
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: var(--font-size-base);
}

.search-input-lg {
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: var(--font-size-md);
}

/* Search Icon */
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
  pointer-events: none;
}

/* Clear Button */
.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-colors);
}

.clear-button:hover {
  background-color: var(--color-gray-100);
  color: var(--color-text-primary);
}

.clear-button:active {
  transform: translateY(-50%) scale(0.95);
}

/* Error State */
.search-input-error {
  border-color: var(--color-danger);
}

.search-input-error:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

.search-error-message {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

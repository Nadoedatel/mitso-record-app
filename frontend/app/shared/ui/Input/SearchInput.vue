<template>
  <div class="search-input-wrapper" :class="{ 'search-full-width': fullWidth }">
    <div class="search-input-container">
      <Icon name="search" :size="18" class="search-icon" />

      <input
        :id="controlId"
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="describedBy"
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
        <Icon name="x" :size="16" />
      </button>
    </div>

    <span v-if="error && errorMessage" class="search-error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '../Icon'
import { useFieldContext } from '../Form/fieldContext'
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

// Inside a FormField the control takes its id, error state and description from it
const field = useFieldContext()
const controlId = computed(() => props.id ?? field?.id)
const isInvalid = computed(() => props.error || !!field?.invalid.value)
const describedBy = computed(() => field?.describedBy.value)

const emit = defineEmits<InputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const inputClasses = computed(() => {
  const classes = ['search-input']
  classes.push(`search-input-${props.size}`)
  if (isInvalid.value) {
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
  background-color: var(--color-input-bg);
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
  box-shadow: var(--shadow-focus);
}

.search-input:disabled {
  background-color: var(--color-bg-subtle);
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
  background-color: var(--color-bg-muted);
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
  box-shadow: var(--shadow-focus-danger);
}

.search-error-message {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

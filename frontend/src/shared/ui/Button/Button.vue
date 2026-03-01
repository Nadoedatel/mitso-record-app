<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="button-loading"></span>
    <span v-if="iconLeft && !loading" class="button-icon-left">{{ iconLeft }}</span>
    <span class="button-content">
      <slot />
    </span>
    <span v-if="iconRight && !loading" class="button-icon-right">{{ iconRight }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps, ButtonEmits } from './types'

/**
 * Button Component
 *
 * Универсальная кнопка с поддержкой различных вариантов, размеров и состояний
 *
 * @example
 * <Button variant="primary" size="md" @click="handleClick">
 *   Нажми меня
 * </Button>
 *
 * @example
 * <Button variant="danger" :loading="isLoading" @click="handleDelete">
 *   Удалить
 * </Button>
 */

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
})

const emit = defineEmits<ButtonEmits>()

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Variant
  classes.push(`btn-${props.variant}`)

  // Size
  classes.push(`btn-${props.size}`)

  // States
  if (props.fullWidth) {
    classes.push('btn-full-width')
  }

  if (props.loading) {
    classes.push('btn-loading')
  }

  return classes.join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Base Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-family: var(--font-family);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  border: none;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: var(--transition-all);
  outline: none;
  white-space: nowrap;
  user-select: none;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Button Content */
.button-content {
  display: inline-flex;
  align-items: center;
}

/* Loading Spinner */
.button-loading {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Loading State */
.btn-loading .button-content {
  opacity: 0.7;
}

/* Button Sizes */
.btn-sm {
  padding: var(--padding-button-sm);
  font-size: var(--font-size-sm);
}

.btn-md {
  padding: var(--padding-button-md);
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: var(--padding-button-lg);
  font-size: var(--font-size-md);
}

/* Full Width */
.btn-full-width {
  width: 100%;
}

/* Button Variants */

/* Primary Variant */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-primary-hover);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Secondary Variant */
.btn-secondary {
  background-color: var(--color-gray-100);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-200);
}

.btn-secondary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Danger Variant */
.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
  box-shadow: var(--shadow-hover);
}

.btn-danger:active:not(:disabled) {
  transform: scale(0.98);
}

/* Success Variant */
.btn-success {
  background-color: var(--color-success);
  color: var(--color-white);
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-success-hover);
  box-shadow: var(--shadow-hover);
}

.btn-success:active:not(:disabled) {
  transform: scale(0.98);
}

/* Ghost Variant */
.btn-ghost {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.btn-ghost:active:not(:disabled) {
  transform: scale(0.98);
}
</style>

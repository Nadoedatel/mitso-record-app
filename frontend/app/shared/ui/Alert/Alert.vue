<template>
  <div :class="alertClasses" :role="variant === 'error' || variant === 'warning' ? 'alert' : 'status'">
    <Icon :name="iconName" :size="20" class="alert-icon" />
    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <div class="alert-message">
        <slot />
      </div>
    </div>
    <button v-if="closable" type="button" class="alert-close" aria-label="Закрыть" @click="handleClose">
      <Icon name="x" :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../Icon'
import type { AlertProps, AlertEmits } from './types'

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'info',
  closable: false,
})

const emit = defineEmits<AlertEmits>()

const alertClasses = computed(() => {
  const classes = ['alert']
  classes.push(`alert-${props.variant}`)
  return classes.join(' ')
})

const ICONS: Record<NonNullable<AlertProps['variant']>, IconName> = {
  success: 'circle-check',
  error: 'circle-alert',
  warning: 'triangle-alert',
  info: 'info',
}
const iconName = computed(() => ICONS[props.variant ?? 'info'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid;
}

.alert-icon {
  margin-top: 1px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-1) 0;
}

.alert-message {
  font-size: var(--font-size-sm);
}

.alert-close {
  display: inline-flex;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: var(--spacing-1);
  margin: calc(var(--spacing-1) * -1);
  border-radius: var(--radius-sm);
  opacity: 0.7;
}

.alert-close:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  opacity: 1;
}

.alert-close:hover {
  opacity: 1;
}

.alert-success {
  background-color: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success-dark);
}

.alert-error {
  background-color: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger-dark);
}

.alert-warning {
  background-color: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning-dark);
}

.alert-info {
  background-color: var(--color-info-light);
  border-color: var(--color-info);
  color: var(--color-info-dark);
}
</style>

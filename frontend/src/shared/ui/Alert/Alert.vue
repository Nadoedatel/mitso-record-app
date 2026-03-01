<template>
  <div :class="alertClasses">
    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <div class="alert-message">
        <slot />
      </div>
    </div>
    <button v-if="closable" class="alert-close" @click="handleClose">×</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid;
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
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-left: var(--spacing-3);
  line-height: 1;
  opacity: 0.7;
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

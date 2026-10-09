<template>
  <div :class="spinnerClasses"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadingSpinnerProps } from './types'

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  size: 'md',
})

const spinnerClasses = computed(() => {
  const classes = ['spinner']
  classes.push(`spinner-${props.size}`)
  return classes.join(' ')
})
</script>

<style scoped>
.spinner {
  border: 3px solid var(--color-bg-strong);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-md {
  width: 32px;
  height: 32px;
}

.spinner-lg {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

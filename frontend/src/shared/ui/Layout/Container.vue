<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContainerProps } from './types'

const props = withDefaults(defineProps<ContainerProps>(), {
  maxWidth: 'lg',
  padding: true,
})

const containerClasses = computed(() => {
  const classes = ['container']
  classes.push(`container-${props.maxWidth}`)

  if (props.padding) {
    classes.push('container-padding')
  }

  return classes.join(' ')
})
</script>

<style scoped>
.container {
  width: 100%;
  margin: 0 auto;
}

.container-padding {
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

.container-sm {
  max-width: var(--max-width-sm);
}

.container-md {
  max-width: var(--max-width-md);
}

.container-lg {
  max-width: var(--max-width-lg);
}

.container-xl {
  max-width: var(--max-width-xl);
}

.container-full {
  max-width: var(--max-width-full);
}
</style>

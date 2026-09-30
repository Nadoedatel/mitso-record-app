<template>
  <section :class="sectionClasses">
    <h2 v-if="title" class="section-title">{{ title }}</h2>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SectionProps } from './types'

const props = withDefaults(defineProps<SectionProps>(), {
  padding: 'md',
})

const sectionClasses = computed(() => {
  const classes = ['section']
  classes.push(`section-padding-${props.padding}`)
  return classes.join(' ')
})
</script>

<style scoped>
.section {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.section-padding-sm {
  padding: var(--spacing-sm);
}

.section-padding-md {
  padding: var(--spacing-md);
}

.section-padding-lg {
  padding: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}
</style>

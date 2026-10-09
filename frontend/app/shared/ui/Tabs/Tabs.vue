<template>
  <div class="tabs">
    <div class="tabs-header" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="tab.key === modelValue"
        :tabindex="tab.key === modelValue ? 0 : -1"
        :class="tabClasses(tab)"
        :disabled="tab.disabled"
        @click="handleTabClick(tab)"
        @keydown.right.prevent="moveFocus(1)"
        @keydown.left.prevent="moveFocus(-1)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content" role="tabpanel">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TabsProps, TabsEmits, Tab } from './types'

const props = defineProps<TabsProps>()
const emit = defineEmits<TabsEmits>()

const tabClasses = (tab: Tab) => {
  const classes = ['tab']
  if (tab.key === props.modelValue) {
    classes.push('tab-active')
  }
  if (tab.disabled) {
    classes.push('tab-disabled')
  }
  return classes.join(' ')
}

/** Arrow keys move between tabs (the tab list is one stop in the Tab order) */
const moveFocus = (step: number) => {
  const enabled = props.tabs.filter((tab) => !tab.disabled)
  const current = enabled.findIndex((tab) => tab.key === props.modelValue)
  const next = enabled[(current + step + enabled.length) % enabled.length]
  if (next) handleTabClick(next)
}

const handleTabClick = (tab: Tab) => {
  if (!tab.disabled && tab.key !== props.modelValue) {
    emit('update:modelValue', tab.key)
    emit('change', tab.key)
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
}

.tabs-header {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  gap: var(--spacing-2);
}

.tab {
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-colors);
  margin-bottom: -2px;
}

.tab:hover:not(.tab-disabled) {
  color: var(--color-primary);
}

.tab-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.tabs-content {
  padding: var(--spacing-md) 0;
}
</style>

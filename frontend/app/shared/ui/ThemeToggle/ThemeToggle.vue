<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'"
    :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
    @click="toggle"
  >
    <svg v-if="isDark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/shared/lib/useTheme'

/**
 * Light/dark switch. Placed in the corner for now; it moves into the user menu with the app shell.
 */
const theme = useTheme()
const isDark = computed(() => theme.resolved.value === 'dark')
const toggle = () => theme.toggle()
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-colors);
}

.theme-toggle:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.theme-toggle:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>

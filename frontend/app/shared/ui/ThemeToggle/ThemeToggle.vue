<template>
  <div class="theme-toggle-group">
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'"
    :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
    @click="toggle"
  >
    <Icon :name="isDark ? 'sun' : 'moon'" :size="20" />
  </button>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isRetro ? 'Включить дизайн Классика' : 'Включить дизайн 日本レトロ'"
    :title="isRetro ? 'Классика' : '日本レトロ'"
    :aria-pressed="isRetro"
    @click="theme.setDesign(isRetro ? 'default' : 'retro')"
  >
    <Icon name="palette" :size="20" />
  </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '../Icon'
import { useTheme } from '~/shared/lib/useTheme'

/**
 * Light/dark and design switches for pages without the user menu (login, error page, dev showcase).
 * Signed-in pages pick theme and design in the user menu of the app shell.
 */
const theme = useTheme()
const isDark = computed(() => theme.resolved.value === 'dark')
const isRetro = computed(() => theme.design.value === 'retro')
const toggle = () => theme.toggle()
</script>

<style scoped>
.theme-toggle-group {
  display: inline-flex;
  gap: var(--spacing-2);
}

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

</style>

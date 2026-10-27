<template>
  <button
    type="button"
    :role="checked === undefined ? 'menuitem' : 'menuitemradio'"
    :aria-checked="checked"
    tabindex="-1"
    :class="['dropdown-item', { 'dropdown-item-danger': variant === 'danger' }]"
    @click="select"
  >
    <Icon v-if="icon" :name="icon" :size="16" class="dropdown-item-icon" />
    <span class="dropdown-item-label"><slot /></span>
    <Icon v-if="checked" name="check" :size="16" class="dropdown-item-check" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '../Icon'
import { useDropdownContext } from './dropdownContext'
import type { DropdownItemEmits, DropdownItemProps } from './types'

/**
 * One action of a Dropdown. Choosing it closes the menu and returns focus to the trigger before `select`,
 * so a modal opened from here gives the focus back to the trigger when it closes.
 */
withDefaults(defineProps<DropdownItemProps>(), {
  icon: undefined,
  variant: 'default',
  // undefined keeps a plain action item: Vue would turn a missing boolean prop into false
  checked: undefined,
})

const emit = defineEmits<DropdownItemEmits>()
const dropdown = useDropdownContext()

function select() {
  dropdown?.close(true)
  emit('select')
}
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text-primary);
  font: inherit;
  font-size: var(--font-size-base);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover,
  &:focus-visible {
    background-color: var(--color-bg-muted);
    outline: none;
  }
}

.dropdown-item-icon {
  color: var(--color-text-secondary);
}

.dropdown-item-label {
  flex: 1;

  @include truncate;
}

.dropdown-item-check {
  color: var(--color-primary);
}

.dropdown-item-danger {
  color: var(--color-danger);

  .dropdown-item-icon {
    color: currentColor;
  }

  &:hover,
  &:focus-visible {
    background-color: var(--color-danger-light);
  }
}
</style>

<template>
  <div ref="rootRef" class="dropdown" :class="{ 'dropdown-block': block }">
    <button
      :id="triggerId"
      ref="triggerRef"
      type="button"
      class="dropdown-trigger"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? menuId : undefined"
      :aria-label="label"
      @click="toggle"
      @keydown.down.prevent="openAndFocus('first')"
      @keydown.up.prevent="openAndFocus('last')"
    >
      <slot name="trigger" :open="isOpen" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        :id="menuId"
        ref="menuRef"
        role="menu"
        :aria-labelledby="triggerId"
        :class="['dropdown-menu', `dropdown-${placement}`]"
        @keydown="handleMenuKeydown"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, provide, ref, useId, watch } from 'vue'
import { DROPDOWN_CONTEXT_KEY } from './dropdownContext'
import type { DropdownProps } from './types'

/**
 * Dropdown: a button that opens a menu of actions (WAI-ARIA menu button).
 * Keyboard: Enter, Space or arrows open it; arrows, Home and End move between items; Esc closes and returns
 * focus to the button; Tab closes and moves on. A click outside closes it too.
 *
 * @example
 * <Dropdown label="Действия">
 *   <template #trigger><Icon name="menu" /></template>
 *   <DropdownItem icon="pencil" @select="edit">Изменить</DropdownItem>
 *   <DropdownItem icon="trash" variant="danger" @select="remove">Удалить</DropdownItem>
 * </Dropdown>
 */
withDefaults(defineProps<DropdownProps>(), {
  placement: 'bottom-end',
  label: undefined,
  block: false,
})

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const triggerId = useId()
const menuId = useId()

const items = () =>
  Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? [])

function focusItem(index: number) {
  const list = items()
  if (list.length === 0) return
  list[(index + list.length) % list.length]?.focus()
}

async function openAndFocus(target: 'first' | 'last') {
  isOpen.value = true
  await nextTick()
  focusItem(target === 'first' ? 0 : -1)
}

function close(returnFocus = false) {
  isOpen.value = false
  if (returnFocus) triggerRef.value?.focus()
}

function toggle() {
  if (isOpen.value) close()
  else openAndFocus('first')
}

function handleMenuKeydown(event: KeyboardEvent) {
  const list = items()
  const current = list.indexOf(document.activeElement as HTMLElement)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(current + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(current - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(-1)
      break
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      close(true)
      break
    case 'Tab':
      // No preventDefault: the browser moves focus on to the next control
      close()
      break
  }
}

/** A press anywhere outside the dropdown closes it (focus stays where the user pressed) */
function handlePointerDownOutside(event: PointerEvent) {
  if (event.target instanceof Node && !rootRef.value?.contains(event.target)) close()
}

watch(isOpen, (open) => {
  if (open) document.addEventListener('pointerdown', handlePointerDownOutside)
  else document.removeEventListener('pointerdown', handlePointerDownOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDownOutside)
})

provide(DROPDOWN_CONTEXT_KEY, { close })
</script>

<style scoped lang="scss">
@use 'shared/styles/mixins' as *;

.dropdown {
  position: relative;
  display: inline-flex;
}

.dropdown-block {
  display: flex;

  .dropdown-trigger {
    width: 100%;
  }
}

.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
  padding: var(--spacing-2);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover,
  &[aria-expanded='true'] {
    background-color: var(--color-bg-muted);
  }

  @include focus-ring;
}

.dropdown-menu {
  position: absolute;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  min-width: max(100%, 220px);
  padding: var(--spacing-1);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.dropdown-bottom-start {
  top: calc(100% + var(--spacing-1));
  left: 0;
}

.dropdown-bottom-end {
  top: calc(100% + var(--spacing-1));
  right: 0;
}

.dropdown-top-start {
  bottom: calc(100% + var(--spacing-1));
  left: 0;
}

.dropdown-top-end {
  bottom: calc(100% + var(--spacing-1));
  right: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-duration-fast) var(--transition-timing-ease),
    transform var(--transition-duration-fast) var(--transition-timing-ease);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@include reduced-motion {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>

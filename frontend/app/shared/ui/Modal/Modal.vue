<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            ref="dialogRef"
            :class="modalClasses"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            tabindex="-1"
            @click.stop
            @keydown.tab="trapFocus"
          >
            <ModalHeader
              v-if="title || showClose"
              :title="title"
              :title-id="titleId"
              :show-close="showClose"
              @close="handleClose"
            />

            <div class="modal-body">
              <slot />
            </div>

            <div v-if="$slots.actions" class="modal-actions-wrapper">
              <slot name="actions" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch, onMounted, onBeforeUnmount } from 'vue'
import ModalHeader from './ModalHeader.vue'
import type { ModalProps, ModalEmits } from './types'

/**
 * Modal Component
 *
 * Модальное окно с overlay, заголовком и actions
 *
 * @example
 * <Modal v-model="isOpen" title="Заголовок">
 *   <p>Контент модального окна</p>
 *   <template #actions>
 *     <Button @click="handleSave">Сохранить</Button>
 *   </template>
 * </Modal>
 */

const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md',
  closeOnOverlayClick: true,
  showClose: true,
})

const emit = defineEmits<ModalEmits>()

const modalClasses = computed(() => {
  const classes = ['modal-content']
  classes.push(`modal-${props.size}`)
  return classes.join(' ')
})

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    handleClose()
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    handleClose()
  }
}

const titleId = useId()
const dialogRef = ref<HTMLElement | null>(null)
let returnFocusTo: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const focusableInside = () =>
  Array.from(dialogRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
    (element) => element.offsetParent !== null,
  )

/** Keeps Tab / Shift+Tab inside the open dialog */
const trapFocus = (event: KeyboardEvent) => {
  const items = focusableInside()
  if (items.length === 0) {
    event.preventDefault()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === dialogRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      // First field of the form, otherwise the first control, otherwise the dialog itself
      const body = dialogRef.value?.querySelector<HTMLElement>('.modal-body input, .modal-body select, .modal-body textarea')
      ;(body ?? focusableInside()[0] ?? dialogRef.value)?.focus()
    } else {
      document.body.style.overflow = ''
      returnFocusTo?.focus()
      returnFocusTo = null
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0 0 0 0;
  background-color: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  padding: var(--spacing-md);
}

.modal-content {
  background-color: var(--color-surface-raised);
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-modal);
  max-height: 90vh;
  overflow-y: auto;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
}

/* Modal Sizes */
.modal-sm {
  width: 100%;
  max-width: 400px;
}

.modal-md {
  width: 100%;
  max-width: 600px;
}

.modal-lg {
  width: 100%;
  max-width: 800px;
}

.modal-xl {
  width: 100%;
  max-width: 1000px;
}

.modal-body {
  padding: var(--padding-modal);
  flex: 1;
  overflow-y: auto;
}

.modal-actions-wrapper {
  padding: var(--padding-modal);
  padding-top: 0;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-duration-base) var(--transition-timing-ease);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform var(--transition-duration-base) var(--transition-timing-ease),
    opacity var(--transition-duration-base) var(--transition-timing-ease);
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    border-radius: 0;
    max-height: 100dvh;
    min-height: 100dvh;
  }
}
</style>

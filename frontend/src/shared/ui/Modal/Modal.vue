<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <Transition name="modal-slide">
          <div v-if="modelValue" :class="modalClasses" @click.stop>
            <ModalHeader
              v-if="title || showClose"
              :title="title"
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
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
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

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  padding: var(--spacing-md);
}

.modal-content {
  background-color: var(--color-white);
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
    max-height: 100vh;
    min-height: 100vh;
  }
}
</style>

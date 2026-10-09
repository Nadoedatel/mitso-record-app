<template>
  <div class="modal-header">
    <h3 v-if="title" class="modal-title">{{ title }}</h3>
    <slot v-else />

    <button v-if="showClose" class="modal-close" type="button" @click="handleClose">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ModalHeaderProps, ModalHeaderEmits } from './types'

/**
 * ModalHeader Component
 *
 * Заголовок модального окна с кнопкой закрытия
 *
 * @example
 * <ModalHeader title="Заголовок" @close="handleClose" />
 */

// @ts-ignore - props used in template
const props = withDefaults(defineProps<ModalHeaderProps>(), {
  showClose: true,
})

const emit = defineEmits<ModalHeaderEmits>()

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding-modal);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: var(--transition-colors);
  flex-shrink: 0;
}

.modal-close:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-muted);
}

.modal-close:active {
  background-color: var(--color-bg-strong);
}
</style>

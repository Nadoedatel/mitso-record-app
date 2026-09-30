<template>
  <div :class="actionsClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ModalActionsProps } from './types'

/**
 * ModalActions Component
 *
 * Футер модального окна с кнопками действий
 *
 * @example
 * <ModalActions align="end">
 *   <Button variant="secondary" @click="handleCancel">Отмена</Button>
 *   <Button variant="primary" @click="handleSave">Сохранить</Button>
 * </ModalActions>
 */

const props = withDefaults(defineProps<ModalActionsProps>(), {
  align: 'end',
})

const actionsClasses = computed(() => {
  const classes = ['modal-actions']
  classes.push(`modal-actions-${props.align}`)
  return classes.join(' ')
})
</script>

<style scoped>
.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-actions-start {
  justify-content: flex-start;
}

.modal-actions-center {
  justify-content: center;
}

.modal-actions-end {
  justify-content: flex-end;
}

.modal-actions-between {
  justify-content: space-between;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-actions {
    flex-direction: column;
  }

  .modal-actions > :deep(button) {
    width: 100%;
  }
}
</style>

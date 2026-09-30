<template>
  <Modal
    :model-value="state.open"
    size="sm"
    :title="state.title"
    @update:model-value="(open: boolean) => !open && settle(false)"
  >
    <p class="confirm-message">{{ state.message }}</p>
    <ModalActions>
      <Button variant="secondary" @click="settle(false)">Отмена</Button>
      <Button variant="danger" @click="settle(true)">{{ state.confirmText }}</Button>
    </ModalActions>
  </Modal>
</template>

<script setup lang="ts">
import { useConfirm } from '~/shared/lib/useConfirm'
import { Modal, ModalActions } from '../Modal'
import { Button } from '../Button'

const { state, settle } = useConfirm()
</script>

<style scoped>
.confirm-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-4);
}
</style>

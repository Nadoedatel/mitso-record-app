<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <span class="toast__icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/shared/lib/useToast'

const { toasts } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-5);
  right: var(--spacing-5);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  max-width: 360px;
  pointer-events: auto;
}

.toast--success {
  background-color: var(--color-success-light);
  color: var(--color-success-hover);
  border: 1px solid var(--color-success);
}

.toast--error {
  background-color: var(--color-danger-light);
  color: var(--color-danger-hover);
  border: 1px solid var(--color-danger);
}

.toast__icon {
  font-size: var(--font-size-md);
  flex-shrink: 0;
}

.toast__message {
  line-height: var(--line-height-normal);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-slow);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
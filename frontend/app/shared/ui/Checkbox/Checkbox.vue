<template>
  <div class="checkbox-wrapper">
    <input
      :id="id"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="checkbox-input"
      @change="handleChange"
    />
    <label v-if="label" :for="id" class="checkbox-label">
      {{ label }}
    </label>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import type { CheckboxProps, CheckboxEmits } from './types'

// @ts-ignore - props used in template
const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
})

const emit = defineEmits<CheckboxEmits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', target.checked)
}
</script>

<style scoped>
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

.checkbox-input:disabled + .checkbox-label {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>

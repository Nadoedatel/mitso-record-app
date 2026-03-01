<template>
  <form class="form" :class="props.class" @submit.prevent="handleSubmit">
    <slot />
  </form>
</template>

<script setup lang="ts">
import type { FormProps, FormEmits } from './types'

/**
 * Form Component
 *
 * Обертка для формы с обработкой submit
 *
 * @example
 * <Form @submit="handleSubmit">
 *   <FormField label="Имя">
 *     <Input v-model="name" />
 *   </FormField>
 * </Form>
 */

const props = withDefaults(defineProps<FormProps>(), {
  class: '',
})

const emit = defineEmits<FormEmits>()

const handleSubmit = (event: Event) => {
  emit('submit', event)
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>

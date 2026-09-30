<template>
  <NuxtLayout name="centered">
    <Card class="error-card">
      <h1 class="error-code">{{ error?.statusCode ?? 500 }}</h1>
      <p class="error-message">{{ message }}</p>
      <Button variant="primary" @click="goHome">На главную</Button>
    </Card>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { Card, Button } from '~/shared/ui'

const props = defineProps<{ error: NuxtError }>()

const message = computed(() =>
  props.error?.statusCode === 404 ? 'Страница не найдена' : 'Что-то пошло не так',
)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
.error-card {
  text-align: center;
  padding: var(--spacing-8);
}

.error-code {
  font-size: var(--font-size-4xl);
  color: var(--color-text-primary);
}

.error-message {
  color: var(--color-text-secondary);
  margin: var(--spacing-2) 0 var(--spacing-6);
}
</style>

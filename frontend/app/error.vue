<template>
  <NuxtLayout name="centered">
    <Card class="error-card">
      <span class="error-icon" aria-hidden="true">
        <Icon :name="isNotFound ? 'search-x' : 'server-crash'" :size="32" />
      </span>
      <p class="error-code">Ошибка {{ statusCode }}</p>
      <h1 class="error-title">{{ isNotFound ? 'Страница не найдена' : 'Что-то пошло не так' }}</h1>
      <p class="error-message">
        {{
          isNotFound
            ? 'Адрес набран с ошибкой или страница была удалена.'
            : 'Попробуйте обновить страницу. Если ошибка повторяется, сообщите администратору.'
        }}
      </p>
      <Button variant="primary" @click="goHome">На главную</Button>
    </Card>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { Card, Button, Icon } from '~/shared/ui'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  padding: var(--spacing-8);
  text-align: center;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-4);
  border-radius: var(--radius-full);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.error-code {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.error-title {
  margin: var(--spacing-1) 0 var(--spacing-2);
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
}

.error-message {
  margin: 0 0 var(--spacing-6);
  color: var(--color-text-secondary);
}
</style>

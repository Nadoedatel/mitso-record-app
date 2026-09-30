<template>
  <Card :padding="padding" variant="default">
    <h3 v-if="title" class="info-card-title">{{ title }}</h3>

    <div class="info-card-grid">
      <div v-for="(item, index) in items" :key="index" class="info-card-item">
        <span class="info-card-label">{{ item.label }}:</span>
        <span class="info-card-value">{{ item.value }}</span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from './Card.vue'
import type { InfoCardProps } from './types'

/**
 * InfoCard Component
 *
 * Карточка для отображения информации в формате "ключ: значение"
 * Используется для профилей студентов, преподавателей и т.д.
 *
 * @example
 * <InfoCard
 *   title="Информация о студенте"
 *   :items="[
 *     { label: 'ФИО', value: 'Иванов Иван Иванович' },
 *     { label: 'Группа', value: 'ИС-21' },
 *     { label: 'Номер зачетки', value: '123456' }
 *   ]"
 * />
 */

// @ts-ignore - props used in template
const props = withDefaults(defineProps<InfoCardProps>(), {
  padding: 'md',
})
</script>

<style scoped>
.info-card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.info-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.info-card-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-card-item:last-child {
  border-bottom: none;
}

.info-card-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-right: var(--spacing-4);
}

.info-card-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  text-align: right;
  overflow-wrap: anywhere;
}

/* Responsive */
@media (max-width: 640px) {
  .info-card-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .info-card-value {
    text-align: left;
  }
}
</style>

<template>
  <div>
    <EmptyState
      v-if="subjects.length === 0"
      message="У вас пока нет назначенных предметов"
    />

    <div v-else class="subjects-grid">
      <Card
        v-for="subject in subjects"
        :key="subject.id"
        variant="bordered"
        hoverable
        padding="md"
      >
        <div class="subject-header">
          <h3>{{ subject.name }}</h3>
          <Badge variant="secondary" size="sm">{{ subject.code }}</Badge>
        </div>
        <div class="subject-details">
          <div class="detail-item">
            <Icon name="book" :size="16" class="icon" />
            <span>{{ subject.credits }} кредитов</span>
          </div>
          <div class="detail-item">
            <Icon name="calendar" :size="16" class="icon" />
            <span>Семестр {{ subject.semester }}</span>
          </div>
        </div>
        <p v-if="subject.description" class="subject-description">
          {{ subject.description }}
        </p>
        <Button variant="primary" fullWidth @click="$emit('view-subject', subject)">
          Управление оценками
        </Button>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subject } from '~/entities/subject'
import { Card, Badge, Button, EmptyState, Icon } from '~/shared/ui'

defineProps<{ subjects: Subject[] }>()
defineEmits<{ 'view-subject': [subject: Subject] }>()
</script>

<style scoped>
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-5);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-3);
}

.subject-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  flex: 1;
}

.subject-details {
  display: flex;
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-3);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-item .icon {
  color: var(--color-text-tertiary);
}

.subject-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-3) 0;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}
</style>

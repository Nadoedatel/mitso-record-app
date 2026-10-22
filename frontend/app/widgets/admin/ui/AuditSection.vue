<template>
  <Section>
    <div class="section-header">
      <div class="filters">
        <FormField label="Действие" html-for="audit-action">
          <Select
            id="audit-action"
            v-model="action"
            :options="[{ value: '', label: 'Все действия' }, ...AUDIT_ACTION_OPTIONS]"
            @update:modelValue="load"
          />
        </FormField>
        <FormField label="С даты" html-for="audit-from">
          <Input id="audit-from" v-model="from" type="date" @update:modelValue="load" />
        </FormField>
        <FormField label="По дату" html-for="audit-to">
          <Input id="audit-to" v-model="to" type="date" @update:modelValue="load" />
        </FormField>
      </div>
    </div>

    <Alert v-if="error" variant="error" :title="error" />
    <LoadingState v-else-if="loading" message="Загрузка журнала..." />
    <EmptyState v-else-if="records.length === 0" message="Записей нет" />
    <Table v-else :columns="columns" :data="records" row-key="id" :hoverable="false" caption="Журнал изменений оценок">
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-actor="{ row }">
        {{ row.actorEmail }}
        <span class="role">{{ ROLE_LABELS[row.actorRole] }}</span>
      </template>
      <template #cell-action="{ row }">{{ AUDIT_ACTION_LABELS[row.action] }}</template>
      <template #cell-student="{ row }">{{ row.studentName ?? deletedLabel(row.studentId) }}</template>
      <template #cell-subject="{ row }">{{ row.subjectName ?? deletedLabel(row.subjectId) }}</template>
      <template #cell-change="{ row }">{{ formatChange(row.before, row.after) }}</template>
    </Table>

    <div v-if="nextCursor" class="section-more">
      <Button variant="secondary" :loading="loadingMore" :disabled="loadingMore" @click="loadMore">Показать ещё</Button>
    </div>
  </Section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuditLog } from '~/features/audit/model/useAuditLog'
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_OPTIONS, formatChange } from '~/features/audit/model/formatChange'
import { Alert, Button, EmptyState, FormField, Input, LoadingState, Section, Select, Table } from '~/shared/ui'

/** Who changed which grade and when (ADMIN only); the log is read-only */
const { items: records, loading, loadingMore, error, nextCursor, action, from, to, load, loadMore } = useAuditLog()

const columns = [
  { key: 'createdAt', label: 'Когда' },
  { key: 'actor', label: 'Кто' },
  { key: 'action', label: 'Действие' },
  { key: 'student', label: 'Студент' },
  { key: 'subject', label: 'Предмет' },
  { key: 'change', label: 'Было → стало' },
]

const ROLE_LABELS = { ADMIN: 'админ', TEACHER: 'преподаватель', STUDENT: 'студент' } as const

const deletedLabel = (id: number | null) => (id ? `№${id} (удалён)` : '—')

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })

onMounted(() => load())
</script>

<style scoped>
.section-header {
  margin-bottom: var(--spacing-5);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

.role {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.section-more {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-5);
}
</style>

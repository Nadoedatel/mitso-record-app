<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        :debounce="300"
        placeholder="Поиск по группе..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить группу</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка групп..." />
    <EmptyState v-else-if="groups.length === 0" message="Группы не найдены" />
    <Table v-else :columns="columns" :data="groups" row-key="id" :hoverable="false">
      <template #cell-faculty="{ row }">{{ row.faculty?.name || '-' }}</template>
      <template #cell-studentCount="{ row }">{{ row.studentCount ?? '-' }}</template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <Button size="sm" variant="secondary" @click="openSubjectsModal(row)">Дисциплины</Button>
          <Button size="sm" variant="primary" @click="openModal(row)">Редактировать</Button>
          <Button size="sm" variant="danger" @click="deleteItem(row.id)">Удалить</Button>
        </div>
      </template>
    </Table>
  </Section>

  <!-- Модал редактирования группы -->
  <Modal v-model="showModal" size="md" :title="editingItem ? 'Редактировать группу' : 'Добавить группу'" @close="closeModal">
    <Form @submit.prevent="save">
      <FormRow>
        <FormField label="Название" required>
          <Input v-model="form.name" required />
        </FormField>
        <FormField label="Курс" required>
          <NumberInput v-model="form.course" :min="1" :max="6" required />
        </FormField>
      </FormRow>
      <FormField label="Факультет">
        <Select
          v-model="form.facultyId"
          :options="faculties.map(f => ({ value: f.id, label: f.name }))"
          placeholder="Не выбран"
        />
      </FormField>
      <ModalActions>
        <Button variant="secondary" @click="closeModal">Отмена</Button>
        <Button variant="primary" type="submit">
          {{ editingItem ? 'Сохранить' : 'Создать' }}
        </Button>
      </ModalActions>
    </Form>
  </Modal>

  <!-- Модал управления дисциплинами группы -->
  <Modal v-model="showSubjectsModal" size="lg" :title="`Дисциплины группы: ${managingGroup?.name}`" @close="closeSubjectsModal">
    <LoadingState v-if="subjectsLoading" message="Загрузка дисциплин..." />
    <div v-else>
      <p class="subjects-hint">Выберите дисциплины, которые изучает эта группа:</p>
      <EmptyState v-if="allSubjects.length === 0" message="Дисциплины не найдены" />
      <div v-else class="subjects-list">
        <label
          v-for="subject in allSubjects"
          :key="subject.id"
          class="subject-item"
        >
          <Checkbox
            :modelValue="selectedSubjectIds.has(subject.id)"
            @update:modelValue="toggleSubject(subject.id)"
          />
          <div class="subject-info">
            <span class="subject-name">{{ subject.name }}</span>
            <span class="subject-meta">{{ subject.code }} · Семестр {{ subject.semester }} · {{ subject.credits }} кр.</span>
          </div>
        </label>
      </div>
    </div>
    <ModalActions>
      <Button variant="secondary" @click="closeSubjectsModal">Отмена</Button>
      <Button variant="primary" :disabled="subjectsLoading" @click="saveSubjects">
        Сохранить
      </Button>
    </ModalActions>
  </Modal>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGroupsAdmin } from '~/features/groups/model/useGroupsAdmin'
import {
  Section,
  Table,
  SearchInput,
  Select,
  Button,
  LoadingState,
  EmptyState,
  Modal,
  ModalActions,
  Form,
  FormField,
  FormRow,
  Input,
  NumberInput,
  Checkbox,
} from '~/shared/ui'

const {
  groups,
  loading,
  search,
  faculties,
  showModal,
  editingItem,
  form,
  showSubjectsModal,
  subjectsLoading,
  managingGroup,
  allSubjects,
  selectedSubjectIds,
  searchItems,
  loadLookups,
  openModal,
  closeModal,
  save,
  deleteItem,
  openSubjectsModal,
  closeSubjectsModal,
  toggleSubject,
  saveSubjects,
} = useGroupsAdmin()

const columns = [
  { key: 'name', label: 'Название' },
  { key: 'course', label: 'Курс' },
  { key: 'faculty', label: 'Факультет' },
  { key: 'studentCount', label: 'Студентов' },
  { key: 'actions', label: 'Действия' },
]

onMounted(async () => {
  await Promise.all([searchItems(), loadLookups()])
})
</script>

<style scoped>
.section-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-5);
  gap: var(--spacing-4);
}

.actions {
  display: flex;
  gap: var(--spacing-2);
}

.subjects-hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.subjects-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-height: 420px;
  overflow-y: auto;
  padding-right: var(--spacing-1);
}

.subject-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.subject-item:hover {
  background: var(--color-bg-hover);
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.subject-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.subject-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
</style>

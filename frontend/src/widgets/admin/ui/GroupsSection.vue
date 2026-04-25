<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        placeholder="Поиск по группе..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить группу</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка групп..." />
    <EmptyState v-else-if="groups.length === 0" message="Группы не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Курс</th>
            <th>Факультет</th>
            <th>Студентов</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group.id">
            <td>{{ group.name }}</td>
            <td>{{ group.course }}</td>
            <td>{{ group.faculty?.name || '-' }}</td>
            <td>{{ group.studentCount ?? '-' }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="secondary" @click="openSubjectsModal(group)">Дисциплины</Button>
                <Button size="sm" variant="primary" @click="openModal(group)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(group.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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

onMounted(async () => {
  await Promise.all([searchItems(), loadLookups()])
})
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-5);
  gap: var(--spacing-4);
}

.table-wrapper {
  overflow-x: auto;
  background: var(--color-bg-section);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--color-bg-page);
}

.data-table th,
.data-table td {
  padding: var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

.data-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.data-table td {
  color: var(--color-text-secondary);
}

.data-table tbody tr:hover {
  background: var(--color-bg-hover);
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

<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        placeholder="Поиск по названию..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить дисциплину</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка дисциплин..." />
    <EmptyState v-else-if="subjects.length === 0" message="Дисциплины не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Кредиты</th>
            <th>Семестр</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>{{ subject.name }}</td>
            <td>{{ subject.code }}</td>
            <td>{{ subject.credits }}</td>
            <td>{{ subject.semester }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="primary" @click="openModal(subject)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(subject.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="lg" @close="closeModal">
    <ModalHeader
      :title="editingItem ? 'Редактировать дисциплину' : 'Добавить дисциплину'"
      @close="closeModal"
    />
    <Form @submit.prevent="save">
      <FormRow>
        <FormField label="Название" required>
          <Input v-model="form.name" required />
        </FormField>
        <FormField label="Код" required>
          <Input v-model="form.code" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Кредиты" required>
          <NumberInput v-model="form.credits" :min="1" :max="10" required />
        </FormField>
        <FormField label="Семестр" required>
          <NumberInput v-model="form.semester" :min="1" :max="12" required />
        </FormField>
      </FormRow>
      <FormField label="Описание">
        <Input v-model="form.description" />
      </FormField>
      <FormField label="Преподаватель">
        <Select
          v-model="form.teacherId"
          :options="allTeachers.map(t => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))"
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
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSubjectsAdmin } from '~/features/subjects/model/useSubjectsAdmin'
import {
  Section,
  SearchInput,
  Select,
  Button,
  LoadingState,
  EmptyState,
  Modal,
  ModalHeader,
  ModalActions,
  Form,
  FormField,
  FormRow,
  Input,
  NumberInput,
} from '~/shared/ui'

const {
  subjects,
  loading,
  search,
  allTeachers,
  showModal,
  editingItem,
  form,
  searchItems,
  loadLookups,
  openModal,
  closeModal,
  save,
  deleteItem,
} = useSubjectsAdmin()

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
</style>

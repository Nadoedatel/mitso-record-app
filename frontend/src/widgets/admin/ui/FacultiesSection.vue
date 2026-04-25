<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        placeholder="Поиск по факультету..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить факультет</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка факультетов..." />
    <EmptyState v-else-if="faculties.length === 0" message="Факультеты не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Специализаций</th>
            <th>Групп</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="faculty in faculties" :key="faculty.id">
            <td>{{ faculty.name }}</td>
            <td>{{ faculty._count?.specializations ?? '-' }}</td>
            <td>{{ faculty._count?.groups ?? '-' }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="primary" @click="openModal(faculty)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(faculty.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="sm" :title="editingItem ? 'Редактировать факультет' : 'Добавить факультет'" @close="closeModal">
    <Form @submit.prevent="save">
      <FormField label="Название" required>
        <Input v-model="form.name" required />
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
import { useFacultiesAdmin } from '~/features/faculties/model/useFacultiesAdmin'
import {
  Section,
  SearchInput,
  Button,
  LoadingState,
  EmptyState,
  Modal,
  ModalActions,
  Form,
  FormField,
  Input,
} from '~/shared/ui'

const {
  faculties,
  loading,
  search,
  showModal,
  editingItem,
  form,
  searchItems,
  openModal,
  closeModal,
  save,
  deleteItem,
} = useFacultiesAdmin()

onMounted(() => searchItems())
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

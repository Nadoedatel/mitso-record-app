<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        placeholder="Поиск по специализации..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить специализацию</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка специализаций..." />
    <EmptyState v-else-if="specializations.length === 0" message="Специализации не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Факультет</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="spec in specializations" :key="spec.id">
            <td>{{ spec.name }}</td>
            <td>{{ spec.code || '-' }}</td>
            <td>{{ spec.faculty?.name || '-' }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="primary" @click="openModal(spec)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(spec.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="md" :title="editingItem ? 'Редактировать специализацию' : 'Добавить специализацию'" @close="closeModal">
    <Form @submit.prevent="save">
      <FormRow>
        <FormField label="Название" required>
          <Input v-model="form.name" required />
        </FormField>
        <FormField label="Код">
          <Input v-model="form.code" />
        </FormField>
      </FormRow>
      <FormField label="Факультет" required>
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
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSpecializationsAdmin } from '~/features/specializations/model/useSpecializationsAdmin'
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
} from '~/shared/ui'

const {
  specializations,
  loading,
  search,
  faculties,
  showModal,
  editingItem,
  form,
  searchItems,
  loadLookups,
  openModal,
  closeModal,
  save,
  deleteItem,
} = useSpecializationsAdmin()

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

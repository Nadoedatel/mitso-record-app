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
                <Button size="sm" variant="primary" @click="openModal(group)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(group.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="md" @close="closeModal">
    <ModalHeader
      :title="editingItem ? 'Редактировать группу' : 'Добавить группу'"
      @close="closeModal"
    />
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
  ModalHeader,
  ModalActions,
  Form,
  FormField,
  FormRow,
  Input,
  NumberInput,
} from '~/shared/ui'

const {
  groups,
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
</style>

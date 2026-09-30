<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        :debounce="300"
        placeholder="Поиск по специализации..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить специализацию</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка специализаций..." />
    <EmptyState v-else-if="specializations.length === 0" message="Специализации не найдены" />
    <Table v-else :columns="columns" :data="specializations" row-key="id" :hoverable="false">
      <template #cell-code="{ row }">{{ row.code || '-' }}</template>
      <template #cell-faculty="{ row }">{{ row.faculty?.name || '-' }}</template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <Button size="sm" variant="primary" @click="openModal(row)">Редактировать</Button>
          <Button size="sm" variant="danger" @click="deleteItem(row.id)">Удалить</Button>
        </div>
      </template>
    </Table>
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

const columns = [
  { key: 'name', label: 'Название' },
  { key: 'code', label: 'Код' },
  { key: 'faculty', label: 'Факультет' },
  { key: 'actions', label: 'Действия' },
]

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

.actions {
  display: flex;
  gap: var(--spacing-2);
}
</style>

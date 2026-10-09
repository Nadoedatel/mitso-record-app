<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        :debounce="300"
        placeholder="Поиск по факультету..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить факультет</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка факультетов..." />
    <EmptyState v-else-if="faculties.length === 0" message="Факультеты не найдены" />
    <Table v-else :columns="columns" :data="faculties" row-key="id" :hoverable="false">
      <template #cell-specializations="{ row }">{{ row._count?.specializations ?? '-' }}</template>
      <template #cell-groups="{ row }">{{ row._count?.groups ?? '-' }}</template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <Button size="sm" variant="primary" @click="openModal(row)">Редактировать</Button>
          <Button size="sm" variant="danger" @click="deleteItem(row.id)">Удалить</Button>
        </div>
      </template>
    </Table>
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
  Table,
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

const columns = [
  { key: 'name', label: 'Название' },
  { key: 'specializations', label: 'Специализаций' },
  { key: 'groups', label: 'Групп' },
  { key: 'actions', label: 'Действия' },
]

onMounted(() => searchItems())
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
</style>

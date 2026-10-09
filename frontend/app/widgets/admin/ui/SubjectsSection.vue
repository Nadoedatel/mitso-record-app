<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        :debounce="300"
        placeholder="Поиск по названию..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить дисциплину</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка дисциплин..." />
    <EmptyState v-else-if="subjects.length === 0" message="Дисциплины не найдены" />
    <Table v-else :columns="columns" :data="subjects" row-key="id" :hoverable="false">
      <template #cell-actions="{ row }">
        <div class="actions">
          <Button size="sm" variant="primary" @click="openModal(row)">Редактировать</Button>
          <Button size="sm" variant="danger" @click="deleteItem(row.id)">Удалить</Button>
        </div>
      </template>
    </Table>

    <Pagination
      v-if="totalPages > 1"
      class="section-pagination"
      :current-page="page"
      :total-pages="totalPages"
      @change="changePage"
    />
  </Section>

  <Modal v-model="showModal" size="lg" :title="editingItem ? 'Редактировать дисциплину' : 'Добавить дисциплину'" @close="closeModal">
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
  Table,
  Pagination,
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
} from '~/shared/ui'

const {
  subjects,
  loading,
  search,
  page,
  totalPages,
  changePage,
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

const columns = [
  { key: 'name', label: 'Название' },
  { key: 'code', label: 'Код' },
  { key: 'credits', label: 'Кредиты' },
  { key: 'semester', label: 'Семестр' },
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

.section-pagination {
  margin-top: var(--spacing-5);
}
</style>

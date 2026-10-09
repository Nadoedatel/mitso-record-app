<template>
  <Section>
    <div class="section-header">
      <div class="search-filters">
        <SearchInput
          v-model="search"
        :debounce="300"
          placeholder="Поиск по имени..."
          full-width
          @update:modelValue="searchItems"
        />
        <Select
          v-model="groupFilter"
          placeholder="Все группы"
          :options="[
            { value: '', label: 'Все группы' },
            ...groups.map(g => ({ value: String(g.id), label: g.name }))
          ]"
          full-width
          @update:modelValue="searchItems"
        />
      </div>
      <Button variant="success" @click="openModal()">+ Добавить студента</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка студентов..." />
    <EmptyState v-else-if="students.length === 0" message="Студенты не найдены" />
    <Table v-else :columns="columns" :data="students" row-key="id" :hoverable="false">
      <template #cell-name="{ row }">{{ row.lastName }} {{ row.firstName }} {{ row.middleName }}</template>
      <template #cell-group="{ row }">{{ row.group?.name || '-' }}</template>
      <template #cell-email="{ row }">{{ row.user?.email || '-' }}</template>
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

  <Modal v-model="showModal" size="lg" :title="editingItem ? 'Редактировать студента' : 'Добавить студента'" @close="closeModal">
    <Form @submit.prevent="save">
      <FormRow>
        <FormField label="Фамилия" required>
          <Input v-model="form.lastName" required />
        </FormField>
        <FormField label="Имя" required>
          <Input v-model="form.firstName" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Отчество">
          <Input v-model="form.middleName" />
        </FormField>
        <FormField label="Email" required>
          <Input v-model="form.email" type="email" required />
        </FormField>
      </FormRow>
      <FormRow v-if="!editingItem">
        <FormField label="Пароль" required>
          <Input v-model="form.password" type="password" :minlength="8" placeholder="Минимум 8 символов" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Группа">
          <Select
            v-model="form.groupId"
            :options="groups.map(g => ({ value: g.id, label: g.name }))"
            placeholder="Не выбрана"
          />
        </FormField>
        <FormField label="Курс" required>
          <NumberInput v-model="form.course" :min="1" :max="6" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Специализация">
          <Select
            v-model="form.specializationId"
            :options="specializations.map(s => ({ value: s.id, label: s.name }))"
            placeholder="Не выбрана"
          />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Номер зачётки" required>
          <Input v-model="form.studentId" required />
        </FormField>
        <FormField label="Год поступления" required>
          <NumberInput v-model="form.enrollmentYear" :min="2000" :max="2030" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Телефон">
          <Input v-model="form.phone" type="tel" />
        </FormField>
        <FormField label="Дата рождения">
          <Input v-model="form.birthDate" type="date" />
        </FormField>
      </FormRow>
      <FormField label="Адрес">
        <Input v-model="form.address" />
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
import { useStudentsAdmin } from '~/features/students/model/useStudentsAdmin'
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
  students,
  loading,
  search,
  page,
  totalPages,
  changePage,
  groupFilter,
  groups,
  specializations,
  showModal,
  editingItem,
  form,
  searchItems,
  loadLookups,
  openModal,
  closeModal,
  save,
  deleteItem,
} = useStudentsAdmin()

const columns = [
  { key: 'name', label: 'ФИО' },
  { key: 'group', label: 'Группа' },
  { key: 'email', label: 'Email' },
  { key: 'studentId', label: 'Зачётная книжка' },
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

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  flex: 1 1 280px;
  max-width: 600px;
}

.actions {
  display: flex;
  gap: var(--spacing-2);
}

.section-pagination {
  margin-top: var(--spacing-5);
}
</style>

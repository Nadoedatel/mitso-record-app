<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        placeholder="Поиск по имени..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить преподавателя</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка преподавателей..." />
    <EmptyState v-else-if="teachers.length === 0" message="Преподаватели не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Кафедра</th>
            <th>Должность</th>
            <th>Email</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in teachers" :key="teacher.id">
            <td>{{ teacher.lastName }} {{ teacher.firstName }} {{ teacher.middleName }}</td>
            <td>{{ teacher.department }}</td>
            <td>{{ teacher.position }}</td>
            <td>{{ teacher.user?.email || '-' }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="primary" @click="openModal(teacher)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(teacher.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="lg" @close="closeModal">
    <ModalHeader
      :title="editingItem ? 'Редактировать преподавателя' : 'Добавить преподавателя'"
      @close="closeModal"
    />
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
          <Input v-model="form.password" type="password" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Кафедра" required>
          <Input v-model="form.department" required />
        </FormField>
        <FormField label="Должность" required>
          <Input v-model="form.position" required />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField label="Учёная степень">
          <Input v-model="form.academicDegree" />
        </FormField>
        <FormField label="Телефон">
          <Input v-model="form.phone" type="tel" />
        </FormField>
      </FormRow>
      <FormField label="Номер кабинета">
        <Input v-model="form.officeNumber" />
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
import { useTeachersAdmin } from '~/features/teachers/model/useTeachersAdmin'
import {
  Section,
  SearchInput,
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
} from '~/shared/ui'

const {
  teachers,
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
} = useTeachersAdmin()

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

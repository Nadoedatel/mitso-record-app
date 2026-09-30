<template>
  <Section>
    <div class="section-header">
      <SearchInput
        v-model="search"
        :debounce="300"
        placeholder="Поиск по имени..."
        @update:modelValue="searchItems"
      />
      <Button variant="success" @click="openModal()">+ Добавить преподавателя</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка преподавателей..." />
    <EmptyState v-else-if="teachers.length === 0" message="Преподаватели не найдены" />
    <Table v-else :columns="columns" :data="teachers" row-key="id" :hoverable="false">
      <template #cell-name="{ row }">{{ row.lastName }} {{ row.firstName }} {{ row.middleName }}</template>
      <template #cell-email="{ row }">{{ row.user?.email || '-' }}</template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <Button size="sm" variant="primary" @click="openModal(row)">Редактировать</Button>
          <Button size="sm" variant="secondary" @click="openSubjectsModal(row)">Предметы</Button>
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

  <Modal v-model="showSubjectsModal" size="md" :title="`Предметы: ${managingTeacher?.lastName} ${managingTeacher?.firstName}`" @close="closeSubjectsModal">
    <LoadingState v-if="subjectsLoading" message="Загрузка предметов..." />
    <div v-else class="subjects-list">
      <EmptyState v-if="allSubjects.length === 0" message="Предметы не найдены" />
      <div v-else>
        <Checkbox
          v-for="subject in allSubjects"
          :key="subject.id"
          :modelValue="selectedSubjectIds.has(subject.id)"
          :label="`${subject.name} (${subject.code}, сем. ${subject.semester})`"
          :id="`subject-${subject.id}`"
          class="subject-checkbox"
          @update:modelValue="toggleSubject(subject.id)"
        />
      </div>
    </div>
    <ModalActions>
      <Button variant="secondary" @click="closeSubjectsModal">Отмена</Button>
      <Button variant="primary" :disabled="subjectsLoading" @click="saveSubjects">Сохранить</Button>
    </ModalActions>
  </Modal>

  <Modal v-model="showModal" size="lg" :title="editingItem ? 'Редактировать преподавателя' : 'Добавить преподавателя'" @close="closeModal">
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
  Table,
  Pagination,
  SearchInput,
  Button,
  LoadingState,
  EmptyState,
  Modal,
  ModalActions,
  Form,
  FormField,
  FormRow,
  Input,
  Checkbox,
} from '~/shared/ui'

const {
  teachers,
  loading,
  search,
  page,
  totalPages,
  changePage,
  showModal,
  editingItem,
  form,
  searchItems,
  openModal,
  closeModal,
  save,
  deleteItem,
  showSubjectsModal,
  subjectsLoading,
  managingTeacher,
  allSubjects,
  selectedSubjectIds,
  openSubjectsModal,
  closeSubjectsModal,
  toggleSubject,
  saveSubjects,
} = useTeachersAdmin()

const columns = [
  { key: 'name', label: 'ФИО' },
  { key: 'department', label: 'Кафедра' },
  { key: 'position', label: 'Должность' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Действия' },
]

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

.actions {
  display: flex;
  gap: var(--spacing-2);
}

.subjects-list {
  padding: var(--spacing-4) 0;
  max-height: 400px;
  overflow-y: auto;
}

.subject-checkbox {
  display: flex;
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.section-pagination {
  margin-top: var(--spacing-5);
}
</style>

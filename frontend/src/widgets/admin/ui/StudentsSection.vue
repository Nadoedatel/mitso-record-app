<template>
  <Section>
    <div class="section-header">
      <div class="search-filters">
        <SearchInput
          v-model="search"
          placeholder="Поиск по имени..."
          @update:modelValue="searchItems"
        />
        <Select
          v-model="groupFilter"
          placeholder="Все группы"
          :options="[
            { value: '', label: 'Все группы' },
            ...groups.map(g => ({ value: g.name, label: g.name }))
          ]"
          @update:modelValue="searchItems"
        />
      </div>
      <Button variant="success" @click="openModal()">+ Добавить студента</Button>
    </div>

    <LoadingState v-if="loading" message="Загрузка студентов..." />
    <EmptyState v-else-if="students.length === 0" message="Студенты не найдены" />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Группа</th>
            <th>Email</th>
            <th>Зачётная книжка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</td>
            <td>{{ student.group?.name || '-' }}</td>
            <td>{{ student.user?.email || '-' }}</td>
            <td>{{ student.studentId }}</td>
            <td>
              <div class="actions">
                <Button size="sm" variant="primary" @click="openModal(student)">Редактировать</Button>
                <Button size="sm" variant="danger" @click="deleteItem(student.id)">Удалить</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>

  <Modal v-model="showModal" size="lg" @close="closeModal">
    <ModalHeader
      :title="editingItem ? 'Редактировать студента' : 'Добавить студента'"
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
  students,
  loading,
  search,
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

.search-filters {
  display: flex;
  gap: var(--spacing-3);
  flex: 1;
  max-width: 600px;
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

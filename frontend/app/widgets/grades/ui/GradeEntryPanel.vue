<template>
  <div class="grade-entry">
    <Form>
      <FormRow>
        <FormField label="Тип оценки" required>
          <Select v-model="gradeType" :options="GRADE_TYPE_OPTIONS" />
        </FormField>
        <FormField label="Дата" required>
          <Input v-model="examDate" type="date" />
        </FormField>
      </FormRow>
    </Form>

    <LoadingState v-if="loading" message="Загрузка студентов..." />

    <Alert v-else-if="loadError" variant="error" :title="loadError" />

    <EmptyState v-else-if="students.length === 0" message="В группе нет студентов" />

    <template v-else>
      <Table :columns="columns" :data="students" row-key="id" :hoverable="false">
        <template #cell-name="{ row }">
          {{ row.lastName }} {{ row.firstName }} {{ row.middleName || '' }}
        </template>

        <template #cell-grades="{ row }">
          <div v-if="row.grades && row.grades.length > 0" class="existing-grades">
            <div
              v-for="grade in row.grades"
              :key="grade.id"
              class="grade-item"
              :title="formatDate(grade.examDate, 'Н/Д')"
            >
              <GradeTypeBadge :type="grade.gradeType" size="sm" />
              <GradeValueBadge :value="grade.gradeValue" :type="grade.gradeType" size="sm" />
            </div>
          </div>
          <span v-else class="no-grades">Нет оценок</span>
        </template>

        <template #cell-input="{ row }">
          <Select
            v-if="passFail"
            v-model="inputs[row.id]"
            :options="PASS_FAIL_OPTIONS"
            placeholder="—"
            size="sm"
          />
          <NumberInput
            v-else
            v-model="inputs[row.id]"
            :min="GRADE_MIN"
            :max="GRADE_MAX"
            :placeholder="`${GRADE_MIN}-${GRADE_MAX}`"
            size="sm"
          />
        </template>
      </Table>

      <div class="actions">
        <Button
          variant="success"
          :disabled="filledCount === 0 || saving"
          :loading="saving"
          @click="save"
        >
          Сохранить оценки{{ filledCount ? ` (${filledCount})` : '' }}
        </Button>
        <Button variant="secondary" :disabled="saving || filledCount === 0" @click="clearInputs">
          Очистить
        </Button>
      </div>
    </template>

    <Alert v-if="saveError" variant="error" :title="saveError" closable @close="saveError = ''" />
    <Alert v-if="saveSuccess" variant="success" :title="saveSuccess" closable @close="saveSuccess = ''" />
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useGradeEntry } from '~/features/grades/model/useGradeEntry'
import { GRADE_TYPE_OPTIONS, PASS_FAIL_OPTIONS, GRADE_MIN, GRADE_MAX } from '~/entities/grade'
import { formatDate } from '~/shared/lib/formatDate'
import {
  Form,
  FormRow,
  FormField,
  Select,
  Input,
  NumberInput,
  Table,
  Button,
  Alert,
  LoadingState,
  EmptyState,
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'

/**
 * GradeEntryPanel - batch grade entry for a subject and a group.
 * Grades: 1-10; for CREDIT (зачёт) the value is chosen as "Зачёт" / "Не зачёт".
 */
const props = defineProps<{
  subjectId: number | null
  groupId: number | null
}>()

const {
  students,
  inputs,
  gradeType,
  examDate,
  passFail,
  loading,
  saving,
  loadError,
  saveError,
  saveSuccess,
  filledCount,
  save,
  clearInputs,
} = useGradeEntry(toRef(props, 'subjectId'), toRef(props, 'groupId'))

const columns = [
  { key: 'name', label: 'ФИО' },
  { key: 'studentId', label: 'Зачётка' },
  { key: 'grades', label: 'Текущие оценки' },
  { key: 'input', label: 'Новая оценка', width: '10rem' },
]
</script>

<style scoped>
.grade-entry {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.existing-grades {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.grade-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.no-grades {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  font-style: italic;
}

.actions {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

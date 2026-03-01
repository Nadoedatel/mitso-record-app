<template>
  <div class="grades-management-page">
    <Container maxWidth="xl">
      <div class="header-wrapper">
        <Button variant="ghost" @click="$router.push('/teacher')">
          ← Назад к предметам
        </Button>
        <Header v-if="subject" :title="subject.name">
          <template #actions>
            <p class="subtitle">Управление оценками • Семестр {{ subject.semester }}</p>
          </template>
        </Header>
      </div>

      <LoadingState v-if="loading" message="Загрузка данных..." />

      <Alert v-else-if="error" variant="error" :title="error" />

      <div v-else class="content">
        <!-- Step 1: Groups List View -->
        <div v-if="!selectedGroup" class="groups-view">
          <SearchInput
            v-model="searchQuery"
            placeholder="Поиск по группе или студенту..."
          />

          <EmptyState v-if="filteredGroups.length === 0" message="Группы не найдены" />

          <div v-else class="groups-list">
            <Card
              v-for="group in filteredGroups"
              :key="group.id"
              hoverable
              clickable
              class="group-card"
              @click="selectGroup(group)"
            >
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p class="group-details">
                  Курс {{ group.course }} • {{ group.studentCount }} студентов
                </p>
                <p v-if="group.faculty" class="group-faculty">
                  {{ group.faculty.name }}
                </p>
              </div>
              <div class="group-arrow">→</div>
            </Card>
          </div>
        </div>

        <!-- Step 2: Students List View with Batch Grade Entry -->
        <Section v-if="selectedGroup">
          <div class="students-header">
            <Button variant="secondary" @click="backToGroups">← Назад к группам</Button>
            <h2 class="group-title">{{ selectedGroup.name }}</h2>
          </div>

          <!-- Grade Type and Date Selector -->
          <Form>
            <FormRow>
              <FormField label="Тип оценки" required>
                <Select
                  v-model="batchGradeType"
                  :options="[
                    { value: 'EXAM', label: 'Экзамен' },
                    { value: 'CREDIT', label: 'Зачёт' },
                    { value: 'COURSEWORK', label: 'Курсовая' },
                    { value: 'LAB', label: 'Лабораторная' },
                    { value: 'TEST', label: 'Тест' }
                  ]"
                />
              </FormField>
              <FormField label="Дата" required>
                <Input v-model="batchExamDate" type="date" />
              </FormField>
            </FormRow>
          </Form>

          <LoadingState v-if="loadingStudents" message="Загрузка студентов..." />

          <EmptyState v-else-if="students.length === 0" message="В группе нет студентов" />

          <div v-else class="students-table-container">
            <table class="students-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>ФИО</th>
                  <th>Зачётка</th>
                  <th>Текущие оценки</th>
                  <th>Новая оценка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, index) in students" :key="student.id">
                  <td>{{ index + 1 }}</td>
                  <td class="student-name">
                    {{ student.lastName }} {{ student.firstName }} {{ student.middleName || '' }}
                  </td>
                  <td>{{ student.studentId }}</td>
                  <td>
                    <div class="existing-grades">
                      <template v-if="student.grades && student.grades.length > 0">
                        <div
                          v-for="grade in student.grades"
                          :key="grade.id"
                          class="grade-item"
                          :title="`${formatDate(grade.examDate)}`"
                        >
                          <GradeTypeBadge :type="grade.gradeType" size="sm" />
                          <GradeValueBadge :value="grade.gradeValue" size="sm" />
                        </div>
                      </template>
                      <span v-else class="no-grades">Нет оценок</span>
                    </div>
                  </td>
                  <td>
                    <NumberInput
                      v-model="gradeInputs[student.id]"
                      :min="0"
                      :max="100"
                      placeholder="0-100"
                      size="sm"
                    />
                  </td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      @click="saveGradeForStudent(student)"
                      :disabled="!gradeInputs[student.id] || saving"
                      :loading="saving"
                    >
                      ✓
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="batch-actions">
            <Button
              variant="success"
              size="lg"
              @click="saveAllGrades"
              :disabled="!hasAnyGrades || saving"
              :loading="saving"
            >
              Сохранить все оценки
            </Button>
          </div>

          <Alert v-if="saveError" variant="error" :title="saveError" closable @close="saveError = ''" />
          <Alert v-if="saveSuccess" variant="success" :title="saveSuccess" closable @close="saveSuccess = ''" />
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { gradesApi, type CreateGradeDto } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'
import {
  Container,
  Header,
  Button,
  Section,
  SearchInput,
  Card,
  Form,
  FormField,
  FormRow,
  Input,
  NumberInput,
  Select,
  Alert,
  LoadingState,
  EmptyState,
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'

const route = useRoute()
const subjectId = computed(() => parseInt(route.params.id as string))

const subject = ref<Subject | null>(null)
const groups = ref<Group[]>([])
const students = ref<Student[]>([])
const selectedGroup = ref<Group | null>(null)

const loading = ref(true)
const loadingStudents = ref(false)
const error = ref('')
const searchQuery = ref('')

// Batch controls
const batchGradeType = ref<'EXAM' | 'CREDIT' | 'COURSEWORK' | 'LAB' | 'TEST'>('EXAM')
const batchExamDate = ref(new Date().toISOString().split('T')[0])

// Grade inputs for each student
const gradeInputs = ref<Record<number, number>>({})

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

// Filtered groups based on search query
const filteredGroups = computed(() => {
  if (!groups.value || groups.value.length === 0) return []
  if (!searchQuery.value) return groups.value

  const query = searchQuery.value.toLowerCase()

  // Search by group name
  return groups.value.filter(g => g.name.toLowerCase().includes(query))
})

// Check if there are any grade inputs
const hasAnyGrades = computed(() => {
  return Object.values(gradeInputs.value).some(val => val > 0)
})

const formatDate = (date?: string) => {
  if (!date) return 'Н/Д'
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const selectGroup = async (group: Group) => {
  selectedGroup.value = group
  loadingStudents.value = true
  saveError.value = ''
  saveSuccess.value = ''
  gradeInputs.value = {}

  try {
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(group.id, subjectId.value)
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки студентов'
  } finally {
    loadingStudents.value = false
  }
}

const backToGroups = () => {
  selectedGroup.value = null
  students.value = []
  gradeInputs.value = {}
  saveError.value = ''
  saveSuccess.value = ''
}

const saveGradeForStudent = async (student: Student) => {
  const gradeValue = gradeInputs.value[student.id]
  if (!gradeValue) return

  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    const gradeDto: CreateGradeDto = {
      studentId: student.id,
      subjectId: subjectId.value,
      gradeValue,
      gradeType: batchGradeType.value,
      examDate: batchExamDate.value,
    }

    await gradesApi.createGrade(gradeDto)

    // Reload students to get updated grades
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(selectedGroup.value!.id, subjectId.value)

    // Clear the input for this student
    delete gradeInputs.value[student.id]

    saveSuccess.value = `Оценка для ${student.lastName} ${student.firstName} сохранена`
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка сохранения оценки'
  } finally {
    saving.value = false
  }
}

const saveAllGrades = async () => {
  const gradesToSave: CreateGradeDto[] = []

  // Collect all non-empty grade inputs
  for (const [studentId, gradeValue] of Object.entries(gradeInputs.value)) {
    if (gradeValue > 0) {
      gradesToSave.push({
        studentId: parseInt(studentId),
        subjectId: subjectId.value,
        gradeValue,
        gradeType: batchGradeType.value,
        examDate: batchExamDate.value,
      })
    }
  }

  if (gradesToSave.length === 0) {
    saveError.value = 'Нет оценок для сохранения'
    return
  }

  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    await gradesApi.createBatchGrades(gradesToSave)

    // Reload students to get updated grades
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(selectedGroup.value!.id, subjectId.value)

    // Clear all inputs
    gradeInputs.value = {}

    saveSuccess.value = `Успешно сохранено ${gradesToSave.length} оценок`
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка сохранения оценок'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [subjectData, groupsData] = await Promise.all([
      subjectsApi.fetchSubjectById(subjectId.value),
      gradesApi.fetchGroupsBySubject(subjectId.value),
    ])

    subject.value = subjectData
    groups.value = groupsData
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.grades-management-page {
  min-height: 100vh;
  background: var(--color-background);
  padding: var(--spacing-5);
}

.header-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* Groups List View */
.groups-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.group-card {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-info h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.group-details {
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0;
  font-size: var(--font-size-sm);
}

.group-faculty {
  color: var(--color-text-tertiary);
  margin: var(--spacing-1) 0;
  font-size: var(--font-size-xs);
}

.group-arrow {
  font-size: var(--font-size-2xl);
  color: var(--color-border);
  font-weight: var(--font-weight-bold);
}

/* Students View */
.students-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-5);
}

.group-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

/* Students Table */
.students-table-container {
  overflow-x: auto;
  margin: var(--spacing-5) 0;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th,
.students-table td {
  padding: var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.students-table th {
  background: var(--color-surface-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.students-table td {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.student-name {
  font-weight: var(--font-weight-medium);
}

.existing-grades {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}

.grade-item {
  display: flex;
  gap: var(--spacing-1);
  align-items: center;
}

.no-grades {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  font-style: italic;
}

.batch-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-5);
}
</style>

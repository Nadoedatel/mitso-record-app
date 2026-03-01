<template>
  <div class="teacher-page">
    <Container maxWidth="xl">
      <Header
        v-if="authStore.user?.teacher"
        :title="`${authStore.user.teacher.lastName} ${authStore.user.teacher.firstName}`"
      >
        <template #actions>
          <p v-if="authStore.user?.teacher" class="subtitle">
            {{ authStore.user.teacher.position }} • {{ authStore.user.teacher.department }}
          </p>
          <Button variant="danger" @click="logout">Выйти</Button>
        </template>
      </Header>

      <LoadingState v-if="loading" message="Загрузка данных преподавателя..." />

      <Alert v-else-if="error" variant="error" :title="error" closable @close="error = ''" />

      <div v-else class="content">
        <!-- Teacher Info Card -->
        <InfoCard
          v-if="authStore.user?.teacher"
          title="Информация о преподавателе"
          :items="teacherInfoItems"
        />

        <!-- Subjects Section -->
        <Section title="Мои предметы">
          <EmptyState
            v-if="subjects.length === 0"
            message="У вас пока нет назначенных предметов"
          />

          <div v-else class="subjects-grid">
            <Card
              v-for="subject in subjects"
              :key="subject.id"
              variant="bordered"
              hoverable
              padding="md"
            >
              <div class="subject-header">
                <h3>{{ subject.name }}</h3>
                <Badge variant="secondary" size="sm">{{ subject.code }}</Badge>
              </div>
              <div class="subject-details">
                <div class="detail-item">
                  <span class="icon">📚</span>
                  <span>{{ subject.credits }} кредитов</span>
                </div>
                <div class="detail-item">
                  <span class="icon">📅</span>
                  <span>Семестр {{ subject.semester }}</span>
                </div>
              </div>
              <p v-if="subject.description" class="subject-description">
                {{ subject.description }}
              </p>
              <Button
                variant="primary"
                fullWidth
                @click="viewSubjectDetails(subject)"
              >
                Управление оценками
              </Button>
            </Card>
          </div>
        </Section>

        <!-- Grade Assignment Section -->
        <Section title="Выставление оценок">
          <!-- Subject Selection -->
          <FormField label="Выберите предмет" html-for="subject-select">
            <Select
              id="subject-select"
              v-model="selectedSubjectId"
              :options="subjectOptions"
              placeholder="-- Выберите предмет --"
              fullWidth
              @change="onSubjectChange"
            />
          </FormField>

          <!-- Group Selection -->
          <FormField
            v-if="selectedSubjectId && groups.length > 0"
            label="Выберите группу"
            html-for="group-select"
          >
            <Select
              id="group-select"
              v-model="selectedGroup"
              :options="groupOptions"
              placeholder="-- Выберите группу --"
              fullWidth
              @change="onGroupChange"
            />
          </FormField>

          <!-- Loading indicator for groups -->
          <LoadingState
            v-if="selectedSubjectId && groupsLoading"
            message="Загрузка групп..."
            size="sm"
          />

          <!-- Students Table -->
          <div v-if="selectedGroup && students.length > 0">
            <h3 class="table-title">
              Студенты группы {{ groups.find(g => g.id === selectedGroup)?.name || selectedGroup }}
            </h3>

            <LoadingState
              v-if="studentsLoading"
              message="Загрузка студентов..."
              size="sm"
            />

            <div v-else class="grades-table">
              <table>
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Номер зачётки</th>
                    <th>Текущие оценки</th>
                    <th>Тип оценки</th>
                    <th>Оценка (1-10)</th>
                    <th>Дата</th>
                    <th>Примечания</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.id">
                    <td>
                      {{ student.lastName }} {{ student.firstName }}
                      {{ student.middleName }}
                    </td>
                    <td>{{ student.studentId }}</td>
                    <td>
                      <div v-if="student.grades && student.grades.length > 0" class="current-grades">
                        <GradeValueBadge
                          v-for="grade in student.grades"
                          :key="grade.id"
                          :value="grade.gradeValue"
                          size="sm"
                        />
                      </div>
                      <span v-else class="no-grades">Нет оценок</span>
                    </td>
                    <td>
                      <Select
                        v-model="gradesForm[student.id].gradeType"
                        :options="gradeTypeOptions"
                        placeholder="-- Выберите --"
                        size="sm"
                        fullWidth
                      />
                    </td>
                    <td>
                      <NumberInput
                        v-model="gradesForm[student.id].gradeValue"
                        :min="1"
                        :max="10"
                        placeholder="1-10"
                        size="sm"
                      />
                    </td>
                    <td>
                      <Input
                        v-model="gradesForm[student.id].examDate"
                        type="date"
                        size="sm"
                      />
                    </td>
                    <td>
                      <Input
                        v-model="gradesForm[student.id].notes"
                        type="text"
                        placeholder="Примечания"
                        size="sm"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Save Buttons -->
            <div class="actions">
              <Button
                variant="success"
                :disabled="isSaving || !hasValidGrades"
                :loading="isSaving"
                @click="saveBatchGrades"
              >
                {{ isSaving ? 'Сохранение...' : 'Сохранить оценки' }}
              </Button>
              <Button
                variant="danger"
                :disabled="isSaving"
                @click="clearGradesForm"
              >
                Очистить форму
              </Button>
            </div>

            <!-- Success/Error Messages -->
            <Alert
              v-if="saveSuccess"
              variant="success"
              title="Оценки успешно сохранены!"
              closable
              @close="saveSuccess = false"
            />
            <Alert
              v-if="saveError"
              variant="error"
              :title="saveError"
              closable
              @close="saveError = ''"
            />
          </div>

          <!-- Empty state when no students -->
          <EmptyState
            v-else-if="selectedGroup && !studentsLoading && students.length === 0"
            message="В выбранной группе нет студентов"
          />
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { gradesApi, type GradeBatchDto } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'
import { GradeType } from '~/entities/grade'

// UI Components
import {
  Container,
  Header,
  Button,
  LoadingState,
  Alert,
  InfoCard,
  Section,
  EmptyState,
  Card,
  Badge,
  FormField,
  Select,
  Input,
  NumberInput,
  GradeValueBadge,
} from '~/shared/ui'

const authStore = useAuthStore()
const router = useRouter()

// Existing state
const subjects = ref<Subject[]>([])
const loading = ref(false)
const error = ref('')

// Grade assignment state
const selectedSubjectId = ref<number | null>(null)
const selectedGroup = ref<number | null>(null)
const groups = ref<Group[]>([])
const students = ref<Student[]>([])
const groupsLoading = ref(false)
const studentsLoading = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// Form for grades - structure: { [studentId]: { gradeType, gradeValue, examDate, notes } }
const gradesForm = ref<Record<number, {
  gradeType: GradeType | ''
  gradeValue: number | null
  examDate: string
  notes: string
}>>({})

// Computed property to check if there are valid grades to save
const hasValidGrades = computed(() => {
  return Object.entries(gradesForm.value).some(([_, grade]) => {
    return grade.gradeType && grade.gradeValue && grade.gradeValue >= 1 && grade.gradeValue <= 10
  })
})

// Computed: Teacher info items for InfoCard
const teacherInfoItems = computed(() => {
  if (!authStore.user?.teacher) return []

  const teacher = authStore.user.teacher
  const items = [
    {
      label: 'ФИО',
      value: `${teacher.lastName} ${teacher.firstName} ${teacher.middleName}`,
    },
    { label: 'Кафедра', value: teacher.department },
    { label: 'Должность', value: teacher.position },
  ]

  if (teacher.academicDegree) {
    items.push({ label: 'Учёная степень', value: teacher.academicDegree })
  }
  if (teacher.phone) {
    items.push({ label: 'Телефон', value: teacher.phone })
  }
  if (teacher.officeNumber) {
    items.push({ label: 'Кабинет', value: teacher.officeNumber })
  }

  return items
})

// Computed: Subject options for Select
const subjectOptions = computed(() => {
  return subjects.value.map(subject => ({
    value: subject.id,
    label: `${subject.name} (${subject.code})`,
  }))
})

// Computed: Group options for Select
const groupOptions = computed(() => {
  return groups.value.map(group => ({
    value: group.id,
    label: `${group.name} (${group.studentCount || 0} студентов)`,
  }))
})

// Computed: Grade type options
const gradeTypeOptions = [
  { value: 'EXAM', label: 'Экзамен' },
  { value: 'CREDIT', label: 'Зачёт' },
  { value: 'COURSEWORK', label: 'Курсовая' },
  { value: 'TEST', label: 'Контрольная' },
  { value: 'LAB', label: 'Лабораторная' },
]

async function fetchSubjects() {
  if (!authStore.user?.teacher?.id) {
    error.value = 'Профиль преподавателя не найден'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await subjectsApi.fetchSubjects({
      teacherId: authStore.user.teacher.id,
    })
    subjects.value = response.data
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки предметов'
  } finally {
    loading.value = false
  }
}

async function onSubjectChange() {
  selectedGroup.value = null
  students.value = []
  groups.value = []
  gradesForm.value = {}
  saveSuccess.value = false
  saveError.value = ''

  if (!selectedSubjectId.value) return

  groupsLoading.value = true
  try {
    groups.value = await gradesApi.fetchGroupsBySubject(selectedSubjectId.value)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка загрузки групп'
  } finally {
    groupsLoading.value = false
  }
}

async function onGroupChange() {
  students.value = []
  gradesForm.value = {}
  saveSuccess.value = false
  saveError.value = ''

  if (!selectedGroup.value || !selectedSubjectId.value) return

  studentsLoading.value = true
  try {
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(
      selectedGroup.value,
      selectedSubjectId.value
    )

    // Initialize grades form for each student
    students.value.forEach((student: Student) => {
      gradesForm.value[student.id] = {
        gradeType: '',
        gradeValue: null,
        examDate: '',
        notes: ''
      }
    })
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка загрузки студентов'
  } finally {
    studentsLoading.value = false
  }
}

async function saveBatchGrades() {
  if (!selectedSubjectId.value) return

  saveSuccess.value = false
  saveError.value = ''
  isSaving.value = true

  try {
    // Filter and prepare grades to save (only those with gradeType and gradeValue)
    const gradesToSave: GradeBatchDto[] = []

    Object.entries(gradesForm.value).forEach(([studentId, grade]) => {
      if (grade.gradeType && grade.gradeValue && grade.gradeValue >= 1 && grade.gradeValue <= 10) {
        gradesToSave.push({
          studentId: parseInt(studentId),
          subjectId: selectedSubjectId.value!,
          gradeType: grade.gradeType as GradeType,
          gradeValue: grade.gradeValue,
          examDate: grade.examDate || undefined,
          notes: grade.notes || undefined,
        })
      }
    })

    if (gradesToSave.length === 0) {
      saveError.value = 'Нет оценок для сохранения'
      return
    }

    // Save grades
    await gradesApi.createBatchGrades(gradesToSave)

    saveSuccess.value = true

    // Refresh students data to show updated grades
    if (selectedGroup.value && selectedSubjectId.value) {
      students.value = await gradesApi.fetchStudentsByGroupAndSubject(
        selectedGroup.value,
        selectedSubjectId.value
      )

      // Clear form after successful save
      clearGradesForm()
    }

    // Hide success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка при сохранении оценок'
  } finally {
    isSaving.value = false
  }
}

function clearGradesForm() {
  students.value.forEach((student: Student) => {
    gradesForm.value[student.id] = {
      gradeType: '',
      gradeValue: null,
      examDate: '',
      notes: ''
    }
  })
}

function viewSubjectDetails(subject: Subject) {
  router.push(`/subjects/${subject.id}/grades`)
}

async function logout() {
  await authStore.logout()
  router.push('/')
}

onMounted(async () => {
  // Check if token exists (from localStorage via httpClient)
  const httpClient = useHttpClient()
  const token = httpClient.getAccessToken()

  if (!token) {
    router.push('/login')
    return
  }

  loading.value = true

  try {
    // Fetch full profile with teacher data
    await authStore.fetchProfile()

    // Set token in auth store if user was fetched successfully
    if (authStore.user && token) {
      authStore.setAuth(authStore.user, token)
    }

    // Fetch subjects
    await fetchSubjects()
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background: var(--color-bg-secondary);
  padding: var(--spacing-5);
}

.subtitle {
  color: var(--color-text-secondary);
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-5);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-3);
}

.subject-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  flex: 1;
}

.subject-details {
  display: flex;
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-3);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-item .icon {
  font-size: var(--font-size-md);
}

.subject-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-3) 0;
}

.table-title {
  margin: var(--spacing-5) 0 var(--spacing-4) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.grades-table {
  overflow-x: auto;
  margin: var(--spacing-4) 0;
}

.grades-table table {
  width: 100%;
  border-collapse: collapse;
}

.grades-table th,
.grades-table td {
  padding: var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border-primary);
}

.grades-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  font-size: var(--font-size-sm);
}

.grades-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.current-grades {
  display: flex;
  flex-wrap: wrap;
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
  margin-top: var(--spacing-5);
  align-items: center;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
    width: 100%;
  }

  .actions > * {
    width: 100%;
  }
}
</style>

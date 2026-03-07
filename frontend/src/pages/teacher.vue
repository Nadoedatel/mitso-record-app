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
        <InfoCard
          v-if="authStore.user?.teacher"
          title="Информация о преподавателе"
          :items="teacherInfoItems"
        />

        <Section title="Мои предметы">
          <SubjectsGrid :subjects="subjects" @view-subject="viewSubjectDetails" />
        </Section>

        <Section title="Выставление оценок">
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

          <LoadingState
            v-if="selectedSubjectId && groupsLoading"
            message="Загрузка групп..."
            size="sm"
          />

          <div v-if="selectedGroup && students.length > 0">
            <h3 class="table-title">
              Студенты группы {{ groups.find(g => g.id === selectedGroup)?.name || selectedGroup }}
            </h3>

            <LoadingState v-if="studentsLoading" message="Загрузка студентов..." size="sm" />

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
                    <td>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</td>
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
                      <Input v-model="gradesForm[student.id].examDate" type="date" size="sm" />
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

            <div class="actions">
              <Button
                variant="success"
                :disabled="isSaving || !hasValidGrades"
                :loading="isSaving"
                @click="saveBatchGrades"
              >
                {{ isSaving ? 'Сохранение...' : 'Сохранить оценки' }}
              </Button>
              <Button variant="danger" :disabled="isSaving" @click="clearGradesForm">
                Очистить форму
              </Button>
            </div>

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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { useGradeAssignment } from '~/features/grades/model/useGradeAssignment'
import type { Subject } from '~/entities/subject'
import { SubjectsGrid } from '~/widgets/teacher'
import {
  Container,
  Header,
  Button,
  LoadingState,
  Alert,
  InfoCard,
  Section,
  EmptyState,
  FormField,
  Select,
  Input,
  NumberInput,
  GradeValueBadge,
} from '~/shared/ui'

const authStore = useAuthStore()
const router = useRouter()

const subjects = ref<Subject[]>([])
const loading = ref(false)
const error = ref('')

const {
  selectedSubjectId,
  selectedGroup,
  groups,
  students,
  gradesForm,
  groupsLoading,
  studentsLoading,
  isSaving,
  saveSuccess,
  saveError,
  hasValidGrades,
  subjectOptions,
  groupOptions,
  gradeTypeOptions,
  onSubjectChange,
  onGroupChange,
  clearGradesForm,
  saveBatchGrades,
} = useGradeAssignment(subjects)

const teacherInfoItems = computed(() => {
  if (!authStore.user?.teacher) return []
  const t = authStore.user.teacher
  const items = [
    { label: 'ФИО', value: `${t.lastName} ${t.firstName} ${t.middleName}` },
    { label: 'Кафедра', value: t.department },
    { label: 'Должность', value: t.position },
  ]
  if (t.academicDegree) items.push({ label: 'Учёная степень', value: t.academicDegree })
  if (t.phone) items.push({ label: 'Телефон', value: t.phone })
  if (t.officeNumber) items.push({ label: 'Кабинет', value: t.officeNumber })
  return items
})

function viewSubjectDetails(subject: Subject) {
  router.push(`/subjects/${subject.id}/grades`)
}

async function logout() {
  await authStore.logout()
  router.push('/')
}

async function fetchSubjects() {
  if (!authStore.user?.teacher?.id) {
    error.value = 'Профиль преподавателя не найден'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await subjectsApi.fetchSubjects({ teacherId: authStore.user.teacher.id })
    subjects.value = response.data
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки предметов'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const httpClient = useHttpClient()
  const token = httpClient.getAccessToken()

  if (!token) {
    router.push('/login')
    return
  }

  loading.value = true
  try {
    await authStore.fetchProfile()
    if (authStore.user && token) authStore.setAuth(authStore.user, token)
    await fetchSubjects()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background: var(--color-bg-section);
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
  border-bottom: 1px solid var(--color-border);
}

.grades-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background-color: var(--color-text-tertiary);
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
  .actions {
    flex-direction: column;
    width: 100%;
  }

  .actions > * {
    width: 100%;
  }
}
</style>

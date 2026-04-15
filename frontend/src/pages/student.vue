<template>
  <div class="student-page">
    <Container maxWidth="xl">
      <Header
        v-if="authStore.user?.student"
        :title="`${authStore.user.student.lastName} ${authStore.user.student.firstName}`"
      >
        <template #actions>
          <p v-if="authStore.user?.student" class="subtitle">
            {{ authStore.user.student.group?.name || 'Без группы' }} •
            {{ authStore.user.student.specialization?.name || 'Специализация не указана' }}
          </p>
          <Button variant="danger" @click="logout">Выйти</Button>
        </template>
      </Header>

      <LoadingState v-if="loading" message="Загрузка данных студента..." />

      <Alert v-else-if="error" variant="error" :title="error" closable @close="error = ''" />

      <div v-else class="content">
        <!-- Student Info Card -->
        <InfoCard
          v-if="authStore.user?.student"
          title="Информация о студенте"
          :items="studentInfoItems"
        />

        <!-- Grades Section -->
        <Section title="Мои оценки">
          <EmptyState
            v-if="grades.length === 0"
            message="У вас пока нет оценок"
          />

          <div v-else class="grades-table-wrapper">
            <table class="grades-table">
              <thead>
                <tr>
                  <th>Предмет</th>
                  <th>Преподаватель</th>
                  <th>Тип</th>
                  <th>Оценка</th>
                  <th>Дата</th>
                  <th>Примечания</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.id">
                  <td>{{ grade.subject?.name || 'Не указан' }}</td>
                  <td>
                    {{
                      grade.teacher
                        ? `${grade.teacher.lastName} ${grade.teacher.firstName.charAt(0)}.`
                        : 'Не указан'
                    }}
                  </td>
                  <td>
                    <GradeTypeBadge :type="grade.gradeType" size="sm" />
                  </td>
                  <td>
                    <GradeValueBadge :value="grade.gradeValue" />
                  </td>
                  <td>{{ formatDate(grade.examDate) }}</td>
                  <td>{{ grade.notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { gradesApi } from '~/features/grades/api/gradesApi'

definePageMeta({ middleware: 'auth' })
import type { Grade } from '~/entities/grade'
import {
  Container,
  Header,
  Button,
  LoadingState,
  Alert,
  InfoCard,
  Section,
  EmptyState,
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'

const authStore = useAuthStore()
const router = useRouter()

const grades = ref<Grade[]>([])
const loading = ref(false)
const error = ref('')

// Computed property for student info items
const studentInfoItems = computed(() => {
  if (!authStore.user?.student) return []
  const student = authStore.user.student

  const items = [
    {
      label: 'ФИО',
      value: `${student.lastName} ${student.firstName} ${student.middleName}`,
    },
    { label: 'Номер зачётки', value: student.studentId },
    { label: 'Группа', value: student.group?.name || 'Не указана' },
    { label: 'Курс', value: student.course },
    { label: 'Специализация', value: student.specialization?.name || 'Не указана' },
  ]

  const facultyName =
    student.group?.faculty?.name ||
    student.specialization?.faculty?.name ||
    null

  if (facultyName) {
    items.push({ label: 'Факультет', value: facultyName })
  }

  return items
})

async function fetchGrades() {
  if (!authStore.user?.student?.id) {
    error.value = 'Профиль студента не найден'
    return
  }

  loading.value = true
  error.value = ''

  try {
    grades.value = await gradesApi.fetchGradesForStudent(authStore.user.student.id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки оценок'
  } finally {
    loading.value = false
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU')
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  loading.value = true
  try {
    if (!authStore.user?.student) await authStore.fetchProfile()
    await fetchGrades()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.student-page {
  min-height: 100vh;
  background: var(--color-bg-page);
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

.grades-table-wrapper {
  overflow-x: auto;
  background: var(--color-bg-section);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
}

.grades-table thead {
  background: var(--color-bg-page);
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
  font-size: var(--font-size-sm);
}

.grades-table td {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.grades-table tbody tr:hover {
  background: var(--color-bg-hover);
}
</style>

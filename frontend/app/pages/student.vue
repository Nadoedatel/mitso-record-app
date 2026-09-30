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

      <Alert v-else-if="error" variant="error" :title="error" />

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

          <Table v-else :columns="gradeColumns" :data="grades" row-key="id" :hoverable="false">
            <template #cell-teacher="{ row }">{{ formatShortName(row.teacher) }}</template>
            <template #cell-gradeType="{ row }">
              <GradeTypeBadge :type="row.gradeType" size="sm" />
            </template>
            <template #cell-gradeValue="{ row }">
              <GradeValueBadge :value="row.gradeValue" :type="row.gradeType" />
            </template>
            <template #cell-examDate="{ row }">{{ formatDate(row.examDate) }}</template>
            <template #cell-notes="{ row }">{{ row.notes || '-' }}</template>
          </Table>
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  Table,
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'
import { formatDate } from '~/shared/lib/formatDate'
import { formatShortName } from '~/shared/lib/formatName'

const authStore = useAuthStore()
const router = useRouter()

const gradeColumns = [
  { key: 'subject', label: 'Предмет', formatter: (_: unknown, row: Grade) => row.subject?.name || 'Не указан' },
  { key: 'teacher', label: 'Преподаватель' },
  { key: 'gradeType', label: 'Тип' },
  { key: 'gradeValue', label: 'Оценка' },
  { key: 'examDate', label: 'Дата' },
  { key: 'notes', label: 'Примечания' },
]

// Auth middleware has already loaded the profile, so the student id is known here
const studentProfileId = computed(() => authStore.user?.student?.id)

const { data: gradesData, status, error: gradesError } = useAsyncData(
  'student-grades',
  () => gradesApi.fetchGradesForStudent(studentProfileId.value!),
  { immediate: !!studentProfileId.value },
)
const grades = computed<Grade[]>(() => gradesData.value ?? [])
const loading = computed(() => status.value === 'pending')
const error = computed(() =>
  studentProfileId.value ? (gradesError.value?.message ?? '') : 'Профиль студента не найден',
)

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

async function logout() {
  await authStore.logout()
  router.push('/login')
}

</script>

<style scoped>
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
</style>

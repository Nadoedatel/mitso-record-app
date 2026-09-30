<template>
  <div class="student-detail-page">
    <Container maxWidth="xl">
      <Header title="Карточка студента">
        <template #actions>
          <Button variant="secondary" @click="$router.push('/students')">К списку</Button>
        </template>
      </Header>

      <LoadingState v-if="loading" message="Загрузка данных студента..." />

      <Alert v-else-if="error" variant="error" :title="error" />

      <div v-else-if="student" class="content">
        <InfoCard
          :title="`${student.lastName} ${student.firstName} ${student.middleName}`"
          :items="[
            { label: 'Группа', value: student.group?.name || '-' },
            { label: 'Зачётная книжка', value: student.studentId },
            { label: 'Курс', value: String(student.course) }
          ]"
        />

        <Section title="Оценки">
          <EmptyState v-if="!grades || grades.length === 0" message="Оценок пока нет" />

          <div v-else>
            <div v-for="semester in groupedGrades" :key="semester.semester" class="semester-group">
              <h4 class="semester-title">Семестр {{ semester.semester }}</h4>
              <Table :columns="gradeColumns" :data="semester.grades" row-key="id" :hoverable="false">
                <template #cell-teacher="{ row }">{{ formatShortName(row.teacher, 'Н/Д') }}</template>
                <template #cell-gradeType="{ row }">
                  <GradeTypeBadge :type="row.gradeType" size="sm" />
                </template>
                <template #cell-gradeValue="{ row }">
                  <GradeValueBadge :value="row.gradeValue" :type="row.gradeType" />
                </template>
                <template #cell-examDate="{ row }">{{ formatDate(row.examDate, 'Н/Д') }}</template>
              </Table>
            </div>
          </div>
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { studentsApi } from '~/features/students/api/studentsApi'
import { gradesApi } from '~/features/grades/api/gradesApi'
import type { Student } from '~/entities/student'
import type { Grade } from '~/entities/grade'
import {
  Container,
  Header,
  Button,
  InfoCard,
  Section,
  LoadingState,
  EmptyState,
  Alert,
  Table,
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'
import { formatDate } from '~/shared/lib/formatDate'
import { formatShortName } from '~/shared/lib/formatName'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const studentId = Number(route.params.id)
if (!Number.isInteger(studentId)) {
  throw createError({ statusCode: 404, statusMessage: 'Студент не найден', fatal: true })
}

const gradeColumns = [
  { key: 'subject', label: 'Предмет', formatter: (_: unknown, row: Grade) => row.subject?.name || 'Н/Д' },
  { key: 'teacher', label: 'Преподаватель' },
  { key: 'gradeType', label: 'Тип' },
  { key: 'gradeValue', label: 'Оценка' },
  { key: 'examDate', label: 'Дата' },
]

const { data, status, error: loadError } = useAsyncData(`student-${studentId}`, async () => {
  const [student, grades] = await Promise.all([
    studentsApi.fetchStudentById(studentId),
    gradesApi.fetchGradesForStudent(studentId),
  ])
  return { student, grades }
})
const student = computed<Student | null>(() => data.value?.student ?? null)
const grades = computed<Grade[]>(() => data.value?.grades ?? [])
const loading = computed(() => status.value === 'pending')
const error = computed(() => loadError.value?.message ?? '')

const groupedGrades = computed(() => {
  if (!grades.value) return []

  const groups = grades.value.reduce((acc, grade) => {
    const semester = grade.subject?.semester || 1
    if (!acc[semester]) {
      acc[semester] = []
    }
    acc[semester].push(grade)
    return acc
  }, {} as Record<number, Grade[]>)

  return Object.entries(groups)
    .map(([semester, gradesList]) => ({
      semester: parseInt(semester),
      grades: gradesList.sort((a, b) => {
        const dateA = new Date(a.examDate || 0).getTime()
        const dateB = new Date(b.examDate || 0).getTime()
        return dateB - dateA
      }),
    }))
    .sort((a, b) => a.semester - b.semester)
})
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.semester-group {
  margin-bottom: var(--spacing-6);
}

.semester-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-3) 0;
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-border);
}
</style>

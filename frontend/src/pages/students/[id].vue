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
              <div class="grades-table-wrapper">
                <table class="grades-table">
                  <thead>
                    <tr>
                      <th>Предмет</th>
                      <th>Преподаватель</th>
                      <th>Тип</th>
                      <th>Оценка</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="grade in semester.grades" :key="grade.id">
                      <td>{{ grade.subject?.name || 'Н/Д' }}</td>
                      <td>
                        {{
                          grade.teacher
                            ? `${grade.teacher.lastName} ${grade.teacher.firstName.charAt(0)}.`
                            : 'Н/Д'
                        }}
                      </td>
                      <td>
                        <GradeTypeBadge :type="grade.gradeType" size="sm" />
                      </td>
                      <td>
                        <GradeValueBadge :value="grade.gradeValue" />
                      </td>
                      <td>{{ formatDate(grade.examDate) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  GradeTypeBadge,
  GradeValueBadge,
} from '~/shared/ui'

const route = useRoute()
const studentId = computed(() => parseInt(route.params.id as string))

const student = ref<Student | null>(null)
const grades = ref<Grade[]>([])
const loading = ref(true)
const error = ref('')

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

const formatDate = (date?: string) => {
  if (!date) return 'Н/Д'
  return new Date(date).toLocaleDateString('ru-RU')
}

onMounted(async () => {
  try {
    const [studentData, gradesData] = await Promise.all([
      studentsApi.fetchStudentById(studentId.value),
      gradesApi.fetchGradesForStudent(studentId.value),
    ])

    student.value = studentData
    grades.value = gradesData
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.student-detail-page {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: var(--spacing-5);
}

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

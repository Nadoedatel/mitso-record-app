<template>
  <div class="student-detail-page">
    <div class="container">
      <header class="header">
        <h1>Карточка студента</h1>
        <NuxtLink to="/students" class="back-button">К списку</NuxtLink>
      </header>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else-if="student" class="content">
        <div class="student-info">
          <h2>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Группа:</span>
              <span class="value">{{ student.group }}</span>
            </div>
            <div class="info-item">
              <span class="label">Зачётная книжка:</span>
              <span class="value">{{ student.studentId }}</span>
            </div>
            <div class="info-item">
              <span class="label">Курс:</span>
              <span class="value">{{ student.course }}</span>
            </div>
            <div class="info-item">
              <span class="label">Факультет:</span>
              <span class="value">{{ student.faculty }}</span>
            </div>
          </div>
        </div>

        <div class="grades-section">
          <h3>Оценки</h3>

          <div v-if="!grades || grades.length === 0" class="empty">
            Оценок пока нет
          </div>

          <div v-else>
            <div v-for="semester in groupedGrades" :key="semester.semester" class="semester-group">
              <h4>Семестр {{ semester.semester }}</h4>
              <div class="grades-table">
                <div class="table-header">
                  <div>Предмет</div>
                  <div>Преподаватель</div>
                  <div>Тип</div>
                  <div>Оценка</div>
                  <div>Дата</div>
                </div>
                <div
                  v-for="grade in semester.grades"
                  :key="grade.id"
                  class="table-row"
                >
                  <div>{{ grade.subject?.name || 'Н/Д' }}</div>
                  <div>
                    {{ grade.subject?.teacher
                      ? `${grade.subject.teacher.lastName} ${grade.subject.teacher.firstName.charAt(0)}.`
                      : 'Н/Д'
                    }}
                  </div>
                  <div>
                    <span :class="['grade-type-badge', getGradeTypeClass(grade.gradeType)]">
                      {{ formatGradeType(grade.gradeType) }}
                    </span>
                  </div>
                  <div>
                    <span :class="['grade-value', getGradeClass(grade.gradeValue)]">
                      {{ grade.gradeValue }}
                    </span>
                  </div>
                  <div>{{ formatDate(grade.examDate) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { studentsApi } from '~/features/students/api/studentsApi'
import { gradesApi } from '~/features/grades/api/gradesApi'
import type { Student } from '~/entities/student'
import type { Grade } from '~/entities/grade'

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

const formatGradeType = (type: string) => {
  const types: Record<string, string> = {
    EXAM: 'Экзамен',
    CREDIT: 'Зачёт',
    COURSEWORK: 'Курсовая',
    LAB: 'Лаб. работа',
    TEST: 'Тест',
  }
  return types[type] || type
}

const formatDate = (date?: string) => {
  if (!date) return 'Н/Д'
  return new Date(date).toLocaleDateString('ru-RU')
}

const getGradeTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    EXAM: 'type-exam',
    CREDIT: 'type-credit',
    COURSEWORK: 'type-coursework',
    LAB: 'type-lab',
    TEST: 'type-test',
  }
  return classes[type] || ''
}

const getGradeClass = (value: number) => {
  if (value >= 90) return 'grade-excellent'
  if (value >= 70) return 'grade-good'
  if (value >= 50) return 'grade-satisfactory'
  return 'grade-poor'
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
  background: #f7fafc;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  color: #2d3748;
}

.back-button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
}

.back-button:hover {
  background: #5568d3;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
}

.error {
  color: #e53e3e;
}

.student-info {
  background: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.student-info h2 {
  font-size: 24px;
  color: #2d3748;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 14px;
  color: #718096;
  margin-bottom: 4px;
}

.value {
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
}

.grades-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.grades-section h3 {
  font-size: 22px;
  color: #2d3748;
  margin-bottom: 20px;
}

.semester-group {
  margin-bottom: 30px;
}

.semester-group h4 {
  font-size: 18px;
  color: #667eea;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.grades-table {
  display: flex;
  flex-direction: column;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 0.7fr 1fr;
  gap: 12px;
  padding: 12px;
}

.table-header {
  background: #f7fafc;
  font-weight: 600;
  color: #4a5568;
  border-radius: 6px;
}

.table-row {
  border-bottom: 1px solid #e2e8f0;
}

.grade-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.type-exam {
  background: #fef5e7;
  color: #d68910;
}

.type-credit {
  background: #e8f4fd;
  color: #1e88e5;
}

.type-coursework {
  background: #f3e5f5;
  color: #8e24aa;
}

.type-lab {
  background: #e8f5e9;
  color: #43a047;
}

.type-test {
  background: #fff3e0;
  color: #f57c00;
}

.grade-value {
  font-weight: 700;
  font-size: 16px;
}

.grade-excellent {
  color: #22c55e;
}

.grade-good {
  color: #3b82f6;
}

.grade-satisfactory {
  color: #f59e0b;
}

.grade-poor {
  color: #ef4444;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #718096;
}
</style>

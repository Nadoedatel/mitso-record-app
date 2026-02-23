<template>
  <div class="student-page">
    <div class="container">
      <header class="header">
        <div>
          <h1 v-if="authStore.user?.student">
            {{ authStore.user.student.lastName }} {{ authStore.user.student.firstName }}
          </h1>
          <p v-if="authStore.user?.student" class="subtitle">
            Группа: {{ authStore.user.student.group?.name || authStore.user.student.group }}
          </p>
        </div>
        <button @click="logout" class="logout-button">Выйти</button>
      </header>

      <div v-if="loading" class="loading">Загрузка...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="content">
        <!-- Student Info Card -->
        <div v-if="authStore.user?.student" class="info-card">
          <h2>Информация о студенте</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">ФИО:</span>
              <span class="value">
                {{ authStore.user.student.lastName }}
                {{ authStore.user.student.firstName }}
                {{ authStore.user.student.middleName }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Номер зачётки:</span>
              <span class="value">{{ authStore.user.student.studentId }}</span>
            </div>
            <div class="info-item">
              <span class="label">Группа:</span>
              <span class="value">{{ authStore.user.student.group?.name || authStore.user.student.group }}</span>
            </div>
            <div class="info-item">
              <span class="label">Курс:</span>
              <span class="value">{{ authStore.user.student.course }}</span>
            </div>
          </div>
        </div>

        <!-- Grades Table -->
        <div class="grades-section">
          <h2>Мои оценки</h2>

          <div v-if="grades.length === 0" class="empty">
            У вас пока нет оценок
          </div>

          <div v-else class="grades-table">
            <table>
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
                      grade.subject?.teacher
                        ? `${grade.subject.teacher.lastName} ${grade.subject.teacher.firstName.charAt(0)}.`
                        : 'Не указан'
                    }}
                  </td>
                  <td>
                    <span :class="['grade-type', `type-${grade.gradeType.toLowerCase()}`]">
                      {{ getGradeTypeLabel(grade.gradeType) }}
                    </span>
                  </td>
                  <td>
                    <span :class="['grade-value', getGradeClass(grade.gradeValue)]">
                      {{ grade.gradeValue }}
                    </span>
                  </td>
                  <td>{{ formatDate(grade.examDate) }}</td>
                  <td>{{ grade.notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import { gradesApi } from '~/features/grades/api/gradesApi'
import type { Grade } from '~/entities/grade'

const authStore = useAuthStore()
const router = useRouter()

const grades = ref<Grade[]>([])
const loading = ref(false)
const error = ref('')

async function fetchGrades() {
  if (!authStore.user?.student?.id) {
    error.value = 'Профиль студента не найден'
    return
  }

  loading.value = true
  error.value = ''

  try {
    grades.value = await gradesApi.fetchGradesForStudent(authStore.user.student.id)
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки оценок'
  } finally {
    loading.value = false
  }
}

function getGradeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    EXAM: 'Экзамен',
    CREDIT: 'Зачёт',
    COURSEWORK: 'Курсовая',
    TEST: 'Контрольная',
    LAB: 'Лабораторная',
  }
  return labels[type] || type
}

function getGradeClass(value: number): string {
  if (value >= 9) return 'excellent'
  if (value >= 7) return 'good'
  if (value >= 5) return 'satisfactory'
  return 'poor'
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU')
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
    // Fetch full profile with student data
    await authStore.fetchProfile()

    // Set token in auth store if user was fetched successfully
    if (authStore.user && token) {
      authStore.setAuth(authStore.user, token)
    }

    // Fetch grades
    await fetchGrades()
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.student-page {
  min-height: 100vh;
  background: #f5f7fa;
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
  color: #333;
  margin: 0;
}

.subtitle {
  color: #666;
  margin-top: 5px;
}

.logout-button {
  padding: 10px 20px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button:hover {
  background: #c53030;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.loading {
  color: #666;
}

.error {
  color: #e53e3e;
  background: #fff5f5;
  border-radius: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-card,
.grades-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card h2,
.grades-section h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  font-size: 16px;
  color: #333;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.grades-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

td {
  color: #666;
  font-size: 14px;
}

tbody tr:hover {
  background: #f8f9fa;
}

.grade-type {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.type-exam {
  background: #e6f3ff;
  color: #0066cc;
}

.type-credit {
  background: #e6ffe6;
  color: #00a854;
}

.type-coursework {
  background: #fff7e6;
  color: #fa8c16;
}

.type-test {
  background: #f0e6ff;
  color: #722ed1;
}

.type-lab {
  background: #ffe6f0;
  color: #eb2f96;
}

.grade-value {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 16px;
}

.excellent {
  background: #e6f7ff;
  color: #1890ff;
}

.good {
  background: #f6ffed;
  color: #52c41a;
}

.satisfactory {
  background: #fffbe6;
  color: #faad14;
}

.poor {
  background: #fff1f0;
  color: #f5222d;
}
</style>

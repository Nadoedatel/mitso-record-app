<template>
  <div class="teacher-page">
    <div class="container">
      <header class="header">
        <div>
          <h1 v-if="authStore.user?.teacher">
            {{ authStore.user.teacher.lastName }} {{ authStore.user.teacher.firstName }}
          </h1>
          <p v-if="authStore.user?.teacher" class="subtitle">
            {{ authStore.user.teacher.position }} • {{ authStore.user.teacher.department }}
          </p>
        </div>
        <button @click="logout" class="logout-button">Выйти</button>
      </header>

      <div v-if="loading" class="loading">Загрузка...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="content">
        <!-- Teacher Info Card -->
        <div v-if="authStore.user?.teacher" class="info-card">
          <h2>Информация о преподавателе</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">ФИО:</span>
              <span class="value">
                {{ authStore.user.teacher.lastName }}
                {{ authStore.user.teacher.firstName }}
                {{ authStore.user.teacher.middleName }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Кафедра:</span>
              <span class="value">{{ authStore.user.teacher.department }}</span>
            </div>
            <div class="info-item">
              <span class="label">Должность:</span>
              <span class="value">{{ authStore.user.teacher.position }}</span>
            </div>
            <div v-if="authStore.user.teacher.academicDegree" class="info-item">
              <span class="label">Учёная степень:</span>
              <span class="value">{{ authStore.user.teacher.academicDegree }}</span>
            </div>
            <div v-if="authStore.user.teacher.phone" class="info-item">
              <span class="label">Телефон:</span>
              <span class="value">{{ authStore.user.teacher.phone }}</span>
            </div>
            <div v-if="authStore.user.teacher.officeNumber" class="info-item">
              <span class="label">Кабинет:</span>
              <span class="value">{{ authStore.user.teacher.officeNumber }}</span>
            </div>
          </div>
        </div>

        <!-- Subjects Section -->
        <div class="subjects-section">
          <h2>Мои предметы</h2>

          <div v-if="subjects.length === 0" class="empty">
            У вас пока нет назначенных предметов
          </div>

          <div v-else class="subjects-grid">
            <div v-for="subject in subjects" :key="subject.id" class="subject-card">
              <div class="subject-header">
                <h3>{{ subject.name }}</h3>
                <span class="subject-code">{{ subject.code }}</span>
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
              <button @click="viewSubjectDetails(subject)" class="view-button">
                Управление оценками
              </button>
            </div>
          </div>
        </div>

        <!-- Grade Assignment Section -->
        <div class="grade-assignment-section">
          <h2>Выставление оценок</h2>

          <!-- Subject Selection -->
          <div class="selection-row">
            <div class="selection-group">
              <label for="subject-select">Выберите предмет:</label>
              <select
                id="subject-select"
                v-model="selectedSubjectId"
                @change="onSubjectChange"
                class="select-input"
              >
                <option :value="null">-- Выберите предмет --</option>
                <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                  {{ subject.name }} ({{ subject.code }})
                </option>
              </select>
            </div>
          </div>

          <!-- Group Selection -->
          <div v-if="selectedSubjectId && groups.length > 0" class="selection-row">
            <div class="selection-group">
              <label for="group-select">Выберите группу:</label>
              <select
                id="group-select"
                v-model="selectedGroup"
                @change="onGroupChange"
                class="select-input"
              >
                <option :value="null">-- Выберите группу --</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }} ({{ group.studentCount || 0 }} студентов)
                </option>
              </select>
            </div>
          </div>

          <!-- Loading indicator for groups -->
          <div v-if="selectedSubjectId && groupsLoading" class="loading-small">
            Загрузка групп...
          </div>

          <!-- Students Table -->
          <div v-if="selectedGroup && students.length > 0" class="students-table-container">
            <h3>Студенты группы {{ groups.find(g => g.id === selectedGroup)?.name || selectedGroup }}</h3>

            <div v-if="studentsLoading" class="loading-small">
              Загрузка студентов...
            </div>

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
                        <span
                          v-for="grade in student.grades"
                          :key="grade.id"
                          :class="['grade-badge', getGradeClass(grade.gradeValue)]"
                        >
                          {{ getGradeTypeLabel(grade.gradeType) }}: {{ grade.gradeValue }}
                        </span>
                      </div>
                      <span v-else class="no-grades">Нет оценок</span>
                    </td>
                    <td>
                      <select
                        v-model="gradesForm[student.id].gradeType"
                        class="table-select"
                      >
                        <option value="">-- Выберите --</option>
                        <option value="EXAM">Экзамен</option>
                        <option value="CREDIT">Зачёт</option>
                        <option value="COURSEWORK">Курсовая</option>
                        <option value="TEST">Контрольная</option>
                        <option value="LAB">Лабораторная</option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model.number="gradesForm[student.id].gradeValue"
                        type="number"
                        min="1"
                        max="10"
                        class="table-input"
                        placeholder="1-10"
                      />
                    </td>
                    <td>
                      <input
                        v-model="gradesForm[student.id].examDate"
                        type="date"
                        class="table-input"
                      />
                    </td>
                    <td>
                      <input
                        v-model="gradesForm[student.id].notes"
                        type="text"
                        class="table-input"
                        placeholder="Примечания"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Save Button -->
            <div class="actions">
              <button
                @click="saveBatchGrades"
                :disabled="isSaving || !hasValidGrades"
                class="save-button"
              >
                {{ isSaving ? 'Сохранение...' : 'Сохранить оценки' }}
              </button>
              <button
                @click="clearGradesForm"
                :disabled="isSaving"
                class="clear-button"
              >
                Очистить форму
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div v-if="saveSuccess" class="success-message">
              Оценки успешно сохранены!
            </div>
            <div v-if="saveError" class="error-message">
              {{ saveError }}
            </div>
          </div>

          <!-- Empty state when no students -->
          <div v-else-if="selectedGroup && !studentsLoading && students.length === 0" class="empty">
            В выбранной группе нет студентов
          </div>
        </div>
      </div>
    </div>
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
.subjects-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card h2,
.subjects-section h2 {
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

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.subject-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.subject-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.subject-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.subject-code {
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.subject-details {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.detail-item .icon {
  font-size: 16px;
}

.subject-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 12px 0;
}

.view-button {
  width: 100%;
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 12px;
}

.view-button:hover {
  background: #5568d3;
}

/* Grade Assignment Section */
.grade-assignment-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selection-row {
  margin-bottom: 20px;
}

.selection-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.select-input {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.select-input:hover {
  border-color: #667eea;
}

.select-input:focus {
  outline: none;
  border-color: #667eea;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.students-table-container {
  margin-top: 20px;
}

.students-table-container h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
}

.table-select,
.table-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
}

.table-select:focus,
.table-input:focus {
  outline: none;
  border-color: #667eea;
}

.table-input[type="number"] {
  max-width: 80px;
}

.table-input[type="date"] {
  max-width: 140px;
}

.current-grades {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.grade-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.no-grades {
  color: #999;
  font-size: 12px;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

.save-button {
  padding: 12px 24px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.save-button:hover:not(:disabled) {
  background: #389e0d;
}

.save-button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.clear-button {
  padding: 12px 24px;
  background: #ff7875;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-button:hover:not(:disabled) {
  background: #ff4d4f;
}

.clear-button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.success-message {
  padding: 12px 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  color: #52c41a;
  font-weight: 600;
  margin-top: 15px;
}

.error-message {
  padding: 12px 20px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
  font-weight: 600;
  margin-top: 15px;
}
</style>

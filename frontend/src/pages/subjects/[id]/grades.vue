<template>
  <div class="grades-management-page">
    <div class="container">
      <header class="header">
        <div>
          <NuxtLink to="/teacher" class="back-link">← Назад к предметам</NuxtLink>
          <h1 v-if="subject">{{ subject.name }}</h1>
          <p v-if="subject" class="subtitle">Управление оценками • Семестр {{ subject.semester }}</p>
        </div>
      </header>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="content">
        <!-- Search and Add Grade -->
        <div class="toolbar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск студентов..."
            class="search-input"
          />
          <button @click="openAddGradeModal" class="add-button">+ Добавить оценку</button>
        </div>

        <!-- Students List -->
        <div v-if="filteredStudents.length === 0" class="empty">
          Студенты не найдены
        </div>

        <div v-else class="students-list">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="student-card"
          >
            <div class="student-info">
              <h3>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</h3>
              <p class="student-group">Группа: {{ student.group }}</p>
            </div>

            <div class="grades-container">
              <div
                v-for="grade in getStudentGrades(student.id)"
                :key="grade.id"
                class="grade-item"
              >
                <span :class="['grade-value', getGradeClass(grade.gradeValue)]">
                  {{ grade.gradeValue }}
                </span>
                <span class="grade-type">{{ formatGradeType(grade.gradeType) }}</span>
                <span class="grade-date">{{ formatDate(grade.examDate) }}</span>
                <div class="grade-actions">
                  <button @click="editGrade(grade)" class="edit-btn" title="Редактировать">✏️</button>
                  <button @click="deleteGrade(grade.id)" class="delete-btn" title="Удалить">🗑️</button>
                </div>
              </div>

              <button @click="addGradeForStudent(student)" class="add-grade-btn">
                + Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grade Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingGrade ? 'Редактировать оценку' : 'Добавить оценку' }}</h2>

        <form @submit.prevent="saveGrade">
          <div v-if="!selectedStudent" class="form-group">
            <label>Студент:</label>
            <select v-model="gradeForm.studentId" required>
              <option value="">Выберите студента</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.lastName }} {{ student.firstName }} ({{ student.group }})
              </option>
            </select>
          </div>
          <div v-else class="form-group">
            <label>Студент:</label>
            <p class="selected-student">
              {{ selectedStudent.lastName }} {{ selectedStudent.firstName }}
            </p>
          </div>

          <div class="form-group">
            <label>Оценка:</label>
            <input v-model.number="gradeForm.gradeValue" type="number" min="0" max="100" required />
          </div>

          <div class="form-group">
            <label>Тип:</label>
            <select v-model="gradeForm.gradeType" required>
              <option value="EXAM">Экзамен</option>
              <option value="CREDIT">Зачёт</option>
              <option value="COURSEWORK">Курсовая</option>
              <option value="LAB">Лаб. работа</option>
              <option value="TEST">Тест</option>
            </select>
          </div>

          <div class="form-group">
            <label>Дата:</label>
            <input v-model="gradeForm.examDate" type="date" required />
          </div>

          <div class="modal-actions">
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button type="button" @click="closeModal" class="cancel-btn">Отмена</button>
          </div>

          <div v-if="modalError" class="error-message">{{ modalError }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { studentsApi } from '~/features/students/api/studentsApi'
import { gradesApi, type CreateGradeDto } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Student } from '~/entities/student'
import type { Grade } from '~/entities/grade'

const route = useRoute()
const subjectId = computed(() => parseInt(route.params.id as string))

const subject = ref<Subject | null>(null)
const students = ref<Student[]>([])
const grades = ref<Grade[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

const showModal = ref(false)
const editingGrade = ref<Grade | null>(null)
const selectedStudent = ref<Student | null>(null)
const saving = ref(false)
const modalError = ref('')

const gradeForm = ref<CreateGradeDto>({
  studentId: 0,
  subjectId: subjectId.value,
  gradeValue: 0,
  gradeType: 'EXAM',
  examDate: new Date().toISOString().split('T')[0],
})

const filteredStudents = computed(() => {
  if (!students.value || students.value.length === 0) return []
  if (!searchQuery.value) return students.value
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(s =>
    `${s.lastName} ${s.firstName} ${s.middleName} ${s.group}`.toLowerCase().includes(query)
  )
})

const getStudentGrades = (studentId: number) => {
  return grades.value.filter(g => g.studentId === studentId)
}

const formatGradeType = (type: string) => {
  const types: Record<string, string> = {
    EXAM: 'Экзамен',
    CREDIT: 'Зачёт',
    COURSEWORK: 'Курсовая',
    LAB: 'Лаб.',
    TEST: 'Тест',
  }
  return types[type] || type
}

const formatDate = (date?: string) => {
  if (!date) return 'Н/Д'
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

const getGradeClass = (value: number) => {
  if (value >= 90) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 50) return 'satisfactory'
  return 'poor'
}

const openAddGradeModal = () => {
  selectedStudent.value = null
  editingGrade.value = null
  resetForm()
  showModal.value = true
}

const addGradeForStudent = (student: Student) => {
  selectedStudent.value = student
  editingGrade.value = null
  resetForm()
  gradeForm.value.studentId = student.id
  showModal.value = true
}

const editGrade = (grade: Grade) => {
  editingGrade.value = grade
  selectedStudent.value = students.value.find(s => s.id === grade.studentId) || null
  gradeForm.value = {
    studentId: grade.studentId,
    subjectId: subjectId.value,
    gradeValue: grade.gradeValue,
    gradeType: grade.gradeType as any,
    examDate: grade.examDate ? new Date(grade.examDate).toISOString().split('T')[0] : '',
    notes: grade.notes,
  }
  showModal.value = true
}

const resetForm = () => {
  gradeForm.value = {
    studentId: 0,
    subjectId: subjectId.value,
    gradeValue: 0,
    gradeType: 'EXAM',
    examDate: new Date().toISOString().split('T')[0],
  }
  modalError.value = ''
}

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
  editingGrade.value = null
  resetForm()
}

const saveGrade = async () => {
  saving.value = true
  modalError.value = ''

  try {
    if (editingGrade.value) {
      await gradesApi.updateGrade(editingGrade.value.id, gradeForm.value)
    } else {
      await gradesApi.createGrade(gradeForm.value)
    }

    // Reload grades
    await fetchGrades()
    closeModal()
  } catch (err: any) {
    modalError.value = err.message || 'Ошибка сохранения оценки'
  } finally {
    saving.value = false
  }
}

const deleteGrade = async (id: number) => {
  if (!confirm('Удалить эту оценку?')) return

  try {
    await gradesApi.deleteGrade(id)
    await fetchGrades()
  } catch (err: any) {
    alert(err.message || 'Ошибка удаления оценки')
  }
}

const fetchGrades = async () => {
  grades.value = await gradesApi.fetchGrades({ subjectId: subjectId.value })
}

onMounted(async () => {
  try {
    const [subjectData, studentsData, gradesData] = await Promise.all([
      subjectsApi.fetchSubjectById(subjectId.value),
      studentsApi.fetchStudents({ limit: 100 }),
      gradesApi.fetchGrades({ subjectId: subjectId.value }),
    ])

    subject.value = subjectData
    students.value = studentsData.data
    grades.value = gradesData // уже Grade[]
    console.log('grades.value = ', grades.value, Array.isArray(grades.value))
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
  background: #f7fafc;
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.back-link {
  display: inline-block;
  color: #667eea;
  text-decoration: none;
  margin-bottom: 10px;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.header h1 {
  font-size: 28px;
  color: #2d3748;
  margin: 0;
}

.subtitle {
  color: #718096;
  margin-top: 5px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.add-button:hover {
  background: #5568d3;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.student-info {
  min-width: 300px;
}

.student-info h3 {
  font-size: 18px;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.student-group {
  color: #718096;
  margin: 0;
}

.grades-container {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.grade-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.grade-value {
  font-weight: 700;
  font-size: 18px;
  min-width: 35px;
}

.grade-value.excellent { color: #22c55e; }
.grade-value.good { color: #3b82f6; }
.grade-value.satisfactory { color: #f59e0b; }
.grade-value.poor { color: #ef4444; }

.grade-type {
  font-size: 13px;
  color: #718096;
}

.grade-date {
  font-size: 12px;
  color: #a0aec0;
}

.grade-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.edit-btn:hover { opacity: 0.7; }
.delete-btn:hover { opacity: 0.7; }

.add-grade-btn {
  padding: 6px 12px;
  background: transparent;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.add-grade-btn:hover {
  background: #f7fafc;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #2d3748;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.selected-student {
  font-weight: 600;
  color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #5568d3;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #e2e8f0;
  color: #2d3748;
}

.cancel-btn:hover {
  background: #cbd5e0;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 6px;
  text-align: center;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
}

.error {
  color: #e53e3e;
}
</style>

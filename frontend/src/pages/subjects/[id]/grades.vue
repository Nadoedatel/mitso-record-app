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
        <!-- Step 1: Groups List View -->
        <div v-if="!selectedGroup" class="groups-view">
          <div class="toolbar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по группе или студенту..."
              class="search-input"
            />
          </div>

          <div v-if="filteredGroups.length === 0" class="empty">
            Группы не найдены
          </div>

          <div v-else class="groups-list">
            <div
              v-for="group in filteredGroups"
              :key="group.id"
              class="group-card"
              @click="selectGroup(group)"
            >
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p class="group-details">
                  Курс {{ group.course }} • {{ group.studentCount }} студентов
                </p>
                <p v-if="group.faculty" class="group-faculty">
                  {{ group.faculty.name }}
                </p>
              </div>
              <div class="group-arrow">→</div>
            </div>
          </div>
        </div>

        <!-- Step 2: Students List View with Batch Grade Entry -->
        <div v-else class="students-view">
          <div class="students-header">
            <button @click="backToGroups" class="back-button">← Назад к группам</button>
            <h2>{{ selectedGroup.name }}</h2>
          </div>

          <!-- Grade Type and Date Selector -->
          <div class="batch-controls">
            <div class="control-group">
              <label>Тип оценки:</label>
              <select v-model="batchGradeType" class="batch-select">
                <option value="EXAM">Экзамен</option>
                <option value="CREDIT">Зачёт</option>
                <option value="COURSEWORK">Курсовая</option>
                <option value="LAB">Лабораторная</option>
                <option value="TEST">Тест</option>
              </select>
            </div>
            <div class="control-group">
              <label>Дата:</label>
              <input v-model="batchExamDate" type="date" class="batch-date" />
            </div>
          </div>

          <div v-if="loadingStudents" class="loading">Загрузка студентов...</div>

          <div v-else-if="students.length === 0" class="empty">
            В группе нет студентов
          </div>

          <div v-else class="students-table-container">
            <table class="students-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>ФИО</th>
                  <th>Зачётка</th>
                  <th>Текущие оценки</th>
                  <th>Новая оценка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, index) in students" :key="student.id">
                  <td>{{ index + 1 }}</td>
                  <td class="student-name">
                    {{ student.lastName }} {{ student.firstName }} {{ student.middleName || '' }}
                  </td>
                  <td>{{ student.studentId }}</td>
                  <td>
                    <div class="existing-grades">
                      <span
                        v-for="grade in student.grades"
                        :key="grade.id"
                        class="grade-badge"
                        :class="getGradeClass(grade.gradeValue)"
                        :title="`${formatGradeType(grade.gradeType)} - ${formatDate(grade.examDate)}`"
                      >
                        {{ grade.gradeValue }} ({{ formatGradeType(grade.gradeType) }})
                      </span>
                      <span v-if="!student.grades || student.grades.length === 0" class="no-grades">
                        Нет оценок
                      </span>
                    </div>
                  </td>
                  <td>
                    <input
                      v-model.number="gradeInputs[student.id]"
                      type="number"
                      min="0"
                      max="100"
                      class="grade-input"
                      placeholder="0-100"
                    />
                  </td>
                  <td>
                    <button
                      @click="saveGradeForStudent(student)"
                      class="save-btn-small"
                      :disabled="!gradeInputs[student.id] || saving"
                    >
                      ✓
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="batch-actions">
            <button
              @click="saveAllGrades"
              class="save-all-btn"
              :disabled="!hasAnyGrades || saving"
            >
              {{ saving ? 'Сохранение...' : 'Сохранить все оценки' }}
            </button>
          </div>

          <div v-if="saveError" class="error-message">{{ saveError }}</div>
          <div v-if="saveSuccess" class="success-message">{{ saveSuccess }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { gradesApi, type CreateGradeDto } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import type { Student } from '~/entities/student'

const route = useRoute()
const subjectId = computed(() => parseInt(route.params.id as string))

const subject = ref<Subject | null>(null)
const groups = ref<Group[]>([])
const students = ref<Student[]>([])
const selectedGroup = ref<Group | null>(null)

const loading = ref(true)
const loadingStudents = ref(false)
const error = ref('')
const searchQuery = ref('')

// Batch controls
const batchGradeType = ref<'EXAM' | 'CREDIT' | 'COURSEWORK' | 'LAB' | 'TEST'>('EXAM')
const batchExamDate = ref(new Date().toISOString().split('T')[0])

// Grade inputs for each student
const gradeInputs = ref<Record<number, number>>({})

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

// Filtered groups based on search query
const filteredGroups = computed(() => {
  if (!groups.value || groups.value.length === 0) return []
  if (!searchQuery.value) return groups.value

  const query = searchQuery.value.toLowerCase()

  // Search by group name
  return groups.value.filter(g => g.name.toLowerCase().includes(query))
})

// Check if there are any grade inputs
const hasAnyGrades = computed(() => {
  return Object.values(gradeInputs.value).some(val => val > 0)
})

const formatGradeType = (type: string) => {
  const types: Record<string, string> = {
    EXAM: 'Экз',
    CREDIT: 'Зач',
    COURSEWORK: 'КР',
    LAB: 'Лаб',
    TEST: 'Тест',
  }
  return types[type] || type
}

const formatDate = (date?: string) => {
  if (!date) return 'Н/Д'
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getGradeClass = (value: number) => {
  if (value >= 90) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 50) return 'satisfactory'
  return 'poor'
}

const selectGroup = async (group: Group) => {
  selectedGroup.value = group
  loadingStudents.value = true
  saveError.value = ''
  saveSuccess.value = ''
  gradeInputs.value = {}

  try {
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(group.id, subjectId.value)
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки студентов'
  } finally {
    loadingStudents.value = false
  }
}

const backToGroups = () => {
  selectedGroup.value = null
  students.value = []
  gradeInputs.value = {}
  saveError.value = ''
  saveSuccess.value = ''
}

const saveGradeForStudent = async (student: Student) => {
  const gradeValue = gradeInputs.value[student.id]
  if (!gradeValue) return

  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    const gradeDto: CreateGradeDto = {
      studentId: student.id,
      subjectId: subjectId.value,
      gradeValue,
      gradeType: batchGradeType.value,
      examDate: batchExamDate.value,
    }

    await gradesApi.createGrade(gradeDto)

    // Reload students to get updated grades
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(selectedGroup.value!.id, subjectId.value)

    // Clear the input for this student
    delete gradeInputs.value[student.id]

    saveSuccess.value = `Оценка для ${student.lastName} ${student.firstName} сохранена`
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка сохранения оценки'
  } finally {
    saving.value = false
  }
}

const saveAllGrades = async () => {
  const gradesToSave: CreateGradeDto[] = []

  // Collect all non-empty grade inputs
  for (const [studentId, gradeValue] of Object.entries(gradeInputs.value)) {
    if (gradeValue > 0) {
      gradesToSave.push({
        studentId: parseInt(studentId),
        subjectId: subjectId.value,
        gradeValue,
        gradeType: batchGradeType.value,
        examDate: batchExamDate.value,
      })
    }
  }

  if (gradesToSave.length === 0) {
    saveError.value = 'Нет оценок для сохранения'
    return
  }

  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    await gradesApi.createBatchGrades(gradesToSave)

    // Reload students to get updated grades
    students.value = await gradesApi.fetchStudentsByGroupAndSubject(selectedGroup.value!.id, subjectId.value)

    // Clear all inputs
    gradeInputs.value = {}

    saveSuccess.value = `Успешно сохранено ${gradesToSave.length} оценок`
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (err: any) {
    saveError.value = err.message || 'Ошибка сохранения оценок'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [subjectData, groupsData] = await Promise.all([
      subjectsApi.fetchSubjectById(subjectId.value),
      gradesApi.fetchGroupsBySubject(subjectId.value),
    ])

    subject.value = subjectData
    groups.value = groupsData
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
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

/* Groups List View */
.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.group-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-card:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.group-info h3 {
  font-size: 20px;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.group-details {
  color: #718096;
  margin: 4px 0;
  font-size: 14px;
}

.group-faculty {
  color: #a0aec0;
  margin: 4px 0;
  font-size: 13px;
}

.group-arrow {
  font-size: 24px;
  color: #cbd5e0;
  font-weight: bold;
}

/* Students View */
.students-view {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.students-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-button {
  padding: 8px 16px;
  background: #e2e8f0;
  color: #2d3748;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.back-button:hover {
  background: #cbd5e0;
}

.students-header h2 {
  margin: 0;
  color: #2d3748;
}

.batch-controls {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 6px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.batch-select,
.batch-date {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.batch-select:focus,
.batch-date:focus {
  outline: none;
  border-color: #667eea;
}

/* Students Table */
.students-table-container {
  overflow-x: auto;
  margin-bottom: 24px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th,
.students-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.students-table th {
  background: #f7fafc;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.students-table td {
  color: #4a5568;
  font-size: 14px;
}

.student-name {
  font-weight: 500;
}

.existing-grades {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.grade-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.grade-badge.excellent {
  background: #d1fae5;
  color: #065f46;
}

.grade-badge.good {
  background: #dbeafe;
  color: #1e40af;
}

.grade-badge.satisfactory {
  background: #fef3c7;
  color: #92400e;
}

.grade-badge.poor {
  background: #fee2e2;
  color: #991b1b;
}

.no-grades {
  color: #a0aec0;
  font-size: 12px;
  font-style: italic;
}

.grade-input {
  width: 80px;
  padding: 6px 8px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.grade-input:focus {
  outline: none;
  border-color: #667eea;
}

.save-btn-small {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.save-btn-small:hover:not(:disabled) {
  background: #5568d3;
}

.save-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.save-all-btn {
  padding: 12px 24px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
}

.save-all-btn:hover:not(:disabled) {
  background: #38a169;
}

.save-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 6px;
  text-align: center;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: #f0fff4;
  color: #22543d;
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

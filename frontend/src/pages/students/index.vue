<template>
  <div class="students-page">
    <div class="container">
      <header class="header">
        <h1>Поиск студентов</h1>
        <NuxtLink to="/" class="back-button">На главную</NuxtLink>
      </header>

      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по ФИО или номеру зачётки..."
          class="search-input"
          @input="handleSearch"
        />
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="students.length === 0" class="empty">
        Студенты не найдены
      </div>

      <div v-else class="students-grid">
        <NuxtLink
          v-for="student in students"
          :key="student.id"
          :to="`/students/${student.id}`"
          class="student-card"
        >
          <h3>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</h3>
          <p class="info"><strong>Группа:</strong> {{ student.group }}</p>
          <p class="info"><strong>Зачётка:</strong> {{ student.studentId }}</p>
        </NuxtLink>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
          class="page-btn"
        >
          Назад
        </button>
        <span class="page-info">
          Страница {{ pagination.page }} из {{ pagination.totalPages }}
        </span>
        <button
          :disabled="pagination.page === pagination.totalPages"
          @click="changePage(pagination.page + 1)"
          class="page-btn"
        >
          Вперёд
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { studentsApi } from '~/features/students/api/studentsApi'
import type { Student } from '~/entities/student'

const searchQuery = ref('')
const students = ref<Student[]>([])
const loading = ref(false)
const error = ref('')

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
})

let searchTimeout: NodeJS.Timeout

const fetchStudents = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await studentsApi.fetchStudents({
      search: searchQuery.value || undefined,
      page: pagination.value.page,
      limit: pagination.value.limit,
    })

    students.value = response.data
    pagination.value.total = response.total
    pagination.value.totalPages = response.totalPages
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки студентов'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchStudents()
  }, 300)
}

const changePage = (page: number) => {
  pagination.value.page = page
  fetchStudents()
}

onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
.students-page {
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
  transition: background 0.3s;
}

.back-button:hover {
  background: #5568d3;
}

.search-section {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error {
  color: #e53e3e;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.student-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.student-card h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #2d3748;
}

.student-card .info {
  font-size: 14px;
  color: #718096;
  margin: 6px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #5568d3;
}

.page-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #2d3748;
}
</style>

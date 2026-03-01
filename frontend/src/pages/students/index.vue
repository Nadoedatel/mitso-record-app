<template>
  <div class="students-page">
    <Container maxWidth="xl">
      <Header title="Поиск студентов">
        <template #actions>
          <Button variant="secondary" @click="$router.push('/')">На главную</Button>
        </template>
      </Header>

      <div class="search-section">
        <SearchInput
          v-model="searchQuery"
          placeholder="Поиск по ФИО или номеру зачётки..."
          @update:modelValue="handleSearch"
        />
      </div>

      <LoadingState v-if="loading" message="Загрузка студентов..." />

      <Alert v-else-if="error" variant="error" :title="error" closable @close="error = ''" />

      <EmptyState v-else-if="students.length === 0" message="Студенты не найдены" />

      <div v-else class="students-grid">
        <NuxtLink
          v-for="student in students"
          :key="student.id"
          :to="`/students/${student.id}`"
          class="student-link"
        >
          <Card hoverable>
            <h3 class="student-name">
              {{ student.lastName }} {{ student.firstName }} {{ student.middleName }}
            </h3>
            <p class="info"><strong>Группа:</strong> {{ student.group?.name || '-' }}</p>
            <p class="info"><strong>Зачётка:</strong> {{ student.studentId }}</p>
          </Card>
        </NuxtLink>
      </div>

      <Pagination
        v-if="pagination.totalPages > 1"
        :currentPage="pagination.page"
        :totalPages="pagination.totalPages"
        @update:currentPage="changePage"
      />
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { studentsApi } from '~/features/students/api/studentsApi'
import type { Student } from '~/entities/student'
import {
  Container,
  Header,
  Button,
  SearchInput,
  Card,
  Pagination,
  LoadingState,
  EmptyState,
  Alert,
} from '~/shared/ui'

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
  background: var(--color-background);
  padding: var(--spacing-5);
}

.search-section {
  margin-bottom: var(--spacing-6);
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-6);
}

.student-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.student-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-2) 0;
}
</style>

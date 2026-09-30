<template>
  <div class="students-page">
    <Container maxWidth="xl">
      <Header title="Поиск студентов">
        <template #actions>
          <Button variant="secondary" @click="$router.push(homeRoute)">На главную</Button>
        </template>
      </Header>

      <div class="search-section">
        <SearchInput
          v-model="searchQuery"
          :debounce="300"
          placeholder="Поиск по ФИО или номеру зачётки..."
          @update:modelValue="load({ resetPage: true })"
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
        v-if="totalPages > 1"
        :currentPage="page"
        :totalPages="totalPages"
        @update:currentPage="changePage"
      />
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { studentsApi } from '~/features/students/api/studentsApi'
import { useAuthStore } from '~/features/auth/model/useAuth'
import type { Student } from '~/entities/student'
import { getHomeRoute } from '~/entities/user'
import { usePagedList } from '~/shared/lib/usePagedList'
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

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const homeRoute = computed(() => getHomeRoute(authStore.user?.role))

const {
  items: students,
  loading,
  error,
  search: searchQuery,
  page,
  totalPages,
  load,
  changePage,
} = usePagedList<Student>((query, signal) => studentsApi.fetchStudents(query, signal), { limit: 12 })

onMounted(() => load())
</script>

<style scoped>
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

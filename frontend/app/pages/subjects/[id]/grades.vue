<template>
  <div class="grades-management-page">
    <Container maxWidth="xl">
      <div class="header-wrapper">
        <Button variant="ghost" @click="$router.push('/teacher')">
          ← Назад к предметам
        </Button>
        <Header v-if="subject" :title="subject.name">
          <template #actions>
            <p class="subtitle">Управление оценками • Семестр {{ subject.semester }}</p>
          </template>
        </Header>
      </div>

      <LoadingState v-if="loading" message="Загрузка данных..." />

      <Alert v-else-if="error" variant="error" :title="error" />

      <div v-else class="content">
        <!-- Step 1: Groups List View -->
        <div v-if="!selectedGroup" class="groups-view">
          <SearchInput
            v-model="searchQuery"
            placeholder="Поиск по группе..."
          />

          <EmptyState v-if="filteredGroups.length === 0" message="Группы не найдены" />

          <div v-else class="groups-list">
            <Card
              v-for="group in filteredGroups"
              :key="group.id"
              hoverable
              clickable
              class="group-card"
              @click="selectedGroup = group"
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
            </Card>
          </div>
        </div>

        <!-- Step 2: batch grade entry for the selected group -->
        <Section v-else>
          <div class="students-header">
            <Button variant="secondary" @click="selectedGroup = null">← Назад к группам</Button>
            <h2 class="group-title">{{ selectedGroup.name }}</h2>
          </div>

          <GradeEntryPanel :subject-id="subjectId" :group-id="selectedGroup.id" />
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { gradesApi } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import { GradeEntryPanel } from '~/widgets/grades'
import {
  Container,
  Header,
  Button,
  Section,
  SearchInput,
  Card,
  Alert,
  LoadingState,
  EmptyState,
} from '~/shared/ui'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const subjectId = Number(route.params.id)
if (!Number.isInteger(subjectId)) {
  throw createError({ statusCode: 404, statusMessage: 'Предмет не найден', fatal: true })
}

const { data, status, error: loadError } = useAsyncData(`subject-${subjectId}`, async () => {
  const [subject, groups] = await Promise.all([
    subjectsApi.fetchSubjectById(subjectId),
    gradesApi.fetchGroupsBySubject(subjectId),
  ])
  return { subject, groups }
})
const subject = computed<Subject | null>(() => data.value?.subject ?? null)
const groups = computed<Group[]>(() => data.value?.groups ?? [])
const loading = computed(() => status.value === 'pending')
const error = computed(() => loadError.value?.message ?? '')

const selectedGroup = ref<Group | null>(null)
const searchQuery = ref('')

const filteredGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return groups.value
  return groups.value.filter((g) => g.name.toLowerCase().includes(query))
})
</script>

<style scoped>
.header-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* Groups List View */
.groups-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.group-card {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-info h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.group-details {
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0;
  font-size: var(--font-size-sm);
}

.group-faculty {
  color: var(--color-text-tertiary);
  margin: var(--spacing-1) 0;
  font-size: var(--font-size-xs);
}

.group-arrow {
  font-size: var(--font-size-2xl);
  color: var(--color-border);
  font-weight: var(--font-weight-bold);
}

/* Students View */
.students-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-5);
}

.group-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

</style>

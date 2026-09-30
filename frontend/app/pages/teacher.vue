<template>
  <div class="teacher-page">
    <Container maxWidth="xl">
      <Header
        v-if="authStore.user?.teacher"
        :title="`${authStore.user.teacher.lastName} ${authStore.user.teacher.firstName}`"
      >
        <template #actions>
          <p v-if="authStore.user?.teacher" class="subtitle">
            {{ authStore.user.teacher.position }} • {{ authStore.user.teacher.department }}
          </p>
          <Button variant="danger" @click="logout">Выйти</Button>
        </template>
      </Header>

      <LoadingState v-if="loading" message="Загрузка данных преподавателя..." />

      <Alert v-else-if="error" variant="error" :title="error" />

      <div v-else class="content">
        <InfoCard
          v-if="authStore.user?.teacher"
          title="Информация о преподавателе"
          :items="teacherInfoItems"
        />

        <Section title="Мои предметы">
          <SubjectsGrid :subjects="subjects" @view-subject="viewSubjectDetails" />
        </Section>

        <Section title="Выставление оценок">
          <FormField label="Выберите предмет" html-for="subject-select">
            <Select
              id="subject-select"
              :model-value="selectedSubjectId"
              :options="subjectOptions"
              placeholder="-- Выберите предмет --"
              fullWidth
              @update:model-value="onSubjectChange"
            />
          </FormField>

          <FormField
            v-if="selectedSubjectId && groups.length > 0"
            label="Выберите группу"
            html-for="group-select"
          >
            <Select
              id="group-select"
              :model-value="selectedGroupId"
              :options="groupOptions"
              placeholder="-- Выберите группу --"
              fullWidth
              @update:model-value="onGroupChange"
            />
          </FormField>

          <LoadingState
            v-if="selectedSubjectId && groupsLoading"
            message="Загрузка групп..."
            size="sm"
          />
          <Alert v-if="groupsError" variant="error" :title="groupsError" />

          <template v-if="selectedGroupId">
            <h3 class="table-title">Студенты группы {{ selectedGroupName }}</h3>
            <GradeEntryPanel :subject-id="selectedSubjectId" :group-id="selectedGroupId" />
          </template>
        </Section>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { subjectsApi } from '~/features/subjects/api/subjectsApi'
import { gradesApi } from '~/features/grades/api/gradesApi'
import type { Subject } from '~/entities/subject'
import type { Group } from '~/entities/group'
import { SubjectsGrid } from '~/widgets/teacher'
import { GradeEntryPanel } from '~/widgets/grades'
import {
  Container,
  Header,
  Button,
  LoadingState,
  Alert,
  InfoCard,
  Section,
  FormField,
  Select,
} from '~/shared/ui'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const router = useRouter()

const teacherProfileId = computed(() => authStore.user?.teacher?.id)

const { data: subjectsData, status, error: subjectsError } = useAsyncData(
  'teacher-subjects',
  () => subjectsApi.fetchSubjects({ teacherId: teacherProfileId.value!, limit: 500 }),
  { immediate: !!teacherProfileId.value },
)
const subjects = computed<Subject[]>(() => subjectsData.value?.data ?? [])
const loading = computed(() => status.value === 'pending')
const error = computed(() =>
  teacherProfileId.value ? (subjectsError.value?.message ?? '') : 'Профиль преподавателя не найден',
)

// Subject -> group selection for grade entry (<select> emits strings, hence Number())
const selectedSubjectId = ref<number | null>(null)
const selectedGroupId = ref<number | null>(null)
const groups = ref<Group[]>([])
const groupsLoading = ref(false)
const groupsError = ref('')
let groupsToken = 0

const subjectOptions = computed(() =>
  subjects.value.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
)
const groupOptions = computed(() =>
  groups.value.map((g) => ({ value: g.id, label: `${g.name} (${g.studentCount || 0} студентов)` })),
)
const selectedGroupName = computed(
  () => groups.value.find((g) => g.id === selectedGroupId.value)?.name ?? selectedGroupId.value,
)

async function onSubjectChange(value: number | null) {
  const token = ++groupsToken
  selectedSubjectId.value = value ? Number(value) : null
  selectedGroupId.value = null
  groups.value = []
  groupsError.value = ''
  if (!selectedSubjectId.value) return

  groupsLoading.value = true
  try {
    const result = await gradesApi.fetchGroupsBySubject(selectedSubjectId.value)
    if (token === groupsToken) groups.value = result
  } catch (err: unknown) {
    if (token === groupsToken) {
      groupsError.value = err instanceof Error ? err.message : 'Ошибка загрузки групп'
    }
  } finally {
    if (token === groupsToken) groupsLoading.value = false
  }
}

function onGroupChange(value: number | null) {
  selectedGroupId.value = value ? Number(value) : null
}

const teacherInfoItems = computed(() => {
  if (!authStore.user?.teacher) return []
  const t = authStore.user.teacher
  const items = [
    { label: 'ФИО', value: `${t.lastName} ${t.firstName} ${t.middleName}` },
    { label: 'Кафедра', value: t.department },
    { label: 'Должность', value: t.position },
  ]
  if (t.academicDegree) items.push({ label: 'Учёная степень', value: t.academicDegree })
  if (t.phone) items.push({ label: 'Телефон', value: t.phone })
  if (t.officeNumber) items.push({ label: 'Кабинет', value: t.officeNumber })
  return items
})

function viewSubjectDetails(subject: Subject) {
  router.push(`/subjects/${subject.id}/grades`)
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.subtitle {
  color: var(--color-text-secondary);
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.table-title {
  margin: var(--spacing-5) 0 var(--spacing-4) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

</style>

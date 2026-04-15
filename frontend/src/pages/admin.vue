<template>
  <div class="admin-page">
    <Container maxWidth="full">
      <Header title="Панель администратора">
        <template #actions>
          <Button variant="danger" @click="logout">Выйти</Button>
        </template>
      </Header>

      <Tabs :tabs="tabs" v-model="activeTab" />

      <div class="tab-content">
        <StudentsSection v-if="activeTab === 'students'" />
        <TeachersSection v-if="activeTab === 'teachers'" />
        <SubjectsSection v-if="activeTab === 'subjects'" />
        <GroupsSection v-if="activeTab === 'groups'" />
        <FacultiesSection v-if="activeTab === 'faculties'" />
        <SpecializationsSection v-if="activeTab === 'specializations'" />
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { Container, Header, Button, Tabs } from '~/shared/ui'
import {
  StudentsSection,
  TeachersSection,
  SubjectsSection,
  GroupsSection,
  FacultiesSection,
  SpecializationsSection,
} from '~/widgets/admin'

definePageMeta({
  middleware: 'admin',
})

const router = useRouter()
const authStore = useAuthStore()

const tabs = [
  { key: 'students', label: 'Студенты' },
  { key: 'teachers', label: 'Преподаватели' },
  { key: 'subjects', label: 'Дисциплины' },
  { key: 'groups', label: 'Группы' },
  { key: 'faculties', label: 'Факультеты' },
  { key: 'specializations', label: 'Специализации' },
]

const activeTab = ref('students')

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: var(--spacing-5);
}

.tab-content {
  margin-top: var(--spacing-5);
}
</style>

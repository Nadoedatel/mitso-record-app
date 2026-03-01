<template>
  <div class="home-page">
    <LoadingState v-if="loading" message="Загрузка профиля..." />

    <Card v-else-if="error" variant="elevated" padding="lg">
      <Alert variant="error" :title="error" />
      <div class="error-actions">
        <Button variant="danger" @click="handleLogout">Выйти</Button>
      </div>
    </Card>

    <Card v-else-if="user" variant="elevated" padding="lg" class="welcome-card">
      <div class="card-header">
        <h1 class="title">MITSO Record App</h1>
        <Button variant="danger" @click="handleLogout">Выход</Button>
      </div>

      <div class="welcome">
        <h2>Добро пожаловать, {{ user.email }}!</h2>
        <Badge variant="primary" size="md" pill>
          {{ user.role === 'TEACHER' ? 'Преподаватель' : 'Студент' }}
        </Badge>
      </div>

      <Section title="Навигация">
        <div class="nav-buttons">
          <NuxtLink
            v-if="user.role === 'STUDENT'"
            to="/student"
            class="nav-button"
          >
            Моя зачётная книжка
          </NuxtLink>
          <NuxtLink
            v-if="user.role === 'TEACHER'"
            to="/teacher"
            class="nav-button"
          >
            Управление оценками
          </NuxtLink>
        </div>
      </Section>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import type { User } from '~/entities/user'
import {
  LoadingState,
  Card,
  Alert,
  Button,
  Badge,
  Section,
} from '~/shared/ui'

const router = useRouter()
const httpClient = useHttpClient()
const authStore = useAuthStore()

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const token = httpClient.getAccessToken()

  if (!token) {
    router.push('/login')
    return
  }

  try {
    // Fetch profile through auth store
    user.value = await authStore.fetchProfile()
    // Also set the token in auth store if it exists
    if (token && user.value) {
      authStore.setAuth(user.value, token)
    }
  } catch (err: any) {
    error.value = 'Не удалось загрузить профиль пользователя'
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (err) {
    console.error('Logout error:', err)
    // Even if logout fails, clear local state and redirect
    httpClient.setAccessToken(null)
    await router.push('/login')
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  padding: var(--spacing-5);
}

.welcome-card {
  max-width: 600px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.error-actions {
  margin-top: var(--spacing-4);
  display: flex;
  justify-content: center;
}

.welcome {
  margin-bottom: var(--spacing-6);
  text-align: center;
}

.welcome h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.nav-button {
  display: block;
  padding: var(--spacing-4);
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: transform 0.3s, box-shadow 0.3s;
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>

<template>
  <div class="home-page">
    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="error" class="error-container">
      <p class="error">{{ error }}</p>
      <button @click="handleLogout" class="logout-button">Выйти</button>
    </div>

    <div v-else-if="user" class="container">
      <div class="header">
        <h1 class="title">MITSO Record App</h1>
        <button @click="handleLogout" class="logout-button">Выход</button>
      </div>

      <div class="welcome">
        <h2>Добро пожаловать, {{ user.email }}!</h2>
        <p class="role-badge">{{ user.role === 'TEACHER' ? 'Преподаватель' : 'Студент' }}</p>
      </div>

      <div class="navigation">
        <h3>Навигация</h3>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import type { User } from '~/entities/user'

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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
}

.loading {
  font-size: 18px;
  color: #666;
}

.error {
  color: #e53e3e;
  background: #fff5f5;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.logout-button {
  padding: 10px 20px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-button:hover {
  background: #c53030;
}

.welcome {
  margin-bottom: 30px;
  text-align: center;
}

.welcome h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.role-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.navigation {
  margin-top: 40px;
}

.navigation h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-button {
  display: block;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>

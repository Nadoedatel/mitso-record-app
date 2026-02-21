<template>
  <div class="home-page">
    <div class="container">
      <h1 class="title">MITSO Record App</h1>
      <p class="subtitle">Выберите роль для входа</p>

      <div v-if="!showLoginForm" class="role-selection">
        <button @click="selectRole('student')" class="role-button">
          Студент
        </button>
        <button @click="selectRole('teacher')" class="role-button">
          Преподаватель
        </button>
      </div>

      <div v-else class="login-form">
        <h2>Вход как {{ selectedRole === 'student' ? 'Студент' : 'Преподаватель' }}</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="example@mitso.by"
            />
          </div>

          <div class="form-group">
            <label for="password">Пароль:</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••"
            />
          </div>

          <div v-if="error" class="error">{{ error }}</div>

          <div class="buttons">
            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? 'Вход...' : 'Войти' }}
            </button>
            <button type="button" @click="showLoginForm = false" class="back-button">
              Назад
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { storage } from '~/shared/lib/storage'

const authStore = useAuthStore()
const router = useRouter()

const showLoginForm = ref(false)
const selectedRole = ref<'student' | 'teacher'>('student')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function selectRole(role: 'student' | 'teacher') {
  selectedRole.value = role
  showLoginForm.value = true
  error.value = ''
}

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login({ email: email.value, password: password.value })

    // Save role to local storage
    storage.setUserRole(selectedRole.value)

    // Redirect to appropriate page
    router.push(`/${selectedRole.value}`)
  } catch (err: any) {
    error.value = err.message || 'Ошибка входа. Проверьте данные.'
  } finally {
    loading.value = false
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

.container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.role-selection {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.role-button {
  flex: 1;
  padding: 20px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.role-button:hover {
  background: #667eea;
  color: white;
}

.login-form {
  margin-top: 20px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error {
  color: #e53e3e;
  background: #fff5f5;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
}

.buttons {
  display: flex;
  gap: 12px;
}

.submit-button,
.back-button {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.submit-button {
  background: #667eea;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: #5568d3;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-button {
  background: #e0e0e0;
  color: #333;
}

.back-button:hover {
  background: #d0d0d0;
}
</style>

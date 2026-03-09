<template>
  <div class="login-page">
    <Container maxWidth="sm" class="login-container">
      <Card class="login-card">
        <div class="login-header">
          <h2>MITSO Record App</h2>
          <p class="subtitle">Войдите в систему учёта зачётных книжек</p>
        </div>

        <Alert v-if="error" variant="error" :title="error" closable @close="error = ''" />

        <Form class="login-form" @submit="handleLogin">
          <FormField label="Email" required>
            <Input
              v-model="email"
              type="email"
              placeholder="Email адрес"
              autocomplete="email"
              required
            />
          </FormField>

          <FormField label="Пароль" required>
            <Input
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              autocomplete="current-password"
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            :loading="loading"
            :disabled="loading"
          >
            {{ loading ? 'Вход...' : 'Войти' }}
          </Button>
        </Form>
      </Card>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { useHttpClient } from '~/shared/api/httpClient'
import {
  Container,
  Card,
  Input,
  Button,
  Alert,
  Form,
  FormField,
} from '~/shared/ui'

const router = useRouter()
const httpClient = useHttpClient()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.login({
      email: email.value,
      password: password.value,
    })

    // Redirect based on user role
    if (response.user.role === 'ADMIN') {
      router.push('/admin')
    } else if (response.user.role === 'TEACHER') {
      router.push('/teacher')
    } else {
      router.push('/student')
    }
  } catch (err: any) {
    error.value = err.message || 'Неверный email или пароль'
  } finally {
    loading.value = false
  }
}

// Check if already logged in
onMounted(() => {
  const token = httpClient.getAccessToken()
  if (token) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
  padding: var(--spacing-10);
}

.login-container {
  width: 30%;
}

.login-card {
  padding: var(--spacing-8);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.login-header h2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.login-form {
  align-items: center;
  margin-top: var(--spacing-6);
}
</style>

<template>
  <Container maxWidth="sm" class="login-container">
    <Card class="login-card">
      <div class="login-header">
        <h2>MITSO Record App</h2>
        <p class="subtitle">Войдите в систему учёта зачётных книжек</p>
      </div>

      <Alert v-if="error" variant="error" :title="error" closable @close="error = ''" />

      <Form v-if="challengeToken" class="login-form" @submit="handleTwoFactor">
        <p class="two-factor-hint">
          Введите 6-значный код из приложения-аутентификатора или резервный код.
        </p>
        <FormField label="Код подтверждения" required>
          <Input
            v-model="code"
            type="text"
            inputmode="text"
            placeholder="123456"
            autocomplete="one-time-code"
            required
          />
        </FormField>

        <Button type="submit" variant="primary" fullWidth :loading="loading" :disabled="loading">
          {{ loading ? 'Проверка...' : 'Подтвердить' }}
        </Button>
        <Button type="button" variant="ghost" fullWidth :disabled="loading" @click="backToPassword">
          Назад
        </Button>
      </Form>

      <Form v-else class="login-form" @submit="handleLogin">
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { getHomeRoute } from '~/entities/user'
import {
  Container,
  Card,
  Input,
  Button,
  Alert,
  Form,
  FormField,
} from '~/shared/ui'

definePageMeta({ layout: 'centered' })

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
// Set after the password step when the account has the second factor on
const challengeToken = ref('')
const code = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.login({
      email: email.value,
      password: password.value,
    })

    if ('twoFactorRequired' in response) {
      challengeToken.value = response.challengeToken
      password.value = ''
      return
    }

    router.push(getHomeRoute(response.user.role))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Неверный email или пароль'
  } finally {
    loading.value = false
  }
}

const handleTwoFactor = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.completeTwoFactor(challengeToken.value, code.value.trim())
    router.push(getHomeRoute(response.user.role))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Не удалось подтвердить код'
  } finally {
    loading.value = false
  }
}

const backToPassword = () => {
  challengeToken.value = ''
  code.value = ''
  error.value = ''
}

// Already logged in (session hint present): restore the session and skip the form
onMounted(async () => {
  if (!authStore.hasSessionHint()) return
  if (await authStore.restoreSession() && authStore.user) {
    router.push(getHomeRoute(authStore.user.role))
  }
})
</script>

<style scoped>
.login-container {
  width: 100%;
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

.two-factor-hint {
  margin: 0 0 var(--spacing-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>

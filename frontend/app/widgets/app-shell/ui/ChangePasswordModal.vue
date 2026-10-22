<template>
  <Modal :model-value="modelValue" size="sm" title="Смена пароля" @update:model-value="close">
    <!-- novalidate: errors come from validatePasswordChange under the fields, not from browser bubbles -->
    <Form class="change-password-modal" novalidate @submit="submit">
      <Alert v-if="error" variant="error" :title="error" />

      <p class="hint">После смены пароля все сеансы завершатся: войдите заново с новым паролем.</p>
      <p class="hint">
        Неверный текущий пароль считается неудачной попыткой входа: после {{ LOGIN_ATTEMPTS_BEFORE_LOCK }} ошибок подряд
        вход временно блокируется.
      </p>

      <FormField label="Текущий пароль" required :error="shownErrors.currentPassword">
        <Input v-model="currentPassword" type="password" autocomplete="current-password" required />
      </FormField>
      <FormField label="Новый пароль" required :hint="`Не короче ${PASSWORD_MIN_LENGTH} символов`" :error="shownErrors.newPassword">
        <Input v-model="newPassword" type="password" autocomplete="new-password" required />
      </FormField>
      <FormField label="Повторите новый пароль" required :error="shownErrors.confirmPassword">
        <Input v-model="confirmPassword" type="password" autocomplete="new-password" required />
      </FormField>

      <div class="row">
        <Button variant="secondary" type="button" :disabled="busy" @click="close">Отмена</Button>
        <Button variant="primary" type="submit" :loading="busy" :disabled="busy">Сменить пароль</Button>
      </div>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/model/useAuth'
import { PASSWORD_MIN_LENGTH, validatePasswordChange } from '~/features/auth/model/passwordChange'
import { useToast } from '~/shared/lib/useToast'
import { Alert, Button, Form, FormField, Input, Modal } from '~/shared/ui'

/** Change own password; the backend ends every session, so on success the user goes to the login page */
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

/** Failed attempts before the backend locks the login (MAX_FAILURES in backend login-attempts.service.ts) */
const LOGIN_ATTEMPTS_BEFORE_LOCK = 5

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitted = ref(false)
const busy = ref(false)
const error = ref('')

const errors = computed(() => validatePasswordChange(currentPassword.value, newPassword.value, confirmPassword.value))
// Field errors appear after the first submit, not while the user is still typing
const shownErrors = computed(() => (submitted.value ? errors.value : {}))

async function submit() {
  submitted.value = true
  if (Object.keys(errors.value).length > 0) return

  busy.value = true
  error.value = ''
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    busy.value = false
    close()
    toast.success('Пароль изменён. Войдите с новым паролем')
    await router.push('/login')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Не удалось сменить пароль'
  } finally {
    busy.value = false
  }
}

/** Clears the form; ignored while the request runs, so a late error cannot land in a closed (and later reopened) form */
function close() {
  if (busy.value) return
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  submitted.value = false
  error.value = ''
  emit('update:modelValue', false)
}
</script>

<style scoped>
.hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.row {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
</style>

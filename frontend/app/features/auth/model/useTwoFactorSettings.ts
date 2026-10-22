import { computed, ref } from 'vue'
import { authApi, type TwoFactorSetup } from '../api/authApi'
import { useAuthStore } from './useAuth'

type Step = 'idle' | 'setup' | 'codes'

/**
 * Settings of the second login factor for the signed-in admin:
 * idle (status, enable or disable) -> setup (secret, QR, first code) -> codes (recovery codes, shown once).
 */
export function useTwoFactorSettings() {
  const authStore = useAuthStore()

  const step = ref<Step>('idle')
  const setup = ref<TwoFactorSetup | null>(null)
  const recoveryCodes = ref<string[]>([])
  const code = ref('')
  const password = ref('')
  const busy = ref(false)
  const error = ref('')

  const enabled = computed(() => authStore.user?.twoFactorEnabled === true)

  /** Runs one action with the busy flag and the error text; true when it succeeded */
  async function attempt(action: () => Promise<void>): Promise<boolean> {
    busy.value = true
    error.value = ''
    try {
      await action()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
      return false
    } finally {
      busy.value = false
    }
  }

  function startSetup() {
    return attempt(async () => {
      setup.value = await authApi.setupTwoFactor()
      code.value = ''
      step.value = 'setup'
    })
  }

  /** Confirm the setup with the first code; the profile is reloaded so `enabled` turns true */
  function confirmSetup() {
    return attempt(async () => {
      recoveryCodes.value = await authApi.enableTwoFactor(code.value.trim())
      setup.value = null
      code.value = ''
      step.value = 'codes'
      await authStore.fetchProfile()
    })
  }

  function disable() {
    return attempt(async () => {
      await authApi.disableTwoFactor(password.value, code.value.trim())
      password.value = ''
      code.value = ''
      await authStore.fetchProfile()
    })
  }

  /** Back to the status view and forget everything secret (also when the window is closed) */
  function reset() {
    step.value = 'idle'
    setup.value = null
    recoveryCodes.value = []
    code.value = ''
    password.value = ''
    error.value = ''
  }

  return { step, setup, recoveryCodes, code, password, busy, error, enabled, startSetup, confirmSetup, disable, reset }
}

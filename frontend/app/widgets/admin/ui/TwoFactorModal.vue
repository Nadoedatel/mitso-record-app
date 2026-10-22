<template>
  <Modal :model-value="modelValue" size="md" title="Двухфакторная защита" @update:model-value="close" @close="close">
    <div class="two-factor-body">
      <Alert v-if="error" variant="error" :title="error" />

      <!-- Recovery codes: shown once, right after the setup is confirmed -->
      <template v-if="step === 'codes'">
        <Alert
          variant="warning"
          title="Сохраните резервные коды. Каждый работает один раз и нужен, если потеряете телефон. Повторно показать их нельзя."
        />
        <ul class="codes" aria-label="Резервные коды">
          <li v-for="item in recoveryCodes" :key="item"><code>{{ item }}</code></li>
        </ul>
        <div class="row">
          <Button variant="secondary" @click="downloadCodes">Скачать .txt</Button>
          <Button variant="primary" @click="close">Я сохранил коды</Button>
        </div>
      </template>

      <!-- Setup: scan the QR code, then prove it with the first code -->
      <Form v-else-if="step === 'setup' && setup" @submit="confirmSetup">
        <p class="hint">
          1. Откройте приложение-аутентификатор (Google Authenticator, Authy, 1Password) и отсканируйте QR-код.
        </p>
        <img class="qr" :src="setup.qrCode" alt="QR-код для приложения-аутентификатора" width="220" height="220" />
        <p class="hint">
          Не получается отсканировать? Введите ключ вручную: <code class="secret">{{ setup.secret }}</code>
        </p>
        <p class="hint">2. Введите 6-значный код из приложения, чтобы подтвердить настройку.</p>
        <FormField label="Код из приложения" required>
          <Input v-model="code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" required />
        </FormField>
        <div class="row">
          <Button variant="secondary" type="button" @click="reset">Отмена</Button>
          <Button variant="primary" type="submit" :loading="busy" :disabled="busy">Включить</Button>
        </div>
      </Form>

      <!-- On: how to turn it off -->
      <Form v-else-if="enabled" @submit="disable">
        <Alert variant="success" title="Двухфакторная защита включена: при входе нужен код из приложения." />
        <p class="hint">Чтобы отключить, введите пароль и код из приложения (или резервный код).</p>
        <FormField label="Пароль" required>
          <Input v-model="password" type="password" autocomplete="current-password" required />
        </FormField>
        <FormField label="Код" required>
          <Input v-model="code" autocomplete="one-time-code" placeholder="123456" required />
        </FormField>
        <div class="row">
          <Button variant="secondary" type="button" @click="close">Закрыть</Button>
          <Button variant="danger" type="submit" :loading="busy" :disabled="busy">Отключить</Button>
        </div>
      </Form>

      <!-- Off: offer to turn it on -->
      <template v-else>
        <p class="hint">
          Сейчас вход только по паролю. С двухфакторной защитой после пароля понадобится код из приложения на телефоне.
        </p>
        <div class="row">
          <Button variant="secondary" @click="close">Закрыть</Button>
          <Button variant="primary" :loading="busy" :disabled="busy" @click="startSetup">Включить</Button>
        </div>
      </template>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { useTwoFactorSettings } from '~/features/auth/model/useTwoFactorSettings'
import { downloadBlob } from '~/shared/lib/downloadBlob'
import { Alert, Button, Form, FormField, Input, Modal } from '~/shared/ui'

/** Turn the second login factor (authenticator app) on or off for the signed-in admin */
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { step, setup, recoveryCodes, code, password, busy, error, enabled, startSetup, confirmSetup, disable, reset } =
  useTwoFactorSettings()

function downloadCodes() {
  const text = `Резервные коды MITSO Record (каждый работает один раз)\n\n${recoveryCodes.value.join('\n')}\n`
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'mitso-recovery-codes.txt')
}

function close() {
  reset()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.two-factor-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.qr {
  align-self: center;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.secret {
  word-break: break-all;
  color: var(--color-text-primary);
}

.codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
  margin: 0;
  padding: var(--spacing-4);
  list-style: none;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
}

.codes code {
  color: var(--color-text-primary);
}

.row {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
</style>

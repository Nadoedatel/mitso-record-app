<template>
  <Modal :model-value="modelValue" size="lg" title="Импорт студентов из CSV" @update:model-value="close" @close="close">
    <div class="import-body">
      <p class="hint">
        Первая строка: названия колонок. Обязательные: email, password (от 8 символов), firstName, lastName,
        studentId, course, enrollmentYear. Разделитель запятая или точка с запятой.
        <Button variant="ghost" size="sm" @click="downloadTemplate">Скачать шаблон</Button>
      </p>

      <label class="file-field" for="students-csv">
        <span class="file-label">CSV-файл (до 1 МБ, до 1000 строк)</span>
        <input
          id="students-csv"
          class="file-input"
          type="file"
          accept=".csv,text/csv"
          :disabled="running"
          @change="onFileChange"
        />
      </label>

      <Alert v-if="error" variant="error" :title="error" />
      <Alert v-else-if="failedReason" variant="error" :title="failedReason" />

      <div v-if="running" class="progress">
        <progress max="100" :value="job?.progress ?? 0" aria-label="Ход импорта" />
        <span>{{ job?.progress ?? 0 }}%</span>
      </div>

      <template v-if="result">
        <Alert
          :variant="result.failed ? 'warning' : 'success'"
          :title="`Создано: ${result.created}, пропущено (уже есть): ${result.skipped}, с ошибками: ${result.failed}`"
        />
        <Table
          v-if="result.errors?.length"
          :columns="errorColumns"
          :data="result.errors"
          row-key="row"
          :hoverable="false"
          caption="Строки с ошибками"
        />
      </template>
    </div>

    <template #actions>
      <ModalActions>
        <Button variant="secondary" @click="close">Закрыть</Button>
        <Button variant="primary" :disabled="!file || running" :loading="running" @click="start">Импортировать</Button>
      </ModalActions>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStudentsImport } from '~/features/jobs/model/useStudentsImport'
import { downloadBlob } from '~/shared/lib/downloadBlob'
import { Alert, Button, Modal, ModalActions, Table } from '~/shared/ui'

/** Import of students from a CSV file; the job runs in the background, this modal shows its progress and result */
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; imported: [] }>()

const { job, error, running, result, failedReason, importFile, stop } = useStudentsImport()
const file = ref<File | null>(null)

const errorColumns = [
  { key: 'row', label: 'Строка', width: '6rem' },
  { key: 'reason', label: 'Причина' },
]

const TEMPLATE =
  'email,password,firstName,lastName,middleName,studentId,groupId,course,specializationId,enrollmentYear,phone,address,birthDate\n' +
  'ivan@mitso.by,password123,Иван,Иванов,Иванович,ST2025001,,1,,2025,,,2007-03-15\n'

function downloadTemplate() {
  // BOM so that Excel opens the Cyrillic example as UTF-8
  downloadBlob(new Blob(['﻿' + TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'students-template.csv')
}

function onFileChange(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function start() {
  if (!file.value) return
  const completed = await importFile(file.value)
  if (completed) emit('imported')
}

function close() {
  stop()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.import-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.file-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.file-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.file-input {
  color: var(--color-text-primary);
}

.progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  color: var(--color-text-secondary);
}

.progress progress {
  flex: 1;
  accent-color: var(--color-primary);
}
</style>

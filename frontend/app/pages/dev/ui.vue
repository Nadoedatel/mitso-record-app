<template>
  <Container max-width="xl">
    <Header title="Компоненты (только dev)" />
    <p class="note">Страница для проверки видов и состояний. В production сборку не попадает.</p>

    <Section>
      <h2>Кнопки</h2>
      <div class="row">
        <Button variant="primary">Основная</Button>
        <Button variant="secondary">Вторичная</Button>
        <Button variant="success">Успех</Button>
        <Button variant="danger">Удалить</Button>
        <Button variant="ghost">Прозрачная</Button>
        <Button variant="primary" disabled>Недоступна</Button>
        <Button variant="primary" loading>Загрузка</Button>
        <Button variant="primary" size="sm">Мелкая</Button>
        <Button variant="primary" size="lg">Крупная</Button>
      </div>
    </Section>

    <Section>
      <h2>Поля и подписи</h2>
      <p class="note">Подпись связана с полем: клик по ней ставит курсор, ошибка читается скринридером.</p>
      <div class="grid">
        <FormField label="Фамилия" required hint="Как в паспорте">
          <Input v-model="text" />
        </FormField>
        <FormField label="Email" required error="Укажите корректный email">
          <Input v-model="email" type="email" />
        </FormField>
        <FormField label="Группа">
          <Select v-model="group" :options="groupOptions" placeholder="Выберите группу" />
        </FormField>
        <FormField label="Поиск">
          <SearchInput v-model="search" clearable />
        </FormField>
        <FormField label="Недоступное поле">
          <Input model-value="Нельзя менять" disabled />
        </FormField>
      </div>
    </Section>

    <Section>
      <h2>Сообщения</h2>
      <div class="stack">
        <Alert variant="info">Информация для пользователя</Alert>
        <Alert variant="success">Данные сохранены</Alert>
        <Alert variant="warning" title="Внимание">До конца сессии осталось 5 минут</Alert>
        <Alert variant="error" closable>Не удалось сохранить, повторите позже</Alert>
      </div>
      <div class="row">
        <Button variant="secondary" @click="toast.success('Сохранено')">Тост успеха</Button>
        <Button variant="secondary" @click="toast.error('Ошибка при сохранении')">Тост ошибки</Button>
        <Button variant="secondary" @click="askConfirm">Подтверждение</Button>
        <Button variant="secondary" @click="modalOpen = true">Модальное окно</Button>
      </div>
    </Section>

    <Section>
      <h2>Таблица</h2>
      <p class="note">Сортировка по клику на заголовок (Имя, Группа, Оценка). Если окно уже 640px, строки становятся карточками.</p>
      <Table :columns="columns" :data="rows" row-key="id" :hoverable="true" caption="Студенты">
        <template #cell-score="{ value }">
          <Badge :variant="scoreVariant(value)">{{ value ?? '—' }}</Badge>
        </template>
        <template #cell-actions>
          <Button size="sm" variant="secondary">Открыть</Button>
        </template>
      </Table>
      <h3>Загрузка</h3>
      <Table :columns="columns" :data="[]" loading />
      <h3>Пусто</h3>
      <Table :columns="columns" :data="[]" empty-text="Студентов пока нет" />
      <h3>Закреплённая шапка (maxHeight 160px)</h3>
      <Table :columns="columns" :data="rows" row-key="id" max-height="160px" />
    </Section>

    <Section>
      <h2>Навигация и бейджи</h2>
      <Tabs v-model="tab" :tabs="tabs" />
      <div class="row">
        <Badge variant="primary">primary</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="danger">danger</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="secondary">secondary</Badge>
        <GradeTypeBadge type="EXAM" />
        <GradeTypeBadge type="CREDIT" />
        <GradeTypeBadge type="LAB" />
      </div>
      <Pagination v-model:current-page="page" :total-pages="8" :total="73" />
    </Section>

    <Section>
      <h2>Состояния загрузки</h2>
      <div class="grid">
        <Card><Skeleton :lines="3" /></Card>
        <Card><LoadingState message="Загружаем оценки..." /></Card>
        <Card><EmptyState message="Нет оценок" description="Оценки появятся после сессии" /></Card>
      </div>
    </Section>

    <Section>
      <h2>Иконки</h2>
      <div class="row icons">
        <span v-for="name in iconNames" :key="name" class="icon-cell">
          <Icon :name="name" :size="22" />
          <small>{{ name }}</small>
        </span>
      </div>
    </Section>

    <Modal v-model="modalOpen" title="Новая группа">
      <FormField label="Название" required>
        <Input v-model="text" />
      </FormField>
      <FormField label="Курс">
        <Select v-model="group" :options="groupOptions" />
      </FormField>
      <template #actions>
        <Button variant="secondary" @click="modalOpen = false">Отмена</Button>
        <Button variant="primary" @click="modalOpen = false">Сохранить</Button>
      </template>
    </Modal>
  </Container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  FormField,
  GradeTypeBadge,
  Header,
  Icon,
  icons,
  Input,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  Section,
  Select,
  Skeleton,
  Table,
  Tabs,
} from '~/shared/ui'
import { useConfirm } from '~/shared/lib/useConfirm'
import { useToast } from '~/shared/lib/useToast'

// Dev-only page; nuxt.config.ts removes the route from the production build
definePageMeta({ layout: 'default' })

const toast = useToast()
const { confirm } = useConfirm()

const text = ref('')
const email = ref('ivanov@')
const group = ref('')
const search = ref('')
const modalOpen = ref(false)
const tab = ref('one')
const page = ref(2)

const groupOptions = [
  { value: 'is21', label: 'ИС-21' },
  { value: 'is22', label: 'ИС-22' },
]
const tabs = [
  { key: 'one', label: 'Студенты' },
  { key: 'two', label: 'Преподаватели' },
  { key: 'three', label: 'Группы' },
]
const iconNames = Object.keys(icons) as (keyof typeof icons)[]

const columns = [
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'group', label: 'Группа', sortable: true },
  { key: 'score', label: 'Оценка', sortable: true, align: 'center' as const },
  { key: 'actions', label: '' },
]
const rows = [
  { id: 1, name: 'Петрова Мария', group: 'ИС-10', score: 8 },
  { id: 2, name: 'Иванов Иван', group: 'ИС-2', score: 9 },
  { id: 3, name: 'Яковлев Сергей', group: 'ИС-2', score: 5 },
  { id: 4, name: 'Сидоров Александр', group: 'ИС-10', score: null },
]

function scoreVariant(value: unknown) {
  if (typeof value !== 'number') return 'secondary'
  return value >= 8 ? 'success' : value >= 5 ? 'warning' : 'danger'
}

async function askConfirm() {
  const ok = await confirm({ title: 'Удалить группу?', message: 'Студенты останутся без группы.' })
  toast[ok ? 'success' : 'error'](ok ? 'Удалено' : 'Отменено')
}
</script>

<style scoped>
.note {
  margin-bottom: var(--spacing-4);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

h2 {
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-lg);
}

h3 {
  margin: var(--spacing-5) 0 var(--spacing-2);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
  margin: var(--spacing-3) 0;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-4);
}

.icon-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 96px;
  color: var(--color-text-secondary);
}
</style>

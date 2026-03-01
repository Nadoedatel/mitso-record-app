# Shared UI Components

Переиспользуемая библиотека UI компонентов для MITSO Record App.

## Установка

Все компоненты экспортируются через `@/shared/ui`:

```typescript
import { Button, Input, Modal, Table } from '@/shared/ui'
```

## Дизайн-система

Компоненты используют единую дизайн-систему на основе CSS переменных из `tokens.css`:

- **Цвета**: primary, secondary, success, danger, warning, info
- **Размеры**: sm, md, lg
- **Отступы**: spacing-1 до spacing-20
- **Тени**: shadow-sm до shadow-2xl
- **Border radius**: radius-sm до radius-full

## Компоненты

### Form Components

#### Button

```vue
<Button variant="primary" size="md">Нажми меня</Button>
<Button variant="danger" loading>Загрузка...</Button>
<Button variant="secondary" disabled>Недоступно</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean

#### Input

```vue
<Input v-model="name" placeholder="Введите имя" />
<Input v-model="email" type="email" error="Неверный email" />
<SearchInput v-model="search" @search="handleSearch" />
<NumberInput v-model="age" :min="0" :max="100" />
```

**Props:**
- `modelValue`: string | number
- `type`: 'text' | 'email' | 'password' | 'number'
- `size`: 'sm' | 'md' | 'lg'
- `error`: boolean
- `errorMessage`: string
- `placeholder`: string
- `disabled`: boolean
- `fullWidth`: boolean

#### Select

```vue
<Select
  v-model="selectedOption"
  :options="[
    { value: '1', label: 'Вариант 1' },
    { value: '2', label: 'Вариант 2' }
  ]"
  placeholder="Выберите опцию"
/>
```

**Props:**
- `modelValue`: string | number
- `options`: Array<{ value, label, disabled? }>
- `placeholder`: string
- `size`: 'sm' | 'md' | 'lg'
- `error`: boolean
- `disabled`: boolean

#### Form, FormField, FormRow

```vue
<Form @submit="handleSubmit">
  <FormRow :columns="2" gap="md">
    <FormField label="Имя" required>
      <Input v-model="firstName" />
    </FormField>
    <FormField label="Фамилия" error="Обязательное поле">
      <Input v-model="lastName" />
    </FormField>
  </FormRow>

  <FormField label="Email" hint="Мы не будем спамить">
    <Input v-model="email" type="email" />
  </FormField>

  <Button type="submit">Отправить</Button>
</Form>
```

**FormField Props:**
- `label`: string
- `for`: string
- `required`: boolean
- `error`: string
- `hint`: string

**FormRow Props:**
- `columns`: number (default: 2)
- `gap`: 'sm' | 'md' | 'lg'

#### Checkbox

```vue
<Checkbox v-model="accepted" label="Я согласен с условиями" />
<Checkbox v-model="remember" id="remember">
  Запомнить меня
</Checkbox>
```

**Props:**
- `modelValue`: boolean
- `label`: string
- `disabled`: boolean

---

### Layout Components

#### Card

```vue
<Card variant="elevated" hoverable>
  <h3>Заголовок</h3>
  <p>Контент карточки</p>
</Card>

<InfoCard
  title="Информация о студенте"
  :items="[
    { label: 'ФИО', value: 'Иванов Иван Иванович' },
    { label: 'Группа', value: 'ИС-21' },
    { label: 'Номер зачётки', value: '123456' }
  ]"
/>
```

**Card Props:**
- `variant`: 'default' | 'bordered' | 'elevated'
- `padding`: 'sm' | 'md' | 'lg'
- `hoverable`: boolean
- `clickable`: boolean

**InfoCard Props:**
- `title`: string
- `items`: Array<{ label, value }>
- `padding`: 'sm' | 'md' | 'lg'

#### Modal

```vue
<Modal v-model="isOpen" title="Заголовок модалки" size="md">
  <p>Контент модального окна</p>

  <template #actions>
    <ModalActions align="end">
      <Button variant="secondary" @click="isOpen = false">Отмена</Button>
      <Button variant="primary" @click="handleSave">Сохранить</Button>
    </ModalActions>
  </template>
</Modal>
```

**Modal Props:**
- `modelValue`: boolean
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnOverlayClick`: boolean
- `showClose`: boolean

#### Table

```vue
<Table
  :columns="[
    { key: 'name', label: 'Имя' },
    { key: 'age', label: 'Возраст', align: 'center' },
    { key: 'email', label: 'Email' }
  ]"
  :data="students"
  striped
  hoverable
  @row-click="handleRowClick"
>
  <!-- Custom cell slot -->
  <template #cell-name="{ row, value }">
    <strong>{{ value }}</strong>
  </template>
</Table>
```

**Props:**
- `columns`: Array<{ key, label, width?, align?, formatter? }>
- `data`: Array
- `striped`: boolean
- `hoverable`: boolean
- `bordered`: boolean
- `loading`: boolean
- `emptyText`: string

#### Container, Header, Section

```vue
<Container maxWidth="lg">
  <Header title="Страница">
    <template #actions>
      <Button>Действие</Button>
    </template>
  </Header>

  <Section title="Секция" padding="md">
    <p>Контент секции</p>
  </Section>
</Container>
```

**Container Props:**
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `padding`: boolean

**Section Props:**
- `title`: string
- `padding`: 'sm' | 'md' | 'lg'

---

### UI Components

#### Badge

```vue
<Badge variant="success">Активен</Badge>
<Badge variant="danger" pill>Ошибка</Badge>
<Badge variant="primary" outlined>Новое</Badge>

<!-- Специализированные badges для оценок -->
<GradeTypeBadge type="ЭКЗАМЕН" />
<GradeValueBadge value="ОТЛИЧНО" />
<GradeValueBadge :value="9" />
```

**Badge Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `pill`: boolean
- `outlined`: boolean

**GradeTypeBadge Props:**
- `type`: 'EXAM' | 'CREDIT' | 'COURSEWORK' | 'TEST' | 'LAB'
- `size`: 'sm' | 'md' | 'lg'

**GradeValueBadge Props:**
- `value`: number (1-10 или 0-100)
- `size`: 'sm' | 'md' | 'lg'

#### Alert

```vue
<Alert variant="success" title="Успешно">
  Данные сохранены
</Alert>

<Alert variant="error" closable @close="handleClose">
  Произошла ошибка
</Alert>
```

**Props:**
- `variant`: 'success' | 'error' | 'warning' | 'info'
- `title`: string
- `closable`: boolean

#### Loading

```vue
<LoadingSpinner size="md" />

<LoadingState message="Загрузка данных..." />

<EmptyState
  message="Нет данных"
  description="Попробуйте изменить фильтры"
/>
```

**LoadingSpinner Props:**
- `size`: 'sm' | 'md' | 'lg'

**LoadingState Props:**
- `message`: string
- `size`: 'sm' | 'md' | 'lg'

**EmptyState Props:**
- `message`: string
- `description`: string

#### Tabs

```vue
<Tabs
  v-model="activeTab"
  :tabs="[
    { key: 'tab1', label: 'Вкладка 1' },
    { key: 'tab2', label: 'Вкладка 2' },
    { key: 'tab3', label: 'Вкладка 3', disabled: true }
  ]"
>
  <div v-if="activeTab === 'tab1'">Контент вкладки 1</div>
  <div v-if="activeTab === 'tab2'">Контент вкладки 2</div>
</Tabs>
```

**Props:**
- `tabs`: Array<{ key, label, disabled? }>
- `modelValue`: string

#### Pagination

```vue
<Pagination
  v-model:current-page="page"
  :total-pages="10"
  :total="100"
  @change="handlePageChange"
/>
```

**Props:**
- `currentPage`: number
- `totalPages`: number
- `perPage`: number
- `total`: number

---

## Типизация

Все компоненты строго типизированы с TypeScript. Типы экспортируются вместе с компонентами:

```typescript
import { Button, type ButtonProps, type ButtonVariant } from '@/shared/ui'

const props: ButtonProps = {
  variant: 'primary',
  size: 'md',
}
```

## Стилизация

Компоненты используют scoped стили и CSS переменные. Для кастомизации можно переопределить CSS переменные в `tokens.css`.

### Пример переопределения цветов

```css
:root {
  --color-primary: #your-color;
  --color-primary-hover: #your-hover-color;
}
```

## Best Practices

1. **Используйте типизацию** - все компоненты имеют типы для props
2. **Следуйте размерам** - используйте систему размеров (sm, md, lg)
3. **Переиспользуйте** - избегайте дублирования, используйте компоненты из библиотеки
4. **Композиция** - комбинируйте простые компоненты для создания сложных UI
5. **Accessibility** - компоненты поддерживают базовую доступность

## Разработка

### Добавление нового компонента

1. Создайте директорию в `shared/ui/ComponentName/`
2. Создайте файлы:
   - `ComponentName.vue` - сам компонент
   - `types.ts` - типы для props и emits
   - `index.ts` - barrel export
3. Добавьте экспорт в `shared/ui/index.ts`
4. Используйте дизайн-токены из `tokens.css`
5. Следуйте Composition API + `<script setup>`

### Структура компонента

```vue
<template>
  <div :class="componentClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentProps, ComponentEmits } from './types'

const props = withDefaults(defineProps<ComponentProps>(), {
  size: 'md',
})

const emit = defineEmits<ComponentEmits>()

const componentClasses = computed(() => {
  const classes = ['component']
  classes.push(`component-${props.size}`)
  return classes.join(' ')
})
</script>

<style scoped>
.component {
  /* используйте CSS переменные */
  color: var(--color-text-primary);
  padding: var(--spacing-md);
}
</style>
```

## Поддержка

При возникновении проблем или вопросов создавайте issue в репозитории проекта.

# CLAUDE.md — Frontend

Этот файл описывает правила работы с **frontend** частью MITSO Record App.
Агент работающий в этой директории отвечает **только за фронтенд**.

## Стек

- **Nuxt 3** (Vue 3, Composition API, `<script setup>`)
- **TypeScript** — строгий режим, без `any`
- **Pinia** — стейт менеджмент (auth store)
- **Tailwind CSS** + **SCSS** с токенами
- **Файловый роутинг** через `pages/`
- Node.js ^20.19.0 || >=22.12.0

---

## Команды

```bash
npm install
npm run dev          # dev-сервер на порту 3000
npm run build        # production сборка
npm run preview      # превью сборки
npm run typecheck    # проверка типов
```

---

## Структура проекта (FSD)

```
src/
├── app.vue                          # корневой компонент
├── app/styles/main.scss             # точка входа глобальных стилей
├── pages/
│   ├── index.vue                    # главная — приветствие, навигация по роли
│   ├── login.vue                    # форма входа
│   ├── student.vue                  # профиль студента + мои оценки
│   ├── teacher.vue                  # профиль преподавателя + выставление оценок
│   ├── admin.vue                    # панель администратора (табы)
│   ├── students/
│   │   ├── index.vue                # поиск и список студентов
│   │   └── [id].vue                 # карточка студента с оценками
│   └── subjects/[id]/
│       └── grades.vue               # управление оценками по предмету
├── widgets/
│   ├── admin/
│   │   ├── index.ts
│   │   └── ui/
│   │       ├── StudentsSection.vue
│   │       ├── TeachersSection.vue
│   │       ├── SubjectsSection.vue
│   │       ├── GroupsSection.vue
│   │       ├── FacultiesSection.vue
│   │       └── SpecializationsSection.vue
│   └── teacher/
│       ├── index.ts
│       └── ui/SubjectsGrid.vue
├── features/
│   ├── auth/
│   │   ├── api/authApi.ts           # login, register, refresh, logout, getMe
│   │   └── model/useAuth.ts        # Pinia store авторизации
│   ├── students/
│   │   ├── api/studentsApi.ts
│   │   └── model/useStudentsAdmin.ts
│   ├── teachers/
│   │   └── api/teachersApi.ts
│   ├── subjects/
│   │   └── api/subjectsApi.ts
│   ├── grades/
│   │   ├── api/gradesApi.ts
│   │   └── model/useGradeAssignment.ts
│   ├── groups/
│   │   └── api/groupsApi.ts
│   ├── faculties/
│   │   └── api/facultiesApi.ts
│   └── specializations/
│       └── api/specializationsApi.ts
├── entities/
│   ├── student/model/types.ts       # Student (camelCase)
│   ├── teacher/model/types.ts       # Teacher (camelCase)
│   ├── user/model/types.ts          # User + Role enum
│   ├── grade/model/types.ts         # Grade + GradeType enum
│   ├── subject/model/types.ts       # Subject
│   ├── group/model/types.ts         # Group + DTO
│   ├── faculty/model/types.ts       # Faculty + DTO
│   └── specialization/model/types.ts # Specialization + DTO
├── shared/
│   ├── api/httpClient.ts            # HTTP клиент с refresh interceptor
│   ├── lib/storage.ts               # localStorage утилиты
│   ├── styles/
│   │   ├── _tokens.scss             # CSS-переменные / design tokens
│   │   ├── _mixins.scss             # SCSS миксины
│   │   └── _global.scss             # глобальные стили и reset
│   └── ui/                          # переиспользуемые UI компоненты
│       ├── Alert/
│       ├── Badge/
│       ├── Button/
│       ├── Card/
│       ├── Checkbox/
│       ├── Form/
│       ├── Input/
│       ├── Layout/        # Container, Header, Section, InfoCard
│       ├── Loading/       # LoadingState, EmptyState, LoadingSpinner
│       ├── Modal/         # Modal, ModalHeader, ModalActions
│       ├── Pagination/
│       ├── Select/
│       ├── Table/         # Table, TableRow, TableCell
│       ├── Tabs/
│       └── index.ts       # barrel export всех компонентов
└── middleware/
    ├── auth.ts             # защита маршрутов (проверка userRole cookie + refresh)
    └── admin.ts            # защита /admin (роль ADMIN)
```

### Правила FSD — строго соблюдать

- Слои импортируют **только из нижележащих** слоёв:
  `pages` → `widgets` → `features` → `entities` → `shared`
- **Никогда** не импортировать из вышележащего слоя
- Каждый слайс экспортирует через `index.ts` (barrel файл)
- Не создавать cross-imports между слайсами одного слоя

---

## Типы сущностей

Все типы используют **camelCase** (Prisma конвертирует snake_case БД автоматически).

```typescript
// entities/user/model/types.ts
enum Role { STUDENT = 'STUDENT', TEACHER = 'TEACHER', ADMIN = 'ADMIN' }
interface User { id: number; email: string; role: Role; student?: Student | null; teacher?: Teacher | null }

// entities/student/model/types.ts
interface Student {
  id: number; userId: number
  firstName: string; lastName: string; middleName?: string
  studentId: string       // номер зачётки
  groupId?: number; group?: Group
  course: number
  specializationId?: number; specialization?: Specialization
  enrollmentYear: number
  phone?: string; address?: string; birthDate?: string
  createdAt: string; updatedAt: string
  user?: User; grades?: Grade[]
}

// entities/teacher/model/types.ts
interface Teacher {
  id: number; userId: number
  firstName: string; lastName: string; middleName?: string
  department: string; position: string; academicDegree?: string
  phone?: string; officeNumber?: string
  createdAt: string; updatedAt: string; user?: User
}

// entities/grade/model/types.ts
enum GradeType { EXAM = 'EXAM', CREDIT = 'CREDIT', COURSEWORK = 'COURSEWORK', TEST = 'TEST', LAB = 'LAB' }
interface Grade {
  id: number; studentId: number; subjectId: number
  gradeValue: number      // 0–100 по факту, 1–10 в UI
  gradeType: GradeType
  examDate?: string; notes?: string
  createdAt: string; updatedAt: string
  student?: Student; subject?: Subject
}

// entities/subject/model/types.ts
interface Subject {
  id: number; name: string; code: string; credits: number
  semester: number; description?: string; teacherId: number
  createdAt: string; updatedAt: string; teacher?: Teacher
}
```

---

## HTTP клиент

`shared/api/httpClient.ts` — singleton класс `HttpClient`, создаётся через `useHttpClient()`.

**Возможности:**
- Автоподстановка `Authorization: Bearer <token>`
- Interceptor на 401 — вызывает `/auth/refresh`, повторяет запрос
- `credentials: 'include'` — отправляет httpOnly cookie с refreshToken
- Разворачивает обёртку `{ data, message }` из API-ответов
- Методы: `get<T>()`, `post<T>()`, `patch<T>()`, `delete<T>()`

**Важно:** токен хранится внутри экземпляра HttpClient. Pinia store (`useAuthStore`) также хранит его и синхронизирует через `setAccessToken()` / `clearAuth()`.

```typescript
const httpClient = useHttpClient()   // всегда на верхнем уровне компонента/composable
```

---

## Auth Flow на фронте

1. Логин → `POST /auth/login` → получаем `{ user, accessToken }` + `refreshToken` в httpOnly cookie
2. `accessToken` сохраняется в памяти: Pinia store + HttpClient (в синхронизации)
3. `refreshToken` — браузер управляет автоматически через cookie
4. При 401 — httpClient вызывает `/auth/refresh`, получает новый токен, повторяет запрос
5. При ошибке refresh — `clearAuth()` + редирект на `/login`
6. Роль пользователя пишется в cookie `userRole` для SSR middleware

### Pinia Auth Store (`features/auth/model/useAuth.ts`)

```typescript
// Методы:
login(credentials)    // логин, синхронизирует токен с httpClient
logout()              // вызывает /auth/logout, чистит store + httpClient + storage
fetchProfile()        // GET /auth/me, обновляет user в store
setAuth(user, token)  // ручная установка (после refresh)
register(data)        // регистрация нового пользователя

// Состояние:
user: Ref<User | null>
accessToken: Ref<string | null>
isAuthenticated: ComputedRef<boolean>
```

---

## Роутинг и middleware

Файловый роутинг Nuxt 3 через `pages/`:

| Файл | URL | Middleware | Описание |
|---|---|---|---|
| `pages/login.vue` | `/login` | — | Форма входа |
| `pages/index.vue` | `/` | `auth` | Главная, навигация по роли |
| `pages/student.vue` | `/student` | `auth` | Профиль студента + оценки |
| `pages/teacher.vue` | `/teacher` | `auth` | Профиль преподавателя + выставление оценок |
| `pages/admin.vue` | `/admin` | `admin` | Панель администратора |
| `pages/students/index.vue` | `/students` | `auth` | Поиск студентов |
| `pages/students/[id].vue` | `/students/:id` | `auth` | Карточка студента |
| `pages/subjects/[id]/grades.vue` | `/subjects/:id/grades` | `auth` | Оценки по предмету |

**Защита страниц:**
- `middleware/auth.ts` — проверяет cookie `userRole`, при отсутствии токена делает refresh
- `middleware/admin.ts` — дополнительно проверяет `userRole === 'ADMIN'`
- Каждая защищённая страница объявляет middleware через `definePageMeta`:

```typescript
definePageMeta({ middleware: 'auth' })   // для обычных страниц
definePageMeta({ middleware: 'admin' })  // для /admin
```

---

## Nuxt конфиг

```typescript
export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  typescript: { strict: true, typeCheck: true },
  runtimeConfig: {
    public: { apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080/api' }
  },
  alias: { '@': './src' },
  css: ['@/app/styles/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: { loadPaths: ['./src'], additionalData: "@use 'shared/styles/mixins' as *;" }
      }
    }
  }
})
```

---

## Переменные окружения

```env
# frontend/.env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## Design Tokens (shared/styles/_tokens.scss)

CSS-переменные доступны глобально. Использовать ТОЛЬКО их, не хардкодить цвета/размеры.

```scss
// Цвета
--color-primary: #667eea
--color-bg-page, --color-bg-section, --color-bg-hover
--color-text-primary, --color-text-secondary, --color-text-tertiary
--color-border
--color-success, --color-danger, --color-warning

// Типографика
--font-size-xs .. --font-size-4xl
--font-weight-regular .. --font-weight-bold

// Spacing (4px grid)
--spacing-1 (4px) .. --spacing-10 (40px)

// Прочее
--radius-sm .. --radius-full
--shadow-xs .. --shadow-xl
--transition-fast, --transition-base, --transition-slow
--z-modal, --z-dropdown, etc.
```

---

## UI компоненты (shared/ui)

Импортировать через barrel: `import { Button, Input, Modal } from '~/shared/ui'`

| Компонент | Описание |
|---|---|
| `Button` | variant: primary/secondary/danger/success/ghost; size: sm/md/lg; loading |
| `Input` / `NumberInput` | text/email/password/date/number; size; error state |
| `Select` | dropdown с options `[{ value, label }]` |
| `Card` | variant: elevated/bordered; padding: sm/md/lg |
| `Modal` + `ModalHeader` + `ModalActions` | модальные окна |
| `Form` + `FormField` + `FormRow` | формы с лейблами |
| `Table` + `TableRow` + `TableCell` | таблицы данных |
| `Badge` / `GradeTypeBadge` / `GradeValueBadge` | бейджи и оценки |
| `Alert` | variant: error/success/warning/info; closable |
| `LoadingState` / `EmptyState` / `LoadingSpinner` | состояния загрузки |
| `Tabs` | табовый интерфейс |
| `Pagination` | пагинация |
| `Container` / `Header` / `Section` / `InfoCard` | лейаут |
| `SearchInput` | поиск с иконкой |

---

## Code Style

- `<script setup lang="ts">` — всегда, без Options API
- Props: `defineProps<{ prop: Type }>()` — без runtime validators
- Emits: `defineEmits<{ eventName: [payload: Type] }>()`
- Composables начинаются с `use`: `useStudents`, `useAuth`
- Файлы компонентов — `PascalCase.vue`
- Файлы composables/utils — `camelCase.ts`
- `<style scoped>` в каждом SFC
- Никаких `any` — использовать `unknown` если тип неизвестен
- `catch (err: unknown)` + проверка `err instanceof Error`
- `useHttpClient()` / composables — только на верхнем уровне компонента

### Запрещено

- Импорт из вышележащего FSD слоя
- Cross-imports между слайсами одного слоя
- Хранение токенов в `localStorage` (только Pinia/memory + httpOnly cookie)
- Inline стили через `style="..."`
- Хардкод цветов — только CSS-переменные из `_tokens.scss`
- `var` — только `const` / `let`
- `any` тип
- Сырые HTML `<table>` в страницах — использовать `Table`, `TableRow`, `TableCell`
- Ручная проверка авторизации в `onMounted` — использовать middleware

---

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `nuxt.config.ts` | конфигурация |
| `src/app.vue` | корневой компонент |
| `src/shared/api/httpClient.ts` | HTTP клиент, центральная точка всех запросов |
| `src/features/auth/model/useAuth.ts` | Pinia auth store |
| `src/shared/styles/_tokens.scss` | design tokens (CSS-переменные) |
| `src/middleware/auth.ts` | защита маршрутов |
| `src/middleware/admin.ts` | защита /admin |
| `src/shared/ui/index.ts` | barrel export UI компонентов |
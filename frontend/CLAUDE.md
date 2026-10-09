# CLAUDE.md — Frontend

Этот файл описывает правила работы с **frontend** частью MITSO Record App.
Агент работающий в этой директории отвечает **только за фронтенд**.

## Стек

- **Nuxt 4** (Vue 3, Composition API, `<script setup>`)
- **TypeScript** — строгий режим, без `any`
- **Pinia** — стейт менеджмент (auth store)
- **SCSS** с токенами (`_tokens.scss`), Tailwind не используется
- **Файловый роутинг** через `pages/`
- Node.js: см. `.nvmrc` (22.19+, требование Nuxt 4); `ssr: false`, приложение работает только на клиенте

---

## Команды

```bash
npm install
npm run dev          # dev-сервер на порту 3000
npm run build        # production сборка
npm run preview      # превью сборки
npm run typecheck    # проверка типов (vue-tsc)
npm run lint         # ESLint (typescript-eslint + eslint-plugin-vue), no-explicit-any и no-console = error
npm run lint:style   # Stylelint: запрещены hex-цвета вне _tokens.scss
npm test             # Vitest (unit-тесты в tests/)
npm run check        # всё вместе: lint + lint:style + typecheck + test
```

Перед коммитом: `npm run check`. Ту же проверку гоняет CI (`.github/workflows/ci.yml`).

---

## Структура проекта (FSD)

```
app/
├── app.vue                          # корневой компонент
├── assets/styles/main.scss          # точка входа глобальных стилей
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
│   │   ├── api/authApi.ts           # login, logout, getMe
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
│   │   └── model/useGradeEntry.ts   # ввод оценок: тип + дата на группу, значение на студента
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
│   ├── grade/model/                 # Grade, GradeType, rules.ts (диапазон оценок, зачёт/не зачёт)
│   ├── subject/model/types.ts       # Subject
│   ├── group/model/types.ts         # Group + DTO
│   ├── faculty/model/types.ts       # Faculty + DTO
│   └── specialization/model/types.ts # Specialization + DTO
├── shared/
│   ├── api/httpClient.ts            # HTTP клиент с refresh interceptor
│   ├── lib/                         # useToast, useConfirm, useAbortable, usePagedList, formatDate, formatName
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
    ├── auth.ts             # защита маршрутов (restoreSession: refresh + /auth/me)
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
  gradeValue: number      // 1–10; для CREDIT: 1 = зачёт, 0 = не зачёт
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
6. Роль живёт только в памяти (store, из `/auth/me`); cookie `userRole` убрана (её мог подделать любой). В localStorage лежит лишь подсказка `mitso:session` для страницы логина, прав она не даёт. Настоящая проверка прав всегда на бэке (`RolesGuard`)

### Pinia Auth Store (`features/auth/model/useAuth.ts`)

```typescript
// Методы:
login(credentials)    // логин, синхронизирует токен с httpClient
restoreSession()      // после F5: refresh токена + GET /auth/me, false если сессии нет
logout()              // вызывает /auth/logout, чистит store + httpClient + cookie
fetchProfile()        // GET /auth/me, обновляет user в store

// Состояние (accessToken живёт только в httpClient):
user: Ref<User | null>
isAuthenticated: ComputedRef<boolean>  // !!user
```

---

## Роутинг и middleware

Файловый роутинг Nuxt 4 через `pages/`:

| Файл | URL | Middleware | Описание |
|---|---|---|---|
| `pages/login.vue` | `/login` | — | Форма входа |
| `pages/index.vue` | `/` | `auth` | Главная, навигация по роли |
| `pages/student.vue` | `/student` | `auth` | Профиль студента + оценки |
| `pages/teacher.vue` | `/teacher` | `auth` | Профиль преподавателя + выставление оценок |
| `pages/admin.vue` | `/admin` | `auth`, `admin` | Панель администратора |
| `pages/students/index.vue` | `/students` | `auth` | Поиск студентов |
| `pages/students/[id].vue` | `/students/:id` | `auth` | Карточка студента |
| `pages/subjects/[id]/grades.vue` | `/subjects/:id/grades` | `auth` | Оценки по предмету |

**Защита страниц:**
- `middleware/auth.ts` — `authStore.restoreSession()` (refresh токена + профиль), без сессии редирект на `/login`
- `middleware/admin.ts` — только проверка роли, подключается после `auth`
- Каждая защищённая страница объявляет middleware через `definePageMeta`:

```typescript
definePageMeta({ middleware: 'auth' })   // для обычных страниц
definePageMeta({ middleware: ['auth', 'admin'] })  // для /admin
```

---

## Nuxt конфиг

```typescript
export default defineNuxtConfig({
  ssr: false, // закрытое приложение, токен в памяти, SEO не нужен
  modules: ['@pinia/nuxt'],
  typescript: { strict: true }, // типы проверяются отдельно: npm run typecheck
  runtimeConfig: {
    public: { apiUrl: 'http://localhost:8080/api' } // переопределяется NUXT_PUBLIC_API_URL
  },
  css: ['~/assets/styles/main.scss'],
  vite: { css: { preprocessorOptions: { scss: { loadPaths: ['./app'] } } } }
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

CSS-переменные доступны глобально. Использовать ТОЛЬКО их, не хардкодить цвета/размеры (Stylelint запрещает hex вне `_tokens.scss`).

**Два слоя цвета.** `--palette-*` (blue, gray, green, red, amber) это сырые значения, в компонентах их не используют.
Компоненты берут смысловые `--color-*`; тёмная тема это второй набор значений тех же имён под `:root[data-theme='dark']`.
Основной синий взят с сайта mitso.by (`#30599D`, оттенок ~217°) и сделан чуть светлее и чище: `--palette-blue-600` = `#3558C8`.

```scss
// Поверхности и текст (меняются по теме)
--color-bg-page, --color-surface, --color-surface-raised   // страница, карточка, модалка/выпадающее
--color-bg-subtle, --color-bg-muted, --color-bg-strong     // hover строки, вторичная кнопка, нажатие
--color-input-bg                                           // фон поля ввода (в тёмной теме темнее карточки)
--color-text-primary, --color-text-secondary, --color-text-tertiary, --color-text-disabled
--color-on-solid                                           // текст на сплошной заливке (primary, success, danger...)
--color-border, --color-border-light, --color-border-dark

// Акцент и статусы: заливка, -hover, -light (фон-подложка), -dark (текст на -light)
--color-primary, --color-success, --color-danger, --color-warning, --color-info
--color-neutral                                            // бейдж по умолчанию
--color-grade-*-bg / --color-grade-*-text                  // типы и значения оценок

// Тень фокуса у полей
--shadow-focus, --shadow-focus-danger

// Типографика: Roboto (400/500/700, @fontsource, как на mitso.by); semibold = 500, у Roboto нет 600
--font-size-xs .. --font-size-4xl
--font-weight-regular .. --font-weight-bold

// Spacing (4px grid)
--spacing-1 (4px) .. --spacing-10 (40px)

// Прочее
--radius-sm (6) .. --radius-xl (16), --radius-full
--shadow-xs .. --shadow-xl
--transition-fast, --transition-base, --transition-slow
```

**Тема.** `useTheme()` (`shared/lib/useTheme.ts`): `mode` (`system` | `light` | `dark`), `resolved`, `setMode()`, `toggle()`.
Выбор лежит в `localStorage['mitso:theme']` (только предпочтение, прав не даёт); до первой отрисовки тему ставит
inline-скрипт в `nuxt.config.ts` (иначе будет белая вспышка), плагин `plugins/theme.client.ts` синхронизирует стор.
Переключатель `ThemeToggle` пока в углу layouts, в меню пользователя переедет вместе с каркасом.
Новый цвет добавляется в оба набора (светлый и тёмный) и проверяется `tests/contrast.spec.ts` (WCAG AA 4.5:1).


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
| `app/app.vue` | корневой компонент |
| `app/shared/api/httpClient.ts` | HTTP клиент, центральная точка всех запросов |
| `app/features/auth/model/useAuth.ts` | Pinia auth store |
| `app/shared/styles/_tokens.scss` | design tokens (CSS-переменные) |
| `app/middleware/auth.ts` | защита маршрутов |
| `app/middleware/admin.ts` | защита /admin |
| `app/shared/ui/index.ts` | barrel export UI компонентов |
# CLAUDE.md — Frontend

Этот файл описывает правила работы с **frontend** частью MITSO Record App.
Агент работающий в этой директории отвечает **только за фронтенд**.

## Стек

- **Nuxt 3** (Vue 3, Composition API, `<script setup>`)
- **TypeScript** — строгий, без `any`
- **Pinia** — стейт менеджмент
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
├── app/
│   └── App.vue                  # корневой компонент, глобальные стили
├── pages/
│   ├── index.vue                # главная, модальное окно выбора роли
│   ├── student.vue              # страница студента
│   └── teacher.vue             # страница преподавателя
├── widgets/
│   ├── student/
│   │   ├── ui/StudentCard.vue
│   │   └── index.ts
│   ├── teacher/
│   │   ├── ui/TeacherCard.vue
│   │   └── index.ts
│   ├── search/
│   │   ├── ui/SearchBar.vue
│   │   └── index.ts
│   └── user-profile/
│       ├── ui/UserProfile.vue
│       └── index.ts
├── features/
│   ├── auth/
│   │   ├── api/authApi.ts       # login, refresh
│   │   ├── model/useAuth.ts     # composable авторизации
│   │   └── index.ts
│   ├── students/
│   │   ├── api/studentsApi.ts   # fetchStudents, fetchStudentById
│   │   └── index.ts
│   ├── teachers/
│   │   ├── api/teachersApi.ts
│   │   └── index.ts
│   └── grades/
│       ├── api/gradesApi.ts     # fetchGradeForStudent
│       └── index.ts
├── entities/
│   ├── student/
│   │   └── model/types.ts       # Student интерфейс
│   ├── teacher/
│   │   └── model/types.ts       # Teacher интерфейс
│   ├── grade/
│   │   └── model/types.ts       # Grade интерфейс
│   └── subject/
│       └── model/types.ts       # Subject интерфейс
└── shared/
    ├── api/
    │   └── httpClient.ts        # базовый fetch/axios с interceptor-ами
    ├── lib/
    │   └── token.ts             # работа с токенами в памяти
    └── ui/
        ├── Button.vue
        ├── Input.vue
        ├── Modal.vue
        └── Spinner.vue
```

### Правила FSD — строго соблюдать

- Слои импортируют **только из нижележащих** слоёв:
  `pages` → `widgets` → `features` → `entities` → `shared`
- **Никогда** не импортировать из вышележащего слоя
- Каждый слайс экспортирует через `index.ts` (barrel файл)
- Не создавать cross-imports между слайсами одного слоя

---

## Типы сущностей

```typescript
// entities/student/model/types.ts
export interface Student {
  id: number
  last_name: string
  first_name: string
  middle_name: string
  group: string
  record_book_number: string
}

// entities/teacher/model/types.ts
export interface Teacher {
  id: number
  lastName: string
  firstName: string
  middleName: string
  department: string
}

// entities/grade/model/types.ts
export interface Grade {
  id: number
  student_id: number
  subject_id: number
  grade: number
  semester: number
  year: number
  subject?: Subject
}

// entities/subject/model/types.ts
export interface Subject {
  id: number
  name: string
  teacher_id: number
  teacher?: Teacher
}
```

> ⚠️ Несоответствие: Student использует `snake_case`, Teacher — `PascalCase`.
> Это отражает текущую бекенд API. При рефакторинге бека — обновить типы здесь.

---

## API и HTTP клиент

Базовый URL бека: `http://localhost:8080/api`

### httpClient (shared/api/httpClient.ts)

```typescript
// Должен реализовывать:
// 1. Автоматическую подстановку access токена из памяти (Pinia store)
// 2. Interceptor на 401 — автоматически вызывать refresh и повторять запрос
// 3. Базовый URL из переменной окружения NUXT_PUBLIC_API_URL
```

### Пример API функции

```typescript
// features/students/api/studentsApi.ts
import { httpClient } from '@/shared/api/httpClient'
import type { Student } from '@/entities/student'

export const fetchStudents = (query: string): Promise<Student[]> =>
  httpClient.get(`/students?search=${query}`)

export const fetchStudentById = (id: number): Promise<Student> =>
  httpClient.get(`/students/${id}`)
```

---

## Auth Flow на фронте

1. При логине — сохранить `accessToken` в **Pinia store** (не в localStorage!)
2. `refreshToken` приходит в `httpOnly` cookie — браузер управляет автоматически
3. При 401 ответе — httpClient вызывает `/auth/refresh`, получает новый `accessToken`, повторяет запрос
4. При ошибке refresh — очистить store, редирект на `/`

```typescript
// features/auth/model/useAuth.ts
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)

  const login = async (credentials: LoginDto) => { ... }
  const logout = () => { accessToken.value = null }
  const refreshTokens = async () => { ... }

  return { accessToken, login, logout, refreshTokens }
})
```

---

## Роутинг

Файловый роутинг Nuxt 3 через `pages/`:

| Файл | URL | Описание |
|---|---|---|
| `pages/index.vue` | `/` | Главная, модальное окно выбора роли |
| `pages/student.vue` | `/student` | Поиск и просмотр студентов |
| `pages/teacher.vue` | `/teacher` | Просмотр преподавателей |

Роль (студент/преподаватель) сохраняется в `localStorage` и читается при старте.

---

## Nuxt конфиг

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  alias: { '@': './src' },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080/api'
    }
  },
  modules: ['@pinia/nuxt'],
  typescript: { strict: true }
})
```

---

## Переменные окружения

```env
# frontend/.env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## Code Style

- `<script setup lang="ts">` — всегда
- Props через `defineProps<{ prop: Type }>()` — без runtime validators
- Emits через `defineEmits<{ eventName: [payload: Type] }>()`
- Composables начинаются с `use`: `useStudents`, `useAuth`
- Файлы компонентов — `PascalCase.vue`
- Файлы composables/utils — `camelCase.ts`
- Scoped стили в каждом SFC: `<style scoped>`
- Никаких `any` — использовать `unknown` если тип неизвестен
- Не использовать `Options API`

### Запрещено

- Импорт между слайсами одного FSD слоя
- Хранение токенов в `localStorage` (только в Pinia или cookie)
- Inline стили через `style="..."`
- `var` — только `const`/`let`

---

## Ключевые файлы

- `nuxt.config.ts` — конфигурация
- `src/app/App.vue` — корень с глобальным CSS reset
- `src/shared/api/httpClient.ts` — HTTP клиент (центральная точка всех запросов)
- `src/features/auth/model/useAuth.ts` — авторизация

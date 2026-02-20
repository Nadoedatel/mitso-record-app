# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MITSO Record App** — приложение для учёта студенческих зачёток. Позволяет студентам и преподавателям искать и просматривать академические записи, оценки и информацию о предметах.

Структура монорепозитория:
```
/
├── frontend/   # Nuxt 3 приложение
├── backend/    # NestJS приложение
└── docker-compose.yml
```

---

## Tech Stack

### Frontend
- **Nuxt 3** (Vue 3 под капотом, Composition API, `<script setup>`)
- **TypeScript**
- **Pinia** (state management)
- **Vue Router** (файловый роутинг через `pages/`)
- Node.js ^20.19.0 || >=22.12.0

### Backend
- **NestJS** (модульная архитектура, декораторы, DI)
- **TypeScript**
- **Prisma** (ORM)
- **PostgreSQL** (база данных)
- **Passport.js** + **JWT** (аутентификация, access + refresh токены)
- **class-validator** + **class-transformer** (валидация DTO)
- Порт: `8080`

### DevOps
- **Docker** + **docker-compose** (локальная разработка и деплой)

---

## Development Commands

### Frontend
```bash
cd frontend

npm install
npm run dev          # dev-сервер (обычно порт 3000)
npm run build        # production сборка
npm run preview      # превью production сборки
npm run typecheck    # проверка типов
```

### Backend
```bash
cd backend

npm install
npm run start:dev    # dev-сервер с hot reload (порт 8080)
npm run build        # production сборка
npm run start:prod   # запуск production сборки

# Prisma
npx prisma migrate dev       # создать и применить миграцию
npx prisma migrate deploy    # применить миграции на проде
npx prisma generate          # сгенерировать Prisma Client
npx prisma studio            # GUI для базы данных
```

### Docker
```bash
docker-compose up -d         # поднять все сервисы (БД, бек, фронт)
docker-compose down          # остановить
docker-compose logs -f       # логи
```

---

## Architecture

### Frontend (Nuxt 3 + FSD)

Фронтенд следует принципам **Feature-Sliced Design (FSD)**:

- **entities/** — бизнес-сущности (`student`, `teacher`, `subject`, `grade`)
  - Каждая сущность имеет `model/types.ts` с TypeScript интерфейсом
- **features/** — переиспользуемые фичи и функции получения данных
  - API-функции: `fetchStudents`, `fetchTeacher`, `fetchGradeForStudent` и т.д.
  - Все запросы идут на `http://localhost:8080/api/*`
- **widgets/** — составные UI-блоки (`student`, `teacher`, `search`, `user-profile`)
  - Экспортируются через `index.ts` barrel-файлы
- **pages/** — файловый роутинг Nuxt (`/`, `/student`, `/teacher`)
  - Главная страница показывает модальное окно выбора роли (Студент/Преподаватель)
  - Роль сохраняется в `localStorage`
- **app/** — инициализация приложения

**Path Aliasing:**
- `@/` → `frontend/src/` (настроено в `nuxt.config.ts`)

### Backend (NestJS)

Бекенд следует **модульной архитектуре NestJS**:

```
backend/src/
├── app.module.ts
├── main.ts
├── common/           # общие декораторы, guard-ы, interceptor-ы, pipes
│   ├── guards/       # JwtAuthGuard, RolesGuard
│   ├── decorators/   # @CurrentUser(), @Roles()
│   └── filters/      # глобальный exception filter
├── auth/             # аутентификация (JWT, Passport, refresh токены)
├── students/         # модуль студентов (CRUD, поиск)
├── teachers/         # модуль преподавателей
├── grades/           # модуль оценок и зачётов
├── subjects/         # модуль предметов
└── prisma/           # PrismaService (singleton)
```

**Каждый модуль содержит:**
- `*.module.ts` — регистрация зависимостей
- `*.controller.ts` — HTTP эндпоинты, валидация входящих данных
- `*.service.ts` — бизнес-логика
- `dto/` — DTO классы с декораторами `class-validator`
- `entities/` — Prisma-типы или доп. типы сущности

---

## API Conventions

- Базовый URL: `/api`
- Аутентификация: `Bearer <access_token>` в заголовке `Authorization`
- Все ответы оборачиваются в единый формат:
  ```json
  { "data": ..., "message": "ok" }
  ```
- Ошибки возвращаются через глобальный exception filter в формате:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request" }
  ```

### Ключевые эндпоинты
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/login` | Логин, возвращает access + refresh токены |
| POST | `/api/auth/refresh` | Обновление access токена |
| GET | `/api/students` | Список студентов (поиск по имени) |
| GET | `/api/students/:id` | Студент по ID |
| GET | `/api/teachers/:id` | Преподаватель по ID |
| GET | `/api/grades/student/:id` | Оценки студента |

---

## Database (Prisma + PostgreSQL)

- Схема: `backend/prisma/schema.prisma`
- Все модели используют **snake_case** на уровне БД
- В TypeScript типах — **camelCase** (Prisma конвертирует автоматически)
- Migrations хранятся в `backend/prisma/migrations/`

> ⚠️ **Важно:** Текущий фронтенд имеет несоответствие типов — студенты используют `snake_case`, преподаватели `PascalCase`. При разработке бека придерживаться единого `snake_case` в БД и `camelCase` в API-ответах.

---

## Auth Flow

1. Пользователь логинится → получает `accessToken` (15 мин) и `refreshToken` (7 дней)
2. `accessToken` хранится в памяти (Pinia store)
3. `refreshToken` хранится в `httpOnly` cookie
4. При истечении `accessToken` — автоматический refresh через interceptor

---

## Code Style

### Frontend
- Composition API с `<script setup>` синтаксисом
- TypeScript для всех `.ts` и `.vue` файлов
- Props/emits описываются TypeScript типами, не runtime validators
- Компоненты модульные и самодостаточные
- Scoped стили в Vue SFC

### Backend
- Каждый контроллер, сервис, модуль — в отдельном файле
- DTO для всех входящих данных с валидацией через `class-validator`
- Сервисы не зависят от HTTP-слоя (не используют `Request`/`Response`)
- Все публичные методы сервисов покрыты JSDoc
- Никаких `any` — строгая типизация

---

## Key Files

### Frontend
- `frontend/src/app/App.vue` — корневой компонент
- `frontend/src/pages/index.vue` — главная страница
- `frontend/nuxt.config.ts` — конфигурация Nuxt

### Backend
- `backend/src/main.ts` — точка входа, настройка CORS, Swagger, global pipes
- `backend/src/app.module.ts` — корневой модуль
- `backend/prisma/schema.prisma` — схема БД
- `backend/.env` — переменные окружения (не коммитить!)

### Переменные окружения (backend/.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mitso_db"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=8080
```

## Orchestration

При получении большой задачи — декомпозируй и запускай субагентов:

- Задачи по БД/схеме → `cd prisma && claude ...`
- Задачи по беку → `cd backend && claude ...`
- Задачи по фронту → `cd frontend && claude ...`

Субагенты работают параллельно если задачи независимы.
Субагенты работают последовательно если есть зависимости (сначала схема → потом бек → потом фронт).

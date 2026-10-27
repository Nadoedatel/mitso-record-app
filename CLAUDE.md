# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MITSO Record App** — приложение для учёта студенческих зачёток. Позволяет студентам и преподавателям искать и просматривать академические записи, оценки и информацию о предметах.

Структура монорепозитория:
```
/
├── frontend/   # Nuxt 4 приложение
├── backend/    # NestJS приложение
└── docker-compose.yml
```

`mobile/` (Flutter) заморожен с 2026-10-14: не поддерживать и не менять. Демо-выкладка бесплатная: фронт на Cloudflare Pages (`nuxt generate`, прокси `/api/*` в `frontend/functions/api`), бэк и Redis на Render free (`render.yaml`), PostgreSQL на Neon. Это не прод: без SLA, демо-данные. Seed на нелокальной базе требует `SEED_PASSWORD` и `SEED_ADMIN_PASSWORD`.

---

## Tech Stack

### Frontend
- **Nuxt 4** (Vue 3 под капотом, Composition API, `<script setup>`)
- **TypeScript**
- **Pinia** (state management)
- **Vue Router** (файловый роутинг через `pages/`)
- Node.js ^22.19.0 (см. frontend/.nvmrc)

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

### Нагрузочный тест (k6)
```bash
npm run load:seed      # 20 000 студентов, 500 000 оценок и три аккаунта в БД postgres-test (порт 5433)
npm run load:backend   # бэк на этой БД: лимит запросов поднят, METRICS_TOKEN=load-metrics, логи warn
npm run load:smoke     # один проход по эндпоинтам, сначала он
npm run load           # 20 читателей + 3 преподавателя, пороги p95 по эндпоинтам (k6 локально или grafana/k6 в docker)
```

### Docker
```bash
docker-compose up -d         # поднять все сервисы (БД, бек, фронт)
docker-compose down          # остановить
docker-compose logs -f       # логи
```

---

## Architecture

### Frontend (Nuxt 4 + FSD)

Фронтенд следует принципам **Feature-Sliced Design (FSD)**:

- **entities/** — бизнес-сущности (`student`, `teacher`, `user`, `grade`, `subject`, `group`, `faculty`, `specialization`)
  - Каждая сущность имеет `model/types.ts`, все типы в **camelCase**
- **features/** — API-слой и composable-логика по доменам
  - `auth/api/authApi.ts`, `students/api/studentsApi.ts`, `grades/model/useGradeAssignment.ts` и т.д.
  - Все запросы идут через `shared/api/httpClient.ts`
- **widgets/** — составные UI-блоки (`admin/*`, `teacher/SubjectsGrid`)
  - Экспортируются через `index.ts` barrel-файлы
- **pages/** — файловый роутинг Nuxt
  - `/login`, `/` (главная по роли), `/student`, `/teacher`, `/admin`, `/students`, `/students/:id`, `/subjects/:id/grades`
  - Защита через middleware (`auth`, `admin`)
- **shared/** — UI-компоненты, HTTP-клиент, SCSS-токены, утилиты

**Path Aliasing:**
- `@/` и `~/` → `frontend/app/` (папка `app/` — srcDir по умолчанию в Nuxt 4)

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
- Обёртки `{ data, message }` нет: ответ это сам объект/массив, списки приходят как `{ data, total, page, limit, totalPages }`, удаление возвращает `{ message }`
- Контракт описан в `backend/openapi.json` (запросы и ответы, схемы в `backend/src/common/dto/responses.ts`); после правки DTO или контроллера: `npm run openapi:generate` в backend и `npm run api:types` во frontend
- Ошибки возвращаются через глобальный exception filter в формате:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request" }
  ```

### Ключевые эндпоинты
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/login` | Логин → `{ user, accessToken }` + `refreshToken` в cookie; если у пользователя включена 2FA: `{ twoFactorRequired, challengeToken }` без cookie |
| POST | `/api/auth/refresh` | Обновление access токена (cookie → новый accessToken) |
| GET | `/api/metrics` | Метрики Prometheus (процесс, HTTP, кэш, фоновые задачи); `Authorization: Bearer <METRICS_TOKEN>`, без токена в окружении 404 |
| GET | `/api/auth/me` | Текущий пользователь с вложенными `student`/`teacher` |
| POST | `/api/auth/2fa/verify` | Второй шаг входа: `challengeToken` + код из приложения или резервный код → как login |
| POST | `/api/auth/2fa/setup`, `/enable`, `/disable` | Включение и отключение TOTP-защиты (ADMIN); нужен `TOTP_ENCRYPTION_KEY`, иначе 503 |
| POST | `/api/auth/logout` | Выход, инвалидация refresh токена |
| GET | `/api/students` | Список студентов (`?search=&page=&limit=`) |
| GET | `/api/students/:id` | Студент по ID |
| POST/PATCH/DELETE | `/api/students/:id` | CRUD студентов |
| GET | `/api/teachers/:id` | Преподаватель по ID |
| POST/PATCH/DELETE | `/api/teachers/:id` | CRUD преподавателей |
| GET | `/api/grades/student/:id` | Оценки студента |
| GET | `/api/grades/subject/:id/groups` | Группы по предмету |
| GET | `/api/grades/subject/:id/group/:groupId/students` | Студенты группы с оценками |
| GET/POST/PATCH/DELETE | `/api/subjects` | CRUD предметов |
| GET/POST/PATCH/DELETE | `/api/groups` | CRUD групп |
| GET/POST/PATCH/DELETE | `/api/faculties` | CRUD факультетов |
| POST | `/api/jobs/exports/students/:id` | Фоновый экспорт зачётки в Excel (202 + статус задачи), нужен Redis |
| POST | `/api/jobs/imports/students` | Фоновый импорт студентов из CSV (ADMIN, multipart, поле `file`), нужен Redis |
| GET | `/api/jobs/:id`, `/api/jobs/:id/file` | Статус задачи (polling) и файл готового экспорта |
| GET | `/api/audit-log` | Журнал изменений оценок: кто, когда, было и стало (ADMIN; фильтры `studentId`, `subjectId`, `actorId`, `action`, `from`, `to`) |
| GET/POST/PATCH/DELETE | `/api/specializations` | CRUD специализаций |

---

## Database (Prisma + PostgreSQL)

- Схема: `backend/prisma/schema.prisma`
- Все модели используют **snake_case** на уровне БД
- В TypeScript типах — **camelCase** (Prisma конвертирует автоматически)
- API-ответы возвращают **camelCase** — фронтенд полностью на camelCase
- Migrations хранятся в `backend/prisma/migrations/`

---

## Auth Flow

1. Пользователь логинится → получает `accessToken` (15 мин) и `refreshToken` (7 дней)
2. `accessToken` хранится в памяти (Pinia store)
3. `refreshToken` хранится в `httpOnly` cookie
4. При истечении `accessToken` — автоматический refresh через interceptor

---

## Code Style

### Frontend
- Composition API с `<script setup lang="ts">` — всегда
- TypeScript строгий режим, никаких `any`; `catch (err: unknown)` + `instanceof Error`
- Props/emits описываются TypeScript типами, не runtime validators
- Компоненты модульные и самодостаточные
- `<style scoped>` в каждом SFC
- Только CSS-переменные из `_tokens.scss` — не хардкодить цвета/размеры
- `useHttpClient()` и composables — только на верхнем уровне компонента
- Авторизация страниц через `definePageMeta({ middleware: 'auth' })`, не вручную в `onMounted`
- Таблицы через shared `Table`/`TableRow`/`TableCell`, не сырой `<table>`

### Backend
- Каждый контроллер, сервис, модуль — в отдельном файле
- DTO для всех входящих данных с валидацией через `class-validator`
- Сервисы не зависят от HTTP-слоя (не используют `Request`/`Response`)
- Все публичные методы сервисов покрыты JSDoc
- Никаких `any` — строгая типизация
- Сервисы бросают доменные ошибки из `common/errors` (`NotFoundError`, `ConflictError`, `ForbiddenError`, `InvalidInputError`, `UnauthenticatedError`, `TooManyAttemptsError`, `UnavailableError`), а не `HttpException`: в HTTP их превращает глобальный фильтр. HTTP-исключения Nest только в контроллерах, guard'ах и стратегиях
- Запросы к БД живут в `*.repository.ts` (сейчас grades и students; остальные сервисы переводятся по мере правок, список в `src/architecture.spec.ts`). Сервис держит правила, репозиторий знает форму запросов; транзакцию репозиторий принимает как `tx`
- Модули импортируют друг друга только через `index.ts`, зависимости объявлены в таблице `src/architecture.spec.ts` (он же ловит циклы и HTTP-типы в сервисах); новая связь между модулями это решение, его фиксируют в этой таблице
- Журналы и ленты, которые только растут (аудит), читаются курсором (`common/pagination`), а не `OFFSET`

---

## Key Files

### Frontend
- `frontend/app/app.vue` — корневой компонент
- `frontend/app/pages/` — все страницы приложения
- `frontend/nuxt.config.ts` — конфигурация Nuxt
- `frontend/app/shared/api/httpClient.ts` — HTTP клиент (единая точка запросов)
- `frontend/app/features/auth/model/useAuth.ts` — Pinia auth store
- `frontend/app/shared/styles/_tokens.scss` — design tokens (CSS-переменные)
- `frontend/app/shared/ui/index.ts` — barrel export UI компонентов
- `frontend/app/middleware/auth.ts` — защита маршрутов
- `frontend/app/middleware/admin.ts` — защита /admin

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

## Git

- В сообщения коммитов и описания MR/PR **не добавлять** `Co-Authored-By: Claude ...`, `Generated with Claude Code` и любые упоминания Claude или Anthropic.
- Формат сообщения: `тип(компоненты-версия ветки): что сделано`, до 100 символов в первой строке.
- Коммитить и пушить только по явной команде.

## Orchestration

При получении большой задачи — декомпозируй и запускай субагентов:

- Задачи по БД/схеме → `cd prisma && claude ...`
- Задачи по беку → `cd backend && claude ...`
- Задачи по фронту → `cd frontend && claude ...`

Субагенты работают параллельно если задачи независимы.
Субагенты работают последовательно если есть зависимости (сначала схема → потом бек → потом фронт).

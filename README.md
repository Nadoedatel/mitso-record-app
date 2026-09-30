# MITSO Record App

Полноценное приложение для учёта студенческих зачёток, оценок и информации о предметах. Текущая версия: **v3.2.7**

Монорепозиторий включает три клиента:
- **backend** — NestJS REST API (порт 8080)
- **frontend** — Nuxt 4 веб-приложение (порт 3000)
- **mobile** — Flutter мобильный клиент (Android / iOS)

## Стек технологий

### Backend
- **NestJS** - Серверный фреймворк
- **PostgreSQL** - База данных
- **Prisma** - ORM
- **Passport.js + JWT** - Аутентификация (access + refresh токены)
- **Swagger** - API документация
- **TypeScript** - Строгая типизация
- **class-validator** - Валидация DTO

### Frontend
- **Nuxt 4** - Vue фреймворк (SPA, `ssr: false`)
- **Vue 3** - UI библиотека (Composition API, `<script setup>`)
- **Pinia** - State management
- **TypeScript** - Строгая типизация
- **FSD** - Feature-Sliced Design архитектура
- **Shared UI Library** - переиспользуемые компоненты (Button, Input, Modal, Table, Badge и др.)
- Node.js ^22.19.0 (см. `frontend/.nvmrc`)

### Mobile
- **Flutter 3.x** — кроссплатформенный UI фреймворк
- **Dart >=3.3.0** — язык
- **Riverpod 2** (`flutter_riverpod`) — state management
- **GoRouter 14** — декларативный роутинг с role-based guards
- **Dio 5** + `dio_cookie_manager` — HTTP-клиент с interceptor-ами
- **flutter_secure_storage** — хранение access-токена
- **PersistCookieJar** — хранение refresh-токена (httpOnly cookie)
- Платформы: Android, iOS

## Быстрый старт

### Одной командой (backend + frontend)

```bash
npm install              # в корне: ставит concurrently
npm run install:all      # зависимости backend и frontend
cp backend/.env.example backend/.env   # и вписать свои JWT-секреты
npm run dev              # поднимает postgres в Docker, затем backend и frontend в одном терминале
```

Перед первым запуском примените миграции (шаг 3 ниже). Остановить всё: `Ctrl+C`, затем `npm run docker:down` для postgres.

### Всё в Docker

```bash
cp .env.example .env     # вписать JWT-секреты
npm run docker:up        # postgres + backend (миграции применяются сами) + frontend
```

Проверка, что backend жив: `GET http://localhost:8080/api/health`.

### Пошагово

### 1. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile
cd ../mobile
flutter pub get
```

### 2. Настройка базы данных

**Вариант A: Docker (рекомендуется)**

```bash
# Из корня проекта
docker-compose up -d postgres
```

**Вариант B: Локальный PostgreSQL**

1. Установите PostgreSQL
2. Создайте базу данных `mitso_db`
3. Обновите `backend/.env` с вашими credentials

### 3. Выполнение миграций

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 4. Заполнение тестовыми данными (опционально)

```bash
cd backend
npx prisma db seed
```

### 5. Запуск приложения

```bash
# Backend (в одном терминале)
cd backend
npm run start:dev

# Frontend (в другом терминале)
cd frontend
npm run dev
```

Приложение будет доступно по адресу:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **API Docs (Swagger):** http://localhost:8080/api/docs

Запуск мобильного клиента (требует запущенного backend):

```bash
cd mobile
flutter run                  # Android-эмулятор (backend: 10.0.2.2:8080)
flutter run -d iPhone        # iOS-симулятор (backend: localhost:8080)
```

## Структура проекта

```
mitso-record-app/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # Аутентификация JWT
│   │   ├── students/     # Модуль студентов
│   │   ├── teachers/     # Модуль преподавателей
│   │   ├── grades/       # Модуль оценок
│   │   ├── subjects/     # Модуль предметов
│   │   ├── faculties/    # Модуль факультетов
│   │   ├── groups/       # Модуль групп
│   │   ├── specializations/ # Модуль специальностей
│   │   ├── prisma/       # Prisma сервис
│   │   └── common/       # Guards, Decorators, Filters
│   ├── prisma/
│   │   ├── schema.prisma # Схема БД
│   │   ├── migrations/   # Миграции
│   │   └── seed.ts       # Seed данные
│   └── package.json
│
├── frontend/             # Nuxt 4 приложение
│   ├── app/
│   │   ├── app.vue       # Корневой компонент
│   │   ├── app/
│   │   │   └── styles/main.scss  # Глобальные стили
│   │   ├── pages/        # Страницы (роутинг)
│   │   │   ├── index.vue
│   │   │   ├── login.vue
│   │   │   ├── student.vue
│   │   │   ├── teacher.vue
│   │   │   ├── admin.vue
│   │   │   ├── students/
│   │   │   │   ├── index.vue     # Список студентов
│   │   │   │   └── [id].vue      # Детали студента
│   │   │   └── subjects/
│   │   │       └── [id]/grades.vue  # Выставление оценок
│   │   ├── features/     # Фичи с API
│   │   │   ├── auth/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── grades/
│   │   │   ├── subjects/
│   │   │   ├── faculties/
│   │   │   ├── groups/
│   │   │   └── specializations/
│   │   ├── entities/     # Бизнес-сущности (user, student, teacher, grade, subject, group, faculty, specialization)
│   │   ├── shared/       # Переиспользуемый код
│   │   │   ├── api/httpClient.ts # HTTP клиент с interceptor-ами
│   │   │   ├── lib/storage.ts    # Утилиты LocalStorage
│   │   │   └── ui/               # Shared UI библиотека
│   │   └── middleware/   # Auth & Admin middleware
│   └── package.json
│
├── mobile/               # Flutter мобильный клиент
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart
│   │   ├── core/         # api_client, router, theme
│   │   ├── features/     # auth, student, teacher
│   │   └── shared/       # models, widgets
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
│
├── docker-compose.yml    # Docker конфигурация
└── CLAUDE.md             # Инструкции для Claude Code
```

## API Endpoints

### Служебные
- `GET /api/health` - Состояние приложения и БД (публичный, без лимитов)

### Аутентификация
- `POST /api/auth/login` - Вход (email + password)
- `POST /api/auth/refresh` - Обновление access токена
- `POST /api/auth/logout` - Выход

### Студенты
- `GET /api/students` - Список студентов (с поиском и фильтрами)
- `GET /api/students/:id` - Студент по ID
- `POST /api/students` - Создать студента вместе с учётной записью: email + password (ADMIN)
- `PATCH /api/students/:id` - Обновить студента (ADMIN)
- `DELETE /api/students/:id` - Удалить студента (ADMIN)

### Преподаватели
- `GET /api/teachers` - Список преподавателей
- `GET /api/teachers/:id` - Преподаватель по ID
- `POST /api/teachers` - Создать преподавателя (ADMIN)
- `PATCH /api/teachers/:id` - Обновить преподавателя (ADMIN)
- `DELETE /api/teachers/:id` - Удалить преподавателя (ADMIN)
- `POST /api/teachers/:id/subjects` - Назначить предметы (ADMIN)

### Оценки
- `GET /api/grades/student/:id` - Оценки студента
- `GET /api/grades` - Список оценок (с фильтрами)
- `POST /api/grades` - Создать оценку (TEACHER, ADMIN)
- `POST /api/grades/batch` - Создать несколько оценок (TEACHER, ADMIN)
- `PATCH /api/grades/:id` - Обновить оценку (TEACHER, ADMIN)
- `DELETE /api/grades/:id` - Удалить оценку (ADMIN)

### Предметы
- `GET /api/subjects` - Список предметов
- `GET /api/subjects/:id` - Предмет по ID
- `POST /api/subjects` - Создать предмет (ADMIN)
- `PATCH /api/subjects/:id` - Обновить предмет (ADMIN)
- `DELETE /api/subjects/:id` - Удалить предмет (ADMIN)

### Факультеты
- `GET /api/faculties` - Список факультетов
- `GET /api/faculties/:id` - Факультет по ID
- `POST /api/faculties` - Создать факультет (ADMIN)
- `PATCH /api/faculties/:id` - Обновить факультет (ADMIN)
- `DELETE /api/faculties/:id` - Удалить факультет (ADMIN)

### Группы
- `GET /api/groups` - Список групп
- `GET /api/groups/:id` - Группа по ID
- `POST /api/groups` - Создать группу (ADMIN)
- `PATCH /api/groups/:id` - Обновить группу (ADMIN)
- `DELETE /api/groups/:id` - Удалить группу (ADMIN)

### Специальности
- `GET /api/specializations` - Список специальностей
- `GET /api/specializations/:id` - Специальность по ID
- `POST /api/specializations` - Создать специальность (ADMIN)
- `PATCH /api/specializations/:id` - Обновить специальность (ADMIN)
- `DELETE /api/specializations/:id` - Удалить специальность (ADMIN)

> Все эндпоинты (кроме login и health) требуют JWT токен в заголовке Authorization.
> Эндпоинты с пометкой (ADMIN) доступны только администраторам.
> Эндпоинты с пометкой (TEACHER, ADMIN) доступны преподавателям и администраторам.

## Переменные окружения

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mitso_db"
JWT_ACCESS_SECRET="<сгенерировать, см. backend/.env.example>"
JWT_REFRESH_SECRET="<сгенерировать, см. backend/.env.example>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT=8080
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Docker Compose (корневой .env)
Шаблон `.env.example` в корне: JWT-секреты и доступы postgres. Секреты в `docker-compose.yml` не хранятся.

## База данных

Схема базы данных включает следующие модели:

- **User** - пользователи системы (с ролями: STUDENT, TEACHER, ADMIN)
  - email (уникальный)
  - password (хешированный bcrypt)
  - role (enum: STUDENT, TEACHER, ADMIN)
  - refreshToken (для JWT refresh flow)

- **Student** - профили студентов
  - firstName, lastName, middleName
  - studentId (номер зачётной книжки, уникальный)
  - course (курс обучения)
  - groupId (связь с группой)
  - specializationId (связь со специальностью)
  - enrollmentYear (год поступления)
  - контактные данные (phone, address, birthDate)

- **Teacher** - профили преподавателей
  - firstName, lastName, middleName
  - department (кафедра)
  - position (должность)
  - academicDegree (учёная степень)
  - phone, officeNumber

- **Subject** - предметы
  - name (название)
  - code (код предмета, уникальный)
  - credits (количество кредитов)
  - semester (семестр)
  - description (описание)

- **Grade** - оценки
  - studentId, subjectId
  - gradeValue (значение оценки 1-10 или 0-100)
  - gradeType (enum: EXAM, CREDIT, COURSEWORK, TEST, LAB)
  - examDate (дата экзамена)
  - notes (заметки)
  - уникальный индекс по (studentId, subjectId, gradeType)

- **Group** - учебные группы
  - name (название группы, уникальное)
  - course (курс)
  - facultyId (связь с факультетом)

- **Faculty** - факультеты
  - name (название, уникальное)

- **Specialization** - специальности
  - name (название)
  - code (код специальности)
  - facultyId (связь с факультетом)

- **TeacherSubject** - связь преподавателей и предметов (many-to-many)
  - teacherId, subjectId
  - уникальный индекс по (teacherId, subjectId)

- **SubjectGroup** - связь предметов и групп (many-to-many)
  - subjectId, groupId
  - уникальный индекс по (subjectId, groupId)

### Особенности схемы
- Все модели используют `snake_case` в БД и `camelCase` в TypeScript
- Каскадное удаление для User → Student/Teacher
- SetNull для опциональных связей (group, specialization, faculty)
- Timestamps (createdAt, updatedAt) на всех моделях
- Уникальные индексы для предотвращения дублирования данных

## Разработка

### Backend
```bash
cd backend

# Development с hot reload
npm run start:dev

# Production сборка
npm run build
npm run start:prod

# Prisma команды
npx prisma studio          # GUI для БД
npx prisma migrate dev     # Создать миграцию
npx prisma generate        # Сгенерировать клиент
npx prisma db seed         # Заполнить тестовыми данными
npx prisma migrate deploy  # Применить миграции (production)
npx prisma migrate reset   # Сбросить БД (dev only!)

# Линтинг
npm run lint
```

### Frontend
```bash
cd frontend

# Development сервер
npm run dev

# Production сборка
npm run build
npm run preview

# Type checking
npm run typecheck
```

### Mobile
```bash
cd mobile

# Установить зависимости
flutter pub get

# Запустить (Android-эмулятор)
flutter run

# Запустить (iOS-симулятор)
flutter run -d iPhone

# Сборка
flutter build apk --release   # Android APK
flutter build ios --release   # iOS (только macOS)

# Линтер
flutter analyze
```

## Проверка качества

Из корня проекта:

```bash
npm run check      # lint + typecheck + тесты (backend и frontend)
npm run lint       # ESLint (backend, frontend) + Stylelint (frontend)
npm run typecheck  # tsc (backend) + vue-tsc (frontend)
npm test           # Jest (backend) + Vitest (frontend)
```

То же самое запускает CI (`.github/workflows/ci.yml`) на каждый push в `main` и на каждый pull request,
плюс сборка backend и frontend. Тесты не требуют БД: Prisma в них подменяется.

## Основные возможности

### Аутентификация и безопасность
- JWT-based аутентификация (access + refresh токены)
- Три роли пользователей: STUDENT, TEACHER, ADMIN
- Refresh токены в httpOnly cookies
- Access токены с коротким временем жизни (15 минут)
- Автоматическое обновление токенов
- Guards для защиты роутов по ролям

### Управление данными
- **Студенты**: полный CRUD, поиск по ФИО, фильтрация по группе/курсу/специальности
- **Преподаватели**: CRUD, назначение предметов, управление кафедрой
- **Предметы**: создание, редактирование, назначение преподавателям и группам
- **Группы**: управление группами с привязкой к факультетам и курсам
- **Факультеты**: организационная структура вуза
- **Специальности**: привязка к факультетам с кодами специальностей
- **Оценки**: 5 типов оценок (экзамен, зачёт, курсовая, контрольная, лабораторная)

### Дополнительные возможности
- Поиск и фильтрация по всем сущностям
- Пагинация результатов
- Swagger документация API
- Валидация данных через class-validator
- Каскадное удаление связанных данных
- Middleware для защиты роутов (auth, admin)
- Seed скрипт для тестовых данных

## Production Deployment

Для деплоя на production:

1. **Переменные окружения:** Обновить секреты JWT и DATABASE_URL
2. **База данных:** Настроить PostgreSQL на production сервере
3. **Миграции:** Выполнить `npx prisma migrate deploy`
4. **Seed:** Создать начальные данные через seed или админ панель
5. **Build:** Собрать фронтенд и бекенд
6. **Деплой:** Настроить CI/CD (например, через GitHub Actions)

## Миграции БД

История миграций начинается с одной baseline-миграции `backend/prisma/migrations/0_init` (полная схема).
Раньше первая миграция делала `ALTER` над таблицей, которой не существовало, поэтому `migrate deploy` падал на пустой БД.
Теперь пустая БД поднимается одной командой: `npx prisma migrate deploy` (то же делает `docker compose up`).

Новая миграция: `npx prisma migrate dev --name <имя>`.

### Уже существующая БД (Render и любая, созданная старыми миграциями)

Один раз, до первого деплоя с baseline, пометить `0_init` применённой. Иначе `migrate deploy` попытается
создать уже существующие таблицы и сборка упадёт (данные не пострадают).

```bash
cd backend
export DATABASE_URL="<External Database URL из Render>"

# 1. Схема БД должна совпадать с schema.prisma: команда должна вывести "No difference detected"
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code

# 2. Пометить baseline применённой (SQL не выполняется)
npx prisma migrate resolve --applied 0_init

# 3. Проверка
npx prisma migrate status
```

Если шаг 1 показал различия, шаг 2 не делать: сначала выясните, чем прод отличается от схемы.

## Troubleshooting

### База данных недоступна
```bash
# Проверьте что PostgreSQL запущен
docker ps

# Или запустите через docker-compose
docker-compose up -d postgres
```

### Backend не запускается
```bash
# Проверьте зависимости
cd backend
npm install

# Проверьте Prisma
npx prisma generate
```

### Frontend ошибки компиляции
```bash
cd frontend
rm -rf node_modules .nuxt
npm install
```

## Лицензия

MIT

## Автор

Created with Claude Code

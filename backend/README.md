# MITSO Record App - Backend

NestJS приложение для управления студенческими зачётками с полной системой аутентификации и авторизации. Версия: **v1.2.0**

## Предварительные требования

- Node.js >= 18
- PostgreSQL 12+ или Docker для запуска БД
- npm или yarn

## Установка

```bash
npm install
```

## Настройка базы данных

### Вариант 1: Docker (рекомендуется)

```bash
# Из корня проекта
docker-compose up -d postgres

# Проверить что контейнер запущен
docker ps
```

### Вариант 2: Локальный PostgreSQL

1. Установите PostgreSQL
2. Создайте базу данных:

```sql
CREATE DATABASE mitso_db;
```

3. Обновите `.env` файл с вашими credentials

## Миграции

```bash
# Выполнить миграции
npx prisma migrate dev

# Сгенерировать Prisma Client (уже выполнено после миграции)
npx prisma generate

# Открыть Prisma Studio для просмотра данных
npx prisma studio
```

## Запуск

```bash
# Development режим с hot reload
npm run start:dev

# Production сборка
npm run build
npm run start:prod
```

Сервер запустится на `http://localhost:8080`

API документация (Swagger) доступна на `http://localhost:8080/api/docs`

## Технологии и библиотеки

- **NestJS** (v10) - Фреймворк
- **Prisma** (v5.10) - ORM для PostgreSQL
- **Passport.js** - Аутентификация
- **JWT** - JSON Web Tokens для access/refresh токенов
- **bcrypt** - Хеширование паролей
- **class-validator** - Валидация DTO
- **class-transformer** - Трансформация данных
- **Swagger** (@nestjs/swagger) - API документация
- **Config** (@nestjs/config) - Управление переменными окружения
- **Throttler** (@nestjs/throttler) - Rate limiting
- **cookie-parser** - Парсинг cookies для refresh токенов

## Переменные окружения

Создайте файл `.env` в корне `backend/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mitso_db"
JWT_ACCESS_SECRET="mitso-access-secret-key-2024"
JWT_REFRESH_SECRET="mitso-refresh-secret-key-2024"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT=8080
```

Ключевые переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_ACCESS_SECRET` - секрет для access токенов (изменить в production!)
- `JWT_REFRESH_SECRET` - секрет для refresh токенов (изменить в production!)
- `JWT_ACCESS_EXPIRES_IN` - время жизни access токена (по умолчанию 15m)
- `JWT_REFRESH_EXPIRES_IN` - время жизни refresh токена (по умолчанию 7d)
- `FRONTEND_URL` - URL фронтенда для CORS
- `PORT` - порт сервера (по умолчанию 8080)

## Структура

```
src/
├── main.ts                    # Точка входа (CORS, Swagger, Global pipes)
├── app.module.ts              # Корневой модуль
├── auth/                      # Аутентификация JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── interfaces/
│   │   ├── jwt-payload.interface.ts
│   │   └── auth-user.interface.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── refresh-token.dto.ts
├── students/                  # Модуль студентов
│   ├── students.controller.ts
│   ├── students.service.ts
│   ├── students.module.ts
│   └── dto/
│       ├── create-student.dto.ts
│       ├── update-student.dto.ts
│       └── query-student.dto.ts
├── teachers/                  # Модуль преподавателей
│   ├── teachers.controller.ts
│   ├── teachers.service.ts
│   ├── teachers.module.ts
│   └── dto/
│       ├── create-teacher.dto.ts
│       ├── update-teacher.dto.ts
│       ├── query-teacher.dto.ts
│       ├── assign-subjects.dto.ts
│       └── set-teacher-subjects.dto.ts
├── subjects/                  # Модуль предметов
│   ├── subjects.controller.ts
│   ├── subjects.service.ts
│   └── subjects.module.ts
├── grades/                    # Модуль оценок
│   ├── grades.controller.ts
│   ├── grades.service.ts
│   ├── grades.module.ts
│   └── dto/
│       ├── create-grade.dto.ts
│       ├── batch-create-grade.dto.ts
│       ├── update-grade.dto.ts
│       └── query-grade.dto.ts
├── faculties/                 # Модуль факультетов
│   ├── faculties.controller.ts
│   ├── faculties.service.ts
│   ├── faculties.module.ts
│   └── dto/
│       ├── create-faculty.dto.ts
│       └── update-faculty.dto.ts
├── groups/                    # Модуль групп
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   ├── groups.module.ts
│   └── dto/
│       ├── create-group.dto.ts
│       └── update-group.dto.ts
├── specializations/           # Модуль специальностей
│   ├── specializations.controller.ts
│   ├── specializations.service.ts
│   ├── specializations.module.ts
│   └── dto/
│       ├── create-specialization.dto.ts
│       └── update-specialization.dto.ts
├── prisma/                    # Prisma Service (singleton)
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── common/                    # Общие утилиты
    ├── guards/
    │   ├── jwt-auth.guard.ts
    │   └── roles.guard.ts
    ├── decorators/
    │   ├── current-user.decorator.ts
    │   └── roles.decorator.ts
    ├── filters/
    │   └── http-exception.filter.ts
    └── interceptors/
        └── response.interceptor.ts
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход (email + password)
- `POST /api/auth/refresh` - Обновление access токена
- `POST /api/auth/logout` - Выход (очистка refresh токена)

### Студенты
- `GET /api/students` - Список студентов (с поиском и фильтрами)
- `GET /api/students/:id` - Студент по ID
- `POST /api/students` - Создать студента (ADMIN)
- `PATCH /api/students/:id` - Обновить студента (ADMIN)
- `DELETE /api/students/:id` - Удалить студента (ADMIN)

### Преподаватели
- `GET /api/teachers` - Список преподавателей
- `GET /api/teachers/:id` - Преподаватель по ID
- `POST /api/teachers` - Создать преподавателя (ADMIN)
- `PATCH /api/teachers/:id` - Обновить преподавателя (ADMIN)
- `DELETE /api/teachers/:id` - Удалить преподавателя (ADMIN)
- `POST /api/teachers/:id/subjects` - Назначить предметы преподавателю (ADMIN)

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

> **Swagger документация:** Полная интерактивная документация доступна по адресу `/api/docs`

## База данных (Prisma Schema)

Приложение использует следующие модели:

### Основные модели

- **User** - Пользователи системы
  - email (уникальный)
  - password (хешированный bcrypt)
  - role (enum: STUDENT, TEACHER, ADMIN)
  - refreshToken (для JWT refresh flow)
  - связи: Student (1:1), Teacher (1:1)

- **Student** - Профили студентов
  - userId (связь с User, уникальный)
  - firstName, lastName, middleName
  - studentId (номер зачётной книжки, уникальный)
  - course, enrollmentYear
  - groupId, specializationId (опционально)
  - phone, address, birthDate (опционально)
  - связи: User, Group, Specialization, Grade[]

- **Teacher** - Профили преподавателей
  - userId (связь с User, уникальный)
  - firstName, lastName, middleName
  - department, position
  - academicDegree, phone, officeNumber (опционально)
  - связи: User, TeacherSubject[]

- **Subject** - Предметы
  - name, code (уникальный), credits, semester
  - description (опционально)
  - связи: TeacherSubject[], SubjectGroup[], Grade[]

- **Grade** - Оценки
  - studentId, subjectId
  - gradeValue (1-10 или 0-100)
  - gradeType (enum: EXAM, CREDIT, COURSEWORK, TEST, LAB)
  - examDate, notes (опционально)
  - уникальный индекс: (studentId, subjectId, gradeType)
  - связи: Student, Subject

- **Group** - Учебные группы
  - name (уникальное), course
  - facultyId (опционально)
  - связи: Faculty, Student[], SubjectGroup[]

- **Faculty** - Факультеты
  - name (уникальное)
  - связи: Specialization[], Group[]

- **Specialization** - Специальности
  - name, code, facultyId
  - связи: Faculty, Student[]

### Связующие модели (many-to-many)

- **TeacherSubject** - Связь преподавателей и предметов
  - teacherId, subjectId
  - уникальный индекс: (teacherId, subjectId)

- **SubjectGroup** - Связь предметов и групп
  - subjectId, groupId
  - уникальный индекс: (subjectId, groupId)

### Особенности схемы
- Все модели используют `snake_case` в БД и `camelCase` в TypeScript
- Каскадное удаление: User → Student/Teacher, Faculty → Specialization
- SetNull при удалении: Group/Specialization при удалении не удаляют Student
- Timestamps (createdAt, updatedAt) на всех моделях
- Уникальные индексы для предотвращения дублирования

### Миграции

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Применить миграции (production)
npx prisma migrate deploy

# Просмотреть статус миграций
npx prisma migrate status

# Сбросить базу и применить все миграции заново (DEV ONLY!)
npx prisma migrate reset
```

## Аутентификация

Приложение использует JWT-based аутентификацию с двумя типами токенов:

- **Access Token** - короткоживущий (15 минут), передается в заголовке Authorization
- **Refresh Token** - долгоживущий (7 дней), хранится в httpOnly cookie

### Роли пользователей

- **STUDENT** - Доступ к своим оценкам и расписанию
- **TEACHER** - Доступ к студентам, выставление оценок по своим предметам
- **ADMIN** - Полный доступ ко всем данным и операциям CRUD

### Guards и Decorators

```typescript
// В контроллерах используются:
@UseGuards(JwtAuthGuard)  // Проверка JWT токена
@Roles('ADMIN')           // Проверка роли пользователя
@CurrentUser()            // Декоратор для получения текущего пользователя
```

## Troubleshooting

### База данных не доступна

Убедитесь что PostgreSQL запущен:

```bash
# Docker
docker-compose up -d postgres

# Локально (Linux/Mac)
brew services start postgresql

# Проверка подключения
psql -U postgres -h localhost
```

### Ошибки TypeScript

```bash
npm run build
```

### Prisma ошибки

```bash
# Пересоздать Prisma Client
npx prisma generate

# Сбросить базу (УДАЛИТ ВСЕ ДАННЫЕ!)
npx prisma migrate reset

# Проверить схему
npx prisma format
npx prisma validate
```

### CORS ошибки

Убедитесь что `FRONTEND_URL` в `.env` соответствует вашему фронтенду:

```env
FRONTEND_URL="http://localhost:3000"
```

## Seed данные

Для заполнения базы тестовыми данными:

```bash
npx prisma db seed
```

Seed скрипт создаст:
- Тестовых пользователей (студенты, преподаватели, администратор)
- Факультеты и специальности
- Группы и предметы
- Тестовые оценки

> **Важно:** Seed данные предназначены только для разработки!

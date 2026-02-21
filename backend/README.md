# MITSO Record App - Backend

NestJS приложение для управления студенческими зачётками.

## Предварительные требования

- Node.js >= 18 (текущая v16.19.0 работает с warnings)
- PostgreSQL 12+ или Docker для запуска БД

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

API документация доступна на `http://localhost:8080/api/docs`

## Переменные окружения

Смотрите `.env.example` для списка всех переменных.

Ключевые переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_ACCESS_SECRET` - секрет для access токенов
- `JWT_REFRESH_SECRET` - секрет для refresh токенов
- `PORT` - порт сервера (по умолчанию 8080)

## Структура

```
src/
├── auth/           # Аутентификация JWT
├── students/       # Модуль студентов
├── teachers/       # Модуль преподавателей
├── subjects/       # Модуль предметов
├── grades/         # Модуль оценок
├── prisma/         # Prisma Service
├── common/         # Guards, Decorators, Filters
├── app.module.ts
└── main.ts
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход

### Студенты
- `GET /api/students` - Список студентов (с поиском)
- `GET /api/students/:id` - Студент по ID
- `POST /api/students` - Создать студента (ADMIN)
- `PATCH /api/students/:id` - Обновить студента (ADMIN)
- `DELETE /api/students/:id` - Удалить студента (ADMIN)

### Преподаватели
- `GET /api/teachers` - Список преподавателей
- `GET /api/teachers/:id` - Преподаватель по ID

### Оценки
- `GET /api/grades/student/:id` - Оценки студента
- `GET /api/grades` - Список оценок (с фильтрами)
- `POST /api/grades` - Создать оценку (TEACHER, ADMIN)

### Предметы
- `GET /api/subjects` - Список предметов
- `GET /api/subjects/:id` - Предмет по ID

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
```

# MITSO Record App

Полноценное приложение для учёта студенческих зачёток, оценок и информации о предметах.

## Стек технологий

### Backend
- **NestJS** - Серверный фреймворк
- **PostgreSQL** - База данных
- **Prisma** - ORM
- **JWT** - Аутентификация
- **TypeScript** - Строгая типизация

### Frontend
- **Nuxt 3** - Full-stack Vue фреймворк
- **Vue 3** - UI библиотека
- **Pinia** - State management
- **TypeScript** - Строгая типизация
- **FSD** - Feature-Sliced Design архитектура

## Быстрый старт

### 1. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
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

### 4. Запуск приложения

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
- **API Docs:** http://localhost:8080/api/docs

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
│   │   ├── prisma/       # Prisma сервис
│   │   └── common/       # Общие утилиты
│   ├── prisma/           # Prisma схема и миграции
│   └── package.json
│
├── frontend/             # Nuxt 3 приложение
│   ├── src/
│   │   ├── pages/        # Страницы (роутинг)
│   │   ├── features/     # Фичи с бизнес-логикой
│   │   ├── entities/     # Бизнес-сущности
│   │   ├── shared/       # Переиспользуемый код
│   │   └── app/          # Конфигурация приложения
│   └── package.json
│
└── docker-compose.yml    # Docker конфигурация
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход

### Студенты
- `GET /api/students` - Список студентов (с поиском)
- `GET /api/students/:id` - Студент по ID

### Преподаватели
- `GET /api/teachers` - Список преподавателей
- `GET /api/teachers/:id` - Преподаватель по ID

### Оценки
- `GET /api/grades/student/:id` - Оценки студента
- `GET /api/grades` - Список оценок с фильтрами

### Предметы
- `GET /api/subjects` - Список предметов
- `GET /api/subjects/:id` - Предмет по ID

## Переменные окружения

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mitso_db"
JWT_ACCESS_SECRET="mitso-access-secret-key-2024"
JWT_REFRESH_SECRET="mitso-refresh-secret-key-2024"
PORT=8080
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

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

## Тестирование

1. **Backend TypeScript check:**
   ```bash
   cd backend
   npm run build
   ```

2. **Frontend TypeScript check:**
   ```bash
   cd frontend
   npm run typecheck
   ```

## Следующие шаги для полного функционала

Приложение готово к использованию, но для production рекомендуется:

1. **База данных:** Запустить PostgreSQL (`docker-compose up -d postgres` или локально)
2. **Миграции:** Выполнить `npx prisma migrate dev` в backend
3. **Seed data:** Добавить тестовые данные для демонстрации
4. **Тесты:** Добавить unit и e2e тесты
5. **Деплой:** Настроить CI/CD для автоматического деплоя

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

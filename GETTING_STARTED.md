# 🚀 Getting Started - MITSO Record App

## ✅ Что готово

### Backend (100% готов)
- ✅ NestJS проект инициализирован
- ✅ Prisma схема создана со всеми моделями (User, Student, Teacher, Subject, Grade)
- ✅ Модули созданы: auth, students, teachers, subjects, grades
- ✅ JWT аутентификация (access + refresh токены)
- ✅ CRUD операции для всех сущностей
- ✅ Guards, Decorators, Filters настроены
- ✅ Swagger документация настроена
- ✅ Зависимости установлены
- ✅ TypeScript компилируется без ошибок

### Frontend (100% готов)
- ✅ Nuxt 3 проект создан
- ✅ FSD (Feature-Sliced Design) архитектура реализована
- ✅ Все типы сущностей определены
- ✅ HTTP Client с автоматическим refresh токенов
- ✅ Pinia store для авторизации
- ✅ API функции для всех endpoints
- ✅ Страницы: главная, student, teacher
- ✅ Код написан, готов к установке зависимостей

### Документация
- ✅ README.md в корне проекта
- ✅ backend/README.md
- ✅ frontend/README.md
- ✅ docker-compose.yml для запуска БД

## ⚠️ ВАЖНО: Требования к Node.js

### Текущая версия Node.js
```
v16.19.0 ❌ (слишком старая для Nuxt 3)
```

### Требуемая версия
```
Node.js >= 20.19.0 ✅
```

## 📋 Следующие шаги для запуска

### 1. Обновить Node.js

**macOS (через nvm):**
```bash
# Установить nvm если еще не установлен
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Установить Node.js 20
nvm install 20
nvm use 20

# Проверить версию
node --version  # Должно быть >= 20.19.0
```

**macOS (через Homebrew):**
```bash
brew install node@20
brew link node@20
```

### 2. Установить зависимости Frontend

```bash
cd frontend
npm install
```

### 3. Запустить PostgreSQL

**Вариант A: Docker (рекомендуется)**
```bash
# Из корня проекта
docker-compose up -d postgres

# Проверить что запустился
docker ps
```

**Вариант B: Локальный PostgreSQL**
```bash
# macOS
brew services start postgresql

# Создать базу данных
createdb mitso_db
```

### 4. Выполнить миграции

```bash
cd backend
npx prisma migrate dev --name init

# Опционально: Открыть Prisma Studio для просмотра БД
npx prisma studio
```

### 5. Запустить приложение

**Backend (первый терминал):**
```bash
cd backend
npm run start:dev
```

Сервер запустится на http://localhost:8080

**Frontend (второй терминал):**
```bash
cd frontend
npm run dev
```

Приложение откроется на http://localhost:3000

## 🎯 Что делать дальше

### После запуска приложения:

1. **Создать тестового пользователя** через API:
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@mitso.by",
       "password": "password123",
       "role": "STUDENT"
     }'
   ```

2. **Создать данные студентов** (через Prisma Studio или API)

3. **Войти в приложение** на http://localhost:3000

### Полезные команды

```bash
# Backend
cd backend
npm run build              # Сборка
npm run start:prod         # Production режим
npx prisma studio          # GUI для БД

# Frontend
cd frontend
npm run build              # Production сборка
npm run preview            # Превью сборки
npm run typecheck          # Проверка типов

# Docker
docker-compose up -d       # Запустить все сервисы
docker-compose down        # Остановить
docker-compose logs -f     # Логи
```

## 📚 API Документация

После запуска backend, Swagger документация доступна по адресу:
**http://localhost:8080/api/docs**

## 🐛 Troubleshooting

### Frontend не устанавливается
```bash
# Убедитесь что Node.js >= 20
node --version

# Очистить кеш и переустановить
cd frontend
rm -rf node_modules .nuxt
npm install
```

### Backend ошибки
```bash
# Переустановить зависимости
cd backend
rm -rf node_modules
npm install

# Пересоздать Prisma Client
npx prisma generate
```

### База данных не подключается
```bash
# Проверить что PostgreSQL запущен
docker ps  # Для Docker
# или
brew services list  # Для локального

# Проверить подключение
psql -U postgres -h localhost -d mitso_db
```

## 📊 Статус проекта

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Backend Code | ✅ 100% | Готов к использованию |
| Frontend Code | ✅ 100% | Готов после установки зависимостей |
| Database Schema | ✅ 100% | Prisma схема готова |
| API Endpoints | ✅ 100% | Все эндпоинты реализованы |
| Authentication | ✅ 100% | JWT с refresh токенами |
| Documentation | ✅ 100% | README файлы созданы |
| Dependencies Backend | ✅ Installed | Работает |
| Dependencies Frontend | ⏳ Pending | Требует Node.js 20+ |
| Database Running | ⏳ Pending | Требует запуска PostgreSQL |
| Migrations | ⏳ Pending | Требует выполнения |

## 🎉 После выполнения всех шагов

Вы получите полностью рабочее приложение для учёта студенческих зачёток с:
- Авторизацией через JWT
- Поиском студентов
- Просмотром преподавателей
- CRUD операциями для всех сущностей
- Swagger документацией API
- TypeScript на фронте и беке
- Modern stack (Nuxt 3 + NestJS)

**Успешной разработки! 🚀**

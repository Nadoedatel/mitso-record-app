# MITSO Record App - Frontend

Nuxt 3 приложение для учёта студенческих зачёток с админ панелью.

## Стек

- **Nuxt 3** (v3.11.0) - Full-stack Vue фреймворк
- **Vue 3** - Composition API с `<script setup>`
- **TypeScript** - Строгая типизация
- **Pinia** - State management
- **TailwindCSS** - Utility-first CSS фреймворк
- **FSD Architecture** - Feature-Sliced Design
- Node.js ^20.19.0 || >=22.12.0

## Установка

```bash
npm install
```

## Запуск

```bash
# Development сервер
npm run dev

# Production сборка
npm run build
npm run preview

# Type checking
npm run typecheck
```

Приложение запустится на `http://localhost:3000`

## Архитектура (FSD)

```
src/
├── app.vue           # Корневой компонент
├── middleware/       # Route middleware
│   ├── auth.ts       # Проверка авторизации
│   └── admin.ts      # Проверка прав администратора
├── pages/            # Страницы (Nuxt файловый роутинг)
│   ├── index.vue     # Главная страница
│   ├── login.vue     # Страница входа
│   ├── student.vue   # Страница студента
│   ├── teacher.vue   # Страница преподавателя
│   ├── admin.vue     # Админ панель
│   ├── students/
│   │   ├── index.vue # Список студентов
│   │   └── [id].vue  # Детали студента
│   └── subjects/
│       └── [id]/
│           └── grades.vue  # Выставление оценок
├── features/         # Фичи с API функциями
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   └── model/useAuth.ts
│   ├── students/
│   │   └── api/studentsApi.ts
│   ├── teachers/
│   │   └── api/teachersApi.ts
│   ├── grades/
│   │   └── api/gradesApi.ts
│   ├── subjects/
│   │   └── api/subjectsApi.ts
│   ├── faculties/
│   │   └── api/facultiesApi.ts
│   ├── groups/
│   │   └── api/groupsApi.ts
│   └── specializations/
│       └── api/specializationsApi.ts
├── entities/         # Бизнес-сущности с типами
│   ├── user/
│   │   └── model/types.ts
│   ├── student/
│   │   └── model/types.ts
│   ├── teacher/
│   │   └── model/types.ts
│   ├── grade/
│   │   └── model/types.ts
│   ├── subject/
│   │   └── model/types.ts
│   ├── faculty/
│   │   └── model/types.ts
│   ├── group/
│   │   └── model/types.ts
│   └── specialization/
│       └── model/types.ts
└── shared/           # Переиспользуемый код
    ├── api/
    │   └── httpClient.ts  # Базовый HTTP клиент
    └── lib/
        └── storage.ts     # Утилиты для localStorage
```

## Переменные окружения

Создайте файл `.env`:

```env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

## API Integration

Фронтенд подключается к backend API на `localhost:8080`.

Убедитесь что backend запущен перед использованием фронтенда.

## Основные функции

### Для всех пользователей
- **Авторизация** - Вход через email/пароль с JWT токенами (access + refresh)
- **Защищённые роуты** - Middleware для проверки авторизации

### Для студентов
- Просмотр своих оценок
- Просмотр расписания предметов
- Просмотр информации о группе и факультете

### Для преподавателей
- Просмотр списка студентов
- Выставление оценок по предметам
- Просмотр групп и предметов

### Для администраторов
- **CRUD студенты** - Создание, просмотр, редактирование, удаление студентов
- **CRUD преподаватели** - Управление преподавателями
- **CRUD предметы** - Управление предметами
- **CRUD группы** - Управление группами
- **CRUD факультеты** - Управление факультетами
- **CRUD специальности** - Управление специальностями
- **Назначение предметов** - Привязка предметов к преподавателям и группам
- **Управление оценками** - Просмотр и редактирование всех оценок

## Страницы приложения

| URL | Описание | Доступ |
|-----|----------|--------|
| `/` | Главная страница | Все |
| `/login` | Страница входа | Не авторизованные |
| `/student` | Личный кабинет студента | Студенты |
| `/teacher` | Личный кабинет преподавателя | Преподаватели |
| `/admin` | Админ панель | Администраторы |
| `/students` | Список студентов | Преподаватели, Админы |
| `/students/:id` | Детали студента | Преподаватели, Админы |
| `/subjects/:id/grades` | Выставление оценок | Преподаватели, Админы |

## Troubleshooting

### Backend недоступен

Убедитесь что backend запущен на порту 8080:

```bash
cd ../backend
npm run start:dev
```

### TypeScript ошибки

```bash
npm run typecheck
```

### Проблемы с зависимостями

```bash
rm -rf node_modules .nuxt
npm install
```

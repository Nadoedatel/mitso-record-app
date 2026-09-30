# MITSO Record App - Frontend

Nuxt 4 приложение для учёта студенческих зачёток с админ панелью. Версия: **v3.2.7**

## Стек

- **Nuxt 4** - Vue фреймворк (SPA, `ssr: false`)
- **Vue 3** - Composition API с `<script setup>`
- **TypeScript** - Строгая типизация (strict mode)
- **Pinia** - State management (`@pinia/nuxt`)
- **FSD Architecture** - Feature-Sliced Design
- **Shared UI Library** - собственная библиотека переиспользуемых компонентов
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
app/
├── app.vue                    # Корневой компонент
├── app/
│   └── styles/main.scss        # Глобальные стили и CSS reset
├── middleware/                # Route middleware
│   ├── auth.ts                # Редирект на /login если нет токена
│   └── admin.ts               # Редирект если роль != ADMIN
├── pages/                     # Страницы (Nuxt файловый роутинг)
│   ├── index.vue              # Главная страница
│   ├── login.vue              # Страница входа
│   ├── student.vue            # Личный кабинет студента
│   ├── teacher.vue            # Личный кабинет преподавателя
│   ├── admin.vue              # Админ панель (вкладки управления)
│   ├── students/
│   │   ├── index.vue          # Список студентов с поиском и фильтрами
│   │   └── [id].vue           # Детали студента и его оценки
│   └── subjects/
│       └── [id]/
│           └── grades.vue     # Выставление оценок по предмету
├── features/                  # Фичи с API функциями
│   ├── auth/
│   │   ├── api/authApi.ts     # login, register, refresh, logout, getMe
│   │   └── model/useAuth.ts   # Pinia store + composable
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
├── entities/                  # Бизнес-сущности с типами
│   ├── user/model/types.ts    # User, Role enum
│   ├── student/model/types.ts # Student со всеми полями
│   ├── teacher/model/types.ts # Teacher со всеми полями
│   ├── grade/model/types.ts   # Grade, GradeType enum
│   ├── subject/model/types.ts # Subject
│   ├── faculty/model/types.ts # Faculty
│   ├── group/model/types.ts   # Group
│   └── specialization/model/types.ts  # Specialization
└── shared/                    # Переиспользуемый код
    ├── api/
    │   └── httpClient.ts      # HTTP клиент: auto token, 401-refresh interceptor
    ├── lib/
    │   └── storage.ts         # Утилиты для localStorage
    └── ui/                    # Shared UI библиотека компонентов
        ├── Alert/             # Alert
        ├── Badge/             # Badge, GradeTypeBadge, GradeValueBadge
        ├── Button/            # Button
        ├── Card/              # Card, InfoCard
        ├── Checkbox/          # Checkbox
        ├── Form/              # Form, FormField, FormRow
        ├── Input/             # Input, NumberInput, SearchInput
        ├── Layout/            # Container, Header, Section
        ├── Loading/           # LoadingSpinner, LoadingState, EmptyState
        ├── Modal/             # Modal, ModalActions, ModalHeader
        ├── Pagination/        # Pagination
        ├── Select/            # Select
        ├── Table/             # Table, TableCell, TableRow
        ├── Tabs/              # Tabs
        └── index.ts           # Barrel export всех компонентов
```

## Типы оценок (GradeType)

Приложение поддерживает 5 типов оценок:
- **EXAM** - Экзамен
- **CREDIT** - Зачёт
- **COURSEWORK** - Курсовая работа
- **TEST** - Контрольная работа
- **LAB** - Лабораторная работа

## Переменные окружения

Создайте файл `.env`:

```env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Shared UI Library

Все UI компоненты находятся в `app/shared/ui/` и импортируются через barrel:

```typescript
import { Button, Input, Modal, Table, Badge } from '@/shared/ui'
```

| Компонент | Описание |
|-----------|----------|
| `Button` | Кнопка (primary, secondary, success, danger, ghost) |
| `Input`, `SearchInput`, `NumberInput` | Поля ввода |
| `Select` | Выпадающий список |
| `Checkbox` | Чекбокс |
| `Form`, `FormField`, `FormRow` | Форма с сетками и валидацией |
| `Modal`, `ModalActions`, `ModalHeader` | Модальные окна |
| `Table`, `TableCell`, `TableRow` | Таблица с кастомными ячейками |
| `Card`, `InfoCard` | Карточки |
| `Badge`, `GradeTypeBadge`, `GradeValueBadge` | Бейджи и метки оценок |
| `Alert` | Уведомления (success, error, warning, info) |
| `Tabs` | Вкладки |
| `Pagination` | Пагинация |
| `LoadingSpinner`, `LoadingState`, `EmptyState` | Состояния загрузки |
| `Container`, `Header`, `Section` | Layout компоненты |

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
- **Управление студентами** - Полный CRUD студентов с привязкой к группам и специальностям
- **Управление преподавателями** - CRUD преподавателей с указанием кафедры и должности
- **Управление предметами** - CRUD предметов с кодами и количеством кредитов
- **Управление группами** - CRUD групп с привязкой к факультетам и курсам
- **Управление факультетами** - CRUD факультетов
- **Управление специальностями** - CRUD специальностей с кодами и привязкой к факультетам
- **Назначение предметов** - Привязка предметов к преподавателям и группам
- **Управление оценками** - Просмотр и редактирование всех оценок (5 типов)
- **Фильтрация и поиск** - Поиск по всем сущностям с мощными фильтрами

## Страницы приложения

| URL | Описание | Доступ |
|-----|----------|--------|
| `/` | Главная страница | Все |
| `/login` | Страница входа | Не авторизованные |
| `/student` | Личный кабинет студента | Студенты |
| `/teacher` | Личный кабинет преподавателя | Преподаватели |
| `/admin` | Админ панель с вкладками управления | Администраторы |
| `/students` | Список студентов с фильтрами | Преподаватели, Админы |
| `/students/:id` | Детали студента и его оценки | Преподаватели, Админы |
| `/subjects/:id/grades` | Выставление оценок по предмету | Преподаватели, Админы |

### Админ панель (вкладки)
- **Студенты** - управление студентами, добавление, редактирование, удаление
- **Преподаватели** - управление преподавателями и назначение предметов
- **Предметы** - управление предметами и привязка к группам
- **Группы** - управление группами с привязкой к факультетам
- **Факультеты** - управление факультетами
- **Специальности** - управление специальностями с привязкой к факультетам
- **Оценки** - просмотр и редактирование всех оценок

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

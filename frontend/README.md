# MITSO Record App - Frontend

Nuxt 3 приложение для учёта студенческих зачёток.

## Стек

- **Nuxt 3** - Full-stack Vue фреймворк
- **TypeScript** - Строгая типизация
- **Pinia** - State management
- **FSD Architecture** - Feature-Sliced Design

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
├── app/              # Конфигурация приложения
├── pages/            # Страницы (Nuxt файловый роутинг)
│   ├── index.vue     # Главная с выбором роли
│   ├── student.vue   # Страница студента
│   └── teacher.vue   # Страница преподавателя
├── widgets/          # Композитные UI блоки
├── features/         # Фичи с бизнес-логикой
│   ├── auth/         # Авторизация
│   ├── students/     # API студентов
│   ├── teachers/     # API преподавателей
│   ├── grades/       # API оценок
│   └── subjects/     # API предметов
├── entities/         # Бизнес-сущности
│   ├── user/
│   ├── student/
│   ├── teacher/
│   ├── grade/
│   └── subject/
└── shared/           # Переиспользуемый код
    ├── api/          # HTTP клиент
    └── lib/          # Утилиты
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

1. **Авторизация** - Вход через email/пароль с JWT токенами
2. **Студенты** - Поиск и просмотр информации о студентах
3. **Преподаватели** - Просмотр информации о преподавателях
4. **Роли** - Сохранение выбранной роли в localStorage

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

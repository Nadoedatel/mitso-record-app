# MITSO Record App — Mobile

Мобильный клиент для студентов и преподавателей. Позволяет просматривать оценки и зачётные записи, а также выставлять оценки (для преподавателей).

## Стек

| Слой | Технология |
|---|---|
| UI / Framework | Flutter 3.x |
| Язык | Dart >=3.3.0 |
| State management | Riverpod 2 (`flutter_riverpod`) |
| Роутинг | GoRouter 14 |
| HTTP | Dio 5 + CookieManager |
| Хранение токенов | flutter_secure_storage |
| Платформы | Android, iOS |

## Архитектура

Проект следует принципам Feature-Sliced Design:

```
lib/
├── main.dart                  # точка входа
├── app.dart                   # корневой виджет (MaterialApp + GoRouter)
├── core/
│   ├── api/
│   │   ├── api_client.dart    # singleton Dio + interceptors
│   │   └── api_exception.dart # типизированные ошибки API
│   ├── router/
│   │   └── app_router.dart    # GoRouter с role-based guards
│   └── theme/
│       └── app_theme.dart     # тема приложения
├── features/
│   ├── auth/
│   │   ├── data/auth_repository.dart
│   │   ├── presentation/login_screen.dart
│   │   └── providers/auth_provider.dart
│   ├── student/
│   │   ├── data/student_repository.dart
│   │   ├── presentation/
│   │   │   ├── student_home_screen.dart
│   │   │   └── student_detail_screen.dart
│   │   └── providers/student_provider.dart
│   └── teacher/
│       ├── data/teacher_repository.dart
│       ├── presentation/
│       │   ├── teacher_home_screen.dart
│       │   └── grade_entry_screen.dart
│       └── providers/teacher_provider.dart
└── shared/
    ├── models/          # User, Student, Teacher, Grade, Group, Subject
    └── widgets/         # GradeBadge, LoadingWidget, ErrorWidget
```

## Роли и маршруты

| Роль | Начальный экран | Доступные маршруты |
|---|---|---|
| `STUDENT` | `/student` | `/student`, `/students/:id` |
| `TEACHER` | `/teacher` | `/teacher`, `/teacher/grades` |
| `ADMIN` | `/student` (пока) | — |

Неавторизованные пользователи перенаправляются на `/login`. GoRouter автоматически сбрасывает маршруты при попытке зайти в чужую роль.

## Auth Flow

1. Логин → backend возвращает `accessToken` + `refreshToken` (httpOnly cookie)
2. `accessToken` сохраняется в `FlutterSecureStorage`
3. `refreshToken` сохраняется в `PersistCookieJar` (файловое хранилище)
4. При 401 — `_AuthInterceptor` автоматически вызывает `/auth/refresh` и повторяет запрос
5. Неуспешный refresh → очистка токена и cookie, редирект на `/login`

## Разработка

### Требования

- Flutter SDK 3.x (`flutter --version`)
- Android Studio / Xcode (для эмуляторов)
- Запущенный backend (порт `8080`)

### Установка и запуск

```bash
cd mobile

# Установить зависимости
flutter pub get
```

#### iOS-симулятор (macOS)

1. Открой симулятор:
   ```bash
   open -a Simulator
   ```
   Либо запусти напрямую — Flutter сам поднимет его:
   ```bash
   flutter run -d "iPhone 17 Pro"
   ```

2. Посмотреть список доступных симуляторов:
   ```bash
   xcrun simctl list devices available
   ```

3. Запустить (симулятор уже открыт):
   ```bash
   flutter run
   ```

#### iOS — физический iPhone (macOS + кабель)

1. Подключи iPhone кабелем, нажми **"Доверять"** на устройстве.

2. Включи **Режим разработчика** (iOS 16+):
   **Настройки → Конфиденциальность и безопасность → Режим разработчика → Включить**

3. Открой проект в Xcode и настрой подписание:
   ```bash
   open ios/Runner.xcworkspace
   ```
   В Xcode: **Runner → Signing & Capabilities → Team** — выбери свой Apple ID.

4. Проверь, что устройство видно, и запусти:
   ```bash
   flutter devices   # iPhone должен быть в списке
   flutter run
   ```

   > После первого запуска на iPhone появится запрос доверия к разработчику:
   > **Настройки → Основные → VPN и управление устройством** → доверяй своему Apple ID.

#### Android-эмулятор

```bash
# Создать и запустить AVD через Android Studio, затем:
flutter run
```

> **Важно:** базовый URL в `core/api/api_client.dart`:
> - Android-эмулятор → `http://10.0.2.2:8080/api` (`localhost` хоста внутри эмулятора)
> - iOS-симулятор / физический iPhone → `http://localhost:8080/api`

### Сборка

```bash
# Android APK
flutter build apk --release

# iOS (только на macOS)
flutter build ios --release
```

### Линтер

```bash
flutter analyze
```

Конфигурация линтера: `analysis_options.yaml` (базируется на `flutter_lints`).

## Связь с backend

Приложение использует общий API монорепозитория:

- Базовый URL: `/api`
- Аутентификация: `Bearer <accessToken>` в заголовке `Authorization`
- Ответы оборачиваются в `{ "data": ..., "message": "ok" }` — разворачивает `_ResponseUnwrapInterceptor`

Подробнее об эндпоинтах — в корневом `CLAUDE.md`.

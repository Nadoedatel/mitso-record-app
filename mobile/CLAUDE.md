# CLAUDE.md — Mobile

Правила для работы с мобильным Flutter-приложением MITSO Record App.

## Обзор

Мобильный клиент для студентов и преподавателей: просмотр оценок, зачётных книжек, выставление оценок.

Платформы: **iOS** и **Android**.

---

## Tech Stack

| Слой | Технология |
|------|------------|
| Язык | Dart `>=3.3.0 <4.0.0` |
| Фреймворк | Flutter 3.x, Material Design 3 |
| State management | Riverpod 2 (`flutter_riverpod: ^2.6.1`) |
| Навигация | GoRouter 14 (`go_router: ^14.6.3`) |
| HTTP | Dio 5 (`dio: ^5.7.0`) |
| Cookie | `cookie_jar` + `dio_cookie_manager` |
| Хранение токенов | `flutter_secure_storage` (нативное) |
| Линтер | `flutter_lints: ^5.0.0` |

---

## Development Commands

```bash
cd mobile

flutter pub get          # установить зависимости
flutter run              # запуск на подключённом устройстве/эмуляторе
flutter run -d <id>      # запуск на конкретном устройстве
flutter build apk        # собрать APK (Android)
flutter build ios        # собрать iOS (только macOS)
flutter analyze          # статический анализ кода
flutter test             # запуск тестов
```

### Устройства и Base URL

- **iOS симулятор / физическое устройство**: `http://localhost:8080/api`
- **Android эмулятор**: `http://10.0.2.2:8080/api` — эмулятор не видит `localhost` хоста

Base URL настраивается в `lib/core/api/api_client.dart`.

---

## Архитектура (Feature-Sliced Design)

```
lib/
├── main.dart                    # Точка входа: инициализация ApiClient, ProviderScope
├── app.dart                     # Корневой виджет: MaterialApp.router + GoRouter
├── core/
│   ├── api/
│   │   ├── api_client.dart      # Singleton Dio: интерсепторы, cookie, токены
│   │   └── api_exception.dart   # Кастомный класс исключений
│   ├── router/
│   │   └── app_router.dart      # GoRouter: маршруты + role-based redirect guard
│   └── theme/
│       └── app_theme.dart       # Material 3 тема
├── features/                    # Доменные модули
│   ├── auth/
│   │   ├── data/auth_repository.dart
│   │   ├── presentation/login_screen.dart
│   │   └── providers/auth_provider.dart
│   ├── student/
│   │   ├── data/student_repository.dart
│   │   ├── presentation/{student_home_screen,student_detail_screen}.dart
│   │   └── providers/student_provider.dart
│   └── teacher/
│       ├── data/teacher_repository.dart
│       ├── presentation/{teacher_home_screen,grade_entry_screen}.dart
│       └── providers/teacher_provider.dart
└── shared/
    ├── models/                  # Общие модели данных
    │   ├── user.dart            # User + Role enum
    │   ├── student.dart
    │   ├── teacher.dart
    │   ├── grade.dart           # Grade + GradeType + StudentWithGrade
    │   ├── group.dart
    │   └── subject.dart
    └── widgets/                 # Переиспользуемые UI-компоненты
        ├── grade_badge.dart     # Бейдж с цветовой индикацией оценки
        ├── loading_widget.dart
        └── error_widget.dart    # Ошибка + кнопка "Повторить"
```

---

## Слои и правила их взаимодействия

### Presentation (widgets, screens)
- Только `ConsumerWidget` или `ConsumerStatefulWidget` — никакого `StatefulWidget` без необходимости
- Данные читаются через `ref.watch(provider)` — никогда не обращаться к репозиторию напрямую
- Действия вызываются через `ref.read(provider.notifier).method()`
- Инвалидация кеша: `ref.invalidate(provider)` после успешных мутаций
- Все async-состояния обрабатываются через `.when(loading:, error:, data:)`
- Вложенные приватные классы для вкладок: `_ProfileTab`, `_GradesTab` и т.д.

### Data (repositories)
- `const` конструкторы — репозитории не имеют состояния
- Только работа с API, никакой бизнес-логики
- Каждый репозиторий регистрируется как `Provider`: `final fooRepositoryProvider = Provider((_) => const FooRepository())`
- Парсинг ответа непосредственно в репозитории: `(response.data as List).map(Model.fromJson).toList()`

### Models (shared/models)
- Иммутабельные data-классы, `const` конструкторы
- Фабричный конструктор `fromJson(Map<String, dynamic>)` в каждой модели
- Метод `toJson()` — только в моделях, которые отправляются на сервер
- Поля в camelCase — бекенд возвращает camelCase, Prisma конвертирует автоматически
- Геттеры-хелперы (`fullName`, `gradeTypeLabel`) определяются в модели

---

## API Client

**Файл:** `lib/core/api/api_client.dart`

Singleton с тремя интерсепторами (порядок важен):
1. `CookieManager` — сохранение httpOnly `refreshToken` в `PersistCookieJar`
2. `_ResponseUnwrapInterceptor` — разворачивает конверт `{ "data": ..., "message": "ok" }`
3. `_AuthInterceptor` — добавляет `Authorization: Bearer <token>`, обрабатывает 401

**Auth flow (refresh):**
- При 401 — вызывает `/auth/refresh` через отдельный `refreshDio` (без `_AuthInterceptor`)
- Если успешно — сохраняет новый токен, повторяет оригинальный запрос
- Если неуспешно — очищает токен и cookies, пользователь попадает на логин

**Инициализация:** `await ApiClient.instance.init()` вызывается в `main()` до `runApp()`.

---

## Навигация (GoRouter)

**Файл:** `lib/core/router/app_router.dart`

Маршруты:
| Путь | Экран | Роль |
|------|-------|------|
| `/login` | LoginScreen | — |
| `/student` | StudentHomeScreen | student |
| `/students/:id` | StudentDetailScreen | student / teacher |
| `/teacher` | TeacherHomeScreen | teacher |
| `/teacher/grades` | GradeEntryScreen | teacher |

**Redirect guard:**
- Не авторизован → `/login`
- Авторизован + на `/login` → роль-based redirect (`/student` или `/teacher`)
- Студент пытается попасть в `/teacher/*` → `/student`
- Преподаватель пытается попасть в `/student` → `/teacher`
- Состояние загрузки → `null` (ждать)

---

## Code Style

### Именование
- Файлы: `snake_case.dart`
- Классы, enum-ы: `PascalCase`
- Переменные, методы, поля: `camelCase`
- Приватные члены: `_camelCase`

### Типизация
- Никакого `dynamic` — только явные типы
- Обязательный null safety: `?.`, `??`, nullable через `Type?`
- `as List` / `as Map<String, dynamic>` при парсинге JSON — с пониманием структуры

### Виджеты
- `const` конструктор везде, где возможно
- `prefer_const_constructors` и `prefer_const_literals_to_create_immutables` включены в линтере
- `avoid_print` — логировать ошибки через `debugPrint` или не логировать вовсе

### Обработка ошибок
- `catch (e)` — допустимо, `catch (e, st)` — если нужен stack trace
- Ошибки отображаются через `AppErrorWidget(error: e, onRetry: ...)`
- Определение типа ошибки: через `e.toString().contains(...)` — не использовать `as` приведение без проверки

### Async
- `async/await` — никакого `.then().catchError()`
- `FutureProvider.family` для параметризованных запросов
- `AsyncNotifier` для stateful логики с методами

---

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `lib/main.dart` | Точка входа: init ApiClient, запуск ProviderScope + App |
| `lib/app.dart` | MaterialApp.router, подключение GoRouter |
| `lib/core/api/api_client.dart` | HTTP клиент, токены, cookies, interceptors |
| `lib/core/router/app_router.dart` | Все маршруты + redirect guard |
| `lib/core/theme/app_theme.dart` | Material 3 тема (primary `#1565C0`, secondary `#764BA2`) |
| `lib/features/auth/providers/auth_provider.dart` | `authProvider` — текущий пользователь, login/logout |
| `lib/shared/models/grade.dart` | GradeType enum, Grade, StudentWithGrade, batch helpers |
| `pubspec.yaml` | Зависимости и метаданные проекта |
| `analysis_options.yaml` | Правила линтера |

---

## Добавление нового feature

1. Создать директорию `lib/features/<name>/`
2. Добавить `data/<name>_repository.dart` — const класс + Provider
3. Добавить `providers/<name>_provider.dart` — FutureProvider / AsyncNotifier
4. Добавить `presentation/<name>_screen.dart` — ConsumerWidget
5. Зарегистрировать маршрут в `lib/core/router/app_router.dart`
6. Добавить модель в `lib/shared/models/<name>.dart` если нужна общая

## Добавление нового shared widget

1. Создать `lib/shared/widgets/<widget_name>.dart`
2. `const` конструктор, `ConsumerWidget` если нужен Riverpod
3. Никакой бизнес-логики внутри виджета — только отображение

---

## Что нельзя делать

- `dynamic` типы в моделях или репозиториях
- Прямой вызов `ApiClient.instance.dio` из виджетов — только через репозиторий
- `StatefulWidget` вместо `ConsumerStatefulWidget` если нужен Riverpod
- Хардкод URL/цветов — использовать константы из `api_client.dart` и `app_theme.dart`
- `print()` — использовать `debugPrint()`
- Мутировать состояние провайдера снаружи нотифайера
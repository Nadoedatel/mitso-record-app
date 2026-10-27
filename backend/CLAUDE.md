# CLAUDE.md: Backend

Правила для backend-части MITSO Record App. Агент в этой папке отвечает только за бэкенд. Git, формат API и таблица эндпоинтов описаны в корневом `CLAUDE.md`, полный контракт в `openapi.json`.

## Стек

- NestJS 11, TypeScript в строгом режиме, без `any`
- Prisma 5 + PostgreSQL 15
- Валидация: Zod 4 через `nestjs-zod` (глобальный `ZodValidationPipe`)
- Аутентификация: Passport JWT (только access-токен), bcrypt, TOTP (`otpauth`, `qrcode`)
- Redis через ioredis, необязателен: кэш, счётчики лимитов, очередь BullMQ
- `@nestjs/throttler`, `nestjs-pino`, `prom-client`, `@sentry/nestjs`, `helmet`, `exceljs`
- OpenAPI: `@nestjs/swagger` + `nestjs-zod`
- Порт `8080`, глобальный префикс `/api`

## Команды

```bash
npm run start:dev          # dev-сервер с hot reload
npm run build              # сборка в dist/
npm run start:prod         # запуск сборки
npm run check              # lint + typecheck + unit-тесты
npm test                   # unit-тесты (*.spec.ts в src/)
npm run test:e2e           # поднимает postgres-test (порт 5433) и гоняет test/*.e2e-spec.ts
npm run openapi:generate   # пересобрать openapi.json
npm run openapi:check      # openapi.json совпадает с кодом
npm run db:check-migrations  # схема и миграции не расходятся (нужен SHADOW_DATABASE_URL)
npm run load:backend       # бэк для нагрузочного теста (см. корневой CLAUDE.md)

npx prisma migrate dev --name <name>   # новая миграция
npx prisma migrate deploy              # применить миграции
npx prisma generate                    # клиент после правки схемы
npx prisma db seed                     # тестовые данные (prisma/seed.ts)
```

Postgres и Redis для разработки поднимает `npm run db` в корне репозитория.

## Запуск приложения

- `src/main.ts`: первым импортируется `instrument.ts` (Sentry), затем `assertJwtSecrets` роняет старт при пустых, коротких, шаблонных или совпадающих JWT-секретах, проверяется `TOTP_ENCRYPTION_KEY`, подключаются pino-логгер, `configureApp`, helmet (CSP только в production), CORS по `FRONTEND_URL` с `credentials` и Swagger UI на `/api/docs` вне production.
- `src/app.setup.ts`, функция `configureApp`: `trust proxy` из `TRUST_PROXY`, middleware метрик, префикс `api`, cookie-parser, `ZodValidationPipe`, `AllExceptionsFilter`. Её же вызывают e2e-тесты, поэтому настройку конвейера запросов добавлять сюда, а не в `main.ts`.
- `src/app.module.ts`: `ConfigModule` (только загрузка `.env`), `LoggerModule`, `ThrottlerModule` с глобальным `ThrottlerGuard`, глобальные `PrismaModule` и `CacheModule`, фичемодули.

## Структура `src/`

```
src/
├── main.ts, instrument.ts     # старт; Sentry до остальных импортов
├── app.module.ts              # корневой модуль
├── app.setup.ts               # configureApp: общий конвейер для main.ts и e2e
├── openapi.ts                 # сборка OpenAPI-документа
├── architecture.spec.ts       # правила зависимостей между модулями
├── common/                    # общее ядро, доступно всем модулям
│   ├── config/                # разбор TRUST_PROXY, RATE_LIMIT_PER_MINUTE, FRONTEND_URL
│   ├── decorators/            # @CurrentUser(), @Roles()
│   ├── dto/                   # paginationSchema, zod-fields.ts, responses.ts (схемы ответов)
│   ├── errors/                # доменные ошибки и statusOf
│   ├── filters/               # AllExceptionsFilter
│   ├── guards/                # JwtAuthGuard, RolesGuard, OriginGuard
│   ├── logger/                # параметры pino, x-request-id, маскирование заголовков
│   ├── monitoring/            # опции Sentry, reportError
│   ├── pagination/            # курсор (keyset) для журналов
│   └── search/                # многословный поиск по ФИО
├── prisma/                    # PrismaModule (@Global) и PrismaService
├── auth/                      # логин, refresh, logout, смена пароля, /me
│   ├── strategies/jwt.strategy.ts     # проверка access-токена и отзыва сессии
│   ├── two-factor/                    # TOTP, шифрование секрета, резервные коды
│   ├── login-attempts.service.ts      # блокировка входа по email
│   ├── session-revocation.service.ts  # метка отзыва sid в кэше
│   └── jwt-secrets.ts                 # проверка секретов при старте
├── students/                  # студенты, students.repository.ts
├── teachers/                  # преподаватели и их предметы
├── grades/                    # оценки, grades.repository.ts, grade-rules.ts
├── subjects/                  # предметы, привязка групп и преподавателей
├── groups/                    # группы
├── faculties/                 # факультеты
├── specializations/           # специализации
├── audit/                     # журнал изменений оценок
├── cache/                     # CacheService, AuthUserCache, @InvalidatesCache
├── throttling/                # хранилище счётчиков лимитов
├── jobs/                      # BullMQ: экспорт зачётки в xlsx, импорт студентов из CSV
├── metrics/                   # реестр Prometheus и GET /api/metrics
└── health/                    # GET /api/health с пингом БД
```

Модуль состоит из `*.module.ts`, `*.controller.ts`, `*.service.ts`, папки `dto/` (Zod-схемы и `index.ts`) и, если его импортируют другие модули, `index.ts` с публичным API.

## Слои

- **Контроллер**: всё про HTTP. Guard'ы и `@Roles`, `ParseIntPipe` для числовых `:id`, cookie через `@Res({ passthrough: true })`, Swagger-декораторы с `type` из `common/dto/responses.ts`. Бизнес-логики нет. HTTP-исключения Nest допустимы только здесь, в guard'ах и стратегиях.
- **Сервис**: правила (кто что может, допустимые значения, запись в аудит, инвалидация кэша). Не импортирует `express` и HTTP-исключения Nest, бросает доменные ошибки из `src/common/errors` (`NotFoundError`, `ConflictError`, `ForbiddenError`, `InvalidInputError`, `UnauthenticatedError`, `TooManyAttemptsError`, `UnavailableError`). В статус их переводит `statusOf`, сообщение уходит пользователю как есть, поэтому пишется по-русски. Публичные методы с JSDoc.
- **Репозиторий** (`*.repository.ts`): формы Prisma-запросов, правил не знает. Транзакционный клиент принимает параметром (`tx`/`db`). Пока есть только у `grades` и `students`; сервисы, которые ещё ходят в `this.prisma` напрямую, перечислены в `NOT_YET_MIGRATED` в `src/architecture.spec.ts`. Список может только сокращаться: перевёл сервис, убери его оттуда.
- **Связи модулей**: только через `index.ts` чужого модуля (исключения: `common`, `prisma`, `auth/interfaces/`). Разрешённые зависимости записаны в `ALLOWED_DEPENDENCIES` в `src/architecture.spec.ts`; новая связь меняет эту таблицу в том же коммите. Циклы запрещены.

`src/architecture.spec.ts` проверяет всё это при каждом `npm test`.

## Валидация

- Каждый входной DTO: Zod-схема и класс `createZodDto(schema)` в `dto/` модуля. Глобальный `ZodValidationPipe` проверяет body, query и params по типу параметра.
- Схемы строгие: `z.strictObject`, производные через `.extend`, `.partial`, `.omit`. Лишнее поле даёт 400.
- Общие поля: `src/common/dto/zod-fields.ts` (`idSchema`, `idListSchema`, `queryId` с приведением из строки, `dateOrDateTime`) и `paginationSchema` (`page`, `limit` до 500).
- Тексты ошибок Zod на русском (`z.config(z.locales.ru())` в `app.setup.ts`), фильтр отдаёт их массивом строк вида `поле: проблема`.
- Схема проверяет структуру, доменные правила проверяет сервис. Пример: допустимое значение по типу оценки в `grades/grade-rules.ts`, чтобы пакетная запись сообщила о плохой строке, а не отклонила весь запрос.
- Схемы ответов в `src/common/dto/responses.ts` только описывают ответ для OpenAPI, в рантайме ничего не парсят.

## Ответы и ошибки

- Ответ отдаётся как есть, без обёртки и без интерсептора. Списки `{ data, total, page, limit, totalPages }`, журнал аудита `{ data, nextCursor, limit }`, удаление и подобные операции `{ message }`.
- Любую ошибку форматирует `AllExceptionsFilter` (`src/common/filters/http-exception.filter.ts`): `{ statusCode, timestamp, message }`, где `message` строка или массив строк. Он же переводит стандартные тексты Nest на русский, превращает ошибки Prisma `P2002`/`P2025`/`P2003` в 409/404/400, а 5xx логирует и отправляет в Sentry.

## Аутентификация

- **Логин** `POST /api/auth/login` с `{ email, password }`. `LoginAttemptsService` блокирует email после 5 неудач за 15 минут (30 с, дальше удвоение до 15 минут). bcrypt-сравнение выполняется всегда, для неизвестного email с фиктивным хэшем, чтобы время ответа не выдавало существование аккаунта. При включённой 2FA ответ `{ twoFactorRequired, challengeToken }` без сессии и cookie.
- **Токены**: HS256, access 15 минут (`JWT_ACCESS_SECRET`), refresh 7 дней (`JWT_REFRESH_SECRET`, уникальный `jti`). В payload `sub`, `email`, `role` и `sid`, идентификатор семьи (одного входа на одном устройстве).
- **Cookie** `refreshToken`: httpOnly, `SameSite=Strict`, `path=/api/auth`, `secure` в production. В теле ответа только `user` и `accessToken`.
- **Refresh**: Passport-стратегии для него нет, всё делает `AuthService.refresh`. Проверяет подпись, ищет строку `refresh_sessions` по SHA-256 токена, атомарно ставит `usedAt` и выдаёт новую пару в той же семье. Повторное предъявление уже использованного токена позже 10 секунд считается кражей и удаляет всю семью.
- **Отзыв**: logout удаляет семью текущего устройства (без cookie все семьи пользователя), смена пароля удаляет все. `SessionRevocationService` кладёт метку `sid` в кэш на время жизни access-токена, `JwtStrategy` проверяет её на каждом запросе, так что access-токен перестаёт работать сразу.
- **Пользователь запроса**: `JwtStrategy` берёт его через `AuthUserCache` (TTL 30 с). Код, который удаляет пользователя или меняет его email или роль, обязан вызвать `AuthUserCache.invalidate(userId)`.
- **Guard'ы**: `JwtAuthGuard`; `RolesGuard` с `@Roles(Role.ADMIN, ...)` (enum `Role` из Prisma: STUDENT, TEACHER, ADMIN); `OriginGuard` сверяет `Origin` с `FRONTEND_URL` на refresh, logout, change-password и 2fa setup/enable/disable. `@CurrentUser()` даёт `AuthUser { id, email, role }`.
- **2FA** (`auth/two-factor/`), только для ADMIN. Секрет TOTP шифруется AES-256-GCM ключом `TOTP_ENCRYPTION_KEY`, без ключа setup отвечает 503. Challenge-токен живёт 5 минут, каждый код принимается один раз (`totpLastStep`), 10 резервных кодов хранятся как SHA-256.
- **Лимиты**: по умолчанию 60 запросов в минуту на клиента; login, refresh, 2fa/verify и 2fa/enable по 10, change-password, 2fa/setup и 2fa/disable по 5.

## Данные

- Источник истины `prisma/schema.prisma`. Поля моделей в camelCase, таблицы и колонки в snake_case через `@@map`/`@map`.
- Учётная запись `User` (email, bcrypt-хэш в поле `password`, `role`, поля TOTP) отделена от профилей `Student` и `Teacher` (1:1 по `userId`, удаление каскадом). Номер зачётки хранится в `Student.studentId`.
- Справочники: `Faculty`, `Specialization` и `Group` ссылаются на факультет; предметы связаны с преподавателями и группами через `TeacherSubject` и `SubjectGroup`.
- `Grade` уникальна по (студент, предмет, `gradeType`). Типы EXAM, CREDIT, COURSEWORK, TEST, LAB; значение 1-10, у CREDIT 0 или 1.
- Служебные таблицы: `RefreshSession`, `RecoveryCode`, `AuditLog`. У `AuditLog` нет внешних ключей на студента и предмет, email и роль автора скопированы, чтобы история пережила удаление.
- Индексы: GIN-триграммные (`pg_trgm`) на ФИО и номере зачётки под поиск `ILIKE '%…%'`, `(subjectId, examDate desc)` у оценок, `(createdAt desc, id desc)` у аудита под курсор.
- Запросы только через Prisma. Сырой SQL допустим в миграциях (`prisma/migrations/`, там же расширение и opclass-индексы), в коде он один: `SELECT 1` в health.
- `User.password`, `totpSecret` и хэши токенов и кодов в ответ не попадают: связь `user` в ответах выбирается явным `select` без `password`.

## Кэш, Redis и фоновые задачи

- Без `REDIS_URL` всё работает в памяти процесса: кэш, счётчики входа, лимиты. Эндпоинты `/api/jobs/*` тогда отвечают 503.
- `CacheService`: cache-aside с версией пространства имён, `invalidate` увеличивает версию вместо удаления ключей. Сбой хранилища считается промахом, параллельные промахи по одному ключу делят один запрос к БД.
- Справочники (факультеты, группы, предметы, специализации) кэшируются в общем пространстве `directory` с TTL 300 с. Пишущие методы этих сервисов, а также студентов и преподавателей, помечены `@InvalidatesCache()`: инвалидация после записи, сервису нужно поле `cache: CacheService`.
- `ResilientThrottlerStorage` (`src/throttling/`) считает лимиты в Redis, при сбое переключается на память и 10 секунд не трогает Redis.
- `src/jobs/`: одна очередь BullMQ `background`, воркер в процессе API (2 задачи параллельно, 3 попытки с паузой). Экспорт зачётки в xlsx хранит файл в Redis час; импорт студентов из CSV (ADMIN, до 1 МБ и 1000 строк) складывает ошибки строк в результат и не валит задачу.

## Аудит

Создание, изменение и удаление оценки записываются в `audit_logs` через `AuditService.record(tx, ...)` в той же транзакции, что и сама оценка. Журнал только дополняется. `GET /api/audit-log` (ADMIN) читает его курсором из `common/pagination`, а не `OFFSET`.

## Наблюдаемость

- Логи: `nestjs-pino`, JSON в production, `x-request-id` в каждой строке и в заголовке ответа, `authorization` и cookie маскируются, `/api/health` не логируется. Уровень задаёт `LOG_LEVEL`.
- Метрики: `src/metrics/metrics.ts`, один реестр на процесс; HTTP через middleware, кэш, фоновые задачи. `GET /api/metrics` требует `Bearer <METRICS_TOKEN>`, без переменной отвечает 404.
- Sentry включается только с `SENTRY_DSN`; тела запросов, cookie и локальные переменные стека не отправляются (`common/monitoring/sentry.config.ts`).
- `GET /api/health` отвечает 503, если БД недоступна.

## Контракт и тесты

- `openapi.json` генерируется из Swagger-декораторов и Zod-схем. После правки DTO или контроллера: `npm run openapi:generate` здесь и `npm run api:types` во frontend.
- Unit-тесты `*.spec.ts` лежат рядом с кодом. E2E в `test/`, база `mitso_test` на порту 5433; хелперы очищают таблицы, поэтому имя базы обязано заканчиваться на `_test`.

## Переменные окружения

Шаблон `.env.example`. Читаются напрямую из `process.env`, разбор с проверкой в `src/common/config/http-config.ts` и `src/auth/jwt-secrets.ts`.

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL, обязательна |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | обязательны, от 32 символов, разные, не из шаблона, иначе старт падает |
| `FRONTEND_URL` | разрешённые origin для CORS и `OriginGuard`, через запятую; по умолчанию `http://localhost:3000` |
| `PORT` | по умолчанию 8080 |
| `REDIS_URL` | кэш, лимиты, очередь; без неё память процесса и 503 на `/api/jobs/*` |
| `TOTP_ENCRYPTION_KEY` | 32 байта в base64; без неё 2FA выключена |
| `TRUST_PROXY` | число прокси или подсеть; `true` запрещено |
| `RATE_LIMIT_PER_MINUTE` | общий лимит, по умолчанию 60; поднимать только для нагрузочного теста |
| `METRICS_TOKEN` | открывает `/api/metrics` |
| `LOG_LEVEL`, `NODE_ENV` | уровень логов, production-режим |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE` | Sentry |
| `SHADOW_DATABASE_URL`, `TEST_DATABASE_URL` | проверка миграций, e2e |

## Запрещено

- `any`
- `express` и HTTP-исключения Nest в `*.service.ts`, `*.worker.ts`, `*.repository.ts`
- импорт внутренностей чужого модуля в обход его `index.ts` и незаписанные в `ALLOWED_DEPENDENCIES` связи
- новые прямые вызовы `this.prisma.<model>` в сервисе, уже переведённом на репозиторий
- логика в контроллерах
- пароли, секреты TOTP и хэши токенов в ответах
- `OFFSET`-пагинация для растущих журналов

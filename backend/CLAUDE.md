# CLAUDE.md — Backend

Этот файл описывает правила работы с **backend** частью MITSO Record App.
Агент работающий в этой директории отвечает **только за бекенд**.

## Стек

- **NestJS** — модульная архитектура, декораторы, Dependency Injection
- **TypeScript** — строгий, без `any`
- **Prisma** — ORM
- **PostgreSQL** — база данных
- **Passport.js** + **JWT** — аутентификация
- **class-validator** + **class-transformer** — валидация DTO
- Порт: `8080`

---

## Команды

```bash
npm install
npm run start:dev        # dev-сервер с hot reload
npm run build            # production сборка
npm run start:prod       # запуск production сборки
npm run lint             # ESLint

# Prisma
npx prisma migrate dev --name <migration_name>   # создать миграцию
npx prisma migrate deploy                        # применить на проде
npx prisma generate                              # сгенерировать клиент (после изменений схемы)
npx prisma studio                                # GUI для БД
npx prisma db seed                               # заполнить тестовыми данными
```

---

## Структура проекта

```
src/
├── main.ts                      # точка входа
├── app.module.ts                # корневой модуль
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts    # проверка access токена
│   │   └── roles.guard.ts       # проверка роли пользователя
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   └── roles.decorator.ts          # @Roles('student', 'teacher')
│   ├── filters/
│   │   └── http-exception.filter.ts    # глобальный обработчик ошибок
│   └── interceptors/
│       └── response.interceptor.ts     # оборачивает ответ в { data, message }
├── prisma/
│   └── prisma.service.ts        # PrismaClient singleton
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       # POST /auth/login, POST /auth/refresh
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts      # валидация access токена
│   │   └── jwt-refresh.strategy.ts  # валидация refresh токена
│   └── dto/
│       ├── login.dto.ts
│       └── token-response.dto.ts
├── students/
│   ├── students.module.ts
│   ├── students.controller.ts   # GET /students, GET /students/:id
│   ├── students.service.ts
│   └── dto/
│       ├── student-query.dto.ts # search, pagination параметры
│       └── student-response.dto.ts
├── teachers/
│   ├── teachers.module.ts
│   ├── teachers.controller.ts   # GET /teachers/:id
│   ├── teachers.service.ts
│   └── dto/
│       └── teacher-response.dto.ts
├── grades/
│   ├── grades.module.ts
│   ├── grades.controller.ts     # GET /grades/student/:id
│   ├── grades.service.ts
│   └── dto/
│       └── grade-response.dto.ts
└── subjects/
    ├── subjects.module.ts
    ├── subjects.controller.ts   # GET /subjects
    ├── subjects.service.ts
    └── dto/
        └── subject-response.dto.ts
```

---

## Prisma схема

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Student {
  id                 Int     @id @default(autoincrement())
  last_name          String
  first_name         String
  middle_name        String
  group              String
  record_book_number String  @unique
  password_hash      String
  grades             Grade[]

  @@map("students")
}

model Teacher {
  id           Int       @id @default(autoincrement())
  last_name    String
  first_name   String
  middle_name  String
  department   String
  password_hash String
  subjects     Subject[]

  @@map("teachers")
}

model Subject {
  id         Int     @id @default(autoincrement())
  name       String
  teacher_id Int
  teacher    Teacher  @relation(fields: [teacher_id], references: [id])
  grades     Grade[]

  @@map("subjects")
}

model Grade {
  id         Int     @id @default(autoincrement())
  student_id Int
  subject_id Int
  grade      Int
  semester   Int
  year       Int
  student    Student  @relation(fields: [student_id], references: [id])
  subject    Subject  @relation(fields: [subject_id], references: [id])

  @@map("grades")
}
```

> Все модели в БД — `snake_case` через `@@map`. В TypeScript Prisma даёт `camelCase`.

---

## main.ts — точка входа

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // нужно для httpOnly cookie с refresh токеном
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // удалять лишние поля
    forbidNonWhitelisted: true,
    transform: true,       // автоматически трансформировать типы
  }))

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  await app.listen(process.env.PORT || 8080)
}
bootstrap()
```

---

## Auth Flow

### Логин
1. Клиент отправляет `POST /api/auth/login` с `{ login, password }`
2. Сервис находит студента или преподавателя по логину
3. Проверяет `bcrypt.compare(password, passwordHash)`
4. Генерирует `accessToken` (15 мин) и `refreshToken` (7 дней)
5. `refreshToken` устанавливается в `httpOnly` cookie
6. `accessToken` возвращается в теле ответа

### Refresh
1. Клиент отправляет `POST /api/auth/refresh` (cookie с refreshToken автоматически)
2. `JwtRefreshStrategy` валидирует токен
3. Генерируется новый `accessToken`

### Защита роутов
```typescript
@UseGuards(JwtAuthGuard)          // требует валидный access токен
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')                  // дополнительно — только для преподавателей
```

---

## API Conventions

### Формат ответа (ResponseInterceptor)
```json
{
  "data": { ... },
  "message": "ok"
}
```

### Формат ошибки (HttpExceptionFilter)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Все эндпоинты

| Метод | URL | Guard | Описание |
|---|---|---|---|
| POST | `/api/auth/login` | — | Логин |
| POST | `/api/auth/refresh` | JwtRefresh | Обновить токены |
| POST | `/api/auth/logout` | Jwt | Логаут (очистить cookie) |
| GET | `/api/students` | Jwt | Список/поиск студентов |
| GET | `/api/students/:id` | Jwt | Студент по ID |
| GET | `/api/teachers/:id` | Jwt | Преподаватель по ID |
| GET | `/api/grades/student/:id` | Jwt | Оценки студента |
| GET | `/api/subjects` | Jwt | Список предметов |

---

## Пример модуля (Students)

### Controller
```typescript
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id)
  }
}
```

### Service
```typescript
@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: StudentQueryDto) {
    const { search, page = 1, limit = 20 } = query
    return this.prisma.student.findMany({
      where: search ? {
        OR: [
          { last_name: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { middle_name: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
      skip: (page - 1) * limit,
      take: limit,
      select: {  // никогда не возвращать password_hash!
        id: true,
        last_name: true,
        first_name: true,
        middle_name: true,
        group: true,
        record_book_number: true,
      }
    })
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        last_name: true,
        first_name: true,
        middle_name: true,
        group: true,
        record_book_number: true,
      }
    })
    if (!student) throw new NotFoundException(`Student #${id} not found`)
    return student
  }
}
```

### DTO
```typescript
// dto/student-query.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class StudentQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}
```

---

## PrismaService

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }
}
```

Регистрировать как `@Global()` модуль чтобы не импортировать в каждый модуль.

---

## Переменные окружения

```env
# backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mitso_db"
JWT_ACCESS_SECRET="super-secret-access-key-change-in-prod"
JWT_REFRESH_SECRET="super-secret-refresh-key-change-in-prod"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT=8080
```

Читать через `@nestjs/config`:
```typescript
// app.module.ts — добавить в imports
ConfigModule.forRoot({ isGlobal: true })

// в сервисах использовать
constructor(private config: ConfigService) {}
const secret = this.config.get<string>('JWT_ACCESS_SECRET')
```

---

## Code Style

- Каждый контроллер, сервис, модуль — в **отдельном файле**
- Сервисы **не зависят** от HTTP-слоя — не используют `Request`/`Response` напрямую
- **Никогда** не возвращать `password_hash` из сервисов
- Все публичные методы сервисов имеют **JSDoc** комментарий
- Никаких `any` — строгая типизация, используй `Prisma.StudentSelect` и подобные типы
- DTO для **всех** входящих данных — query params, body, params
- `ParseIntPipe` для всех `:id` параметров в контроллерах
- Бросать `NotFoundException` если сущность не найдена

### Запрещено

- Возвращать `password_hash` в любом ответе
- Писать SQL напрямую (только через Prisma)
- Делать логику в контроллерах (только в сервисах)
- Использовать `any`
- Создавать God-сервисы — один сервис, одна зона ответственности

---

## Ключевые файлы

- `src/main.ts` — настройка приложения (CORS, pipes, filters, prefix)
- `src/app.module.ts` — корневой модуль, регистрация всех модулей
- `src/prisma/prisma.service.ts` — единственная точка доступа к БД
- `src/auth/auth.service.ts` — логика аутентификации
- `src/common/` — переиспользуемые guards, decorators, filters
- `prisma/schema.prisma` — источник истины для структуры БД

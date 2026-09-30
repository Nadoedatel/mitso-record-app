import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../../src/app.module';
import { THROTTLER_STORAGE } from '../../src/throttling';
import { configureApp } from '../../src/app.setup';
import { CacheService } from '../../src/cache';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  cache: CacheService;
}

/** Counter store that never counts: every request looks like the first one */
const UNLIMITED: ThrottlerStorage = {
  increment: async () => ({ totalHits: 1, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 }),
};

/**
 * Boots the full application (all modules, guards, pipes, filters) in memory.
 * The rate limiter is switched off by swapping its counter store: dozens of logins per test run
 * would hit the 10/min limit. (`overrideGuard(ThrottlerGuard)` does NOT work here: the guard is
 * registered through APP_GUARD, which that override does not reach.)
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(THROTTLER_STORAGE)
    .useValue(UNLIMITED)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService), cache: app.get(CacheService) };
}

/**
 * Empties every table (except Prisma's migration history) and resets id sequences.
 * Call in beforeEach so each test starts from a known empty state and stays independent.
 * Pass the cache too: rows deleted behind the application's back would otherwise still be served from it.
 */
export async function resetDb(prisma: PrismaService, cache?: CacheService): Promise<void> {
  await cache?.clear();
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;

  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

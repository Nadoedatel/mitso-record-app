import { INestApplication, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import * as request from 'supertest';
import { configureApp } from '../app.setup';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { ResilientThrottlerStorage } from './resilient-throttler.storage';

/**
 * The real ThrottlerGuard in front of POST /auth/login (limit 10 per minute), no database.
 * The "shared store" here is a ThrottlerStorageService used by several app instances at once,
 * which is exactly what Redis is to real instances.
 */
describe('Login rate limiting', () => {
  const apps: INestApplication[] = [];
  const memoryStores: ThrottlerStorageService[] = [];

  async function startInstance(storage: ThrottlerStorage): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }], storage })],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { login: async () => ({ user: { id: 1, email: 'a@mitso.by', role: 'STUDENT' }, accessToken: 'a', refreshToken: 'r' }) } },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    apps.push(app);
    return app;
  }

  const memory = () => {
    const store = new ThrottlerStorageService();
    memoryStores.push(store);
    return store;
  };

  const login = (app: INestApplication) =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@mitso.by', password: 'secret123' });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    memoryStores.splice(0).forEach((store) => store.onApplicationShutdown());
    jest.restoreAllMocks();
  });

  it('blocks the 11th login within a minute with 429', async () => {
    const app = await startInstance(memory());

    for (let i = 0; i < 10; i++) await login(app).expect(200);

    await login(app).expect(429);
  });

  it('with memory counters each instance has its own allowance (the problem Redis solves)', async () => {
    const a = await startInstance(memory());
    const b = await startInstance(memory());

    for (let i = 0; i < 10; i++) await login(a).expect(200);
    await login(a).expect(429);

    await login(b).expect(200); // the attacker just asks the other instance
  });

  it('with a shared store the limit is global across instances', async () => {
    const shared = memory(); // stands in for Redis
    const a = await startInstance(shared);
    const b = await startInstance(shared);

    for (let i = 0; i < 5; i++) {
      await login(a).expect(200);
      await login(b).expect(200);
    }

    await login(a).expect(429);
    await login(b).expect(429);
  });

  it('keeps limiting (per instance) when the shared store dies, instead of answering 500', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const dead: ThrottlerStorage = { increment: async () => Promise.reject(new Error('ECONNREFUSED')) };
    const app = await startInstance(new ResilientThrottlerStorage(dead, memory()));

    for (let i = 0; i < 10; i++) await login(app).expect(200);

    await login(app).expect(429);
  });
});

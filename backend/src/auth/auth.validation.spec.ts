import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from '../app.setup';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/** Request validation of POST /auth/login (Zod) through the real pipeline, no database. */
describe('Auth login validation (Zod)', () => {
  let app: INestApplication;
  const service = { login: jest.fn() };
  const http = () => request(app.getHttpServer());
  const valid = { email: 'student@mitso.by', password: 'secret123' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service.login.mockResolvedValue({
      user: { id: 1, email: valid.email, role: 'STUDENT' },
      accessToken: 'a',
      refreshToken: 'r',
    });
  });

  it('passes valid credentials to the service', async () => {
    await http().post('/api/auth/login').send(valid).expect(200);

    expect(service.login).toHaveBeenCalledWith(valid);
  });

  it.each([
    ['a malformed email', { ...valid, email: 'not-an-email' }],
    ['a too short password', { ...valid, password: '123' }],
    ['a too long password', { ...valid, password: 'x'.repeat(129) }],
    ['a missing password', { email: valid.email }],
    ['an unexpected field (mass assignment of role)', { ...valid, role: 'ADMIN' }],
  ])('rejects %s before reaching the service', async (_label, body) => {
    await http().post('/api/auth/login').send(body).expect(400);

    expect(service.login).not.toHaveBeenCalled();
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '@prisma/client';
import { DEFAULT_PASSWORD } from './factories';

/** Logs a factory-made user in through the real endpoint and returns a ready `Authorization` header value. */
export async function bearerFor(app: INestApplication, user: User): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password: DEFAULT_PASSWORD })
    .expect(200);
  return `Bearer ${res.body.accessToken}`;
}

import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule, Logger as PinoLogger } from 'nestjs-pino';
import { Writable } from 'node:stream';
import * as request from 'supertest';
import { configureApp } from '../../app.setup';
import { buildLoggerParams, REQUEST_ID_HEADER } from './logger.config';

@Controller()
class ProbeController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('boom')
  boom(): never {
    throw new Error('secret internal detail');
  }
}

/** The real pino pipeline (request logging, request id, error filter) writing to memory, no database. */
describe('Request logging (integration)', () => {
  let app: INestApplication;
  const lines: Record<string, any>[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const sink = new Writable({
      write(chunk, _enc, done) {
        lines.push(JSON.parse(chunk.toString()));
        done();
      },
    });
    const { pinoHttp } = buildLoggerParams({ NODE_ENV: 'production', LOG_LEVEL: 'debug' });

    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ pinoHttp: [pinoHttp as object, sink] as never })],
      controllers: [ProbeController],
    }).compile();

    app = moduleRef.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(PinoLogger));
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    lines.length = 0;
  });

  it('generates a request id, returns it in a header and puts it on the log line', async () => {
    const res = await http().get('/api/health-not-quiet').expect(404);

    const id = res.headers[REQUEST_ID_HEADER];
    expect(id).toBeDefined();
    expect(lines.some((l) => l.req?.id === id)).toBe(true);
  });

  it('keeps a request id sent by the caller', async () => {
    const res = await http().get('/api/health-not-quiet').set(REQUEST_ID_HEADER, 'from-frontend-1').expect(404);

    expect(res.headers[REQUEST_ID_HEADER]).toBe('from-frontend-1');
    expect(lines.some((l) => l.req?.id === 'from-frontend-1')).toBe(true);
  });

  it('logs a 404 as a warning', async () => {
    await http().get('/api/missing').expect(404);

    const line = lines.find((l) => l.req?.url === '/api/missing');
    expect(line?.level).toBe(40); // pino: warn
  });

  it('logs an unhandled exception with stack and the same request id, without leaking it to the client', async () => {
    const res = await http().get('/api/boom').expect(500);

    const id = res.headers[REQUEST_ID_HEADER];
    const errorLine = lines.find((l) => l.err && l.req?.id === id);
    expect(errorLine?.level).toBe(50); // pino: error
    expect(errorLine?.err.message).toBe('secret internal detail');
    expect(errorLine?.err.stack).toContain('ProbeController');
    expect(res.body.message).toBe('Внутренняя ошибка сервера');
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
  });

  it('does not log health checks', async () => {
    await http().get('/api/health').expect(200);

    expect(lines.filter((l) => l.req?.url === '/api/health')).toHaveLength(0);
  });

  it('never writes the Authorization header or cookies', async () => {
    await http().get('/api/boom').set('Authorization', 'Bearer super-secret-token').set('Cookie', 'refreshToken=super-secret-cookie');

    const all = JSON.stringify(lines);
    expect(all).not.toContain('super-secret-token');
    expect(all).not.toContain('super-secret-cookie');
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from '../app.setup';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';

/**
 * Validation of faculty DTOs through the real global pipeline (Zod pipe + error filter).
 * The service is a stub and guards are open: only the request/response contract is under test,
 * so this runs without a database.
 */
describe('Faculties validation (Zod)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FacultiesController],
      providers: [{ provide: FacultiesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service.create.mockResolvedValue({ id: 1 });
    service.update.mockResolvedValue({ id: 1 });
    service.findAll.mockResolvedValue({ data: [], meta: {} });
  });

  describe('POST /api/faculties', () => {
    it('passes a valid body to the service, trimming the name', async () => {
      await http().post('/api/faculties').send({ name: '  ФИТ  ' }).expect(201);

      expect(service.create).toHaveBeenCalledWith({ name: 'ФИТ' });
    });

    it.each([
      ['a missing name', {}],
      ['an empty name', { name: '' }],
      ['a whitespace-only name', { name: '   ' }],
      ['a non-string name', { name: 42 }],
      ['an unexpected field', { name: 'ФИТ', admin: true }],
    ])('rejects %s with 400 and never calls the service', async (_label, body) => {
      await http().post('/api/faculties').send(body).expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });

    it('reports problems as an array of "field: problem" strings, like class-validator did', async () => {
      const res = await http().post('/api/faculties').send({ name: 42 }).expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(Array.isArray(res.body.message)).toBe(true);
      expect(res.body.message[0]).toMatch(/^name: /);
    });
  });

  describe('PATCH /api/faculties/:id', () => {
    it('accepts an empty patch (all fields optional)', async () => {
      await http().patch('/api/faculties/1').send({}).expect(200);
    });

    it('still validates the fields that are present', async () => {
      await http().patch('/api/faculties/1').send({ name: '' }).expect(400);
    });

    it('rejects unknown fields', async () => {
      await http().patch('/api/faculties/1').send({ id: 5 }).expect(400);
    });
  });

  describe('GET /api/faculties', () => {
    it('coerces page and limit from the query string to numbers', async () => {
      await http().get('/api/faculties').query({ page: 2, limit: 5, search: 'ИТ' }).expect(200);

      expect(service.findAll).toHaveBeenCalledWith({ page: 2, limit: 5, search: 'ИТ' });
    });

    it.each(['page=0', 'page=abc', 'limit=1.5', 'limit=-1'])('rejects %s', async (qs) => {
      await http().get(`/api/faculties?${qs}`).expect(400);
    });

    it('rejects unknown query parameters', async () => {
      await http().get('/api/faculties?sort=name').expect(400);
    });

    it('works with no parameters at all', async () => {
      await http().get('/api/faculties').expect(200);

      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });
});

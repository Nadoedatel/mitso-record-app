import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from '../app.setup';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

/** Request/response contract of the grade DTOs (Zod) through the real pipeline, no database. */
describe('Grades validation (Zod)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    batchCreate: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };
  const http = () => request(app.getHttpServer());
  const valid = { studentId: 1, subjectId: 2, gradeType: 'EXAM', gradeValue: 8 };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [{ provide: GradesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = { id: 1, email: 'a@mitso.by', role: 'ADMIN' };
          return true;
        },
      })
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
    service.batchCreate.mockResolvedValue({ total: 1 });
    service.update.mockResolvedValue({ id: 1 });
    service.findAll.mockResolvedValue({ data: [] });
  });

  describe('POST /api/grades', () => {
    it('accepts a minimal valid grade', async () => {
      await http().post('/api/grades').send(valid).expect(201);

      expect(service.create.mock.calls[0][0]).toEqual(valid);
    });

    it.each([
      ['a plain date (what the frontend sends)', '2026-01-15'],
      ['a full ISO timestamp', '2026-01-15T10:00:00.000Z'],
    ])('accepts examDate as %s', async (_label, examDate) => {
      await http().post('/api/grades').send({ ...valid, examDate }).expect(201);
    });

    it.each([
      ['a missing field', { studentId: 1, subjectId: 2, gradeType: 'EXAM' }],
      ['a value above 10', { ...valid, gradeValue: 11 }],
      ['a negative value', { ...valid, gradeValue: -1 }],
      ['a fractional value', { ...valid, gradeValue: 7.5 }],
      ['a numeric string instead of a number', { ...valid, gradeValue: '8' }],
      ['an unknown grade type', { ...valid, gradeType: 'FINAL' }],
      ['a malformed date', { ...valid, examDate: '15.01.2026' }],
      ['an unexpected field', { ...valid, teacherId: 5 }],
      ['a non-positive id', { ...valid, studentId: 0 }],
    ])('rejects %s', async (_label, body) => {
      await http().post('/api/grades').send(body).expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });

    it('leaves the per-type CREDIT rule to the service (0-10 passes the schema)', async () => {
      await http().post('/api/grades').send({ ...valid, gradeType: 'CREDIT', gradeValue: 5 }).expect(201);
    });
  });

  describe('POST /api/grades/batch', () => {
    it('accepts a list of valid grades', async () => {
      await http().post('/api/grades/batch').send({ grades: [valid, { ...valid, studentId: 3 }] }).expect(201);

      expect(service.batchCreate.mock.calls[0][0]).toHaveLength(2);
    });

    it('rejects an empty list', async () => {
      await http().post('/api/grades/batch').send({ grades: [] }).expect(400);
    });

    it('rejects the whole batch when one row is malformed, naming the row in the message', async () => {
      const res = await http()
        .post('/api/grades/batch')
        .send({ grades: [valid, { ...valid, gradeValue: 99 }] })
        .expect(400);

      expect(res.body.message.join(' ')).toMatch(/grades\.1\.gradeValue/);
      expect(service.batchCreate).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/grades/:id', () => {
    it('accepts a partial update', async () => {
      await http().patch('/api/grades/1').send({ gradeValue: 10 }).expect(200);
    });

    it('rejects an invalid field in a partial update', async () => {
      await http().patch('/api/grades/1').send({ gradeValue: 11 }).expect(400);
    });
  });

  describe('GET /api/grades', () => {
    it('coerces numeric query parameters', async () => {
      await http().get('/api/grades').query({ studentId: '4', subjectId: '5', page: '2', limit: '10' }).expect(200);

      expect(service.findAll.mock.calls[0][0]).toEqual({ studentId: 4, subjectId: 5, page: 2, limit: 10 });
    });

    it.each(['limit=501', 'page=0', 'studentId=abc', 'unknown=1'])('rejects %s', async (qs) => {
      await http().get(`/api/grades?${qs}`).expect(400);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

// Levanta la aplicación completa contra el PostgreSQL de backend/.env
// (docker compose up -d postgres). Sirve para validar configuración y conexión.
describe('AppModule con PostgreSQL (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET / responde el health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ status: 'ok', service: 'rynok-api' });
  });

  it('GET /properties lee de la base de datos', () => {
    return request(app.getHttpServer())
      .get('/properties')
      .expect(200)
      .expect((res) => expect(Array.isArray(res.body)).toBe(true));
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { Wallet } from 'ethers';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AuthModule } from '../src/auth/auth.module.js';
import { PropertyModule } from '../src/property/property.module.js';
import { UPLOADS_URL_PREFIX, uploadDir } from '../src/uploads/uploads.service.js';
import { login } from './login.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe('Subida de imágenes (e2e)', () => {
  let app: NestExpressApplication;
  let token: string;
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'rynok-e2e-uploads-'));
    process.env.UPLOAD_DIR = dir;

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ type: 'better-sqlite3', database: ':memory:', autoLoadEntities: true, synchronize: true }),
        AuthModule,
        PropertyModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets(uploadDir(), { prefix: UPLOADS_URL_PREFIX });
    await app.init();

    token = (await login(app, Wallet.createRandom())).body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.UPLOAD_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('sube una imagen, la usa en una propiedad y la sirve', async () => {
    const upload = await request(app.getHttpServer())
      .post('/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG, { filename: 'casa.png', contentType: 'image/png' })
      .expect(201);

    const { url } = upload.body;
    expect(url).toMatch(/^\/uploads\/.+\.png$/);

    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Casa con foto', description: 'x', location: 'Medellín', priceEth: '1', imageUrl: url })
      .expect(201);

    const served = await request(app.getHttpServer()).get(url).expect(200);
    expect(served.headers['content-type']).toBe('image/png');
  });

  it('rechaza subir sin sesión', async () => {
    await request(app.getHttpServer())
      .post('/uploads/images')
      .attach('file', PNG, { filename: 'casa.png', contentType: 'image/png' })
      .expect(401);
  });

  it('rechaza un archivo que no es una imagen', async () => {
    const res = await request(app.getHttpServer())
      .post('/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), { filename: 'x.png', contentType: 'image/png' })
      .expect(400);
    expect(res.body.message).toContain('Formato no soportado');
  });

  it('rechaza una imageUrl que no es http(s) ni una imagen subida', async () => {
    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', location: 'x', priceEth: '1', imageUrl: 'javascript:alert(1)' })
      .expect(400);
  });
});

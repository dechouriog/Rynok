import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AuthModule } from '../src/auth/auth.module.js';
import { PropertyModule } from '../src/property/property.module.js';
import { login } from './login.js';

describe('PropertyController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ type: 'better-sqlite3', database: ':memory:', autoLoadEntities: true, synchronize: true }),
        AuthModule,
        PropertyModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const wallet = Wallet.createRandom();
    const res = await login(app, wallet);
    token = res.body.accessToken;
  });

  afterAll(async () => await app.close());

  it('crea una propiedad autenticado y la lista después', async () => {
    const payload = { title: 'Apto El Poblado', description: 'x', location: 'Medellín', priceEth: '2.3' };

    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const list = await request(app.getHttpServer()).get('/properties').expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('rechaza crear una propiedad sin token', async () => {
    await request(app.getHttpServer())
      .post('/properties')
      .send({ title: 'x', description: 'x', location: 'x', priceEth: '1' })
      .expect(401);
  });

  it('filtra propiedades por ubicación', async () => {
    const res = await request(app.getHttpServer()).get('/properties?location=Medellín').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AuthModule } from '../src/auth/auth.module.js';
import { PropertyModule } from '../src/property/property.module.js';
import { EscrowModule } from '../src/escrow/escrow.module.js';
import { HealthController } from '../src/health/health.controller.js';
import { configureApp } from '../src/app.setup.js';
import { login } from './login.js';

const CONTRACT = '0x049bba8708b71e33f649bae0e2f127f805ca9ca9';
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;

/**
 * Misma configuración que producción (configureApp: helmet, CORS, validación estricta, filtro de errores)
 * sobre SQLite en memoria y sin leer backend/.env. Sin ESCROW_RPC_URL y fuera de producción la verificación
 * on-chain se omite, lo que permite probar aquí las reglas de negocio del registro de escrow.
 */
describe('API endurecida y ciclo de escrow (e2e)', () => {
  let app: NestExpressApplication;
  let seller: string;
  let buyer: string;
  let buyerWallet: string;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 1_000 }]),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        AuthModule,
        PropertyModule,
        EscrowModule,
      ],
      controllers: [HealthController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, { swagger: true });
    await app.init();

    seller = (await login(app, Wallet.createRandom())).body.accessToken;
    const b = Wallet.createRandom();
    buyerWallet = b.address.toLowerCase();
    buyer = (await login(app, b)).body.accessToken;
  });
  afterAll(async () => await app.close());

  async function publish(title: string, priceEth: string) {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set(auth(seller))
      .send({ title, description: 'Propiedad de prueba con descripción suficiente.', location: 'Medellín', priceEth })
      .expect(201);
    return res.body.id as string;
  }

  const deposit = (propertyId: string, depositTxHash: string, amountEth = '1.5') =>
    request(app.getHttpServer())
      .post('/escrow/deposit')
      .set(auth(buyer))
      .send({ propertyId, amountEth, contractAddress: CONTRACT, depositTxHash });

  it('GET / y /health responden; Swagger documenta los endpoints nuevos', async () => {
    await request(app.getHttpServer()).get('/').expect(200, { status: 'ok', service: 'rynok-api' });
    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'up', escrow: { verification: 'disabled (dev)' } });
    const docs = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(Object.keys(docs.body.paths)).toEqual(
      expect.arrayContaining(['/health', '/properties/mine', '/uploads/images']),
    );
  });

  it('aplica helmet (permitiendo imágenes entre orígenes) y CORS solo para el origen configurado', async () => {
    const ok = await request(app.getHttpServer()).get('/health').set('Origin', 'http://localhost:3000');
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    expect(ok.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    const evil = await request(app.getHttpServer()).get('/health').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('errores con formato uniforme y validación en español', async () => {
    const notFound = await request(app.getHttpServer())
      .get('/properties/00000000-0000-4000-8000-000000000000')
      .expect(404);
    expect(notFound.body).toMatchObject({ statusCode: 404, error: 'NOT FOUND', message: 'La propiedad no existe' });
    const invalid = await request(app.getHttpServer())
      .post('/properties')
      .set(auth(seller))
      .send({ title: 'x', description: 'corta', location: '', priceEth: '-1', owner: 'hack' })
      .expect(400);
    expect(invalid.body.message).toEqual(
      expect.arrayContaining([
        'El título debe tener al menos 5 caracteres',
        'La descripción debe tener al menos 20 caracteres',
        'La ubicación es obligatoria',
        'El precio debe ser un número mayor que 0 con hasta 6 decimales',
        'property owner should not exist',
      ]),
    );
  });

  it('paginación, orden en servidor y /properties/mine', async () => {
    await publish('Casa barata de prueba', '0.5');
    await publish('Casa cara de prueba', '9');
    const page = await request(app.getHttpServer()).get('/properties?limit=1&sort=price_desc').expect(200);
    expect(page.body).toMatchObject({ limit: 1, page: 1 });
    expect(page.body.items[0].priceEth).toBe('9');
    expect(page.body.totalPages).toBeGreaterThanOrEqual(2);
    await request(app.getHttpServer()).get('/properties?limit=500').expect(400);
    const mine = await request(app.getHttpServer()).get('/properties/mine').set(auth(seller)).expect(200);
    expect(mine.body.length).toBeGreaterThanOrEqual(2);
    const none = await request(app.getHttpServer()).get('/properties/mine').set(auth(buyer)).expect(200);
    expect(none.body).toEqual([]);
  });

  it('ciclo completo: depósito → IN_ESCROW → duplicado rechazado → confirmación → SOLD', async () => {
    const id = await publish('Casa flujo feliz e2e', '1.5');
    const funded = await deposit(id, hash(1)).expect(201);
    expect(funded.body).toMatchObject({ status: 'AWAITING_DELIVERY', buyerWallet, amountEth: '1.5' });
    expect(funded.body.property.title).toBe('Casa flujo feliz e2e');
    expect((await request(app.getHttpServer()).get(`/properties/${id}`)).body.status).toBe('IN_ESCROW');

    const dup = await deposit(id, hash(1).toUpperCase().replace('0X', '0x')).expect(409);
    expect(dup.body.message).toBe('Este depósito ya fue registrado');
    await request(app.getHttpServer()).patch(`/properties/${id}`).set(auth(seller)).send({ priceEth: '1' }).expect(409);

    await request(app.getHttpServer())
      .post(`/escrow/${id}/confirm`)
      .set(auth(seller))
      .send({ releaseTxHash: hash(2) })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/escrow/${id}/confirm`)
      .set(auth(buyer))
      .send({ releaseTxHash: hash(3) })
      .expect(201);
    expect((await request(app.getHttpServer()).get(`/properties/${id}`)).body.status).toBe('SOLD');

    const history = await request(app.getHttpServer()).get('/escrow/my-transactions').set(auth(buyer)).expect(200);
    expect(history.body[0]).toMatchObject({ status: 'COMPLETE', property: { title: 'Casa flujo feliz e2e' } });
  });

  it('reembolso del vendedor: la propiedad vuelve a estar disponible', async () => {
    const id = await publish('Casa reembolso e2e', '2');
    await deposit(id, hash(10), '2').expect(201);
    await deposit(id, hash(11), '2').expect(409); // ya no está disponible
    await request(app.getHttpServer())
      .post(`/escrow/${id}/refund`)
      .set(auth(seller))
      .send({ refundTxHash: hash(12) })
      .expect(201);
    expect((await request(app.getHttpServer()).get(`/properties/${id}`)).body.status).toBe('AVAILABLE');
  });

  it('rechaza un monto distinto al precio', async () => {
    const id = await publish('Casa monto incorrecto', '3');
    const res = await deposit(id, hash(20), '0.000001').expect(400);
    expect(res.body.message).toMatch(/no coincide/);
  });

  it('limita los intentos de login a 10 por minuto (429)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      statuses.push((await request(app.getHttpServer()).post('/auth/nonce').send({ walletAddress: 'x' })).status);
    }
    expect(statuses).toContain(429);
  });
});

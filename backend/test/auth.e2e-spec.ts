import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AuthModule } from '../src/auth/auth.module.js';
import { PropertyModule } from '../src/property/property.module.js';

describe('Auth flow (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => await app.close());

  it('conecta una wallet nueva, crea el usuario y permite acceder a /auth/me', async () => {
    const wallet = Wallet.createRandom();
    const message = 'Iniciar sesión en Rynok - test';
    const signature = await wallet.signMessage(message);

    const connectRes = await request(app.getHttpServer())
      .post('/auth/connect')
      .send({ walletAddress: wallet.address, signature, message })
      .expect(201);

    expect(connectRes.body.accessToken).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${connectRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.walletAddress).toBe(wallet.address.toLowerCase());
  });

  it('rechaza una firma que no corresponde a la wallet declarada', async () => {
    const wallet = Wallet.createRandom();
    const otherWallet = Wallet.createRandom();
    const message = 'mensaje';
    const signature = await otherWallet.signMessage(message);

    await request(app.getHttpServer())
      .post('/auth/connect')
      .send({ walletAddress: wallet.address, signature, message })
      .expect(401);
  });
});
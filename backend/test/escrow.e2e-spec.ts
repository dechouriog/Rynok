import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AuthModule } from '../src/auth/auth.module.js';
import { PropertyModule } from '../src/property/property.module.js';
import { EscrowModule } from '../src/escrow/escrow.module.js';

describe('Escrow — historial (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let wallet: Wallet;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ type: 'better-sqlite3', database: ':memory:', autoLoadEntities: true, synchronize: true }),
        AuthModule,
        PropertyModule,
        EscrowModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    wallet = Wallet.createRandom();
    const message = 'login';
    const signature = await wallet.signMessage(message);
    const res = await request(app.getHttpServer())
      .post('/auth/connect')
      .send({ walletAddress: wallet.address, signature, message });
    token = res.body.accessToken;
  });

  afterAll(async () => await app.close());

  it('devuelve vacío si el usuario no tiene transacciones', async () => {
    const res = await request(app.getHttpServer())
      .get('/escrow/my-transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it('rechaza sin token', async () => {
    await request(app.getHttpServer()).get('/escrow/my-transactions').expect(401);
  });
});
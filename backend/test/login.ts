import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { HDNodeWallet } from 'ethers';

/** Login completo como lo hace el frontend: pide el nonce, lo firma y conecta. */
export async function login(app: INestApplication, wallet: HDNodeWallet) {
  const { body } = await request(app.getHttpServer())
    .post('/auth/nonce')
    .send({ walletAddress: wallet.address })
    .expect(201);
  const signature = await wallet.signMessage(body.message);
  return request(app.getHttpServer())
    .post('/auth/connect')
    .send({ walletAddress: wallet.address, signature, message: body.message });
}

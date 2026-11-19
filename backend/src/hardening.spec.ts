import { describe, it, expect, vi } from 'vitest';
import { ArgumentsHost, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import type { NextFunction, Request, Response } from 'express';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { decimalTransformer } from './common/decimal.transformer.js';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';
import { corsOrigins } from './app.setup.js';
import { resolveJwtSecret } from './auth/auth.module.js';
import { EscrowChainVerifier } from './escrow/escrow-chain.verifier.js';
import { HealthController } from './health/health.controller.js';
import { scalePrice } from './seed.js';

const config = (values: Record<string, string | undefined>) =>
  ({ get: (key: string, fallback?: string) => values[key] ?? fallback }) as unknown as ConfigService;

const HASH = `0x${'a'.repeat(64)}`;
const CONTRACT = '0x049bba8708b71e33f649bae0e2f127f805ca9ca9';

describe('EscrowChainVerifier sin RPC', () => {
  it('en desarrollo omite la verificación y lo informa', async () => {
    const verifier = new EscrowChainVerifier(config({ ESCROW_CONTRACT_ADDRESS: CONTRACT }));
    expect(verifier.describe()).toEqual({ contract: CONTRACT, verification: 'disabled (dev)' });
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', 'p')).resolves.toBeUndefined();
  });

  it('en producción rechaza todo (fail-closed)', async () => {
    const verifier = new EscrowChainVerifier(config({ NODE_ENV: 'production', ESCROW_CONTRACT_ADDRESS: CONTRACT }));
    expect(verifier.describe().verification).toBe('unavailable');
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', 'p')).rejects.toThrow(ServiceUnavailableException);
  });

  it('con RPC informa verificación on-chain y traduce errores del nodo a 503', async () => {
    const verifier = new EscrowChainVerifier(
      config({ ESCROW_RPC_URL: 'http://rpc', ESCROW_CONTRACT_ADDRESS: CONTRACT }),
    );
    expect(verifier.describe().verification).toBe('on-chain');
    Object.assign(verifier, { provider: { getTransactionReceipt: vi.fn().mockRejectedValue(new Error('timeout')) } });
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', 'p')).rejects.toThrow(ServiceUnavailableException);
  });

  it('rechaza un contrato distinto al configurado', async () => {
    const verifier = new EscrowChainVerifier(config({ ESCROW_CONTRACT_ADDRESS: CONTRACT }));
    await expect(verifier.assertEvent(HASH, `0x${'1'.repeat(40)}`, 'Deposited', 'p')).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('resolveJwtSecret', () => {
  it('usa JWT_SECRET, es obligatorio en producción y aleatorio en desarrollo', () => {
    expect(resolveJwtSecret(config({ JWT_SECRET: 'abc' }))).toBe('abc');
    expect(() => resolveJwtSecret(config({ NODE_ENV: 'production' }))).toThrow(/obligatorio/);
    const a = resolveJwtSecret(config({}));
    expect(a).toHaveLength(64);
    expect(a).not.toBe(resolveJwtSecret(config({})));
  });
});

describe('HealthController', () => {
  const chain = {
    describe: () => ({ contract: CONTRACT, verification: 'on-chain' }),
  } as unknown as EscrowChainVerifier;

  it('ping responde lo que espera Render en GET /', () => {
    const controller = new HealthController({} as DataSource, chain);
    expect(controller.ping()).toEqual({ status: 'ok', service: 'rynok-api' });
  });

  it('informa base de datos y escrow, y 503 si la base no responde', async () => {
    const up = new HealthController({ query: vi.fn().mockResolvedValue([]) } as unknown as DataSource, chain);
    await expect(up.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'up',
      escrow: { verification: 'on-chain' },
    });
    const down = new HealthController(
      { query: vi.fn().mockRejectedValue(new Error('x')) } as unknown as DataSource,
      chain,
    );
    await expect(down.check()).rejects.toThrow(ServiceUnavailableException);
  });
});

describe('utilidades comunes', () => {
  it('decimalTransformer normaliza decimales de Postgres y SQLite', () => {
    expect(decimalTransformer.from('1.500000')).toBe('1.5');
    expect(decimalTransformer.from('2.000000')).toBe('2');
    expect(decimalTransformer.from(3)).toBe('3');
    expect(decimalTransformer.from(null)).toBeNull();
    expect(decimalTransformer.to('1.5')).toBe('1.5');
  });

  it('corsOrigins separa por comas, quita la barra final y usa localhost por defecto', () => {
    expect(corsOrigins('https://rynok.vercel.app/, http://localhost:3000')).toEqual([
      'https://rynok.vercel.app',
      'http://localhost:3000',
    ]);
    expect(corsOrigins(undefined)).toEqual(['http://localhost:3000']);
  });

  it('scalePrice reduce precios para Sepolia sin pasar de 6 decimales', () => {
    expect(scalePrice('2.5', 1)).toBe('2.5');
    expect(scalePrice('2.5', 0.001)).toBe('0.0025');
    expect(scalePrice('0.8', 0.000001)).toBe('0.000001');
  });

  it('RequestLoggerMiddleware registra al terminar la respuesta', () => {
    for (const statusCode of [200, 404, 500]) {
      let finish: () => void = () => undefined;
      const res = { statusCode, on: (_: string, cb: () => void) => (finish = cb) } as unknown as Response;
      const next = vi.fn() as NextFunction;
      new RequestLoggerMiddleware().use({ method: 'GET', originalUrl: '/x' } as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(() => finish()).not.toThrow();
    }
  });
});

describe('AllExceptionsFilter', () => {
  function run(exception: unknown) {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ method: 'GET', url: '/x' }) }),
    } as unknown as ArgumentsHost;
    new AllExceptionsFilter().catch(exception, host);
    return { status, body: json.mock.calls[0][0] };
  }

  it('conserva código y mensaje, y la lista de errores de validación', () => {
    const notFound = run(new NotFoundException('La propiedad no existe'));
    expect(notFound.status).toHaveBeenCalledWith(404);
    expect(notFound.body).toMatchObject({ statusCode: 404, error: 'NOT FOUND', message: 'La propiedad no existe' });
    expect(run(new BadRequestException(['a', 'b'])).body.message).toEqual(['a', 'b']);
  });

  it('oculta los detalles de errores inesperados', () => {
    const { status, body } = run(new Error('invalid input syntax for type uuid'));
    expect(status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Error interno del servidor');
  });
});

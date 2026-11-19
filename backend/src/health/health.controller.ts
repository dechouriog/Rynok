import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { EscrowChainVerifier } from '../escrow/escrow-chain.verifier.js';

@ApiTags('health')
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chain: EscrowChainVerifier,
  ) {}

  /** Usado por Render como healthCheckPath: responde rápido y sin tocar la base de datos. */
  @Get()
  @ApiOperation({ summary: 'Ping del API (health check de Render)' })
  @ApiOkResponse({ schema: { example: { status: 'ok', service: 'rynok-api' } } })
  ping() {
    return { status: 'ok', service: 'rynok-api' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Estado detallado: base de datos y verificación on-chain del escrow' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        database: 'up',
        escrow: { contract: '0x049bba8708b71e33f649bae0e2f127f805ca9ca9', verification: 'on-chain' },
        uptimeSeconds: 42,
      },
    },
  })
  @ApiServiceUnavailableResponse({ description: 'La base de datos no responde' })
  async check() {
    let database: 'up' | 'down' = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      database = 'down';
    }
    const body = {
      status: database === 'up' ? 'ok' : 'error',
      database,
      escrow: this.chain.describe(),
      uptimeSeconds: Math.round(process.uptime()),
    };
    if (database === 'down') throw new ServiceUnavailableException(body);
    return body;
  }
}

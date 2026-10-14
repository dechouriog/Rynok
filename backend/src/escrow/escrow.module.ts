import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransaction } from './entities/escrow-transaction.entity.js';
import { Property } from '../property/entities/property.entity.js';
import { EscrowService } from './escrow.service.js';
import { EscrowController } from './escrow.controller.js';
import { EscrowChainVerifier } from './escrow-chain.verifier.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EscrowTransaction, Property]),
    AuthModule,
  ],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowChainVerifier],
})
export class EscrowModule {}

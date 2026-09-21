import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransaction } from './entities/escrow-transaction.entity.js';
import { EscrowService } from './escrow.service.js';
import { EscrowController } from './escrow.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([EscrowTransaction]), AuthModule],
  controllers: [EscrowController],
  providers: [EscrowService],
})
export class EscrowModule {}
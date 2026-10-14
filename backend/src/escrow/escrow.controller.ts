import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { EscrowService } from './escrow.service.js';

import { RecordDepositDto } from './dto/record-deposit.dto.js';
import { ConfirmReleaseDto, RefundDto } from './dto/close-escrow.dto.js';

import { WalletAuthGuard } from '../auth/wallet-auth.guard.js';

import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly service: EscrowService) {}

  @Post('deposit')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Registrar un depósito ya confirmado on-chain (el comprador es el usuario autenticado)',
  })
  @UseGuards(WalletAuthGuard)
  recordDeposit(
    @Body() dto: RecordDepositDto,
    @CurrentUser() user: { wallet: string },
  ) {
    return this.service.recordDeposit(dto, user.wallet);
  }

  @Get('my-transactions')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Historial de transacciones del usuario autenticado (compras y ventas)',
  })
  @UseGuards(WalletAuthGuard)
  findMine(@CurrentUser() user: { wallet: string }) {
    return this.service.findForUser(user.wallet);
  }

  @Get(':propertyId')
  @ApiOperation({
    summary: 'Ver el estado de escrow de una propiedad',
  })
  findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.service.findByProperty(propertyId);
  }

  @Post(':propertyId/confirm')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Confirmar que los fondos se liberaron (solo el comprador)',
  })
  @UseGuards(WalletAuthGuard)
  confirm(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: ConfirmReleaseDto,
    @CurrentUser() user: { wallet: string },
  ) {
    return this.service.confirmRelease(
      propertyId,
      user.wallet,
      dto.releaseTxHash,
    );
  }

  @Post(':propertyId/refund')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Registrar un reembolso (el vendedor, o el comprador cuando venció el plazo de entrega)',
  })
  @UseGuards(WalletAuthGuard)
  refund(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: RefundDto,
    @CurrentUser() user: { wallet: string },
  ) {
    return this.service.refund(
      propertyId,
      user.wallet,
      dto.refundTxHash,
    );
  }
}

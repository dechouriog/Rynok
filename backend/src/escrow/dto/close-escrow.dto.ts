import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { TX_HASH_REGEX } from './record-deposit.dto.js';

export class ConfirmReleaseDto {
  @ApiProperty({ description: 'Hash de la transacción confirmDelivery ya minada.' })
  @Matches(TX_HASH_REGEX, { message: 'releaseTxHash debe ser un hash de transacción válido' })
  releaseTxHash: string;
}

export class RefundDto {
  @ApiProperty({ description: 'Hash de la transacción refund ya minada.' })
  @Matches(TX_HASH_REGEX, { message: 'refundTxHash debe ser un hash de transacción válido' })
  refundTxHash: string;
}

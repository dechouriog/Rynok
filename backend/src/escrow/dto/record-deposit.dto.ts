import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumberString, IsOptional, IsUUID, Matches } from 'class-validator';

export const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

export class RecordDepositDto {
  @ApiProperty({ description: 'UUID de la propiedad en Rynok (no el hash on-chain).' })
  @IsUUID()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Ignorado: el comprador es siempre la wallet del token.' })
  @IsOptional()
  @IsEthereumAddress()
  buyerWallet?: string;

  @ApiPropertyOptional({ description: 'Ignorado: el vendedor es siempre el dueño de la propiedad.' })
  @IsOptional()
  @IsEthereumAddress()
  sellerWallet?: string;

  @ApiProperty({ example: '3.5', description: 'Debe coincidir con el precio de la propiedad.' })
  @IsNumberString()
  amountEth: string;

  @ApiProperty()
  @IsEthereumAddress()
  contractAddress: string;

  @ApiProperty({ description: 'Hash de la transacción de depósito ya confirmada on-chain.' })
  @Matches(TX_HASH_REGEX, { message: 'depositTxHash debe ser un hash de transacción válido' })
  depositTxHash: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumberString, IsString } from 'class-validator';

export class RecordDepositDto {
  @ApiProperty({ description: 'UUID de la propiedad en Rynok (no el hash on-chain).' })
  @IsString()
  propertyId: string;

  @ApiProperty()
  @IsEthereumAddress()
  buyerWallet: string;

  @ApiProperty()
  @IsEthereumAddress()
  sellerWallet: string;

  @ApiProperty({ example: '3.5' })
  @IsNumberString()
  amountEth: string;

  @ApiProperty()
  @IsEthereumAddress()
  contractAddress: string;

  @ApiProperty({ description: 'Hash de la transacción de depósito ya confirmada on-chain.' })
  @IsString()
  depositTxHash: string;
}
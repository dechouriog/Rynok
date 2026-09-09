import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConnectWalletDto {
  @ApiProperty({
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
    description: 'Dirección de la wallet Ethereum (checksummed o lowercase).',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'walletAddress inválida' })
  walletAddress: string;

  @ApiProperty({
    example: '0x8f3e2c...',
    description: 'Firma generada por MetaMask al firmar `message` con la private key de la wallet.',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    example: 'Iniciar sesión en Rynok - 1736200000000',
    description: 'Mensaje original que el usuario firmó (incluye timestamp para evitar replay).',
  })
  @IsString()
  message: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestNonceDto {
  @ApiProperty({
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
    description: 'Dirección de la wallet que va a iniciar sesión.',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'walletAddress inválida' })
  walletAddress: string;
}

export class ConnectWalletDto extends RequestNonceDto {
  @ApiProperty({
    example: '0x8f3e2c...',
    description: 'Firma generada por MetaMask al firmar `message` con la private key de la wallet.',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    example: 'Iniciar sesión en Rynok\n\nWallet: 0x71c7...\nNonce: 9f86d081884c7d65...\nEmitido: 2026-10-11T12:00:00.000Z',
    description: 'Mensaje exacto devuelto por POST /auth/nonce. Es de un solo uso y expira a los 5 minutos.',
  })
  @IsString()
  message: string;
}

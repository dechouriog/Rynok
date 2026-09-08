import { IsString, Matches } from 'class-validator';

export class ConnectWalletDto {
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'walletAddress inválida' })
  walletAddress: string;

  @IsString()
  signature: string;

  @IsString()
  message: string;
}
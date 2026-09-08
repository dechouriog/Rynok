import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConnectWalletDto } from './dto/connect-wallet.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('connect')
  connect(@Body() dto: ConnectWalletDto) {
    return this.authService.connectWallet(dto);
  }
}
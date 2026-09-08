import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ConnectWalletDto } from './dto/connect-wallet.dto.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('connect')
  connect(@Body() dto: ConnectWalletDto) {
    return this.authService.connectWallet(dto);
  }

  @Get('me')
  @UseGuards(WalletAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.findById(user.sub);
  }
}
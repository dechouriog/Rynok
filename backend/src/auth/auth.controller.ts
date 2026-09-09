import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { ConnectWalletDto } from './dto/connect-wallet.dto.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('connect')
  @ApiOperation({
    summary: 'Registrar o autenticar una wallet',
    description:
      'Verifica que `signature` corresponda a `message` firmado por `walletAddress`. ' +
      'Si el usuario no existe, lo crea. Devuelve un JWT para usar en los endpoints protegidos.',
  })
  @ApiResponse({ status: 201, description: 'Wallet autenticada. Devuelve { accessToken, user }.' })
  @ApiUnauthorizedResponse({ description: 'La firma no corresponde a la wallet declarada.' })
  connect(@Body() dto: ConnectWalletDto) {
    return this.authService.connectWallet(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario (id, walletAddress, displayName).' })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
  @UseGuards(WalletAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.findById(user.sub);
  }
}
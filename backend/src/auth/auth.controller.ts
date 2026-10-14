import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { ConnectWalletDto, RequestNonceDto } from './dto/connect-wallet.dto.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  @ApiOperation({
    summary: 'Obtener el mensaje a firmar para iniciar sesión',
    description: 'Devuelve un mensaje con un nonce aleatorio, de un solo uso, que expira a los 5 minutos.',
  })
  @ApiResponse({ status: 201, description: 'Devuelve { message }.' })
  nonce(@Body() dto: RequestNonceDto) {
    return this.authService.createLoginMessage(dto.walletAddress);
  }

  @Post('connect')
  @ApiOperation({
    summary: 'Registrar o autenticar una wallet',
    description:
      'Verifica que `message` sea un mensaje vigente emitido por POST /auth/nonce para `walletAddress` ' +
      'y que `signature` lo haya firmado esa wallet. El mensaje se consume (no se puede reutilizar). ' +
      'Si el usuario no existe, lo crea. Devuelve un JWT para usar en los endpoints protegidos.',
  })
  @ApiResponse({ status: 201, description: 'Wallet autenticada. Devuelve { accessToken, user }.' })
  @ApiUnauthorizedResponse({ description: 'Mensaje inválido, expirado o ya usado, o firma que no corresponde a la wallet.' })
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
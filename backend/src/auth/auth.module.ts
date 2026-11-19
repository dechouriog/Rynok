import { Logger, Module } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/entities/user.entity.js';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';

/**
 * JWT_SECRET es obligatorio en producción. En desarrollo y pruebas, si falta, se genera uno
 * aleatorio por proceso: nunca hay un secreto fijo en el código.
 */
export function resolveJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }
  Logger.warn('JWT_SECRET no definido: se usa un secreto aleatorio temporal', 'AuthModule');
  return randomBytes(32).toString('hex');
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // registerAsync: el secreto se lee cuando ConfigModule ya cargó el .env.
    // Con register() se evaluaba al importar el archivo y siempre caía en 'dev-secret'.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, WalletAuthGuard],

  exports: [JwtModule, AuthService, WalletAuthGuard],
})
export class AuthModule {}

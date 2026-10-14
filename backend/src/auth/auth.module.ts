import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/entities/user.entity.js';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // registerAsync: el secreto se lee cuando ConfigModule ya cargó el .env.
    // Con register() se evaluaba al importar el archivo y siempre caía en 'dev-secret'.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    WalletAuthGuard,
  ],

  exports: [
    JwtModule,
    AuthService,
    WalletAuthGuard,
  ],
})
export class AuthModule {}
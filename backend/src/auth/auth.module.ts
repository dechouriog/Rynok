import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/entities/user.entity.js';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { WalletAuthGuard } from './wallet-auth.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '7d' },
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
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module.js';
import { PropertyModule } from './property/property.module.js';
import { EscrowModule } from './escrow/escrow.module.js';
import { HealthController } from './health/health.controller.js';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite básico por IP: 120 peticiones por minuto (el login tiene uno más estricto).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        // En hosting (Railway, Render, Neon...) la conexión llega como DATABASE_URL;
        // en local se usan las variables DB_* del .env.
        const url = config.get<string>('DATABASE_URL');
        const connection = url
          ? { url }
          : {
              host: config.get<string>('DB_HOST'),
              port: +config.get<number>('DB_PORT', 5432),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
            };
        return {
          type: 'postgres',
          ...connection,
          ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          // Cómodo para el MVP (crea y actualiza tablas solo). DB_SYNCHRONIZE=false para usar migraciones.
          synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        };
      },
    }),

    AuthModule,
    PropertyModule,
    EscrowModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}

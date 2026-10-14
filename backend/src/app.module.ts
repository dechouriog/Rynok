import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PropertyModule } from './property/property.module.js';
import { EscrowModule } from './escrow/escrow.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
          synchronize: true,
        };
      },
    }),

    AuthModule,
    PropertyModule,
    EscrowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
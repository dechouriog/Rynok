import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Rynok API')
    .setDescription(
      'API REST de Rynok — marketplace inmobiliario descentralizado. ' +
        'Entrega 1: autenticación por firma de wallet (MetaMask + JWT) y CRUD de propiedades. ' +
        'La compra en ETH y el escrow (Milestone 3) todavía no están implementados.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Autenticación por firma de wallet')
    .addTag('properties', 'Listado, búsqueda y gestión de propiedades')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
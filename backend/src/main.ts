import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { UPLOADS_URL_PREFIX, uploadDir } from './uploads/uploads.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  // Imágenes subidas por los usuarios. nosniff impide que el navegador las
  // interprete como otro tipo de contenido.
  app.useStaticAssets(uploadDir(), {
    prefix: UPLOADS_URL_PREFIX,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Rynok API')
    .setDescription(
      'API REST de Rynok — marketplace inmobiliario descentralizado: ' +
        'autenticación por firma de wallet (MetaMask + JWT), CRUD de propiedades ' +
        'y registro de compras protegidas por el smart contract de escrow.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Autenticación por firma de wallet')
    .addTag('properties', 'Listado, búsqueda y gestión de propiedades')
    .addTag('escrow', 'Depósitos, liberación y reembolsos del escrow on-chain')
    .addTag('uploads', 'Subida de imágenes de propiedades')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
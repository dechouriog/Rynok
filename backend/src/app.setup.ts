import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { UPLOADS_URL_PREFIX, uploadDir } from './uploads/uploads.service.js';

/** Orígenes permitidos por CORS, separados por coma en CORS_ORIGINS (p. ej. la URL de Vercel). */
export function corsOrigins(raw = process.env.CORS_ORIGINS): string[] {
  return (raw ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/**
 * Configuración compartida por main.ts y las pruebas e2e, para que las pruebas ejerciten
 * exactamente la misma validación, cabeceras y filtros que producción.
 */
export function configureApp(app: NestExpressApplication, options: { swagger?: boolean } = {}) {
  // Render y otros hostings ponen un proxy delante: sin esto todas las peticiones
  // parecerían venir de la misma IP y el rate limiting bloquearía a todos a la vez.
  app.set('trust proxy', 1);

  // La web (Vercel) está en otro origen y carga las imágenes de /uploads:
  // Cross-Origin-Resource-Policy debe permitirlo.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = corsOrigins();
  if (!process.env.CORS_ORIGINS && process.env.NODE_ENV === 'production') {
    Logger.warn('CORS_ORIGINS no está definido: solo se permite http://localhost:3000', 'Bootstrap');
  }
  app.enableCors({ origin: origins, methods: ['GET', 'POST', 'PATCH', 'DELETE'] });

  // Imágenes subidas por los usuarios. nosniff impide que el navegador las interprete como otro tipo.
  app.useStaticAssets(uploadDir(), {
    prefix: UPLOADS_URL_PREFIX,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  if (options.swagger) {
    const config = new DocumentBuilder()
      .setTitle('Rynok API')
      .setDescription(
        'API REST de Rynok, marketplace inmobiliario descentralizado: autenticación por firma de wallet ' +
          '(MetaMask + JWT con nonce de un solo uso), CRUD de propiedades, subida de imágenes y registro de ' +
          'compras protegidas por el smart contract de escrow, verificadas on-chain. Los errores usan siempre ' +
          'el formato { statusCode, error, message, path, timestamp }.',
      )
      .setVersion('3.1')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('health', 'Estado del servicio')
      .addTag('auth', 'Autenticación por firma de wallet')
      .addTag('properties', 'Listado, búsqueda y gestión de propiedades')
      .addTag('escrow', 'Depósitos, liberación y reembolsos del escrow on-chain')
      .addTag('uploads', 'Subida de imágenes de propiedades')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
  return app;
}

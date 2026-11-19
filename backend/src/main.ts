import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app, { swagger: true });
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API escuchando en el puerto ${port} (Swagger en /api/docs)`, 'Bootstrap');
}
void bootstrap();

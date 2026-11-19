import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Registra cada petición con método, ruta, código y duración. */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`;
      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });
    next();
  }
}

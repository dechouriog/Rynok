import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorBody = { message?: string | string[]; error?: string };

/**
 * Formato de error único para toda la API: { statusCode, error, message, path, timestamp }.
 * Los errores no controlados se registran con stack y se responden como 500 genérico,
 * sin filtrar detalles internos (por ejemplo, mensajes de Postgres) al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] | object = 'Error interno del servidor';

    if (isHttp) {
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : ((body as ErrorBody).message ?? body);
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error: (HttpStatus[status] ?? 'ERROR').replace(/_/g, ' '),
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception;

    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const logMessage = `[${ip}] [${request.method}] [${request.url}] - ${JSON.stringify(message)}`;

    // Redact sensitive data (passwords, tokens)
    const redactedMessage = logMessage.replace(
      /"(password|token|accessToken|refreshToken|secret)":"[^"]+"/gi,
      '"$1":"***REDACTED***"'
    );

    if (status >= 500) {
      this.logger.error(redactedMessage, exception instanceof Error ? exception.stack : '');
    } else {
      this.logger.warn(redactedMessage);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status >= 500 ? 'Internal server error' : (message as any)?.message || message,
    });
  }
}

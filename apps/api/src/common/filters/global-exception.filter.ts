import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiFailure } from '@auction/shared';

/**
 * Single funnel for all errors. Maps:
 *   - `AppException` / `HttpException` → typed `ApiFailure` with original status
 *   - anything else                    → 500 with code `internal_error`
 *
 * The web client only ever needs to handle the `ApiFailure` shape.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const { status, body } = this.toApiFailure(exception);

    if (status >= 500) {
      this.logger.error(
        `Unhandled error: ${body.error.code} — ${body.error.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    res.status(status).json(body);
  }

  private toApiFailure(exception: unknown): { status: number; body: ApiFailure } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const { code, message, details } = this.normalizeHttpResponse(response, status);
      return {
        status,
        body: {
          success: false,
          error: { code, message, ...(details !== undefined ? { details } : {}) },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred',
        },
      },
    };
  }

  private normalizeHttpResponse(
    response: string | object,
    status: number,
  ): { code: string; message: string; details?: unknown } {
    if (typeof response === 'string') {
      return { code: this.fallbackCodeForStatus(status), message: response };
    }
    const r = response as Record<string, unknown>;
    const code = typeof r.code === 'string' ? r.code : this.fallbackCodeForStatus(status);
    const message =
      typeof r.message === 'string'
        ? r.message
        : Array.isArray(r.message)
          ? r.message.join(', ')
          : this.fallbackMessageForStatus(status);
    const details = 'details' in r ? r.details : undefined;
    return { code, message, details };
  }

  private fallbackCodeForStatus(status: number): string {
    if (status === 400) return 'bad_request';
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 422) return 'unprocessable';
    if (status === 429) return 'rate_limited';
    return 'http_error';
  }

  private fallbackMessageForStatus(status: number): string {
    if (status === 400) return 'Bad request';
    if (status === 401) return 'Unauthorized';
    if (status === 403) return 'Forbidden';
    if (status === 404) return 'Resource not found';
    if (status === 409) return 'Conflict';
    if (status === 422) return 'Unprocessable entity';
    if (status === 429) return 'Too many requests';
    return 'Request failed';
  }
}

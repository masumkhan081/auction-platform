import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-level exception. Services throw `AppException`; the global filter maps
 * the structured `code` to the HTTP layer. Keeping a stable `code` lets the web
 * client map errors to UI states without parsing prose.
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }

  static notFound(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND, details);
  }

  static unauthorized(code: string, message = 'Unauthorized', details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED, details);
  }

  static forbidden(code: string, message = 'Forbidden', details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN, details);
  }

  static conflict(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT, details);
  }

  static badRequest(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.BAD_REQUEST, details);
  }

  static unprocessable(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

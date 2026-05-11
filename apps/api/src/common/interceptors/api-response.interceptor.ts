import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ApiSuccess } from '@auction/shared';

/**
 * Wraps every controller's return value in the standardized `ApiSuccess<T>`
 * envelope. Controllers can return raw data (or `{ data, message }`) and the
 * envelope is applied uniformly. The matching `ApiFailure` is produced by the
 * global exception filter.
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((value): ApiSuccess<T> => {
        if (isEnvelope<T>(value)) {
          return { success: true, data: value.data, ...(value.message ? { message: value.message } : {}) };
        }
        return { success: true, data: value };
      }),
    );
  }
}

function isEnvelope<T>(value: unknown): value is { data: T; message?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Object.keys(value).every((k) => k === 'data' || k === 'message')
  );
}

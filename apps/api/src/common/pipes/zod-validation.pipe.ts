import { Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { AppException } from '../errors/app-exception';

/**
 * Pipe that runs a Zod schema against the inbound payload and returns the
 * parsed (and transformed) value. Used via `@ZodBody(schema)` /
 * `@ZodQuery(schema)` decorators so controllers stay declarative.
 */
@Injectable()
export class ZodValidationPipe<TSchema extends ZodTypeAny>
  implements PipeTransform<unknown, ZodInfer<TSchema>>
{
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): ZodInfer<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw AppException.unprocessable(
        'validation_failed',
        'Request payload failed validation',
        result.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      );
    }
    return result.data;
  }
}

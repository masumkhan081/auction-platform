import { Injectable } from '@nestjs/common';
import { EnvSchema, type Env } from './env.schema';

/**
 * Parses `process.env` exactly once at module construction. If validation fails,
 * the error is thrown before any feature module is initialized.
 */
@Injectable()
export class EnvService {
  readonly config: Env;

  constructor() {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid environment variables:\n${issues}`);
    }
    this.config = result.data;
  }

  get isProd(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isDev(): boolean {
    return this.config.NODE_ENV === 'development';
  }
}

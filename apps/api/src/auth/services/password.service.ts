import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

/**
 * Centralized password hashing — argon2id with sensible memory/time params.
 * If we ever need to rotate the algorithm, only this file changes.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456, // 19 MiB — OWASP minimum recommendation
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  verify(hashed: string, plain: string): Promise<boolean> {
    return argon2.verify(hashed, plain);
  }
}

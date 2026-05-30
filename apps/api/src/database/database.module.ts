import { Global, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { type EnvService } from '../config/env.service';
import { DRIZZLE, type DrizzleClient } from './database.tokens';
import * as schema from './schema';

/**
 * Wraps the pg `Pool` so Nest's lifecycle hook closes it on shutdown.
 * Services never inject `PgPoolHolder` directly — they inject `DRIZZLE`.
 */
@Injectable()
class PgPoolHolder implements OnModuleDestroy {
  private readonly logger = new Logger(PgPoolHolder.name);
  readonly pool: Pool;

  constructor(env: EnvService) {
    this.pool = new Pool({
      connectionString: env.config.DATABASE_URL,
      max: 10,
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Postgres pool');
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    PgPoolHolder,
    {
      provide: DRIZZLE,
      inject: [PgPoolHolder],
      useFactory: (holder: PgPoolHolder): DrizzleClient =>
        drizzle(holder.pool, { schema, logger: false }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

/** Helper type for service-level injection: `@Inject(DRIZZLE) db: DrizzleClient`. */
export const InjectDb = (): ParameterDecorator => Inject(DRIZZLE);

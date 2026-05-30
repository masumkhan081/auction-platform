import { Global, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { type EnvService } from '../config/env.service';
import { REDIS, type RedisClient } from './redis.tokens';

@Injectable()
class RedisHolder implements OnModuleDestroy {
  private readonly logger = new Logger(RedisHolder.name);
  readonly client: RedisClient;

  constructor(env: EnvService) {
    this.client = new Redis(env.config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection');
    await this.client.quit();
  }
}

@Global()
@Module({
  providers: [
    RedisHolder,
    {
      provide: REDIS,
      inject: [RedisHolder],
      useFactory: (holder: RedisHolder): RedisClient => holder.client,
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}

export const InjectRedis = (): ParameterDecorator => Inject(REDIS);

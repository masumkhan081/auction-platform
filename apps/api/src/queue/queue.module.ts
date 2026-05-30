import {
  Global,
  Injectable,
  Module,
  forwardRef,
  type OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { AuctionsModule } from '../auctions/auctions.module';
import { type EnvService } from '../config/env.service';
import { AuctionLifecycleQueue } from './auction-lifecycle.queue';
import { AuctionLifecycleWorker } from './auction-lifecycle.worker';
import { BULLMQ_REDIS } from './queue.tokens';

/**
 * BullMQ requires `maxRetriesPerRequest: null` because of its blocking
 * commands; this collides with our main Redis client (which retries 3x).
 * So we hold a dedicated ioredis connection just for BullMQ.
 */
@Injectable()
class BullmqRedisHolder implements OnModuleDestroy {
  readonly client: Redis;

  constructor(env: EnvService) {
    this.client = new Redis(env.config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

@Global()
@Module({
  imports: [forwardRef(() => AuctionsModule)],
  providers: [
    BullmqRedisHolder,
    {
      provide: BULLMQ_REDIS,
      inject: [BullmqRedisHolder],
      useFactory: (h: BullmqRedisHolder) => h.client,
    },
    AuctionLifecycleQueue,
    AuctionLifecycleWorker,
  ],
  exports: [AuctionLifecycleQueue],
})
export class QueueModule {}

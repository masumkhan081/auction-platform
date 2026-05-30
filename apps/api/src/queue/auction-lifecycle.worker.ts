import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { type Job, Worker } from 'bullmq';
import type Redis from 'ioredis';
import { type AuctionLifecycleService } from '../auctions/auction-lifecycle.service';
import { type AuctionsRepository } from '../auctions/auctions.repository';
import { type AuctionLifecycleQueue } from './auction-lifecycle.queue';
import {
  JOBS,
  QUEUES,
  SWEEP_GRACE_MS,
  type AuctionLifecycleJobData,
} from './queue.constants';
import { InjectBullmqRedis } from './queue.tokens';

/**
 * BullMQ worker. The handler is intentionally thin — every business decision
 * lives in `AuctionLifecycleService` so it's covered by the same code paths
 * the API uses. Worker only deals with: pull job → invoke service → on the
 * `not_yet` outcome, requeue.
 *
 * The service contract guarantees idempotency, so duplicate or replayed jobs
 * are safe.
 */
@Injectable()
export class AuctionLifecycleWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuctionLifecycleWorker.name);
  private worker!: Worker<AuctionLifecycleJobData>;

  constructor(
    @InjectBullmqRedis() private readonly redis: Redis,
    private readonly lifecycle: AuctionLifecycleService,
    private readonly queue: AuctionLifecycleQueue,
    private readonly auctionsRepo: AuctionsRepository,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<AuctionLifecycleJobData>(
      QUEUES.auctionLifecycle,
      async (job: Job<AuctionLifecycleJobData>) => {
        const { auctionId } = job.data;
        if (job.name === JOBS.auctionStart) {
          const result = await this.lifecycle.startIfDue(auctionId);
          this.logger.log(
            `worker.auction.start auctionId=${auctionId} outcome=${result.outcome}`,
          );
          return;
        }
        if (job.name === JOBS.auctionClose) {
          const result = await this.lifecycle.closeIfDue(auctionId);
          this.logger.log(
            `worker.auction.close auctionId=${auctionId} outcome=${result.outcome}`,
          );
          if (result.outcome === 'not_yet') {
            await this.queue.requeueClose(auctionId, result.requeueAt);
          }
          return;
        }
        if (job.name === JOBS.auctionSweep) {
          const overdue = await this.auctionsRepo.findOverdueLive(SWEEP_GRACE_MS);
          if (overdue.length === 0) return;
          this.logger.warn(
            `worker.auction.sweep found_stuck=${overdue.length} grace_ms=${SWEEP_GRACE_MS}`,
          );
          for (const row of overdue) {
            await this.queue.requeueClose(row.id, new Date());
          }
          return;
        }
        this.logger.warn(`worker.unknown_job name=${job.name} auctionId=${auctionId}`);
      },
      { connection: this.redis },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `worker.failed name=${job?.name ?? '?'} auctionId=${job?.data.auctionId ?? '?'} attempt=${job?.attemptsMade ?? 0}: ${err.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

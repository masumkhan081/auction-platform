import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { InjectBullmqRedis } from './queue.tokens';
import {
  JOBS,
  QUEUES,
  SWEEP_INTERVAL_MS,
  type AuctionLifecycleJobData,
} from './queue.constants';

/**
 * Wraps the BullMQ queue. Scheduling helpers compute `delay` from absolute
 * times so callers express intent ("run at endsAt") rather than mechanics.
 *
 * Idempotency: each (auctionId, phase) gets a stable `jobId` on initial
 * scheduling. Subsequent re-schedules from the worker (e.g. after anti-sniping
 * extension) use unique jobIds so they're allowed; the worker itself is
 * idempotent and handles overlap safely.
 */
@Injectable()
export class AuctionLifecycleQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuctionLifecycleQueue.name);
  private queue!: Queue<AuctionLifecycleJobData>;

  constructor(@InjectBullmqRedis() private readonly redis: Redis) {}

  onModuleInit(): void {
    this.queue = new Queue<AuctionLifecycleJobData>(QUEUES.auctionLifecycle, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 5_000 },
      },
    });
    // Swallow Queue-level errors (typically Redis disconnects) — they're noisy
    // in dev and the underlying connection retries on its own.
    this.queue.on('error', (err) => {
      this.logger.error(`queue.error: ${err.message}`);
    });

    // Repeating sweeper. Scheduling is fire-and-forget so a Redis hiccup at
    // boot doesn't crash the process; we'll retry on the next module init.
    void this.scheduleSweep();
  }

  private async scheduleSweep(): Promise<void> {
    try {
      await this.queue.add(
        JOBS.auctionSweep,
        { auctionId: '*' },
        {
          jobId: 'auction.sweep:repeat',
          repeat: { every: SWEEP_INTERVAL_MS },
        },
      );
      this.logger.log(`queue.sweep_scheduled interval_ms=${SWEEP_INTERVAL_MS}`);
    } catch (err) {
      this.logger.error(`queue.sweep_schedule_failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  /** Initial scheduling at auction creation. Stable jobId prevents duplicates. */
  async scheduleStart(auctionId: string, runAt: Date): Promise<void> {
    const delay = Math.max(0, runAt.getTime() - Date.now());
    await this.queue.add(
      JOBS.auctionStart,
      { auctionId },
      { jobId: `start:${auctionId}`, delay },
    );
    this.logger.log(`queue.scheduled job=auction.start auctionId=${auctionId} runAt=${runAt.toISOString()}`);
  }

  /** Initial close scheduling at auction creation. */
  async scheduleClose(auctionId: string, runAt: Date): Promise<void> {
    const delay = Math.max(0, runAt.getTime() - Date.now());
    await this.queue.add(
      JOBS.auctionClose,
      { auctionId },
      { jobId: `close:${auctionId}`, delay },
    );
    this.logger.log(`queue.scheduled job=auction.close auctionId=${auctionId} runAt=${runAt.toISOString()}`);
  }

  /**
   * Re-schedule by the worker (after anti-sniping extension or arrival before
   * scheduled time). Unique jobId because BullMQ rejects duplicates.
   */
  async requeueClose(auctionId: string, runAt: Date): Promise<void> {
    const delay = Math.max(0, runAt.getTime() - Date.now());
    await this.queue.add(
      JOBS.auctionClose,
      { auctionId },
      { jobId: `close:${auctionId}:${Date.now()}`, delay },
    );
    this.logger.log(`queue.requeued job=auction.close auctionId=${auctionId} runAt=${runAt.toISOString()}`);
  }

  getQueue(): Queue<AuctionLifecycleJobData> {
    return this.queue;
  }
}

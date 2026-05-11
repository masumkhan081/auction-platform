import { Inject } from '@nestjs/common';

/**
 * Token for the dedicated BullMQ Redis connection. Held in its own file to
 * avoid a circular import between `queue.module.ts` and the queue/worker.
 */
export const BULLMQ_REDIS = Symbol('BULLMQ_REDIS');

export const InjectBullmqRedis = (): ParameterDecorator => Inject(BULLMQ_REDIS);

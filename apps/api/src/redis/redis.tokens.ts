import type Redis from 'ioredis';

export const REDIS = Symbol('REDIS');
export type RedisClient = Redis;

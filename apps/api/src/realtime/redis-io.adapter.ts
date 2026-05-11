import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Redis } from 'ioredis';
import type { ServerOptions, Server } from 'socket.io';

/**
 * Wraps Socket.IO with the Redis pub/sub adapter so events fan out across all
 * api instances. The IoAdapter pattern is Nest's seam for swapping the
 * underlying engine without touching gateway code.
 *
 * We do NOT await an explicit `connect()` on the duplicated clients — ioredis
 * connects lazily on first command, and an unreachable Redis would otherwise
 * hang the bootstrap forever. The adapter buffers commands until reachable.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterFactory!: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly redis: Redis,
  ) {
    super(app);
  }

  prepare(): void {
    const pubClient = this.redis.duplicate();
    const subClient = this.redis.duplicate();
    pubClient.on('error', (err) => this.logger.error(`pub error: ${err.message}`));
    subClient.on('error', (err) => this.logger.error(`sub error: ${err.message}`));
    this.adapterFactory = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter prepared (lazy connect)');
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterFactory);
    return server;
  }
}

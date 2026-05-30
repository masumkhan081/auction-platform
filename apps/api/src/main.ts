import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';
import { REDIS } from './redis/redis.tokens';
import type { RedisClient } from './redis/redis.tokens';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));

  const env = app.get(EnvService);

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: env.config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Socket.IO with Redis pub/sub for cross-instance fan-out.
  const redis = app.get<RedisClient>(REDIS);
  const wsAdapter = new RedisIoAdapter(app, redis);
  wsAdapter.prepare();
  app.useWebSocketAdapter(wsAdapter);

  app.enableShutdownHooks();

  await app.listen(env.config.PORT);
   
  console.log(`[api] listening on http://localhost:${env.config.PORT}`);
}

void bootstrap();

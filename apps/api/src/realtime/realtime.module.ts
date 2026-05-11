import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeEmitter } from './realtime.emitter';
import { RealtimeGateway } from './realtime.gateway';

@Global()
@Module({
  imports: [AuthModule], // gateway uses TokenService for handshake auth
  providers: [RealtimeGateway, RealtimeEmitter],
  exports: [RealtimeEmitter],
})
export class RealtimeModule {}

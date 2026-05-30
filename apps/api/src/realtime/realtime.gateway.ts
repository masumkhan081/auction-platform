import { Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  SubscribeAuctionPayloadSchema,
  UnsubscribeAuctionPayloadSchema,
  auctionRoom,
  userRoom,
} from '@auction/shared';
import { type EnvService } from '../config/env.service';
import { type TokenService } from '../auth/services/token.service';

type SocketData = { userId: string | null };

/**
 * The gateway owns Socket.IO room membership. Authentication is **soft**:
 *   - if a valid access cookie / Bearer is present, the socket joins
 *     `user:{userId}` so it receives notifications
 *   - otherwise the socket is anonymous; it can still subscribe to
 *     auction rooms (read-only public bidding stream)
 *
 * Clients can ONLY emit `auction:subscribe` / `auction:unsubscribe`. They
 * cannot self-join `user:` rooms — that's server-controlled.
 *
 * Every inbound payload is parsed against its Zod schema; malformed messages
 * are silently dropped (logged at debug).
 */
@WebSocketGateway({ cors: { credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  io!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly env: EnvService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = this.authenticateHandshake(client);
    (client.data as SocketData).userId = userId;
    if (userId) {
      await client.join(userRoom(userId));
      this.logger.debug(`socket connected userId=${userId} sid=${client.id}`);
    } else {
      this.logger.debug(`socket connected anonymous sid=${client.id}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data as SocketData).userId ?? 'anon';
    this.logger.debug(`socket disconnected userId=${userId} sid=${client.id}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribeAuction)
  async onSubscribe(client: Socket, payload: unknown): Promise<{ ok: true } | { ok: false }> {
    const parsed = SubscribeAuctionPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.debug(`socket bad subscribe payload sid=${client.id}`);
      return { ok: false };
    }
    await client.join(auctionRoom(parsed.data.auctionId));
    return { ok: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribeAuction)
  async onUnsubscribe(client: Socket, payload: unknown): Promise<{ ok: true } | { ok: false }> {
    const parsed = UnsubscribeAuctionPayloadSchema.safeParse(payload);
    if (!parsed.success) return { ok: false };
    await client.leave(auctionRoom(parsed.data.auctionId));
    return { ok: true };
  }

  private authenticateHandshake(client: Socket): string | null {
    const headers = client.handshake.headers;

    // Cookie first (set by /auth/login flow), then Authorization header.
    const rawCookie = headers.cookie;
    if (typeof rawCookie === 'string') {
      const token = parseCookie(rawCookie, this.env.config.COOKIE_ACCESS_NAME);
      if (token) {
        try {
          return this.tokens.verifyAccessToken(token).sub;
        } catch {
          /* fall through to header */
        }
      }
    }

    const auth = headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      try {
        return this.tokens.verifyAccessToken(auth.slice('Bearer '.length).trim()).sub;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function parseCookie(raw: string, name: string): string | undefined {
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

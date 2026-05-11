import { z } from 'zod';
import { AuctionStatusSchema } from '../enums/auction-status';
import { NotificationDtoSchema } from '../schemas/notification';
import { IsoDateSchema, MoneyMinorSchema, UuidSchema } from '../schemas/primitives';

/**
 * Socket.IO event contracts. The same Zod schemas validate payloads on both ends:
 *  - server emits: parsed before `emit()` to guarantee shape
 *  - client receives: parsed before update so a malformed payload never reaches React state
 *
 * Room naming convention: `auction:{auctionId}` — used for live bid streams.
 */

export const SOCKET_NAMESPACES = {
  auctions: '/auctions',
} as const;

export const auctionRoom = (auctionId: string) => `auction:${auctionId}` as const;
export const userRoom = (userId: string) => `user:${userId}` as const;

// ─── Server → Client ─────────────────────────────────────────────────────────

export const BidPlacedEventSchema = z.object({
  auctionId: UuidSchema,
  bidId: UuidSchema,
  bidderId: UuidSchema,
  bidderDisplayName: z.string(),
  amountMinor: MoneyMinorSchema,
  placedAt: IsoDateSchema,
  newCurrentHighestMinor: MoneyMinorSchema,
});
export type BidPlacedEvent = z.infer<typeof BidPlacedEventSchema>;

export const AuctionTickEventSchema = z.object({
  auctionId: UuidSchema,
  serverNow: IsoDateSchema,
  endsAt: IsoDateSchema,
  status: AuctionStatusSchema,
});
export type AuctionTickEvent = z.infer<typeof AuctionTickEventSchema>;

export const AuctionClosedEventSchema = z.object({
  auctionId: UuidSchema,
  status: AuctionStatusSchema,
  winnerBidId: UuidSchema.nullable(),
  winningAmountMinor: MoneyMinorSchema.nullable(),
  closedAt: IsoDateSchema,
});
export type AuctionClosedEvent = z.infer<typeof AuctionClosedEventSchema>;

export const OutbidEventSchema = z.object({
  auctionId: UuidSchema,
  previousBidderId: UuidSchema,
  newCurrentHighestMinor: MoneyMinorSchema,
});
export type OutbidEvent = z.infer<typeof OutbidEventSchema>;

/** Sent to `user:{recipientId}` when a notification is created. */
export const NotificationCreatedEventSchema = NotificationDtoSchema;
export type NotificationCreatedEvent = z.infer<typeof NotificationCreatedEventSchema>;

// ─── Client → Server ─────────────────────────────────────────────────────────

export const SubscribeAuctionPayloadSchema = z.object({
  auctionId: UuidSchema,
});
export type SubscribeAuctionPayload = z.infer<typeof SubscribeAuctionPayloadSchema>;

export const UnsubscribeAuctionPayloadSchema = SubscribeAuctionPayloadSchema;
export type UnsubscribeAuctionPayload = z.infer<typeof UnsubscribeAuctionPayloadSchema>;

// ─── Event name catalog ──────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // server → client (auction room)
  bidPlaced: 'auction:bid-placed',
  auctionTick: 'auction:tick',
  auctionClosed: 'auction:closed',
  outbid: 'auction:outbid',
  // server → client (user room)
  notificationCreated: 'notification:created',
  // client → server
  subscribeAuction: 'auction:subscribe',
  unsubscribeAuction: 'auction:unsubscribe',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/**
 * Discriminated map for typed `emit`/`on`. Consumed by both the NestJS gateway
 * and the web socket client hook so neither side can drift.
 */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.bidPlaced]: (payload: BidPlacedEvent) => void;
  [SOCKET_EVENTS.auctionTick]: (payload: AuctionTickEvent) => void;
  [SOCKET_EVENTS.auctionClosed]: (payload: AuctionClosedEvent) => void;
  [SOCKET_EVENTS.outbid]: (payload: OutbidEvent) => void;
  [SOCKET_EVENTS.notificationCreated]: (payload: NotificationCreatedEvent) => void;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.subscribeAuction]: (payload: SubscribeAuctionPayload) => void;
  [SOCKET_EVENTS.unsubscribeAuction]: (payload: UnsubscribeAuctionPayload) => void;
}

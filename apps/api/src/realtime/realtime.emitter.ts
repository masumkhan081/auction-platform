import { Injectable, Logger } from '@nestjs/common';
import {
  AuctionClosedEventSchema,
  AuctionTickEventSchema,
  BidPlacedEventSchema,
  NotificationCreatedEventSchema,
  OutbidEventSchema,
  SOCKET_EVENTS,
  auctionRoom,
  userRoom,
  type AuctionClosedEvent,
  type AuctionTickEvent,
  type BidPlacedEvent,
  type NotificationCreatedEvent,
  type OutbidEvent,
} from '@auction/shared';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Single funnel for outbound socket events. Every payload is parsed through
 * its Zod schema before emission; a backend bug can't poison clients with a
 * malformed shape.
 *
 * Callers are services in `bids/`, `auctions/`, `notifications/`. The gateway
 * itself never emits.
 */
@Injectable()
export class RealtimeEmitter {
  private readonly logger = new Logger(RealtimeEmitter.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  emitBidPlaced(event: BidPlacedEvent): void {
    const parsed = BidPlacedEventSchema.parse(event);
    this.gateway.io.to(auctionRoom(parsed.auctionId)).emit(SOCKET_EVENTS.bidPlaced, parsed);
  }

  emitOutbid(event: OutbidEvent): void {
    const parsed = OutbidEventSchema.parse(event);
    this.gateway.io.to(userRoom(parsed.previousBidderId)).emit(SOCKET_EVENTS.outbid, parsed);
  }

  emitAuctionTick(event: AuctionTickEvent): void {
    const parsed = AuctionTickEventSchema.parse(event);
    this.gateway.io.to(auctionRoom(parsed.auctionId)).emit(SOCKET_EVENTS.auctionTick, parsed);
  }

  emitAuctionClosed(event: AuctionClosedEvent): void {
    const parsed = AuctionClosedEventSchema.parse(event);
    this.gateway.io.to(auctionRoom(parsed.auctionId)).emit(SOCKET_EVENTS.auctionClosed, parsed);
  }

  emitNotificationCreated(event: NotificationCreatedEvent): void {
    const parsed = NotificationCreatedEventSchema.parse(event);
    this.gateway.io
      .to(userRoom(parsed.recipientId))
      .emit(SOCKET_EVENTS.notificationCreated, parsed);
  }
}

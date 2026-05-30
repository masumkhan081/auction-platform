import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type {
  AdminAuctionDto,
  AuctionStatus,
  CancelAuctionRequest,
  CreateAuctionRequest,
  Paginated,
  PaginationQuery,
  PublicAuctionDto,
  SellerAuctionDto,
  UpdateAuctionRequest,
} from '@auction/shared';
import { AppException, paginate } from '../common';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  auctions,
  auctionEvents,
  products,
  type AuctionRow,
  type NewAuctionRow,
} from '../database/schema';
import { transition as productTransition } from '../products/product-state';
import { type ProductsRepository } from '../products/products.repository';
import { type AuctionLifecycleQueue } from '../queue/auction-lifecycle.queue';
import { canCancel, canSellerEdit, transition } from './auction-state';
import { type AuctionsRepository } from './auctions.repository';

const MIN_LEAD_TIME_SECONDS = 5 * 60;
const MIN_DURATION_SECONDS = 60 * 60;

/**
 * Auction CRUD + cancel. Bidding/realtime/auto-close live in P1E.
 *
 * `create` and `cancel` mutate two tables (auctions + products) and write an
 * `auction_events` row, all inside a single SQL transaction.
 */
@Injectable()
export class AuctionsService {
  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    private readonly repo: AuctionsRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly queue: AuctionLifecycleQueue,
  ) {}

  // ─── Public reads ────────────────────────────────────────────────────────

  async listPublic(
    query: PaginationQuery,
    filters: { statusIn?: AuctionStatus[]; productId?: string },
  ): Promise<Paginated<PublicAuctionDto>> {
    const statusIn = filters.statusIn ?? (['SCHEDULED', 'LIVE'] satisfies AuctionStatus[]);
    return paginate({
      query,
      fetchTotal: () =>
        this.repo.total({
          statusIn,
          ...(filters.productId !== undefined ? { productId: filters.productId } : {}),
        }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset, {
          statusIn,
          ...(filters.productId !== undefined ? { productId: filters.productId } : {}),
        });
        return rows.map(this.toPublicDto);
      },
    });
  }

  async getPublicById(id: string): Promise<PublicAuctionDto> {
    const row = await this.repo.findById(id);
    if (!row) throw AppException.notFound('auction.not_found', 'Auction not found');
    return this.toPublicDto(row);
  }

  // ─── Seller-scoped ───────────────────────────────────────────────────────

  async listOwn(
    sellerId: string,
    query: PaginationQuery,
  ): Promise<Paginated<SellerAuctionDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.total({ sellerId }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset, { sellerId });
        return rows.map(this.toSellerDto);
      },
    });
  }

  async getOwnById(sellerId: string, id: string): Promise<SellerAuctionDto> {
    const row = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, row);
    return this.toSellerDto(row);
  }

  async create(
    sellerId: string,
    input: CreateAuctionRequest,
  ): Promise<SellerAuctionDto> {
    const product = await this.productsRepo.findById(input.productId);
    if (!product) {
      throw AppException.unprocessable('auction.product_not_found', 'Product not found');
    }
    if (product.sellerId !== sellerId) {
      throw AppException.forbidden('auction.product_not_owner', 'Product belongs to another seller');
    }

    const productNext = productTransition.enterAuction({
      approval: product.approvalStatus,
      lifecycle: product.lifecycleStatus,
    });

    const now = Date.now();
    const startsMs = input.startsAt.getTime();
    const endsMs = input.endsAt.getTime();
    if (startsMs < now + MIN_LEAD_TIME_SECONDS * 1000) {
      throw AppException.unprocessable(
        'auction.starts_too_soon',
        `Start time must be at least ${MIN_LEAD_TIME_SECONDS / 60} minutes from now`,
      );
    }
    if (endsMs - startsMs < MIN_DURATION_SECONDS * 1000) {
      throw AppException.unprocessable(
        'auction.duration_too_short',
        `Auction must run for at least ${MIN_DURATION_SECONDS / 60} minutes`,
      );
    }

    const insertValues: NewAuctionRow = {
      productId: input.productId,
      sellerId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      startPriceMinor: input.startPriceMinor,
      minBidIncrementMinor: input.minBidIncrementMinor,
      softCloseSeconds: input.softCloseSeconds,
      ...(input.reservePriceMinor !== undefined
        ? { reservePriceMinor: input.reservePriceMinor }
        : {}),
    };

    const created = await this.db.transaction(async (tx) => {
      const [auctionRow] = await tx.insert(auctions).values(insertValues).returning();
      if (!auctionRow) throw new Error('Auction insert returned no row');

      if (productNext.lifecycle) {
        await tx
          .update(products)
          .set({ lifecycleStatus: productNext.lifecycle, updatedAt: new Date() })
          .where(eq(products.id, product.id));
      }

      await tx.insert(auctionEvents).values({
        auctionId: auctionRow.id,
        actorId: sellerId,
        eventType: 'CREATED',
        payload: {
          productId: input.productId,
          startsAt: input.startsAt.toISOString(),
          endsAt: input.endsAt.toISOString(),
        },
      });

      return auctionRow;
    });

    // Schedule lifecycle workers after commit. Failure here doesn't roll back
    // the auction; the worker would never fire, which is recoverable via a
    // future sweeper or admin requeue. Logged for observability.
    await this.queue.scheduleStart(created.id, created.startsAt);
    await this.queue.scheduleClose(created.id, created.endsAt);

    return this.toSellerDto(created);
  }

  async update(
    sellerId: string,
    id: string,
    patch: UpdateAuctionRequest,
  ): Promise<SellerAuctionDto> {
    const current = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, current);
    if (!canSellerEdit(current.status)) {
      throw AppException.unprocessable(
        'auction.not_editable',
        `Cannot edit an auction in status ${current.status}`,
      );
    }

    const startsAt = patch.startsAt ?? current.startsAt;
    const endsAt = patch.endsAt ?? current.endsAt;
    if (endsAt.getTime() - startsAt.getTime() < MIN_DURATION_SECONDS * 1000) {
      throw AppException.unprocessable(
        'auction.duration_too_short',
        `Auction must run for at least ${MIN_DURATION_SECONDS / 60} minutes`,
      );
    }

    const updated = await this.repo.update(id, this.toAuctionPatch(patch));
    if (!updated) throw AppException.notFound('auction.not_found', 'Auction not found');
    return this.toSellerDto(updated);
  }

  async cancel(
    actorId: string,
    role: 'SELLER' | 'ADMIN',
    id: string,
    input: CancelAuctionRequest,
  ): Promise<SellerAuctionDto> {
    const current = await this.repo.findById(id);
    if (!current) throw AppException.notFound('auction.not_found', 'Auction not found');
    if (role === 'SELLER' && current.sellerId !== actorId) {
      throw AppException.forbidden('auction.not_owner', 'Not your auction');
    }
    if (!canCancel(current.status, role)) {
      throw AppException.unprocessable(
        'auction.cannot_cancel',
        `Cannot cancel an auction in status ${current.status}`,
      );
    }

    const wasHoldingProduct = current.status === 'SCHEDULED' || current.status === 'LIVE';
    const nextStatus = transition.cancel(current.status);

    const cancelled = await this.db.transaction(async (tx) => {
      const [auctionRow] = await tx
        .update(auctions)
        .set({
          status: nextStatus,
          cancellationReason: input.reason,
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(auctions.id, id))
        .returning();
      if (!auctionRow) throw new Error('Auction cancel returned no row');

      if (wasHoldingProduct) {
        const productRow = await tx.query.products.findFirst({
          where: eq(products.id, current.productId),
        });
        if (productRow?.lifecycleStatus === 'IN_AUCTION') {
          await tx
            .update(products)
            .set({ lifecycleStatus: 'LISTED', updatedAt: new Date() })
            .where(eq(products.id, current.productId));
        }
      }

      await tx.insert(auctionEvents).values({
        auctionId: id,
        actorId,
        eventType: 'CANCELLED',
        payload: { reason: input.reason, by: role },
      });

      return auctionRow;
    });

    return this.toSellerDto(cancelled);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  async getAdminById(id: string): Promise<AdminAuctionDto> {
    const row = await this.repo.findById(id);
    if (!row) throw AppException.notFound('auction.not_found', 'Auction not found');
    return this.toSellerDto(row);
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private assertSellerOwns(
    sellerId: string,
    row: AuctionRow | null,
  ): asserts row is AuctionRow {
    if (!row) throw AppException.notFound('auction.not_found', 'Auction not found');
    if (row.sellerId !== sellerId) {
      throw AppException.forbidden('auction.not_owner', 'Not your auction');
    }
  }

  private toAuctionPatch(patch: UpdateAuctionRequest): Partial<NewAuctionRow> {
    const out: Partial<NewAuctionRow> = {};
    if (patch.startsAt !== undefined) out.startsAt = patch.startsAt;
    if (patch.endsAt !== undefined) out.endsAt = patch.endsAt;
    if (patch.startPriceMinor !== undefined) out.startPriceMinor = patch.startPriceMinor;
    if (patch.minBidIncrementMinor !== undefined)
      out.minBidIncrementMinor = patch.minBidIncrementMinor;
    if (patch.softCloseSeconds !== undefined) out.softCloseSeconds = patch.softCloseSeconds;
    if (patch.reservePriceMinor !== undefined) {
      out.reservePriceMinor = patch.reservePriceMinor;
    }
    return out;
  }

  private toPublicDto = (row: AuctionRow): PublicAuctionDto => ({
    id: row.id,
    productId: row.productId,
    sellerId: row.sellerId,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    startPriceMinor: row.startPriceMinor,
    minBidIncrementMinor: row.minBidIncrementMinor,
    reservePriceMinor: row.reservePriceMinor,
    softCloseSeconds: row.softCloseSeconds,
    currentHighestMinor: row.currentHighestMinor,
    bidCount: row.bidCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  private toSellerDto = (row: AuctionRow): SellerAuctionDto => ({
    ...this.toPublicDto(row),
    cancellationReason: row.cancellationReason,
    winnerUserId: row.winnerUserId,
  });
}

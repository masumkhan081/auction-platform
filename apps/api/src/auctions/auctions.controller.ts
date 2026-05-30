import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { type z } from 'zod';
import {
  AuctionStatusSchema,
  CancelAuctionRequestSchema,
  CreateAuctionRequestSchema,
  PaginationQuerySchema,
  UpdateAuctionRequestSchema,
  UuidSchema,
  type AdminAuctionDto,
  type Paginated,
  type PublicAuctionDto,
  type SellerAuctionDto,
} from '@auction/shared';
import { ZodBody, ZodQuery } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/auth.types';
import { type AuctionLifecycleService } from './auction-lifecycle.service';
import { type AuctionsService } from './auctions.service';

const PublicListQuerySchema = PaginationQuerySchema.extend({
  productId: UuidSchema.optional(),
  status: AuctionStatusSchema.optional(),
});

@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctions: AuctionsService,
    private readonly lifecycle: AuctionLifecycleService,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  @Public()
  @Get()
  list(
    @ZodQuery(PublicListQuerySchema) query: z.infer<typeof PublicListQuerySchema>,
  ): Promise<Paginated<PublicAuctionDto>> {
    return this.auctions.listPublic(
      { page: query.page, pageSize: query.pageSize },
      {
        ...(query.productId !== undefined ? { productId: query.productId } : {}),
        ...(query.status !== undefined ? { statusIn: [query.status] } : {}),
      },
    );
  }

  @Public()
  @Get(':id')
  getPublic(@Param('id', new ParseUUIDPipe()) id: string): Promise<PublicAuctionDto> {
    return this.auctions.getPublicById(id);
  }

  // ─── Seller ──────────────────────────────────────────────────────────────

  @Roles('SELLER')
  @Get('me/list')
  listOwn(
    @CurrentUser() user: RequestUser,
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<SellerAuctionDto>> {
    return this.auctions.listOwn(user.id, query);
  }

  @Roles('SELLER')
  @Get('me/:id')
  getOwn(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SellerAuctionDto> {
    return this.auctions.getOwnById(user.id, id);
  }

  @Roles('SELLER')
  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @ZodBody(CreateAuctionRequestSchema) body: typeof CreateAuctionRequestSchema._type,
  ): Promise<SellerAuctionDto> {
    return this.auctions.create(user.id, body);
  }

  @Roles('SELLER')
  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(UpdateAuctionRequestSchema) body: typeof UpdateAuctionRequestSchema._type,
  ): Promise<SellerAuctionDto> {
    return this.auctions.update(user.id, id, body);
  }

  @Roles('SELLER')
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelOwn(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(CancelAuctionRequestSchema) body: typeof CancelAuctionRequestSchema._type,
  ): Promise<SellerAuctionDto> {
    return this.auctions.cancel(user.id, 'SELLER', id, body);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  @Roles('ADMIN')
  @Get('admin/:id')
  getAdmin(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminAuctionDto> {
    return this.auctions.getAdminById(id);
  }

  @Roles('ADMIN')
  @Post('admin/:id/force-start')
  @HttpCode(HttpStatus.OK)
  async forceStart(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ outcome: string }> {
    const result = await this.lifecycle.forceStart(id);
    return { outcome: result.outcome };
  }

  @Roles('ADMIN')
  @Post('admin/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelAdmin(
    @CurrentUser() admin: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(CancelAuctionRequestSchema) body: typeof CancelAuctionRequestSchema._type,
  ): Promise<AdminAuctionDto> {
    return this.auctions.cancel(admin.id, 'ADMIN', id, body);
  }
}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  PaginationQuerySchema,
  PlaceBidRequestSchema,
  type BidDto,
  type Paginated,
} from '@auction/shared';
import { ZodBody, ZodQuery } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/auth.types';
import { type BidsService } from './bids.service';

@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Roles('BIDDER')
  @Post('bids')
  @HttpCode(HttpStatus.CREATED)
  place(
    @CurrentUser() user: RequestUser,
    @ZodBody(PlaceBidRequestSchema) body: typeof PlaceBidRequestSchema._type,
  ): Promise<BidDto> {
    return this.bids.place({ ...body, bidderId: user.id });
  }

  @Public()
  @Get('auctions/:id/bids')
  listForAuction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<BidDto>> {
    return this.bids.listForAuction(id, query);
  }

  @Roles('BIDDER')
  @Get('bids/me')
  listOwn(
    @CurrentUser() user: RequestUser,
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<BidDto>> {
    return this.bids.listForBidder(user.id, query);
  }
}

import {
  Controller,
  Delete,
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
  CreateProductRequestSchema,
  PaginationQuerySchema,
  RejectProductRequestSchema,
  UpdateProductRequestSchema,
  UuidSchema,
  type AdminProductDto,
  type Paginated,
  type PublicProductDto,
  type SellerProductDto,
} from '@auction/shared';
import { ZodBody, ZodQuery } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/auth.types';
import { type ProductsService } from './products.service';

const PublicListQuerySchema = PaginationQuerySchema.extend({
  categoryId: UuidSchema.optional(),
});

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  @Public()
  @Get()
  list(
    @ZodQuery(PublicListQuerySchema) query: z.infer<typeof PublicListQuerySchema>,
  ): Promise<Paginated<PublicProductDto>> {
    return this.products.listPublic(
      { page: query.page, pageSize: query.pageSize },
      { ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}) },
    );
  }

  @Public()
  @Get(':id')
  getPublic(@Param('id', new ParseUUIDPipe()) id: string): Promise<PublicProductDto> {
    return this.products.getPublicById(id);
  }

  // ─── Seller-scoped ───────────────────────────────────────────────────────

  @Roles('SELLER')
  @Get('me/list')
  listOwn(
    @CurrentUser() user: RequestUser,
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<SellerProductDto>> {
    return this.products.listOwn(user.id, query);
  }

  @Roles('SELLER')
  @Get('me/:id')
  getOwn(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SellerProductDto> {
    return this.products.getOwnById(user.id, id);
  }

  @Roles('SELLER')
  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @ZodBody(CreateProductRequestSchema) body: typeof CreateProductRequestSchema._type,
  ): Promise<SellerProductDto> {
    return this.products.create(user.id, body);
  }

  @Roles('SELLER')
  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(UpdateProductRequestSchema) body: typeof UpdateProductRequestSchema._type,
  ): Promise<SellerProductDto> {
    return this.products.update(user.id, id, body);
  }

  @Roles('SELLER')
  @Post(':id/submit')
  submit(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SellerProductDto> {
    return this.products.submitForReview(user.id, id);
  }

  @Roles('SELLER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.products.archive(user.id, id);
  }

  // ─── Admin moderation ────────────────────────────────────────────────────

  @Roles('ADMIN')
  @Get('admin/pending')
  listPending(
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<AdminProductDto>> {
    return this.products.listPending(query);
  }

  @Roles('ADMIN')
  @Get('admin/:id')
  getAdmin(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminProductDto> {
    return this.products.getAdminById(id);
  }

  @Roles('ADMIN')
  @Post('admin/:id/approve')
  approve(
    @CurrentUser() admin: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminProductDto> {
    return this.products.approve(admin.id, id);
  }

  @Roles('ADMIN')
  @Post('admin/:id/reject')
  reject(
    @CurrentUser() admin: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(RejectProductRequestSchema) body: typeof RejectProductRequestSchema._type,
  ): Promise<AdminProductDto> {
    return this.products.reject(admin.id, id, body);
  }
}

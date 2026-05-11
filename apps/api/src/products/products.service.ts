import { Injectable } from '@nestjs/common';
import type {
  AdminProductDto,
  CreateProductRequest,
  Paginated,
  PaginationQuery,
  PublicProductDto,
  RejectProductRequest,
  SellerProductDto,
  UpdateProductRequest,
} from '@auction/shared';
import { AppException, compact, paginate } from '../common';
import { CategoriesRepository } from '../categories/categories.repository';
import { EnvService } from '../config/env.service';
import type { ProductRow } from '../database/schema';
import { assertSellerOwnsImages } from '../uploads/asset-ownership';
import {
  canSellerArchive,
  canSellerEdit,
  isPubliclyVisible,
  transition,
} from './product-state';
import { ProductsRepository } from './products.repository';

/**
 * All write paths flow through this service. Controllers never touch the
 * repository directly. Permissions are enforced inside each public method —
 * `assertSellerOwns` for seller-scoped, role-checked at the controller for
 * admin-scoped.
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly env: EnvService,
  ) {}

  // ─── Public reads ────────────────────────────────────────────────────────

  async listPublic(
    query: PaginationQuery,
    filters: { categoryId?: string },
  ): Promise<Paginated<PublicProductDto>> {
    return paginate({
      query,
      fetchTotal: () =>
        this.repo.total({
          ...(filters.categoryId !== undefined ? { categoryId: filters.categoryId } : {}),
          approvalIn: ['APPROVED'],
          lifecycleIn: ['LISTED', 'IN_AUCTION'],
        }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset, {
          ...(filters.categoryId !== undefined ? { categoryId: filters.categoryId } : {}),
          approvalIn: ['APPROVED'],
          lifecycleIn: ['LISTED', 'IN_AUCTION'],
        });
        return rows.map(this.toPublicDto);
      },
    });
  }

  async getPublicById(id: string): Promise<PublicProductDto> {
    const row = await this.repo.findById(id);
    if (!row || !isPubliclyVisible(row.approvalStatus, row.lifecycleStatus)) {
      throw AppException.notFound('product.not_found', 'Product not found');
    }
    return this.toPublicDto(row);
  }

  // ─── Seller-scoped ───────────────────────────────────────────────────────

  async listOwn(
    sellerId: string,
    query: PaginationQuery,
  ): Promise<Paginated<SellerProductDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.total({ sellerId }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset, { sellerId });
        return rows.map(this.toSellerDto);
      },
    });
  }

  async getOwnById(sellerId: string, id: string): Promise<SellerProductDto> {
    const row = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, row);
    return this.toSellerDto(row);
  }

  async create(sellerId: string, input: CreateProductRequest): Promise<SellerProductDto> {
    const category = await this.categories.findById(input.categoryId);
    if (!category) {
      throw AppException.unprocessable('product.category_not_found', 'Category does not exist');
    }
    assertSellerOwnsImages({
      folderRoot: this.env.config.CLOUDINARY_UPLOAD_FOLDER,
      sellerId,
      images: input.images,
    });
    const row = await this.repo.insert({
      sellerId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      images: input.images,
    });
    return this.toSellerDto(row);
  }

  async update(
    sellerId: string,
    id: string,
    patch: UpdateProductRequest,
  ): Promise<SellerProductDto> {
    const current = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, current);
    if (!canSellerEdit(current.lifecycleStatus)) {
      throw AppException.unprocessable(
        'product.not_editable',
        `Cannot edit a product in lifecycle ${current.lifecycleStatus}`,
      );
    }
    if (patch.categoryId) {
      const category = await this.categories.findById(patch.categoryId);
      if (!category) {
        throw AppException.unprocessable('product.category_not_found', 'Category does not exist');
      }
    }
    if (patch.images) {
      assertSellerOwnsImages({
        folderRoot: this.env.config.CLOUDINARY_UPLOAD_FOLDER,
        sellerId,
        images: patch.images,
      });
    }
    const updated = await this.repo.update(id, compact(patch));
    if (!updated) throw AppException.notFound('product.not_found', 'Product not found');
    return this.toSellerDto(updated);
  }

  async submitForReview(sellerId: string, id: string): Promise<SellerProductDto> {
    const current = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, current);
    const next = transition.submitForReview({
      approval: current.approvalStatus,
      lifecycle: current.lifecycleStatus,
    });
    const updated = await this.repo.update(id, this.transitionPatch(next, { reviewNoteReset: true }));
    if (!updated) throw AppException.notFound('product.not_found', 'Product not found');
    return this.toSellerDto(updated);
  }

  async archive(sellerId: string, id: string): Promise<void> {
    const current = await this.repo.findById(id);
    this.assertSellerOwns(sellerId, current);
    if (!canSellerArchive(current.lifecycleStatus)) {
      throw AppException.unprocessable(
        'product.not_archivable',
        `Cannot archive a product in lifecycle ${current.lifecycleStatus}`,
      );
    }
    await this.repo.softDelete(id);
  }

  // ─── Admin moderation ────────────────────────────────────────────────────

  async listPending(query: PaginationQuery): Promise<Paginated<AdminProductDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.total({ approvalIn: ['PENDING'] }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset, { approvalIn: ['PENDING'] });
        return rows.map(this.toAdminDto);
      },
    });
  }

  async getAdminById(id: string): Promise<AdminProductDto> {
    const row = await this.repo.findById(id, { includeDeleted: true });
    if (!row) throw AppException.notFound('product.not_found', 'Product not found');
    return this.toAdminDto(row);
  }

  async approve(adminId: string, id: string): Promise<AdminProductDto> {
    const current = await this.repo.findById(id);
    if (!current) throw AppException.notFound('product.not_found', 'Product not found');
    const next = transition.approve({ approval: current.approvalStatus });
    const updated = await this.repo.update(id, {
      ...this.transitionPatch(next),
      reviewNote: null,
      reviewedById: adminId,
      reviewedAt: new Date(),
    });
    if (!updated) throw AppException.notFound('product.not_found', 'Product not found');
    return this.toAdminDto(updated);
  }

  async reject(
    adminId: string,
    id: string,
    input: RejectProductRequest,
  ): Promise<AdminProductDto> {
    const current = await this.repo.findById(id);
    if (!current) throw AppException.notFound('product.not_found', 'Product not found');
    const next = transition.reject({ approval: current.approvalStatus });
    const updated = await this.repo.update(id, {
      ...this.transitionPatch(next),
      reviewNote: input.reviewNote,
      reviewedById: adminId,
      reviewedAt: new Date(),
    });
    if (!updated) throw AppException.notFound('product.not_found', 'Product not found');
    return this.toAdminDto(updated);
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private transitionPatch(
    next: { approval?: ProductRow['approvalStatus']; lifecycle?: ProductRow['lifecycleStatus'] },
    opts: { reviewNoteReset?: boolean } = {},
  ): Partial<{
    approvalStatus: ProductRow['approvalStatus'];
    lifecycleStatus: ProductRow['lifecycleStatus'];
    reviewNote: string | null;
  }> {
    const patch: Partial<{
      approvalStatus: ProductRow['approvalStatus'];
      lifecycleStatus: ProductRow['lifecycleStatus'];
      reviewNote: string | null;
    }> = {};
    if (next.approval) patch.approvalStatus = next.approval;
    if (next.lifecycle) patch.lifecycleStatus = next.lifecycle;
    if (opts.reviewNoteReset) patch.reviewNote = null;
    return patch;
  }

  private assertSellerOwns(
    sellerId: string,
    row: ProductRow | null,
  ): asserts row is ProductRow {
    if (!row) throw AppException.notFound('product.not_found', 'Product not found');
    if (row.sellerId !== sellerId) {
      throw AppException.forbidden('product.not_owner', 'Not your product');
    }
  }

  // ─── DTO mappers ─────────────────────────────────────────────────────────

  private toPublicDto = (row: ProductRow): PublicProductDto => ({
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    sellerId: row.sellerId,
    images: row.images,
    lifecycleStatus: row.lifecycleStatus,
    createdAt: row.createdAt.toISOString(),
  });

  private toSellerDto = (row: ProductRow): SellerProductDto => ({
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    sellerId: row.sellerId,
    images: row.images,
    approvalStatus: row.approvalStatus,
    lifecycleStatus: row.lifecycleStatus,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  private toAdminDto = (row: ProductRow): AdminProductDto => ({
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    sellerId: row.sellerId,
    images: row.images,
    approvalStatus: row.approvalStatus,
    lifecycleStatus: row.lifecycleStatus,
    reviewNote: row.reviewNote,
    reviewedById: row.reviewedById,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

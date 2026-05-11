import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { ProductApprovalStatus, ProductLifecycleStatus } from '@auction/shared';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  products,
  type NewProductRow,
  type ProductRow,
} from '../database/schema';

type ListFilters = {
  sellerId?: string;
  categoryId?: string;
  approvalIn?: ProductApprovalStatus[];
  lifecycleIn?: ProductLifecycleStatus[];
  includeDeleted?: boolean;
};

@Injectable()
export class ProductsRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async findById(id: string, opts: { includeDeleted?: boolean } = {}): Promise<ProductRow | null> {
    const row = await this.db.query.products.findFirst({
      where: opts.includeDeleted
        ? eq(products.id, id)
        : and(eq(products.id, id), isNull(products.deletedAt)),
    });
    return row ?? null;
  }

  list(limit: number, offset: number, filters: ListFilters = {}): Promise<ProductRow[]> {
    return this.db
      .select()
      .from(products)
      .where(this.buildWhere(filters))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async total(filters: ListFilters = {}): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(products)
      .where(this.buildWhere(filters));
    return row?.value ?? 0;
  }

  async insert(values: NewProductRow): Promise<ProductRow> {
    const [row] = await this.db.insert(products).values(values).returning();
    if (!row) throw new Error('Product insert returned no row');
    return row;
  }

  async update(id: string, patch: Partial<NewProductRow>): Promise<ProductRow | null> {
    const [row] = await this.db
      .update(products)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const [row] = await this.db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning();
    return Boolean(row);
  }

  private buildWhere(filters: ListFilters) {
    const conds = [];
    if (!filters.includeDeleted) conds.push(isNull(products.deletedAt));
    if (filters.sellerId) conds.push(eq(products.sellerId, filters.sellerId));
    if (filters.categoryId) conds.push(eq(products.categoryId, filters.categoryId));
    if (filters.approvalIn?.length) {
      conds.push(inArray(products.approvalStatus, filters.approvalIn));
    }
    if (filters.lifecycleIn?.length) {
      conds.push(inArray(products.lifecycleStatus, filters.lifecycleIn));
    }
    return conds.length === 0 ? undefined : and(...conds);
  }
}

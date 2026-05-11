import { Injectable } from '@nestjs/common';
import { asc, count, eq } from 'drizzle-orm';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  categories,
  type CategoryRow,
  type NewCategoryRow,
} from '../database/schema';

@Injectable()
export class CategoriesRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<CategoryRow | null> {
    const row = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<CategoryRow | null> {
    const row = await this.db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    return row ?? null;
  }

  list(limit: number, offset: number): Promise<CategoryRow[]> {
    return this.db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))
      .limit(limit)
      .offset(offset);
  }

  async total(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(categories);
    return row?.value ?? 0;
  }

  async insert(values: NewCategoryRow): Promise<CategoryRow> {
    const [row] = await this.db.insert(categories).values(values).returning();
    if (!row) throw new Error('Category insert returned no row');
    return row;
  }

  async update(id: string, patch: Partial<NewCategoryRow>): Promise<CategoryRow | null> {
    const [row] = await this.db
      .update(categories)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await this.db.delete(categories).where(eq(categories.id, id)).returning();
    return Boolean(row);
  }
}

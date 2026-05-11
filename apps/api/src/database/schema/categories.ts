import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdAt, idPrimaryKey, updatedAt } from './_helpers';

export const categories = pgTable(
  'categories',
  {
    id: idPrimaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    categoriesNameUq: uniqueIndex('categories_name_uq').on(t.name),
    categoriesSlugUq: uniqueIndex('categories_slug_uq').on(t.slug),
  }),
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

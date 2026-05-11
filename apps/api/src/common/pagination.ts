import type { Paginated, PaginationQuery } from '@auction/shared';

/**
 * Composes a paginated result from independent count + items queries. Every
 * list endpoint uses this so total/page/totalPages math is identical
 * everywhere.
 */
export async function paginate<TItem>(args: {
  query: PaginationQuery;
  fetchTotal: () => Promise<number>;
  fetchItems: (limit: number, offset: number) => Promise<TItem[]>;
}): Promise<Paginated<TItem>> {
  const { page, pageSize } = args.query;
  const offset = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    args.fetchItems(pageSize, offset),
    args.fetchTotal(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return { items, total, page, pageSize, totalPages };
}

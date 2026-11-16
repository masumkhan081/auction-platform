import { Injectable } from '@nestjs/common';
import type {
  CategoryDto,
  CreateCategoryRequest,
  Paginated,
  PaginationQuery,
  UpdateCategoryRequest,
} from '@auction/shared';
import { AppException, compact, paginate } from '../common';
import type { CategoryRow } from '../database/schema';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async list(query: PaginationQuery): Promise<Paginated<CategoryDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.total(),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(limit, offset);
        return rows.map(this.toDto);
      },
    });
  }

  async getById(id: string): Promise<CategoryDto> {
    const row = await this.repo.findById(id);
    if (!row) throw AppException.notFound('category.not_found', 'Category not found');
    return this.toDto(row);
  }

  async create(input: CreateCategoryRequest): Promise<CategoryDto> {
    const existingSlug = await this.repo.findBySlug(input.slug);
    if (existingSlug) {
      throw AppException.conflict('category.slug_taken', 'A category with that slug already exists');
    }
    const row = await this.repo.insert({
      name: input.name,
      slug: input.slug,
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
    return this.toDto(row);
  }

  async update(id: string, patch: UpdateCategoryRequest): Promise<CategoryDto> {
    if (patch.slug) {
      const conflict = await this.repo.findBySlug(patch.slug);
      if (conflict && conflict.id !== id) {
        throw AppException.conflict('category.slug_taken', 'A category with that slug already exists');
      }
    }
    const row = await this.repo.update(id, compact(patch));
    if (!row) throw AppException.notFound('category.not_found', 'Category not found');
    return this.toDto(row);
  }

  async delete(id: string): Promise<void> {
    const ok = await this.repo.delete(id);
    if (!ok) throw AppException.notFound('category.not_found', 'Category not found');
  }

  private toDto(row: CategoryRow): CategoryDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

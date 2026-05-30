import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  CreateCategoryRequestSchema,
  PaginationQuerySchema,
  UpdateCategoryRequestSchema,
  type CategoryDto,
  type Paginated,
} from '@auction/shared';
import { ZodBody, ZodQuery } from '../common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  list(
    @ZodQuery(PaginationQuerySchema) query: typeof PaginationQuerySchema._type,
  ): Promise<Paginated<CategoryDto>> {
    return this.categories.list(query);
  }

  @Public()
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<CategoryDto> {
    return this.categories.getById(id);
  }

  @Roles('ADMIN')
  @Post()
  create(
    @ZodBody(CreateCategoryRequestSchema) body: typeof CreateCategoryRequestSchema._type,
  ): Promise<CategoryDto> {
    return this.categories.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ZodBody(UpdateCategoryRequestSchema) body: typeof UpdateCategoryRequestSchema._type,
  ): Promise<CategoryDto> {
    return this.categories.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.categories.delete(id);
  }
}


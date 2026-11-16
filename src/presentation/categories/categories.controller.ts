import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateCategoryUseCase } from '../../application/master-data/create-category.use-case';
import { GetCategoryUseCase } from '../../application/master-data/get-category.use-case';
import { ListCategoriesUseCase } from '../../application/master-data/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/master-data/update-category.use-case';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
  ) {}

  @Get()
  @RequirePermissions('categories:read')
  list(@Query() query: ListQueryDto) {
    return this.listCategories.execute(query);
  }

  @Post()
  @RequirePermissions('categories:write')
  create(@Body() dto: CreateCategoryDto) {
    return this.createCategory.execute(dto);
  }

  @Get(':id')
  @RequirePermissions('categories:read')
  get(@Param('id') id: string) {
    return this.getCategory.execute(id);
  }

  @Patch(':id')
  @RequirePermissions('categories:write')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.updateCategory.execute({ id, ...dto });
  }
}

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
import { CreateProductUseCase } from '../../application/master-data/create-product.use-case';
import { GetProductUseCase } from '../../application/master-data/get-product.use-case';
import { ListProductsUseCase } from '../../application/master-data/list-products.use-case';
import { UpdateProductUseCase } from '../../application/master-data/update-product.use-case';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
  ) {}

  @Get()
  @RequirePermissions('products:read')
  list(@Query() query: ProductListQueryDto) {
    return this.listProducts.execute(query);
  }

  @Post()
  @RequirePermissions('products:write')
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Get(':id')
  @RequirePermissions('products:read')
  get(@Param('id') id: string) {
    return this.getProduct.execute(id);
  }

  @Patch(':id')
  @RequirePermissions('products:write')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute({ id, ...dto });
  }
}

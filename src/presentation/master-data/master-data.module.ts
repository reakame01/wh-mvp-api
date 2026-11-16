import { Module } from '@nestjs/common';
import { CreateCategoryUseCase } from '../../application/master-data/create-category.use-case';
import { CreateLocationUseCase } from '../../application/master-data/create-location.use-case';
import { CreateProductUseCase } from '../../application/master-data/create-product.use-case';
import { CreateSupplierUseCase } from '../../application/master-data/create-supplier.use-case';
import { CreateWarehouseUseCase } from '../../application/master-data/create-warehouse.use-case';
import { GetCategoryUseCase } from '../../application/master-data/get-category.use-case';
import { GetLocationUseCase } from '../../application/master-data/get-location.use-case';
import { GetProductUseCase } from '../../application/master-data/get-product.use-case';
import { GetSupplierUseCase } from '../../application/master-data/get-supplier.use-case';
import { GetWarehouseUseCase } from '../../application/master-data/get-warehouse.use-case';
import { ListCategoriesUseCase } from '../../application/master-data/list-categories.use-case';
import { ListLocationsUseCase } from '../../application/master-data/list-locations.use-case';
import { ListProductsUseCase } from '../../application/master-data/list-products.use-case';
import { ListSuppliersUseCase } from '../../application/master-data/list-suppliers.use-case';
import { ListWarehousesUseCase } from '../../application/master-data/list-warehouses.use-case';
import { CATEGORY_REPOSITORY } from '../../application/master-data/ports/category.repository.port';
import { LOCATION_REPOSITORY } from '../../application/master-data/ports/location.repository.port';
import { PRODUCT_REPOSITORY } from '../../application/master-data/ports/product.repository.port';
import { SUPPLIER_REPOSITORY } from '../../application/master-data/ports/supplier.repository.port';
import { WAREHOUSE_REPOSITORY } from '../../application/master-data/ports/warehouse.repository.port';
import { UpdateCategoryUseCase } from '../../application/master-data/update-category.use-case';
import { UpdateLocationUseCase } from '../../application/master-data/update-location.use-case';
import { UpdateProductUseCase } from '../../application/master-data/update-product.use-case';
import { UpdateSupplierUseCase } from '../../application/master-data/update-supplier.use-case';
import { UpdateWarehouseUseCase } from '../../application/master-data/update-warehouse.use-case';
import { PrismaCategoryRepository } from '../../infrastructure/master-data/prisma-category.repository';
import { PrismaLocationRepository } from '../../infrastructure/master-data/prisma-location.repository';
import { PrismaProductRepository } from '../../infrastructure/master-data/prisma-product.repository';
import { PrismaSupplierRepository } from '../../infrastructure/master-data/prisma-supplier.repository';
import { PrismaWarehouseRepository } from '../../infrastructure/master-data/prisma-warehouse.repository';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from '../categories/categories.controller';
import { LocationsController } from '../locations/locations.controller';
import { ProductsController } from '../products/products.controller';
import { SuppliersController } from '../suppliers/suppliers.controller';
import { WarehousesController } from '../warehouses/warehouses.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    WarehousesController,
    LocationsController,
    CategoriesController,
    SuppliersController,
    ProductsController,
  ],
  providers: [
    CreateWarehouseUseCase,
    ListWarehousesUseCase,
    GetWarehouseUseCase,
    UpdateWarehouseUseCase,
    CreateLocationUseCase,
    ListLocationsUseCase,
    GetLocationUseCase,
    UpdateLocationUseCase,
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    CreateSupplierUseCase,
    ListSuppliersUseCase,
    GetSupplierUseCase,
    UpdateSupplierUseCase,
    CreateProductUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    UpdateProductUseCase,
    { provide: WAREHOUSE_REPOSITORY, useClass: PrismaWarehouseRepository },
    { provide: LOCATION_REPOSITORY, useClass: PrismaLocationRepository },
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    { provide: SUPPLIER_REPOSITORY, useClass: PrismaSupplierRepository },
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
})
export class MasterDataModule {}

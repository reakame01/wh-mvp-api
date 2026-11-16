import { Module } from '@nestjs/common';
import { CreateLocationUseCase } from '../../application/master-data/create-location.use-case';
import { CreateWarehouseUseCase } from '../../application/master-data/create-warehouse.use-case';
import { GetLocationUseCase } from '../../application/master-data/get-location.use-case';
import { GetWarehouseUseCase } from '../../application/master-data/get-warehouse.use-case';
import { ListLocationsUseCase } from '../../application/master-data/list-locations.use-case';
import { ListWarehousesUseCase } from '../../application/master-data/list-warehouses.use-case';
import { LOCATION_REPOSITORY } from '../../application/master-data/ports/location.repository.port';
import { WAREHOUSE_REPOSITORY } from '../../application/master-data/ports/warehouse.repository.port';
import { UpdateLocationUseCase } from '../../application/master-data/update-location.use-case';
import { UpdateWarehouseUseCase } from '../../application/master-data/update-warehouse.use-case';
import { PrismaLocationRepository } from '../../infrastructure/master-data/prisma-location.repository';
import { PrismaWarehouseRepository } from '../../infrastructure/master-data/prisma-warehouse.repository';
import { AuthModule } from '../auth/auth.module';
import { LocationsController } from '../locations/locations.controller';
import { WarehousesController } from '../warehouses/warehouses.controller';

@Module({
  imports: [AuthModule],
  controllers: [WarehousesController, LocationsController],
  providers: [
    CreateWarehouseUseCase,
    ListWarehousesUseCase,
    GetWarehouseUseCase,
    UpdateWarehouseUseCase,
    CreateLocationUseCase,
    ListLocationsUseCase,
    GetLocationUseCase,
    UpdateLocationUseCase,
    { provide: WAREHOUSE_REPOSITORY, useClass: PrismaWarehouseRepository },
    { provide: LOCATION_REPOSITORY, useClass: PrismaLocationRepository },
  ],
})
export class MasterDataModule {}

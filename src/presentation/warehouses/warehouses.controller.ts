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
import { CreateWarehouseUseCase } from '../../application/master-data/create-warehouse.use-case';
import { GetWarehouseUseCase } from '../../application/master-data/get-warehouse.use-case';
import { ListLocationsUseCase } from '../../application/master-data/list-locations.use-case';
import { ListWarehousesUseCase } from '../../application/master-data/list-warehouses.use-case';
import { UpdateWarehouseUseCase } from '../../application/master-data/update-warehouse.use-case';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly listWarehouses: ListWarehousesUseCase,
    private readonly getWarehouse: GetWarehouseUseCase,
    private readonly updateWarehouse: UpdateWarehouseUseCase,
    private readonly listLocations: ListLocationsUseCase,
  ) {}

  @Get()
  @RequirePermissions('warehouses:read')
  list(@Query() query: ListQueryDto) {
    return this.listWarehouses.execute(query);
  }

  @Post()
  @RequirePermissions('warehouses:write')
  create(@Body() dto: CreateWarehouseDto) {
    return this.createWarehouse.execute(dto);
  }

  @Get(':warehouseId/locations')
  @RequirePermissions('locations:read')
  async listLocationsForWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query() query: ListQueryDto,
  ) {
    await this.getWarehouse.execute(warehouseId);
    return this.listLocations.execute({ ...query, warehouseId });
  }

  @Get(':id')
  @RequirePermissions('warehouses:read')
  get(@Param('id') id: string) {
    return this.getWarehouse.execute(id);
  }

  @Patch(':id')
  @RequirePermissions('warehouses:write')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.updateWarehouse.execute({ id, ...dto });
  }
}

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
import { CreateLocationUseCase } from '../../application/master-data/create-location.use-case';
import { GetLocationUseCase } from '../../application/master-data/get-location.use-case';
import { ListLocationsUseCase } from '../../application/master-data/list-locations.use-case';
import { UpdateLocationUseCase } from '../../application/master-data/update-location.use-case';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsQueryDto } from './dto/list-locations-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationsController {
  constructor(
    private readonly createLocation: CreateLocationUseCase,
    private readonly listLocations: ListLocationsUseCase,
    private readonly getLocation: GetLocationUseCase,
    private readonly updateLocation: UpdateLocationUseCase,
  ) {}

  @Get()
  @RequirePermissions('locations:read')
  list(@Query() query: ListLocationsQueryDto) {
    return this.listLocations.execute(query);
  }

  @Post()
  @RequirePermissions('locations:write')
  create(@Body() dto: CreateLocationDto) {
    return this.createLocation.execute(dto);
  }

  @Get(':id')
  @RequirePermissions('locations:read')
  get(@Param('id') id: string) {
    return this.getLocation.execute(id);
  }

  @Patch(':id')
  @RequirePermissions('locations:write')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.updateLocation.execute({ id, ...dto });
  }
}

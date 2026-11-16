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
import { CreateSupplierUseCase } from '../../application/master-data/create-supplier.use-case';
import { GetSupplierUseCase } from '../../application/master-data/get-supplier.use-case';
import { ListSuppliersUseCase } from '../../application/master-data/list-suppliers.use-case';
import { UpdateSupplierUseCase } from '../../application/master-data/update-supplier.use-case';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(
    private readonly createSupplier: CreateSupplierUseCase,
    private readonly listSuppliers: ListSuppliersUseCase,
    private readonly getSupplier: GetSupplierUseCase,
    private readonly updateSupplier: UpdateSupplierUseCase,
  ) {}

  @Get()
  @RequirePermissions('suppliers:read')
  list(@Query() query: ListQueryDto) {
    return this.listSuppliers.execute(query);
  }

  @Post()
  @RequirePermissions('suppliers:write')
  create(@Body() dto: CreateSupplierDto) {
    return this.createSupplier.execute(dto);
  }

  @Get(':id')
  @RequirePermissions('suppliers:read')
  get(@Param('id') id: string) {
    return this.getSupplier.execute(id);
  }

  @Patch(':id')
  @RequirePermissions('suppliers:write')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.updateSupplier.execute({ id, ...dto });
  }
}

import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListLocationsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

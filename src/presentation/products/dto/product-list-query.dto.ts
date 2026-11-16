import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ProductListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}

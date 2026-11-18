import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ADJUSTMENT_REASON_CODES } from '../../../domain/stock/adjustment-reason';

export class CreateAdjustmentDto {
  @IsString()
  @MinLength(1)
  productId!: string;

  @IsString()
  @MinLength(1)
  locationId!: string;

  /** Decimal string — never JSON number. */
  @IsString()
  @MinLength(1)
  quantityDelta!: string;

  @IsString()
  @IsIn([...ADJUSTMENT_REASON_CODES])
  reasonCode!: (typeof ADJUSTMENT_REASON_CODES)[number];

  @IsOptional()
  @IsString()
  note?: string | null;
}

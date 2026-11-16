import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  categoryId!: string;

  @IsString()
  @MinLength(1)
  unit!: string;

  /** Coerce number→string; domain validates non-negative decimal. */
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return value;
  })
  @IsString()
  @IsNotEmpty()
  reorderPoint!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

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

  /** Send as JSON string (not number) to avoid float precision loss. */
  @IsString()
  @IsNotEmpty()
  reorderPoint!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

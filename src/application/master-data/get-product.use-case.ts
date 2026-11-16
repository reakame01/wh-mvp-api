import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from './ports/product.repository.port';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
  ) {}

  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  }
}

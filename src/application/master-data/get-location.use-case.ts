import { Inject, Injectable } from '@nestjs/common';
import { LocationNotFoundError } from '../../domain/master-data/master-data.errors';
import {
  LOCATION_REPOSITORY,
  type LocationRepositoryPort,
} from './ports/location.repository.port';

@Injectable()
export class GetLocationUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locations: LocationRepositoryPort,
  ) {}

  async execute(id: string) {
    const location = await this.locations.findById(id);
    if (!location) {
      throw new LocationNotFoundError();
    }
    return location;
  }
}

import { Controller, Get } from '@nestjs/common';
import {
  HealthService,
  HealthStatus,
} from '../../application/health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealth();
  }
}

import { HealthService } from './health.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('HealthService', () => {
  it('returns ok when database is healthy', async () => {
    const prisma = {
      isHealthy: jest.fn().mockResolvedValue(true),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    const actual = await service.getHealth();

    expect(actual.status).toBe('ok');
    expect(actual.database).toBe('up');
    expect(actual.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns degraded when database is down', async () => {
    const prisma = {
      isHealthy: jest.fn().mockResolvedValue(false),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    const actual = await service.getHealth();

    expect(actual.status).toBe('degraded');
    expect(actual.database).toBe('down');
  });
});

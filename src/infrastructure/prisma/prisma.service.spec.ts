import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('isHealthy returns true when query succeeds', async () => {
    const service = Object.create(PrismaService.prototype) as PrismaService;
    service.$queryRaw = jest.fn().mockResolvedValue(1);
    await expect(service.isHealthy()).resolves.toBe(true);
  });

  it('isHealthy returns false when query fails', async () => {
    const service = Object.create(PrismaService.prototype) as PrismaService;
    service.$queryRaw = jest.fn().mockRejectedValue(new Error('down'));
    await expect(service.isHealthy()).resolves.toBe(false);
  });
});

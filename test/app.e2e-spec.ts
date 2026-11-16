import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { HealthStatus } from './../src/application/health/health.service';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: (): Promise<void> => Promise.resolve(),
        onModuleDestroy: (): Promise<void> => Promise.resolve(),
        isHealthy: (): Promise<boolean> => Promise.resolve(true),
        $connect: (): Promise<void> => Promise.resolve(),
        $disconnect: (): Promise<void> => Promise.resolve(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as HealthStatus;
    expect(body.status).toBe('ok');
    expect(body.database).toBe('up');
  });

  afterEach(async () => {
    await app.close();
  });
});

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './presentation/common/filters/auth-exception.filter';
import { MasterDataExceptionFilter } from './presentation/common/filters/master-data-exception.filter';
import { PrismaExceptionFilter } from './presentation/common/filters/prisma-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new AuthExceptionFilter(),
    new MasterDataExceptionFilter(),
    new PrismaExceptionFilter(),
  );
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();

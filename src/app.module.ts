import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './presentation/auth/auth.module';
import { HealthModule } from './presentation/health/health.module';
import { MasterDataModule } from './presentation/master-data/master-data.module';
import { StockModule } from './presentation/stock/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MasterDataModule,
    StockModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttachmentsModule } from './attachments/attachments.module.js';
import { ExcursionsModule } from './excursions/excursions.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TouristsModule } from './tourists/tourists.module.js';
import { ToursModule } from './tours/tours.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ToursModule,
    TouristsModule,
    ExcursionsModule,
    AttachmentsModule,
  ],
})
export class AppModule {}

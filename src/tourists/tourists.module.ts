import { Module } from '@nestjs/common';
import { TouristsController } from './tourists.controller.js';
import { TouristsService } from './tourists.service.js';

@Module({
  controllers: [TouristsController],
  providers: [TouristsService],
  exports: [TouristsService],
})
export class TouristsModule {}

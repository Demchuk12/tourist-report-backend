import { Module } from '@nestjs/common';
import { ExcursionsController } from './excursions.controller.js';
import { ExcursionsService } from './excursions.service.js';

@Module({
  controllers: [ExcursionsController],
  providers: [ExcursionsService],
  exports: [ExcursionsService],
})
export class ExcursionsModule {}

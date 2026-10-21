import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursController } from './tours.controller.js';
import { ToursService } from './tours.service.js';
import { Tour } from './tour.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tour])], // Registers the Tour entity repository
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService],
})
export class ToursModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DutiesController } from './duties.controller';
import { DutiesService } from './duties.service';
import { DutiesEntity } from './entities/duties.entuty';

@Module({
  imports: [TypeOrmModule.forFeature([DutiesEntity])],
  controllers: [DutiesController],
  providers: [DutiesService],
})
export class DutiesModule {}

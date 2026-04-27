import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { DatabaseModule } from '../database/database.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [DatabaseModule, SchedulerModule],
  controllers: [SchedulesController],
})
export class SchedulesModule {}

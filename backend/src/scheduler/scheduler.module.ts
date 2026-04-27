import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JobsModule } from '../jobs/jobs.module';
import { ReportsModule } from '../reports/reports.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [JobsModule, ReportsModule, EmailModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}

import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AggregationService } from './aggregation.service';
import { PowerBiModule } from '../powerbi/powerbi.module';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [PowerBiModule, AiModule, JobsModule, UploadsModule],
  controllers: [ReportsController],
  providers: [ReportsService, AggregationService],
  exports: [ReportsService, AggregationService],
})
export class ReportsModule {}

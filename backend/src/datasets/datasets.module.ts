import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { PowerBiModule } from '../powerbi/powerbi.module';

@Module({
  imports: [PowerBiModule],
  controllers: [DatasetsController],
})
export class DatasetsModule {}

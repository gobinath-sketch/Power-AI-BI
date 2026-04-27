import { Module } from '@nestjs/common';
import { PowerBiService } from './powerbi.service';
import { PowerBiController } from './powerbi.controller';

@Module({
  controllers: [PowerBiController],
  providers: [PowerBiService],
  exports: [PowerBiService],
})
export class PowerBiModule {}

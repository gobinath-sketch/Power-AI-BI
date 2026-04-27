import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PowerBiService } from '../powerbi/powerbi.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

/** REST paths aligned with product spec: /api/datasets/... */
@Controller('datasets')
@UseGuards(SupabaseAuthGuard)
export class DatasetsController {
  constructor(private readonly pbi: PowerBiService) {}

  @Get()
  list(@Query('groupId') groupId?: string) {
    return this.pbi.listDatasets(groupId);
  }

  @Get(':datasetId/schema')
  schema(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.pbi.getTables(datasetId, groupId);
  }

  @Get(':datasetId/refresh-status')
  refreshStatus(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.pbi.getLatestRefreshStatus(datasetId, groupId);
  }

  @Post(':datasetId/refresh')
  async refresh(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    await this.pbi.triggerRefresh(datasetId, groupId);
    return { ok: true, message: 'Refresh requested' };
  }
}

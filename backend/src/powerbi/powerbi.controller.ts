import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PowerBiService } from './powerbi.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@Controller('powerbi')
@UseGuards(SupabaseAuthGuard)
export class PowerBiController {
  constructor(private readonly pbi: PowerBiService) {}

  @Get('workspaces')
  listWorkspaces() {
    return this.pbi.listWorkspaces();
  }

  @Get('datasets')
  listDatasets(@Query('groupId') groupId?: string) {
    return this.pbi.listDatasets(groupId);
  }

  @Get('datasets/:datasetId/tables')
  getTables(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.pbi.getTables(datasetId, groupId);
  }

  @Get('datasets/:datasetId/refresh-status')
  async refreshStatus(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.pbi.getLatestRefreshStatus(datasetId, groupId);
  }

  @Post('datasets/:datasetId/refresh')
  async triggerRefresh(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    await this.pbi.triggerRefresh(datasetId, groupId);
    return { ok: true, message: 'Refresh requested' };
  }
}

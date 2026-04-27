import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportsService } from './reports.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JobsService } from '../jobs/jobs.service';
import { Response } from 'express';

class GenerateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  datasetId!: string;

  @IsOptional()
  @IsString()
  datasetName?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsBoolean()
  waitForRefresh?: boolean;
}

class GenerateUploadDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsOptional()
  @IsString()
  sheetName?: string;
}

@Controller('reports')
@UseGuards(SupabaseAuthGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly jobs: JobsService,
  ) {}

  @Post('generate')
  generate(
    @CurrentUser() user: { id: string },
    @Body() body: GenerateDto,
  ) {
    return this.reports.generateReport(user.id, body);
  }

  @Post('generate-upload')
  generateUpload(
    @CurrentUser() user: { id: string },
    @Body() body: GenerateUploadDto,
  ) {
    return this.reports.generateFromUpload(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.reports.listReports(user.id);
  }

  @Get(':id')
  one(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.reports.getReport(user.id, id);
  }

  @Get(':id/html')
  async html(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filename, html } = await this.reports.exportHtml(user.id, id);
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    });
    return new StreamableFile(Buffer.from(html, 'utf-8'));
  }

  @Post(':id/pdf')
  async pdf(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.reports.getReport(user.id, id);
    return this.jobs.enqueuePdfJob(user.id, id);
  }
}

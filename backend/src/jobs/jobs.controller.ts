import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { JobsService } from './jobs.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('jobs')
@UseGuards(SupabaseAuthGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get(':id')
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.jobs.getJob(user.id, id);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const job = await this.jobs.getJob(user.id, id);
    if (!job || job.status !== 'completed') {
      throw new NotFoundException('PDF not ready');
    }
    const path = this.jobs.pdfPathFor(id);
    if (!existsSync(path)) throw new NotFoundException('File missing');
    const stream = createReadStream(path);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
    });
    return new StreamableFile(stream);
  }
}

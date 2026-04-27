import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from '../database/database.service';
import { PdfService } from '../pdf/pdf.service';
import type { ReportPayload } from '../reports/aggregation.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly pdf: PdfService,
  ) {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async enqueuePdfJob(userId: string, reportId: string) {
    const { data, error } = await this.db.client
      .from('jobs')
      .insert({
        user_id: userId,
        type: 'pdf',
        status: 'pending',
        report_id: reportId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { jobId: data.id };
  }

  /** Called by scheduler — process pending PDF jobs */
  async processPdfJobs(limit = 3) {
    const { data: jobs } = await this.db.client
      .from('jobs')
      .select('*')
      .eq('type', 'pdf')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    for (const job of jobs ?? []) {
      await this.db.client
        .from('jobs')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      try {
        const { data: report } = await this.db.client
          .from('reports')
          .select('*')
          .eq('id', job.report_id)
          .eq('user_id', job.user_id)
          .single();
        if (!report) throw new NotFoundException('report');
        const payload = report.payload as ReportPayload;
        const buf = await this.pdf.renderReportPdf(payload, report.title);
        const fname = `${job.id}.pdf`;
        const fpath = join(UPLOAD_DIR, fname);
        await new Promise<void>((resolve, reject) => {
          const ws = createWriteStream(fpath);
          ws.on('finish', () => resolve());
          ws.on('error', reject);
          ws.end(buf);
        });
        await this.db.client
          .from('jobs')
          .update({
            status: 'completed',
            result: { path: fname, bytes: buf.length },
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      } catch (e) {
        this.logger.error(`PDF job ${job.id}`, e);
        await this.db.client
          .from('jobs')
          .update({
            status: 'failed',
            error: String(e),
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }
    }
  }

  async getJob(userId: string, jobId: string) {
    const { data } = await this.db.client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    return data;
  }

  pdfPathFor(jobId: string): string {
    return join(UPLOAD_DIR, `${jobId}.pdf`);
  }
}

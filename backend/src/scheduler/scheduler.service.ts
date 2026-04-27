import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { JobsService } from '../jobs/jobs.service';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jobs: JobsService,
    private readonly reports: ReportsService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  @Cron('*/10 * * * * *')
  async processPdfQueue() {
    try {
      await this.jobs.processPdfJobs(5);
    } catch (e) {
      this.logger.warn(`PDF queue: ${e}`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async runDueSchedules() {
    const now = new Date().toISOString();
    const { data: due } = await this.db.client
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', now)
      .limit(20);
    for (const s of due ?? []) {
      try {
        const title = s.title ?? `Scheduled — ${s.dataset_name ?? s.dataset_id}`;
        const report = await this.reports.generateReport(s.user_id, {
          title,
          datasetId: s.dataset_id,
          datasetName: s.dataset_name ?? undefined,
          groupId: s.group_id,
          waitForRefresh: false,
        });
        const payload = report.payload as {
          kpis?: { label: string; value: string | number }[];
        };
        const kpis = payload?.kpis ?? [];
        const summary = kpis
          .slice(0, 4)
          .map((k) => `<li><strong>${k.label}</strong>: ${k.value}</li>`)
          .join('');
        const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
        const reportUrl = `${frontend}/reports/${report.id}`;
        await this.email.sendReportEmail({
          to: s.recipient_email,
          subject: `Scheduled report: ${title}`,
          reportTitle: title,
          summaryHtml: `<ul>${summary}</ul>`,
          reportUrl,
        });
        await this.db.client.from('schedule_runs').insert({
          schedule_id: s.id,
          status: 'ok',
          report_id: report.id,
          message: 'sent',
        });
        const next = this.computeNextRun(
          s.frequency,
          s.hour_utc ?? 8,
          s.timezone ?? 'UTC',
        );
        await this.db.client
          .from('schedules')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: next,
            updated_at: new Date().toISOString(),
          })
          .eq('id', s.id);
      } catch (e) {
        this.logger.error(`Schedule ${s.id}`, e);
        await this.db.client.from('schedule_runs').insert({
          schedule_id: s.id,
          status: 'error',
          message: String(e),
        });
      }
    }
  }

  computeNextRun(
    frequency: string,
    hourUtc: number,
    _tz: string,
  ): string {
    const d = new Date();
    d.setUTCHours(hourUtc, 0, 0, 0);
    if (d <= new Date()) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    if (frequency === 'weekly') {
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return d.toISOString();
  }
}

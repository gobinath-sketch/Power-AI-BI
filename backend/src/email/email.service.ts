import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private smtp: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST')?.trim();
    const portStr = config.get<string>('SMTP_PORT')?.trim();
    const user = config.get<string>('SMTP_USER')?.trim();
    const pass = config.get<string>('SMTP_PASS')?.trim();
    if (host && portStr && user && pass) {
      const port = parseInt(portStr, 10);
      const secure =
        (config.get<string>('SMTP_SECURE') ?? '').toLowerCase() === 'true' ||
        port === 465;
      this.smtp = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
  }

  async sendTest(to: string) {
    if (!this.smtp) throw new Error('SMTP not configured');
    const from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      'reports@localhost';
    const info = await this.smtp.sendMail({
      from,
      to,
      subject: 'Power BI Analytics — test email',
      html: '<p>Your SMTP email integration is working.</p>',
    });
    return { ok: true, messageId: info.messageId };
  }

  async sendReportEmail(params: {
    to: string;
    subject: string;
    reportTitle: string;
    summaryHtml: string;
    reportUrl?: string;
  }) {
    const link = params.reportUrl
      ? `<p><a href="${params.reportUrl}">Open report</a></p>`
      : '';

    const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">${params.reportTitle}</h2>
      ${params.summaryHtml}
      ${link}
      <p style="color:#64748b;font-size:12px;margin-top:24px">Sent by Power BI Analytics Platform</p>
    </div>`;

    if (!this.smtp) throw new Error('SMTP not configured');
    const from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      'reports@localhost';
    const info = await this.smtp.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html,
    });
    return { ok: true, messageId: info.messageId };
  }
}

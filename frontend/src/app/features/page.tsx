import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import { BarChart3, Bot, FileDown, Mail, Shield, Zap } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <MarketingShell active="/features">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Features
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Everything you need to generate and deliver BI reports.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted md:text-lg">
          PowerNI is a full pipeline: dataset selection → aggregation → AI insights/chat → exports → scheduling.
          It’s built to feel like Power BI (slicers + charts) while keeping secrets server-side.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: 'KPIs + charts from verified aggregates',
              body: 'Server-side calculations and grouping; the UI renders the results without inventing rows.',
            },
            {
              icon: Bot,
              title: 'Embedded AI assistant',
              body: 'Ask questions about the report and get answers grounded in the stored report payload.',
            },
            {
              icon: FileDown,
              title: 'PDF + interactive HTML exports',
              body: 'Professional PDFs with charts and a downloadable HTML dashboard that stays clickable.',
            },
            {
              icon: Mail,
              title: 'Daily email delivery (SMTP)',
              body: 'Schedules run automatically and deliver report summaries via SMTP.',
            },
            {
              icon: Zap,
              title: 'Large dataset safeguards',
              body: 'Downsampling and “Other” bucketing keep charts fast and readable.',
            },
            {
              icon: Shield,
              title: 'Security-first architecture',
              body: 'Power BI/Azure and AI keys live only in NestJS; the browser never sees them.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <Icon className="h-5 w-5 text-foreground" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/workflow">
            <Button className="rounded-full">See the workflow</Button>
          </Link>
          <Link href="/exports">
            <Button variant="outline" className="rounded-full">
              Explore exports
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}


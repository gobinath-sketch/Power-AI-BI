import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';

export default function WorkflowPage() {
  return (
    <MarketingShell active="/workflow">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Workflow
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          End-to-end reporting flow, designed for reliability.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted md:text-lg">
          This is the exact flow the app implements. Each step is built so you can test end-to-end even before Power BI permissions are fully granted (using the Excel upload fallback).
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {[
            {
              t: '1) Sign in (Supabase)',
              d: 'Users authenticate and receive a session; protected app pages require login.',
            },
            {
              t: '2) Connect workspace + dataset (Power BI)',
              d: 'Backend uses Azure AD client credentials to read workspace and dataset metadata.',
            },
            {
              t: '3) Generate report payload',
              d: 'Server aggregates KPIs and chart series; AI produces insights based on aggregates only.',
            },
            {
              t: '4) Interact (slicers + chat)',
              d: 'Charts update from filters, and the embedded assistant can answer questions about the report.',
            },
            {
              t: '5) Export',
              d: 'PDF is rendered with charts; HTML export downloads as a self-contained interactive dashboard.',
            },
            {
              t: '6) Schedule daily delivery (SMTP)',
              d: 'Schedules persist and run automatically; recipients receive the report summary by email.',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="font-semibold">{x.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/exports">
            <Button className="rounded-full">Exports</Button>
          </Link>
          <Link href="/security">
            <Button variant="outline" className="rounded-full">
              Security
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}


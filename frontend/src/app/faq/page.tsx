import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';

export default function FaqPage() {
  return (
    <MarketingShell active="/faq">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          FAQ
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Answers to common questions.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted md:text-lg">
          If something looks off, it’s usually Power BI permissions (service principal access) or a missing SMTP config.
          The app is built so you can still test end-to-end using Excel upload while configuring Power BI.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {[
            {
              q: 'Will the AI invent data?',
              a: 'No. Insights and chat are generated from KPIs and aggregates computed from the dataset response. No synthetic rows are created.',
            },
            {
              q: 'Can I use this without Power BI access ready?',
              a: 'Yes. Use the Excel upload report generator to validate the full pipeline (report → PDF → email) while you set tenant/workspace permissions.',
            },
            {
              q: 'Do interactive HTML downloads keep working offline?',
              a: 'Yes. The exported HTML is self-contained so slicers and charts can update after downloading.',
            },
            {
              q: 'Is Resend required?',
              a: 'No. Resend has been removed; email delivery is SMTP-only.',
            },
            {
              q: 'What permissions are needed for Power BI?',
              a: 'The Azure AD app must be granted tenant permissions and added to the workspace with dataset Build permissions. Without that, dataset listing may return 401/403.',
            },
            {
              q: 'Where are secrets stored?',
              a: 'On the backend only (environment variables). The browser never receives Power BI/Azure or AI keys.',
            },
          ].map((x) => (
            <div key={x.q} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="font-semibold">{x.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{x.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card px-6 py-5 shadow-soft">
          <div>
            <p className="text-sm font-semibold">Ready to generate your first report?</p>
            <p className="mt-1 text-sm text-muted">Sign in and start from datasets or Excel upload.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button className="rounded-full px-6">Get started</Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" className="rounded-full px-6">
                View features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}


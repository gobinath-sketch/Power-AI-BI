import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';

export default function FaqPage() {
  return (
    <MarketingShell active="/faq">
      <section className="mx-auto h-[calc(100vh-73px)] max-w-6xl overflow-hidden px-6 pb-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          FAQ
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight">
          Answers to common questions.
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm text-muted">
          If something looks off, it’s usually Power BI permissions (service principal access) or a missing SMTP config.
          The app is built so you can still test end-to-end using Excel upload while configuring Power BI.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
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
            <div key={x.q} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="font-semibold">{x.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{x.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card px-5 py-3 shadow-soft">
          <div>
            <p className="text-sm font-semibold">Ready to generate your first report?</p>
            <p className="mt-1 text-xs text-muted">Sign in and start from datasets or Excel upload.</p>
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


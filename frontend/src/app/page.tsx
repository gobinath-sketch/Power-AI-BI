import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing-shell';
import {
  Filter,
  Gauge,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <MarketingShell active="/">
      <div className="mx-auto max-w-6xl px-6">
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-12 md:pb-14 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Read-only Power BI · Verified aggregates · AI insights & chat
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              A single-screen dashboard that generates, exports, and delivers reports.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted md:text-xl">
              Connect a workspace, pick a dataset, generate KPIs + charts + insights, export
              professional PDFs, download interactive HTML, and schedule daily email delivery
              via SMTP.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button className="h-12 rounded-full px-8 text-base">
                  Start now
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" className="h-12 rounded-full px-8 text-base">
                  See what you get
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                { k: 'Datasets', v: 'Power BI or Excel fallback' },
                { k: 'Exports', v: 'PDF + interactive HTML' },
                { k: 'Delivery', v: 'Daily schedule via SMTP' },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-border bg-card px-5 py-4 text-left shadow-soft"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {x.k}
                  </p>
                  <p className="mt-1 text-sm font-medium">{x.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-6xl">
            <div className="rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background">
                    <Gauge className="h-4 w-4 text-foreground" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Live report preview</p>
                    <p className="text-xs text-muted">
                      Single-screen dashboard layout (KPIs, charts, slicers, AI insights).
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted">
                    Read-only
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted">
                    Auditable
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted">
                    Fast
                  </span>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-12">
                <div className="md:col-span-4">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      KPIs
                    </p>
                    <div className="mt-3 grid gap-3">
                      {[
                        { k: 'Revenue', v: '$ 1.24M', d: '+8.4%' },
                        { k: 'Orders', v: '18,420', d: '+3.1%' },
                        { k: 'Margin', v: '32.8%', d: '-0.6%' },
                      ].map((x) => (
                        <div
                          key={x.k}
                          className="rounded-xl border border-border bg-card px-4 py-3"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-medium">{x.k}</p>
                            <p className="text-xs text-muted">{x.d}</p>
                          </div>
                          <p className="mt-1 text-2xl font-semibold tracking-tight">
                            {x.v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Chart
                      </p>
                      <div className="mt-3 h-40 rounded-xl border border-border bg-card [background-image:linear-gradient(90deg,rgba(34,211,238,0.10),transparent),linear-gradient(rgba(168,85,247,0.08),transparent)]" />
                      <p className="mt-3 text-xs text-muted">
                        Bar/line charts render from real aggregates (no invented rows).
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        AI Insights
                      </p>
                      <div className="mt-3 space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                        <p className="font-medium">
                          “Top category is driving most growth.”
                        </p>
                        <p className="text-muted">
                          The assistant references KPIs + grouped totals and explains anomalies,
                          trends, and risks.
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-muted">
                        Chat is embedded in-app (not a separate page).
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Slicers
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Product', 'Region', 'Channel', 'Date'].map((x) => (
                          <span
                            key={x}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted"
                          >
                            <Filter className="h-3 w-3 text-muted" />
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Click a slicer chip to update charts (works in-app and in downloaded HTML).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Explore
            </p>
            <h2 className="mt-3 text-xl font-semibold md:text-2xl">
              Choose a page to learn more.
            </h2>
            <p className="mt-2 text-sm text-muted">
              The homepage is intentionally short. Details are on dedicated pages.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/features">
                <Button className="rounded-full">Features</Button>
              </Link>
              <Link href="/workflow">
                <Button variant="outline" className="rounded-full">
                  Workflow
                </Button>
              </Link>
              <Link href="/exports">
                <Button variant="outline" className="rounded-full">
                  Exports
                </Button>
              </Link>
              <Link href="/security">
                <Button variant="outline" className="rounded-full">
                  Security
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" className="rounded-full">
                  FAQ
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

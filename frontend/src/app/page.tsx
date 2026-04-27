import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing-shell';
import { Gauge } from 'lucide-react';
import { LandingLivePreview } from '@/components/landing-live-preview';

export default function LandingPage() {
  return (
    <MarketingShell active="/">
      <div className="h-[calc(100vh-73px)] w-full overflow-hidden px-6">
        <section className="h-full w-full pb-6 pt-4 md:pt-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-4xl">
              A single-screen dashboard that generates, exports, and delivers reports.
            </h1>
           

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

          <div className="mt-10 w-full">
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
              <LandingLivePreview />
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  );
}

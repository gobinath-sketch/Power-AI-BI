import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, Globe } from 'lucide-react';

export default function ExportsPage() {
  return (
    <MarketingShell active="/exports">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Exports
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Share reports as PDF or interactive HTML.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted md:text-lg">
          Export options are designed for executives (PDF) and for interactive sharing (downloadable HTML that keeps slicers working).
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background">
                <FileText className="h-5 w-5 text-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold">Professional PDF</p>
                <p className="text-xs text-muted">Printable, chart-ready</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Generated with a report layout (KPI cards + rendered charts). Perfect for email attachments and stakeholders.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background">
                <Globe className="h-5 w-5 text-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold">Interactive HTML</p>
                <p className="text-xs text-muted">Self-contained, clickable</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Download a single HTML file that includes data + scripts so filters/slicers keep working offline.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card px-6 py-5 shadow-soft">
          <div className="flex items-center gap-3">
            <FileDown className="h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold">Want to see exports in action?</p>
              <p className="mt-1 text-sm text-muted">
                Generate a report from a dataset or Excel upload, then use the export buttons.
              </p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <Link href="/login">
              <Button className="rounded-full px-6">Generate a report</Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" className="rounded-full px-6">
                Read FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}


import Link from 'next/link';
import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import { KeyRound, Lock, ShieldCheck, Server } from 'lucide-react';

export default function SecurityPage() {
  return (
    <MarketingShell active="/security">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Security
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Secrets stay on the server. Reports stay auditable.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted md:text-lg">
          The frontend never receives your Power BI/Azure credentials or AI keys. The backend performs read-only API calls and returns only report payloads and exports.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Server,
              t: 'Server-side integrations',
              d: 'Power BI tokens and AI calls run only in NestJS; the browser calls your API with a user session.',
            },
            {
              icon: KeyRound,
              t: 'Environment-variable secrets',
              d: 'Credentials live in backend `.env` and are validated at startup so misconfigurations fail fast.',
            },
            {
              icon: Lock,
              t: 'Read-only data access',
              d: 'The Power BI integration reads metadata and dataset query results; it does not write back to the workspace.',
            },
            {
              icon: ShieldCheck,
              t: 'Defensive defaults',
              d: 'Validation pipes, CORS control, and careful export rendering to prevent unsafe injection patterns in downloads.',
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <Icon className="h-5 w-5 text-foreground" />
              <p className="mt-4 font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/faq">
            <Button className="rounded-full">Read FAQ</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="rounded-full">
              Sign in
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}


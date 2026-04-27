import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3, Shield, Zap, Mail } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="h-screen overflow-hidden bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">Power BI Analytics</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign in
          </Link>
          <Link href="/login">
            <Button className="rounded-full px-5">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-12 md:pt-16">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Enterprise-grade · Read-only Power BI
        </p>
        <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Turn workspace data into live reports, AI insight, and scheduled delivery.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-600">
          Connect to your Power BI workspace, generate executive-ready visuals, export PDFs,
          and receive daily email briefings — with an assistant that reasons on verified
          aggregates only.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/login">
            <Button className="h-12 rounded-full px-8 text-base">Start with Google</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="h-12 rounded-full px-8 text-base">
              View dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-[#fafafa] py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-4">
          {[
            {
              icon: BarChart3,
              title: 'Fresh API data',
              body: 'Refresh status checks before each run. No stale cached datasets — metadata only.',
            },
            {
              icon: Zap,
              title: 'AI you can trust',
              body: 'Insights and chat reference KPIs and aggregates from Power BI — never invented rows.',
            },
            {
              icon: Mail,
              title: 'PDF & email',
              body: 'Puppeteer PDFs and Resend-powered schedules with persistent cron from Supabase.',
            },
            {
              icon: Shield,
              title: 'Secrets on server',
              body: 'Azure service principal, OpenAI, and Resend keys stay in NestJS — never exposed to the browser.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft"
            >
              <Icon className="h-6 w-6 text-neutral-800" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

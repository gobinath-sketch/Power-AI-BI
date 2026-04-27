import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ReportCharts } from '@/components/report-charts';
import { ReportActions } from './report-actions';
import { InteractiveReport } from '@/components/interactive-report';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ReportRow = {
  id: string;
  title: string;
  payload: Record<string, unknown>;
  insights: Record<string, unknown> | null;
  refresh_warning: string | null;
  last_refreshed_at: string | null;
  row_count: number | null;
  created_at: string;
};

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!report) {
    return <p className="text-sm text-neutral-500">Report not found.</p>;
  }

  const r = report as ReportRow;
  const payload = r.payload as {
    kpis?: { id: string; label: string; value: string | number; hint?: string }[];
    columns?: { name: string; dataType?: string }[];
    sampleRows?: Record<string, unknown>[];
    charts?: Parameters<typeof ReportCharts>[0]['charts'];
    generatedAt?: string;
    datasetName?: string;
  };

  const insights = r.insights as {
    summary?: string;
    risks?: string[];
    opportunities?: string[];
    recommendations?: string[];
  } | null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/archive" className="text-xs text-neutral-500 hover:underline">
            ← Archive
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{r.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {payload.datasetName ?? 'Dataset'} · {r.row_count ?? '—'} rows ·{' '}
            {payload.generatedAt
              ? new Date(payload.generatedAt).toLocaleString()
              : new Date(r.created_at).toLocaleString()}
          </p>
          {r.last_refreshed_at && (
            <p className="mt-1 text-xs text-neutral-500">
              Model refresh ended: {new Date(r.last_refreshed_at).toLocaleString()}
            </p>
          )}
          {r.refresh_warning && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {r.refresh_warning}
            </p>
          )}
        </div>
        <ReportActions reportId={r.id} />
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {(payload.kpis ?? []).map((k) => (
          <div
            key={k.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {k.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-neutral-500">{k.hint}</p>}
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Charts
        </h2>
        <div className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <ReportCharts charts={payload.charts ?? []} />
            </div>
          </div>
        </div>
      </section>

      <InteractiveReport payload={payload} />

      {insights && (
        <section className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            AI insight
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-800">{insights.summary}</p>
          {(insights.recommendations?.length ?? 0) > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {insights.recommendations?.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
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
    charts?: unknown[];
    generatedAt?: string;
    datasetName?: string;
    sampleRowsTruncated?: boolean;
  };

  const insights = r.insights as {
    summary?: string;
    risks?: string[];
    opportunities?: string[];
    recommendations?: string[];
  } | null;

  return (
    <div id="report-export-root" className="flex h-[calc(100vh-120px)] flex-col overflow-hidden">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/archive" className="text-xs text-neutral-500 hover:underline">
              ← Archive
            </Link>
            <div className="mt-2 overflow-hidden">
              <div className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm">
                <h1 className="max-w-[280px] truncate text-2xl font-semibold leading-none">
                  {r.title}
                </h1>
                <span className="text-neutral-500">·</span>
                <p className="max-w-[520px] truncate text-neutral-600">
                  {payload.datasetName ?? 'Dataset'} · {r.row_count ?? '—'} rows ·{' '}
                  {payload.generatedAt
                    ? new Date(payload.generatedAt).toLocaleString()
                    : new Date(r.created_at).toLocaleString()}
                </p>
                {r.last_refreshed_at && (
                  <>
                    <span className="text-neutral-500">·</span>
                    <p className="max-w-[360px] truncate text-xs text-neutral-500">
                      Model refresh ended: {new Date(r.last_refreshed_at).toLocaleString()}
                    </p>
                  </>
                )}
                {r.refresh_warning && (
                  <span className="max-w-[360px] truncate border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                    {r.refresh_warning}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ReportActions reportId={r.id} />
        </div>
      </div>

      <section className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col lg:col-span-8">
          <section className="grid shrink-0 gap-4 md:grid-cols-3">
            {(payload.kpis ?? []).map((k) => (
              <div key={k.id} className="border border-neutral-200 bg-white p-4 shadow-soft">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {k.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums font-ui">{k.value}</p>
                {k.hint && <p className="mt-1 text-xs text-neutral-500">{k.hint}</p>}
              </div>
            ))}
          </section>

          <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
            <InteractiveReport payload={payload} />
          </div>
        </div>

        <div className="min-h-0 lg:col-span-4">
          <section className="flex h-full flex-col border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-soft">
            <div className="min-h-0 flex-1 overflow-auto pr-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                AI insight
              </h2>
              <div className="mt-3 space-y-3">
                <p className="font-ui text-sm leading-relaxed text-neutral-800">
                  {insights?.summary ?? 'AI insight is not available for this report.'}
                </p>
                {(insights?.recommendations?.length ?? 0) > 0 && (
                  <ul className="font-ui list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {insights?.recommendations?.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-3 border-t border-neutral-200 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Report metadata
              </p>
              <div className="mt-3 space-y-2 font-ui">
                <p>
                  <span className="font-medium text-neutral-900">Dataset:</span>{' '}
                  {payload.datasetName ?? 'Dataset'}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Rows:</span> {r.row_count ?? '—'}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Generated:</span>{' '}
                  {payload.generatedAt
                    ? new Date(payload.generatedAt).toLocaleString()
                    : new Date(r.created_at).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Interactive rows:</span>{' '}
                  {payload.sampleRowsTruncated ? 'Optimized subset' : 'Full rows loaded'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

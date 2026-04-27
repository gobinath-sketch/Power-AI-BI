import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { apiFetch } from '@/lib/api';
import { Database, FileText, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Dataset = { id: string; name: string; isRefreshable?: boolean };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  let datasets: Dataset[] = [];
  let error: string | null = null;
  try {
    datasets = await apiFetch<Dataset[]>('/datasets', session.access_token);
  } catch (e) {
    error = String(e);
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
              <span>Dashboard</span>
              <span className="text-sm font-medium text-neutral-500">·</span>
              <span className="text-sm font-medium text-neutral-600">Datasets from workspace</span>
              <code className="rounded bg-neutral-100 px-1 text-xs">POWERBI_GROUP_ID</code>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <span>Datasets</span>
                <span className="text-lg font-semibold normal-case text-neutral-900">{datasets.length}</span>
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <span>Recent reports</span>
                <span className="text-lg font-semibold normal-case text-neutral-900">{(reports ?? []).length}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Could not load datasets</p>
          <p className="mt-1 break-words">{error}</p>
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Dataset list view
          </h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
            <Sparkles className="h-3.5 w-3.5" />
            Select any dataset to generate report
          </div>
        </div>

        {datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <th className="px-5 py-3">Dataset</th>
                  <th className="px-5 py-3">Dataset ID</th>
                  <th className="px-5 py-3">Refresh</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white">
                          <Database className="h-4 w-4 text-neutral-600" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{d.name}</p>
                          <p className="text-xs text-neutral-500">Power BI dataset</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                        {d.id}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          d.isRefreshable === false
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {d.isRefreshable === false ? 'Not refreshable' : 'Refreshable'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/reports/new?datasetId=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <FileText className="h-4 w-4" />
                        Generate report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-neutral-500">No datasets returned for this workspace.</p>
            </div>
          )
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent reports
        </h2>
        <ul className="mt-4 space-y-2">
          {(reports ?? []).map((r: { id: string; title: string; created_at: string }) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2">
              <Link href={`/reports/${r.id}`} className="text-sm font-medium text-neutral-900 hover:underline">
                {r.title}
              </Link>
              <span className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        {(reports ?? []).length === 0 && (
          <p className="mt-2 text-sm text-neutral-500">No saved reports yet.</p>
        )}
      </section>
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { apiFetch } from '@/lib/api';

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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Datasets from workspace <code className="rounded bg-neutral-100 px-1 text-xs">POWERBI_GROUP_ID</code>
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load datasets: {error}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Datasets
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {datasets.map((d) => (
            <Link
              key={d.id}
              href={`/reports/new?datasetId=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft transition hover:border-neutral-300"
            >
              <p className="font-medium text-neutral-900">{d.name}</p>
              <p className="mt-1 font-mono text-xs text-neutral-500">{d.id}</p>
              <p className="mt-3 text-sm text-neutral-500 group-hover:text-neutral-800">
                Generate report →
              </p>
            </Link>
          ))}
        </div>
        {datasets.length === 0 && !error && (
          <p className="mt-4 text-sm text-neutral-500">No datasets returned for this workspace.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent reports
        </h2>
        <ul className="mt-4 space-y-2">
          {(reports ?? []).map((r: { id: string; title: string; created_at: string }) => (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="text-sm font-medium text-neutral-900 hover:underline">
                {r.title}
              </Link>
              <span className="ml-2 text-xs text-neutral-500">
                {new Date(r.created_at).toLocaleString()}
              </span>
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

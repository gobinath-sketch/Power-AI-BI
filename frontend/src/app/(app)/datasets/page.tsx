import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { apiFetch } from '@/lib/api';

type Dataset = { id: string; name: string; isRefreshable?: boolean };

export default async function DatasetsPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dataset browser</h1>
      <p className="mt-1 text-sm text-neutral-600">
        All datasets in your configured Power BI workspace.
      </p>
      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {datasets.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft"
          >
            <h2 className="font-medium">{d.name}</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500 break-all">{d.id}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/reports/new?datasetId=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white"
              >
                Build report
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

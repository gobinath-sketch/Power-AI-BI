import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, dataset_name, created_at, row_count')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Report archive</h1>
      <p className="mt-1 text-sm text-neutral-600">All reports saved for your account.</p>
      <ul className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {(reports ?? []).map(
          (r: {
            id: string;
            title: string;
            dataset_name: string | null;
            created_at: string;
            row_count: number | null;
          }) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {r.dataset_name ?? 'Dataset'} · {r.row_count ?? '—'} rows ·{' '}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                href={`/reports/${r.id}`}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Open →
              </Link>
            </li>
          ),
        )}
      </ul>
      {(reports ?? []).length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">No reports yet.</p>
      )}
    </div>
  );
}

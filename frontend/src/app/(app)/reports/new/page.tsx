'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function NewReportPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const presetId = sp.get('datasetId') ?? '';
  const presetName = sp.get('name') ?? '';

  const [title, setTitle] = useState('Executive overview');
  const [datasetId, setDatasetId] = useState(presetId);
  const [datasetName, setDatasetName] = useState(presetName);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDatasetId(presetId);
    setDatasetName(presetName);
  }, [presetId, presetName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErr('Not signed in');
      setLoading(false);
      return;
    }
    try {
      const report = await apiFetch<{ id: string }>('/reports/generate', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          title,
          datasetId,
          datasetName: datasetName || undefined,
          waitForRefresh: false,
        }),
      });
      router.push(`/reports/${report.id}`);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">New report</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Fetches fresh data from Power BI, then builds KPIs, charts, and AI insight.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-neutral-600">Title</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600">Dataset ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600">Dataset name (optional)</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading ? 'Generating…' : 'Generate report'}
        </Button>
      </form>
    </div>
  );
}

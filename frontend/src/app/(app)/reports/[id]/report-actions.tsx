'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ReportActions({ reportId }: { reportId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function html() {
    setStatus('Preparing HTML…');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ??
        'http://localhost:3001/api';
      const url = `${base}/reports/${reportId}/html`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('HTML export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `report-${reportId}.html`;
      a.click();
      setStatus('HTML downloaded.');
    } catch (e) {
      setStatus(String(e));
    }
  }

  async function pdf() {
    setStatus('Queueing PDF…');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { jobId } = await apiFetch<{ jobId: string }>(
        `/reports/${reportId}/pdf`,
        session.access_token,
        { method: 'POST' },
      );
      setStatus('Rendering…');
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const job = await apiFetch<{ status: string }>(`/jobs/${jobId}`, session.access_token);
        if (job.status === 'completed') {
          const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:3001/api';
          const url = `${base}/jobs/${jobId}/download`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!res.ok) throw new Error('Download failed');
          const blob = await res.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `report-${reportId}.pdf`;
          a.click();
          setStatus('Download started.');
          return;
        }
        if (job.status === 'failed') {
          setStatus('PDF failed');
          return;
        }
      }
      setStatus('Timed out waiting for PDF');
    } catch (e) {
      setStatus(String(e));
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={html}>
          Download HTML
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={pdf}>
          Download PDF
        </Button>
      </div>
      {status && <p className="text-xs text-neutral-500">{status}</p>}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Schedule = {
  id: string;
  title: string | null;
  dataset_id: string;
  frequency: string;
  recipient_email: string;
  hour_utc: number;
  enabled: boolean;
  next_run_at: string | null;
};

export default function SchedulesPage() {
  const [list, setList] = useState<Schedule[]>([]);
  const [datasetId, setDatasetId] = useState('');
  const [title, setTitle] = useState('Daily brief');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [hourUtc, setHourUtc] = useState(8);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const rows = await apiFetch<Schedule[]>('/schedules', session.access_token);
    setList(rows);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      await apiFetch('/schedules', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          title,
          datasetId,
          frequency,
          hourUtc,
          recipientEmail,
        }),
      });
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await apiFetch(`/schedules/${id}`, session.access_token, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Email schedules</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Stored in Supabase. Cron regenerates from fresh Power BI data and emails via Resend.
      </p>

      <form onSubmit={create} className="mt-8 max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
        <h2 className="text-sm font-semibold">New schedule</h2>
        <div>
          <label className="text-xs text-neutral-600">Title</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Dataset ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Recipient email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-neutral-600">Frequency</label>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-neutral-600">Hour (UTC)</label>
            <input
              type="number"
              min={0}
              max={23}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={hourUtc}
              onChange={(e) => setHourUtc(Number(e.target.value))}
            />
          </div>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" className="w-full rounded-xl">
          Save schedule
        </Button>
      </form>

      <ul className="mt-10 space-y-3">
        {list.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{s.title ?? s.dataset_id}</p>
              <p className="text-xs text-neutral-500">
                {s.frequency} @ {s.hour_utc}:00 UTC → {s.recipient_email}
              </p>
              {s.next_run_at && (
                <p className="text-xs text-neutral-400">
                  Next: {new Date(s.next_run_at).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => remove(s.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

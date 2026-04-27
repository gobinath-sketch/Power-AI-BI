'use client';

import { useMemo, useState } from 'react';
import { ReportCharts } from '@/components/report-charts';

type Payload = {
  columns?: { name: string; dataType?: string }[];
  sampleRows?: Record<string, unknown>[];
  kpis?: { id: string; label: string; value: string | number; hint?: string }[];
  charts?: Chart[];
};

type Chart = {
  id: string;
  title: string;
  kind: 'line' | 'bar' | 'pie' | 'table' | string;
  yKey?: string;
  series?: { name?: string; points: { x: string | number; y: number }[] };
  categories?: { name: string; value: number }[];
  note?: string;
};

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

function looksDate(v: unknown): boolean {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

export function InteractiveReport({ payload }: { payload: Payload }) {
  const rows = useMemo(() => payload.sampleRows ?? [], [payload.sampleRows]);
  const cols = useMemo(() => payload.columns ?? [], [payload.columns]);

  const categoryColumn = useMemo(() => {
    // pick the first string-ish column with reasonable distinct count
    const names = cols.map((c) => c.name);
    for (const n of names) {
      const vals = rows.map((r) => r[n]).filter((v) => v !== null && v !== undefined);
      if (!vals.length) continue;
      const distinct = new Set(vals.map((v) => String(v)));
      if (distinct.size >= 2 && distinct.size <= Math.min(40, vals.length)) return n;
    }
    return null;
  }, [rows, cols]);

  const categoryValues = useMemo(() => {
    if (!categoryColumn) return [];
    const distinct = new Set(rows.map((r) => String(r[categoryColumn] ?? '—')));
    return ['All', ...Array.from(distinct).slice(0, 200)];
  }, [rows, categoryColumn]);

  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    if (!categoryColumn || category === 'All') return rows;
    return rows.filter((r) => String(r[categoryColumn] ?? '—') === category);
  }, [rows, category, categoryColumn]);

  const recalculatedCharts = useMemo(() => {
    // Use existing charts if we can't safely recompute.
    if (!filtered.length) return payload.charts ?? [];

    // Try: find a date column and a numeric measure for a trend chart
    const names = cols.map((c) => c.name);
    const dateCol = names.find((n) => filtered.some((r) => looksDate(r[n])));
    const numeric = names.find((n) => filtered.filter((r) => isNumber(r[n])).length > filtered.length * 0.3);

    const charts: Chart[] = [];
    if (dateCol && numeric) {
      const pts = filtered
        .map((r) => ({ x: String(r[dateCol]), y: Number(r[numeric]) }))
        .filter((p) => !Number.isNaN(Date.parse(p.x)) && !Number.isNaN(p.y))
        .sort((a, b) => Date.parse(a.x) - Date.parse(b.x))
        .slice(0, 400);
      charts.push({
        id: 'trend-filtered',
        title: `${numeric} over ${dateCol}${category !== 'All' ? ` · ${category}` : ''}`,
        kind: 'line',
        yKey: numeric,
        series: { points: pts },
      });
    }

    if (categoryColumn && numeric) {
      const map = new Map<string, number>();
      for (const r of filtered) {
        const k = String(r[categoryColumn] ?? '—');
        const v = Number(r[numeric]);
        if (Number.isNaN(v)) continue;
        map.set(k, (map.get(k) ?? 0) + v);
      }
      const cats = Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, value]) => ({ name, value }));
      charts.push({
        id: 'cat-filtered',
        title: `${numeric} by ${categoryColumn}`,
        kind: cats.length <= 6 ? 'pie' : 'bar',
        categories: cats,
      });
    }

    return charts.length ? charts : (payload.charts ?? []);
  }, [filtered, payload.charts, cols, categoryColumn, category]);

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Interactive filters (Power BI-style)
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Click a slice/bar to cross-filter all charts. Uses the report’s saved sample rows (no hidden filtering).
          </p>
        </div>
        {categoryColumn && (
          <div className="min-w-[240px]">
            <label className="text-xs font-medium text-neutral-600">Slicer · {categoryColumn}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryValues.slice(0, 10).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCategory(v)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs transition',
                    v === category
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
              {categoryValues.length > 10 && (
                <select
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryValues.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <ReportCharts
          charts={recalculatedCharts}
          selectedCategory={category === 'All' ? undefined : category}
          onCategoryClick={(c) => setCategory(c)}
        />
        {filtered.length === 0 && (
          <p className="mt-3 text-sm text-neutral-500">No rows match that selection.</p>
        )}
      </div>
    </div>
  );
}


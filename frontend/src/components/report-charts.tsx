'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Label,
} from 'recharts';

const COLORS = ['#171717', '#525252', '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5'];

type Chart = {
  id: string;
  title: string;
  kind: string;
  series?: { points: { x: string | number; y: number }[] };
  categories?: { name: string; value: number }[];
};

type ClickPayload = {
  name?: string;
  payload?: { name?: string };
};

export function ReportCharts({
  charts,
  onCategoryClick,
  selectedCategory,
}: {
  charts: Chart[];
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string;
}) {
  if (!charts?.length) {
    return (
      <p className="text-sm text-neutral-500">No charts — not enough structured columns detected.</p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.map((c) => (
        <div key={c.id} className="border border-neutral-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">{c.title}</h3>
              <p className="mt-1 text-xs text-neutral-500">
                {c.kind === 'line' && `Trend chart · X: ${c.xKey} · Y: ${c.yKey ?? 'Value'}`}
                {c.kind === 'bar' && `Bar chart · X: ${c.xKey} · Y: ${c.yKey ?? 'Value'}`}
                {c.kind === 'pie' && `Distribution chart · Group: ${c.xKey} · Measure: ${c.yKey ?? 'Value'}`}
              </p>
            </div>
            <span className="border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              {c.kind}
            </span>
          </div>
          <div className="mt-3 h-56 w-full">
            {c.kind === 'line' && c.series && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.series.points.map((p) => ({ name: p.x, v: p.y }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#888">
                    <Label
                      value={c.xKey || 'X Axis'}
                      offset={-2}
                      position="insideBottom"
                      style={{ fill: '#666', fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis tick={{ fontSize: 11 }} stroke="#888">
                    <Label
                      value={c.yKey || 'Value'}
                      angle={-90}
                      position="insideLeft"
                      style={{ fill: '#666', fontSize: 11, textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#171717" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {c.kind === 'bar' && c.categories && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888">
                    <Label
                      value={c.xKey || 'Category'}
                      offset={-2}
                      position="insideBottom"
                      style={{ fill: '#666', fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis tick={{ fontSize: 11 }} stroke="#888">
                    <Label
                      value={c.yKey || 'Value'}
                      angle={-90}
                      position="insideLeft"
                      style={{ fill: '#666', fontSize: 11, textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#171717"
                    radius={[4, 4, 0, 0]}
                    onClick={(d: unknown) => {
                      const dd = d as ClickPayload;
                      const name = dd?.name ?? dd?.payload?.name;
                      if (name && name !== 'Other') onCategoryClick?.(String(name));
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            {c.kind === 'pie' && c.categories && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={c.categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name }) => name}
                    onClick={(d: unknown) => {
                      const dd = d as ClickPayload;
                      const name = dd?.name ?? dd?.payload?.name;
                      if (name && name !== 'Other') onCategoryClick?.(String(name));
                    }}
                  >
                    {c.categories.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        stroke={
                          selectedCategory &&
                          c.categories?.[i]?.name === selectedCategory
                            ? '#111'
                            : undefined
                        }
                        strokeWidth={
                          selectedCategory &&
                          c.categories?.[i]?.name === selectedCategory
                            ? 2
                            : 1
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {c.note && <p className="text-xs text-neutral-500">{c.note}</p>}
            <p className="text-[11px] text-neutral-400">
              Tip: Hover data points for exact values.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

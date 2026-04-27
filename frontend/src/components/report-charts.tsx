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
    <div className="grid gap-8">
      {charts.map((c) => (
        <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-neutral-900">{c.title}</h3>
          <div className="mt-4 h-72 w-full">
            {c.kind === 'line' && c.series && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.series.points.map((p) => ({ name: p.x, v: p.y }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#888" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#171717" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {c.kind === 'bar' && c.categories && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888" />
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
        </div>
      ))}
    </div>
  );
}

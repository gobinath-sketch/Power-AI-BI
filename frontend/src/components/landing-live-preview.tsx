'use client';

import { useEffect, useMemo, useState } from 'react';

type KpiState = {
  revenue: number;
  orders: number;
  margin: number;
};

const BASE = {
  revenue: 1_240_000,
  orders: 18_420,
  margin: 32.8,
};

const AI_RESPONSES = [
  'Top category is driving most growth. Revenue momentum is strongest in the latest period.',
  'Region-wise split shows stable demand with lower variance than last week.',
  'Margin is slightly down while orders rise. Watch discount-heavy channels.',
  'No critical anomaly detected. Trend remains positive with healthy conversion.',
  'Weekend spike came from direct channel traffic, especially in high-value segments.',
  'Retention improved after the campaign refresh; repeat orders are trending up.',
  'North zone performance dipped slightly due to lower basket size this cycle.',
  'Forecast suggests moderate growth next period if current order velocity continues.',
  'Channel mix is shifting toward online; monitor CAC to protect margin quality.',
  'Top 3 products now contribute a larger share of revenue than previous week.',
];

const USER_PROMPTS = [
  'What changed most today?',
  'Any risk we should flag?',
  'How is region performance?',
  'Give me a quick summary.',
  'Which channel is improving fastest?',
  'Show me margin pressure areas.',
  'What should we optimize next?',
  'Any unusual behavior in orders?',
  'How are top products trending?',
  'Can you summarize key actions?',
];

export function LandingLivePreview() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((x) => x + 1);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  const kpis = useMemo<KpiState>(() => {
    const wave = Math.sin(tick * 0.8);
    const wave2 = Math.cos(tick * 0.7);
    return {
      revenue: Math.round(BASE.revenue + wave * 6500 + wave2 * 2500),
      orders: Math.round(BASE.orders + wave * 130 + wave2 * 55),
      margin: Number((BASE.margin + wave * 0.32).toFixed(1)),
    };
  }, [tick]);

  const bars = useMemo(
    () =>
      [48, 55, 62, 58, 71, 66, 74, 68, 61, 57, 64, 59, 52, 60, 67, 63, 70, 65, 58, 62, 56, 69].map((n, i) =>
        Math.max(36, n + Math.sin(tick * 0.9 + i * 0.55) * 9),
      ),
    [tick],
  );

  const conversationIndex = tick % AI_RESPONSES.length;
  const isTyping = tick % 2 === 0;

  return (
    <div className="grid gap-4 p-5 md:grid-cols-12">
      <div className="md:col-span-4">
        <div className="h-full rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">KPIs</p>
          <div className="mt-3 grid gap-3">
            <KpiCard label="Revenue" value={`$ ${(kpis.revenue / 1_000_000).toFixed(2)}M`} delta="+8.4%" />
            <KpiCard label="Orders" value={kpis.orders.toLocaleString()} delta="+3.1%" />
            <KpiCard label="Margin" value={`${kpis.margin.toFixed(1)}%`} delta="-0.6%" />
          </div>
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="grid h-full gap-4 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Chart</p>
            <div className="mt-3 h-48 flex-1 rounded-xl border border-border bg-card p-3">
              <div className="flex h-full w-full items-end justify-center gap-1">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="w-4 bg-[linear-gradient(180deg,rgba(251,146,60,0.88),rgba(236,72,153,0.72))] shadow-[0_0_18px_rgba(236,72,153,0.18)] transition-all duration-1000"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Bar/line charts render from real aggregates (no invented rows).
            </p>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">AI Insights</p>
            <div className="mt-3 flex flex-1 flex-col justify-between rounded-xl border border-border bg-card p-4 text-sm">
              <div className="space-y-3">
                <div className="ml-auto max-w-[90%] border border-border bg-background px-3 py-2 text-xs text-foreground">
                  {USER_PROMPTS[conversationIndex]}
                </div>
                <div className="max-w-[95%] border border-border bg-white/70 px-3 py-2 text-sm text-foreground">
                  {isTyping ? (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <span className="h-1.5 w-1.5 animate-pulse bg-muted" />
                      <span className="h-1.5 w-1.5 animate-pulse bg-muted [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse bg-muted [animation-delay:240ms]" />
                      <span className="ml-1 text-xs">AI is typing...</span>
                    </span>
                  ) : (
                    AI_RESPONSES[conversationIndex]
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                Live-style chat preview with real-time assistant response motion.
              </p>
            </div>
            <p className="mt-3 text-xs text-muted">Chat is embedded in-app (not a separate page).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{delta}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight transition-all duration-1000">{value}</p>
    </div>
  );
}


import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  CHART_TOP_N,
  MAX_ROWS_LIMIT,
  TIMESERIES_MAX_POINTS,
} from '../common/constants';

export type ChartKind = 'line' | 'bar' | 'pie' | 'table';

export interface ChartSpec {
  id: string;
  title: string;
  kind: ChartKind;
  xKey: string;
  yKey?: string;
  series?: { name: string; points: { x: string | number; y: number }[] };
  categories?: { name: string; value: number }[];
  note?: string;
}

export interface KpiSpec {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
}

export interface ReportPayload {
  datasetId: string;
  datasetName: string;
  groupId: string;
  tableUsed: string;
  rowCount: number;
  rowCap: number;
  columns: { name: string; dataType?: string }[];
  kpis: KpiSpec[];
  charts: ChartSpec[];
  /** Aggregated / downsampled only — never full raw dump for huge sets */
  sampleRows: Record<string, unknown>[];
  sampleRowsTruncated?: boolean;
  stats: {
    numericSummaries: Record<string, { min: number; max: number; sum: number; avg: number }>;
    nullRate: Record<string, number>;
  };
  generatedAt: string;
}

@Injectable()
export class AggregationService {
  checksum(columns: { name: string }[], rowCount: number): string {
    const h = createHash('sha256');
    h.update(columns.map((c) => c.name).sort().join('|'));
    h.update(String(rowCount));
    return h.digest('hex').slice(0, 16);
  }

  buildReportPayload(params: {
    datasetId: string;
    datasetName: string;
    groupId: string;
    tableUsed: string;
    columns: { name: string; dataType?: string }[];
    rows: Record<string, unknown>[];
  }): ReportPayload {
    const { columns, rows } = params;
    const rowCount = rows.length;
    const capped = rowCount >= MAX_ROWS_LIMIT;

    const colNames = columns.map((c) => c.name);
    const dateCol = this.pickDateColumn(colNames, rows);
    const numericCols = this.pickNumericColumns(colNames, rows, dateCol);
    const categoryCols = this.pickCategoryColumns(colNames, rows, dateCol, numericCols[0]).slice(0, 2);

    const numericSummaries: ReportPayload['stats']['numericSummaries'] = {};
    const nullRate: Record<string, number> = {};
    for (const c of colNames) {
      nullRate[c] = this.nullFraction(rows, c);
      const nums = rows
        .map((r) => r[c])
        .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
      if (nums.length) {
        const sum = nums.reduce((a, b) => a + b, 0);
        numericSummaries[c] = {
          min: Math.min(...nums),
          max: Math.max(...nums),
          sum,
          avg: sum / nums.length,
        };
      }
    }

    const kpis: KpiSpec[] = [];
    if (numericCols[0] && numericSummaries[numericCols[0]]) {
      const n = numericSummaries[numericCols[0]];
      kpis.push({
        id: 'kpi-primary',
        label: `Total ${numericCols[0]}`,
        value: this.formatNumber(n.sum),
        hint: `Avg ${this.formatNumber(n.avg)} · Min–Max ${this.formatNumber(n.min)}–${this.formatNumber(n.max)}`,
      });
    }
    kpis.push({
      id: 'kpi-rows',
      label: 'Rows analyzed',
      value: rowCount,
      hint: capped ? `Capped at ${MAX_ROWS_LIMIT} for performance` : 'Within row limit',
    });

    const charts: ChartSpec[] = [];

    // Build multiple trend charts from available measures so more source detail is visible.
    if (dateCol && numericCols.length) {
      for (const measure of numericCols.slice(0, 3)) {
        const points = this.buildTimeSeries(rows, dateCol, measure);
        if (!points.length) continue;
        const down = this.downsample(points, TIMESERIES_MAX_POINTS);
        charts.push({
          id: `chart-trend-${measure}`,
          title: `${measure} over ${dateCol}`,
          kind: 'line',
          xKey: dateCol,
          yKey: measure,
          series: {
            name: measure,
            points: down,
          },
        });
      }
    }

    if (categoryCols.length && numericCols.length) {
      for (const categoryCol of categoryCols) {
        for (const measure of numericCols.slice(0, 2)) {
          const agg = this.aggregateCategory(rows, categoryCol, measure, CHART_TOP_N);
          if (!agg.length) continue;
          charts.push({
            id: `chart-cat-${categoryCol}-${measure}`,
            title: `${measure} by ${categoryCol} (Top ${CHART_TOP_N})`,
            kind: agg.length <= 6 ? 'pie' : 'bar',
            xKey: categoryCol,
            yKey: measure,
            categories: agg,
            note:
              agg.some((a) => a.name === 'Other') && rowCount > CHART_TOP_N
                ? `Other aggregates remaining categories beyond top ${CHART_TOP_N}`
                : undefined,
          });
        }
      }
    }

    if (!charts.length && numericCols.length >= 2) {
      const c1 = numericCols[0];
      const c2 = numericCols[1];
      const scatter = rows
        .map((r) => ({
          x: Number(r[c1]),
          y: Number(r[c2]),
        }))
        .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y))
        .slice(0, 500);
      charts.push({
        id: 'chart-rel',
        title: `${c2} vs ${c1}`,
        kind: 'line',
        xKey: c1,
        yKey: c2,
        series: {
          name: c2,
          points: scatter.map((p) => ({ x: p.x, y: p.y })),
        },
      });
    }

    const sampleLimit = 1000;
    const sampleRows = rows.slice(0, Math.min(sampleLimit, rows.length));
    const sampleRowsTruncated = rows.length > sampleLimit;

    return {
      datasetId: params.datasetId,
      datasetName: params.datasetName,
      groupId: params.groupId,
      tableUsed: params.tableUsed,
      rowCount,
      rowCap: MAX_ROWS_LIMIT,
      columns,
      kpis,
      charts,
      sampleRows,
      sampleRowsTruncated,
      stats: { numericSummaries, nullRate },
      generatedAt: new Date().toISOString(),
    };
  }

  private nullFraction(rows: Record<string, unknown>[], col: string): number {
    if (!rows.length) return 0;
    let n = 0;
    for (const r of rows) {
      const v = r[col];
      if (v === null || v === undefined || v === '') n++;
    }
    return n / rows.length;
  }

  private pickDateColumn(
    names: string[],
    rows: Record<string, unknown>[],
  ): string | undefined {
    const hints = /date|time|timestamp|month|year|day/i;
    for (const n of names) {
      if (hints.test(n)) {
        const ok = rows.some((r) => this.isDateLike(r[n]));
        if (ok) return n;
      }
    }
    for (const n of names) {
      if (rows.some((r) => this.isDateLike(r[n]))) return n;
    }
    return undefined;
  }

  private isDateLike(v: unknown): boolean {
    if (v instanceof Date && !Number.isNaN(v.getTime())) return true;
    if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return true;
    return false;
  }

  private pickNumericColumns(
    names: string[],
    rows: Record<string, unknown>[],
    skip?: string,
  ): string[] {
    const out: string[] = [];
    for (const n of names) {
      if (n === skip) continue;
      const nums = rows.filter((r) => typeof r[n] === 'number' && !Number.isNaN(r[n] as number));
      if (nums.length > rows.length * 0.3) out.push(n);
    }
    return out.slice(0, 8);
  }

  private pickCategoryColumns(
    names: string[],
    rows: Record<string, unknown>[],
    skipDate?: string,
    skipMeasure?: string,
  ): string[] {
    const scored: { name: string; score: number }[] = [];
    for (const n of names) {
      const vals = rows.map((r) => r[n]).filter((v) => v !== null && v !== undefined && v !== '');
      if (!vals.length) continue;
      if (n === skipDate || n === skipMeasure) continue;

      const numericRatio = vals.filter((v) => typeof v === 'number').length / vals.length;
      // keep mostly non-numeric dimensions
      if (numericRatio > 0.6) continue;

      const stringRatio = vals.filter((v) => typeof v === 'string').length / vals.length;
      const distinct = new Set(vals.map((v) => String(v)));
      const d = distinct.size;
      if (!(d > 1 && d <= Math.min(500, rows.length) && d < rows.length * 0.95)) continue;

      // Prefer useful mid-cardinality dimensions, but purely from data shape (no name rules).
      const target = Math.max(3, Math.sqrt(rows.length));
      const cardinalityFit = 1 / (1 + Math.abs(d - target));
      const score = stringRatio * 0.6 + cardinalityFit * 0.4;
      scored.push({ name: n, score });
    }
    return scored.sort((a, b) => b.score - a.score).map((s) => s.name);
  }

  private buildTimeSeries(
    rows: Record<string, unknown>[],
    dateCol: string,
    measure: string,
  ): { x: string | number; y: number }[] {
    const parsed: { t: number; v: number }[] = [];
    for (const r of rows) {
      const dv = r[dateCol];
      const mv = r[measure];
      if (typeof mv !== 'number' || Number.isNaN(mv)) continue;
      const t = dv instanceof Date ? dv.getTime() : Date.parse(String(dv));
      if (Number.isNaN(t)) continue;
      parsed.push({ t, v: mv });
    }
    parsed.sort((a, b) => a.t - b.t);
    return parsed.map((p) => ({
      x: new Date(p.t).toISOString().slice(0, 10),
      y: p.v,
    }));
  }

  private downsample(
    points: { x: string | number; y: number }[],
    maxPoints: number,
  ): { x: string | number; y: number }[] {
    if (points.length <= maxPoints) return points;
    const step = Math.ceil(points.length / maxPoints);
    const out: { x: string | number; y: number }[] = [];
    for (let i = 0; i < points.length; i += step) {
      const slice = points.slice(i, i + step);
      const y = slice.reduce((a, p) => a + p.y, 0) / slice.length;
      out.push({ x: slice[Math.floor(slice.length / 2)].x, y });
    }
    return out;
  }

  private aggregateCategory(
    rows: Record<string, unknown>[],
    cat: string,
    measure: string,
    topN: number,
  ): { name: string; value: number }[] {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = String(r[cat] ?? '—');
      const v = r[measure];
      if (typeof v !== 'number' || Number.isNaN(v)) continue;
      map.set(k, (map.get(k) ?? 0) + v);
    }
    const arr = [...map.entries()].sort((a, b) => b[1] - a[1]);
    if (arr.length <= topN) {
      return arr.map(([name, value]) => ({ name, value }));
    }
    const head = arr.slice(0, topN - 1);
    const rest = arr.slice(topN - 1).reduce((s, [, v]) => s + v, 0);
    return [...head.map(([name, value]) => ({ name, value })), { name: 'Other', value: rest }];
  }

  private formatNumber(n: number): string {
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

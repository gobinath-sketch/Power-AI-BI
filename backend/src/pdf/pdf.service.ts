import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';
import type { ReportPayload } from '../reports/aggregation.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly config: ConfigService) {}

  async renderReportPdf(payload: ReportPayload, title: string): Promise<Buffer> {
    const html = this.buildHtml(payload, title);
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      // Wait for charts to finish drawing.
      await page.waitForFunction('window.__PDF_READY__ === true', { timeout: 20000 });
      const buf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });
      return Buffer.from(buf);
    } catch (e) {
      this.logger.error('Puppeteer PDF failed', e);
      throw e;
    } finally {
      if (browser) await browser.close();
    }
  }

  private buildHtml(payload: ReportPayload, title: string): string {
    const kpiCards = payload.kpis
      .map(
        (k) => `
        <div class="kpi">
          <div class="kpiLabel">${escapeHtml(String(k.label))}</div>
          <div class="kpiValue">${escapeHtml(String(k.value))}</div>
          <div class="kpiHint">${k.hint ? escapeHtml(k.hint) : ''}</div>
        </div>`,
      )
      .join('');

    const chartBlocks = payload.charts
      .map((c, idx) => {
        const canvasId = `chart_${idx}`;
        return `
          <div class="card">
            <div class="cardTitle">${escapeHtml(c.title)}</div>
            ${c.note ? `<div class="note">${escapeHtml(c.note)}</div>` : ''}
            <canvas id="${canvasId}" height="240"></canvas>
          </div>`;
      })
      .join('');

    const chartsJson = JSON.stringify(payload.charts ?? []);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>
      :root{--bg:#fff;--muted:#6b7280;--border:#e5e7eb;--ink:#111827;}
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg);padding:0 8px;}
      h1{font-size:22px;font-weight:650;margin:0}
      .sub{color:var(--muted);font-size:12px;margin-top:6px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
      .kpi{border:1px solid var(--border);border-radius:14px;padding:12px}
      .kpiLabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600}
      .kpiValue{font-size:20px;font-weight:700;margin-top:6px}
      .kpiHint{font-size:11px;color:var(--muted);margin-top:4px;min-height:14px}
      .sectionTitle{font-size:13px;font-weight:700;margin-top:22px;margin-bottom:10px}
      .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .card{border:1px solid var(--border);border-radius:16px;padding:12px}
      .cardTitle{font-size:12px;font-weight:700;margin-bottom:6px}
      .note{font-size:11px;color:var(--muted);margin-bottom:6px}
      .footer{margin-top:18px;color:var(--muted);font-size:11px}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    </head><body>
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">Generated ${escapeHtml(payload.generatedAt)} · ${payload.rowCount} rows · source ${escapeHtml(payload.tableUsed)}</div>

    <div class="sectionTitle">KPIs</div>
    <div class="grid">${kpiCards}</div>

    <div class="sectionTitle">Charts</div>
    <div class="cards">${chartBlocks || '<div class="card"><div class="cardTitle">No charts</div><div class="note">No numeric/time/category columns detected.</div></div>'}</div>

    <div class="footer">AI-Powered Power BI Analytics — PDF export</div>

    <script>
      const charts = ${chartsJson};
      function makeLine(ctx, c){
        const pts = (c.series && c.series.points) ? c.series.points : [];
        return new Chart(ctx, {
          type: 'line',
          data: { labels: pts.map(p=>String(p.x)), datasets: [{ label: c.yKey || 'value', data: pts.map(p=>Number(p.y)), borderColor:'#111827', borderWidth:2, pointRadius:0, tension:0.25 }]},
          options: { responsive:true, animation:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ maxTicksLimit:8 }}, y:{ ticks:{ maxTicksLimit:6 }}}}
        });
      }
      function makeBar(ctx, c){
        const cats = c.categories || [];
        return new Chart(ctx, {
          type:'bar',
          data:{ labels: cats.map(x=>String(x.name)), datasets:[{ data: cats.map(x=>Number(x.value)), backgroundColor:'#111827' }]},
          options:{ responsive:true, animation:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ maxTicksLimit:10 }}, y:{ ticks:{ maxTicksLimit:6 }}}}
        });
      }
      function makePie(ctx, c){
        const cats = c.categories || [];
        return new Chart(ctx, {
          type:'doughnut',
          data:{ labels: cats.map(x=>String(x.name)), datasets:[{ data: cats.map(x=>Number(x.value)), backgroundColor:['#111827','#374151','#6b7280','#9ca3af','#d1d5db','#e5e7eb'] }]},
          options:{ responsive:true, animation:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10 }}}}
        });
      }
      const rendered = [];
      charts.forEach((c, idx)=>{
        const el = document.getElementById('chart_' + idx);
        if(!el) return;
        const ctx = el.getContext('2d');
        if(!ctx) return;
        if(c.kind === 'line') rendered.push(makeLine(ctx, c));
        else if(c.kind === 'bar') rendered.push(makeBar(ctx, c));
        else if(c.kind === 'pie') rendered.push(makePie(ctx, c));
        else {
          // fallback: bar if categories, else line if series
          if(c.categories) rendered.push(makeBar(ctx, c));
          else if(c.series) rendered.push(makeLine(ctx, c));
        }
      });
      // signal puppeteer
      window.__PDF_READY__ = true;
    </script>
    </body></html>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

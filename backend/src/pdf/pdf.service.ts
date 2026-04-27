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
    const generatedAt = escapeHtml(String(payload.generatedAt ?? ''));
    const source = escapeHtml(String(payload.tableUsed ?? 'Unknown source'));
    const rowCount = Number(payload.rowCount ?? 0);
    const insightSummary =
      typeof (payload as ReportPayload & { insightsSummary?: string }).insightsSummary === 'string'
        ? escapeHtml(
            String((payload as ReportPayload & { insightsSummary?: string }).insightsSummary),
          )
        : '';

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
            <div class="cardHeader">
              <div class="cardTitle">${escapeHtml(c.title)}</div>
              <div class="chip">${escapeHtml(String(c.kind ?? 'chart').toUpperCase())}</div>
            </div>
            ${c.note ? `<div class="note">${escapeHtml(c.note)}</div>` : ''}
            <div class="chartWrap">
              <canvas id="${canvasId}"></canvas>
            </div>
          </div>`;
      })
      .join('');

    const chartsJson = JSON.stringify(payload.charts ?? []);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>
      :root{
        --bg:#f8fafc;
        --surface:#ffffff;
        --surface-soft:#f8fafc;
        --muted:#6b7280;
        --border:#e5e7eb;
        --ink:#111827;
        --accent:#2563eb;
      }
      *{box-sizing:border-box}
      body{
        font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
        color:var(--ink);
        background:var(--bg);
        margin:0;
        padding:0;
      }
      .page{
        padding:8px 4px 0;
      }
      .hero{
        background:linear-gradient(135deg,#ffffff 0%,#f8fbff 55%,#eef5ff 100%);
        border:1px solid var(--border);
        border-radius:20px;
        padding:20px 22px;
      }
      .heroTop{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:16px;
      }
      h1{font-size:24px;font-weight:750;margin:0;line-height:1.15}
      .sub{color:var(--muted);font-size:12px;margin-top:6px;line-height:1.5}
      .heroMeta{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:14px;
      }
      .badge,.chip{
        display:inline-flex;
        align-items:center;
        border:1px solid var(--border);
        border-radius:999px;
        background:rgba(255,255,255,0.9);
        padding:5px 10px;
        font-size:10px;
        font-weight:700;
        letter-spacing:.06em;
        color:#374151;
      }
      .badge.primary{
        border-color:#bfdbfe;
        color:#1d4ed8;
        background:#eff6ff;
      }
      .summary{
        margin-top:14px;
        border:1px solid #dbeafe;
        background:#f8fbff;
        border-radius:16px;
        padding:12px 14px;
      }
      .summaryTitle{
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:#2563eb;
        font-weight:700;
      }
      .summaryBody{
        font-size:12px;
        color:#334155;
        line-height:1.55;
        margin-top:6px;
      }
      .sectionTitle{
        font-size:13px;
        font-weight:800;
        margin-top:22px;
        margin-bottom:10px;
        color:#111827;
      }
      .grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:16px;
      }
      .kpi{
        border:1px solid var(--border);
        border-radius:18px;
        padding:14px 16px;
        background:var(--surface);
        box-shadow:0 10px 25px rgba(15,23,42,.04);
        break-inside:avoid;
      }
      .kpiLabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700}
      .kpiValue{font-size:28px;font-weight:800;margin-top:8px;line-height:1.1}
      .kpiHint{font-size:11px;color:var(--muted);margin-top:6px;min-height:14px;line-height:1.45}
      .cards{
        display:grid;
        grid-template-columns:1fr;
        gap:14px;
        align-items:start;
      }
      .card{
        border:1px solid var(--border);
        border-radius:20px;
        padding:14px;
        background:var(--surface);
        box-shadow:0 14px 28px rgba(15,23,42,.04);
        break-inside:avoid;
        min-height:360px;
        overflow:hidden;
      }
      .cardHeader{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-bottom:6px;
      }
      .cardTitle{font-size:13px;font-weight:800;margin:0}
      .note{font-size:11px;color:var(--muted);margin-bottom:8px;line-height:1.45}
      .chartWrap{
        background:var(--surface-soft);
        border:1px solid #edf2f7;
        border-radius:16px;
        padding:10px;
        height:290px;
        overflow:hidden;
      }
      .chartWrap canvas{
        display:block;
        width:100% !important;
        height:100% !important;
        max-width:100%;
      }
      .footer{
        margin-top:18px;
        color:var(--muted);
        font-size:11px;
        display:flex;
        justify-content:space-between;
        gap:12px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    </head><body>
    <div class="page">
      <div class="hero">
        <div class="heroTop">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <div class="sub">Generated ${generatedAt} · ${rowCount} rows analyzed · source ${source}</div>
          </div>
          <div class="badge primary">PDF EXPORT</div>
        </div>
        <div class="heroMeta">
          <div class="badge">EXECUTIVE REPORT</div>
          <div class="badge">CLEAN LAYOUT</div>
          <div class="badge">CHART RENDERED</div>
        </div>
        ${
          insightSummary
            ? `<div class="summary"><div class="summaryTitle">AI Summary</div><div class="summaryBody">${insightSummary}</div></div>`
            : ''
        }
      </div>

      <div class="sectionTitle">Key Performance Indicators</div>
      <div class="grid">${kpiCards}</div>

      <div class="sectionTitle">Charts & Trends</div>
      <div class="cards">${chartBlocks || '<div class="card"><div class="cardHeader"><div class="cardTitle">No charts</div></div><div class="note">No numeric/time/category columns detected.</div></div>'}</div>

      <div class="footer">
        <span>AI-Powered Power BI Analytics</span>
        <span>Prepared for download</span>
      </div>
    </div>

    <script>
      const charts = ${chartsJson};
      function makeLine(ctx, c){
        const pts = (c.series && c.series.points) ? c.series.points : [];
        return new Chart(ctx, {
          type: 'line',
          data: { labels: pts.map(p=>String(p.x)), datasets: [{ label: c.yKey || 'value', data: pts.map(p=>Number(p.y)), borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.10)', fill:true, borderWidth:2.5, pointRadius:0, tension:0.28 }]},
          options: {
            responsive:true,
            maintainAspectRatio:false,
            animation:false,
            plugins:{ legend:{ display:false }},
            scales:{
              x:{
                grid:{ color:'rgba(226,232,240,0.9)' },
                ticks:{ autoSkip:true, maxTicksLimit:6, maxRotation:0, color:'#6b7280', font:{ size:10 }}
              },
              y:{ beginAtZero:true, grid:{ color:'rgba(226,232,240,0.9)' }, ticks:{ autoSkip:true, maxTicksLimit:5, color:'#6b7280', font:{ size:10 }}}
            }
          }
        });
      }
      function makeBar(ctx, c){
        const cats = c.categories || [];
        return new Chart(ctx, {
          type:'bar',
          data:{ labels: cats.map(x=>String(x.name)), datasets:[{ data: cats.map(x=>Number(x.value)), backgroundColor:'#2563eb', borderRadius:8, maxBarThickness:40 }]},
          options:{
            responsive:true,
            maintainAspectRatio:false,
            animation:false,
            plugins:{ legend:{ display:false }},
            scales:{
              x:{ grid:{ display:false }, ticks:{ autoSkip:true, maxTicksLimit:8, maxRotation:0, color:'#6b7280', font:{ size:10 }},
              },
              y:{ beginAtZero:true, grid:{ color:'rgba(226,232,240,0.9)' }, ticks:{ autoSkip:true, maxTicksLimit:5, color:'#6b7280', font:{ size:10 }}}
            }
          }
        });
      }
      function makePie(ctx, c){
        const cats = c.categories || [];
        return new Chart(ctx, {
          type:'doughnut',
          data:{ labels: cats.map(x=>String(x.name)), datasets:[{ data: cats.map(x=>Number(x.value)), borderWidth:0, backgroundColor:['#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe'] }]},
          options:{
            responsive:true,
            maintainAspectRatio:false,
            cutout:'58%',
            animation:false,
            plugins:{
              legend:{
                position:'bottom',
                labels:{ boxWidth:10, boxHeight:10, usePointStyle:true, pointStyle:'rectRounded', color:'#4b5563', padding:12, font:{ size:10 }}
              }
            }
          }
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

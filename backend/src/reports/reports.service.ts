import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { PowerBiService } from '../powerbi/powerbi.service';
import { AggregationService } from './aggregation.service';
import { AiService } from '../ai/ai.service';
import { REFRESH_WAIT_MS } from '../common/constants';
import { JobsService } from '../jobs/jobs.service';
import { DatabaseService } from '../database/database.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly pbi: PowerBiService,
    private readonly agg: AggregationService,
    private readonly ai: AiService,
    private readonly config: ConfigService,
    private readonly jobs: JobsService,
    private readonly database: DatabaseService,
    private readonly uploads: UploadsService,
  ) {}

  private get db(): SupabaseClient {
    return this.database.client;
  }

  async generateReport(
    userId: string,
    dto: {
      title: string;
      datasetId: string;
      datasetName?: string;
      groupId?: string;
      waitForRefresh?: boolean;
    },
  ) {
    const groupId =
      dto.groupId ?? this.config.getOrThrow<string>('POWERBI_GROUP_ID');

    const refresh = await this.pbi.getLatestRefreshStatus(dto.datasetId, groupId);
    let refreshWarning: string | undefined;
    if (refresh.status === 'InProgress') {
      refreshWarning =
        'Latest refresh is in progress — showing last available model data.';
      if (dto.waitForRefresh) {
        const w = await this.pbi.waitForRefreshComplete(
          dto.datasetId,
          groupId,
          REFRESH_WAIT_MS,
        );
        if (w.status === 'InProgress' || w.status === 'Unknown') {
          refreshWarning =
            'Refresh still running after wait — using last available data.';
        }
      }
    }
    if (refresh.status === 'Failed') {
      refreshWarning =
        'Last dataset refresh failed — verify gateway and data source. Using last successful data.';
    }

    const dsList = await this.pbi.listDatasets(groupId);
    const dsMeta = dsList.find((d) => d.id === dto.datasetId);
    const datasetName = dto.datasetName ?? dsMeta?.name ?? 'Dataset';

    const sample = await this.pbi.fetchDatasetSample(dto.datasetId, groupId);
    const columns = sample.columns.map((c) => ({
      name: c.name,
      dataType: c.dataType,
    }));
    const checksum = this.agg.checksum(columns, sample.rows.length);

    const payload = this.agg.buildReportPayload({
      datasetId: dto.datasetId,
      datasetName,
      groupId,
      tableUsed: sample.tableUsed,
      columns,
      rows: sample.rows as Record<string, unknown>[],
    });

    const insights = await this.ai.generateReportInsights(payload, checksum);

    const { data, error } = await this.db
      .from('reports')
      .insert({
        user_id: userId,
        title: dto.title,
        dataset_id: dto.datasetId,
        dataset_name: datasetName,
        group_id: groupId,
        payload,
        insights,
        row_count: payload.rowCount,
        schema_checksum: checksum,
        refresh_warning: refreshWarning ?? null,
        last_refreshed_at: refresh.endTime ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getReport(userId: string, reportId: string) {
    const { data, error } = await this.db
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();
    if (error || !data) throw new NotFoundException('Report not found');
    return data;
  }

  async listReports(userId: string) {
    const { data, error } = await this.db
      .from('reports')
      .select(
        'id, title, dataset_id, dataset_name, created_at, row_count, refresh_warning',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async queuePdf(userId: string, reportId: string) {
    await this.getReport(userId, reportId);
    return this.jobs.enqueuePdfJob(userId, reportId);
  }

  async exportHtml(userId: string, reportId: string): Promise<{ filename: string; html: string }> {
    const report = await this.getReport(userId, reportId);
    const title = String((report as any).title ?? 'Report');
    const payload = (report as any).payload ?? {};
    const insights = (report as any).insights ?? null;

    const safe = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;');

    const kpis = Array.isArray(payload?.kpis) ? payload.kpis : [];
    const charts = Array.isArray(payload?.charts) ? payload.charts : [];
    const sampleRows = Array.isArray(payload?.sampleRows) ? payload.sampleRows : [];
    const columns = Array.isArray(payload?.columns) ? payload.columns : [];

    const dataJson = JSON.stringify({ charts, kpis, sampleRows, columns, insights, meta: { generatedAt: payload?.generatedAt } });
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safe(title)}</title>
  <style>
    :root{--bg:#fff;--muted:#6b7280;--border:#e5e7eb;--ink:#111827;}
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink);margin:0;padding:18px;height:100vh;overflow:hidden}
    h1{margin:0;font-size:22px;font-weight:750}
    .sub{color:var(--muted);font-size:12px;margin-top:6px}
    .row{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}
    .kpi{flex:1 1 220px;border:1px solid var(--border);border-radius:14px;padding:12px}
    .kpiLabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:650}
    .kpiValue{font-size:20px;font-weight:750;margin-top:6px}
    .kpiHint{font-size:11px;color:var(--muted);margin-top:4px;min-height:14px}
    .card{border:1px solid var(--border);border-radius:16px;padding:12px;background:#fff}
    .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    @media (max-width: 900px){.grid2{grid-template-columns:1fr}}
    .title{font-size:12px;font-weight:750;margin:0 0 8px}
    .note{font-size:11px;color:var(--muted);margin:-4px 0 8px}
    .filters{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
    select{border:1px solid var(--border);border-radius:10px;padding:8px 10px;font-size:13px}
    .section{margin-top:22px}
    .dash{display:grid;grid-template-rows:auto auto 1fr;gap:12px;height:calc(100vh - 36px)}
    .chartsWrap{overflow:hidden}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="dash">
    <div>
      <h1>${safe(title)}</h1>
      <div class="sub">Interactive HTML report (offline) · Generated ${safe(String(payload?.generatedAt ?? ''))}</div>
    </div>

    <div class="row" id="kpis"></div>

    <div class="chartsWrap">
      <div class="filters">
        <div>
          <div class="kpiLabel">Slicer</div>
          <select id="filterSelect"></select>
        </div>
        <div class="sub" id="filterHint"></div>
      </div>
      <div class="grid2" id="charts" style="margin-top:10px"></div>
    </div>
  </div>

  <div class="section card" id="insightsCard" style="display:none">
    <p class="title">AI insight</p>
    <div id="insightsBody" class="sub"></div>
  </div>

  <script>
    const DATA = ${dataJson};
    function esc(s){return String(s??'');}
    function isNum(v){return typeof v==='number' && !Number.isNaN(v);}
    function looksDate(v){return typeof v==='string' && !Number.isNaN(Date.parse(v));}

    // KPIs
    const kpiEl = document.getElementById('kpis');
    (DATA.kpis||[]).forEach(k=>{
      const d=document.createElement('div');
      d.className='kpi';
      d.innerHTML = '<div class="kpiLabel">'+esc(k.label)+'</div><div class="kpiValue">'+esc(k.value)+'</div><div class="kpiHint">'+esc(k.hint||'')+'</div>';
      kpiEl.appendChild(d);
    });

    // Insights
    if (DATA.insights && DATA.insights.summary){
      document.getElementById('insightsCard').style.display='block';
      document.getElementById('insightsBody').innerText = DATA.insights.summary;
    }

    const rows = DATA.sampleRows||[];
    const cols = (DATA.columns||[]).map(c=>c.name);

    // Choose slicer column
    let filterCol = null;
    for (const n of cols){
      const vals = rows.map(r=>r[n]).filter(v=>v!==null && v!==undefined);
      if(!vals.length) continue;
      const distinct = new Set(vals.map(v=>String(v)));
      if(distinct.size>=2 && distinct.size<=Math.min(40, vals.length)){ filterCol=n; break; }
    }
    const select = document.getElementById('filterSelect');
    const hint = document.getElementById('filterHint');
    if(!filterCol){
      select.innerHTML = '<option>All</option>';
      hint.innerText = 'No suitable categorical column found.';
    } else {
      const distinct = Array.from(new Set(rows.map(r=>String(r[filterCol]??'—'))));
      select.innerHTML = ['All', ...distinct].map(v=>'<option value="'+v+'">'+v+'</option>').join('');
      hint.innerText = 'Slicer: '+filterCol;
    }

    const chartContainer = document.getElementById('charts');
    const instances = [];

    function renderCharts(filtered){
      chartContainer.innerHTML = '';
      while(instances.length){ try{ instances.pop().destroy(); }catch{} }
      const dateCol = cols.find(n=>filtered.some(r=>looksDate(r[n])));
      const numericCol = cols.find(n=>filtered.filter(r=>isNum(r[n])).length > filtered.length*0.3);
      const charts = [];
      if(dateCol && numericCol){
        const pts = filtered.map(r=>({x:String(r[dateCol]), y:Number(r[numericCol])}))
          .filter(p=>!Number.isNaN(Date.parse(p.x)) && !Number.isNaN(p.y))
          .sort((a,b)=>Date.parse(a.x)-Date.parse(b.x));
        charts.push({ kind:'line', title: numericCol+' over '+dateCol, points: pts });
      }
      if(filterCol && numericCol){
        const m = new Map();
        filtered.forEach(r=>{
          const k=String(r[filterCol]??'—');
          const v=Number(r[numericCol]);
          if(Number.isNaN(v)) return;
          m.set(k,(m.get(k)||0)+v);
        });
        const cats = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12);
        charts.push({ kind: cats.length<=6?'doughnut':'bar', title: numericCol+' by '+filterCol, cats });
      }
      if(!charts.length){
        const d=document.createElement('div');
        d.className='card';
        d.innerHTML='<p class="title">No charts</p><div class="sub">No numeric/time columns detected in the saved sample.</div>';
        chartContainer.appendChild(d);
        return;
      }
      charts.forEach((c, idx)=>{
        const card=document.createElement('div');
        card.className='card';
        card.innerHTML = '<p class="title">'+esc(c.title)+'</p><canvas id="c_'+idx+'" height="210"></canvas>';
        chartContainer.appendChild(card);
        const ctx=document.getElementById('c_'+idx).getContext('2d');
        if(c.kind==='line'){
          instances.push(new Chart(ctx,{type:'line',data:{labels:c.points.map(p=>p.x),datasets:[{data:c.points.map(p=>p.y),borderColor:'#111827',borderWidth:2,pointRadius:0,tension:0.25}]},options:{responsive:true,animation:false,plugins:{legend:{display:false}}}}));
        } else if(c.kind==='bar'){
          instances.push(new Chart(ctx,{
            type:'bar',
            data:{labels:c.cats.map(x=>x[0]),datasets:[{data:c.cats.map(x=>x[1]),backgroundColor:'#111827'}]},
            options:{
              responsive:true,animation:false,plugins:{legend:{display:false}},
              onClick: (_evt, els)=>{ if(!els?.length) return; const i=els[0].index; const label=c.cats[i][0]; if(label && label!=='Other'){ select.value=label; renderCharts(currentFiltered()); } }
            }
          }));
        } else {
          instances.push(new Chart(ctx,{
            type:'doughnut',
            data:{labels:c.cats.map(x=>x[0]),datasets:[{data:c.cats.map(x=>x[1]),backgroundColor:['#111827','#374151','#6b7280','#9ca3af','#d1d5db','#e5e7eb']}]},
            options:{
              responsive:true,animation:false,
              onClick: (_evt, els)=>{ if(!els?.length) return; const i=els[0].index; const label=c.cats[i][0]; if(label && label!=='Other'){ select.value=label; renderCharts(currentFiltered()); } }
            }
          }));
        }
      });
    }

    function currentFiltered(){
      const v = select.value || 'All';
      if(!filterCol || v==='All') return rows;
      return rows.filter(r=>String(r[filterCol]??'—')===v);
    }
    select.addEventListener('change', ()=>renderCharts(currentFiltered()));
    renderCharts(currentFiltered());
  </script>
</body>
</html>`;

    const filename = `${title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'report'}.html`;
    return { filename, html };
  }

  /**
   * End-to-end test path: ingest an Excel upload and run the same pipeline.
   * This is explicitly marked as simulated source and does NOT affect Power BI logic.
   */
  async generateFromUpload(
    userId: string,
    dto: { title: string; filename: string; sheetName?: string },
  ) {
    const parsed = this.uploads.parseXlsx(dto.filename, dto.sheetName);
    const datasetId = `upload:${dto.filename}`;
    const datasetName = `Upload · ${dto.filename}`;
    const groupId = this.config.getOrThrow<string>('POWERBI_GROUP_ID');

    const checksum = this.agg.checksum(parsed.columns, parsed.rows.length);
    const payload = this.agg.buildReportPayload({
      datasetId,
      datasetName,
      groupId,
      tableUsed: `sheet:${parsed.sheetName}`,
      columns: parsed.columns,
      rows: parsed.rows,
    });

    const insights = await this.ai.generateReportInsights(payload, checksum);

    const { data, error } = await this.db
      .from('reports')
      .insert({
        user_id: userId,
        title: dto.title,
        dataset_id: datasetId,
        dataset_name: datasetName,
        group_id: groupId,
        payload,
        insights,
        row_count: payload.rowCount,
        schema_checksum: checksum,
        refresh_warning: 'Simulated source (Excel upload) — Power BI permissions not used.',
        last_refreshed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

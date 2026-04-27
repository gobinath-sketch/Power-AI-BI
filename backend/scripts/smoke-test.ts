import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type Env = {
  API_BASE: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DEFAULT_REPORT_EMAIL: string;
  SMOKE_EMAIL?: string;
  SMOKE_PASSWORD?: string;
};

function requireEnv(): Env {
  const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
  const DEFAULT_REPORT_EMAIL = process.env.DEFAULT_REPORT_EMAIL!;
  const SMOKE_EMAIL = process.env.SMOKE_EMAIL;
  const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DEFAULT_REPORT_EMAIL) {
    throw new Error(
      'Missing env for smoke test. Need SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_REPORT_EMAIL',
    );
  }
  return {
    API_BASE,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    DEFAULT_REPORT_EMAIL,
    SMOKE_EMAIL,
    SMOKE_PASSWORD,
  };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const env = requireEnv();
  const http = axios.create({
    baseURL: env.API_BASE.replace(/\/$/, ''),
    timeout: 120_000,
    validateStatus: () => true,
  });

  const email = env.SMOKE_EMAIL ?? `smoke.test.${Date.now()}@gmail.com`;
  const password = env.SMOKE_PASSWORD ?? `Pw!${randomUUID()}Aa1`;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Prefer existing credentials (avoids sign-up rate limits).
  if (env.SMOKE_EMAIL && env.SMOKE_PASSWORD) {
    const signIn = await supabase.auth.signInWithPassword({
      email: env.SMOKE_EMAIL,
      password: env.SMOKE_PASSWORD,
    });
    if (signIn.error) {
      throw new Error(`Supabase sign-in failed: ${signIn.error.message}`);
    }
  } else {
    // Create a user (or fall back to sign-in if the project disallows signups).
    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error) {
      // Try sign-in (some projects disable sign-ups)
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        throw new Error(
          `Supabase auth failed. If you hit rate limits, set SMOKE_EMAIL + SMOKE_PASSWORD in backend/.env. Details: ${signUp.error.message}; ${signIn.error.message}`,
        );
      }
    }
  }
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) {
    throw new Error(
      'No Supabase session. If email confirmation is enabled, disable it for smoke tests or create a real user and set its token.',
    );
  }
  const token = session.access_token;

  const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (!cond) {
      // eslint-disable-next-line no-console
      console.error(`✗ ${name}`, extra ?? '');
      process.exitCode = 1;
    } else {
      // eslint-disable-next-line no-console
      console.log(`✓ ${name}`);
    }
  };

  // Health
  const health = await http.get('/health');
  ok('GET /health', health.status === 200 && health.data?.status === 'ok', health.data);

  // Auth session verify
  const sessionRes = await http.get('/auth/session', {
    headers: { Authorization: `Bearer ${token}` },
  });
  ok('GET /auth/session', sessionRes.status === 200 && sessionRes.data?.user?.id, sessionRes.data);

  // Datasets
  const datasetsRes = await http.get('/datasets', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const datasetsOk = datasetsRes.status === 200 && Array.isArray(datasetsRes.data);
  ok('GET /datasets', datasetsOk, datasetsRes.data);
  const dataset = datasetsOk ? (datasetsRes.data as any[])[0] : null;

  // If Power BI is not authorized, fall back to Excel upload pipeline to validate end-to-end system.
  const useUploadFallback = !dataset?.id;
  const uploadFilename = process.env.SMOKE_XLSX_FILENAME || 'pb dt 2.xlsx';
  let reportId: string | undefined;

  if (!useUploadFallback) {
    // Schema/tables
    const schemaRes = await http.get(`/datasets/${dataset.id}/schema`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ok(
      'GET /datasets/:id/schema',
      schemaRes.status === 200 && Array.isArray(schemaRes.data),
      schemaRes.data,
    );

    // Refresh status
    const refreshRes = await http.get(`/datasets/${dataset.id}/refresh-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ok(
      'GET /datasets/:id/refresh-status',
      refreshRes.status === 200 && typeof refreshRes.data?.status === 'string',
      refreshRes.data,
    );

    // Generate report
    const genRes = await http.post(
      '/reports/generate',
      {
        title: 'Smoke test report',
        datasetId: dataset.id,
        datasetName: dataset.name,
        waitForRefresh: false,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    ok('POST /reports/generate', genRes.status === 201 || genRes.status === 200, genRes.data);
    reportId = genRes.data?.id;
  } else {
    // Upload fallback
    const genRes = await http.post(
      '/reports/generate-upload',
      { title: 'Smoke test (upload)', filename: uploadFilename },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    ok(
      'POST /reports/generate-upload',
      genRes.status === 201 || genRes.status === 200,
      genRes.data,
    );
    reportId = genRes.data?.id;
  }

  if (!reportId) throw new Error('Report generation did not return id');

  // List reports
  const listReports = await http.get('/reports', {
    headers: { Authorization: `Bearer ${token}` },
  });
  ok('GET /reports', listReports.status === 200 && Array.isArray(listReports.data), listReports.data);

  // Get report
  const getReport = await http.get(`/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  ok('GET /reports/:id', getReport.status === 200 && getReport.data?.id === reportId, getReport.data);

  // Chat query (with report context)
  const chatRes = await http.post(
    '/chat/query',
    { message: 'What are the main KPIs and any anomalies?', reportId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  ok(
    'POST /chat/query',
    chatRes.status === 201 || chatRes.status === 200,
    chatRes.data,
  );

  // Email test
  const emailRes = await http.post(
    '/email/test',
    { to: env.DEFAULT_REPORT_EMAIL },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  ok(
    'POST /email/test',
    emailRes.status === 201 || emailRes.status === 200,
    emailRes.data,
  );

  // Create schedule
  const schedCreate = await http.post(
    '/schedules',
    {
      title: 'Smoke schedule',
      datasetId: useUploadFallback ? `upload:${uploadFilename}` : dataset.id,
      datasetName: useUploadFallback ? `Upload · ${uploadFilename}` : dataset.name,
      frequency: 'daily',
      hourUtc: 8,
      recipientEmail: env.DEFAULT_REPORT_EMAIL,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  ok(
    'POST /schedules',
    schedCreate.status === 201 || schedCreate.status === 200,
    schedCreate.data,
  );
  const scheduleId = schedCreate.data?.id;

  const schedList = await http.get('/schedules', {
    headers: { Authorization: `Bearer ${token}` },
  });
  ok('GET /schedules', schedList.status === 200 && Array.isArray(schedList.data), schedList.data);

  // PDF job
  const pdfJob = await http.post(
    `/reports/${reportId}/pdf`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  ok('POST /reports/:id/pdf', pdfJob.status === 201 || pdfJob.status === 200, pdfJob.data);
  const jobId = pdfJob.data?.jobId;
  if (!jobId) throw new Error('PDF job did not return jobId');

  let pdfReady = false;
  for (let i = 0; i < 45; i++) {
    await sleep(2000);
    const job = await http.get(`/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (job.status !== 200) continue;
    if (job.data?.status === 'completed') {
      pdfReady = true;
      break;
    }
    if (job.data?.status === 'failed') break;
  }
  ok('PDF job completes', pdfReady, { jobId });
  if (pdfReady) {
    const dl = await http.get(`/jobs/${jobId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });
    ok('GET /jobs/:id/download', dl.status === 200 && dl.headers['content-type']?.includes('pdf'), {
      status: dl.status,
      contentType: dl.headers['content-type'],
      bytes: dl.data?.byteLength,
    });
  }

  // Cleanup schedule
  if (scheduleId) {
    const del = await http.delete(`/schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ok('DELETE /schedules/:id', del.status === 200, del.data);
  }

  if (process.exitCode) {
    throw new Error('Smoke test had failures. See logs above.');
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


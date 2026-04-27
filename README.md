# AI-Powered Power BI Analytics Platform

Monorepo layout:

- `backend/` — NestJS API (Power BI Azure AD, OpenAI, Resend, Puppeteer PDF, Supabase service role, cron scheduler + DB-backed job queue).
- `frontend/` — Next.js App Router, Supabase auth (Google + email), embedded chat assistant, Recharts.
- `supabase/migrations/` — SQL to run in the Supabase SQL editor.

## Prerequisites

1. **Supabase**: Run `supabase/migrations/001_init.sql` in the SQL editor (creates tables + RLS).
2. **Auth**: In Supabase → Authentication → Providers, enable **Google** (and optionally email).
3. **Power BI**: Ensure the Azure AD app registration has access to the workspace, and the service principal is added to the Power BI workspace with at least **Dataset.Read.All** / **Workspace.Read.All** as required by your tenant.

## Environment

- `backend/.env` — server secrets (never commit). See `backend/.env.example`.
- `frontend/.env.local` — public Supabase URL/anon key + `NEXT_PUBLIC_API_BASE`. See `frontend/.env.example`.

## Run (Ubuntu / Linux / Windows)

Terminal 1 — API:

```bash
cd backend
npm install
npm run start:dev
```

Terminal 2 — Web:

```bash
cd frontend
npm install
npm run dev
```

- API: `http://localhost:3001/api`
- Health: `http://localhost:3001/api/health`
- App: `http://localhost:3000`

## Reference ZIPs (how they were used)

- **BI-Forge**: Structured AI insight JSON, analyst-style prompts; no LangChain/Python stack was copied.
- **AI-Powered Auto Insights (Python)**: Statistical aggregation patterns reimplemented in `AggregationService`.
- **Automated Power BI Dashboard / PowerBI_AutoReports**: Refresh-before-report and report layout ideas only.

## Production notes

- PDF jobs are processed by a **cron worker** (every 10s) with status in `jobs` — add **Redis + BullMQ** later if you need high throughput.
- **Rotate any API keys** that were shared in chat or committed by mistake.

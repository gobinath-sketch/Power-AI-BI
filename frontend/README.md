# Frontend - Power AI BI Platform

Next.js App Router frontend for the Power AI platform.  
This app provides marketing pages, authentication, dashboard/report screens, and embedded chat/report experiences.

---

## Scope

- Multi-page marketing website
- Login/Signup with Supabase auth (email + Google OAuth)
- Protected app routes (dashboard, reports, settings)
- Embedded AI/chat UX
- Report preview and export triggers via backend APIs

---

## Tech Stack

- Next.js 14 + TypeScript
- App Router
- Tailwind CSS
- Supabase JS + `@supabase/ssr`
- Lucide icons

---

## Directory Overview

```text
frontend/
  src/
    app/                    # App Router routes
      (app)/                # Protected/authenticated routes
      auth/callback/        # Supabase OAuth callback route
      login/                # Auth page
    components/             # Shared UI + page components
    lib/supabase/           # Client/server/middleware Supabase helpers
  public/                   # Static assets
  .env.local                # Local env vars
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Notes:

- `NEXT_PUBLIC_*` values are intentionally browser-readable
- Secrets must stay in backend env, never here

---

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Default URL:

- `http://localhost:3000`

---

## Build and Quality

```bash
npm run build
npm run lint
```

---

## Authentication Flow

1. User signs in from `/login`
2. Supabase handles email/password or OAuth provider redirect
3. OAuth callback lands on `/auth/callback`
4. Callback route exchanges auth code for session
5. User is redirected into protected app routes

---

## API Integration

Frontend calls backend endpoints using `NEXT_PUBLIC_API_BASE` for:

- datasets
- reports generation/listing
- chat queries
- schedules
- PDF job status/download

Supabase is used for session/auth; backend is used for BI/report operations.

---

## UI/UX Notes

- Marketing and login surfaces use custom visual themes
- Dashboard and preview blocks support live-style motion for KPIs/charts/chat
- Global component styling is centralized under shared UI components and `globals.css`

---

## Common Troubleshooting

- **OAuth redirect loop**: verify Supabase site URL and callback URLs
- **401 on backend APIs**: confirm user is authenticated and token is attached
- **Favicon not updating**: clear browser cache / hard refresh
- **Stale styles**: restart dev server and clear `.next` if necessary

---

## Deployment Notes

- Deploy on Vercel or any Node-compatible host
- Set `NEXT_PUBLIC_API_BASE` to deployed backend URL
- Keep Supabase project URL/anon key aligned across environments

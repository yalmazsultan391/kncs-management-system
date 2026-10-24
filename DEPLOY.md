# Deploying KNCS to Vercel (free hosting)

This project is **not yet deployed**. It is built and verified locally;
deployment is a separate step (see below). No live Vercel link exists yet.

## 1. Environment variables required

Set these in Vercel: Project → Settings → Environment Variables, for
Production (and Preview if you want previews to work).

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes, in production | Postgres connection string. Without it the app falls back to an in-memory store that resets and is not shared between users. |
| `SESSION_SECRET` | Yes, in production | A long random string for session cookies. Generate one locally with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the output. Never commit the real value. |
| `NEXT_PUBLIC_SITE_URL` | No | Your deployed URL, e.g. `https://kncs.vercel.app`, used only for display/links. |

There are no other secrets. The logo, society name and module text are in
the code, not in env vars.

## 2. Create the database (pick ONE — all have a free tier)

### Option A — Vercel Postgres (easiest if you already use Vercel)
1. In the Vercel dashboard, open your project → Storage → Create Database → Postgres.
2. Vercel creates the database and automatically adds its connection env
   vars to the project. Confirm a `DATABASE_URL`-style variable (Vercel
   Postgres provides `POSTGRES_URL` etc.) is present.
3. **Important:** this app reads `DATABASE_URL`. If Vercel only sets
   `POSTGRES_URL`, add a `DATABASE_URL` env var with the same value
   (Storage → your database → `.env.local` tab shows the values).
4. Redeploy. Tables (`users`, `sessions`, `items`) are created
   automatically on first use, and `[DEMO]` sample rows are seeded once
   when the items table is empty.

### Option B — Neon (free Postgres, works with Vercel)
1. Sign up at Neon, create a free project/database.
2. Copy its connection string (it looks like
   `postgres://user:password@host/dbname?sslmode=require`).
3. Paste it as `DATABASE_URL` in Vercel env vars, then redeploy.

### Option C — Supabase (free Postgres)
1. Sign up at Supabase, create a free project.
2. Project Settings → Database → Connection string (use the “URI” form,
   with `?sslmode=require` / pooled connection if offered).
3. Paste it as `DATABASE_URL` in Vercel env vars, then redeploy.

All three options work because the app only needs a standard Postgres
connection string — it uses the `pg` driver with SSL enabled.

## 3. Deploy

### Via GitHub import (recommended)
1. Push this folder to a GitHub repository (e.g. `kncs-management-system`).
2. In Vercel: Add New → Project → Import that repository.
3. Framework preset: **Next.js** (Vercel detects it automatically).
   Build command: `npm run build` (default). Output: default for Next.js.
4. Add the env vars from section 1, then Deploy.
5. Open the deployed URL, register an account (choose the President role
   for the first admin account), log in, and check the dashboard.

### Via Vercel CLI
```bash
npm i -g vercel
cd kncs-vercel
vercel login
vercel link
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel --prod
```

## 4. After deployment — first checks

1. Open the site: the KNCS logo must appear in the top header, on a white
   pill, in both dark and light mode (toggle in the header).
2. Register a test account, log out, log back in — login must work and
   the dashboard must show only that role's modules (President sees all).
3. Add a member/task/event, refresh the page — it must still be there
   (this proves Postgres, not the memory fallback, is in use). If data
   disappears on refresh, `DATABASE_URL` is missing or wrong.
4. Delete the `[DEMO]` sample entries and add real society data.

## 5. Costs / limits to know

- Vercel's free (Hobby) plan, Vercel Postgres free tier, Neon free tier
  and Supabase free tier all have usage limits (storage, rows, compute
  hours). They are enough for a student society getting started; if the
  society grows, check the provider's current free-tier limits before
  relying on it, and upgrade only if needed.
- This app has no email service yet, so there is no password-reset email.
  See README “Planned next steps”.

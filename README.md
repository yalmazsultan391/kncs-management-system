# KNCS — KFUEIT Nexus Career Society: Management System

**Society:** KFUEIT Nexus Career Society, short **KNCS**, EST. 2024.
**Tagline:** CONNECT • GROW • CAREERS.
**Logo:** the official circular KNCS logo is in `public/logo.png` and is shown in
the top header on every page, on a white pill so the black-on-white logo reads
correctly in both dark and light mode.

## What this is

A student-society management system with working login/register, role-based
access to 8 modules, and a dashboard for members, tasks, events, jobs,
scholarships, companies, documents, CV tracking and LinkedIn growth.

**Important — demo data:** the first time the database is empty, the app seeds
clearly-labelled `[DEMO]` sample entries (e.g. “Demo Member 1”). These are
NOT real people, companies or partners. Delete them from the dashboard and
add real society data once the team starts using the system.

## Role → module mapping (builder's mapping, per the brief)

The President has **all access**. Every other role sees only its module(s)
plus its own profile. This is enforced on the server in
`app/api/data/route.js` (not only hidden in the UI) and in the dashboard
via `lib/permissions.js`.

| Role | Primary module | Also sees |
|---|---|---|
| President | ALL modules | — |
| Vice President | Admin | HR, Settings |
| General Secretary | Admin | HR, Administration Management, Settings |
| Treasurer (bank-related) | Administration Management | — |
| CV/Resume Reviewer | Students' Profile Management | — |
| Social Media Manager | Students' Profile Management | — |
| LinkedIn Mentor | Students' Profile Management | — |
| LinkedIn Lead Generation | Students' Profile Management | — |
| Research & Publication Manager | Research | — |
| Opportunity/Scholarship | Research | — |
| Job Board Manager | Research | Companies Connectivity |
| Alumni Relation Head | Companies Connectivity | — |
| Logistic Head | Customer Relationship | — |
| Event Manager | Customer Relationship | Companies Connectivity |
| Human Resource | HR | — |
| Graphic Designing | Customer Relationship | — |
| Operation & Planning Manager | Customer Relationship | — |
| International Officer | Research | Companies Connectivity |
| Document Controller | Administration Management | — |
| Workshop Training & Certification | Customer Relationship | — |

Module contents (from the brief):

1. **Admin** — performance & analysis, member addition, all access, terms & policies
2. **HR** — membership control, role recruitment
3. **Customer Relationship** — customer issues, add tasks, event addition
4. **Research** — scholarship research, jobs board, companies contact, international competitions, projects research lead
5. **Administration Management** — accountant, performance analysis, docs management
6. **Companies Connectivity** — event addition, performance success rate
7. **Students' Profile Management** — CV/resume statuses, LinkedIn growth
8. **Settings** — account, theme, logout

## Auth & database design

- **Passwords are never stored in plain text.** They are hashed server-side
  with Node's built-in `scrypt` (salt + hash, `scrypt:<salt>:<hash>`) in
  `lib/auth.js`. No bcrypt native build is required on Vercel.
- **Sessions:** a random token stored server-side (`sessions` table, or the
  in-memory map in local dev) and sent as an `httpOnly`, `SameSite=Lax`,
  `Secure`-in-production cookie (`kncs_session`, 7 days). The browser never
  holds the password and localStorage is never used as the database — it
  only stores the user's dark/light theme choice.
- **Database:** Postgres when `DATABASE_URL` is set (see DEPLOY.md). Tables
  are created automatically on first use: `users`, `sessions`, `items`.
  `items` is a single flexible table (`type, title, detail, status,
  owner_email, meta`) covering members, tasks, issues, events, jobs,
  scholarships, companies, docs, CV entries, LinkedIn trackers, competitions
  and projects. Performance / success-rate figures are computed live from
  these rows (e.g. companies success rate = Active companies ÷ all companies).
- **Without `DATABASE_URL`** the app runs with a server-side in-memory store
  for local development only. That data resets on restart and is **not**
  shared between devices — do not use it in production.

## Features

- Dark mode AND light mode toggle in the header, persisted per browser and
  applied on all pages (including before first paint).
- Login and register (name, email, password ≥ 8 chars with a letter and a
  number, society role). Duplicate emails are rejected; login errors are
  generic (“Invalid email or password”) so they do not reveal which emails
  exist.
- Dashboard: overview stats, the 8 modules (filtered by role), member
  add/edit (status), tasks, events, jobs/scholarships board, companies list,
  docs list, CV status tracker, LinkedIn growth tracker, performance and
  success-rate summaries. Items can be added, have their status changed,
  and be deleted (role permitting).

## Local development

```bash
npm install
cp .env.example .env.local   # optional; without DATABASE_URL it uses memory store
npm run dev                  # http://localhost:3000
npm run build
```

## Deployment

See **DEPLOY.md** — Vercel CLI or GitHub import, Vercel Postgres / Neon /
Supabase setup, and the required env vars (`DATABASE_URL`,
`SESSION_SECRET`).

## Planned next steps (not yet built)

Password-reset email flow, a dedicated finance ledger for the Treasurer
(currently finance notes are recorded as documents), file uploads for docs,
and an admin approval step for new registrations.

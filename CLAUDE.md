# Zenzo — CLAUDE.md

## What is Zenzo?

Zenzo is a **membership management platform** for recurring-attendance businesses (gyms, yoga studios, martial arts academies, dance schools, etc.).

- **Strategy**: Build horizontal, sell vertical — launch with gyms as the beachhead vertical.
- **Model**: Multi-tenant SaaS — one codebase, each business gets its own slug-scoped workspace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo (pnpm workspaces) |
| Frontend | Next.js 14 (App Router) |
| Database / Auth | Supabase (Postgres + Row-Level Security) |
| Payments | Razorpay |
| WhatsApp Notifications | Interakt |
| Hosting | Vercel |

---

## Repository Structure

```
zenzo/
├── apps/
│   └── web/                      # Next.js 14 app
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # Login, signup, forgot-password
│           │   └── (dashboard)/
│           │       └── [tenantSlug]/   # All tenant-scoped routes
│           │           ├── dashboard/
│           │           ├── members/
│           │           ├── plans/
│           │           ├── attendance/
│           │           ├── payments/
│           │           ├── staff/
│           │           ├── communications/
│           │           ├── reports/
│           │           └── settings/
│           └── middleware.ts     # Auth + tenant guard
├── packages/
│   ├── config/                   # Shared tsconfig, eslint
│   ├── database/                 # Supabase client + generated types
│   ├── ui/                       # Shared React components
│   └── utils/                    # Formatters, slugify, etc.
├── supabase/                     # Migrations + seed (add when initialising DB)
├── .env.example
├── turbo.json
└── CLAUDE.md
```

---

## Phase 1 — 9 Modules

| # | Module | Description |
|---|---|---|
| 1 | **Auth** | Multi-tenant auth via Supabase Auth (email + OTP) |
| 2 | **Dashboard** | KPI summary: active members, revenue, attendance rate |
| 3 | **Members** | Add/edit/view members, membership status, history |
| 4 | **Plans** | Create dynamic pricing plans (duration + price) |
| 5 | **Attendance** | Mark / view daily attendance per member |
| 6 | **Payments** | Collect fees via Razorpay, track dues + history |
| 7 | **Staff** | Invite staff, assign roles, manage access |
| 8 | **Communications** | Send WhatsApp messages via Interakt (renewal reminders, etc.) |
| 9 | **Reports** | Revenue, attendance, churn reports with date filters |
| +  | **Settings** | Tenant profile, branding, billing |

---

## User Roles

| Role | Access |
|---|---|
| `owner` | Full access — all modules + settings |
| `staff` | Members, attendance, payments (read/write). No settings or staff management. |
| `member` | Own profile, own payment history, own attendance |

Role is stored in `profiles.role` (per-tenant). Enforced via Supabase RLS **and** Next.js middleware.

---

## Multi-Tenant Data Model (overview)

- Every tenant gets a row in `tenants` with a unique `slug`.
- All tenant-scoped tables carry `tenant_id` foreign key.
- Supabase RLS policies enforce `tenant_id = auth.jwt() -> tenant_id` claim.
- URL structure: `/:tenantSlug/members`, `/:tenantSlug/payments`, etc.

---

## Key Conventions

- **Amounts stored in paise** (₹1 = 100 paise) — use `formatCurrency()` from `@zenzo/utils` for display.
- **Dates** — store as UTC ISO strings in Supabase; display with `formatDate()`.
- **Server Components by default** — only add `"use client"` when you need interactivity or browser APIs.
- **Supabase types** — after every migration run `supabase gen types typescript --local > packages/database/src/types/index.ts`.
- **Env vars** — see `.env.example`. Never commit `.env*` files.

---

## Build Order (Phase 1)

1. Auth + multi-tenant data model (RLS, middleware, tenant onboarding)
2. Members CRUD
3. Plans (dynamic pricing)
4. Attendance tracking
5. Payments (Razorpay integration)
6. Staff management
7. Communications (Interakt)
8. Dashboard KPIs
9. Reports

---

## Local Dev

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + Razorpay keys
pnpm dev                      # starts all apps via Turbo
```

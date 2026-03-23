# Zenzo — Agent Context

## What is Zenzo
Membership management SaaS for recurring-attendance businesses (gyms first).
Multi-tenant: each business gets a slug-scoped workspace (`/:tenantSlug/*`).

## Stack
Turborepo · Next.js 14 (App Router) · Supabase (Postgres + RLS) · Razorpay · Interakt (WhatsApp) · Vercel · pnpm workspaces

## Repo Layout
```
apps/web/src/
  app/(auth)/login/           # auth routes
  app/(dashboard)/[tenantSlug]/
    dashboard/ members/ plans/ attendance/
    payments/ staff/ communications/ reports/ settings/
  middleware.ts               # Supabase auth + tenant guard
packages/
  database/  → Supabase client + DB types (packages/database/src/)
  ui/        → shared React components
  utils/     → formatCurrency(paise), formatDate, slugify
  config/    → tsconfig base + nextjs
```

## Roles
| Role | Access |
|---|---|
| `owner` | all modules + settings |
| `staff` | members, attendance, payments (no settings/staff mgmt) |
| `member` | own profile, payments, attendance |

## Key Conventions
- Amounts in **paise** (₹1 = 100). Use `formatCurrency()` from `@zenzo/utils`.
- Server Components by default — `"use client"` only when needed.
- After every migration: `supabase gen types typescript --local > packages/database/src/types/index.ts`
- Never commit `.env*` files. See `.env.example` for required vars.

---

## Session Log

### Session 1 — 2026-03-23
**Done:**
- Turborepo monorepo scaffolded (pnpm workspaces)
- Next.js 14 app with all 9 module routes under `/:tenantSlug/*`
- Supabase auth middleware (`apps/web/src/middleware.ts`)
- `@zenzo/database`: Supabase client + placeholder types (tenants, profiles, memberships)
- `@zenzo/ui`: Button component
- `@zenzo/utils`: formatCurrency, formatDate, slugify
- `@zenzo/config`: shared tsconfig (base + nextjs)
- `.env.example`, `.gitignore`, `README.md`
- All code pushed to `claude/init-club-management-5zMXk`

---

## Status

### Done
- [x] Monorepo skeleton (Turborepo + pnpm)
- [x] Next.js 14 app with 9 module route stubs
- [x] Supabase client + placeholder DB types
- [x] Auth middleware (route guard)
- [x] Shared packages (ui, utils, config)
- [x] README + CLAUDE.md

### In Progress
- nothing currently active

### Up Next (Phase 1 build order)
1. **Auth + multi-tenant data model** — Supabase migrations, RLS policies, tenant onboarding
2. **Members CRUD**
3. **Plans** (dynamic pricing)
4. **Attendance** tracking
5. **Payments** (Razorpay integration)
6. **Staff** management
7. **Communications** (Interakt/WhatsApp)
8. **Dashboard** KPIs
9. **Reports**

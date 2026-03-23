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

### Session 2 — 2026-03-23
**Done:**
- Complete UI/UX design system for the entire product
- All design docs in `docs/design/` (16 files):
  - `00-design-philosophy.md` — one-pager: visual identity, the three tests
  - `01-design-system.md` — colours (warm orange primary), typography (Inter), spacing (4px base), borders, shadows, component inventory
  - `02-navigation-ia.md` — full site map, sidebar/bottom nav, role-based nav, transitions
  - `03-user-journeys.md` — 5 end-to-end journeys (onboarding, coach attendance, fee collection, member self-service, belt promotion)
  - `04-screens-auth.md` — landing, signup, login, forgot password, onboarding wizard
  - `05-screens-dashboard.md` — owner daily digest, coach today's batches
  - `06-screens-members.md` — list, add, profile, bulk import
  - `07-screens-batches.md` — list, create, detail
  - `08-screens-attendance.md` — THE ritual screen, history (owner view)
  - `09-screens-payments.md` — overdue list, record payment, history, fee plans, send link
  - `10-screens-reports.md` — revenue, attendance, member growth, retention
  - `11-screens-progression.md` — belt distribution, promote, history
  - `12-screens-settings.md` — profile, staff mgmt, notifications, gateway, terminology
  - `13-screens-communications.md` — WhatsApp hub, templates, history, manual send
  - `14-screens-member-portal.md` — member home, attendance, payments, receipts (token-gated mobile web)
  - `15-components.md` — detailed specs: Button, Input, Badge, Avatar, StatCard, DataTable, Modal, Toast, EmptyState, AttendanceToggle
  - `16-micro-interactions-responsive.md` — motion guidelines, breakpoints, responsive rules, performance budget

---

## Status

### Done
- [x] Monorepo skeleton (Turborepo + pnpm)
- [x] Next.js 14 app with 9 module route stubs
- [x] Supabase client + placeholder DB types
- [x] Auth middleware (route guard)
- [x] Shared packages (ui, utils, config)
- [x] README + CLAUDE.md
- [x] Complete UI/UX design system (`docs/design/`)

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

## Design Reference
All UI/UX specs live in `docs/design/`. Key decisions:
- **Colour:** Warm orange primary (#F97316), slate neutrals
- **Font:** Inter, min 13px
- **Spacing:** 4px base unit
- **Mobile-first for coaches, desktop-first for owners**
- **No dark mode Phase 1**
- **Modals → bottom sheets on mobile**
- **Tables → card lists on mobile**
- **Attendance toggle: 48x48 min tap target, haptic feedback**
- **Member portal: token-gated via WhatsApp, no login**

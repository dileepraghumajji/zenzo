# Zenzo — Agent Context

## What is Zenzo
Membership management SaaS for recurring-attendance businesses (gyms first).
Multi-tenant: each business gets a slug-scoped workspace (`/:tenantSlug/*`).

## Stack
Turborepo · Next.js 14 (App Router) · Supabase (Postgres + RLS) · Razorpay · Interakt (WhatsApp) · Vercel · pnpm workspaces

## Package Versions (pinned — do not upgrade without testing)
- `@supabase/ssr`: `0.9.0`
- `@supabase/supabase-js`: `2.100.0`
- Next.js: `14.x`

## Repo Layout
```
apps/web/src/
  app/(auth)/login/           # auth routes
  app/(dashboard)/[tenantSlug]/
    dashboard/ members/ plans/ attendance/
    payments/ staff/ communications/ reports/ settings/
  components/
    sidebar.tsx               # desktop sidebar + SidebarSkeleton
    bottom-nav.tsx            # mobile bottom nav + MoreSheet
  lib/
    auth.ts                   # getUserProfile() — ONE profile fetch per navigation
    supabase/
      server.ts               # SSR Supabase client (Server Components)
      client.ts               # Browser Supabase client (Client Components)
  middleware.ts               # Edge: session JWT check only, NO DB queries
  app/api/auth/profile/route.ts  # POST → returns {tenantSlug, role} after login
packages/
  database/src/
    enums.ts                  # SINGLE SOURCE OF TRUTH for all DB enum values
    types/index.ts            # Hand-written DB types (replace after supabase gen)
    client.ts                 # Supabase service client
    index.ts                  # Re-exports everything
  ui/        → shared React components
  utils/     → formatCurrency(paise), formatDate, slugify
  config/    → tsconfig base + nextjs
```

## Roles
| Role | Access |
|---|---|
| `owner` | all modules + settings |
| `staff` | members, attendance, payments (no settings/staff mgmt) |
| `member` | own profile, payments, attendance (member portal only, not dashboard) |

---

## Non-Negotiable Coding Rules

### TypeScript
1. **No `any`, no `as unknown as`** — ever. If a type isn't resolving, fix the root cause.
2. **No `as X` casts** unless narrowing after an explicit guard (e.g., `if (role === "member") ...` then `role as "owner" | "staff"`).
3. **Explicit column selects on all Supabase queries** — `select("id, role, full_name")` not `select("*")`. `select("*")` only works after running `supabase gen types typescript --local`.

### Supabase Query Rules
4. **Create the Supabase client directly** inside every function that runs queries. Do not pass it through helpers or destructure from a helper — TypeScript collapses the `SupabaseClient<Database>` generic and query results become `never`.
   ```ts
   // CORRECT
   const supabase = createSupabaseServerClient();
   const { data } = await supabase.from("profiles").select(...);

   // WRONG — generic is lost
   const { supabase } = await someHelper();
   const { data } = await supabase.from("profiles").select(...); // data: never
   ```
5. **Use `getUser()` not `getSession()`** — `getUser()` validates the JWT against the Supabase auth server. `getSession()` trusts the local cookie without re-validation.
6. **Server components are read-only** — `CookieMethodsServer` must only implement `getAll()`, never `setAll`. Token refresh is done by middleware, not server components.

### Enums
7. **All DB enum values live in `packages/database/src/enums.ts`** — never hard-code string literals like `"owner"` in component code. Always import from `@zenzo/database/enums`.
   ```ts
   // enums.ts pattern
   export const UserRole = { Owner: "owner", Staff: "staff", Member: "member" } as const;
   export type UserRole = (typeof UserRole)[keyof typeof UserRole];
   ```

### Components
8. **Loading states use skeletons, never spinners** — all skeleton variants live alongside their component (`SidebarSkeleton` in `sidebar.tsx`). Use `.skeleton-shimmer` CSS class from `globals.css`.
9. **Server Components by default** — add `"use client"` only when you need: `useState`, `useEffect`, event handlers, browser APIs, or localStorage.
10. **Amounts in paise** — ₹1 = 100 paise. Always use `formatCurrency()` from `@zenzo/utils` for display.

---

## Auth Architecture (3-Layer — DO NOT deviate)

```
Layer 1: Middleware (Edge Runtime)
  └── Checks session JWT via getUser()
  └── Redirects unauthenticated users to /login?redirect={pathname}
  └── NO DB queries — Edge Runtime has no DB access

Layer 2: [tenantSlug]/layout.tsx (async Server Component)
  └── Calls getUserProfile(tenantSlug) — ONE DB fetch per navigation
  └── Verifies: session exists + profile exists + tenant slug matches
  └── Redirects to /login on any failure
  └── Guards member role → redirect /m (members use portal, not dashboard)
  └── Passes {role, fullName, initials} as props to Sidebar + BottomNav

Layer 3: Pages (Server Components / Client Components)
  └── Receive role as props from layout (never fetch profile themselves)
  └── Fetch their OWN data (members list, payments, etc.)
  └── Use Suspense + Skeleton for their own slow data
```

**Post-login redirect flow:**
1. Login page verifies OTP with Supabase
2. Login page calls `POST /api/auth/profile` — gets `{ tenantSlug, role }`
3. Login page calls `router.push("/${tenantSlug}/dashboard")`
4. Middleware lets the request through (session now valid)
5. Layout fetches profile and renders

**Re-trigger profile fetch:**
- Automatic: every navigation (Next.js App Router re-runs layouts)
- Manual: call `router.refresh()` after a role change (owner promotes staff)

---

## Auth Strategy

### Current (Phase 1 — Launch)
**Email + Password** via `supabase.auth.signInWithPassword` / `supabase.auth.signUp`.
- Phone collected at signup → stored in `profiles.phone` → used by Interakt for WhatsApp only
- Phone is NOT an auth credential
- Password reset via email (Supabase native)

### Future Providers (planned — do NOT build yet)
- **Phone OTP login** — user requested; adds "Login with OTP" button to login page
- **Google OAuth** — user requested; adds "Continue with Google" button

**Design constraint:** Build the login page provider-agnostic so adding phone/Google later is additive (new button), not a rewrite. The `POST /api/auth/profile` route already handles post-login redirect for any provider.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `apps/web/src/lib/auth.ts` | `getUserProfile(tenantSlug)` — the ONE profile fetch |
| `apps/web/src/lib/supabase/server.ts` | SSR Supabase client factory |
| `apps/web/src/middleware.ts` | Edge session guard |
| `apps/web/src/app/api/auth/profile/route.ts` | POST — returns tenantSlug after login |
| `apps/web/src/components/sidebar.tsx` | Desktop sidebar + `SidebarSkeleton` |
| `apps/web/src/components/bottom-nav.tsx` | Mobile bottom nav + `MoreSheet` |
| `apps/web/src/app/(dashboard)/[tenantSlug]/layout.tsx` | Async layout — single profile fetch |
| `packages/database/src/enums.ts` | All DB enum values (single source of truth) |
| `packages/database/src/types/index.ts` | Hand-written DB types (replace after migrations) |

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

### Session 2 — 2026-03-23
**Done:**
- Complete UI/UX design system for the entire product
- All design docs in `docs/design/` (17 files):
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

### Session 3 — 2026-03-23
**Done:**
- Reviewed `temp-features.md` as CEO/CTO — identified gaps in schema, RLS, API routes, guardian model, acceptance criteria
- Produced `FEATURES.md` (1,415 lines) — production-grade feature spec:
  - 13-table database schema with full SQL + RLS policies + migration order
  - P0 features (9 sections) with acceptance criteria, validation rules, API routes
  - P1 features (9 sections) with Razorpay integration, member portal token spec, guardian model
  - P2 features (7 sections) scoped for post-launch growth
  - Complete API route map (all Next.js route handlers)
  - Implementation rules for coding agents (10 non-negotiable rules)

### Session 4 — 2026-03-24
**Done:**
- Built `packages/database/src/enums.ts` — single source of truth for all DB enum values (`UserRole`, `MemberStatus`, `AttendanceStatus`, `SessionType`, `DayOfWeek`, `TenantPlan`). Uses `as const` + type alias pattern.
- Updated `packages/database/src/types/index.ts` — added `Relationships: GenericRelationship[]` to all tables (required by supabase-js v2.99+), expanded to 6 main tables (tenants, profiles, members, sessions, attendance, payments)
- Updated `packages/database/src/index.ts` and `package.json` — exports all enums via `"./enums"` path
- Upgraded `@supabase/ssr` to `0.9.0` and `@supabase/supabase-js` to `2.100.0` (v0.4.1 imported a path that no longer exists in supabase-js v2.99+)
- Built `apps/web/src/lib/supabase/server.ts` — SSR Supabase client with `<Database>` generic, explicit `CookieMethodsServer` type to force non-deprecated overload
- Built `apps/web/src/lib/auth.ts` — `getUserProfile(tenantSlug)`, the single profile fetch for dashboard scope. Zero `any`, zero `as unknown as`.
- Rewrote `apps/web/src/middleware.ts` — Edge Runtime, JWT-only check, no DB queries, preserves redirect destination
- Built `apps/web/src/app/api/auth/profile/route.ts` — `POST /api/auth/profile` for post-login redirect
- Built `apps/web/src/components/sidebar.tsx` — desktop sidebar (hidden on mobile), role-based nav, collapse with localStorage persistence, active pill indicator, `SidebarSkeleton`
- Built `apps/web/src/components/bottom-nav.tsx` — mobile bottom nav, 4 primary items + More sheet, safe area padding, closes on route change
- Rewrote `apps/web/src/app/(dashboard)/[tenantSlug]/layout.tsx` — async Server Component, single profile fetch, guards member role, passes props to Sidebar + BottomNav

**Key decisions made this session:**
- Single profile fetch in layout (not separate fetches for Sidebar + BottomNav)
- Middleware stays pure Edge — no DB, just JWT check
- `POST /api/auth/profile` route bridges login → dashboard (middleware can't do DB lookups)
- Active nav indicator is an absolutely-positioned 3px pill (not border-left, which causes layout shift)
- Sidebar collapse is CSS `transition-[width]` on a flex item — no context or CSS vars needed

**Bugs fixed this session:**
- `@supabase/ssr@0.4.1` breaking with supabase-js v2.99+ (wrong dist path) → upgraded both packages
- Supabase query `data: never` when client passed through helper functions → create client directly inside each function
- `select("*")` returning `{}` type with placeholder types → use explicit column lists
- Deprecated overload warning on `createServerClient` → explicit `CookieMethodsServer` type annotation
- `Relationships` missing from hand-written types → added `Relationships: []` arrays

---

## Status

### Done
- [x] Monorepo skeleton (Turborepo + pnpm)
- [x] Next.js 14 app with 9 module route stubs
- [x] Supabase client + placeholder DB types (with Relationships field)
- [x] Auth middleware (Edge, JWT-only)
- [x] Shared packages (ui, utils, config)
- [x] README + CLAUDE.md
- [x] Complete UI/UX design system (`docs/design/`)
- [x] Production-grade feature spec (`FEATURES.md`)
- [x] DB enums (single source of truth in `packages/database/src/enums.ts`)
- [x] SSR Supabase client (`lib/supabase/server.ts`)
- [x] Auth utility — `getUserProfile()` (`lib/auth.ts`)
- [x] POST /api/auth/profile route
- [x] Sidebar (desktop, collapsible, role-based, skeleton)
- [x] BottomNav (mobile, 4 items + More sheet)
- [x] Tenant layout (async, single profile fetch, role guard)

### Up Next — UI Components (build before P0.1 auth screens)
- [ ] **Task 10:** TopBar — breadcrumb, search trigger, avatar dropdown, mobile back arrow
- [ ] **Task 11:** Input component — all types, prefix/suffix, all states
- [ ] **Task 12:** Select component — searchable, custom desktop dropdown
- [ ] **Task 13:** Checkbox, Toggle, Radio atoms
- [ ] **Task 14:** FormField wrapper
- [ ] **Task 15:** Toast system — ToastProvider + useToast hook
- [ ] **Task 16:** Modal / BottomSheet — responsive single component (replaces MoreSheet in bottom-nav)
- [ ] **Task 17:** ConfirmDialog
- [ ] **Task 18:** StatCard
- [ ] **Task 19:** ListItem
- [ ] **Task 20:** DataTable (desktop table → mobile card transformation)
- [ ] **Task 21:** EmptyState
- [ ] **Task 22:** Skeleton system (base + variants)
- [ ] **Task 23:** PageHeader
- [ ] **Task 24:** AttendanceGrid (hero component)

### P0 Build Order (from FEATURES.md)
1. **P0.1** — Auth & Onboarding (login OTP flow → `POST /api/auth/profile` → redirect, onboarding wizard, tenant creation)
2. **P0.2** — Member Management (CRUD, guardian model, search/filter)
3. **P0.3** — Session Management (create, assign members)
4. **P0.4** — Attendance (THE ritual screen — must be excellent)
5. **P0.5** — Fee Plans (CRUD)
6. **P0.6** — Payments Manual (overdue list, record payment)
7. **P0.7** — Dashboard (daily digest, coach view)
8. **P0.8** — WhatsApp via Interakt (payment reminder, receipt, welcome)
9. **P0.9** — Settings (business profile, terminology config)

---

## Key Docs (read before each session)
1. `CLAUDE.md` — this file. Project context + session log + status + rules.
2. `FEATURES.md` — full feature spec. Schema, API routes, acceptance criteria, rules.
3. `docs/design/` — screen-by-screen UI specs. Reference the relevant file per feature.

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
- **Loading states: always skeletons, never spinners**

# Zenzo — Agent Context

## CRITICAL RULES (read every session)

1. **No shadow users** — every member must have a Zenzo account. Clubs INVITE people via WhatsApp. Membership activates only after the person signs up on Zenzo. `club_memberships.status = 'pending_invite'` until then.
2. **No `any`, no `as unknown as`** — ever. Fix the root cause if a type isn't resolving.
3. **No `as X` casts** unless narrowing after an explicit type guard.
4. **Explicit column selects** on all Supabase queries — `select("id, role, full_name")` not `select("*")`. `select("*")` only works after running `supabase gen types typescript --local`.
5. **Create the Supabase client directly** inside every function. Never pass it through helpers — the `SupabaseClient<Database>` generic collapses and query results become `never`.
6. **Use `getUser()` not `getSession()`** — `getUser()` validates the JWT against Supabase. `getSession()` trusts the local cookie without re-validation.
7. **Server Components are read-only** — `CookieMethodsServer` implements only `getAll()`, never `setAll`. Token refresh is middleware's job.
8. **All DB enum values in `packages/database/src/enums.ts`** — never hard-code `"owner"` or `"coach"` in component code. Import from `@zenzo/database/enums`.
9. **Loading states use skeletons, never spinners** — skeleton variants live alongside their component. Use `.skeleton-shimmer` from `globals.css`.
10. **Server Components by default** — add `"use client"` only for: `useState`, `useEffect`, event handlers, browser APIs, or localStorage.
11. **All amounts in paise** — ₹1 = 100 paise. Always use `formatCurrency()` from `@zenzo/utils` for display.
12. **Use `clubSlug` everywhere** — not `tenantSlug`. The route param is `[clubSlug]`.
13. **After completing any task, update the Session Log in CLAUDE.md.**

---

## What is Zenzo

A two-sided platform for recurring-attendance clubs — gyms, martial arts, dance, yoga.

- **B2B (Phase 1):** Club owners and coaches use Zenzo to manage operations — members, batches, attendance, payments.
- **B2C (Phase 2):** Consumers discover, trial, and enroll in clubs through Zenzo.

Every person on Zenzo is a real, authenticated user with one account that works across all clubs.

---

## Stack

Turborepo · Next.js 14 (App Router) · Supabase (Postgres + RLS) · Razorpay · Interakt (WhatsApp) · Vercel · pnpm workspaces

## Package Versions (pinned — do not upgrade without testing)
- `@supabase/ssr`: `0.9.0`
- `@supabase/supabase-js`: `2.100.0`
- Next.js: `14.x`

---

## Repo Layout

```
apps/web/src/
  app/(auth)/
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
  app/(dashboard)/[clubSlug]/    ← TARGET: currently at [tenantSlug] — see Tech Debt
    dashboard/page.tsx
    members/
      page.tsx                   # Member list
      invite/page.tsx            # Invite member
      [memberId]/page.tsx        # Member profile
    batches/
      page.tsx
      new/page.tsx
      [batchId]/page.tsx
    attendance/
      take/[batchId]/page.tsx
      history/page.tsx
    payments/
      page.tsx                   # Overdue list (default tab)
      record/page.tsx
      history/page.tsx
    reports/page.tsx
    settings/
      page.tsx
      staff/page.tsx
    layout.tsx                   # Async SC: single profile fetch, role guard
  app/api/
    auth/profile/route.ts        # POST → returns {clubSlug, role} after login
    onboarding/route.ts
  components/
    sidebar.tsx                  # Desktop sidebar + SidebarSkeleton
    bottom-nav.tsx               # Mobile bottom nav + MoreSheet
  lib/
    auth.ts                      # getUserProfile(clubSlug) — ONE profile fetch per nav
    supabase/
      server.ts                  # SSR Supabase client (Server Components)
      client.ts                  # Browser Supabase client (Client Components)
  middleware.ts                  # Edge: JWT check only, NO DB queries
packages/
  database/src/
    enums.ts                     # SINGLE SOURCE OF TRUTH for all DB enum values
    types/index.ts               # Hand-written DB types (replace after supabase gen)
    client.ts                    # Supabase service client
    index.ts                     # Re-exports everything
  ui/        → shared React components (Button, Input, etc.)
  utils/     → formatCurrency(paise), formatDate, slugify
  config/    → tsconfig base + nextjs
```

---

## Roles

| Role | Product | Access |
|---|---|---|
| `owner` | Club dashboard | Full management + settings + reports + staff |
| `coach` | Club dashboard | Attendance, members (read-only), progression. No financials, no settings. |
| `consumer` | Consumer app (Phase 2) | Discovery, enrollment, own profile |
| `admin` | Zenzo internal panel | Club verification, platform management |

Roles are stored in `club_staff.role`. The same Zenzo user can be owner of Club A and coach at Club B.

---

## Non-Negotiable Coding Rules

### TypeScript
```ts
// CORRECT — create client directly in the function
const supabase = createSupabaseServerClient();
const { data } = await supabase.from("clubs").select("id, name, slug");

// WRONG — generic is lost, data becomes `never`
const { supabase } = await someHelper();
const { data } = await supabase.from("clubs").select("id, name, slug");
```

### Enums pattern
```ts
// packages/database/src/enums.ts
export const StaffRole = { Owner: "owner", Coach: "coach" } as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];
```

### Component rules
- Skeleton variants live alongside their component (`SidebarSkeleton` in `sidebar.tsx`)
- All monetary amounts: `formatCurrency(amountPaise)` — never `₹${amount}`

---

## Auth Architecture (3-Layer — DO NOT deviate)

```
Layer 1: Middleware (Edge Runtime)
  └── Checks session JWT via getUser()
  └── Redirects unauthenticated → /login?redirect={pathname}
  └── NO DB queries

Layer 2: [clubSlug]/layout.tsx (async Server Component)
  └── Calls getUserProfile(clubSlug) — ONE DB fetch per navigation
  └── Verifies: session + club_staff membership + slug matches
  └── Redirects to /login on any failure
  └── Guards consumer/no-role → redirect appropriately
  └── Passes {role, fullName, initials} as props to Sidebar + BottomNav

Layer 3: Pages (Server Components / Client Components)
  └── Receive role as props from layout (never fetch profile themselves)
  └── Fetch their OWN data (member list, payments, etc.)
  └── Use Suspense + skeleton for slow data
```

**Post-login flow:**
1. Login verifies credentials with Supabase
2. Login calls `POST /api/auth/profile` → gets `{ clubSlug, role }`
3. Login calls `router.push("/${clubSlug}/dashboard")`
4. Middleware lets the request through (valid session)
5. Layout fetches profile and renders

---

## Auth Strategy

### Phase 1 (Current)
**Email + Password** via `supabase.auth.signInWithPassword` / `supabase.auth.signUp`.

**Signup flow:**
1. Full Name + Phone + Email + Password → submit
2. WhatsApp OTP sent via Interakt to phone number
3. User enters 6-digit OTP in modal
4. On success: Supabase account + `users` row created
5. Post-signup routing: invited? → create membership + portal. Owner? → onboarding wizard.

**Phone is NOT an auth credential.** It's collected at signup, stored in `users.phone`, used for WhatsApp only.

### Future (do NOT build yet)
- Phone OTP login — additive button on login page
- Google Sign-In — consumer app, Phase 2

---

## Data Model

```
users                   — Zenzo account (id, name, phone, email, auth_provider, is_admin)
clubs                   — each club (id, slug, name, business_type, owner_id, verification_status, listed)
club_staff              — role in a club (user_id, club_id, role: owner|coach)
club_memberships        — member relationship (user_id, club_id, plan_id, status, joined_at)
member_batches          — many-to-many (membership_id, batch_id)
batches                 — scheduling groups (id, club_id, name, start_time, end_time, days[], coach_id)
fee_plans               — billing plans (id, club_id, name, amount_paise, billing_cycle)
attendance_records      — (id, membership_id, batch_id, date, status, marked_by, is_drop_in)
payments                — (id, membership_id, amount_paise, method, payment_date, recorded_by)
progression_levels      — belt/level hierarchy per club
promotions              — promotion history per membership
notifications_log       — WhatsApp/email/push delivery log
notification_settings   — per-club toggle for each notification type
```

**Membership status lifecycle:**
```
pending_invite → active → overdue → expired
                    ↑                   │
                    └───────────────────┘ (payment recorded)
```

**Multi-club:** One owner can own multiple clubs. Coaches can be shared across clubs owned by the same owner. Club switcher lives in sidebar footer.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `apps/web/src/lib/auth.ts` | `getUserProfile(clubSlug)` — the ONE profile fetch |
| `apps/web/src/lib/supabase/server.ts` | SSR Supabase client factory |
| `apps/web/src/middleware.ts` | Edge session guard |
| `apps/web/src/app/api/auth/profile/route.ts` | POST — returns clubSlug + role after login |
| `apps/web/src/components/sidebar.tsx` | Desktop sidebar + `SidebarSkeleton` |
| `apps/web/src/components/bottom-nav.tsx` | Mobile bottom nav + `MoreSheet` |
| `apps/web/src/app/(dashboard)/[tenantSlug]/layout.tsx` | Async layout (needs rename to [clubSlug]) |
| `packages/database/src/enums.ts` | All DB enum values (single source of truth) |
| `packages/database/src/types/index.ts` | Hand-written DB types |

---

## Tech Debt / Refactoring Required

These files are built but use the old naming. They work but MUST be refactored before shipping:

| File | Issue | Action |
|---|---|---|
| `app/(dashboard)/[tenantSlug]/layout.tsx` | Wrong route param name | Move to `[clubSlug]/layout.tsx` |
| `apps/web/src/middleware.ts` | References `tenantSlug` variable names | Rename variables to `clubSlug` |
| `apps/web/src/lib/auth.ts` | `getUserProfile()` queries old `profiles` + `tenants` tables | Rewrite to use `users` + `clubs` + `club_staff` |
| `apps/web/src/app/api/auth/profile/route.ts` | Queries old schema, returns `tenantSlug` | Rewrite to use new schema, return `clubSlug` |
| `apps/web/src/components/sidebar.tsx` | Uses `staff` role, references `tenantSlug` | Update to `coach` role, `clubSlug` |
| `apps/web/src/components/bottom-nav.tsx` | Uses `staff` role | Update to `coach` role |
| `packages/database/src/enums.ts` | Has old enum values (MemberStatus, SessionType, TenantPlan) | Replace with new enums (see FEATURES.md) |
| `packages/database/src/types/index.ts` | Has old table types (tenants, profiles, members, sessions) | Replace with new table types (users, clubs, club_staff, club_memberships, batches, etc.) |
| `app/(auth)/signup/page.tsx` | No WhatsApp OTP phone verification step | Add OTP modal after form submit |
| `app/(auth)/login/page.tsx` | No post-login club-switcher for multi-club owners | Add club selection when user owns 2+ clubs |

---

## Session Log

### Session 1 — 2026-03-23
Turborepo monorepo scaffolded. Next.js 14 app with 9 module route stubs under `/:tenantSlug/*`. Supabase auth middleware, `@zenzo/database`, `@zenzo/ui`, `@zenzo/utils`, `@zenzo/config`. `.env.example`, `.gitignore`, `README.md`.

### Session 2 — 2026-03-23
Complete UI/UX design system in `docs/design/` (17 files).

### Session 3 — 2026-03-23
`FEATURES.md` (1,415 lines) — production-grade feature spec with 13-table schema, RLS policies, P0–P2 features, API route map.

### Session 4 — 2026-03-24
Built: `packages/database/src/enums.ts`, `packages/database/src/types/index.ts`, `apps/web/src/lib/supabase/server.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/middleware.ts`, `apps/web/src/app/api/auth/profile/route.ts`, `apps/web/src/components/sidebar.tsx`, `apps/web/src/components/bottom-nav.tsx`, `apps/web/src/app/(dashboard)/[tenantSlug]/layout.tsx`.

Key fixes: upgraded `@supabase/ssr` to 0.9.0 + `@supabase/supabase-js` to 2.100.0. Fixed `data: never` bug (create client directly). Added `Relationships: []` to hand-written types.

### Session 5 — 2026-03-28
Rewrote `CLAUDE.md`, `FEATURES.md`, and created `docs/dev/conventions.md` to reflect new product philosophy (two-sided platform, no shadow users, `clubSlug` naming, `coach` role, new data model).

---

## Status

### Built (needs refactoring to new model)
- [~] Monorepo skeleton (Turborepo + pnpm) — correct
- [~] Auth middleware — logic correct, variable names use old `tenantSlug`
- [~] SSR Supabase client (`lib/supabase/server.ts`) — correct, keep
- [~] Auth utility `getUserProfile()` — queries old schema, needs rewrite
- [~] POST /api/auth/profile — queries old schema, needs rewrite
- [~] Sidebar — logic correct, wrong role name (`staff` → `coach`), wrong param (`tenantSlug` → `clubSlug`)
- [~] BottomNav — same as sidebar
- [~] Dashboard layout `[tenantSlug]/layout.tsx` — needs rename + new schema
- [~] DB enums — old values, needs new enum additions
- [~] DB types — old table structure, needs complete replacement
- [~] Auth pages (login, signup, forgot-password) — signup missing WhatsApp OTP step

### Up Next (Refactor Sprint)
1. Replace `packages/database/src/enums.ts` with new enum values
2. Replace `packages/database/src/types/index.ts` with new table types
3. Rename `[tenantSlug]` → `[clubSlug]` route folder
4. Rewrite `lib/auth.ts` to use `clubs` + `club_staff` tables
5. Rewrite `api/auth/profile/route.ts` to return `clubSlug`
6. Update `sidebar.tsx` + `bottom-nav.tsx` role names + param names
7. Add WhatsApp OTP verification step to signup page

### P0 Build Order (after refactor)
1. **P0.1** — Auth + Club Onboarding wizard (5-step)
2. **P0.2** — Member Management (invite-only, WhatsApp invite, status lifecycle)
3. **P0.3** — Batch Management (create, assign, many-to-many)
4. **P0.4** — Attendance (THE ritual screen, offline IndexedDB queue)
5. **P0.5** — Fee Plans CRUD
6. **P0.6** — Payments Manual (record, overdue list, history)
7. **P0.7** — Dashboard (owner digest, coach view)
8. **P0.8** — WhatsApp via Interakt (invite, welcome, receipt, reminder)
9. **P0.9** — Settings (business profile, terminology, notifications, Razorpay)

---

## Key Docs (read before each session)
1. `CLAUDE.md` — this file
2. `FEATURES.md` — full feature spec, schema, API routes, acceptance criteria
3. `docs/dev/conventions.md` — code patterns, naming conventions, folder structure
4. `docs/design/` — screen-by-screen UI specs (reference the relevant file per feature)

## Commands Reference
```bash
# Dev
pnpm dev                          # Run all apps (from root)
cd apps/web && pnpm dev           # Run web app only

# Type checking
pnpm typecheck                    # From root (runs all packages)
cd apps/web && pnpm typecheck     # Web app only

# Lint
pnpm lint

# Supabase types (run after any migration)
cd packages/database && supabase gen types typescript --local > src/types/database.gen.ts
```

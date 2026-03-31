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
**Google Auth** via `supabase.auth.signInWithOAuth({ provider: 'google' })`.

**Signup flow:**
1. Full Name + Phone + Email + Password → submit
2. Or user clicks "Continue with Google"
3. On success: Supabase account + `users` row created
4. Post-signup routing: invited? → create membership + portal. Owner? → onboarding wizard.

**Phone is NOT an auth credential.** It's collected at signup, stored in `users.phone`, used for WhatsApp only. Wait for phone verification is deferred to save costs.

### Future (do NOT build yet)
- Phone OTP login — additive button on login page
- Interakt integration for WhatsApp notifications and OTP

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
| `apps/web/src/app/(dashboard)/[clubSlug]/layout.tsx` | Async layout — Club dashboard shell |
| `packages/database/src/enums.ts` | All DB enum values (single source of truth) |
| `packages/database/src/types/index.ts` | Hand-written DB types |

---

## Tech Debt / Refactoring Required

| File | Issue | Action |
|---|---|---|
| `apps/web/src/middleware.ts` | Comments reference `tenantSlug` | Rename comments to `clubSlug` (cosmetic) |
| `apps/web/src/app/api/onboarding/batch/route.ts` | `days: days as any[]` cast | Fix when DayOfWeek enum is enforced in Postgres |
| `apps/web/src/app/api/onboarding/invites/route.ts` | Invites acknowledged but not persisted | Wire up membership creation + WhatsApp in Sprint 2 + 7 |

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

### Session 7 — 2026-03-28
Sprint 1 complete (S1.1–S1.4):
- **S1.3** — Already done: `login/page.tsx` calls `POST /api/auth/profile` → routes to 1-club dashboard, multi-club `/clubs` picker, or `/onboarding`. `auth/callback/route.ts` mirrors this for Google OAuth.
- **S1.4** — Already done: `[clubSlug]/layout.tsx` built in Sprint 0.
- **S1.2** — Created `apps/web/src/app/api/clubs/route.ts` (`POST /api/clubs`): canonical club creation (name, slug, business_type, city → `clubs` row + `club_staff` row, `verification_status: pending`, `listed: false`). Separate from `/api/onboarding/studio` which additionally upserts the `users` row for first-time onboarding.
- **S1.1** — Onboarding wizard updated: added Step 4 "Invite First Members" (skippable, up to 5 phone+name pairs). Created `apps/web/src/app/api/onboarding/invites/route.ts` (`POST /api/onboarding/invites`): validates 10-digit Indian phones, acknowledges queue. WhatsApp dispatch + membership creation deferred to Sprint 7 + Sprint 2. Wizard now has 4 progress-dot steps + a step 5 completion screen (no dot active). Also updated Tech Debt table — `onboarding/page.tsx` and `api/onboarding/studio/route.ts` are now on the new schema (stale entries removed).

### Session 6 — 2026-03-28
Sprint 0 refactor complete (R1–R6):
- **R1** `packages/database/src/enums.ts` — replaced with new enums: `StaffRole` (owner/coach), `MembershipStatus`, `BillingCycle`, `PaymentMethod`, `ClubCategory`, `VerificationStatus`, `DayOfWeek`, `AttendanceStatus`.
- **R2** `packages/database/src/types/index.ts` — replaced with new table types: `users`, `clubs`, `club_staff`, `club_memberships`, `member_batches`, `batches`, `fee_plans`, `attendance_records`, `payments`.
- **R3** Renamed `app/(dashboard)/[tenantSlug]/` → `[clubSlug]/`. Updated `layout.tsx`: `params.tenantSlug` → `params.clubSlug`, `UserRole` → `StaffRole`, member-redirect guard updated.
- **R4** Rewrote `lib/auth.ts` `getUserProfile()` to query `clubs` → `club_staff` → `users`. Returns `clubId` (not `tenantId`). `UserProfile.role` is now typed as `StaffRole`.
- **R5** Rewrote `api/auth/profile/route.ts` to query `club_staff` + `clubs`, returns `{ clubSlug, role }`.
- **R6** Updated `sidebar.tsx` + `bottom-nav.tsx`: `tenantSlug` → `clubSlug`, `"staff"` → `StaffRole.Coach`, `staffPrimaryNav` → `coachPrimaryNav`. Deleted dead `sidebar-server.tsx` stub. Fixed `login/page.tsx` to destructure `clubSlug` from profile response.

---

## Status

### Built and on new model (Sprint 0 complete)
- [x] Monorepo skeleton (Turborepo + pnpm)
- [x] Auth middleware — Edge JWT guard
- [x] SSR Supabase client (`lib/supabase/server.ts`)
- [x] Auth utility `getUserProfile()` — queries `clubs` + `club_staff` + `users`
- [x] POST /api/auth/profile — returns `clubSlug` from new schema
- [x] Sidebar — `StaffRole`, `clubSlug`, `coachPrimaryNav`
- [x] BottomNav — `StaffRole`, `clubSlug`, `coachPrimaryItems`
- [x] Dashboard layout `[clubSlug]/layout.tsx` — new schema, `StaffRole` guard
- [x] DB enums — `StaffRole`, `MembershipStatus`, `BillingCycle`, `PaymentMethod`, `ClubCategory`, `VerificationStatus`, `DayOfWeek`, `AttendanceStatus`
- [x] DB types — `users`, `clubs`, `club_staff`, `club_memberships`, `member_batches`, `batches`, `fee_plans`, `attendance_records`, `payments`
- [x] Auth pages (login, signup, forgot-password) combined with Google OAuth

### Sprint 1 complete (P0.1)
- [x] S1.1 — Onboarding wizard (5 steps: business type, studio setup, batch, invite members, done)
- [x] S1.2 — `POST /api/clubs` — canonical club creation
- [x] S1.3 — Post-login routing (1 club → dashboard, 2+ → picker, no club → onboarding)
- [x] S1.4 — `[clubSlug]/layout.tsx` async server component with single `getUserProfile()` call

### Sprint 2 complete (P0.2)
- [x] S2.1 — Member list page with search, filter chips, desktop table, mobile cards, skeleton
- [x] S2.2 — Add Member: `members/invite` page + form + `POST /api/members/invite` (phone lookup, active membership)
- [x] Member profile — `members/[memberId]` with Overview tab (stats + recent payments), placeholder tabs

### Session 8 — 2026-03-30
Sprint 2 (P0.2 Member Management) complete:
- **S2.1** — Already done (members list with search, filter chips, skeleton, desktop table, mobile cards).
- **S2.2** — Built invite flow: `members/invite/page.tsx` (SC, pre-fetches batches + plans) + `invite/_components/invite-form.tsx` (client form: phone, batch select, plan select, start date). Created `POST /api/members/invite`: auth → staff verify → phone lookup → if user exists create `active` membership + `member_batches` row; if not found return `{ status: 'not_on_zenzo' }` (WhatsApp invite deferred to S2.7/P0.8).
- **Profile page** — Built `members/[memberId]/page.tsx` (SC: membership + user + batches + attendance stats + recent payments) + `_components/member-profile-client.tsx` (tabs: Overview with stat cards + recent payments; Attendance/Payments/Progression as placeholders).

### Session 9 — 2026-03-30
Sprint 3 (P0.3 Batch Management) complete:
- **S3.1** — Batch list page: `batches/page.tsx` (SC shell + Suspense) + `_components/batches-loader.tsx` (3-query: batches, member counts, coach names) + `_components/batches-client.tsx` (2-col card grid, empty state, ⋮ menu, `BatchListSkeleton`). Cards show timing, days, member count, coach.
- **S3.2** — Create batch: `batches/new/page.tsx` (SC, pre-fetches coaches) + `new/_components/create-batch-form.tsx` (day toggle pills, time pickers, coach select, capacity, description). `POST /api/batches`: auth → staff verify → insert batch → return `{ batchId }`.
- **S3.3** — Batch detail: `batches/[batchId]/page.tsx` (SC: batch + members + today's attendance) + `[batchId]/_components/batch-detail-client.tsx` (header, stat cards, Take Attendance CTA, desktop table + mobile cards, AddMemberDialog). APIs: `POST /api/batches/[batchId]/members` (assign), `DELETE /api/batches/[batchId]/members/[memberBatchId]` (remove), `GET /api/batches/[batchId]/eligible-members` (active members not yet in batch).

### Session 10 — 2026-03-30
Finished Sprint 2 (P0.2 Member Management) pending items:
- **S2.4**: Implemented `Attendance` and `Payments` tabs in the member profile, rendering recent attendance records and full payment history.
- **S2.6**: Implemented `Deactivate` (status = expired) and `Delete` (soft delete with status = deleted) member actions in the profile actions dropdown. Added API route `PATCH/DELETE /api/clubs/[clubId]/members/[memberId]/action`.
- **S2.8 / Sprint 7 prep**: Added `Send WhatsApp` link natively using `wa.me/91{phone}`.
- Updated `MembershipStatus` Enum to include `Deleted` and fixed associated downstream TypeScript errors.

### Session 11 — 2026-03-30
Record Payment + Sprint 4 (P0.4 Attendance) complete:
- **Record Payment** — `RecordPaymentModal` + `POST /api/members/[membershipId]/payments`: captures amount/method/date/note, advances `next_due_date` by billing cycle, reactivates overdue/expired membership. Wired into member profile Overview stat card.
- **S4.1** — Take Attendance: `attendance/take/[batchId]/page.tsx` (SC: batch + active members + today's existing records) + `_components/take-attendance-client.tsx` (per-member present/absent toggle, bulk mark all, progress summary, save → `POST /api/attendance/[batchId]`). API bulk-upserts on `(membership_id, batch_id, date)`.
- **S4.2** — Attendance History: `attendance/history/page.tsx` (SC: last 30 days, all batches) + `_components/attendance-history-client.tsx` (sessions grouped by date+batch, batch filter dropdown, present/absent counts, mini progress bar). `/attendance` redirects to `/attendance/history`.
- Fixed `any` violation in member profile page (`as AttendanceStatus`) and route (`updateData` typed as `{ plan_id: string; next_due_date?: string }`).

### Session 12 — 2026-03-30
Sprint 5 (P0.5 Fee Plans) + Sprint 6 (P0.6 Payments Manual) complete:
- **Sprint 5** — Already fully built (discovered pre-existing): `plans/page.tsx`, `plans/new/page.tsx`, `plans/[planId]/page.tsx`, `_components/{plans-loader, plans-client, plan-form}.tsx`, `POST /api/plans`, `PUT /api/plans/[planId]`, `DELETE /api/plans/[planId]`. Fixed: removed `updated_at` field from PUT (not in DB type).
- **Sprint 6** — Payments page: `payments/page.tsx` (SC: overdue memberships + payment history last 90 days) + `_components/payments-client.tsx` (Overdue tab with desktop table + mobile cards + "Record Payment" button wired to RecordPaymentModal; History tab with full payment list). Overdue sorted by days overdue, count badge on tab.

### Session 13 — 2026-03-30
Sprint 7 (P0.7 Dashboard) complete:
- **Shared primitives** — `dashboard/_components/dashboard-ui.tsx`: `StatCard` (label/value/sub/accent/action, left border colour accent), `SectionCard` (titled card wrapper with optional header action), `EmptySection`, `DashboardSkeleton` (shimmer grid).
- **OwnerDashboard** (`owner-dashboard.tsx`) — SC, 4 KPI cards (active members, overdue count, month revenue, batch count), Today's Sessions (attendance CTA or present/absent badge), Overdue Members (top 5, days overdue), Recent Payments (last 5 this month). All sections link to deeper pages.
- **CoachDashboard** (`coach-dashboard.tsx`) — SC, 3 KPI cards (today's sessions, my members, attendance rate today), Today's Sessions (Take Attendance CTA or edit link + present count), All My Batches (non-today batches).
- **Dashboard page** (`dashboard/page.tsx`) — calls `getUserProfile()`, branches on `StaffRole`, wraps both views in `<Suspense fallback={<DashboardSkeleton />}>`.

### Session 14 — 2026-03-30
Sprint 8 (P0.9 Settings + Staff) complete:
- **Settings** — `settings/page.tsx` (SC: owner-only guard, fetches club profile) + `_components/settings-form.tsx` (client: name/city/phone/category, inline save confirmation). `PATCH /api/clubs/[clubId]/settings`: resolves UUID-or-slug, owner-only, updates clubs row.
- **Staff** — `staff/page.tsx` (SC: owner-only, lists all club_staff joined with users) + `_components/staff-client.tsx` (staff list with owner/coach badge, Add Coach dialog with phone lookup, Remove confirmation dialog, guards owner + self from removal). `POST /api/clubs/[clubId]/staff`: phone lookup → create coach row, 409 if already staff. `DELETE /api/clubs/[clubId]/staff/[staffId]`: guards owner removal + self-removal.

### Session 15 — 2026-03-31
Sprint R (Routing Fix) complete:
- **R1** — `POST /api/auth/profile` now returns `{ destination }` instead of a clubs array. No-staff users get `{ destination: '/portal' }`. Login page updated to use `destination`. Auth callback redirects no-staff to `/portal`.
- **R2** — `app/portal/layout.tsx`: auth guard + minimal top bar. `app/portal/page.tsx`: SC with Suspense; shows membership list (name, status, next due date) or empty state with "Check for Invites" + "Create a Club" CTAs.
- **R3** — Onboarding guard already existed (`useEffect` redirect if `club_staff` row found). No change needed.
- **R4** — `signup/page.tsx`: added `useSearchParams` for `?token`, calls `POST /api/auth/activate-invite?token=xxx` if present, redirects to `/portal`. Wrapped in `Suspense`. Created stub `api/auth/activate-invite/route.ts` (Sprint T will implement).

### Session 16 — 2026-03-31
Sprint T (Invite Token System) complete:
- **T1** — Migration `packages/database/migrations/004_club_invites.sql`: `club_invites` table with token, status, plan_id, batch_id, invited_by, expires_at. Added `ClubInvite` type to `packages/database/src/types/index.ts`.
- **T2** — Updated `POST /api/members/invite`: when user not found by email, inserts `club_invites` row with UUID token and sends Supabase invite email to `/signup?token={token}`. Returns `{ status: 'invite_sent', inviteId }`.
- **T3** — Implemented `POST /api/auth/activate-invite`: token-based activation (validates pending + not expired, creates `club_membership` + `member_batches`, marks invite `accepted`) + email sweep mode (activates all pending invites matching user email on signup without a token).
- **T4** — Built `/portal/invites` page (client): lists pending invites with club name, inviter, plan, batch, expiry. [Accept] calls activate-invite → /portal. [Decline] marks expired. Created `GET /api/portal/invites` + `POST /api/portal/invites/[id]/decline`.
- **T5** — Updated `POST /api/onboarding/invites`: inserts `club_invites` rows with tokens before sending Supabase invite emails. Links point to `/signup?token={token}`.

### Session 17 — 2026-03-31
Sprint P (Member Portal) complete:
- **P1 + P4** — Already done: `/portal` club list page + `/portal/layout.tsx` minimal top bar.
- **P2** — Built `/portal/[clubSlug]/page.tsx` (SC + Suspense) + `_components/portal-club-client.tsx` (3-tab client: Home, Attendance, Payments). Home tab: attendance this month progress bar, next fee due, last payment, batch schedule. Attendance tab: 90-day calendar heatmap (green=present, red=absent, grey=no class) + monthly summary + streak. Payments tab: next due date + payment history list linking to receipts.
- **P3** — Built `/portal/[clubSlug]/payments/[paymentId]/page.tsx`: receipt detail (✓ Payment Recorded header, amount, club, member, date, method, plan, reference, note). PDF download stub for Phase 2.

### Session 18 — 2026-03-31
Sprint E (Explore Clubs) complete:
- **E1** — `GET /api/clubs/explore`: public endpoint, returns verified+listed clubs. Supports `?q`, `?city`, `?category`, `?page`. Paginated at 20/page.
- **E2** — `/explore` page: public SC with `SearchBar` + `CategoryChips` client islands (URL-param driven), async `ClubResults` SC, skeleton shimmer, empty state.
- **E3** — `/clubs/[slug]` public club page: hero (name, category badge, city), About, Plans & Pricing, Schedule (batches with time + days), Coaches list, CTA section (WhatsApp button, Check Invites, Sign Up). `GET /api/clubs/[slug]/public` returns all public club data. Returns 404 for unverified clubs.
- **E4** — Portal empty state: added third CTA button "Explore Clubs → /explore" below Create a Club.
- **E5** — Nav links: "Explore clubs" added to landing page nav. "Explore clubs →" link added to login + signup auth cards.
- Added `description: string | null` to `clubs` DB type.

### Up Next
1. Sprint N — Notifications via Resend (email transactionals)
2. P0.8 — WhatsApp via Interakt (deferred — needs API key + infra)

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

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

### Session 19 — 2026-03-31
Sprint Q (Feature completion + Bug fixes) complete:
- **P0.2 bulk CSV invite** — `members/invite/csv/page.tsx` + `_components/csv-invite-form.tsx`: 3-step (paste/upload → preview + settings → results), parseCsv(), sends to `POST /api/members/invite` per row.
- **P0.2 bulk actions** — Checkboxes in members list + bulk toolbar (Deactivate/Delete). `POST /api/clubs/[clubId]/members/bulk`. Selected rows highlighted. `Checkbox` and `Switch` added to `@zenzo/ui` using Radix UI primitives.
- **P0.2 Change Batch** — "Change Batch" action in member profile dropdown + dialog. `update_batch` action in `PATCH /api/clubs/[clubId]/members/[memberId]`.
- **P0.4 navigate-away guard** — `beforeunload` in take-attendance-client.
- **P0.4 drop-in attendance** — "Add Drop-in" button + dialog, `GET /api/attendance/[batchId]/drop-in` lookup by phone.
- **P0.5 auto-expiry cron** — `GET /api/cron/expire-memberships` (Bearer token auth, service client). `vercel.json` schedules at 19:00 UTC (00:30 IST) daily.
- **P0.6 CSV export + Send Reminders** — Export CSV button in payment history. "Send Reminders to All" dialog with per-member WhatsApp deep links.
- **P0.9 Settings** — Logo upload (Supabase Storage `club-logos` bucket), Customization form (member_label, progression_enabled, billing_cycle_type), Notification toggles (3 switches). All stored in `clubs.terminology` JSON via `terminology_patch`.
- **Bug fix: "Unknown" member names** — Root cause: `users` RLS only allowed reading own row; staff couldn't see other users' names via join. Fix: migration `20260331000006_fix_users_rls.sql` adds policies for staff to read member + co-staff user profiles.
- **Bug fix: Google OAuth names** — `handle_new_user` trigger only read `raw_user_meta_data->>'full_name'`; Google sends `name`. Fixed in same migration to `coalesce(full_name, name, 'User')`.
- **Bug fix: Invited user names** — `inviteUserByEmail` fires trigger with no name metadata → `full_name = 'User'`. Fixed: invite form now collects "Member Name" (required), passed to API, forwarded as `data.full_name` to `inviteUserByEmail`.
- **Phone mandatory for Google OAuth** — `auth/callback/route.ts` checks if OAuth user has empty phone → redirects to `/complete-profile`. New `/complete-profile/page.tsx` collects phone (+ corrects name), updates `users` row via browser Supabase client, then routes via `POST /api/auth/profile`.

### Session 20 — 2026-04-01
Sprint PH (Phone-First Invite System) complete:
- **PH.1** — InviteForm field order flipped: Phone (required, first), Name (required), Email (optional).
- **PH.2 + PH.4** — `not_on_zenzo` result state replaced by WhatsApp CTA. Green "Send invite via WhatsApp" button opens `wa.me/91{phone}?text=...` deep link with invite token in signup URL. Secondary "Email invite also sent" notice shown if email was provided.
- **PH.3** — `POST /api/members/invite` now phone-first: looks up `users.phone`, falls back to `users.email` if email provided. Builds and returns `whatsappLink` + `emailSent` flag. Email invite via `inviteUserByEmail` is optional (only fires if email given).
- **PH.5** — CSV invite column order updated to `phone, name, email`. Parser destructuring and placeholder text updated. Result status handles `not_on_zenzo`.
- **Migration 005** — `club_invites.email` made nullable; `phone` column added with index.
- **Types** — `ClubInvite.email` updated to `string | null`, `phone: string | null` added.
- **Downstream fixes** — `activate-invite/route.ts` `InviteRow.email` updated to `string | null`; `onboarding/invites/route.ts` inserts `phone: null` to satisfy updated type.

### Session 21 — 2026-04-01
Sprint DA (Dashboard Alive) complete:
- **DA.1** — `StatCard` in `dashboard-ui.tsx` updated with `delta?: { label, direction }` prop. `direction: "up"` = green, `"down"` = red, `"neutral"` = muted. Owner KPI cards wired: Active Members shows "+N joined this week" (queries `joined_at >= 7 days ago`), Revenue shows "▲/▼ X% vs last month" (queries last month's payments for %).
- **DA.2** — Contextual greeting subtitle updated: shows overdue count (red) + today's session count, using already-fetched data. Falls back to formatted date when both are zero.
- **DA.3** — New `dashboard/_components/activity-feed.tsx` Server Component: queries last 5 payments + today's absent records, merges and sorts newest-first, renders a timeline with 💳/❌ icons + relative `timeAgo()` helper. Placed as `lg:col-span-2` section card after Recent Payments.
- **DA.4** — `KPITimestamp` client component added to `dashboard-ui.tsx`: records `Date.now()` on mount, updates every 60s, shows "Last updated · X minutes ago" above KPI grid. `"use client"` added to `dashboard-ui.tsx` (all exports are presentational).

### Session 22 — 2026-04-01
Sprint QR (QR Code Attendance) complete:
- **QR.1** — `GET /api/batches/[batchId]/qr`: HMAC-SHA256 signed token (`lib/qr-token.ts`) scoped to today's date. Token = `base64url(payload).HMAC-SHA256(QR_SECRET)`. Returns `{ checkInUrl, token, batchName, expiresAt }`.
- **QR.2** — Public check-in page at `/checkin?b={batchId}&t={token}` (Server Component validates token + fetches batch name; `CheckInClient` handles phone entry + POST). `/checkin` and `/api/checkin` added to middleware public paths.
- **QR.3** — "QR Code" button in batch header → fullscreen `QrModal` overlay. Fetches token on open, renders `QRCodeSVG` (qrcode.react v4, `marginSize={0}`). Shows expired state with Refresh button.
- **QR.4** — `GET /api/checkin?batchId&date&token` returns live present count. QrModal polls every 30s while open via `setInterval`; cancels on token expiry.
- **QR.5** — Security: HMAC `timingSafeEqual` verification, date-scoped expiry, drop-in detection, duplicate check-in returns `alreadyMarked: true` (server-side unique constraint on `membership_id,batch_id,date`). `marked_by: null` for QR check-ins.
- Added `qrcode.react ^4.2.0` to `apps/web` dependencies. `QR_SECRET` env var required (falls back to dev default).

### Session 23 — 2026-04-01
Sprint MK (Marketing Page Enhancements) complete:
- **MK.1 NavBar** — Extracted nav into `_components/marketing/navbar.tsx` client component. Added hamburger menu for `< md` breakpoints: hides "Explore clubs" + "Sign in" behind it, keeps primary CTA visible.
- **MK.2 Hero headline** — Rewrote headline to "Run your gym from the mat, not a spreadsheet." (embeds the what). Added problem-first opener pill: "You didn't open a gym to chase payments on WhatsApp." Added secondary CTA "See how it works →" linking to `#how-it-works`.
- **MK.3 Subheadline** — Rewritten to "Zenzo manages attendance, billing, and member communication for martial arts academies, gyms, and studios."
- **MK.4 Pricing signal** — Added "Free for clubs under 30 members. Plans from ₹999/mo." below CTA.
- **MK.5 Hero mockup** — Expanded to 5 present + 1 absent members, richer batch label "6 AM Kickboxing — Andheri West", completion time "Completed in 38s". Added bottom-fade to suggest more members. Fixed `dangerouslySetInnerHTML` → Tailwind `[perspective:1000px]`.
- **MK.6 Social proof bar** — Added between hero and features: active clubs count, monthly attendance marks, "Built in India, for India" with ₹ native + WhatsApp-first signals.
- **MK.7 Sticky scroll visuals** — Replaced placeholder grey rectangles with real member rows (initials, name, present/absent state). Replaced base64 dot pattern with CSS `radial-gradient`.
- **MK.8 How It Works section** — New 3-step section with anchor `#how-it-works`: "Create your club → Invite via WhatsApp → Mark attendance tomorrow."
- **MK.9 Bento section** — Heading rewritten to "The boring stuff, done perfectly." Added "Built for martial arts academies · CrossFit boxes · yoga studios · dance schools" tagline. Fixed "Zero Shadow Accounts" copy → "One Real Profile Per Member". Fixed "Batches that Breathe" to include concrete outcome (auto-generates daily roll calls).
- **MK.10 Footer** — CTA rewritten: headline "Be ready." with opener "Your next batch starts tomorrow." Copy updated to "Attendance in 30 seconds. Payments on autopilot." CTA button renamed "Start for free". Pricing signal repeated in footer.

### Session 24 — 2026-04-02
Sprint MK2 (Marketing Page — Pending Enhancements) complete:
- **I1** — `GET /api/marketing/stats` (service client, 5-min revalidate): counts `attendance_records` last 7 days + total clubs. Social proof bar in `page.tsx` now server-fetches real live numbers with a pulsing "live" badge. `formatCount()` helper formats 0→"—", 1000→"1.0k+".
- **I5** — Category selector in hero: 4 pill buttons (🏋️ Gym · 🥋 Martial Arts · 💃 Dance · 🧘 Yoga). Selecting a category animates the subheadline `<span>` (Framer AnimatePresence), the batch label, member names, absent member, and completion time in the 3D mockup. Default: Martial Arts.
- **I3** — Interactive demo section (`interactive-demo.tsx`): full tappable attendance screen with 6 members, live elapsed timer starts on first tap, progress bar, success state with elapsed seconds, "Try again" reset. Placed between bento grid and footer.
- **T1** — `DarkFooter` is now a pure Server Component (removed `"use client"` + framer-motion). Entrance animation replaced with CSS `@keyframes footerFadeUp` scoped inside a `<style>` tag.
- **T3** — `FeatureSections` wrapped with `next/dynamic` in `page.tsx` for JS code-splitting (SSR preserved).

### Session 25 — 2026-04-10
Sprint N (Notifications) + Sprint Off (Offline Attendance) complete:
- **N1** — Installed `resend` package. `lib/email.ts`: `sendEmail()` wrapper (skips silently if `RESEND_API_KEY` not set). `lib/email-templates/`: `invite.ts`, `welcome.ts`, `receipt.ts`, `reminder.ts`.
- **N2** — `POST /api/members/invite`: Resend invite email replaces raw `inviteUserByEmail`. Fetches inviter name + plan name. Fires only when email provided.
- **N3** — `POST /api/auth/activate-invite`: fire-and-forget welcome email after activation. Checks `notif_welcome_message` toggle in `clubs.terminology`.
- **N4** — `POST /api/members/[membershipId]/payments`: fire-and-forget receipt email after payment insert. Checks `notif_payment_receipt` toggle. Fixed `select("*")` → explicit columns.
- **N5** — `GET /api/cron/expire-memberships`: batch-sends reminder emails to newly-overdue memberships. Checks `notif_payment_reminder` toggle per club.
- **Off1** — `lib/attendance-db.ts`: IndexedDB store (`zenzo-attendance`). API: `saveDraft`, `queueForSync`, `loadSession`, `clearSession`, `getAllQueued`.
- **Off2+3** — `take-attendance-client.tsx`: draft saved on every toggle, restored on mount, network failures queue to IndexedDB, `online` listener auto-retries queue, sync-status pill, offline banner, button label adapts.

### Session 26 — 2026-04-20
Phase 2 consumer experience planned. Full sprint plan in `docs/consumer-experience.md`:
- **UC1** — Interest Onboarding: post-signup interest selection screen (`/onboarding/interests`), `user_interests` + `interest_categories` tables, `POST /api/users/interests`, redirect logic wired into signup + OAuth callback.
- **UC2** — Discovery Home: `/discover` page with invites banner + interest-matched club grid, `GET /api/discover` API, portal empty state updated to redirect to `/discover`.
- **UC3** — Global Search: `/search` page (clubs / coaches / members tabs), `GET /api/search` API.
- **UC4** — Public Profiles + Portal Nav: `/u/[username]` member profile, `/coaches/[userId]` coach profile, `/profile` own edit, portal bottom nav (Home / Discover / Search / Profile).
- **UC5** — Ratings & Reviews: `club_reviews` + `coach_ratings` tables, star rating component in `@zenzo/ui`, review APIs.
- **UC6** — Achievements: `member_achievements` table, award badge UI in club dashboard, achievements tab on member profile, display on public profile.
- **New DB columns**: `users.bio`, `users.avatar_url`, `users.username`, `users.onboarding_step`.
- Updated `docs/sprints.md` sprint order to reflect Phase 2 is now active.

### Session 27 — 2026-04-21
Sprint UC2 (Discovery Home) complete:
- **UC2.1** — `GET /api/discover`: auth required, reads `user_interests` + `city`, maps interest slugs to `ClubCategory` values (boxing/martial_arts → `martial_arts`, fitness/crossfit → `gym`, dance → `dance`, yoga → `yoga`, other → `other`, swimming omitted — no matching category). Queries verified+listed clubs filtered by matched categories and user city. Counts pending invites via admin client (bypasses email/phone-keyed RLS). Returns `{ inviteCount, userCity, clubs[], hasMore, nextCursor }`. Cache-Control: `private, max-age=300`.
- **UC2.2** — `/discover` page: `discover/layout.tsx` (header with wordmark + initials avatar), `discover/page.tsx` (SC shell with Suspense), `_components/discover-clubs.tsx` (async SC: invite banner if `inviteCount > 0`, "For you in [City]" heading, 2×3 club card grid with category badges, "Set your interests" nudge if no interests saved, empty state with "Explore all clubs →", "Explore all →" footer link). Skeleton: shimmer banner + 6 shimmer cards.
- **UC2.3** — Portal routing: `portal/page.tsx` now redirects to `/discover` instead of showing EmptyState when user has no memberships. Removed `EmptyState` component. `POST /api/auth/profile`: no-staff users with `onboarding_step` set and no memberships now receive `{ destination: '/discover' }` (2 extra parallel queries: users.onboarding_step + club_memberships count).
- **Bug fix** — Fixed pre-existing `toast()` call signature in `onboarding/interests/page.tsx` (was using `toast({ variant: 'destructive' })` — correct is `toast.error("...")`).

### Session 28 — 2026-04-21
Sprint UC4 (Public Profiles + Portal Nav) complete:
- **UC4.1** — `ConsumerNav` client component (`components/consumer-nav.tsx`): desktop horizontal nav links (hidden md:flex inside header) + mobile fixed bottom nav (md:hidden). Active state via `usePathname()`. Updated `portal/layout.tsx`, `discover/layout.tsx`, new `profile/layout.tsx` — all share the nav shell and do a membership count to determine `homeHref`. Avatar in top bar links to `/profile`. `pb-16 md:pb-0` on main keeps content above mobile nav.
- **UC4.2** — `PATCH /api/profile`: updates `full_name`, `phone`, `bio` (≤160), `username`, `avatar_url`, `city`. Validates username regex + reserved list; catches `23505` unique constraint → returns `{ error: "username_taken" }`.
- **UC4.3** — `GET /api/profile/check-username?u=`: regex + reserved list + DB uniqueness check. Returns `{ available, reason? }`.
- **UC4.4** — `/profile/page.tsx` (SC + Suspense) + `_components/profile-form.tsx` (client): avatar upload to Supabase Storage `user-avatars` bucket, bio textarea with 160-char counter, username with debounced availability indicator, city autocomplete, interest grid, parallel save of profile + interests.
- **UC4.5** — `/u/[username]/page.tsx`: public member profile (service client). Avatar/initials, name, @username, member since, bio, interest pills, attendance count, active clubs list, achievements placeholder. SEO `generateMetadata()`.
- **UC4.6** — `/coaches/[userId]/page.tsx`: public coach profile (service client). Bio, ratings placeholder, batch schedule, club links, reviews placeholder. 404 if user has no coach staff rows. SEO `generateMetadata()`.
- **UC4.7** — `/clubs/[slug]/page.tsx`: added "Reviews" section with placeholder above the CTA.
- **Middleware** — Added `/u/`, `/coaches/`, `/clubs/`, `/explore` to `PUBLIC_PATHS`.

### Session 29 — 2026-04-21
Sprint UC3 (Global Search) complete:
- **UC3.1** — Migration `packages/database/migrations/007_search_indexes.sql`: `CREATE EXTENSION IF NOT EXISTS pg_trgm` + GIN indexes on `clubs.name`, `users.full_name`, `users.username`.
- **UC3.2** — `GET /api/search?q=&type=clubs|coaches|members`: clubs/coaches public (no auth); members auth required. Clubs: ILIKE on name + city, verified+listed only. Coaches: two-step (users ILIKE name → club_staff filter for coach role + clubs). Members: ILIKE on full_name + username, includes interest slugs + achievement_count (placeholder). Sanitizes `,*` from query string to prevent PostgREST filter injection. `/api/search` added to `PUBLIC_PATHS` in middleware.
- **UC3.3** — `/search/page.tsx` (client component): sticky search input with clear button, 3-tab bar (Clubs/Coaches/Members), debounced 300ms, URL sync (`?q=&type=`), result cards per type (ClubCard/CoachCard/MemberCard), 5-item skeleton shimmer, empty state per tab, hint for unauthenticated members tab.
- **UC3.4** — `/search/layout.tsx`: mirrors portal/discover layout with ConsumerNav + homeHref resolution.

### Session 30 — 2026-04-21
Sprint UC5 (Ratings & Reviews) complete:
- **UC5.1** — Migration `packages/database/migrations/008_ratings.sql`: `club_reviews` (id, club_id, reviewer_user_id, rating 1–5, review_text ≤500, created_at, updated_at, deleted_at, UNIQUE per club+user) + `coach_ratings` (same shape + coach_user_id, UNIQUE per coach+club+user). RLS: public SELECT where not deleted, auth-only INSERT/UPDATE own rows. `avg_rating NUMERIC(3,2)` added to `clubs`, kept fresh by `refresh_club_avg_rating()` trigger on every `club_reviews` change.
- **UC5.2** — `StarRating` in `packages/ui/src/components/star-rating.tsx`: readonly (full/half/empty based on float) + interactive (hover + click). Props: `value`, `max`, `interactive`, `onChange`, `size` (sm/md/lg). Exported from `@zenzo/ui`.
- **UC5.3** — `GET/POST/PATCH/DELETE /api/clubs/[slug]/reviews`: GET public (uses `clubs.avg_rating` column + reviewer name join); POST requires active/expired membership; PATCH/DELETE operate on (club_id, reviewer_user_id) — one review per user per club enforced by DB UNIQUE.
- **UC5.4** — `GET/POST/PATCH/DELETE /api/coaches/[userId]/ratings`: GET public (computes avg from all rows, returns last 10 with names); POST requires batch-assignment with this coach at the specified clubId; DELETE uses `?clubId=` query param.
- **WriteReviewButton** (`clubs/[slug]/_components/write-review-button.tsx`): unauthenticated → redirect to `/login?redirect=…`. Dialog: interactive StarRating + 500-char textarea, PATCH if editing, DELETE button when editing. `router.refresh()` on success.
- **WriteRatingButton** (`coaches/[userId]/_components/write-rating-button.tsx`): same pattern; club selector shown when coach is at multiple clubs.
- **Club page** updated: parallel data fetches, `avg_rating` shown in hero, Reviews section with star summary + last 5 reviews with names + dates + write button.
- **Coach page** updated: avg computed from all ratings, shown in header. Recent ratings with reviewer name + club attribution + write button.
- **Type fixes**: `club_reviews.Insert` and `coach_ratings.Insert` defined explicitly with `deleted_at` optional. `SIZE_CLASS` typed as `Record<"sm"|"md"|"lg", string>`. `DialogContent` `title` prop passed correctly.

### Session 31 — 2026-04-21
Sprint UC6 (Member Achievements) complete:
- **UC6.1** — Migration `009_achievements.sql`: `member_achievements` table (user_id, club_id, title, description, badge_icon, awarded_by, awarded_at). RLS: public SELECT, staff-only INSERT. Added `ACHIEVEMENT_TEMPLATES` const (12 presets: 💯🎂🥋🏆⭐🔥🌟🤝✅📅👑🎯) to `enums.ts` + exported from `index.ts`. Added `member_achievements` type to `types/index.ts`.
- **UC6.2** — `GET/POST /api/clubs/[clubId]/members/[memberId]/achievements`: GET returns achievements for the membership with awarder names; POST requires owner or coach, auto-fills badge icon from template slug match.
- **UC6.3** — `GET /api/users/[userId]/achievements`: Public endpoint (service client), returns all achievements across all clubs with club name + slug.
- **UC6.4** — `AwardAchievementDialog` component: 12-template grid (tap to select, auto-fills title + description), Custom option, note textarea, date picker. "Award Badge" menu item added to member profile dropdown.
- **UC6.5** — Achievements tab added to `member-profile-client.tsx` (5th tab, badge count pill). Shows achievement cards or empty state with CTA. Loaded server-side as `initialAchievements`, refreshed client-side after award without page reload.
- **UC6.6** — `/u/[username]/page.tsx`: Replaced placeholder with real `member_achievements` data. Club names resolved in same batch query as membership clubs.

### Session 32 — 2026-04-21
Sprint UC7 (Razorpay Member Payments) complete:
- **UC7.1 — Pay Now in portal** — `portal-payments.tsx` updated with "Pay ₹X now" CTA. Full Razorpay checkout flow: loads `checkout.js` script, calls `POST /api/portal/[clubSlug]/create-order` to get an order_id, opens checkout modal, verifies HMAC signature server-side via `POST /api/portal/[clubSlug]/verify-payment`, records payment in DB, advances `next_due_date` by billing cycle, reactivates membership to `active`. Shows inline success state. Button visible only for members with a fee plan on `active | overdue | expired` membership.
- **UC7.2 — Send Payment Link** — `POST /api/clubs/[clubId]/members/[memberId]/payment-link` creates a Razorpay Payment Link (shareable URL). Member profile dropdown gains "Send Payment Link" item: opens dialog with URL, copy button, open button, and "Send via WhatsApp" deep-link with pre-filled message.
- **`PaymentMethod.Razorpay = "razorpay"`** added to enum. Migration `010_razorpay_payment_method.sql` updates DB CHECK constraint.
- **`lib/razorpay.ts`** — `createRazorpay()` factory (throws clearly if env vars missing).
- **Env vars required**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

### Session 33 — 2026-04-21
Consumer onboarding routing fixes:
- **Signup**: Changed post-signup redirect from `/portal` → `/onboarding/interests` so new email/password users always go through interest selection first.
- **Auth callback**: New OAuth users (no staff rows, `onboarding_step` is null) now redirect to `/onboarding/interests` instead of `/portal`.
- **Interest page**: After saving interests or skipping, redirects to `/portal` (which then redirects to `/discover` if no memberships), rather than hardcoding `/discover` — so invited members with memberships land on their clubs.
- **api/auth/profile**: Added case for `!onboardingDone && !hasMemberships` → `/onboarding/interests` to handle returning users (existed before interests feature) who haven't done onboarding.
- **Portal quick links**: Changed "Explore" → `/discover` (was incorrectly pointing to the old `/explore` page).

### Up Next
1. D5 — Real photography of gyms/coaches (needs assets from user)
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

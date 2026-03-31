# Zenzo — Sprint Plan
*Living document. Updated after every sprint. Source of truth for build order.*
*Last updated: 2026-03-31*

---

## Context: Current State

### What's built and working
| Area | Status |
|---|---|
| Auth pages (login, signup, forgot-password) | ✅ Done |
| Supabase auth middleware (JWT guard) | ✅ Done |
| DB enums + hand-written types | ✅ Done |
| Dashboard layout `[clubSlug]/layout.tsx` | ✅ Done |
| Sidebar + BottomNav (owner + coach variants) | ✅ Done |
| Onboarding wizard (5 steps, owner flow) | ✅ Done |
| `POST /api/clubs` — club creation | ✅ Done |
| Post-login routing (1 club → dashboard, 2+ → picker) | ✅ Done |
| Member list (search, filters, table + cards) | ✅ Done |
| Invite Member (email lookup → active, or send Supabase email invite) | ✅ Done |
| Member profile (overview, attendance, payments tabs) | ✅ Done |
| Batch list, create, detail (assign/remove members) | ✅ Done |
| Take Attendance + Attendance History | ✅ Done |
| Record Payment modal | ✅ Done |
| Payments page (overdue tab + history tab) | ✅ Done |
| Fee Plans CRUD | ✅ Done |
| Dashboard (owner digest + coach view) | ✅ Done |
| Settings (business profile) | ✅ Done |
| Staff management (add coach, remove, guard self/owner) | ✅ Done |

### Known red flags (must fix before anything else)
1. **No-role users land on `/onboarding`** — anyone who signs up (including members) gets routed to the club creation wizard. This is wrong.
2. **No member portal** — members have nowhere to go after signing up on Zenzo.
3. **No invite token system** — `pending_invite` status exists but the transition to `active` never happens automatically.
4. **No `club_invites` table** — can't create a `club_membership` (needs `user_id`) before the person signs up, so pending invites aren't tracked.

---

## Identity & Routing Model

### One account, role determined by club relationships
```
users row        → who you are
club_staff row   → you are owner/coach of a club
club_membership  → you are a member of a club
```

### Post-login routing (authoritative)
```
Has club_staff rows?
  1 club  → /:clubSlug/dashboard
  2+ clubs → /clubs (picker) → /:clubSlug/dashboard

Has only club_memberships (no club_staff)?
  → /portal  (member home)

No relationships at all?
  → /portal  (empty state: "Create a Club" | "Check Invites")
```

### Post-signup routing
```
Signed up via invite link (/signup?token=abc)?
  → Decode token → activate club_membership → /portal

Signed up without token?
  → Check club_invites for their email
  → If found: activate memberships → /portal
  → Otherwise: /portal (empty state)
```

### Route ownership (who can access what)
```
/onboarding          → Authenticated users only. Redirects away if already has a club.
/:clubSlug/*         → Must have club_staff row for this club (layout guards this).
/portal/*            → Authenticated users only. For members + new users.
/explore             → Public (no auth required).
/clubs/:slug         → Public (no auth required). Only listed clubs.
/admin               → admin role only.
```

---

## Sprint R — Routing Fix ✅ *(completed 2026-03-31)*

> **Goal:** Stop members landing in the owner onboarding wizard. Give every user a correct destination after signup/login.

### R1 — Post-login + post-signup routing fix ✅
- `POST /api/auth/profile`: if user has no `club_staff` rows, return `{ destination: '/portal' }`
- `login/page.tsx`: route no-role users to `/portal` instead of `/onboarding`
- Auth callback (`/auth/callback/route.ts`): same routing logic for Google OAuth users

### R2 — `/portal` page (skeleton) ✅
- Route: `app/portal/page.tsx` (Server Component, auth-required)
- Fetch user's `club_memberships` (active/overdue/expired/pending)
- **If has memberships**: show list of clubs they belong to → click → `/portal/[clubSlug]`
- **If no memberships**: empty state with two CTAs:
  - `[Create a Club]` → `/onboarding`
  - `[Check for Invites]` → `/portal/invites`
- Skeleton for loading state

### R3 — Guard `/onboarding` ✅
- If user already has a `club_staff` row: redirect to `/:clubSlug/dashboard`
- Prevents accidental re-onboarding

### R4 — Fix `signup/page.tsx` token passthrough ✅
- Read `?token` from URL on the signup page
- After account creation, call `/api/auth/activate-invite?token=xxx`
- On success: redirect to `/portal`
- On no token: redirect to `/portal` (not `/onboarding`)

---

## Sprint T — Invite Token System ✅ *(completed 2026-03-31)*

> **Goal:** When a member receives an invite email and clicks the link, their membership activates automatically. No manual step from the owner.

### T1 — `club_invites` table ✅
```sql
CREATE TABLE club_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID REFERENCES clubs(id) NOT NULL,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,        -- random UUID, URL-safe
  plan_id     UUID REFERENCES fee_plans(id),
  batch_id    UUID REFERENCES batches(id),
  invited_by  UUID REFERENCES users(id),
  status      TEXT DEFAULT 'pending',      -- 'pending' | 'accepted' | 'expired'
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ DEFAULT now() + interval '30 days'
);
```
- Write migration file: `packages/database/migrations/004_club_invites.sql`
- Add `ClubInvite` type to `packages/database/src/types/index.ts`

### T2 — Update `POST /api/members/invite` ✅
- When user not found by email: INSERT into `club_invites` (email, token, club_id, plan_id, batch_id)
- Send email with link: `/signup?token={token}` (Supabase invite email OR Resend — see Sprint N)
- Return `{ status: 'invite_sent', inviteId }`
- When user found: create `active` membership as before (no token needed)

### T3 — `POST /api/auth/activate-invite` ✅
- Accepts `{ token }` (from query param after signup)
- Validates token is pending + not expired
- Creates `club_membership` (status: `active`) + `member_batches` row
- Updates `club_invites.status` → `accepted`
- Also: on any new signup, check `club_invites` for matching email (catches users who signed up independently without clicking the link)

### T4 — `/portal/invites` page ✅
- Lists pending `club_invites` where `email = current user's email`
- Each invite shows: Club name, who invited them, plan name, batch name, expiry
- [Accept] → calls `/api/auth/activate-invite` → refreshes list
- [Decline] → marks invite expired
- Reachable from `/portal` empty state CTA

### T5 — Onboarding step 4 update ✅
- Currently: fire-and-forget email via Supabase admin invite
- Now: use the new `club_invites` table + `POST /api/onboarding/invites` (update to INSERT invites)

---

## Sprint P — Member Portal *(view-only Phase 1)* ✅ *(completed 2026-03-31)*

> **Goal:** Members have a clean home to see their attendance, upcoming fees, and profile. Read-only in Phase 1 — no payments, no bookings.

### P1 — `/portal` — member club list
- Server Component
- For each active membership: club name, status badge, batch name, next due date
- Click → `/portal/[clubSlug]`
- Mobile-first layout (max-width 480px centered, as per blueprint)

### P2 — `/portal/[clubSlug]` — member view of one club
- **Home tab**: attendance this month (progress bar), next fee due + amount ("pay your coach directly"), last payment, batch schedule
- **Attendance tab**: calendar heatmap (green=present, red=absent, grey=no class), monthly summary, streak
- **Payments tab**: next due date, payment history list, each with [View Receipt] detail view
- Server Components + Suspense + skeletons
- All data fetched by `membership_id` scoped to this user

### P3 — Receipt detail view
- `/portal/[clubSlug]/payments/[paymentId]`
- ✓ Payment Successful header, amount, club, member, date, plan, method, reference
- [Download PDF] (Phase 2) / [Share] stub

### P4 — `/portal/layout.tsx`
- Auth guard (redirect to `/login` if not authenticated)
- Minimal top bar: "Zenzo" logo + user avatar/initials
- No sidebar (member portal is app-like, not dashboard-like)

---

## Sprint E — Explore Clubs *(public, no auth required)*

> **Goal:** Anyone can discover clubs on Zenzo. The supply-side flywheel — clubs get discovered, members sign up. Explore is how members find clubs and owners get leads.

### E1 — `GET /api/clubs/explore`
- Returns clubs where `verification_status = 'verified'` AND `listed = true`
- Supports query params: `?city=Hyderabad&category=martial_arts&q=ravi`
- Returns: `id, name, slug, city, business_type, description` (public fields only)
- Paginated: 20 per page

### E2 — `/explore` page
- **Public** (no auth required)
- Search bar (club name, owner name)
- Filter chips: by city, by category (Gym, Martial Arts, Dance, Yoga, Other)
- Club cards: name, category badge, city, description snippet, [View Club]
- Empty state: "No clubs found in this area yet. Know a gym? Tell them about Zenzo."
- Skeleton loading states
- Server Component with search params for filters

### E3 — `/clubs/[slug]` — public club listing page
- **Public** (no auth required)
- Sections: Club name + category + city, About (description), Plans & Pricing, Schedule (batches), Coaches (staff)
- CTA: "Want to join?" → if logged in → shows invite CTA or link to `/portal/invites`; if not logged in → `/signup`
- Only renders if `verification_status = 'verified'`; otherwise 404
- WhatsApp contact button: `wa.me/91{phone}` (opens WhatsApp to club's number)
- `GET /api/clubs/[slug]/public` — public data endpoint (no auth)

### E4 — Link to Explore from the portal empty state
- `/portal` empty state adds third option: `[Explore Clubs]` → `/explore`

### E5 — Navigation links
- Login/signup pages: "Explore clubs →" link
- Landing page (`/`): hero section with [Explore Clubs] + [Create Your Club] CTAs

---

## Sprint N — Notifications *(email first, WhatsApp later)*

> **Goal:** Members and owners receive transactional emails. WhatsApp is additive when Interakt is integrated.

### Email provider: Resend (recommended — simple API, great deliverability)

### N1 — Resend setup
- Install `resend` in `apps/web`
- `RESEND_API_KEY` in env
- Create `apps/web/src/lib/email.ts`: `sendEmail({ to, subject, html })` wrapper
- Create `apps/web/src/lib/email-templates/` folder for template functions

### N2 — Invite email (replaces raw Supabase invite)
- Template: "You've been invited to join [Club Name] on Zenzo. Click here to sign up."
- Triggered by `POST /api/members/invite` when user not found
- Contains: club name, who invited them, plan name, signup link with token

### N3 — Welcome email
- Sent when `club_membership.status` transitions `pending_invite → active`
- Template: "Welcome to [Club Name]! Here's your membership overview."

### N4 — Payment receipt email
- Triggered by `POST /api/members/[membershipId]/payments`
- Template: clean receipt — amount, date, plan, method, reference

### N5 — Payment reminder email
- Cron job (see Sprint C) triggers 3 days before + on due date
- Template: "Your [Club Name] membership fee of ₹X is due on [date]."

### N6 — Notification settings UI update
- Settings page: toggle per notification type (invite, welcome, receipt, reminder)
- Stored in `notification_settings` table per club

### WhatsApp (deferred — Sprint W, after Interakt setup)
- All the above notifications will also be sent via WhatsApp
- Toggle: email only / WhatsApp only / both (configurable per club)

---

## Sprint C — Automated Billing & Cron *(keeps membership statuses accurate)*

> **Goal:** Membership statuses update automatically. Owners don't need to manually mark people overdue.

### C1 — Due date calculation engine
- `packages/utils/src/billing.ts`: `calculateNextDueDate(startDate, billingCycle)` → returns next due date
- Billing cycles: `monthly` (DOJ-based) | `quarterly` | `half_yearly` | `yearly`
- Update `POST /api/members/[membershipId]/payments` to call this after recording payment

### C2 — Status update cron
- Vercel Cron (`vercel.json`): runs daily at 2:00 AM IST
- `GET /api/cron/billing-check` (secured with `CRON_SECRET` header):
  1. `active` where `next_due_date < today` → `overdue`
  2. `overdue` where `next_due_date < today - 7` → `expired`
- Trigger reminder email for memberships newly flipped to `overdue`

### C3 — Invite expiry cron
- Same cron: mark `club_invites` as `expired` where `expires_at < now()` AND `status = 'pending'`

---

## Sprint X — Belt/Level Progression

> **Goal:** Martial arts, dance, and other clubs can track student progression through belts/grades.

### X1 — Progression settings (in Settings page)
- Toggle: "Enable Progression" (on/off per club)
- Pre-built level orders: Karate belts, BJJ belts, Dance grades (pre-loaded by business type)
- Custom level management: add, rename, reorder, delete

### X2 — Member profile progression tab
- Current level with icon/colour
- Promotion history timeline (date + level + note)
- [Promote] button (owner/coach only) → form: new level + optional note + date

### X3 — `POST /api/members/[membershipId]/promote`
- Insert into `promotions` table
- Update current level on membership

### X4 — Belt distribution view (in Reports or Dashboard)
- Horizontal bar chart: how many students at each level

---

## Sprint Rep — Reports

> **Goal:** Owners can review business health: revenue, attendance, member growth, retention.

### Rep1 — Revenue report
- `/[clubSlug]/reports/revenue`
- Stats: total this month, avg per member, month-over-month change
- Bar chart: daily/weekly revenue
- Breakdown by plan

### Rep2 — Attendance report
- `/[clubSlug]/reports/attendance`
- Stats: avg attendance %, best/worst batch, at-risk count
- Line chart: daily attendance rate over time
- Per-batch breakdown table

### Rep3 — Member growth report
- Stats: total active, new this month, churned this month
- Trend line: member count over time
- New vs churned per month

### Rep4 — Export
- CSV download for all reports
- Date range picker

---

## Sprint A — Zenzo Admin Panel

> **Goal:** Internal tool to verify clubs so they appear in Explore. Simple queue, nothing fancy.

### A1 — `/admin` route (separate protected area)
- Route guard: `users.is_admin = true`
- `app/admin/layout.tsx`: minimal layout, no club sidebar

### A2 — Verification queue
- Table of clubs where `verification_status = 'pending'`
- Columns: club name, owner name, business type, city, submitted date, verification photo
- [Approve] → `verification_status = 'verified'`, `listed = true`, send email to owner
- [Reject] → `verification_status = 'rejected'`, send email to owner with reason

### A3 — Admin dashboard (minimal)
- Total clubs: verified / pending / rejected
- Total users, active memberships (platform-wide)

---

## Sprint W — WhatsApp via Interakt *(deferred — needs API key + paid tier)*

> **Goal:** All email notifications from Sprint N are also sent via WhatsApp. Configurable per club.

### W1 — Interakt API integration
- `apps/web/src/lib/whatsapp.ts`: `sendWhatsApp({ phone, templateId, params })` wrapper
- `INTERAKT_API_KEY` in env

### W2 — All Sprint N notification types via WhatsApp
- Invite, welcome, receipt, reminder
- Template IDs registered in Interakt

### W3 — Notification settings: email + WhatsApp toggles
- Club can choose: email only / WhatsApp only / both

### W4 — Phone OTP auth (replaces email-only auth)
- Add OTP modal to signup flow
- WhatsApp OTP via Interakt (per blueprint)

---

## Sprint Off — Offline Attendance *(polish sprint)*

> **Goal:** Attendance marking works even when the coach's phone has no internet.

### Off1 — IndexedDB queue
- Service worker or direct IndexedDB write on attendance toggle
- Queue persists if save fails
- Auto-sync when connection restores

### Off2 — Auto-save prompt on navigate away
- "You have unsaved attendance. Save before leaving?"

### Off3 — Edit window
- Attendance editable until midnight of the same day

---

## Phase 2 — Consumer Demand Side *(future, not Phase 1)*

> Planned but not scheduled. Will be broken into sprints when Phase 1 is complete.

```
1. Consumer auth improvements (Phone OTP, Google Sign-In)
2. Discovery — /explore with map, ratings, filters
3. Trial booking flow (free or paid trial session)
4. Enrollment flow (select plan → pay online → activate membership)
5. Consumer dashboard (their schedule, upcoming sessions)
6. Reviews & ratings system
7. Online payments via Razorpay (member portal "Pay Now")
8. Native app (React Native or Flutter)
9. Club SaaS billing (Zenzo charges clubs)
10. Featured listings (promoted placement)
```

---

## Sprint Order (recommended)

```
R   → Routing Fix          ✅ DONE
T   → Invite Token System  ✅ DONE
P   → Member Portal        ✅ DONE
E   → Explore Clubs        HIGH — discovery + public listing (supply-side flywheel)
N   → Notifications        MEDIUM — email transactionals (Resend)
C   → Automated Billing    MEDIUM — cron for overdue/expired status
X   → Belt/Progression     LOW — niche feature, martial arts first
Rep → Reports              MEDIUM — owner analytics
A   → Admin Panel          MEDIUM — needed for clubs to go live on Explore
W   → WhatsApp             DEFERRED — needs Interakt paid tier
Off → Offline Attendance   LOW — polish, do after everything else works
```

---

## Open Decisions

| # | Question | Decision needed |
|---|---|---|
| 1 | Email provider for notifications | Resend vs Postmark vs AWS SES |
| 2 | `club_invites` token format | UUID v4 (simpler) vs signed JWT (more info in token) |
| 3 | Portal URL structure | `/portal/[clubSlug]` vs `/[clubSlug]/portal` — keep separate from owner dashboard |
| 4 | Explore — ungated or login-required to contact? | Probably ungated browse, login to "request to join" |
| 5 | Verification photo upload | Supabase Storage (simplest) — needs bucket + policy |
| 6 | Offline attendance | Phase 1 scope or defer? (IndexedDB adds complexity) |

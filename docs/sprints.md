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

## Phase 2 — Consumer Experience *(active)*

> Full detail spec: `docs/consumer-experience.md`
> Build order: UC1 → UC2 → UC4 → UC3 → UC5 → UC6 → (UC7 deferred)

---

## Sprint UC1 — Interest Onboarding *(🔜 NEXT)*

**Goal:** Every new user tells Zenzo what they're into. One-time screen, delightful UX.

| # | Task | File | Type |
|---|---|---|---|
| UC1.1 | Migration: `user_interests` table + ALTER `users` (bio, avatar_url, username, city, onboarding_step) | `packages/database/migrations/006_user_interests.sql` | Migration |
| UC1.2 | Types + Enums: add new `users` fields, `InterestSlug` const enum, `INTEREST_CATEGORIES` array | `packages/database/src/types/index.ts`, `enums.ts` | Code |
| UC1.3 | Interest selection page: 8-card grid, city selector, skip link, optimistic toggle state | `apps/web/src/app/onboarding/interests/page.tsx` | Page |
| UC1.4 | Save interests API: upsert `user_interests`, update `users.city` + `onboarding_step` | `apps/web/src/app/api/users/interests/route.ts` | API |
| UC1.5 | Redirect logic: signup → `/onboarding/interests`; OAuth callback → same; middleware path added | `signup/page.tsx`, `auth/callback/route.ts`, `middleware.ts` | Code |

**Key decisions baked in:**
- No `interest_categories` DB table — 8 fixed slugs stored directly in `user_interests.slug`, display metadata (icon, label, color) is a TS const array
- Skip allowed — sets `onboarding_step = 'interests_skipped'`, goes to `/discover` unfiltered
- Account merge: on complete-profile phone entry, check for existing `users.phone` match and merge memberships

---

## Sprint UC2 — Discovery Home *(🔜 NEXT)*

**Goal:** After onboarding, members land on a personalized feed — pending invites + interest-matched clubs in their city.

| # | Task | File | Type |
|---|---|---|---|
| UC2.1 | Discovery API: read user interests + city, score clubs by match + avg_rating, count pending invites | `apps/web/src/app/api/discover/route.ts` | API |
| UC2.2 | Discover page: invites banner, "For you in [City]" heading, 2/3-col club grid, empty state | `apps/web/src/app/discover/page.tsx` + `_components/` | Page |
| UC2.3 | Portal routing update: no-membership users redirect to `/discover`; auth/profile returns `{ destination: '/discover' }` | `portal/page.tsx`, `api/auth/profile/route.ts` | Code |

**Scoring:** `ORDER BY (interest_match_count * 2 + COALESCE(avg_rating, 0)) DESC` — not random.

---

## Sprint UC4 — Public Profiles + Portal Nav *(Pending — start UC4.1 in parallel with UC2)*

**Goal:** Every person on Zenzo has a public profile. Portal gets a proper bottom nav linking all consumer pages.

| # | Task | File | Type |
|---|---|---|---|
| UC4.1 | Portal bottom nav: top wordmark + avatar; bottom: Home · Discover · Search · Profile; active state via `usePathname()` | `apps/web/src/app/portal/layout.tsx` | Layout |
| UC4.2 | Profile update API: PATCH `full_name`, `phone`, `bio`, `username`, `avatar_url`, `city`; username uniqueness guard | `apps/web/src/app/api/profile/route.ts` | API |
| UC4.3 | Username availability API: format + reserved list + DB check | `apps/web/src/app/api/profile/check-username/route.ts` | API |
| UC4.4 | Own profile edit page: avatar upload, bio (160 char), username (inline availability check), interests re-select | `apps/web/src/app/profile/page.tsx` | Page |
| UC4.5 | Member public profile: avatar, @username, interests pills, clubs list, achievements grid (stub), attendance count | `apps/web/src/app/u/[username]/page.tsx` | Page |
| UC4.6 | Coach public profile: avatar, bio, clubs+batches, avg rating (stub), reviews list (stub), CTA | `apps/web/src/app/coaches/[userId]/page.tsx` | Page |
| UC4.7 | Club public page enhancement: avg star rating + reviews section + "Write a review" button (stub until UC5) | `apps/web/src/app/clubs/[slug]/page.tsx` | Enhancement |

**Avatar upload:** Supabase Storage, max 2MB, JPEG/PNG/WebP, resize to 200×200.
**Username:** auto-generated `firstname_lastname` on signup, user can edit. Collision → append `_2`.

---

## Sprint UC3 — Global Search *(Pending — after UC4)*

**Goal:** One search bar finds clubs, coaches, and members across the platform.

| # | Task | File | Type |
|---|---|---|---|
| UC3.1 | Migration: `pg_trgm` extension + GIN indexes on `clubs.name`, `users.full_name`, `users.username` | `packages/database/migrations/007_search_indexes.sql` | Migration |
| UC3.2 | Search API: 3 types (clubs/coaches/members), `pg_trgm` similarity ordering, rate-limited (30 req/min/IP), member search auth-gated | `apps/web/src/app/api/search/route.ts` | API |
| UC3.3 | Search page: sticky search bar, 3 tabs, debounced 300ms, skeleton per tab, URL-reflected query | `apps/web/src/app/search/page.tsx` | Page |

**Result links:** Club → `/clubs/[slug]`, Coach → `/coaches/[userId]`, Member → `/u/[username]`

---

## Sprint UC5 — Ratings & Reviews *(Pending — after UC4)*

**Goal:** Clubs and coaches earn a public reputation. Members rate after attending.

| # | Task | File | Type |
|---|---|---|---|
| UC5.1 | Migration: `club_reviews` + `coach_ratings` tables, soft delete (`deleted_at`), UNIQUE constraints, RLS | `packages/database/migrations/008_ratings.sql` | Migration |
| UC5.2 | Star rating component: readonly + interactive modes, accessible, size variants | `packages/ui/src/star-rating.tsx` | Component |
| UC5.3 | Club reviews API: GET (public, paginated), POST (member auth required), PATCH/DELETE (own review only) | `apps/web/src/app/api/clubs/[slug]/reviews/route.ts` | API |
| UC5.4 | Coach ratings API: GET (public), POST (must have batch with coach), PATCH/DELETE | `apps/web/src/app/api/coaches/[userId]/ratings/route.ts` | API |

**Authorization:** POST review requires `membership.status IN ('active', 'expired')` for that club. One review per (user, club) enforced at DB level.
**Avg rating:** Denormalized column on `clubs` via DB trigger — avoids computing on every read.

---

## Sprint UC6 — Member Achievements *(Pending — after UC4)*

**Goal:** Owners and coaches award badges. Members display them on their public profile.

| # | Task | File | Type |
|---|---|---|---|
| UC6.1 | Migration: `member_achievements` table, RLS (staff insert only, public read), `ACHIEVEMENT_TEMPLATES` TS const (12 presets) | `packages/database/migrations/009_achievements.sql` | Migration |
| UC6.2 | Achievement award API: GET (member's achievements at club), POST (owner/coach only) | `apps/web/src/app/api/clubs/[clubId]/members/[memberId]/achievements/route.ts` | API |
| UC6.3 | Public achievements API: GET all achievements for a user across all clubs | `apps/web/src/app/api/users/[userId]/achievements/route.ts` | API |
| UC6.4 | Award badge dialog: 12 preset template grid + Custom option, date picker; wired to member profile dropdown | `_components/award-achievement-dialog.tsx` | Component |
| UC6.5 | Achievements tab in club dashboard member profile (4th tab after Progression) | `member-profile-client.tsx` | Enhancement |
| UC6.6 | Achievements grid on public member profile `/u/[username]` (replaces stub from UC4.5) | `apps/web/src/app/u/[username]/page.tsx` | Enhancement |

**Preset templates (12):** 100 Classes 💯 · 1 Year Member 🎂 · First Class ⭐ · Top Performer 🏆 · Iron Will 🔥 · Rising Star 🌟 · Team Player 🤝 · Perfect Week ✅ · Marathon Month 📅 · Consistency King 👑 · Belt Promotion 🥋 · Custom 🎯

---

## Sprint UC7 — Razorpay Member Payments *(Deferred)*

> Not building yet. Needs Razorpay account, webhook handling, and reconciliation. Spec in `docs/consumer-experience.md`.

---

## Sprint Order (full picture)

```
── Phase 1 (Complete) ────────────────────────────────────────────
R   → Routing Fix                ✅ DONE
T   → Invite Token System        ✅ DONE
P   → Member Portal              ✅ DONE
E   → Explore Clubs              ✅ DONE
N   → Notifications (Resend)     ✅ DONE
Off → Offline Attendance         ✅ DONE
MK  → Marketing Page             ✅ DONE
MK2 → Marketing Enhancements     ✅ DONE
DA  → Dashboard Alive            ✅ DONE
QR  → QR Code Attendance         ✅ DONE

── Phase 2 (Active) ──────────────────────────────────────────────
UC1 → Interest Onboarding        🔜 NEXT   (UC1.1 → UC1.2 → UC1.3 → UC1.4 → UC1.5)
UC2 → Discovery Home             🔜 NEXT   (depends on UC1)
UC4 → Public Profiles + Nav      Pending   (UC4.1 can run in parallel with UC2)
UC3 → Global Search              Pending   (depends on UC4 — results link to profiles)
UC5 → Ratings & Reviews          Pending   (depends on UC4)
UC6 → Achievements               Pending   (depends on UC4)
UC7 → Razorpay Payments          DEFERRED

── Phase 1 Remaining ─────────────────────────────────────────────
C   → Automated Billing          MEDIUM — daily cron, overdue/expired transitions
X   → Belt/Progression           LOW    — martial arts first
Rep → Reports                    MEDIUM — owner revenue + attendance analytics
A   → Admin Panel                MEDIUM — club verification queue (needed for Explore)
W   → WhatsApp (Interakt)        DEFERRED — needs paid API key

── Phase 2 Future (not sprinted yet) ─────────────────────────────
    Trial booking flow
    Enrollment flow (select plan → pay → activate)
    Native app (React Native / Expo)
    Club SaaS billing
    Phone OTP login

── Sprint SD — Search & Discovery 100x Upgrade ───────────────────
    Full spec: docs/sprint-sd.md
    SD0 → Gap Analysis           ⬜ Not started (approval gate)
    SD1 → Schema Migrations      ⬜ Not started (PostGIS, tsvector, coaches table)
    SD2 → Search APIs            ⬜ Not started (text+geo+filters+cursor pagination)
    SD3 → UI Components          ⬜ Not started (ClubCard, CoachCard, SearchBar, Filters)
    SD4 → Integration & UX       ⬜ Not started (/explore rebuild, URL state, infinite scroll)
    SD5 → Map View               ⬜ Not started (Leaflet + OSM)
    SD6 → Polish                 ⬜ Not started (animations, a11y, responsive QA)
    SD7 → Seed Data              ⬜ Not started (15 Vizag gyms + 20 coaches)
```

---

## Permissions Matrix (Phase 2 endpoints)

| Endpoint | Anon | Member | Coach | Owner |
|---|---|---|---|---|
| POST `/api/users/interests` | ✗ | ✓ self | ✓ self | ✓ self |
| GET `/api/discover` | ✗ | ✓ | ✓ | ✓ |
| GET `/api/search?type=clubs` | ✓ | ✓ | ✓ | ✓ |
| GET `/api/search?type=coaches` | ✓ | ✓ | ✓ | ✓ |
| GET `/api/search?type=members` | ✗ | ✓ | ✓ | ✓ |
| PATCH `/api/profile` | ✗ | ✓ self | ✓ self | ✓ self |
| GET `/u/[username]` | ✓ | ✓ | ✓ | ✓ |
| GET `/coaches/[userId]` | ✓ | ✓ | ✓ | ✓ |
| POST `/api/clubs/[slug]/reviews` | ✗ | ✓ member of club | ✓ | ✓ |
| POST `/api/coaches/[userId]/ratings` | ✗ | ✓ has batch | ✗ | ✗ |
| POST achievements | ✗ | ✗ | ✓ own club | ✓ own club |
| GET achievements | ✓ | ✓ | ✓ | ✓ |

---

## Open Decisions (Phase 1 — Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Email provider | Resend ✅ (already integrated) |
| 2 | `club_invites` token format | UUID v4 ✅ (already built) |
| 3 | Portal URL structure | `/portal/[clubSlug]` ✅ (kept separate from owner dashboard) |
| 4 | Explore — ungated? | Ungated browse ✅, login to "request to join" |
| 5 | Verification photo upload | Supabase Storage ✅ |
| 6 | Offline attendance | Built ✅ (IndexedDB queue, Sprint Off) |

## Open Decisions (Phase 2 — Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Username: auto-generate or user picks? | Auto-generate `firstname_lastname`, user can edit. Collision → `_2`, `_3` |
| 2 | Member profile privacy? | Public: name, username, interests, achievements, clubs. Hidden: attendance dates, payment amounts, phone, email |
| 3 | City detection? | Ask on interest screen. No phone inference. |
| 4 | Reviews: non-member blocked? | Yes — API requires `membership.status IN ('active', 'expired')` |
| 5 | Avatar storage? | Supabase Storage, max 2MB, resize to 200×200 |
| 6 | Search: ILIKE or pg_trgm? | `pg_trgm` from day one — 3 migration lines, avoids scaling issues |
| 7 | Account merge for invited users? | Merge during complete-profile when phone matches existing `users.phone` |
| 8 | Review moderation? | V1: users edit/delete own. Owners can flag. Moderation queue deferred. |

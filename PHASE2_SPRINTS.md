# Zenzo — Phase 2 Sprint Plan

*Atomic task list for Phase 1.5 completion + Phase 2 (B2C Consumer Platform).*
*Grounded in `docs/zenzos-new-philosophy/product-definition-v2.1.md` and `zenzo-blueprint-v1.0.md`.*
*Check off tasks as completed. Update sprint status headers when a sprint is done.*

---

## Product Philosophy (anchors for every decision)

- **Zenzo is the brand.** Consumers interact with Zenzo, not individual club brands (like Zomato). Every member has a Zenzo account that works across all clubs.
- **Enrollment-based, not session-booking.** Gyms/martial arts/dance are commitment businesses. Plan selection → payment → membership. Drop-in is secondary.
- **No transaction commission on recurring payments.** Clubs would bypass it. SaaS subscription is the primary revenue model.
- **Phase 1 payments:** Money goes directly into the club's own Razorpay account. Zenzo never touches member money in Phase 1.
- **Phase 2 enrollment payments:** Consumer → Zenzo Razorpay (Route) → Club, minus Zenzo's enrollment fee. Requires Razorpay Route (marketplace) setup.
- **Trial → Enrollment is the key funnel.** Get consumers from discovery to commitment. Then recurring payments + attendance tracking via Zenzo forever.

---

## Build Order Rationale

```
Phase 1.5 (complete B2B) → Admin Panel → Consumer Auth → Razorpay Route → Enrollment → Trial → Portal+ → Reviews → SaaS Billing → Native App
```

Phase 1.5 B2B features first (multi-club, reports, progression, WhatsApp) — clubs must be sticky before consumers arrive.
Admin panel next — club verification gates public listing; can't launch discovery without it.

---

## Sprint MC — Multi-Club Support (P1.2)

> **Goal:** An owner can create and switch between multiple clubs. Coaches can belong to multiple clubs owned by the same owner.

### MC.1 — Club Switcher UI
- [ ] In `sidebar.tsx`: add club switcher section in the footer — fetch all `club_staff` rows for current user joined to `clubs`
- [ ] Show popover list: club name + role badge (Owner / Coach) + checkmark on active club
- [ ] Clicking a club navigates to `/${clubSlug}/dashboard`
- [ ] Add the same switcher to `MoreSheet` in `bottom-nav.tsx` (mobile)
- [ ] "+ Create New Club" button at bottom of switcher popover

### MC.2 — Create Additional Club (Abbreviated Wizard)
- [ ] Route `/onboarding/new-club/page.tsx` — steps 2 and 3 only (Business Type → Studio Setup); no Invite Members, no Celebrate step
- [ ] Reuse `onboarding` step components; pass `isAdditionalClub: true` prop to skip identity re-verification
- [ ] On completion: redirect to `/${newClubSlug}/dashboard`
- [ ] New club starts with `verification_status: 'pending'`, `listed: false` — show banner "Upload a premises photo to get listed"

### MC.3 — Club Picker Page (2+ Clubs at Login)
- [ ] Build `/clubs/page.tsx` — SC with Suspense; shown when `POST /api/auth/profile` returns `destination: '/clubs'`
- [ ] Card grid: club logo/initials, name, city, business type icon, your role badge, member count
- [ ] Each card links to `/${clubSlug}/dashboard`
- [ ] `ClubPickerSkeleton` — shimmer matching card grid

### MC.4 — Shared Coaches Across Clubs
- [ ] Verify `POST /api/clubs/[clubId]/staff` correctly creates a second `club_staff` row for a coach already on another club (same `user_id`, different `club_id`) without error
- [ ] In the "Add Coach" dialog: if phone lookup finds a user already coaching at another club owned by the same owner, show informational notice "Already coaching at [OtherClub] — adding here too"

---

## Sprint PR — Reports (P1.3)

> **Goal:** Owner-only reports with CSV export: Revenue, Attendance, Member Growth, Retention.

### PR.1 — Reports Shell + Navigation
- [ ] Build `reports/page.tsx` — SC with tab navigation (Revenue | Attendance | Member Growth | Retention)
- [ ] Guard: `StaffRole.Coach` → redirect to dashboard (no reports access)
- [ ] Build `reports/_components/reports-skeleton.tsx` — shimmer for chart + table areas
- [ ] Verify "Reports" link exists in owner sidebar nav and mobile More sheet

### PR.2 — Revenue Report
- [ ] Build `reports/_components/revenue-report.tsx` — SC
- [ ] Query: `payments` grouped by month for last 12 months → total collected per month
- [ ] Query: `club_memberships` where `status = 'overdue'` → sum outstanding (active plan amounts)
- [ ] Query: active members × their plan `amount_paise` → projected monthly revenue
- [ ] Render: bar chart (month vs collected ₹) using CSS-only bars (no chart library), stat cards (collected / outstanding / projected)
- [ ] Payment method breakdown table: method, count, total
- [ ] `GET /api/clubs/[clubId]/reports/revenue` — returns all aggregated data
- [ ] CSV download: `payments` rows in selected date range as `revenue_report.csv`

### PR.3 — Attendance Report
- [ ] Build `reports/_components/attendance-report.tsx` — SC
- [ ] Query: per-batch attendance rate (present / total marks × 100) last 30 days
- [ ] Query: "at-risk" members — absent in 3+ of their last 5 sessions
- [ ] Query: batch-wise breakdown table (batch name, sessions held, avg present count, avg %)
- [ ] `GET /api/clubs/[clubId]/reports/attendance`
- [ ] CSV download: member × date grid with P/A/— values

### PR.4 — Member Growth Report
- [ ] Build `reports/_components/member-growth-report.tsx` — SC
- [ ] Query: new members by month (`joined_at` grouped by month, last 12 months)
- [ ] Query: churned by month (status changed to `expired` or `deleted` per month)
- [ ] CSS-only line chart (SVG polyline) — new vs churned per month
- [ ] `GET /api/clubs/[clubId]/reports/members`
- [ ] CSV download: month, new_count, churned_count

### PR.5 — Retention Report
- [ ] Build `reports/_components/retention-report.tsx` — SC
- [ ] Query: retention rate = active / (active + expired + deleted) × 100
- [ ] Query: average tenure in days (from `joined_at` to `deleted_at` or today) for all-time members
- [ ] Query: churn risk top 10 — overdue members sorted by days overdue descending
- [ ] Churn risk table with "Send Reminder" (WhatsApp deep link) action per row
- [ ] `GET /api/clubs/[clubId]/reports/retention`
- [ ] CSV download: member name, status, joined_at, last_payment_date, days_overdue

---

## Sprint BL — Belt/Level Progression (P1.1)

> **Goal:** Clubs (martial arts, dance) can define a belt/level hierarchy and log member promotions with WhatsApp congratulations.

### BL.1 — DB Migration
- [ ] Migration: `progression_levels (id UUID PK, club_id, name TEXT, color_hex TEXT, order_index INTEGER, created_at)` with `UNIQUE(club_id, order_index)`
- [ ] Migration: `member_current_level (id UUID PK, membership_id UNIQUE, level_id, promoted_at, promoted_by)`
- [ ] Migration: `promotions (id UUID PK, membership_id, from_level_id, to_level_id, date, notes TEXT, promoted_by)`
- [ ] Add `ProgressionLevel`, `MemberCurrentLevel`, `Promotion` types to `packages/database/src/types/index.ts`

### BL.2 — Progression Settings
- [ ] In `settings/page.tsx` add "Progression" section (only when `show_progression = true` toggle is on)
- [ ] Build `settings/_components/progression-settings.tsx` — client
- [ ] "Enable Progression" toggle — `PATCH /api/clubs/[clubId]/settings` with `show_progression`
- [ ] When enabled: drag-to-reorder level list using HTML5 drag events (no library dependency)
- [ ] "+ Add Level" inline row: name text input + 6-color picker (preset: white/yellow/orange/green/blue/brown/black + custom hex)
- [ ] Delete level button — disabled with tooltip if any member currently holds that level
- [ ] Pre-populate belt set for martial arts on club creation: White → Yellow → Orange → Green → Blue → Purple → Brown → Red → Black
- [ ] `PUT /api/clubs/[clubId]/progression-levels` — bulk upsert (name, order_index, color_hex)
- [ ] `DELETE /api/clubs/[clubId]/progression-levels/[levelId]` — guard: 0 active members at this level

### BL.3 — Belt Distribution on Dashboard
- [ ] Add "Belt Distribution" section to `dashboard/owner-dashboard.tsx` when `show_progression = true`
- [ ] Horizontal stacked bar (CSS flexbox, no library): each segment = level color, width proportional to member count at that level
- [ ] On hover/tap: tooltip showing level name + member count
- [ ] Query: `member_current_level` → `progression_levels` for this club, grouped by level

### BL.4 — Member Profile Progression Tab
- [ ] Activate "Progression" tab in `members/[memberId]/_components/member-profile-client.tsx` (currently placeholder)
- [ ] Show current belt: color badge + level name + "since [date]"
- [ ] Promotion timeline: chronological list of promotions (date, from → to with color badges, notes, promoted by)
- [ ] "[Log Promotion]" button — owner only, triggers `LogPromotionDialog`

### BL.5 — Log Promotion Dialog
- [ ] Build `_components/log-promotion-dialog.tsx` — client
- [ ] Fields: Current Level (read-only, auto-filled), New Level (dropdown of levels above current only), Date (default today), Notes (optional)
- [ ] `POST /api/clubs/[clubId]/members/[memberId]/promote`: inserts `promotions` row + upserts `member_current_level`
- [ ] Fire-and-forget WhatsApp via `sendWhatsApp` with `belt_promotion` template: `{ member_name, new_belt, club_name }`

---

## Sprint TS — Trial Session Settings (P1.4)

> **Goal:** Club owners configure their trial offering. Consumer booking is Sprint TB. This sprint is settings-only.

### TS.1 — DB Migration
- [ ] Add to `clubs`: `trial_enabled BOOLEAN DEFAULT FALSE`, `trial_price_paise INTEGER DEFAULT 0`, `trial_duration_days INTEGER DEFAULT 1`, `max_trials_per_user INTEGER DEFAULT 1`
- [ ] Add `Trial = 'trial'` to `MembershipStatus` enum in `packages/database/src/enums.ts`
- [ ] Update `clubs` type in `packages/database/src/types/index.ts`

### TS.2 — Trial Settings UI
- [ ] Add "Trial Sessions" section to `settings/page.tsx` (owner-only)
- [ ] Build `settings/_components/trial-settings.tsx` — client
- [ ] "Enable Trials" toggle — when off, collapses the rest of the form
- [ ] Fields: Trial Price (₹, 0 = Free with "Free" badge shown), Duration (days, 1–30), Max per person (1–10)
- [ ] Extend `PATCH /api/clubs/[clubId]/settings` to accept `{ trial_enabled, trial_price_paise, trial_duration_days, max_trials_per_user }`

### TS.3 — Trial History in Club Dashboard
- [ ] Add "Trial History" section to `owner-dashboard.tsx` (only when `trial_enabled = true`)
- [ ] Table: consumer name, trial date, batch, status (Booked / Attended / No-show)
- [ ] Query: `club_memberships` where `status = 'trial'` for this club, joined to `users` and `member_batches`
- [ ] Empty state: "No trial sessions yet. Share your listing page to get your first trial booking."

---

## Sprint WA — WhatsApp via Interakt (P0.8)

> **Goal:** Replace email-only notifications with WhatsApp as the primary channel via Interakt API. Needs `INTERAKT_API_KEY` env var.

### WA.1 — Interakt Client
- [ ] Create `apps/web/src/lib/whatsapp.ts`: `sendWhatsApp({ phone, templateName, variables: Record<string,string> })` wrapper
- [ ] POST to `https://api.interakt.ai/v1/public/message/` with Bearer `INTERAKT_API_KEY`
- [ ] Skip silently (log a console.warn) if `INTERAKT_API_KEY` is not set — dev safety
- [ ] On every send attempt: insert row into `notifications_log (type, recipient_phone, status, failure_reason, club_id, sent_at)`
- [ ] Add `INTERAKT_API_KEY=` to `.env.example`

### WA.2 — Member Invite WhatsApp
- [ ] In `POST /api/members/invite`: call `sendWhatsApp` with `member_invite` template after creating invite row
- [ ] Template variables: `owner_name`, `club_name`, `signup_link` (`https://zenzo.club/signup?token={token}`)
- [ ] Keep existing Resend email as secondary (fires only when email provided)

### WA.3 — Welcome WhatsApp
- [ ] In `POST /api/auth/activate-invite`: after membership activation call `sendWhatsApp` with `welcome_member`
- [ ] Variables: `member_name`, `club_name`, `portal_link` (`/portal/${clubSlug}`)
- [ ] Guard: check `notification_settings.welcome_message` toggle for the club before sending

### WA.4 — Payment Receipt WhatsApp
- [ ] In `POST /api/members/[membershipId]/payments`: after payment insert call `sendWhatsApp` with `payment_receipt`
- [ ] Variables: `member_name`, `amount` (formatted ₹), `plan_name`, `date`, `method`, `next_due_date`
- [ ] Guard: `notification_settings.payment_receipt` toggle

### WA.5 — Payment Reminder WhatsApp
- [ ] In `GET /api/cron/expire-memberships`: for newly-overdue memberships call `sendWhatsApp` with `payment_reminder`
- [ ] Variables: `member_name`, `plan_name`, `amount`, `due_date`, `club_name`
- [ ] Guard: `notification_settings.payment_reminder` toggle per club

### WA.6 — Promotion Congratulations WhatsApp
- [ ] Already triggered in `BL.5` — verify template variables are correct: `member_name`, `new_belt`, `club_name`

### WA.7 — Attendance Alert to Owner
- [ ] Add to cron job: detect members absent in last 3+ consecutive sessions → send `attendance_alert` to club owner
- [ ] Template variables: `member_name`, `absent_count`, `club_name`
- [ ] Guard: `notification_settings.attendance_alert` toggle

---

## Sprint AP — Admin Panel (P — Internal)

> **Goal:** Internal Zenzo admin panel for verifying clubs, managing the directory, and granting early-adopter pricing. Required before public listing can go live.

### AP.1 — Auth Guard
- [ ] Admin routes live at `/admin/*` (separate from `/[clubSlug]/*`)
- [ ] In middleware: requests to `/admin/*` check `users.is_admin = true` via a server-side Supabase query; redirect non-admins to `/login`
- [ ] Zenzo admin sets `is_admin = true` directly in the Supabase dashboard (no self-serve)

### AP.2 — Admin Club List
- [ ] Build `admin/clubs/page.tsx` — SC with Suspense
- [ ] Table: club name, owner name+phone, city, business type, created at, `verification_status` badge, `listed` toggle, subscription plan badge, member count
- [ ] Filter tabs: All | Pending Verification | Verified | Rejected
- [ ] `GET /api/admin/clubs`: service client (bypasses RLS), returns all clubs joined to owner user + member count

### AP.3 — Verify / Reject Club
- [ ] "[Verify]" button → sets `verification_status = 'verified'` AND `listed = true` on the club row
- [ ] "[Reject]" button → dialog with reason dropdown → sets `verification_status = 'rejected'`, `listed = false`
- [ ] On verify: send WhatsApp to club owner — `club_verified` template: `{ club_name, listing_url }`
- [ ] `PATCH /api/admin/clubs/[clubId]/verify`: admin-only, updates `verification_status` + `listed`

### AP.4 — Club Detail View (Admin)
- [ ] Build `admin/clubs/[clubId]/page.tsx` — SC
- [ ] Shows: business profile, verification photo, owner contact, member count, payment volume, subscription status
- [ ] Actions: Verify, Reject, Grant Early Adopter, Suspend

### AP.5 — Grant Early Adopter Pricing
- [ ] "[Grant Early Adopter]" action on club detail → sets `platform_subscription_plan = 'early_adopter'` and `early_adopter_locked = true` on the club row
- [ ] DB: add `early_adopter_locked BOOLEAN DEFAULT FALSE` to `clubs`
- [ ] Only the first 50 verified clubs are eligible (admin discretion, no hard system check needed in Phase 1)

### AP.6 — Admin Dashboard
- [ ] Build `admin/page.tsx` — SC
- [ ] KPI cards: total clubs, pending verification count, verified clubs, total members across platform, total attendance marks last 7 days
- [ ] Recent signups: last 5 clubs to sign up with verification status

---

## Sprint RZ — Razorpay (Phase 1 — Direct to Club) (C6a)

> **Goal:** Club owners connect their own Razorpay account. Club staff can generate payment links for members. Money goes directly to the club's account — Zenzo never touches it in Phase 1.

### RZ.1 — DB Changes
- [ ] Add to `clubs`: `razorpay_key_id TEXT`, `razorpay_key_secret TEXT` (store encrypted — use Supabase Vault or server-side env-per-club pattern)
- [ ] Add to `payments`: `razorpay_order_id TEXT`, `razorpay_payment_id TEXT`, `payment_source TEXT DEFAULT 'manual'` ('manual' | 'razorpay_link')
- [ ] Update `clubs` and `payments` DB types

### RZ.2 — Razorpay Settings UI
- [ ] Replace "Coming soon" placeholder in `settings/page.tsx` with real Razorpay connect form
- [ ] Build `settings/_components/razorpay-settings.tsx` — client
- [ ] Fields: Key ID (public, shown in plain text), Key Secret (masked, shown only on edit)
- [ ] "Test Connection" button: creates a ₹1 Razorpay order then immediately cancels it; shows success/failure inline
- [ ] `PATCH /api/clubs/[clubId]/settings/razorpay`: owner-only, stores key_id + encrypted key_secret
- [ ] Install `razorpay` npm package in `apps/web`

### RZ.3 — Generate Payment Link (for Members)
- [ ] In `RecordPaymentModal`: add "Send Payment Link via WhatsApp" secondary button (only when Razorpay connected)
- [ ] On click: `POST /api/clubs/[clubId]/members/[membershipId]/payment-link` → create Razorpay payment link → return URL → open `wa.me/91{phone}?text=...` with the link
- [ ] `POST /api/clubs/[clubId]/members/[membershipId]/payment-link`: uses club's own Razorpay key to create payment link with `callback_url` pointing to `POST /api/webhooks/razorpay/club/[clubId]`

### RZ.4 — Webhook for Club Payments
- [ ] `POST /api/webhooks/razorpay/club/[clubId]`: verify HMAC signature using club's key_secret → on `payment.captured`: insert `payments` row (`payment_source: 'razorpay_link'`) → update membership status → send WhatsApp receipt
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` note to `.env.example` (per-club webhooks use the club's own secret)

---

## Sprint RR — Razorpay Route (Phase 2 — Enrollment Payments) (C6b)

> **Goal:** Enable Zenzo to collect enrollment payments from consumers, deduct the Zenzo enrollment fee, and pass the remainder to the club. Requires Razorpay Route (marketplace) — a separate Razorpay account for Zenzo itself.

### RR.1 — Zenzo Platform Razorpay Account
- [ ] Create Zenzo's own Razorpay account (Route-enabled — not the same as club accounts)
- [ ] Add `ZENZO_RAZORPAY_KEY_ID`, `ZENZO_RAZORPAY_KEY_SECRET`, `ZENZO_RAZORPAY_WEBHOOK_SECRET` to `.env.example`

### RR.2 — DB Changes
- [ ] Migration: `enrollment_orders (id UUID PK, club_id, membership_id, consumer_id, plan_id, amount_paise, enrollment_fee_paise, razorpay_order_id, razorpay_payment_id, status ('created'|'paid'|'failed'), created_at)`
- [ ] Add `enrollment_fee_paise` column concept: ₹200–500 flat fee per consumer-sourced enrollment (start with ₹299 hardcoded, make configurable later)
- [ ] Add `EnrollmentOrder` type to DB types

### RR.3 — Create Enrollment Order
- [ ] `POST /api/enrollment/create-order`: consumer auth → check no active membership at this club → create Razorpay order via Zenzo's platform account → insert `enrollment_orders` row → return `{ orderId, amount, currency, keyId: ZENZO_KEY_ID }`

### RR.4 — Verify and Split Payment
- [ ] `POST /api/enrollment/confirm`: verify HMAC signature → on success: create `club_memberships` row + `member_batches` if batch selected → insert `payments` row → trigger Route transfer to club's Razorpay account minus enrollment fee → fire welcome WhatsApp/email → return `{ success, membershipId }`
- [ ] Razorpay Route transfer: `POST https://api.razorpay.com/v1/transfers` with `account: club.razorpay_key_id`, `amount: total - enrollment_fee`

### RR.5 — Webhook for Enrollment
- [ ] `POST /api/webhooks/razorpay/enrollment`: verify using Zenzo platform secret → handle `payment.captured` → call confirm logic → handle `payment.failed` → update `enrollment_orders.status = 'failed'`

---

## Sprint CA — Consumer Auth — Phone OTP + Google (C1)

> **Goal:** Consumer-friendly auth. Phone OTP via Interakt WhatsApp is primary. Google Sign-In is secondary. No email+password for consumers (too much friction).

### CA.1 — OTP Infrastructure
- [ ] Extend `apps/web/src/lib/whatsapp.ts` with `sendOtp(phone, code)` — uses `otp_verification` Interakt template with variable `{code}`
- [ ] Create `apps/web/src/lib/otp.ts`: generate 6-digit code, store in Redis or Supabase KV (`otp_attempts` table) with TTL 5 minutes
- [ ] Migration: `otp_attempts (phone TEXT, code TEXT, expires_at TIMESTAMPTZ, attempts INTEGER DEFAULT 0, created_at)` — single row per phone, upsert on each send
- [ ] `POST /api/auth/send-otp`: rate limit (max 3 sends per phone per 10 min) → generate code → store hashed → send WhatsApp → return `{ success, expiresIn: 300 }`
- [ ] `POST /api/auth/verify-otp`: lookup by phone → compare hashed code → check expiry → check attempts ≤ 3 → on success: sign in if user exists, else return `{ action: 'signup_required', phone }`

### CA.2 — Consumer Login Page
- [ ] Add `/consumer/login/page.tsx` (separate from club staff `/login`) — mobile-first layout, max-width 400px centered
- [ ] Phone OTP tab (primary, shown by default): +91 input → [Get OTP] → 6-digit input with 60s resend countdown
- [ ] Google Sign-In button: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] On OTP success: call `POST /api/auth/profile` → if `club_staff` role: redirect to dashboard; else redirect to `/portal`
- [ ] Inline error: "Wrong code. X attempts remaining."

### CA.3 — Consumer Signup (Phone OTP)
- [ ] If `verify-otp` returns `signup_required`: show inline signup form within same screen — Full Name (required), Email (optional)
- [ ] On submit: `supabase.auth.signUp()` with phone + generated password → create `users` row
- [ ] Post-signup: invite token in URL → activate invite → `/portal`; no token → `/portal`

### CA.4 — Phone Collection After Google Sign-In
- [ ] After Google Sign-In, check if `users.phone` is empty → redirect to `/complete-profile` (already exists)
- [ ] Phone is required for WhatsApp notifications — make this mandatory, not skippable

---

## Sprint EN — Enrollment Flow (C5)

> **Goal:** Consumer discovers a club, selects a plan, pays via Zenzo Razorpay Route, and becomes an active member with no manual action from the club owner.

### EN.1 — "Join This Club" CTA
- [ ] In `/clubs/[slug]/page.tsx`: show "Join This Club" button for logged-in consumers with no active membership at this club
- [ ] If not logged in: "Sign up to join" → `/consumer/login?redirect=/clubs/${slug}/enroll`
- [ ] If already an active member: replace CTA with "View My Membership →" → `/portal/${slug}`

### EN.2 — Plan Selection Page
- [ ] Build `/clubs/[slug]/enroll/page.tsx` — SC; fetches active fee plans for club
- [ ] Plan cards: name, ₹ amount, billing cycle, description
- [ ] "Select" button on each card → continue to checkout
- [ ] `PlanSelectionSkeleton` — shimmer

### EN.3 — Batch Selection (Optional)
- [ ] Below plan cards: if club has batches, show "Choose a batch (optional)" with batch cards (name, timing, days, X spots left if `max_capacity` set)
- [ ] Pass `batchId` through to checkout as query param

### EN.4 — Enrollment Checkout Page
- [ ] Build `/clubs/[slug]/enroll/checkout/page.tsx` — client
- [ ] Shows: club name, plan name + amount, batch (if chosen), breakdown: "Plan ₹X + Zenzo fee ₹299 = Total ₹Y" (enrollment fee shown transparently)
- [ ] [Pay & Join] → calls `POST /api/enrollment/create-order` → opens Razorpay Checkout (Zenzo platform key)
- [ ] On payment success: call `POST /api/enrollment/confirm` → redirect to success page

### EN.5 — Enrollment Success Page
- [ ] Build `/clubs/[slug]/enroll/success/page.tsx`
- [ ] "You're in! Welcome to [Club Name]." with club logo/initials
- [ ] "View your membership →" CTA → `/portal/${slug}`
- [ ] Auto-redirect after 5 seconds

### EN.6 — Club Owner Notification
- [ ] In `POST /api/enrollment/confirm`: after membership created, send WhatsApp to club owner — `new_enrollment` template: `{ consumer_name, plan_name, club_name }`

---

## Sprint TB — Trial Booking Flow (C4)

> **Goal:** Consumer books a trial session (free or paid, per club settings). Requires Sprint TS + Sprint CA.

### TB.1 — Trial CTA on Club Listing Page
- [ ] In `/clubs/[slug]/page.tsx`: show "Book a Trial" section when `clubs.trial_enabled = true`
- [ ] Show trial price: "Free" or "₹X" and duration: "1 session" or "X days"
- [ ] [Book a Trial] CTA → `/clubs/${slug}/trial`

### TB.2 — Trial Booking Page
- [ ] Build `/clubs/[slug]/trial/page.tsx` — SC, fetches batches for club
- [ ] Step 1: Pick a batch (required) — batch card with timing, days, coach name
- [ ] Step 2: Pick a date — calendar showing only the batch's scheduled days in the next 14 days
- [ ] If `trial_price_paise > 0`: goes to Razorpay checkout (use Zenzo Route, same as enrollment — small paid trial)
- [ ] If free: [Confirm Booking] directly

### TB.3 — Trial Booking DB + API
- [ ] Migration: `trial_bookings (id UUID PK, club_id, user_id, batch_id, trial_date DATE, status TEXT DEFAULT 'booked' CHECK IN ('booked','attended','no_show'), created_at)`
- [ ] Add `TrialBooking` type to DB types
- [ ] `POST /api/clubs/[clubId]/trial/book`: auth → check `max_trials_per_user` not exceeded (count `trial_bookings` by `user_id` for this club) → create `club_memberships` row (`status: 'trial'`) + `member_batches` row + `trial_bookings` row → send booking confirmation WhatsApp to consumer
- [ ] Trial booking WhatsApp: `trial_confirmed` template: `{ consumer_name, club_name, batch_name, date }`

### TB.4 — Trial Members in Take Attendance
- [ ] In `take-attendance-client.tsx`: show "TRIAL" badge on members with `status = 'trial'`
- [ ] When trial member is marked present: show inline nudge card "Enjoyed the session? Invite them to join" with [Send Enrollment Link] button → copies enrollment URL to clipboard for WhatsApp sharing

### TB.5 — Trial History Wired
- [ ] Wire `TS.3` trial history section with real data from `trial_bookings` joined to `users`
- [ ] "Mark No-show" action on each row: `PATCH /api/clubs/[clubId]/trial/[bookingId]` → sets `status = 'no_show'`

---

## Sprint PX — Enhanced Consumer Portal (C7)

> **Goal:** Upgrade `/portal` into a full consumer home: multi-club view, inline payments, combined calendar, profile editing.

### PX.1 — Portal Home Upgrade
- [ ] Redesign `/portal/page.tsx`: membership cards (active, overdue, trial, pending_invite)
- [ ] Card shows: club logo/initials, club name, status badge, next due date, last attendance date
- [ ] "Pay Now" CTA on overdue cards → `/portal/[clubSlug]/pay`
- [ ] "View" on all active cards → `/portal/[clubSlug]`
- [ ] "Accept / Decline" on pending_invite cards (reuse existing `/portal/invites` flow)

### PX.2 — Consumer Pay Page
- [ ] Build `/portal/[clubSlug]/pay/page.tsx` — client
- [ ] Shows: club name, plan, amount due, days overdue
- [ ] [Pay Now] → Razorpay checkout using Sprint RZ.3 payment link or Sprint RR Route
- [ ] On success: redirect back to `/portal/[clubSlug]` with "Payment recorded" toast

### PX.3 — Combined Attendance Calendar
- [ ] Add "All Activity" section to `/portal/page.tsx` below membership cards
- [ ] Month calendar grid: each day shows colored dots (one per club with activity — green = present, grey = no class)
- [ ] Hover/tap on a day: tooltip shows per-club attendance for that day

### PX.4 — Consumer Profile Page
- [ ] Build `/portal/profile/page.tsx` — client
- [ ] Fields: Full Name, Phone (read-only after set), Email, Avatar (upload to Supabase Storage `avatars` bucket)
- [ ] `PATCH /api/portal/profile`: updates `users` row
- [ ] Change password: `supabase.auth.updateUser({ password: newPassword })` with current password confirmation
- [ ] Accessible from portal top bar: "Profile" link

---

## Sprint RV — Reviews & Ratings (C8)

> **Goal:** Verified members can leave a star rating + text review. Club owners can respond. Reviews visible on the public listing page.

### RV.1 — DB Migration
- [ ] Migration: `club_reviews (id UUID PK, club_id, user_id, membership_id, rating INTEGER CHECK (rating BETWEEN 1 AND 5), body TEXT, owner_reply TEXT, is_visible BOOLEAN DEFAULT TRUE, created_at, updated_at)`
- [ ] Unique constraint: `(club_id, user_id)` — one review per user per club
- [ ] RLS: INSERT allowed only if user has `club_memberships.status IN ('active','overdue','expired')` at this club; SELECT: `is_visible = true` for public, all for owner
- [ ] Add `ClubReview` type to `packages/database/src/types/index.ts`

### RV.2 — Leave a Review (Consumer Portal)
- [ ] Add "Write a Review" section to `/portal/[clubSlug]/page.tsx` (only for active/expired members who haven't reviewed yet)
- [ ] Build `portal/[clubSlug]/_components/review-form.tsx`: 1–5 star tap (large tap targets, 48×48px), text area (20–500 chars)
- [ ] `POST /api/portal/[clubSlug]/review`: validate membership → upsert `club_reviews` row
- [ ] After submit: show "Thanks for your review!" and display the submitted review (read-only)

### RV.3 — Reviews on Public Club Page
- [ ] Add "Reviews" section to `/clubs/[slug]/page.tsx` below Coaches
- [ ] Header: large average rating number + star fill + "(X reviews)"
- [ ] Star breakdown: 5★ ▓▓▓▓▓ 42, 4★ ▓▓▓ 18, ... (horizontal bar per rating)
- [ ] Review list: first name + last initial, star rating, date (e.g., "Mar 2026"), review text, owner reply (indented, if present)
- [ ] Show 5 reviews by default, [Show all X reviews] expands the rest
- [ ] Update `GET /api/clubs/[slug]/public` to include `avg_rating`, `review_count`, and up to 5 most recent reviews

### RV.4 — Owner Response to Reviews
- [ ] Add "Reviews" tab to `settings/page.tsx` or create `reviews/page.tsx` for club staff (owner-only)
- [ ] Table: reviewer first name, rating, date, review text, reply status
- [ ] [Reply] action: text input, `PATCH /api/clubs/[clubId]/reviews/[reviewId]/reply` → sets `owner_reply`
- [ ] [Hide Review] action with reason dropdown (spam / offensive / irrelevant) → sets `is_visible = false`

### RV.5 — Rating in Explore Search
- [ ] Update `GET /api/clubs/explore` to return `avg_rating` and `review_count` per club (via Postgres aggregate)
- [ ] In `/explore` club cards: show star icon + rating (e.g., "★ 4.8") + "(23)"
- [ ] Sort by rating option in explore filters

---

## Sprint SB — SaaS Subscription Billing (C10)

> **Goal:** Clubs pay Zenzo monthly. Kicks in when Phase 2 (consumer platform) launches. First 50 clubs get early-adopter locked rate.

### SB.1 — DB Migration
- [ ] Migration: `platform_subscriptions (id UUID PK, club_id UNIQUE, plan_name TEXT CHECK IN ('free','starter','growth','pro','early_adopter'), amount_paise INTEGER, status TEXT DEFAULT 'active' CHECK IN ('active','past_due','cancelled','early_adopter'), razorpay_subscription_id TEXT, current_period_end DATE, created_at)`
- [ ] Add `platform_subscription_id FK → platform_subscriptions` to `clubs`
- [ ] Add `PlatformSubscription` type to DB types

### SB.2 — Pricing Tiers (from product-definition-v2.1)
- [ ] Define in `apps/web/src/lib/constants.ts` (indicative, TBD after first 50 clubs):
  - `Free`: ≤30 members, no Razorpay, no reports, no progression
  - `Starter` (~₹799/mo): ≤100 members, manual payments, basic reports
  - `Growth` (~₹1,499/mo): ≤300 members, Razorpay, full reports
  - `Pro` (~₹2,499/mo): unlimited members, all features, priority support
  - `EarlyAdopter`: Starter features at locked ₹499/mo forever (first 50 clubs, admin-granted)

### SB.3 — Feature Gates
- [ ] Create `apps/web/src/lib/feature-gates.ts`: server function `canUseFeature(clubId: string, feature: 'razorpay' | 'reports' | 'members_over_limit') => Promise<boolean>`
- [ ] Fetch club's `platform_subscription_plan`, compare against tier table
- [ ] In `reports/page.tsx`: check gate → if Free tier, show "Upgrade to Starter to unlock reports" banner with plan comparison
- [ ] In `settings/razorpay-settings.tsx`: check gate → if below Growth, show upgrade prompt
- [ ] Member list: if count > plan limit, show "You've reached your member limit" banner with upgrade CTA

### SB.4 — Billing Settings Page
- [ ] Build `settings/billing/page.tsx` — SC (owner-only)
- [ ] Shows: current plan name + badge, billing cycle, next billing date, member count vs limit progress bar
- [ ] [Upgrade Plan] → opens plan comparison modal → Razorpay subscription checkout
- [ ] [Cancel Subscription] → confirm dialog → `PATCH /api/platform/subscription` with `{ action: 'cancel' }` → status = 'cancelled' at period end

### SB.5 — Platform Subscription API
- [ ] `POST /api/platform/subscribe`: consumer auth → create Razorpay subscription via Zenzo platform account → insert `platform_subscriptions` row → return `{ subscriptionId }`
- [ ] `PATCH /api/platform/subscription`: handle cancel / upgrade actions
- [ ] Extend `POST /api/webhooks/razorpay/enrollment`: handle `subscription.charged` → update `platform_subscriptions.current_period_end`; handle `subscription.halted` → update `status = 'past_due'` → send owner notification

### SB.6 — Early Adopter Auto-Grant (Admin Panel)
- [ ] Extend Sprint AP.5 "Grant Early Adopter" action: also creates `platform_subscriptions` row with `plan_name = 'early_adopter'`, `amount_paise = 49900`, `status = 'early_adopter'`

---

## Sprint NA — Native App — iOS & Android (C9)

> **Goal:** React Native / Expo consumer app. B2B dashboard remains web-only. Consumer surfaces: discovery, enrollment, trial booking, portal, push notifications.

### NA.1 — Repo Setup
- [ ] Add `apps/mobile` to Turborepo workspace (`pnpm-workspace.yaml`)
- [ ] Init: `npx create-expo-app@latest apps/mobile --template expo-template-blank-typescript`
- [ ] Configure workspace to reference `@zenzo/utils` and `@zenzo/database` packages
- [ ] Install: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-router`, `nativewind`
- [ ] Configure Supabase client with AsyncStorage for session persistence

### NA.2 — Consumer Auth Screens
- [ ] `app/(auth)/login.tsx`: phone OTP flow using same `/api/auth/send-otp` + `/api/auth/verify-otp` endpoints
- [ ] `app/(auth)/google.tsx`: Expo AuthSession for Google OAuth
- [ ] Store session in AsyncStorage, restore on app launch via `supabase.auth.getSession()`

### NA.3 — Consumer Home Screen
- [ ] `app/(tabs)/home.tsx`: list of active memberships (club logo, name, status, next due)
- [ ] "Pay Now" chip on overdue memberships
- [ ] Empty state: "Find your first club → Explore"

### NA.4 — Explore Screen
- [ ] `app/(tabs)/explore.tsx`: search input + category chip filters + scrollable club cards
- [ ] Calls `GET /api/clubs/explore` (same endpoint as web)
- [ ] Club card: logo/initials, name, rating, city, category

### NA.5 — Club Detail Screen
- [ ] `app/club/[slug].tsx`: hero, about, plans, schedule, coaches, reviews
- [ ] "Book Trial" and "Join" CTAs → native checkout screens

### NA.6 — Enrollment Screen
- [ ] `app/club/[slug]/enroll.tsx`: plan selection → batch selection → Razorpay React Native SDK checkout
- [ ] Use same `/api/enrollment/*` endpoints as web
- [ ] Install `react-native-razorpay` SDK

### NA.7 — Portal (My Clubs) Screen
- [ ] `app/(tabs)/portal.tsx`: combined view of all memberships, attendance summary, upcoming payments

### NA.8 — Push Notifications
- [ ] Install `expo-notifications`, configure Expo Push Token registration
- [ ] On login: register device token → `POST /api/portal/push/subscribe` (extend to accept Expo push token alongside web push)
- [ ] Handle notification tap → deep link to relevant screen via `expo-router`
- [ ] Migration: `push_subscriptions (id UUID PK, user_id, token TEXT, platform TEXT, created_at)`

### NA.9 — App Store Submission
- [ ] Configure `app.json`: bundle ID `club.zenzo.app`, icons (1024×1024), splash screen, required permissions
- [ ] Setup `eas.json` for EAS Build
- [ ] `eas build --platform ios` + submit to App Store Connect
- [ ] `eas build --platform android` → AAB → Google Play Console

---

## Dependency Map

```
Sprint MC (Multi-Club)        → No deps
Sprint PR (Reports)           → No deps
Sprint BL (Progression)       → No deps
Sprint TS (Trial Settings)    → No deps
Sprint WA (WhatsApp)          → No deps (needs INTERAKT_API_KEY)
Sprint AP (Admin Panel)       → No deps (needs is_admin user)

Sprint RZ (Razorpay Direct)   → No deps (needs club RAZORPAY keys)
Sprint CA (Consumer Auth)     → WA (for OTP WhatsApp delivery)

Sprint RR (Razorpay Route)    → RZ + CA
Sprint EN (Enrollment)        → RR + CA + AP (club must be verified + listed)
Sprint TB (Trial Booking)     → TS + CA + AP
Sprint PX (Portal+)           → CA + EN
Sprint RV (Reviews)           → EN

Sprint SB (SaaS Billing)      → RR + AP
Sprint NA (Native App)        → CA + EN + TB + PX + RV
```

---

## Environment Variables Checklist

Add each as the relevant sprint is built:

```bash
# Sprint WA + CA
INTERAKT_API_KEY=

# Sprint RZ (per-club, stored in DB — not env)
# No env vars needed — club keys stored encrypted in clubs table

# Sprint RR (Zenzo platform account)
ZENZO_RAZORPAY_KEY_ID=
ZENZO_RAZORPAY_KEY_SECRET=
ZENZO_RAZORPAY_WEBHOOK_SECRET=

# Sprint CA (OTP — use Interakt, not a separate provider)
# No additional env — reuses INTERAKT_API_KEY

# Sprint NA (Push)
EXPO_ACCESS_TOKEN=         # For EAS Build
```

# Zenzo — Feature Specification

> **Source of truth for what we're building, in what order, and why.**
> Generated from PM/Design session. Update this file as decisions evolve.
> Share this with Claude Code at the start of every dev session.

---

## Mental Model

Zenzo is a **horizontal** membership management platform. The first GTM vertical is gyms,
but every schema, API, and UI decision must work equally for:

- Martial arts dojos
- Dance academies
- Music schools
- Swimming clubs
- Tuition / coaching centres
- Yoga studios
- Any recurring-attendance business

**What changes per vertical:** labels (member → student, batch → class), visible modules
(belt progression on/off), billing defaults.

**What never changes:** the five core entities below.

---

## Core Data Model — Non-Negotiable

These five entities are universal. Get the schema right before writing application code.

```
Member          — the person who attends (may be a child; payer may be different)
Session         — group or 1-on-1 (not "batch" at the DB level)
Attendance      — present / absent / unmarked per member per session
Plan            — any billing cycle: monthly, term, per-session, drop-in, package
Milestone       — belt / grade / level / badge (optional module, configurable)
```

### Critical schema decisions (must be in migration 001)

```sql
-- Member table must have nullable guardian_id
-- A child student's payer and WhatsApp recipient is their guardian, not them
members.guardian_id  → FK to members (self-referential) or separate guardians table

-- Session table must have session_type
-- Group sessions = batches. 1-on-1 = music lesson, PT session, private tuition.
sessions.session_type  → enum: 'group' | 'one_on_one'

-- Plan table must support all billing models
plans.billing_type  → enum: 'monthly' | 'quarterly' | 'half_yearly' | 'annual'
                             | 'per_session' | 'session_pack' | 'term' | 'drop_in'
plans.session_credits  → int nullable  -- for session_pack plans (e.g. 10-class card)
```

**Why this matters:** `guardian_id` and `session_type` are painful to retrofit after
customers are live. Every other horizontal feature can be layered on top of these two.

---

## Terminology System

Owner configures these labels in Settings → Customization. They propagate everywhere in the UI.

| Concept     | Gym       | Martial arts | Dance     | Music     | Tuition      |
|-------------|-----------|--------------|-----------|-----------|--------------|
| Member      | Member    | Student      | Student   | Student   | Student      |
| Session     | Batch     | Class        | Batch     | Slot      | Class        |
| Instructor  | Coach     | Sensei       | Teacher   | Teacher   | Teacher      |
| Milestone   | —         | Belt         | Grade     | ABRSM Grade | —          |
| Plan        | Plan      | Plan         | Plan      | Plan      | Plan         |

Stored as: `tenants.terminology` (jsonb). Fallback to defaults if not set.

---

## Roles

| Role    | Access                                                        |
|---------|---------------------------------------------------------------|
| `owner` | All modules, settings, financial data, staff management       |
| `staff` | Members (read), sessions, attendance, progression. No financials, no settings |
| `member`| Own portal only — attendance history, payment history, pay now |

**Guardian sub-role:** A guardian is a member record (or separate entity) with linked
child members. They access the member portal for all linked children in one view.
WhatsApp reminders go to guardian phone, not child's.

---

## Feature List by Priority

### P0 — Must ship on launch day

#### Auth & Onboarding
- [ ] Sign up: name, phone (+91 prefix), email, password
- [ ] OTP verification on phone number after signup
- [ ] Login: phone or email + password
- [ ] Forgot password via email reset link
- [ ] 5-step onboarding wizard:
  - Step 1: Credentials (done at signup)
  - Step 2: Business type selection (card grid) → auto-sets terminology + feature flags
  - Step 3: Studio setup (business name, URL slug with real-time availability check, city)
  - Step 4: Create first session/batch (skippable)
  - Step 5: Add first members (skippable)
- [ ] Slug-scoped workspace routing: `/:tenantSlug/*`
- [ ] Role-based route guard in middleware (Supabase auth + tenant membership check)

#### Member Management
- [ ] Add member form: name*, phone* (unique validation), email, DOB, gender,
      session assignment*, fee plan*, start date, emergency contact, WhatsApp welcome toggle
- [ ] Member list: search by name/phone (debounced 300ms), filter by session/status/plan
- [ ] Status badges: Active, Overdue, Expired, New (first 7 days)
- [ ] `guardian_id` field on member (can be null — adults are their own payer)
- [ ] Member list → card layout on mobile (<768px)
- [ ] Basic member profile (single screen P0, tabs in P1)
- [ ] Delete member with confirmation dialog

#### Session Management (replaces "Batch" at UI layer per terminology)
- [ ] Create session: name*, timing (start/end time), days of week*, instructor (optional),
      max capacity (optional), session_type (group | one_on_one)
- [ ] Session list: card grid (2-col desktop, 1-col mobile)
- [ ] Assign members to sessions at signup or from session detail
- [ ] Session detail: member list, today's attendance stat, Take Attendance CTA

#### Attendance
- [ ] Take attendance screen (THE ritual screen — must be excellent)
  - 56px row height, 48×48px minimum toggle tap target
  - Toggle states: Unmarked → Present → Absent → Unmarked (tap cycles)
  - Instant colour feedback: success-500 (present), error-100/error-500 (absent)
  - Progress bar: fills as members marked (any state counts), turns success-500 at 100%
  - "Mark remaining absent" bulk action (no confirmation needed — reversible)
  - Save button: spinner during save, disabled during request
  - Haptic feedback: navigator.vibrate(10) on every toggle (fails gracefully on desktop)
- [ ] Completion state: animated checkmark, summary (X present · Y absent), auto-return 2s
- [ ] Edit window: same-day until midnight (locked after, owner can unlock in settings)
- [ ] Auto-save prompt if navigating away with unsaved marks
- [ ] Empty state if session has no members

#### Fee Plans
- [ ] Create/edit plan: name*, amount (₹, stored as paise)*, billing_type*, description
- [ ] Plan list: card grid showing member count per plan
- [ ] Cannot delete plan with active members (API + UI enforcement)
- [ ] Default billing_type: monthly

#### Payments — Manual
- [ ] Overdue list (default payments view):
  - Sorted by most days overdue first
  - Per-member: Send Reminder (WhatsApp) + Record Payment actions
  - Total outstanding amount at top
  - "Send Reminders to All" bulk action with confirmation dialog
- [ ] Record payment form:
  - Member picker (searchable, pre-selected if navigated from overdue card)
  - Amount (pre-filled from plan, editable)
  - Payment method pill selector: Cash* | UPI | Bank Transfer | Other
  - Date (default today, can backdate)
  - Reference / note (optional)
  - Send receipt via WhatsApp (checkbox, on by default)
- [ ] On save: toast confirmation, return to overdue list
- [ ] All amounts stored in paise. Use formatCurrency() from @zenzo/utils for display.

#### Dashboard
- [ ] Stat cards: Revenue this month, Active members, Avg attendance %, Overdue count
- [ ] Needs Attention block: overdue fees (red), absent 3+ sessions (yellow),
      expiring memberships this week (yellow). Max 3 items.
- [ ] Quick Actions bar: Add Member, Take Attendance, Record Payment
- [ ] Recent Activity feed: last 10 events (payment received, attendance, new member)
- [ ] Owner view vs Coach view (coach sees today's sessions only, no financials)

#### WhatsApp (via Interakt API)
- [ ] Payment reminder template (manual trigger from overdue list)
  - Variables: {member_name}, {amount}, {due_date}, {business_name}, {payment_link}
  - Message sounds human, not robotic
- [ ] Delivery via Interakt API (not direct WhatsApp Business API)
- [ ] Failed delivery → surface in communications log

#### Settings
- [ ] Business profile: name, type, slug, city, phone, logo upload
- [ ] Terminology customization: member label, session label, instructor label,
      milestone label, progression module on/off toggle
- [ ] Business type change → confirm terminology reset dialog

---

### P1 — Phase 1 (ship within 90 days of launch)

#### Members — Enhanced
- [ ] Full member profile with 4 tabs: Overview | Attendance | Payments | Progression
- [ ] Overview tab: stat cards (attendance %, next due, milestone) + activity timeline
- [ ] Attendance tab: calendar heatmap (green/red/grey) + session list
- [ ] Payments tab: payment history + next due info
- [ ] Progression tab: milestone history + promote action
- [ ] CSV bulk import:
  - Template download (Name, Phone, Email, Session, Plan columns)
  - Preview with inline validation (duplicate phone, missing required fields)
  - Partial import: skip errored rows, import valid ones
  - Progress bar during import
- [ ] Bulk actions on member list: Send Reminder, Assign Session, Delete (with checkboxes)
- [ ] Guardian / parent account:
  - Guardian is a separate entity with own phone (the WhatsApp recipient)
  - Member can have a linked guardian (null for adult members)
  - Guardian member portal shows all linked members in one view
  - Payment reminders + receipts go to guardian, not member

#### Payments — Enhanced
- [ ] Payment history tab:
  - Filters: date range (this month default), payment method
  - Monthly summary: total collected + count (sticky at bottom)
  - CSV export
  - Click row → payment detail / receipt view
- [ ] Razorpay integration:
  - Connect via Settings → Payment Gateway
  - Send payment link via WhatsApp (embedded in reminder message)
  - Member completes payment in Razorpay checkout (pre-filled name, phone, amount)
  - Webhook: on payment success → auto-record payment + send WhatsApp receipt
- [ ] Drop-in / session-pack billing:
  - Plan type: session_pack with credit balance
  - Credits decrement on each marked-present
  - "Low credits" alert (instead of overdue list) when balance ≤ 2
  - Drop-in: payment recorded at time of attendance

#### Staff Management
- [ ] Add staff: name*, phone*, email, role (staff), batch assignments
- [ ] Staff list with edit/remove
- [ ] Staff login → simplified nav (no financials, no settings)
- [ ] WhatsApp invitation on staff add
- [ ] Role enforced via Supabase RLS (not just UI-level hiding)

#### WhatsApp — Enhanced
- [ ] Payment receipt auto-send on payment recorded (if setting enabled)
- [ ] Welcome message auto-send on member add (if setting enabled)
- [ ] Communications hub: Templates tab (read-only P1) + History tab
- [ ] History tab: date, recipient, template type, delivery status (Delivered/Sent/Failed)
- [ ] Failed messages: show reason + Retry button
- [ ] Notification settings: toggle each template on/off

#### Attendance — Enhanced
- [ ] Attendance history (owner view): grid with member rows × date columns
- [ ] Symbols: ✓ present, ✗ absent, — no session scheduled, empty = unmarked
- [ ] Filter by session and date range
- [ ] At-risk section: members absent 3+ of last 5 sessions

#### Reports — Basic
- [ ] Revenue report: collected, outstanding, projected, method breakdown (cash/UPI/online),
      6-month bar chart, date range + session filters, CSV export
- [ ] Attendance report: average rate, session-wise breakdown, daily trend line chart,
      at-risk members list, CSV export

#### Member Portal (token-gated, no login)
- [ ] Route: /m/:token
- [ ] Home: attendance % this month, next fee due + Pay Now CTA, last payment + receipt link
- [ ] Attendance tab: calendar heatmap, monthly summary, streak counter
- [ ] Payments tab: next due, payment history, per-payment receipt
- [ ] Payment flow: Razorpay checkout → success screen → auto WhatsApp receipt
- [ ] Token expiry: 30 days. Friendly expiry message with business contact info.
- [ ] Guardian view: shows all linked child members with tab switcher
- [ ] Always mobile layout (max-width 480px, even on desktop)

#### Milestone / Progression (conditional module)
- [ ] Enabled by: Settings → show progression module (on by default for martial arts, dance, music)
- [ ] Progression types: ordered_sequence | exam_based | free_form (set per business)
- [ ] Belt distribution view: horizontal bar chart by level
- [ ] Log promotion: member picker, promote-to level (next auto-selected), date, notes,
      WhatsApp congratulations toggle
- [ ] Member profile → Progression tab: timeline history + promote button
- [ ] WhatsApp congratulations template on promotion

#### Session — 1-on-1 Type
- [ ] session_type: one_on_one — single member per session, specific datetime (not day pattern)
- [ ] 1-on-1 session list per instructor (their "schedule")
- [ ] Attendance for 1-on-1: confirm/no-show (not a toggle list — just one member)

---

### P2 — Growth Phase

#### Automation
- [ ] Auto recurring payment reminders:
  - 3 days before due date + on due date (configurable in settings)
  - Runs as background job (Supabase Edge Function + pg_cron or similar)
  - Per-member opt-out
- [ ] Auto attendance alert to owner: member absent 3+ consecutive sessions
- [ ] Auto membership expiry warning (7 days before expiry)

#### Analytics
- [ ] Member growth report: total, new this month, churned, growth trend, new vs churned bars
- [ ] Retention report: cohort retention table, avg tenure, at-risk members
  (low attendance + overdue fees = high risk)
- [ ] "Send reminder to at-risk members" bulk action from retention report

#### Communications — Advanced
- [ ] Custom WhatsApp template editor (edit template text, variable insertion helper)
- [ ] Manual bulk send: to individual member or entire session group
- [ ] Message scheduling (send at specific time)

#### Payments — Advanced
- [ ] Partial payments + running balance per member
- [ ] Credits system (overpayment applies as credit to next cycle)
- [ ] Family / multi-child plan: one payment covers multiple linked members

#### Sessions — Advanced
- [ ] Capacity limits + waitlist for group sessions
- [ ] Workshop / one-off event: one-time fee, non-recurring, tracked separately from plan

#### Platform
- [ ] Multi-location (tenant switcher): one login, multiple business workspaces
- [ ] PWA manifest + service worker for home screen install
- [ ] Offline-first attendance: write to IndexedDB, sync on reconnect, show "pending sync" state

#### Trial / Enquiry Flow (CRM-lite)
- [ ] Enquiry record: name, phone, interested session, source
- [ ] Trial status: Enquiry → Trial Booked → Trial Done → Converted / Not Joined
- [ ] Convert to member: one-click from trial record → pre-fills add member form
- [ ] Enquiry list in Members module (separate tab or status filter)

---

## What We Are NOT Building

These are explicit decisions, not oversights. Revisit after 500 paying customers.

| Not building | Reason |
|---|---|
| Native iOS / Android app | Mobile web (PWA) covers the use case. Saves 6 months. |
| Dark mode | Not expected by target market. Token system makes future migration easy. |
| Biometric / QR attendance | Fails in practice. Manual toggle builds coach-member rapport. |
| Accounting integrations (Tally, Zoho) | CSV export covers P1 needs. Different buyer persona. |
| Social login (Google, Apple) | Low demand in Indian market. Adds OAuth complexity. |
| AI features | Need 6+ months of longitudinal data to be meaningful. Year 2. |
| Marketplace / member discovery | Different product, different business model. |
| Video / content delivery | Out of scope. This is ops software, not an LMS. |

---

## Key Implementation Rules

1. **Amounts always in paise** (₹1 = 100 paise). Use `formatCurrency()` from `@zenzo/utils`.
2. **Dates in DD MMM YYYY format** (23 Mar 2026). Use `formatDate()` from `@zenzo/utils`.
3. **Server Components by default.** `"use client"` only when needed (interactivity, hooks).
4. **Supabase RLS enforces roles** — not just UI-level hiding. Every table has RLS policies.
5. **Tenant isolation** — every query is scoped to `tenant_id`. No cross-tenant data leakage.
6. **Phone is the primary identifier** in the Indian market. Always validate uniqueness per tenant.
7. **WhatsApp messages sound human** — no "Dear User", no robotic phrasing.
8. **Attendance screen performance** — zero unnecessary re-renders on toggle. Profile it.
9. **Mobile-first for coaches** (attendance screen). **Desktop-first for owners** (reports, members).
10. **Modals → bottom sheets on mobile** (<768px). **Tables → card lists on mobile**.

---

## How to Use This File in Claude Code Sessions

Start every Claude Code session with:

```
Read CLAUDE.md and FEATURES.md first. Then read the relevant screen spec in docs/design/.
We're building [specific feature]. The feature spec is in FEATURES.md under [P0/P1/P2 section].
Start by documenting the implementation plan as a comment block, then write the code.
```

Reference specific sections when scoping work:

```
We're implementing "Record payment form" from FEATURES.md P0 > Payments — Manual.
The screen spec is in docs/design/09-screens-payments.md.
```

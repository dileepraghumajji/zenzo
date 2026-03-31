# Zenzo — Feature Specification
*Source of truth for implementation. Every feature, every flow, every edge case.*
*Locked: March 2026. Reflects new two-sided platform philosophy (v2.1).*

---

## Mental Model — The 6 Core Entities

```
users           One Zenzo account per person. Works across all clubs.
clubs           Each club/tenant. Has one owner, many staff, many members.
club_staff      Connects a user to a club with a role (owner or coach).
club_memberships Connects a user to a club as a member. Has a status lifecycle.
batches         Scheduling groups within a club (e.g., "Morning Batch").
member_batches  Many-to-many join: which members are in which batches.
```

A person can be:
- An `owner` (via `club_staff`) of Club A
- A `coach` (via `club_staff`) at Club B
- A member (via `club_memberships`) of Club C
All from the same Zenzo account.

---

## Database Schema

### Migration Order
```
001_create_users.sql
002_create_clubs.sql
003_create_club_staff.sql
004_create_fee_plans.sql
005_create_club_memberships.sql
006_create_batches.sql
007_create_member_batches.sql
008_create_attendance_records.sql
009_create_payments.sql
010_create_progression_levels.sql
011_create_promotions.sql
012_create_member_current_level.sql
013_create_notifications_log.sql
014_create_notification_settings.sql
```

### users
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY,  -- Supabase Auth UID
  full_name       TEXT NOT NULL,
  phone           TEXT UNIQUE NOT NULL,  -- +91XXXXXXXXXX format
  email           TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  is_admin        BOOLEAN DEFAULT FALSE,  -- Zenzo platform admin only
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### clubs
```sql
CREATE TABLE clubs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE NOT NULL,  -- e.g., 'ravis-fitness'
  name                    TEXT NOT NULL,
  business_type           TEXT NOT NULL,  -- 'gym' | 'martial_arts' | 'dance' | 'yoga' | 'other'
  city                    TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  logo_url                TEXT,
  description             TEXT,
  verification_status     TEXT DEFAULT 'pending',  -- 'pending' | 'verified' | 'rejected'
  verification_photo_url  TEXT,
  listed                  BOOLEAN DEFAULT FALSE,  -- true only after verification

  -- Billing configuration
  billing_cycle_type      TEXT DEFAULT 'doj',  -- 'doj' (date-of-joining) | 'calendar' (1st of month)

  -- Trial configuration
  trial_enabled           BOOLEAN DEFAULT FALSE,
  trial_price_paise       INTEGER DEFAULT 0,  -- 0 = free
  trial_duration_days     INTEGER DEFAULT 1,
  max_trials_per_user     INTEGER DEFAULT 1,

  -- Terminology customization
  term_member             TEXT DEFAULT 'Member',
  term_batch              TEXT DEFAULT 'Batch',
  term_progression        TEXT DEFAULT 'Level',
  show_progression        BOOLEAN DEFAULT FALSE,

  owner_id                UUID REFERENCES users(id) NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### club_staff
```sql
CREATE TABLE club_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID REFERENCES clubs(id) NOT NULL,
  user_id     UUID REFERENCES users(id) NOT NULL,
  role        TEXT NOT NULL,  -- 'owner' | 'coach'
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id, role)
);
```
*One user can be coach at multiple clubs (shared coaching). The owner is always present as `role = 'owner'` in this table.*

### fee_plans
```sql
-- Must be created before club_memberships (FK dependency)
CREATE TABLE fee_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID REFERENCES clubs(id) NOT NULL,
  name            TEXT NOT NULL,  -- e.g., 'Monthly Plan'
  amount_paise    INTEGER NOT NULL,  -- ₹1 = 100 paise. ₹1,500 stored as 150000.
  billing_cycle   TEXT NOT NULL,  -- 'monthly' | 'quarterly' | 'half_yearly' | 'annual' | 'per_session'
  description     TEXT,
  deleted_at      TIMESTAMPTZ,  -- soft delete
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### club_memberships
```sql
CREATE TABLE club_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID REFERENCES clubs(id) NOT NULL,
  user_id         UUID REFERENCES users(id) NOT NULL,
  plan_id         UUID REFERENCES fee_plans(id),  -- nullable before plan assigned
  status          TEXT DEFAULT 'pending_invite',
                  -- 'pending_invite' | 'active' | 'overdue' | 'expired' | 'deleted'
  joined_at       TIMESTAMPTZ,  -- set when status first becomes 'active'
  plan_start_date DATE,
  next_due_date   DATE,
  expires_at      DATE,
  deleted_at      TIMESTAMPTZ,  -- soft delete
  invite_token    TEXT,
  invite_sent_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id)  -- one membership per club per user
);
```

### batches
```sql
CREATE TABLE batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES clubs(id) NOT NULL,
  name          TEXT NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  days          TEXT[] NOT NULL,  -- e.g., ARRAY['mon','tue','wed','thu','fri']
  coach_id      UUID REFERENCES users(id),  -- nullable (unassigned)
  max_capacity  INTEGER,  -- nullable (unlimited)
  description   TEXT,
  deleted_at    TIMESTAMPTZ,  -- soft delete
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### member_batches
```sql
CREATE TABLE member_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID REFERENCES club_memberships(id) NOT NULL,
  batch_id      UUID REFERENCES batches(id) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(membership_id, batch_id)
);
```

### attendance_records
```sql
CREATE TABLE attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES clubs(id) NOT NULL,  -- denormalized for RLS
  membership_id UUID REFERENCES club_memberships(id) NOT NULL,
  batch_id      UUID REFERENCES batches(id) NOT NULL,
  date          DATE NOT NULL,
  status        TEXT NOT NULL,  -- 'present' | 'absent'
  is_drop_in    BOOLEAN DEFAULT FALSE,  -- true if member not assigned to this batch
  marked_by     UUID REFERENCES users(id) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(membership_id, batch_id, date)  -- one record per member per batch per day
);
```

### payments
```sql
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES clubs(id) NOT NULL,  -- denormalized for RLS
  membership_id UUID REFERENCES club_memberships(id) NOT NULL,
  amount_paise  INTEGER NOT NULL,
  method        TEXT NOT NULL,  -- 'cash' | 'upi' | 'bank_transfer' | 'other'
  payment_date  DATE NOT NULL,
  reference     TEXT,  -- optional note or UPI txn ID
  recorded_by   UUID REFERENCES users(id) NOT NULL,
  receipt_sent  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### progression_levels
```sql
CREATE TABLE progression_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES clubs(id) NOT NULL,
  name          TEXT NOT NULL,  -- e.g., 'Yellow Belt', 'Grade 2'
  display_order INTEGER NOT NULL,
  emoji         TEXT,  -- e.g., '🟡'
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, display_order)
);
```

### promotions
```sql
CREATE TABLE promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           UUID REFERENCES clubs(id) NOT NULL,
  membership_id     UUID REFERENCES club_memberships(id) NOT NULL,
  from_level_id     UUID REFERENCES progression_levels(id),  -- null for first promotion
  to_level_id       UUID REFERENCES progression_levels(id) NOT NULL,
  promoted_on       DATE NOT NULL,
  notes             TEXT,
  promoted_by       UUID REFERENCES users(id) NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### member_current_level
```sql
-- Denormalized for quick lookups; updated on each promotion
CREATE TABLE member_current_level (
  membership_id UUID REFERENCES club_memberships(id) PRIMARY KEY,
  level_id      UUID REFERENCES progression_levels(id) NOT NULL,
  since_date    DATE NOT NULL
);
```

### notifications_log
```sql
CREATE TABLE notifications_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           UUID REFERENCES clubs(id) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) NOT NULL,
  type              TEXT NOT NULL,
    -- 'payment_reminder' | 'payment_receipt' | 'welcome' | 'promotion'
    -- | 'attendance_alert' | 'expiry_warning' | 'invite'
  channel           TEXT NOT NULL,  -- 'whatsapp' | 'email' | 'push'
  status            TEXT NOT NULL,  -- 'sent' | 'delivered' | 'failed'
  failure_reason    TEXT,
  message_preview   TEXT,  -- truncated content for history view
  sent_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_settings
```sql
CREATE TABLE notification_settings (
  club_id             UUID REFERENCES clubs(id) PRIMARY KEY,
  payment_reminder    BOOLEAN DEFAULT TRUE,
  payment_receipt     BOOLEAN DEFAULT TRUE,
  welcome_message     BOOLEAN DEFAULT TRUE,
  promotion_congrats  BOOLEAN DEFAULT TRUE,
  attendance_alert    BOOLEAN DEFAULT TRUE,
  expiry_warning      BOOLEAN DEFAULT TRUE
);
```

---

## RLS Policies

### users
```sql
-- Users can read their own row
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- club_staff can read users who belong to the same club
CREATE POLICY "users_select_same_club" ON users
  FOR SELECT USING (
    id IN (
      SELECT cs.user_id FROM club_staff cs
      WHERE cs.club_id IN (
        SELECT club_id FROM club_staff WHERE user_id = auth.uid()
      )
    )
    OR
    id IN (
      SELECT cm.user_id FROM club_memberships cm
      WHERE cm.club_id IN (
        SELECT club_id FROM club_staff WHERE user_id = auth.uid()
      )
    )
  );
```

### clubs
```sql
-- Public read: verified + listed clubs (for public listing page)
CREATE POLICY "clubs_select_public" ON clubs
  FOR SELECT USING (listed = true AND verification_status = 'verified');

-- Staff read own club
CREATE POLICY "clubs_select_staff" ON clubs
  FOR SELECT USING (
    id IN (SELECT club_id FROM club_staff WHERE user_id = auth.uid())
  );

-- Owner write own club
CREATE POLICY "clubs_update_owner" ON clubs
  FOR UPDATE USING (owner_id = auth.uid());

-- Authenticated users can create clubs (for onboarding)
CREATE POLICY "clubs_insert_authenticated" ON clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());
```

### club_staff
```sql
-- Staff can read club_staff for their own clubs
CREATE POLICY "club_staff_select" ON club_staff
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM club_staff WHERE user_id = auth.uid())
  );

-- Only owner can add/remove staff
CREATE POLICY "club_staff_insert_owner" ON club_staff
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "club_staff_delete_owner" ON club_staff
  FOR DELETE USING (
    club_id IN (
      SELECT club_id FROM club_staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

### club_memberships
```sql
-- Staff read memberships in their club
CREATE POLICY "memberships_select_staff" ON club_memberships
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM club_staff WHERE user_id = auth.uid())
  );

-- Members read their own membership
CREATE POLICY "memberships_select_own" ON club_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Only owner can create/update/delete memberships
CREATE POLICY "memberships_write_owner" ON club_memberships
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

### attendance_records
```sql
-- Staff read attendance in their club
CREATE POLICY "attendance_select_staff" ON attendance_records
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM club_staff WHERE user_id = auth.uid())
  );

-- Members read their own attendance
CREATE POLICY "attendance_select_own" ON attendance_records
  FOR SELECT USING (
    membership_id IN (SELECT id FROM club_memberships WHERE user_id = auth.uid())
  );

-- Staff (owner or coach) can write attendance
CREATE POLICY "attendance_write_staff" ON attendance_records
  FOR ALL USING (
    club_id IN (SELECT club_id FROM club_staff WHERE user_id = auth.uid())
  );
```

### payments
```sql
-- Owner reads all payments in their club
CREATE POLICY "payments_select_owner" ON payments
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Members read their own payments
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    membership_id IN (SELECT id FROM club_memberships WHERE user_id = auth.uid())
  );

-- Only owner can record payments
CREATE POLICY "payments_insert_owner" ON payments
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

---

## P0 Features — Phase 1 (Club Tools)

### P0.1 Auth & Club Onboarding

**Signup flow:**
1. Form: Full Name + Phone (+91 prefix) + Email + Password (min 8 chars)
2. Submit → POST `/api/auth/signup` → sends WhatsApp OTP via Interakt
3. OTP modal: 6-digit input, 3 attempts, 60s cooldown, 5-minute expiry
4. On OTP success: `supabase.auth.signUp()` → creates Supabase Auth user + `users` row
5. Post-signup routing:
   - Has `invite_token` in URL params → create `club_memberships` row (status: active), redirect to member portal
   - No invite token → redirect to Club Onboarding Wizard

**Login flow:**
1. Form: Email or Phone + Password (single field, auto-detect format)
2. `supabase.auth.signInWithPassword()`
3. On success: POST `/api/auth/profile` → returns `{ clubSlug, role }`
4. Has 1 club → redirect to `/${clubSlug}/dashboard`
5. Has 2+ clubs → redirect to `/clubs` (club picker page)
6. Has no club staff role → redirect to consumer home or landing

**Forgot Password:**
1. Email field → `supabase.auth.resetPasswordForEmail()`
2. Supabase sends reset link (valid 1 hour)
3. On reset: min 8 chars, redirect to login

**Club Onboarding Wizard (5 steps):**
1. **Business Type** — card grid: Gym/Fitness, Martial Arts, Dance/Performing Arts, Yoga/Wellness, Other. Auto-configures terminology + progression toggle.
2. **Studio Setup** — Business Name, URL Slug (auto-generated, editable, real-time availability check), City, Business Phone. Creates `clubs` row + `club_staff` row (role: owner).
3. **Create First Batch** (skippable) — Name, Start Time, End Time, Days.
4. **Invite First Members** (skippable) — Phone number input + [Send Invite] button. Each invite sends WhatsApp message and creates `club_memberships` (status: pending_invite).
5. **Celebrate** — redirect to `/:clubSlug/dashboard` with tooltip overlays.

**Acceptance criteria:**
- OTP expires after 5 minutes. Invalid code shows error (not which field was wrong).
- Phone must be unique across all users.
- Slug: lowercase letters, numbers, hyphens only. Min 3, max 40 chars. Taken → show "Not available" in real time.
- Club is created with `verification_status: 'pending'`, `listed: false`.
- All management tools available immediately after club creation (verification gates listing only).

---

### P0.2 Member Management

**Core rule: no shadow users.** A member is either a real Zenzo user or a pending invite. Never create an `active` `club_memberships` row for a user that doesn't have a Supabase Auth account.

**Invite Member (single):**
1. POST `/api/clubs/[clubId]/members/invite` with `{ phone, name? }`
2. Check if phone has a Zenzo account:
   - YES + already member of this club → Error: "This person is already a member"
   - YES + not a member → Create `club_memberships` (status: active), send WhatsApp welcome
   - NO → Generate invite token (encodes club_id + phone + expiry 30 days). Create `club_memberships` (status: pending_invite). Send WhatsApp invite via Interakt.
3. Invite text: "[Owner Name] has invited you to join [Club Name] on Zenzo. Sign up here: [link]"

**Invite Member (bulk):**
- Upload CSV/Excel. Required column: Phone Number. Optional: Name, Email.
- Validate: 10-digit Indian format. Preview: "45 valid, 3 duplicates, 2 invalid."
- Send invites in batch. Progress bar. Results summary.

**Member List (`/:clubSlug/members`):**
- Desktop: data table — Name, Phone, Batch(es), Status badge, Plan, Fee Amount
- Mobile: card list — name, status badge, batch, fee info
- Filters: Status (All/Active/Overdue/Expired/Pending Invite), Batch (multi-select), Plan
- Search: instant filter on name or phone (debounced 300ms)
- Sort: Name A-Z (default), Join date, Last attendance
- Pagination: 25/page desktop, infinite scroll mobile
- Bulk actions: Send Reminder, Assign Batch, Delete (when checkboxes selected)

**Member Status Lifecycle:**
```
pending_invite → active → overdue → expired
                    ↑                   │
                    └───────────────────┘ (payment recorded)
```
- `pending_invite` → `active`: person completes Zenzo signup via invite link
- `active` → `overdue`: payment due date passes without payment recorded
- `overdue` → `active`: payment recorded
- `overdue` → `expired`: plan period + 7-day grace ends without payment
- `expired` → `active`: new payment recorded (reactivates membership)
- `deleted`: soft delete (deleted_at set). History preserved for reports.

**Member Profile (`/:clubSlug/members/:memberId`):**
- Header: Avatar (initials fallback), Name, Phone, Email, Status badge, Batch(es), Plan, "Member since"
- Tabs: Overview | Attendance | Payments | Progression (if enabled)
- Actions menu: Send WhatsApp, Record Payment, Change Batch, Change Plan (owner only), Deactivate, Delete

**API routes:**
```
GET    /api/clubs/[clubId]/members
POST   /api/clubs/[clubId]/members/invite
POST   /api/clubs/[clubId]/members/bulk-invite
GET    /api/clubs/[clubId]/members/[memberId]
PUT    /api/clubs/[clubId]/members/[memberId]
DELETE /api/clubs/[clubId]/members/[memberId]
POST   /api/clubs/[clubId]/members/[memberId]/assign-plan
POST   /api/clubs/[clubId]/members/[memberId]/send-whatsapp
```

---

### P0.3 Batch Management

**Core principle:** Batches are scheduling groups. No link to billing. A member can be in 0, 1, or many batches.

**Batch List (`/:clubSlug/batches`):**
- Card grid: 2 columns desktop, 1 column mobile
- Each card: Batch name, Timing (6:00–7:30 AM), Days (Mon–Fri), Member count, Avg attendance %, Coach

**Create Batch (`/:clubSlug/batches/new`):**
- Fields: Name (required), Start Time, End Time, Days (pill toggles, Mon–Fri pre-selected), Coach (searchable dropdown of club_staff with coach role), Max Capacity (optional), Description (optional)
- Validation: name required, start < end, at least 1 day selected

**Batch Detail (`/:clubSlug/batches/[batchId]`):**
- Stat cards: Members count, Avg Attendance % this month, Today: X/Y present
- Primary action: [Take Attendance] → `/:clubSlug/attendance/take/:batchId`
- Member list with remove option
- [+ Add Member to Batch] → searchable picker of club members NOT already in this batch

**Many-to-many join:** `member_batches (membership_id, batch_id)`. Removing from batch does NOT remove from club.

**Soft delete:** `batches.deleted_at`. Attendance history preserved.

**API routes:**
```
GET    /api/clubs/[clubId]/batches
POST   /api/clubs/[clubId]/batches
GET    /api/clubs/[clubId]/batches/[batchId]
PUT    /api/clubs/[clubId]/batches/[batchId]
DELETE /api/clubs/[clubId]/batches/[batchId]
POST   /api/clubs/[clubId]/batches/[batchId]/members
DELETE /api/clubs/[clubId]/batches/[batchId]/members/[membershipId]
```

---

### P0.4 Attendance — THE Ritual Screen

**Core principle:** Fast (under 60 seconds for 20 members), satisfying (haptic, visual progress), foolproof (works offline, auto-saves). This screen defines whether coaches adopt Zenzo.

**Take Attendance (`/:clubSlug/attendance/take/[batchId]`):**
- Header: Back arrow, Batch name, Date (auto today)
- Progress bar: "12 of 18 marked" (fills as members marked present OR absent). Turns success at 100%.
- Member list: all members assigned to batch (from `member_batches`), sorted A-Z, 56px rows
- Each row: Avatar (36px initials), Member name, Toggle (48x48px min tap target)
- Toggle cycles: Unmarked (neutral) → Present (green ✓) → Absent (red ✗) → Unmarked
- Toggle feedback: 150ms color transition, scale(0.95)→scale(1.0) on tap, `navigator.vibrate(10)`
- No confirmation dialogs on toggle. Any state is instantly reversible.
- Search: hidden by default (pull down to reveal), filters in real-time
- Drop-in: [+ Add Drop-in] → picker of club members NOT in this batch. Recorded with `is_drop_in: true`. Does NOT permanently add to batch.
- Bottom bar (sticky): [Mark remaining absent] [Save]
- Edit window: same day until midnight IST. Reopening loads previous marks.

**Completion state:** Full-screen animated checkmark → "Attendance saved!" + "15 present · 3 absent" → auto-redirect to batch list after 2 seconds.

**Offline support (IndexedDB):**
- Every toggle tap saves to IndexedDB immediately
- Sync indicator: 🟢 "Synced" / 🟡 "Saved locally" / 🔄 "Syncing..."
- On connectivity return: auto-push queued records
- Conflict resolution: last-write-wins. Toast: "Attendance updated — some changes were synced from another device."
- Cache member list per batch. If no cache + offline: show error.

**Navigate-away guard:** Modal "You have unsaved attendance marks. [Discard] [Save & Leave]"

**Attendance History (`/:clubSlug/attendance/history`):**
- Desktop: grid — members as rows, dates as columns. ✓ green / ✗ red / — grey (no class) / empty (not marked)
- Mobile: list per member — "Arjun Kumar — 4/5 this week (80%)"
- Filters: Batch, Date range
- "At risk" section: members absent 3+ of last 5 sessions

**API routes:**
```
GET  /api/clubs/[clubId]/attendance
POST /api/clubs/[clubId]/attendance
GET  /api/clubs/[clubId]/attendance/[batchId]/today
```

---

### P0.5 Fee Plans

**Create/Edit Plan:**
- Fields: Name (required), Amount in ₹ (required, stored as paise), Billing Cycle (Monthly/Quarterly/Half-yearly/Annual/Per Session), Description (optional)
- Cannot delete plan with active members. Soft delete via `deleted_at`.

**Assign plan to member:**
- Start date defaults to today
- Calculates `next_due_date` based on `clubs.billing_cycle_type`:
  - DOJ-based: start_date + billing_cycle
  - Calendar-based: 1st of next month

**Due date logic:**
- Monthly DOJ: joined Mar 15 → due Apr 15, May 15, ...
- Monthly Calendar: any join date → due Apr 1, May 1, ...
- Per Session: no recurring due date

**Auto-expiry cron (daily, midnight IST):**
1. `active` memberships where `next_due_date` < today → `status = 'overdue'`
2. `overdue` memberships where `expires_at` < today → `status = 'expired'`
3. Notify owner: "[X] members are now overdue"

**API routes:**
```
GET    /api/clubs/[clubId]/fee-plans
POST   /api/clubs/[clubId]/fee-plans
PUT    /api/clubs/[clubId]/fee-plans/[planId]
DELETE /api/clubs/[clubId]/fee-plans/[planId]
POST   /api/clubs/[clubId]/members/[memberId]/assign-plan
```

---

### P0.6 Payments (Manual)

**Core principle:** Phase 1 — all payments are manual recordings. Owner receives money offline and records in Zenzo.

**Record Payment (`/:clubSlug/payments/record`):**
- Fields: Member (searchable dropdown, pre-fills overdue amount), Amount in ₹, Method (Cash/UPI/Bank Transfer/Other), Date (default today, can backdate), Reference/Note, ☑ Send receipt via WhatsApp, ☑ Send receipt via Email
- On save:
  1. Creates `payments` row
  2. Updates `club_memberships.status` (overdue → active if this covers overdue amount)
  3. Recalculates `next_due_date`
  4. Sends WhatsApp receipt (if checked, via Interakt)
  5. Toast: "₹1,500 recorded for Arjun Kumar"

**Overdue List (`/:clubSlug/payments`):**
- Header: Total outstanding amount. [Send Reminders to All]
- Card list sorted by most overdue first
- Each card: Avatar + Name, Amount due + Plan + Due date, Days overdue, [Send Reminder] [Record Payment]

**Payment History (`/:clubSlug/payments/history`):**
- Filters: Date range, Payment method
- Desktop: table — Date, Member, Amount, Method, Reference
- Mobile: card list
- Monthly summary. [Download CSV]

**API routes:**
```
GET  /api/clubs/[clubId]/payments
POST /api/clubs/[clubId]/payments
GET  /api/clubs/[clubId]/payments/overdue
POST /api/clubs/[clubId]/payments/send-reminders
```

---

### P0.7 Dashboard

**Owner Dashboard (`/:clubSlug/dashboard`):**
- Greeting: "Good morning, [Name] 👋" + date
- Stat cards: Revenue this month, Active members, Avg attendance %, Overdue count
- Needs Attention block (max 3 items, sorted urgency):
  - 🔴 "X members have overdue fees" → /payments
  - 🟡 "X members absent 5+ days" → filtered members
  - 🟡 "X memberships expiring this week" → filtered members
  - Empty state: "All clear! Nothing needs your attention today."
- Quick Actions: [+ Invite Member] [Take Attendance] [Record Payment]
- Recent Activity feed: 10 items, most recent first
- Loading: shimmer skeletons matching each component shape

**Coach Dashboard (`/:clubSlug/dashboard` — coach role):**
- Today's batches only (batches where coach_id = current user), sorted by time
- Each card: Status (🟢 upcoming / ✓ completed), Name, Time + member count, [Take Attendance →]
- No financial data. No reports. No settings.

---

### P0.8 WhatsApp Notifications (via Interakt)

All toggleable per club in Settings. All templates are pre-built (not editable in Phase 1).

| Notification | Trigger | Recipients | Key variables |
|---|---|---|---|
| Payment Reminder | Auto: 3 days before due + on due date | Member | name, plan_name, amount, due_date, club_name |
| Payment Receipt | Auto: on payment record (if checkbox checked) | Member | name, amount, plan_name, date, method, next_due_date |
| Welcome Message | Auto: on member signup via invite link | Member | name, club_name, portal_link |
| Belt/Level Promotion | Manual: owner logs promotion | Member | name, new_belt, club_name |
| Attendance Alert | Auto: member absent 3+ consecutive sessions | Owner | member_name, absent_count, club_name |
| Expiry Warning | Auto: 7 days before expires_at | Member | name, expires_at, plan_name, club_name |
| Member Invite | Manual: on invite | Invited person | owner_name, club_name, signup_link |

**Integration:** Interakt API `POST https://api.interakt.ai/v1/public/message/` with template name + recipient phone + variables. Log every attempt in `notifications_log`. No retries in Phase 1.

---

### P0.9 Settings

**Business Profile (`/:clubSlug/settings/profile`):**
- Business Name, Business Type, URL Slug, City, Business Phone, Logo (max 2MB, square crop), Verification Photo
- Billing Cycle Setting: DOJ-based / Calendar-based radio
- [Save Changes] (explicit, not auto-save)

**Notifications (`/:clubSlug/settings/notifications`):**
- Toggle for each notification type with preview of template using sample data

**Payment Gateway (`/:clubSlug/settings/payment-gateway`):**
- Phase 1: Informational only. "Online payments coming soon. For now, record payments manually."
- Razorpay connect UI (forward-looking prep)

**Customization (`/:clubSlug/settings/customization`):**
- Custom terminology: "Members are called: [input]", "Batches are called: [input]", "Progression levels: [input]"
- Show Progression Module: on/off toggle
- Progression Level Order: drag-to-reorder list, [+ Add Level]

**Staff Management (`/:clubSlug/settings/staff`):**
- [+ Add Staff]: Phone (checks Zenzo account), Role (Coach), Assign Batches
  - Account exists → create `club_staff` link + WhatsApp notification
  - No account → send WhatsApp invite link, `club_staff` created after signup
- Remove staff: removes `club_staff` row. Zenzo account unaffected.

---

## P1 Features — Phase 1.5

### P1.1 Belt/Level Progression
- Enabled per club via `show_progression = true`
- Pre-built level sets for martial arts, dance. Customizable in Settings.
- Belt distribution view: horizontal bar showing members per level
- Log promotion: from_level, to_level, date, notes. Updates `member_current_level`.
- Auto-send WhatsApp congratulations on promotion

### P1.2 Multi-Club Support
- Club switcher in sidebar footer and mobile More sheet
- Create additional club: abbreviated wizard (steps 2–3 only)
- Coaches shared across clubs owned by same owner
- Club picker page for users with 2+ clubs

### P1.3 Reports
- Revenue: collected, outstanding, projected, trend chart, breakdown by method (CSV export)
- Attendance: avg rate, at-risk members, batch-wise breakdown (CSV export)
- Member Growth: new vs churned trend (CSV export)
- Retention: rate, avg tenure, cohort analysis, churn risk list (CSV export)
- Owner-only. Coaches do not see reports.

### P1.4 Trial Session Settings
- Club settings: enable/disable, price (free or ₹X), duration, max per consumer
- Trial history in club dashboard
- Consumer trial booking: Phase 2

### P1.5 Public Club Listing Page
- Auto-generated at `/clubs/:slug` after Zenzo admin approves verification
- Sections: Hero, Photos, About, Plans & Pricing, Schedule, Coaches, Trial CTA, WhatsApp Contact
- Phase 1: read-only, no online enrollment. 404 until verified.

### P1.6 Member Portal (View-only)
- Token-gated: `/m/:token` (no login required). Token encodes user_id + club_id + 30-day expiry.
- Tabs: Home (attendance %, next due, last payment, batch), Attendance (calendar heatmap), Payments (history + receipt view)
- Mobile-only layout (max-width 480px). Phase 1: view only.

---

## P2 Features — Consumer Platform (scope only)

- Consumer auth: phone OTP + Google Sign-In
- Club discovery: search, filters, map view
- Full club listing page with enrollment CTA + trial booking
- Enrollment flow: plan selection → payment → membership activation
- Consumer dashboard: my clubs, combined attendance calendar, payments
- Reviews & ratings (verified members only)
- Native iOS + Android app
- SaaS subscription billing begins (first 50 clubs: early-adopter locked rate)

---

## API Route Map

All routes are Next.js App Router route handlers at `apps/web/src/app/api/`.

### Auth
```
POST /api/auth/signup              — create account + send WhatsApp OTP
POST /api/auth/verify-otp          — verify WhatsApp OTP, complete signup
POST /api/auth/profile             — get {clubSlug, role} after login
POST /api/auth/logout              — sign out
```

### Onboarding
```
POST /api/onboarding/club          — create club + club_staff (owner)
GET  /api/onboarding/slug-check    — real-time slug availability
```

### Clubs
```
GET    /api/clubs/[clubId]
PUT    /api/clubs/[clubId]
GET    /api/clubs/[clubId]/staff
POST   /api/clubs/[clubId]/staff
DELETE /api/clubs/[clubId]/staff/[userId]
```

### Members
```
GET    /api/clubs/[clubId]/members
POST   /api/clubs/[clubId]/members/invite
POST   /api/clubs/[clubId]/members/bulk-invite
GET    /api/clubs/[clubId]/members/[memberId]
PUT    /api/clubs/[clubId]/members/[memberId]
DELETE /api/clubs/[clubId]/members/[memberId]
POST   /api/clubs/[clubId]/members/[memberId]/assign-plan
POST   /api/clubs/[clubId]/members/[memberId]/send-whatsapp
```

### Batches
```
GET    /api/clubs/[clubId]/batches
POST   /api/clubs/[clubId]/batches
GET    /api/clubs/[clubId]/batches/[batchId]
PUT    /api/clubs/[clubId]/batches/[batchId]
DELETE /api/clubs/[clubId]/batches/[batchId]
POST   /api/clubs/[clubId]/batches/[batchId]/members
DELETE /api/clubs/[clubId]/batches/[batchId]/members/[membershipId]
```

### Attendance
```
GET  /api/clubs/[clubId]/attendance
POST /api/clubs/[clubId]/attendance
GET  /api/clubs/[clubId]/attendance/[batchId]/today
```

### Fee Plans
```
GET    /api/clubs/[clubId]/fee-plans
POST   /api/clubs/[clubId]/fee-plans
PUT    /api/clubs/[clubId]/fee-plans/[planId]
DELETE /api/clubs/[clubId]/fee-plans/[planId]
```

### Payments
```
GET  /api/clubs/[clubId]/payments
POST /api/clubs/[clubId]/payments
GET  /api/clubs/[clubId]/payments/overdue
POST /api/clubs/[clubId]/payments/send-reminders
```

### Reports
```
GET /api/clubs/[clubId]/reports/revenue
GET /api/clubs/[clubId]/reports/attendance
GET /api/clubs/[clubId]/reports/members
GET /api/clubs/[clubId]/reports/retention
```

### Notifications
```
GET /api/clubs/[clubId]/notification-settings
PUT /api/clubs/[clubId]/notification-settings
GET /api/clubs/[clubId]/notifications-log
```

### Cron Jobs (invoked by Vercel Cron)
```
POST /api/cron/update-membership-statuses  — daily midnight IST
POST /api/cron/send-payment-reminders      — daily: 3 days before + on due date
POST /api/cron/send-expiry-warnings        — daily: 7 days before expires_at
```

### Member Portal
```
GET /api/portal/[token]
GET /api/portal/[token]/attendance
GET /api/portal/[token]/payments
```

---

## Implementation Rules (non-negotiable for coding agents)

1. **No shadow users.** Never create a `club_memberships` row with `status = 'active'` for a user without a Supabase Auth account. The flow is: invite → `pending_invite` → signup → `active`.

2. **RLS is the security layer.** Write policies for every table before building routes. Routes check auth (`getUser()`), then RLS handles authorization. Belt-and-suspenders.

3. **Supabase client created directly in every function.** Never passed through helpers. See CLAUDE.md Critical Rule #5.

4. **Explicit column selects.** `select("id, full_name, phone")` not `select("*")` until types are generated from schema.

5. **All amounts in paise.** Input fields accept ₹ (display). Divide by 100 for storage. Multiply by 100 for display via `formatCurrency()`. Never store floats.

6. **Soft deletes everywhere.** `deleted_at TIMESTAMPTZ` on `batches`, `fee_plans`, `club_memberships`. History is always preserved for reports. Filter soft-deleted rows with `.is('deleted_at', null)`.

7. **All API routes: validate auth first, then club access, then process.**
   ```ts
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   const hasAccess = await checkClubStaff(supabase, user.id, clubId)
   if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
   ```

8. **Validate all inputs with Zod.** Define schemas in `lib/utils/validation.ts`. Return `{ error: 'Validation failed', code: 'VALIDATION_ERROR', details: {...} }` on failure.

9. **Log all WhatsApp sends.** Every Interakt API call creates a `notifications_log` row. On failure, log `failure_reason`. No retries in Phase 1.

10. **Attendance offline queue.** IndexedDB stores every toggle immediately. Never rely on network for toggle saves. Sync to server in background. Last-write-wins on conflict.

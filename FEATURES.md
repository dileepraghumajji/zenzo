# Zenzo — Feature Specification (Production Grade)

> **This is the source of truth for what we build, in what order, and exactly how.**
> Read CLAUDE.md first, then this file, then the relevant screen spec in docs/design/.
> Start every dev session: `Read CLAUDE.md + FEATURES.md, then build [feature].`

---

## CEO/CTO Review Notes (Applied to this doc)

**What was added vs temp-features.md:**
1. Database migration order with full schema (not just hints)
2. Supabase RLS policies — concrete, copy-paste ready
3. API route map — every Next.js route handler needed
4. Acceptance criteria per feature (definition of done)
5. Validation rules (field-level, API-level)
6. Integration specs (Interakt, Razorpay webhook)
7. Implementation dependencies (what blocks what)
8. Error handling patterns
9. Member portal token spec
10. Guardian model elevated to P0 (was P1 — risk if deferred)

**Strategic decisions confirmed:**
- Horizontal-first schema. No gym-specific columns. Labels via terminology jsonb.
- Guardian in P0 — dance academies + music schools = child students on day 1.
- Phone = primary identifier. Unique per tenant, not globally.
- All money in paise. Never store floats for currency.
- RLS is the security layer. UI hiding is UX, not security.

---

## Mental Model

Five universal entities. Everything else is config or UI.

```
Tenant      → the business (gym, dojo, dance school)
Member      → the person who attends (may be a child; guardian is payer)
Session     → a scheduled group or 1-on-1 class
Attendance  → one row per member per session (present/absent/unmarked)
Plan        → a billing contract (monthly, pack, per-session, etc.)
Payment     → a recorded transaction against a plan
Milestone   → belt/grade/level progression (optional module)
```

---

## Database Schema & Migration Order

### Migration Order (STRICT — do not reorder)

```
001_tenants
002_profiles (depends on auth.users)
003_sessions (depends on tenants)
004_members (depends on tenants, profiles)
005_member_sessions (join table — member ↔ session)
006_attendance (depends on members, sessions)
007_plans (depends on tenants)
008_member_plans (join — member ↔ plan, tracks active plan per member)
009_payments (depends on members, plans, tenants)
010_milestones (depends on tenants)
011_member_milestones (depends on members, milestones)
012_guardians (depends on members)
013_communications_log (depends on tenants, members)
```

---

### 001 — tenants
```sql
create table tenants (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,          -- URL slug e.g. 'ravis-fitness'
  name         text not null,
  business_type text not null default 'gym',  -- gym|martial_arts|dance|music|tuition|yoga|other
  city         text,
  phone        text,
  logo_url     text,
  terminology  jsonb not null default '{
    "member": "Member",
    "session": "Batch",
    "instructor": "Coach",
    "milestone": "Belt",
    "show_milestones": true
  }'::jsonb,
  plan         text not null default 'trial', -- trial|starter|growth|pro
  created_at   timestamptz default now()
);

-- RLS
alter table tenants enable row level security;
create policy "tenant members can read own tenant"
  on tenants for select
  using (id in (
    select tenant_id from profiles where id = auth.uid()
  ));
create policy "owner can update own tenant"
  on tenants for update
  using (id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
```

---

### 002 — profiles
```sql
create type user_role as enum ('owner', 'staff', 'member');

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  role         user_role not null default 'member',
  full_name    text not null,
  phone        text,
  email        text,
  created_at   timestamptz default now()
);

create index on profiles(tenant_id);
create index on profiles(tenant_id, role);

-- RLS
alter table profiles enable row level security;
create policy "users can read profiles in own tenant"
  on profiles for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid()
  ));
create policy "owner/staff can insert profiles"
  on profiles for insert
  with check (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "owner can update profiles"
  on profiles for update
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
```

---

### 003 — sessions
```sql
create type session_type as enum ('group', 'one_on_one');
create type day_of_week as enum ('mon','tue','wed','thu','fri','sat','sun');

create table sessions (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  name           text not null,
  session_type   session_type not null default 'group',
  start_time     time not null,              -- e.g. 06:00:00
  end_time       time not null,
  days           day_of_week[] not null,     -- e.g. {mon,tue,wed,thu,fri}
  instructor_id  uuid references profiles(id) on delete set null,
  max_capacity   int,
  is_active      boolean not null default true,
  created_at     timestamptz default now()
);

create index on sessions(tenant_id);
create index on sessions(instructor_id);

-- RLS
alter table sessions enable row level security;
create policy "tenant members can read sessions"
  on sessions for select
  using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
create policy "owner/staff can manage sessions"
  on sessions for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
```

---

### 004 — members
```sql
create type member_status as enum ('active', 'inactive', 'suspended');
create type gender_type as enum ('male', 'female', 'other');

create table members (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  profile_id          uuid references profiles(id) on delete set null, -- null for minors
  guardian_id         uuid references members(id) on delete set null,  -- null for adults
  full_name           text not null,
  phone               text,             -- null for children (guardian receives WhatsApp)
  email               text,
  date_of_birth       date,
  gender              gender_type,
  emergency_contact_name  text,
  emergency_contact_phone text,
  status              member_status not null default 'active',
  joined_at           date not null default current_date,
  notes               text,
  created_at          timestamptz default now(),

  -- phone unique per tenant (not globally)
  constraint members_phone_tenant_unique unique (tenant_id, phone)
);

create index on members(tenant_id);
create index on members(tenant_id, status);
create index on members(guardian_id);

-- RLS
alter table members enable row level security;
create policy "owner/staff can manage members"
  on members for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "member can read own record"
  on members for select
  using (profile_id = auth.uid());
```

---

### 005 — member_sessions (join table)
```sql
create table member_sessions (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id) on delete cascade,
  session_id   uuid not null references sessions(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  joined_at    date not null default current_date,
  unique(member_id, session_id)
);

create index on member_sessions(session_id);
create index on member_sessions(member_id);

-- RLS (inherit from sessions access)
alter table member_sessions enable row level security;
create policy "owner/staff can manage member_sessions"
  on member_sessions for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
```

---

### 006 — attendance
```sql
create type attendance_status as enum ('present', 'absent', 'unmarked');

create table attendance (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  member_id    uuid not null references members(id) on delete cascade,
  session_id   uuid not null references sessions(id) on delete cascade,
  date         date not null,
  status       attendance_status not null default 'unmarked',
  marked_by    uuid references profiles(id) on delete set null,
  marked_at    timestamptz,
  created_at   timestamptz default now(),

  unique(member_id, session_id, date)
);

create index on attendance(tenant_id, date);
create index on attendance(member_id);
create index on attendance(session_id, date);

-- RLS
alter table attendance enable row level security;
create policy "owner/staff can manage attendance"
  on attendance for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "member can read own attendance"
  on attendance for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));
```

---

### 007 — plans
```sql
create type billing_type as enum (
  'monthly', 'quarterly', 'half_yearly', 'annual',
  'per_session', 'session_pack', 'term', 'drop_in'
);

create table plans (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  name             text not null,
  billing_type     billing_type not null default 'monthly',
  amount_paise     int not null,           -- ALWAYS in paise. ₹1 = 100.
  session_credits  int,                    -- only for session_pack type
  duration_days    int,                    -- null for per_session/drop_in
  description      text,
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

create index on plans(tenant_id);

-- RLS
alter table plans enable row level security;
create policy "tenant members can read plans"
  on plans for select
  using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
create policy "owner can manage plans"
  on plans for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
```

---

### 008 — member_plans
```sql
create table member_plans (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  member_id        uuid not null references members(id) on delete cascade,
  plan_id          uuid not null references plans(id),
  start_date       date not null,
  end_date         date,                   -- null for per_session/drop_in
  next_due_date    date,
  credits_remaining int,                   -- for session_pack; null otherwise
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

create index on member_plans(member_id);
create index on member_plans(tenant_id, next_due_date);  -- for overdue queries

-- RLS
alter table member_plans enable row level security;
create policy "owner/staff can manage member_plans"
  on member_plans for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "member can read own plan"
  on member_plans for select
  using (member_id in (select id from members where profile_id = auth.uid()));
```

---

### 009 — payments
```sql
create type payment_method as enum ('cash', 'upi', 'bank_transfer', 'online', 'other');
create type payment_status as enum ('completed', 'pending', 'failed', 'refunded');

create table payments (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  member_id        uuid not null references members(id) on delete cascade,
  member_plan_id   uuid references member_plans(id),
  amount_paise     int not null,
  payment_method   payment_method not null,
  payment_status   payment_status not null default 'completed',
  payment_date     date not null default current_date,
  reference        text,                   -- UPI ref, Razorpay payment ID, etc.
  razorpay_order_id text,
  razorpay_payment_id text,
  notes            text,
  receipt_sent     boolean not null default false,
  recorded_by      uuid references profiles(id),
  created_at       timestamptz default now()
);

create index on payments(tenant_id, payment_date);
create index on payments(member_id);
create index on payments(tenant_id, payment_status);

-- RLS
alter table payments enable row level security;
create policy "owner can manage payments"
  on payments for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
create policy "staff can insert payments"
  on payments for insert
  with check (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "member can read own payments"
  on payments for select
  using (member_id in (select id from members where profile_id = auth.uid()));
```

---

### 010 — milestones
```sql
create type milestone_type as enum ('ordered_sequence', 'exam_based', 'free_form');

create table milestones (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text not null,             -- e.g. 'White Belt', 'Grade 1'
  level_order   int not null default 0,   -- for ordered_sequence sorting
  color_hex     text,                      -- badge colour in UI e.g. '#FFFFFF'
  milestone_type milestone_type not null default 'ordered_sequence',
  created_at    timestamptz default now()
);

create index on milestones(tenant_id, level_order);

-- RLS
alter table milestones enable row level security;
create policy "tenant members can read milestones"
  on milestones for select
  using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
create policy "owner can manage milestones"
  on milestones for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
```

---

### 011 — member_milestones
```sql
create table member_milestones (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  milestone_id  uuid not null references milestones(id),
  achieved_at   date not null default current_date,
  notes         text,
  promoted_by   uuid references profiles(id),
  created_at    timestamptz default now()
);

create index on member_milestones(member_id);

-- RLS
alter table member_milestones enable row level security;
create policy "owner/staff can manage member_milestones"
  on member_milestones for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner','staff')
  ));
create policy "member can read own milestones"
  on member_milestones for select
  using (member_id in (select id from members where profile_id = auth.uid()));
```

---

### 012 — member_portal_tokens
```sql
-- Token-gated access for member portal (/m/:token)
-- No login required — URL contains a secure token
create table member_portal_tokens (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  token         text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at    timestamptz not null default now() + interval '30 days',
  created_at    timestamptz default now()
);

create index on member_portal_tokens(token);  -- fast lookup by token

-- No RLS needed — token IS the auth. Accessed via service role in API route.
```

---

### 013 — communications_log
```sql
create type comm_type as enum (
  'payment_reminder', 'payment_receipt', 'welcome',
  'milestone_congrats', 'attendance_alert', 'custom'
);
create type comm_status as enum ('queued', 'sent', 'delivered', 'failed');

create table communications_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  member_id     uuid references members(id) on delete set null,
  phone         text not null,
  comm_type     comm_type not null,
  message_body  text not null,
  status        comm_status not null default 'queued',
  interakt_msg_id text,                    -- returned by Interakt API
  error_reason  text,
  sent_at       timestamptz,
  created_at    timestamptz default now()
);

create index on communications_log(tenant_id, created_at desc);
create index on communications_log(member_id);

-- RLS
alter table communications_log enable row level security;
create policy "owner can read comms log"
  on communications_log for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));
```

---

## P0 — Must Ship on Launch Day

> P0 = nothing works without these. Block everything else until done.

---

### P0.1 — Auth & Onboarding

**Implementation order:** Sign up → OTP → Tenant creation → Onboarding wizard → Dashboard

#### Sign Up
**Route:** `POST /api/auth/signup`
**Fields:** full_name*, phone* (+91 prefix, 10 digits), email*, password* (min 8 chars)
**Flow:**
1. Create `auth.users` via Supabase Auth (`supabase.auth.signUp`)
2. Trigger sends OTP to phone (Supabase Phone Auth or custom via SMS gateway)
3. On OTP verify → create `profiles` row (tenant_id is null until onboarding completes)
4. Redirect → `/onboarding`

**Validation:**
- Phone: strip spaces/dashes, must be 10 digits after +91
- Email: standard format check
- Password: min 8 chars
- Phone uniqueness: checked against `profiles.phone` globally (not per-tenant for auth)

**Acceptance criteria:**
- [ ] User receives OTP on phone within 10 seconds
- [ ] Duplicate phone shows "Phone already registered" with link to login
- [ ] Failed OTP shows "Invalid code. Try again." (max 3 attempts, then resend)
- [ ] After verify, user lands on `/onboarding` with session active

#### Login
**Route:** Supabase Auth (`supabase.auth.signInWithPassword`)
**Fields:** phone or email (single field, auto-detect: contains @ = email), password
**Flow:**
1. Detect if input is email or phone
2. `supabase.auth.signInWithPassword({ email, password })`
3. On success → redirect to `/:tenantSlug/dashboard`
4. If profile has no tenant (incomplete onboarding) → redirect to `/onboarding`

**Acceptance criteria:**
- [ ] Login with phone works (e.g. "9876543210" maps to profile)
- [ ] Login with email works
- [ ] Wrong credentials → generic toast "Invalid phone/email or password" (no specifics)
- [ ] Successful login → always lands on dashboard, never login again

#### Onboarding Wizard (5 steps)
**Route:** `/onboarding` (protected, requires auth, no tenant yet)

**Step 1 — Business Type** (`/onboarding?step=1`)
- Card grid: Gym, Martial Arts, Dance Academy, Music School, Tuition Centre, Yoga, Other
- On select: store `business_type` in local state
- "Other" shows free text input for custom label
- Auto-sets terminology defaults based on type

**Step 2 — Studio Setup** (`/onboarding?step=2`)
- Fields: business_name*, slug* (auto-generated from name, editable, real-time availability check via `GET /api/tenants/check-slug?slug=xxx`), city
- On next: create `tenants` row + update `profiles.tenant_id`

**Step 3 — First Session** (`/onboarding?step=3`, skippable)
- Fields: name, start_time, end_time, days (multi-select)
- Pre-filled: "Morning Batch", 06:00, 07:30, Mon–Fri
- On next: create `sessions` row if filled

**Step 4 — Add Members** (`/onboarding?step=4`, skippable)
- Quick-add form: name + phone (repeat)
- Members appear in a preview list as added
- On next: bulk create `members` rows

**Step 5 — Completion**
- Redirect → `/:tenantSlug/dashboard`
- Confetti burst (300ms CSS animation)
- Dashboard shows "You're all set!" banner (dismissible, stored in localStorage)

**Acceptance criteria:**
- [ ] Steps 1–3 are required. Steps 4–5 are skippable.
- [ ] Slug availability check debounced 500ms, shows ✓ Available / ✗ Taken
- [ ] Incomplete onboarding (navigating away at step 2) → resumes on next login
- [ ] Full onboarding completable in under 5 minutes with pre-filled defaults

---

### P0.2 — Member Management

**Routes:**
```
GET    /api/[tenantSlug]/members              → list (paginated, search, filter)
POST   /api/[tenantSlug]/members              → create
GET    /api/[tenantSlug]/members/:id          → get one
PUT    /api/[tenantSlug]/members/:id          → update
DELETE /api/[tenantSlug]/members/:id          → soft delete (set status=inactive)
```

**Page routes:**
```
/:tenantSlug/members                          → Member list
/:tenantSlug/members/new                      → Add member form
/:tenantSlug/members/:id                      → Member profile
/:tenantSlug/members/:id/edit                 → Edit member
```

**Add Member form — required fields:** full_name, phone (if adult), session_id, plan_id
**Add Member form — optional fields:** email, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, guardian_id (for minors), notes

**Guardian flow (P0 — not P1):**
- When adding a member: toggle "This is a child/minor"
- If minor: phone field becomes optional, guardian picker appears
- Guardian: search existing members by phone or add new guardian inline
- Guardian phone = WhatsApp recipient for all communications about this child
- `members.guardian_id` → FK to another member record

**Validation:**
- phone: unique per tenant (check `members_phone_tenant_unique` constraint)
- phone required unless `guardian_id` is set (children may not have their own phone)
- full_name: non-empty, 2–100 chars
- start_date: cannot be future date

**Acceptance criteria:**
- [ ] Adding member with duplicate phone shows "Phone already registered for [Name]"
- [ ] Member appears in list immediately after add
- [ ] WhatsApp welcome sent (if toggled) within 5 seconds of save
- [ ] Soft delete: member disappears from active list, data retained, no FK violations
- [ ] Member list search filters on name and phone, debounced 300ms, <500ms response

---

### P0.3 — Session Management

**Routes:**
```
GET    /api/[tenantSlug]/sessions             → list
POST   /api/[tenantSlug]/sessions             → create
GET    /api/[tenantSlug]/sessions/:id         → get one
PUT    /api/[tenantSlug]/sessions/:id         → update
DELETE /api/[tenantSlug]/sessions/:id         → delete (block if has members)
POST   /api/[tenantSlug]/sessions/:id/members → add member to session
DELETE /api/[tenantSlug]/sessions/:id/members/:memberId → remove member
```

**Validation:**
- end_time must be after start_time
- days: at least 1 day required
- Cannot delete session with active member_sessions (API returns 409 with message)

**Acceptance criteria:**
- [ ] Session card shows: name, timing, days, member count, avg attendance this month
- [ ] Instructor assignment shows staff only (not owners, not members)
- [ ] Deleting session with members → error "Remove all members from this session first"

---

### P0.4 — Attendance (THE ritual screen)

**Routes:**
```
GET  /api/[tenantSlug]/attendance/:sessionId/:date → get attendance for session+date
POST /api/[tenantSlug]/attendance                  → upsert batch of marks
GET  /api/[tenantSlug]/attendance/history          → paginated history (owner view)
```

**POST body:**
```typescript
{
  session_id: string,
  date: string,          // YYYY-MM-DD
  marks: Array<{
    member_id: string,
    status: 'present' | 'absent' | 'unmarked'
  }>
}
```
**Uses upsert** on `(member_id, session_id, date)` unique constraint.

**Edit window rule:** `date` must be today (server-enforced). Past date = 403 unless owner setting `allow_backdated_attendance = true`.

**Performance requirements (critical):**
- Attendance list renders in <100ms (all members loaded upfront, no pagination)
- Toggle updates local state immediately (optimistic UI), syncs to server
- Re-render on toggle: ONLY the toggled row re-renders (use React.memo or separate state per row)
- Save: single API call with all marks (not one call per member)

**Acceptance criteria:**
- [ ] 20-member batch: all 20 toggles responsive within 16ms (60fps)
- [ ] Progress bar updates immediately on toggle
- [ ] "Mark remaining absent" marks all unmarked rows, does NOT change already-marked rows
- [ ] Save shows spinner, disables button, re-enables on success
- [ ] Completion state shows for 2s then auto-navigates back
- [ ] navigator.vibrate(10) called on toggle (no error on desktop)
- [ ] Navigating away with unsaved marks: browser confirms "Leave without saving?"

---

### P0.5 — Fee Plans

**Routes:**
```
GET    /api/[tenantSlug]/plans       → list
POST   /api/[tenantSlug]/plans       → create
PUT    /api/[tenantSlug]/plans/:id   → update
DELETE /api/[tenantSlug]/plans/:id   → delete (403 if members assigned)
```

**Amount handling:** UI accepts rupees (e.g. 1500), API stores paise (150000). Conversion in API route, never in UI component.

**Acceptance criteria:**
- [ ] Amount displayed as ₹1,500.00 using formatCurrency() (never raw paise)
- [ ] Delete blocked with message: "Cannot delete plan — 18 members are on this plan"
- [ ] billing_type: monthly pre-selected on create form

---

### P0.6 — Payments (Manual)

**Routes:**
```
GET  /api/[tenantSlug]/payments/overdue       → members with overdue fees
POST /api/[tenantSlug]/payments               → record payment
GET  /api/[tenantSlug]/payments               → history (paginated)
```

**Overdue logic:**
```sql
-- "Overdue" = member has an active member_plan where next_due_date < today
select m.id, m.full_name, m.phone, mp.next_due_date,
       p.amount_paise, p.name as plan_name,
       current_date - mp.next_due_date as days_overdue
from members m
join member_plans mp on mp.member_id = m.id and mp.is_active = true
join plans p on p.id = mp.plan_id
where mp.tenant_id = $1
  and mp.next_due_date < current_date
  and m.status = 'active'
order by days_overdue desc;
```

**Record payment flow:**
1. POST creates `payments` row
2. Updates `member_plans.next_due_date` += plan duration_days
3. If WhatsApp receipt enabled: queues message to `communications_log`
4. Returns `{ payment_id, receipt_url }`

**Acceptance criteria:**
- [ ] Overdue list sorted by most days overdue first
- [ ] Amount pre-filled from plan amount (editable)
- [ ] Cash pre-selected as payment method
- [ ] After save: member disappears from overdue list (optimistic update)
- [ ] Toast: "₹1,500 payment recorded for Arjun Kumar"

---

### P0.7 — Dashboard

**Routes:**
```
GET /api/[tenantSlug]/dashboard/stats    → { revenue_mtd, active_members, avg_attendance, overdue_count }
GET /api/[tenantSlug]/dashboard/alerts   → { overdue, absent_5_days, expiring_week }
GET /api/[tenantSlug]/dashboard/activity → last 10 events
```

**Stats queries (all scoped to tenant_id):**
- revenue_mtd: `SUM(amount_paise) WHERE payment_date >= first_of_month`
- active_members: `COUNT WHERE status = 'active'`
- avg_attendance: last 30 days, all sessions
- overdue_count: overdue query count

**Alert thresholds:**
- Overdue: next_due_date < today
- Absent: absent in 5 of last 5 marked sessions (not calendar days)
- Expiring: member_plans.next_due_date BETWEEN today AND today + 7

**Coach dashboard:** Only shows today's sessions assigned to `auth.uid()`. No stats. No financials.

**Acceptance criteria:**
- [ ] Stats load within 1.5s on first visit
- [ ] "Needs Attention" shows max 3 items, sorted by urgency (red first)
- [ ] Empty "Needs Attention" shows "All clear!" in success-50 background
- [ ] Coach sees ONLY their own sessions. No revenue numbers anywhere.

---

### P0.8 — WhatsApp (Manual, via Interakt)

**Integration:** Interakt API
**Env vars required:** `INTERAKT_API_KEY`
**Base URL:** `https://api.interakt.ai/v1/public/message/`

**API call (server-side only — key never exposed to client):**
```typescript
// POST to Interakt
{
  "countryCode": "+91",
  "phoneNumber": "9876543210",
  "callbackData": "payment_reminder",
  "type": "Template",
  "template": {
    "name": "payment_reminder",   // must match approved template name in Interakt
    "languageCode": "en",
    "bodyValues": ["Arjun", "₹1,500", "15 Mar 2026", "Ravi's Fitness Hub", "https://..."]
  }
}
```

**Message templates (P0 — hard-coded, not customisable yet):**

| Type | Template name | Variables |
|---|---|---|
| payment_reminder | `zenzo_payment_reminder` | member_name, amount, due_date, business_name, payment_link |
| payment_receipt | `zenzo_payment_receipt` | member_name, amount, date, plan_name, business_name |
| welcome | `zenzo_welcome` | member_name, business_name, portal_link |

**Route:** `POST /api/[tenantSlug]/communications/send`
```typescript
body: {
  member_id: string,
  type: 'payment_reminder' | 'payment_receipt' | 'welcome',
  variables?: Record<string, string>   // overrides
}
```

**Flow:**
1. Resolve member phone (or guardian phone if guardian_id set)
2. Build template variables
3. POST to Interakt API
4. Insert to `communications_log` with status
5. On Interakt error: log as 'failed', surface in comms hub

**Acceptance criteria:**
- [ ] INTERAKT_API_KEY never appears in client bundle
- [ ] Guardian's phone used when member has guardian_id
- [ ] Failed send: logged, shown in comms history with error reason
- [ ] Bulk send (all overdue): max 10 concurrent requests (rate-limit safe)

---

### P0.9 — Settings (Core)

**Routes:**
```
GET  /api/[tenantSlug]/settings          → tenant settings
PUT  /api/[tenantSlug]/settings          → update tenant
PUT  /api/[tenantSlug]/settings/terminology → update terminology jsonb
```

**Terminology propagation:**
- Stored in `tenants.terminology` (jsonb)
- Fetched once per session, cached in React context: `<TerminologyProvider>`
- All UI text uses: `const { member, session } = useTerminology()`
- Never hardcode "Member" or "Batch" in UI components — always use terminology context

**Acceptance criteria:**
- [ ] Changing "Member" → "Student" propagates across ALL UI in <1s (context re-render)
- [ ] Business type change shows confirm: "This will reset your terminology labels. Continue?"
- [ ] Logo upload: max 2MB, JPG/PNG/WebP only, stored in Supabase Storage `tenant-logos` bucket

---

## P1 — Ship within 90 days of launch

---

### P1.1 — Member Profile (Full Tabs)

**Route:** `/:tenantSlug/members/:id`
**Tabs:** Overview | Attendance | Payments | Progression

**Overview tab:**
- 3 stat cards: attendance % this month, next fee due date + amount, current milestone
- Activity timeline: last 20 events (attendance marks, payments, milestone promotions)
- Timeline query: union of attendance + payments + member_milestones, ordered by created_at desc

**Attendance tab:**
- Calendar heatmap: current month default, navigate months with arrows
- Green = present, Red = absent, Grey dot = no session scheduled
- Below calendar: this month %, last month %, streak count (consecutive present)
- Streak: count of consecutive days where at least one session was marked present

**Payments tab:**
- Next due card (if overdue: red, if due within 7 days: amber, else green)
- Payment history table/cards
- Each row: date, plan, amount, method, receipt link

**Progression tab (conditional on terminology.show_milestones):**
- Current milestone card (colour from milestone.color_hex)
- History timeline: milestone name + date + notes
- "Promote" button → opens promotion form

---

### P1.2 — Bulk Import

**Route:** `/:tenantSlug/members/import`
**API:** `POST /api/[tenantSlug]/members/import` (multipart/form-data)

**Template columns:** Name*, Phone, Email, Session (name match), Plan (name match), Guardian Phone

**Validation (server-side):**
- Duplicate phones within the file: mark as error
- Duplicate phone against existing members: mark as error with existing member name
- Missing required column (Name): mark as error
- Session name not found: mark as warning (create member without session)
- Plan name not found: mark as warning (create member without plan)

**Response:** `{ valid: Row[], errors: { row: number, field: string, message: string }[] }`

**Acceptance criteria:**
- [ ] Template CSV downloadable before upload
- [ ] Preview shows valid rows (green), error rows (red with reason) before import
- [ ] "Import X valid members, skip Y errors" button
- [ ] Progress bar: updates per batch of 10 inserts
- [ ] After import: redirect to member list with "X members imported" toast

---

### P1.3 — Razorpay Integration

**Env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

**Payment link flow:**
1. `POST /api/[tenantSlug]/payments/create-order`
   - Creates Razorpay Order via Razorpay API
   - Stores `razorpay_order_id` in a pending payment row
   - Returns `{ order_id, amount, key_id, prefill: { name, contact, email } }`
2. WhatsApp message sent with payment URL: `https://rzp.io/...` or hosted checkout page
3. Member completes payment on Razorpay

**Webhook:** `POST /api/webhooks/razorpay`
- Verify signature: `razorpay.webhooks.validateWebhookSignature(body, signature, secret)`
- On `payment.captured`: update payment row status → 'completed', update member_plan.next_due_date
- On `payment.failed`: update payment row status → 'failed'
- Auto-send WhatsApp receipt if `communications` setting enabled
- Idempotent: check if payment already processed before updating

**Security:**
- Webhook secret stored in env: `RAZORPAY_WEBHOOK_SECRET`
- Raw body required for signature verification (use `req.text()` not `req.json()`)
- HTTPS only

**Acceptance criteria:**
- [ ] Payment link generates and sends via WhatsApp in <3 seconds
- [ ] Webhook processes payment within 30 seconds of member paying
- [ ] Member portal shows updated "Paid" status after webhook processes
- [ ] Duplicate webhook calls are idempotent (no double payments)

---

### P1.4 — Staff Management

**Routes:**
```
GET    /api/[tenantSlug]/staff              → list staff profiles
POST   /api/[tenantSlug]/staff              → add staff (creates auth user + profile)
PUT    /api/[tenantSlug]/staff/:id          → update (role, batch assignments)
DELETE /api/[tenantSlug]/staff/:id          → remove (sets profile inactive, not deleted)
```

**Add staff flow:**
1. Create `auth.users` entry via Supabase Admin API (service role)
2. Create `profiles` row with role='staff', tenant_id
3. Send WhatsApp welcome with login link: `https://app.zenzo.in/login`
4. Staff sets own password on first login (Supabase magic link or temp password)

**Access control (RLS-enforced, not just UI):**
- Staff can SELECT members, sessions, attendance, member_milestones
- Staff can INSERT/UPDATE attendance
- Staff can INSERT member_milestones (promotions)
- Staff CANNOT SELECT/INSERT/UPDATE payments, communications_log
- Staff CANNOT access tenants UPDATE, profiles INSERT for other staff

**Acceptance criteria:**
- [ ] Staff login shows simplified nav (no Payments, Reports, Communications, Staff, Settings)
- [ ] Staff attempting to access /payments → redirected to /dashboard
- [ ] RLS test: staff user cannot query payments table directly via Supabase client

---

### P1.5 — Member Portal (Token-gated)

**Route:** `/m/[token]` (public — no auth required)
**Tabs:** Home | Attendance | Payments

**Token resolution:**
```typescript
// In page component (server-side)
const { data: tokenRow } = await supabaseService
  .from('member_portal_tokens')
  .select('member_id, tenant_id, expires_at')
  .eq('token', params.token)
  .single()

if (!tokenRow || tokenRow.expires_at < new Date()) {
  return <TokenExpiredPage />
}
```

**Token generation:**
- Generated on member creation
- Regenerated on: manual "Send portal link" action, token expiry
- Stored in `member_portal_tokens.token` (hex-encoded 32 random bytes)

**Guardian portal:**
- If `members.guardian_id` is null AND member IS a guardian of others:
  → show tab switcher: "Viewing: [Child 1 Name] | [Child 2 Name]"
  → one token per guardian, shows all their children

**Performance:**
- All data for home tab loaded in single query (no waterfalls)
- Max page weight: 100KB JS (gzipped)
- Always renders as max-width: 480px, even on desktop

**Acceptance criteria:**
- [ ] Expired token shows: "This link has expired. Contact [Business Name] for a new link."
- [ ] Home tab loads above-fold content in <1.5s on 4G
- [ ] Payment via Razorpay: success screen shows within 3s of payment
- [ ] Receipt downloadable as PDF (use browser print-to-PDF or react-pdf)
- [ ] Guardian token shows all linked children

---

### P1.6 — Milestone / Progression Module

**Conditional:** Only visible when `tenants.terminology.show_milestones = true`
**Default:** true for martial_arts, dance, music. false for gym, yoga, tuition.

**Routes:**
```
GET  /api/[tenantSlug]/milestones              → list configured milestones
POST /api/[tenantSlug]/milestones              → create milestone level
POST /api/[tenantSlug]/members/:id/milestones  → log a promotion
GET  /api/[tenantSlug]/members/:id/milestones  → member's history
```

**Promote flow:**
1. POST to member milestones → inserts `member_milestones` row
2. If WhatsApp toggle on → queues congratulations message
3. Member portal and profile both reflect new milestone immediately

**Acceptance criteria:**
- [ ] Milestone module hidden entirely if show_milestones = false (nav item, profile tab, reports)
- [ ] Terminology used: "Belt" vs "Grade" vs "Level" based on terminology config
- [ ] Promotion history shows on member profile and member portal
- [ ] WhatsApp congrats sent within 10s of promotion save

---

### P1.7 — Attendance History (Owner View)

**Route:** `/:tenantSlug/attendance/history`
**API:** `GET /api/[tenantSlug]/attendance/history?session_id=&start=&end=`

**Grid data structure:**
```typescript
{
  members: { id: string, name: string }[],
  dates: string[],                        // YYYY-MM-DD array
  records: { [memberId]: { [date]: 'present'|'absent'|'unmarked'|'no_session' } }
}
```

**"No session" logic:** if the session is not scheduled on that day_of_week → show '—'

**At-risk query:**
```sql
-- Members absent in 3+ of their last 5 scheduled sessions
```

**Acceptance criteria:**
- [ ] Grid is horizontally scrollable on mobile (not broken layout)
- [ ] Filter by session and date range, max 31 days range (UI enforced)
- [ ] At-risk section updates when filters change
- [ ] CSV export of filtered view

---

### P1.8 — Reports (Basic)

**Revenue report:** `/reports/revenue`
- Stats: collected MTD, outstanding, projected (collected + outstanding)
- Bar chart: last 6 months revenue (simple SVG or recharts — lightweight)
- Breakdown: by payment method (horizontal bars, no chart lib needed)
- Filter: date range, session
- CSV export

**Attendance report:** `/reports/attendance`
- Stats: avg rate, total sessions this month, at-risk count
- Line chart: daily attendance rate (last 30 days)
- Batch breakdown: session name + avg % (horizontal bars)
- At-risk member list with "Send reminder" quick action

**Acceptance criteria:**
- [ ] Charts render without crashing on 0-data state
- [ ] CSV export generates correct data (test with 100+ payment rows)
- [ ] Reports page accessible to owner only — staff redirect to dashboard

---

### P1.9 — WhatsApp Automation Settings

**Route:** `/:tenantSlug/settings` → Notifications tab

**Toggle settings (stored in `tenants` table or separate `tenant_settings` jsonb):**
```typescript
{
  whatsapp_payment_reminder: boolean,  // default true
  whatsapp_payment_receipt: boolean,   // default true
  whatsapp_welcome: boolean,           // default true
  whatsapp_milestone: boolean,         // default true
}
```

**Acceptance criteria:**
- [ ] Toggling off payment_receipt: no WhatsApp sent after recording payment
- [ ] Settings saved immediately (optimistic update + server confirm)

---

## P2 — Growth Phase (post 500 paying customers)

> Do not build P2 until P0+P1 are stable and generating revenue.

### P2.1 — Automated WhatsApp Reminders
- Supabase Edge Function: `send-scheduled-reminders`
- Trigger: pg_cron job, runs daily at 08:00 IST
- Logic: query members with next_due_date = today + 3 OR today, send payment_reminder template
- Per-member opt-out: `member_plans.reminder_enabled boolean default true`
- Attendance alert: query members absent in last 3+ sessions → notify owner (not member)

### P2.2 — Advanced Analytics
- Member growth report: total, new, churned, net growth trend
- Retention cohort table: join month × months retained
- At-risk scoring: low attendance (< 50%) + overdue fees = high risk
- "Send reminder to at-risk" bulk action from retention report

### P2.3 — Custom WhatsApp Templates
- Template editor UI in Settings → Notifications
- Variable picker: {member_name}, {amount}, {due_date}, etc.
- Preview with real member data
- Template submission to Interakt for WhatsApp approval (manual process)

### P2.4 — Session Pack / Drop-in Billing
- session_pack: credits decrement on each 'present' mark in attendance
- `attendance` trigger → decrement `member_plans.credits_remaining`
- "Low credits" alert when credits_remaining ≤ 2 (show in dashboard Needs Attention)
- Drop-in: payment recorded at time of marking present

### P2.5 — Trial / Enquiry CRM
- New table: `enquiries (id, tenant_id, name, phone, interested_session_id, source, status, created_at)`
- Status enum: enquiry | trial_booked | trial_done | converted | not_joined
- Enquiry list in Members → "Enquiries" tab
- Convert to member: one-click pre-fills Add Member form

### P2.6 — Offline-First Attendance
- Service Worker: cache attendance screen on first load
- IndexedDB: store pending attendance marks
- Sync on reconnect: process queue, show "X marks synced" toast
- UI indicator: "Offline — marks saved locally" banner when navigator.onLine = false

### P2.7 — Multi-location
- One auth user → multiple tenant profiles
- Tenant switcher in sidebar (profile dropdown)
- All queries already scoped by tenant_id — no schema changes needed

---

## Complete API Route Map

### Auth
```
POST /api/auth/signup                     → create user + send OTP
POST /api/auth/verify-otp                 → verify phone OTP
POST /api/auth/check-slug                 → check tenant slug availability
```

### Tenant (owner only)
```
GET  /api/[tenantSlug]/settings           → get tenant
PUT  /api/[tenantSlug]/settings           → update tenant
PUT  /api/[tenantSlug]/settings/terminology
POST /api/[tenantSlug]/settings/logo      → upload logo (multipart)
```

### Members
```
GET    /api/[tenantSlug]/members                        → list + search + filter
POST   /api/[tenantSlug]/members                        → create
GET    /api/[tenantSlug]/members/:id                    → get one (with stats)
PUT    /api/[tenantSlug]/members/:id                    → update
DELETE /api/[tenantSlug]/members/:id                    → soft delete
POST   /api/[tenantSlug]/members/import                 → bulk import
GET    /api/[tenantSlug]/members/:id/attendance         → attendance history
GET    /api/[tenantSlug]/members/:id/payments           → payment history
GET    /api/[tenantSlug]/members/:id/milestones         → milestone history
POST   /api/[tenantSlug]/members/:id/milestones         → log promotion
POST   /api/[tenantSlug]/members/:id/portal-token       → generate/refresh portal token
```

### Sessions
```
GET    /api/[tenantSlug]/sessions                       → list
POST   /api/[tenantSlug]/sessions                       → create
PUT    /api/[tenantSlug]/sessions/:id                   → update
DELETE /api/[tenantSlug]/sessions/:id                   → delete
POST   /api/[tenantSlug]/sessions/:id/members           → add member
DELETE /api/[tenantSlug]/sessions/:id/members/:memberId → remove member
GET    /api/[tenantSlug]/sessions/today                 → today's sessions (coach: own only)
```

### Attendance
```
GET  /api/[tenantSlug]/attendance/:sessionId/:date      → get marks for session+date
POST /api/[tenantSlug]/attendance                       → upsert batch marks
GET  /api/[tenantSlug]/attendance/history               → grid (owner view)
```

### Plans
```
GET    /api/[tenantSlug]/plans             → list
POST   /api/[tenantSlug]/plans             → create
PUT    /api/[tenantSlug]/plans/:id         → update
DELETE /api/[tenantSlug]/plans/:id         → delete (409 if members assigned)
```

### Payments
```
GET  /api/[tenantSlug]/payments/overdue                 → overdue list
GET  /api/[tenantSlug]/payments                         → history
POST /api/[tenantSlug]/payments                         → record manual payment
POST /api/[tenantSlug]/payments/create-order            → Razorpay order (P1)
```

### Dashboard
```
GET /api/[tenantSlug]/dashboard/stats                   → stat cards
GET /api/[tenantSlug]/dashboard/alerts                  → needs-attention items
GET /api/[tenantSlug]/dashboard/activity                → recent activity feed
```

### Communications
```
POST /api/[tenantSlug]/communications/send              → send WhatsApp
GET  /api/[tenantSlug]/communications/log               → message history
```

### Reports
```
GET /api/[tenantSlug]/reports/revenue                   → revenue data
GET /api/[tenantSlug]/reports/attendance                → attendance data
GET /api/[tenantSlug]/reports/members                   → member growth (P1)
GET /api/[tenantSlug]/reports/retention                 → retention (P1)
```

### Staff
```
GET    /api/[tenantSlug]/staff                          → list
POST   /api/[tenantSlug]/staff                          → add
PUT    /api/[tenantSlug]/staff/:id                      → update
DELETE /api/[tenantSlug]/staff/:id                      → remove
```

### Webhooks
```
POST /api/webhooks/razorpay                             → Razorpay payment events
```

### Member Portal (public)
```
GET /api/portal/[token]                                 → resolve token, get member data
GET /api/portal/[token]/attendance                      → attendance history
GET /api/portal/[token]/payments                        → payment history
GET /api/portal/[token]/receipt/:paymentId              → receipt data
```

---

## Implementation Rules (for coding agents)

### MUST follow — no exceptions

1. **Amounts always in paise.** UI shows rupees. API stores paise. Conversion in route handler.
   ```typescript
   // In API route:
   const amount_paise = Math.round(parseFloat(body.amount) * 100)
   // In UI:
   import { formatCurrency } from '@zenzo/utils'
   formatCurrency(payment.amount_paise) // → "₹1,500.00"
   ```

2. **Tenant isolation on every query.**
   ```typescript
   // WRONG:
   supabase.from('members').select('*').eq('id', memberId)
   // RIGHT:
   supabase.from('members').select('*').eq('id', memberId).eq('tenant_id', tenantId)
   ```

3. **Server Components by default.** Add `"use client"` only for:
   - Event handlers (onClick, onChange)
   - Hooks (useState, useEffect)
   - Browser APIs (navigator, window, localStorage)

4. **API routes validate tenant access.** Every route handler:
   ```typescript
   const { user } = await getUser(request)
   const profile = await getProfile(user.id)
   if (profile.tenant_id !== params.tenantSlug_resolved_to_id) return 403
   if (requiresOwner && profile.role !== 'owner') return 403
   ```

5. **Phone always stored normalised.** Strip spaces, dashes, +91 prefix before storage.
   Store as 10-digit string: `"9876543210"`, not `"+91 98765 43210"`

6. **Dates in YYYY-MM-DD for storage.** DD MMM YYYY only for display (use formatDate()).

7. **WhatsApp: always use guardian phone if member has guardian_id.**
   ```typescript
   const recipient = member.guardian_id
     ? await getMemberPhone(member.guardian_id)
     : member.phone
   ```

8. **RLS is the real access control.** UI role-hiding is UX only.
   Never query data and filter in application code when RLS can do it at DB level.

9. **Attendance optimistic UI.** Toggle → update local state → fire API in background.
   On API error → revert state + show toast.

10. **Error messages never leak internals.**
    - DB errors → log server-side, return generic message to client
    - Validation errors → specific and actionable ("Phone already registered for Arjun Kumar")
    - Never return Postgres error codes or stack traces to client

### Naming Conventions
- Database: `snake_case`
- TypeScript: `camelCase` for variables, `PascalCase` for types/interfaces/components
- API routes: kebab-case (`/api/[tenantSlug]/member-plans`)
- File names: kebab-case (`member-list.tsx`, `use-members.ts`)
- React Server Components: no suffix. Client components: `.client.tsx` suffix or `"use client"` directive

### File Structure for Features
```
apps/web/src/
  app/(dashboard)/[tenantSlug]/
    members/
      page.tsx              ← Server Component (list)
      new/page.tsx          ← Server Component (form shell)
      [id]/page.tsx         ← Server Component (profile)
      _components/          ← co-located client components
        member-list.client.tsx
        add-member-form.client.tsx
  api/
    [tenantSlug]/
      members/
        route.ts            ← GET + POST handlers
        [id]/route.ts       ← GET + PUT + DELETE handlers
```

### Supabase Client Usage
```typescript
// Server Components / Route Handlers → use SSR client
import { createServerClient } from '@supabase/ssr'

// Client Components → use browser client
import { createBrowserClient } from '@supabase/ssr'

// Service operations (webhook, admin) → use service role
import { createServiceClient } from '@zenzo/database'
```

---

## What We Are NOT Building

| Not building | Reason |
|---|---|
| Native iOS/Android app | Mobile web (PWA) covers the use case. Saves 6 months. |
| Dark mode | Not expected by target market. CSS vars ready for future. |
| Biometric/QR attendance | Fails in practice. Manual toggle builds coach-member rapport. |
| Accounting integrations | CSV export covers P1 needs. Different buyer persona. |
| Social login (Google, Apple) | Low demand in Indian market. Adds OAuth complexity. |
| AI features | Need longitudinal data. Year 2. |
| Marketplace / member discovery | Different product. |
| Video / content delivery | Out of scope. This is ops software. |

---

## How to Use This File in Dev Sessions

```
# Start every session:
"Read CLAUDE.md and FEATURES.md. We're building [feature].
 The spec is in FEATURES.md under [P0.x / P1.x].
 The screen design is in docs/design/[file].
 Start by listing the files to create/modify, then implement."

# Example:
"Read CLAUDE.md and FEATURES.md.
 We're building P0.4 — Attendance (the ritual screen).
 Screen spec: docs/design/08-screens-attendance.md.
 Implement the Take Attendance page and API route."
```

-- ─────────────────────────────────────────────────────────────────────────────
-- Zenzo — Initial Schema Migration
-- File: supabase/migrations/20260324000000_initial_schema.sql
--
-- HOW TO RUN:
--   Option A (Supabase CLI):  supabase db push
--   Option B (SQL Editor):    paste this entire file into Supabase Dashboard → SQL Editor
--
-- HOW TO UPDATE:
--   For schema changes, create a NEW migration file:
--   supabase/migrations/YYYYMMDDHHMMSS_description.sql
--   Never edit this file after it has been applied to production.
--
-- STRUCTURE:
--   Part 1 — Enums
--   Part 2 — Tables + indexes (NO policies yet — avoids circular dependency)
--   Part 3 — RLS enable + all policies (after all tables exist)
--   Part 4 — Functions + triggers
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1 — ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

create type user_role as enum ('owner', 'staff', 'member');
create type session_type as enum ('group', 'one_on_one');
create type day_of_week as enum ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
create type member_status as enum ('active', 'inactive', 'suspended');
create type gender_type as enum ('male', 'female', 'other');
create type attendance_status as enum ('present', 'absent', 'unmarked');
create type billing_type as enum (
  'monthly', 'quarterly', 'half_yearly', 'annual',
  'per_session', 'session_pack', 'term', 'drop_in'
);
create type payment_method as enum ('cash', 'upi', 'bank_transfer', 'online', 'other');
create type payment_status as enum ('completed', 'pending', 'failed', 'refunded');
create type milestone_type as enum ('ordered_sequence', 'exam_based', 'free_form');
create type comm_type as enum (
  'payment_reminder', 'payment_receipt', 'welcome',
  'milestone_congrats', 'attendance_alert', 'custom'
);
create type comm_status as enum ('queued', 'sent', 'delivered', 'failed');


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2 — TABLES + INDEXES
-- No RLS policies here. Policies come in Part 3 after all tables exist.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── tenants ──────────────────────────────────────────────────────────────────

create table tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  business_type text not null default 'gym',
  city          text,
  phone         text,
  logo_url      text,
  terminology   jsonb not null default '{
    "member": "Member",
    "session": "Batch",
    "instructor": "Coach",
    "milestone": "Belt",
    "show_milestones": true
  }'::jsonb,
  plan          text not null default 'trial',
  created_at    timestamptz default now()
);


-- ── profiles ─────────────────────────────────────────────────────────────────
-- tenant_id nullable: null during onboarding before tenant is created.

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references tenants(id) on delete cascade,
  role       user_role not null default 'owner',
  full_name  text not null,
  phone      text,
  email      text,
  avatar_url text,
  created_at timestamptz default now()
);

create index on profiles(tenant_id);
create index on profiles(tenant_id, role);


-- ── sessions ─────────────────────────────────────────────────────────────────

create table sessions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text not null,
  session_type  session_type not null default 'group',
  start_time    time not null,
  end_time      time not null,
  days          day_of_week[] not null,
  instructor_id uuid references profiles(id) on delete set null,
  max_capacity  int,
  is_active     boolean not null default true,
  created_at    timestamptz default now()
);

create index on sessions(tenant_id);
create index on sessions(tenant_id, is_active);
create index on sessions(instructor_id);


-- ── members ──────────────────────────────────────────────────────────────────
-- guardian_id is a self-reference: child members point to their parent member.

create table members (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  profile_id              uuid references profiles(id) on delete set null,
  guardian_id             uuid references members(id) on delete set null,
  full_name               text not null,
  phone                   text,
  email                   text,
  date_of_birth           date,
  gender                  gender_type,
  emergency_contact_name  text,
  emergency_contact_phone text,
  status                  member_status not null default 'active',
  joined_at               date not null default current_date,
  notes                   text,
  photo_url               text,
  created_at              timestamptz default now(),

  constraint members_phone_tenant_unique unique (tenant_id, phone)
);

create index on members(tenant_id);
create index on members(tenant_id, status);
create index on members(guardian_id);
create index on members(profile_id);


-- ── member_sessions ───────────────────────────────────────────────────────────

create table member_sessions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  joined_at  date not null default current_date,

  unique(member_id, session_id)
);

create index on member_sessions(session_id);
create index on member_sessions(member_id);
create index on member_sessions(tenant_id);


-- ── attendance ────────────────────────────────────────────────────────────────

create table attendance (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  date       date not null,
  status     attendance_status not null default 'unmarked',
  marked_by  uuid references profiles(id) on delete set null,
  marked_at  timestamptz,
  created_at timestamptz default now(),

  unique(member_id, session_id, date)
);

create index on attendance(tenant_id, date);
create index on attendance(member_id);
create index on attendance(session_id, date);
create index on attendance(tenant_id, session_id, date);


-- ── plans ─────────────────────────────────────────────────────────────────────

create table plans (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  billing_type    billing_type not null default 'monthly',
  amount_paise    int not null check (amount_paise >= 0),
  session_credits int,
  duration_days   int,
  description     text,
  is_active       boolean not null default true,
  created_at      timestamptz default now()
);

create index on plans(tenant_id);
create index on plans(tenant_id, is_active);


-- ── member_plans ──────────────────────────────────────────────────────────────

create table member_plans (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  member_id         uuid not null references members(id) on delete cascade,
  plan_id           uuid not null references plans(id),
  start_date        date not null,
  end_date          date,
  next_due_date     date,
  credits_remaining int,
  is_active         boolean not null default true,
  created_at        timestamptz default now()
);

create index on member_plans(member_id);
create index on member_plans(tenant_id, is_active);
create index on member_plans(tenant_id, next_due_date);


-- ── payments ──────────────────────────────────────────────────────────────────

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  member_id           uuid not null references members(id) on delete cascade,
  member_plan_id      uuid references member_plans(id),
  amount_paise        int not null check (amount_paise > 0),
  payment_method      payment_method not null,
  payment_status      payment_status not null default 'completed',
  payment_date        date not null default current_date,
  reference           text,
  razorpay_order_id   text,
  razorpay_payment_id text,
  notes               text,
  receipt_sent        boolean not null default false,
  recorded_by         uuid references profiles(id) on delete set null,
  created_at          timestamptz default now()
);

create index on payments(tenant_id, payment_date desc);
create index on payments(member_id);
create index on payments(tenant_id, payment_status);
create index on payments(razorpay_order_id);


-- ── milestones ────────────────────────────────────────────────────────────────

create table milestones (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  name           text not null,
  level_order    int not null default 0,
  color_hex      text,
  milestone_type milestone_type not null default 'ordered_sequence',
  created_at     timestamptz default now()
);

create index on milestones(tenant_id, level_order);


-- ── member_milestones ─────────────────────────────────────────────────────────

create table member_milestones (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  member_id    uuid not null references members(id) on delete cascade,
  milestone_id uuid not null references milestones(id) on delete cascade,
  achieved_at  date not null default current_date,
  notes        text,
  promoted_by  uuid references profiles(id) on delete set null,
  created_at   timestamptz default now()
);

create index on member_milestones(member_id);
create index on member_milestones(tenant_id, achieved_at desc);


-- ── member_portal_tokens ──────────────────────────────────────────────────────
-- No RLS — token IS the auth. Accessed via service role key only.

create table member_portal_tokens (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  token      text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz default now()
);

create index on member_portal_tokens(token);
create index on member_portal_tokens(member_id);


-- ── communications_log ────────────────────────────────────────────────────────

create table communications_log (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  member_id       uuid references members(id) on delete set null,
  phone           text not null,
  comm_type       comm_type not null,
  message_body    text not null,
  status          comm_status not null default 'queued',
  interakt_msg_id text,
  error_reason    text,
  sent_at         timestamptz,
  created_at      timestamptz default now()
);

create index on communications_log(tenant_id, created_at desc);
create index on communications_log(member_id);
create index on communications_log(tenant_id, comm_type);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3 — RLS POLICIES
-- All tables exist now. Safe to reference any table in any policy.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table tenants             enable row level security;
alter table profiles            enable row level security;
alter table sessions            enable row level security;
alter table members             enable row level security;
alter table member_sessions     enable row level security;
alter table attendance          enable row level security;
alter table plans               enable row level security;
alter table member_plans        enable row level security;
alter table payments            enable row level security;
alter table milestones          enable row level security;
alter table member_milestones   enable row level security;
alter table communications_log  enable row level security;
-- member_portal_tokens: no RLS (token-based auth via service role)


-- ── tenants policies ──────────────────────────────────────────────────────────

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

-- Allow insert during onboarding (user creates their tenant)
create policy "authenticated users can create tenant"
  on tenants for insert
  with check (auth.uid() is not null);


-- ── profiles policies ─────────────────────────────────────────────────────────

create policy "users can read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "users can read profiles in own tenant"
  on profiles for select
  using (
    tenant_id is not null and
    tenant_id in (select tenant_id from profiles where id = auth.uid())
  );

create policy "users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "owner can insert staff profiles"
  on profiles for insert
  with check (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid() and role = 'owner'
    )
  );

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "owner can update profiles in own tenant"
  on profiles for update
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid() and role = 'owner'
    )
  );


-- ── sessions policies ─────────────────────────────────────────────────────────

create policy "tenant members can read sessions"
  on sessions for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid()
  ));

create policy "owner/staff can manage sessions"
  on sessions for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));


-- ── members policies ──────────────────────────────────────────────────────────

create policy "owner/staff can manage members"
  on members for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own record"
  on members for select
  using (profile_id = auth.uid());


-- ── member_sessions policies ──────────────────────────────────────────────────

create policy "owner/staff can manage member_sessions"
  on member_sessions for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own enrollments"
  on member_sessions for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));


-- ── attendance policies ───────────────────────────────────────────────────────

create policy "owner/staff can manage attendance"
  on attendance for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own attendance"
  on attendance for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));


-- ── plans policies ────────────────────────────────────────────────────────────

create policy "tenant members can read plans"
  on plans for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid()
  ));

create policy "owner can manage plans"
  on plans for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));


-- ── member_plans policies ─────────────────────────────────────────────────────

create policy "owner/staff can manage member_plans"
  on member_plans for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own plan"
  on member_plans for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));


-- ── payments policies ─────────────────────────────────────────────────────────

create policy "owner can manage payments"
  on payments for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));

create policy "staff can read payments"
  on payments for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "staff can insert payments"
  on payments for insert
  with check (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own payments"
  on payments for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));


-- ── milestones policies ───────────────────────────────────────────────────────

create policy "tenant members can read milestones"
  on milestones for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid()
  ));

create policy "owner can manage milestones"
  on milestones for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));


-- ── member_milestones policies ────────────────────────────────────────────────

create policy "owner/staff can manage member_milestones"
  on member_milestones for all
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));

create policy "member can read own milestones"
  on member_milestones for select
  using (member_id in (
    select id from members where profile_id = auth.uid()
  ));


-- ── communications_log policies ───────────────────────────────────────────────

create policy "owner can read comms log"
  on communications_log for select
  using (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role = 'owner'
  ));

create policy "owner/staff can insert comms log"
  on communications_log for insert
  with check (tenant_id in (
    select tenant_id from profiles where id = auth.uid() and role in ('owner', 'staff')
  ));


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4 — FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── handle_new_user ───────────────────────────────────────────────────────────
-- Auto-creates a profiles row when a user signs up via Supabase Auth.
-- tenant_id is null here — filled in during onboarding step 2.
-- full_name must be passed as metadata at signUp: { data: { full_name: "..." } }

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, tenant_id, role, full_name, phone, email)
  values (
    new.id,
    null,
    'owner',
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.phone,
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── slugify ───────────────────────────────────────────────────────────────────
-- "Ravi's Fitness Center!" → 'ravis-fitness-center'
-- Used by onboarding API to auto-generate and validate tenant slugs.

create or replace function slugify(input text)
returns text
language sql
immutable strict
as $$
  select regexp_replace(
    regexp_replace(
      lower(trim(input)),
      '[^a-z0-9\s-]', '', 'g'
    ),
    '[\s-]+', '-', 'g'
  );
$$;


-- ── expire_member_plans ───────────────────────────────────────────────────────
-- Marks member_plans inactive when end_date has passed.
-- Run daily via Supabase cron (Dashboard → Database → Extensions → pg_cron):
--   select cron.schedule('expire-plans', '0 0 * * *', 'select expire_member_plans()');

create or replace function expire_member_plans()
returns void
language sql
as $$
  update member_plans
  set is_active = false
  where is_active = true
    and end_date is not null
    and end_date < current_date;
$$;

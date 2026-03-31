-- ─────────────────────────────────────────────────────────────────────────────
-- Zenzo — New Schema Migration (Option A: full replace)
-- File: supabase/migrations/20260328000001_new_schema.sql
--
-- Drops the old tenant/profiles schema entirely and creates the new
-- two-sided platform schema (clubs, club_staff, users, memberships, etc.)
--
-- HOW TO APPLY (fresh start):
--   supabase db reset          ← wipes DB, runs all migrations in order
--   — OR —
--   supabase db push           ← applies only unapplied migrations
--
-- STRUCTURE:
--   Part 0 — Drop old schema
--   Part 1 — Enums
--   Part 2 — Tables + indexes
--   Part 3 — RLS enable + policies
--   Part 4 — Functions + triggers
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 0 — DROP OLD SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Triggers first (reference functions)
drop trigger if exists on_auth_user_created on auth.users;

-- Functions
drop function if exists handle_new_user();
drop function if exists slugify(text);
drop function if exists expire_member_plans();

-- Tables: leaf → root (cascade handles FK deps)
drop table if exists communications_log    cascade;
drop table if exists member_milestones     cascade;
drop table if exists member_portal_tokens  cascade;
drop table if exists member_plans          cascade;
drop table if exists payments              cascade;
drop table if exists attendance            cascade;
drop table if exists member_sessions       cascade;
drop table if exists members               cascade;
drop table if exists plans                 cascade;
drop table if exists milestones            cascade;
drop table if exists sessions              cascade;
drop table if exists profiles              cascade;
drop table if exists tenants               cascade;

-- Old enums (drop individually — CASCADE not supported on types)
drop type if exists user_role;
drop type if exists session_type;
drop type if exists day_of_week;
drop type if exists member_status;
drop type if exists gender_type;
drop type if exists attendance_status;
drop type if exists billing_type;
drop type if exists payment_method;
drop type if exists payment_status;
drop type if exists milestone_type;
drop type if exists comm_type;
drop type if exists comm_status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1 — ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

create type staff_role as enum ('owner', 'coach');

create type membership_status as enum (
  'pending_invite',
  'active',
  'overdue',
  'expired'
);

create type billing_cycle as enum (
  'monthly',
  'quarterly',
  'half_yearly',
  'annual',
  'per_session'
);

create type payment_method as enum ('cash', 'upi', 'bank', 'other');

create type club_category as enum (
  'gym',
  'martial_arts',
  'dance',
  'yoga',
  'other'
);

create type verification_status as enum ('pending', 'verified', 'rejected');

create type day_of_week as enum (
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
);

create type attendance_status as enum ('present', 'absent', 'unmarked');


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2 — TABLES + INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── users ─────────────────────────────────────────────────────────────────────
-- Every person on Zenzo has exactly one users row (id = auth.users.id).

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  email         text not null,
  auth_provider text not null default 'email',
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);


-- ── clubs ─────────────────────────────────────────────────────────────────────

create table clubs (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  business_type       club_category not null default 'gym',
  city                text,
  phone               text,
  logo_url            text,
  terminology         jsonb not null default '{
    "member":         "Member",
    "batch":          "Batch",
    "coach":          "Coach",
    "level":          "Belt",
    "show_levels":    true
  }'::jsonb,
  owner_id            uuid not null references users(id) on delete restrict,
  verification_status verification_status not null default 'pending',
  listed              boolean not null default false,
  created_at          timestamptz not null default now()
);

create index on clubs(owner_id);
create index on clubs(slug);


-- ── club_staff ────────────────────────────────────────────────────────────────
-- Tracks who can access a club's dashboard and in what role.
-- One user can appear multiple times (owner of club A, coach at club B).

create table club_staff (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references clubs(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       staff_role not null,
  created_at timestamptz not null default now(),

  unique(club_id, user_id)
);

create index on club_staff(club_id);
create index on club_staff(user_id);
create index on club_staff(club_id, role);


-- ── fee_plans ─────────────────────────────────────────────────────────────────
-- Defined before club_memberships because memberships reference it.

create table fee_plans (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  name          text not null,
  amount_paise  int not null check (amount_paise >= 0),
  billing_cycle billing_cycle not null default 'monthly',
  created_at    timestamptz not null default now()
);

create index on fee_plans(club_id);


-- ── club_memberships ──────────────────────────────────────────────────────────
-- Represents a person's membership at a club.
-- status = pending_invite until the invited person signs up on Zenzo.

create table club_memberships (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  plan_id       uuid references fee_plans(id) on delete set null,
  status        membership_status not null default 'pending_invite',
  joined_at     timestamptz not null default now(),
  next_due_date date,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),

  unique(club_id, user_id)
);

create index on club_memberships(club_id);
create index on club_memberships(user_id);
create index on club_memberships(club_id, status);
create index on club_memberships(club_id, next_due_date);


-- ── batches ───────────────────────────────────────────────────────────────────

create table batches (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references clubs(id) on delete cascade,
  name         text not null,
  start_time   time not null,
  end_time     time not null,
  days         day_of_week[] not null,
  coach_id     uuid references users(id) on delete set null,
  max_capacity int,
  description  text,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index on batches(club_id);
create index on batches(coach_id);
create index on batches(club_id, deleted_at);


-- ── member_batches ────────────────────────────────────────────────────────────
-- Many-to-many: which memberships are enrolled in which batches.

create table member_batches (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references club_memberships(id) on delete cascade,
  batch_id      uuid not null references batches(id) on delete cascade,
  created_at    timestamptz not null default now(),

  unique(membership_id, batch_id)
);

create index on member_batches(membership_id);
create index on member_batches(batch_id);


-- ── attendance_records ────────────────────────────────────────────────────────

create table attendance_records (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references club_memberships(id) on delete cascade,
  batch_id      uuid not null references batches(id) on delete cascade,
  date          date not null,
  status        attendance_status not null default 'unmarked',
  marked_by     uuid references users(id) on delete set null,
  is_drop_in    boolean not null default false,
  created_at    timestamptz not null default now(),

  unique(membership_id, batch_id, date)
);

create index on attendance_records(membership_id);
create index on attendance_records(batch_id, date);
create index on attendance_records(batch_id, date, status);


-- ── payments ──────────────────────────────────────────────────────────────────

create table payments (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references club_memberships(id) on delete cascade,
  amount_paise  int not null check (amount_paise > 0),
  method        payment_method not null,
  payment_date  date not null default current_date,
  reference     text,
  note          text,
  recorded_by   uuid not null references users(id) on delete restrict,
  created_at    timestamptz not null default now()
);

create index on payments(membership_id);
create index on payments(membership_id, payment_date desc);
create index on payments(recorded_by);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3 — RLS ENABLE + POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

alter table users             enable row level security;
alter table clubs             enable row level security;
alter table club_staff        enable row level security;
alter table fee_plans         enable row level security;
alter table club_memberships  enable row level security;
alter table batches           enable row level security;
alter table member_batches    enable row level security;
alter table attendance_records enable row level security;
alter table payments          enable row level security;


-- ── users ─────────────────────────────────────────────────────────────────────

create policy "users: read own row"
  on users for select
  using (id = auth.uid());

create policy "users: update own row"
  on users for update
  using (id = auth.uid());


-- ── clubs ─────────────────────────────────────────────────────────────────────

create policy "clubs: staff can read their club"
  on clubs for select
  using (id in (
    select club_id from club_staff where user_id = auth.uid()
  ));

create policy "clubs: owner can update their club"
  on clubs for update
  using (id in (
    select club_id from club_staff
    where user_id = auth.uid() and role = 'owner'
  ));

-- Needed during onboarding wizard (Step 3: Studio Setup)
create policy "clubs: authenticated users can create"
  on clubs for insert
  with check (auth.uid() is not null);


-- ── club_staff ────────────────────────────────────────────────────────────────

create policy "club_staff: staff can read all staff in their club"
  on club_staff for select
  using (club_id in (
    select club_id from club_staff where user_id = auth.uid()
  ));

create policy "club_staff: owner can manage staff"
  on club_staff for all
  using (club_id in (
    select club_id from club_staff
    where user_id = auth.uid() and role = 'owner'
  ));

-- Needed during onboarding (owner row is inserted after club is created)
create policy "club_staff: authenticated users can insert"
  on club_staff for insert
  with check (auth.uid() is not null);


-- ── fee_plans ─────────────────────────────────────────────────────────────────

create policy "fee_plans: staff can read"
  on fee_plans for select
  using (club_id in (
    select club_id from club_staff where user_id = auth.uid()
  ));

create policy "fee_plans: owner can manage"
  on fee_plans for all
  using (club_id in (
    select club_id from club_staff
    where user_id = auth.uid() and role = 'owner'
  ));


-- ── club_memberships ──────────────────────────────────────────────────────────

create policy "club_memberships: staff can manage"
  on club_memberships for all
  using (club_id in (
    select club_id from club_staff where user_id = auth.uid()
  ));

create policy "club_memberships: member can read own"
  on club_memberships for select
  using (user_id = auth.uid());


-- ── batches ───────────────────────────────────────────────────────────────────

create policy "batches: staff can read"
  on batches for select
  using (club_id in (
    select club_id from club_staff where user_id = auth.uid()
  ));

create policy "batches: owner can manage"
  on batches for all
  using (club_id in (
    select club_id from club_staff
    where user_id = auth.uid() and role = 'owner'
  ));

create policy "batches: coach can manage their assigned batches"
  on batches for update
  using (
    coach_id = auth.uid()
    and club_id in (
      select club_id from club_staff where user_id = auth.uid()
    )
  );


-- ── member_batches ────────────────────────────────────────────────────────────

create policy "member_batches: staff can manage"
  on member_batches for all
  using (
    membership_id in (
      select cm.id from club_memberships cm
      join club_staff cs on cs.club_id = cm.club_id
      where cs.user_id = auth.uid()
    )
  );

create policy "member_batches: member can read own"
  on member_batches for select
  using (
    membership_id in (
      select id from club_memberships where user_id = auth.uid()
    )
  );


-- ── attendance_records ────────────────────────────────────────────────────────

create policy "attendance_records: staff can manage"
  on attendance_records for all
  using (
    batch_id in (
      select b.id from batches b
      join club_staff cs on cs.club_id = b.club_id
      where cs.user_id = auth.uid()
    )
  );

create policy "attendance_records: member can read own"
  on attendance_records for select
  using (
    membership_id in (
      select id from club_memberships where user_id = auth.uid()
    )
  );


-- ── payments ──────────────────────────────────────────────────────────────────

create policy "payments: owner can manage"
  on payments for all
  using (
    membership_id in (
      select cm.id from club_memberships cm
      join club_staff cs on cs.club_id = cm.club_id
      where cs.user_id = auth.uid() and cs.role = 'owner'
    )
  );

create policy "payments: coach can read"
  on payments for select
  using (
    membership_id in (
      select cm.id from club_memberships cm
      join club_staff cs on cs.club_id = cm.club_id
      where cs.user_id = auth.uid()
    )
  );

create policy "payments: member can read own"
  on payments for select
  using (
    membership_id in (
      select id from club_memberships where user_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4 — FUNCTIONS + TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── handle_new_user ───────────────────────────────────────────────────────────
-- Auto-creates a users row when someone signs up via Supabase Auth.
-- Requires signup to pass metadata: { data: { full_name: "...", phone: "..." } }

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into users (id, full_name, phone, email, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'auth_provider', 'email')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── slugify ───────────────────────────────────────────────────────────────────
-- "Ravi's Fitness Center!" → 'ravis-fitness-center'
-- Used by onboarding API to auto-generate club slugs.

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


-- ── transition_overdue_memberships ────────────────────────────────────────────
-- active → overdue when next_due_date has passed.
-- Run daily via pg_cron:
--   select cron.schedule(
--     'transition-overdue',
--     '0 1 * * *',
--     'select transition_overdue_memberships()'
--   );

create or replace function transition_overdue_memberships()
returns void
language sql
as $$
  update club_memberships
  set status = 'overdue'
  where status = 'active'
    and next_due_date is not null
    and next_due_date < current_date;
$$;

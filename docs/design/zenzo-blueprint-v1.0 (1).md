# Zenzo — Product Blueprint v1.0
*Source of truth for implementation. Every feature, every flow, every edge case.*
*Locked: March 2026. All decisions finalized.*

---

# Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Identity](#2-authentication--identity)
3. [Club Onboarding](#3-club-onboarding)
4. [Multi-Club Architecture](#4-multi-club-architecture)
5. [Member Management](#5-member-management)
6. [Batch Management](#6-batch-management)
7. [Attendance System](#7-attendance-system)
8. [Fee Plans & Billing](#8-fee-plans--billing)
9. [Payments](#9-payments)
10. [Notifications](#10-notifications)
11. [Belt / Level Progression](#11-belt--level-progression)
12. [Dashboard](#12-dashboard)
13. [Reports](#13-reports)
14. [Settings](#14-settings)
15. [Member Portal](#15-member-portal)
16. [Public Club Listing](#16-public-club-listing)
17. [Zenzo Admin Panel](#17-zenzo-admin-panel)
18. [Data Model](#18-data-model)
19. [Revenue Model](#19-revenue-model)
20. [Build Order & Phases](#20-build-order--phases)
21. [Decisions Log](#21-decisions-log)

---

# 1. Architecture Overview

## Stack
| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| Auth | Supabase Auth (phone OTP via Interakt WhatsApp, Google Sign-In) |
| Database | Supabase (Postgres + Row Level Security) |
| Payments | Razorpay (direct to club account in Phase 1) |
| WhatsApp | Interakt API |
| Email | TBD (Resend / Postmark / SES) |
| Push Notifications | TBD (Firebase Cloud Messaging recommended) |
| Hosting | Vercel |
| Language | English only (Phase 1) |

## Repo Structure
```
apps/
  web/                → Club-facing web app (Next.js 14)
  admin/              → Zenzo internal admin panel (simple)
packages/
  database/           → Supabase client, DB types, migrations
  ui/                 → Shared React components (Shadcn/UI based)
  utils/              → formatCurrency, formatDate, slugify, etc.
  config/             → Shared tsconfig
docs/
  design/             → UI/UX specs (16 files)
  blueprint.md        → This file
```

## Multi-Tenant Model
- Each club is a tenant, scoped by `club_id`
- URL structure: `/:clubSlug/*` (e.g., `/ravis-fitness/dashboard`)
- Row Level Security (RLS) enforces data isolation at the database level
- One owner can own multiple clubs, each completely separate

## Key Conventions
- All monetary amounts stored in **paise** (₹1 = 100 paise). Display uses `formatCurrency()`.
- Dates stored as UTC. Displayed in IST (Asia/Kolkata) for Phase 1.
- Date format: `DD MMM YYYY` (e.g., 23 Mar 2026)
- Time format: 12-hour (e.g., 6:00 AM)
- Phone numbers stored with country code (+91)
- Server Components by default. `"use client"` only when needed.

---

# 2. Authentication & Identity

## Core Principle
**One Zenzo account for everyone.** Whether you're an owner, coach, or member — you have one `users` row. Your role is determined by your relationship with a club, not your account type.

## Signup Flow

### Step 1: Create Account
```
Fields:
  - Full Name (required)
  - Phone Number (required, +91 default)
  - Email (required)
  - Password (required, min 8 characters)

Validation:
  - Phone: unique check against existing users
  - Email: format validation
  - Password: min 8 characters, shown with toggle visibility

On submit:
  - WhatsApp OTP sent via Interakt to the phone number
  - Modal appears with 6-digit OTP input
  - 3 retry attempts, then cooldown (60 seconds)
  - OTP valid for 5 minutes
```

### Step 2: OTP Verification
```
- 6-digit code sent via WhatsApp (Interakt API)
- User enters code in modal
- On success: account created in Supabase Auth + users table
- On failure: "Invalid code. Please try again." (max 3 attempts)
- Resend: available after 60 seconds
- If WhatsApp delivery fails: fall back to SMS (future) or show error
```

### Step 3: Post-Signup Routing
```
After successful signup, the system checks:

1. Was this signup triggered by a club invite link?
   → Yes: Create club_membership, redirect to member portal
   → No: Continue to step 2

2. Is this person signing up as a club owner?
   → Yes: Redirect to Club Onboarding Wizard (Section 3)
   → No: Redirect to consumer home (Phase 2) or landing page
```

## Login Flow
```
Fields:
  - Phone or Email (single field, auto-detect format)
  - Password
  
On submit:
  - Supabase Auth sign-in
  - On success: check user's roles
    → Has club_staff (owner) relationship? → Redirect to club dashboard
    → Has club_staff across multiple clubs? → Show club switcher, then dashboard
    → Has club_membership only? → Redirect to member portal
    → No relationships? → Redirect to consumer home / landing
  - On failure: "Invalid credentials" (generic, no hint about which field)
```

## Forgot Password
```
- Enter email
- Supabase sends password reset link via email
- Reset link valid for 1 hour
- New password: min 8 characters
- On success: redirect to login
```

## Auth Provider: Supabase Auth
```
- Phone OTP: via Interakt WhatsApp API (custom provider)
- Google Sign-In: Supabase built-in OAuth
- Session: JWT stored in httpOnly cookie
- Session duration: 7 days (refresh on activity)
- Middleware: apps/web/src/middleware.ts validates session on every request
```

## Google Sign-In (Phase 2 — Consumer App)
```
- Available alongside Phone OTP for consumer signup
- On first Google sign-in: create users row with Google profile data
- Phone number collection: prompted after first Google sign-in (required for WhatsApp notifications)
- Account linking: if a Google email matches an existing email, link accounts
```

---

# 3. Club Onboarding

## Who Goes Through This
Only users creating a new club. Members and coaches skip this entirely — they sign up and are linked to an existing club.

## Wizard Steps

### Step 1: Credentials (already completed — signup form above)

### Step 2: Business Type
```
Card grid selection:
  🏋️ Gym / Fitness
  🥋 Martial Arts / Combat
  💃 Dance / Performing Arts
  🧘 Yoga / Wellness
  📦 Other (free-text field appears)

On selection:
  - Auto-configures terminology:
    Gym → Members, Batches, (no progression)
    Martial Arts → Students, Batches, Belts
    Dance → Students, Classes, Levels/Grades
    Yoga → Members, Sessions, (no progression)
  - Sets progression module visibility (on for martial arts + dance, off for gym + yoga)
  - Pre-loads belt/level order for the business type (see Section 11)
  - All configurable later in Settings

Mobile: 2-column card grid
Desktop: 3-column card grid
```

### Step 3: Studio Setup
```
Fields:
  - Business Name (required) → e.g., "Ravi's Fitness Hub"
  - URL Slug (auto-generated from name, editable) → ravis-fitness
    - Real-time availability check
    - Allowed: lowercase letters, numbers, hyphens
    - Min 3 chars, max 40 chars
  - City (required, dropdown with search) → Hyderabad
  - Business Phone (pre-filled from signup, editable)

On submit:
  - Creates club row in database
  - Creates club_staff row (role: owner) linking user to club
  - Club is NOT listed publicly (verification_status: pending)
  - Club can use ALL management tools immediately
```

### Step 4: Create First Batch (skippable)
```
Pre-filled suggestion: "Morning Batch, 6:00–7:30 AM, Mon–Fri"

Fields:
  - Batch Name (required)
  - Start Time / End Time (30-min increment pickers)
  - Days (pill toggles: M T W T F S S — Mon–Fri pre-selected)

Skip: "Skip for now →" always available
On submit: Creates batch, advances to Step 5
```

### Step 5: Invite First Members (skippable)
```
Quick invite form:
  - Phone Number field
  - [Send Invite] button
  
Each invite:
  - Sends WhatsApp message with Zenzo signup link
  - Invited member appears in a list below: "Arjun Kumar — Invited ✓"
  - Status: Invited (pending signup)

Bulk option: "Import from CSV" → uploads phone numbers, sends invites to all

Skip: "Skip for now →" always available
Primary CTA: "Go to Dashboard →" (celebration moment)
```

### Post-Onboarding
```
- Redirect to /:clubSlug/dashboard
- First-time dashboard shows contextual tooltip overlays (dismissible):
  - "This is your daily digest — check it every morning"
  - "Start by adding more members"
  - "Set up your fee plans in Settings"
- Verification photo prompt: banner at top — "Upload a photo of your premises to get listed on Zenzo"
```

---

# 4. Multi-Club Architecture

## How It Works
- One owner can create multiple clubs (branches)
- Each club is **completely separate**: own members, batches, plans, payments, reports
- Exception: **coaches can be shared** across clubs owned by the same owner

## Club Switcher
```
Location: Sidebar footer (desktop), accessible from "More" menu (mobile)
Shows: List of clubs the user has a role in
Format: Club name + role badge (Owner / Coach)
Switching: Navigates to /:newClubSlug/dashboard
```

## Creating Additional Clubs
```
Location: Club switcher dropdown → "+ Create New Club"
Flow: Abbreviated onboarding — Steps 2-3 only (business type + studio setup)
No re-verification of identity needed
New club starts with verification_status: pending (needs its own premises photo)
```

## Shared Coaches
```
- Owner of Club A and Club B can assign the same coach to batches in both clubs
- Coach's club switcher shows both clubs
- Coach sees only the batches they're assigned to in each club
- Attendance, members, and data are still completely separate per club

Implementation:
  - club_staff table allows same user_id with different club_ids
  - Coach is added to each club separately via phone number
  - If coach already has Zenzo account, linking is automatic
```

## Data Isolation
```
- RLS policies: every query scoped by club_id
- No cross-club queries except for the club switcher itself
- Reports, dashboards, member lists — all per-club
- A member at Club A is invisible to Club B even if same owner
```

---

# 5. Member Management

## Core Principle
**Every member must have a Zenzo account.** No shadow users, no placeholder records. The club invites people, and membership activates only after they sign up on Zenzo.

## Invite Member Flow

### Single Invite
```
Screen: Members → [+ Invite Member]

Fields:
  - Phone Number (required, +91 prefix)
  - Name (optional — helpful for owner's reference while invite is pending)

On submit:
  1. Check if phone number already has a Zenzo account
     → YES + already a member of THIS club: Error "This person is already a member"
     → YES + not a member of this club: Create club_membership (status: active), 
       send WhatsApp "You've been added to [Club Name] on Zenzo"
     → NO: Send WhatsApp invite with signup link, create club_membership (status: pending_invite)
  
  2. WhatsApp message:
     "Hi! [Owner Name] has invited you to join [Club Name] on Zenzo.
      Sign up here to get started: [signup link with invite token]"
  
  3. Invite token encodes: club_id + phone number + expiry (30 days)

Post-signup:
  - When invited person completes Zenzo signup, their club_membership status changes from pending_invite → active
  - Owner sees status change in member list
  - Welcome WhatsApp sent automatically (if enabled in Settings)
```

### Bulk Invite
```
Screen: Members → [+ Invite Member] → "Bulk Invite" tab

Upload: CSV or Excel file
Required columns: Phone Number
Optional columns: Name, Email

Process:
  1. Parse file, validate phone numbers (10-digit Indian format)
  2. Preview table:
     "45 valid invites, 3 duplicates (already members), 2 invalid numbers"
  3. Owner confirms → sends WhatsApp invites to all valid numbers
  4. Progress bar during send
  5. Results: "42 invites sent, 3 already members (skipped), 2 failed (invalid numbers)"

Post-upload dashboard:
  - Pending invites list with status: Sent, Joined, Expired
  - Resend option for individual pending invites
```

## Member List
```
URL: /:clubSlug/members

Layout:
  Desktop: Data table with columns — Name, Phone, Batch(es), Status, Plan, Fee Amount
  Mobile: Card list (name, status badge, batch, fee info)

Filters:
  - Status: All, Active, Overdue, Expired, Pending Invite (default: All)
  - Batch: dropdown of all batches (multi-select)
  - Plan: dropdown of all fee plans

Search: Instant filter on name or phone, debounced 300ms

Sort options:
  - Name (A-Z) — default
  - Join date (newest first)
  - Last attendance (most recent first)

Pagination: 25 per page (desktop), infinite scroll (mobile)

Row actions (desktop — three-dot menu):
  - View Profile
  - Edit
  - Assign to Batch
  - Send WhatsApp
  - Delete

Row actions (mobile):
  - Tap card → Member Profile
  - Long-press → action sheet with above options

Bulk actions (when checkboxes selected):
  Sticky bar: "3 selected — [Send Reminder] [Assign Batch] [Delete]"
```

## Member Status Lifecycle
```
pending_invite → active → overdue → expired
                    ↑                   │
                    └───────────────────┘ (renews/pays)

States:
  pending_invite: Invited but hasn't signed up on Zenzo yet
  active: Signed up, membership current, no overdue payments
  overdue: Payment due date has passed, not yet paid
  expired: Plan period ended + grace period passed (auto-calculated)
  
Transitions:
  pending_invite → active: Person completes Zenzo signup via invite link
  active → overdue: Payment due date passes without payment recorded
  overdue → active: Payment recorded (manual or online)
  overdue → expired: Plan period + grace period ends without payment
  expired → active: New payment recorded (reactivates membership)

Grace period: 7 days after plan period ends before auto-expiry
```

## Member Profile
```
URL: /:clubSlug/members/:memberId

Header:
  - Avatar (initials fallback, pastel bg from name hash)
  - Name, phone, email
  - Status badge (Active/Overdue/Expired)
  - Batch(es) listed
  - Plan name + amount
  - "Member since" date

Tabs:
  Overview | Attendance | Payments | Progression (if enabled)

Overview tab:
  - Stat cards: Attendance % (this month), Next Due Date + Amount, Current Belt/Level
  - Recent activity timeline:
    - "Attended Morning Batch" — today 6:15 AM
    - "Payment ₹1,500 received" — 20 Mar 2026
    - "Promoted to Yellow Belt" — 15 Jan 2026

Attendance tab:
  - Calendar heatmap (green=present, red=absent, grey=no class)
  - Monthly summary: "17/20 (85%)"
  - Streak counter

Payments tab:
  - Next due: amount + date
  - Payment history: date, amount, method, reference

Progression tab (if enabled):
  - Current belt/level with icon
  - History timeline with dates and notes
  - [Promote] button (owner/coach only)

Actions menu (⋮):
  - Send WhatsApp
  - Record Payment
  - Change Batch
  - Change Plan (owner only)
  - Deactivate Member
  - Delete Member (confirm dialog — "This will remove [Name] from your club. 
    Their attendance and payment history will be preserved for reports.")
```

## Deleting a Member
```
Trigger: Actions menu → Delete Member

Confirmation dialog:
  "Remove [Name] from [Club Name]?
   Their attendance and payment history will be kept for your reports.
   This action cannot be undone."
  [Cancel] [Remove Member — danger button]

On confirm:
  - club_membership.status → 'deleted' (soft delete)
  - club_membership.deleted_at → current timestamp
  - Member disappears from member list and batch lists
  - Attendance records preserved (linked to membership_id)
  - Payment records preserved (linked to membership_id)
  - Member's Zenzo account is NOT affected (they can still be members at other clubs)
  - Reports continue to include historical data from this member
```

---

# 6. Batch Management

## Core Principle
**Batches are scheduling groups.** A batch represents a time slot when a group trains together. Batches have no relationship to billing — a member can be in multiple batches and pays based on their plan, not their batches.

## Batch List
```
URL: /:clubSlug/batches

Layout: Card grid — 2 columns desktop, 1 column mobile

Each card:
  - Batch name
  - Timing (e.g., 6:00 – 7:30 AM)
  - Days (e.g., Mon–Fri)
  - Member count
  - Average attendance %
  - Assigned coach (or "No coach assigned")

Click card → Batch Detail
Card menu (⋮): Edit, Delete

Primary action: [+ Create Batch]

Empty state:
  "Create your first batch — a batch is a group that trains together at the same time."
  [+ Create Batch]
```

## Create Batch
```
URL: /:clubSlug/batches/new

Fields:
  - Batch Name (required) — e.g., "Morning Batch"
  - Start Time (required) — time picker, 30-min increments, default 6:00 AM
  - End Time (required) — time picker, 30-min increments, default 7:30 AM
  - Days (required) — pill toggles M T W T F S S, Mon–Fri pre-selected, min 1 day
  - Coach (optional) — searchable dropdown of club_staff with coach role
  - Max Capacity (optional) — number input
  - Description (optional) — text area

Validation:
  - Name: required, non-empty
  - At least 1 day selected
  - Start time < End time
  - If capacity set: must be > 0

On save: Creates batch, redirect to Batch Detail
```

## Batch Detail
```
URL: /:clubSlug/batches/:batchId

Header:
  - Batch name
  - Timing + Days + Coach
  - [Edit] [⋮ menu]

Stat cards:
  - Members: count
  - Avg Attendance: percentage (this month)
  - Today: X/Y present (if today is a batch day)

Primary action: [Take Attendance] → /:clubSlug/attendance/take/:batchId

Members list:
  - All members assigned to this batch
  - Each row: avatar, name, phone, status badge
  - [+ Add Member to Batch] → searchable picker of club members not in this batch

Remove member from batch:
  - Three-dot menu on member row → "Remove from batch"
  - Does NOT delete the member — just removes the member_batches link
  - Confirmation: "Remove [Name] from [Batch]? They will remain a member of your club."
```

## Many-to-Many: Member ↔ Batch
```
Schema: member_batches (membership_id, batch_id)

A member can be in:
  - 0 batches (just joined, not assigned yet)
  - 1 batch (typical)
  - Multiple batches (e.g., Morning + Weekend)

A batch can have:
  - 0 members (newly created)
  - Many members (up to capacity if set)

Assigning a member to a batch:
  - From Batch Detail → [+ Add Member to Batch]
  - From Member Profile → Actions → Assign to Batch
  - Both open a searchable member picker

Attendance is recorded per batch:
  - Member in Morning + Evening has separate attendance records for each
  - Member Profile → Attendance tab shows combined view across all batches
```

## Deleting a Batch
```
Rules:
  - Batch with 0 members: delete immediately
  - Batch with members: show warning
    "This batch has [X] members. Deleting it will remove all members from this batch 
     (they will remain members of your club). Attendance history for this batch will be preserved."
    [Cancel] [Delete Batch — danger]

On delete:
  - Soft delete: batch.deleted_at = timestamp
  - member_batches rows removed
  - Attendance records preserved (reference batch_id still valid for reports)
  - Batch no longer appears in batch list or batch dropdowns
```

---

# 7. Attendance System

## Core Principle
**Attendance is a ritual, not a form.** The coach does this every day, standing in a gym with sweaty hands and a mid-range phone. It must be fast (under 60 seconds for 20 members), satisfying (haptic feedback, visual progress), and foolproof (works offline, auto-saves).

## Take Attendance Screen
```
URL: /:clubSlug/attendance/take/:batchId

Context: Date auto-set to today, batch info shown in header

Header:
  - Back arrow → Batches or Dashboard
  - Batch name
  - Date + Time (e.g., "23 Mar 2026 · 6:00 AM")

Progress bar:
  - Fills as members are marked (present OR absent counts as "marked")
  - Color: primary-500, turns success-500 at 100%
  - Text: "12 of 18 marked" (not percentage — more concrete)
  - At 100%: "All marked! ✓"

Member list:
  - Default: all members assigned to this batch (from member_batches)
  - Sorted: alphabetically by default
  - Each row: 56px height
    - Avatar (36px, initials)
    - Member name (14px, 500 weight)
    - Toggle button (48x48px min tap target)

Toggle states (tap cycles through):
  Unmarked → Present → Absent → Unmarked
  
  [ ] Unmarked: neutral-200 bg, neutral-400 dash icon
  [✓] Present: success-500 bg, white checkmark icon
  [✗] Absent: error-100 bg, error-500 cross icon

Toggle feedback:
  - Instant color change (150ms ease transition)
  - Scale: tap → scale(0.95) → scale(1.0), 100ms
  - Haptic: navigator.vibrate(10) on every tap
  - No confirmation dialogs

Search:
  - Hidden by default (saves space)
  - Pull down or tap search icon to reveal
  - Filters list in real-time by name

Drop-in members:
  - [+ Add Drop-in] button below the member list
  - Opens searchable picker of ALL club members not assigned to this batch
  - Selected member appears in the attendance list with a "Drop-in" badge
  - Can be marked present/absent like regular members
  - Does NOT permanently add them to the batch
  - Attendance record saved with is_drop_in: true

Bottom bar (sticky):
  - [Mark remaining absent] — bulk-marks all unmarked as absent. No confirmation (reversible).
  - [Save] — saves all marks at once. Spinner during save, disabled while saving.
```

## Completion State
```
After save:
  Full-screen completion view:
  - Large animated checkmark (scale 0→1.1→1.0, 200ms ease-out)
  - "Attendance saved!"
  - Batch name
  - Summary: "15 present · 3 absent"
  - [Back to Batches] button
  - Auto-navigate to batch list after 2 seconds (or tap immediately)
```

## Offline Support
```
Implementation: IndexedDB local queue

Flow:
  1. Coach opens attendance screen → member list loaded from server (or cache if offline)
  2. Each toggle tap saves to IndexedDB immediately
  3. Sync indicator in header:
     - 🟢 "Synced" — connected, data on server
     - 🟡 "Saved locally" — offline, data in IndexedDB
     - 🔄 "Syncing..." — pushing queued data to server
  4. When connectivity returns:
     - Auto-push queued attendance to server
     - On success: indicator → "Synced"
     - On conflict (owner edited same attendance from desktop):
       Last-write-wins. Toast: "Attendance updated — some changes were synced from another device."

Cache strategy:
  - Cache member list for each batch (updated on each successful load)
  - If completely offline on first load: show cached list
  - If no cache and offline: "You're offline. Connect to load batch members."
```

## Edit Window
```
- Attendance can be edited same day until midnight (IST)
- After midnight: locked
- Owner can unlock past attendance from Settings (not in Phase 1 — manual DB edit if needed)
- Editing: reopen the Take Attendance screen for that batch + date
  - Previous marks are loaded
  - Coach can change any toggle
  - Save overwrites previous record
```

## Auto-Save on Navigate Away
```
If coach navigates away with unsaved marks:
  - Browser beforeunload prompt: "Save attendance before leaving?"
  - In-app: modal "You have unsaved attendance marks. [Discard] [Save & Leave]"
  - Marks in IndexedDB are preserved even if discarded from UI
```

## Attendance History (Owner View)
```
URL: /:clubSlug/attendance/history

Layout:
  Desktop: Grid view — members as rows, dates as columns
  Mobile: List view per member — "Arjun Kumar — 4/5 this week (80%)"

Filters:
  - Batch: dropdown (default: All)
  - Date range: This week (default), Last week, This month, Custom

Grid symbols:
  ✓ green — present
  ✗ red — absent
  — grey — no class scheduled / not assigned to batch that day
  empty — not yet marked

Key insight section:
  "Consecutive absentees" — highlights members missing 3+ of last 5 sessions
  This is the owner's early warning system for churn

Actions:
  - Click a cell → opens that day's attendance for that batch (if editable)
  - Export: [Download CSV] (desktop)
```

---

# 8. Fee Plans & Billing

## Core Principle
**Plans are billing instruments. Batches are scheduling instruments.** A plan defines how much a member pays and how often. A batch defines when they train. There is no link between plans and batches.

## Fee Plan Management
```
URL: /:clubSlug/settings/plans (or /:clubSlug/payments → Plans tab)

Layout: Card grid — 2 columns desktop, 1 column mobile

Each card:
  - Plan name (e.g., "Monthly Plan")
  - Amount (e.g., ₹1,500 / month)
  - Billing cycle
  - Member count (how many active members are on this plan)
  - [Edit] button

Primary action: [+ Create Plan]
```

## Create / Edit Plan
```
Fields:
  - Plan Name (required) — e.g., "Monthly Plan"
  - Amount in ₹ (required) — number input, stored as paise internally
  - Billing Cycle (required) — dropdown:
    - Monthly
    - Quarterly (3 months)
    - Half-yearly (6 months)
    - Annual (12 months)
    - Per Session (no recurring cycle — pay per attendance)
    Default: Monthly pre-selected
  - Description (optional) — e.g., "Standard monthly membership"

Validation:
  - Name: required, non-empty
  - Amount: required, > 0
  - Billing cycle: required

On save: Creates/updates fee_plans row

Deleting a plan:
  - Cannot delete a plan with active members
  - "This plan has [X] active members. Reassign them to another plan first."
  - Plan with 0 members: delete with confirmation
```

## Billing Cycle Setting (Club-Level)
```
Location: Settings → Business Profile (or Settings → Billing)

Setting: "Payment due date calculation"
  Option A: DOJ-based (Date of Joining)
    - Each member's billing cycle starts from their join date
    - Member joins 15th → due every 15th
    - Example: Monthly plan, joined 15 Mar → due 15 Apr, 15 May, 15 Jun...
  
  Option B: Calendar-based (1st of month)
    - All members' billing cycles align to the 1st of each month
    - Regardless of join date, next due is always the 1st
    - Example: Monthly plan, joined 15 Mar → first due 1 Apr, then 1 May, 1 Jun...
    - Pro-rata for first partial month: NOT calculated in Phase 1 (owner handles manually)

Default: DOJ-based
Can be changed anytime (recalculates all future due dates)
```

## Assigning Plans to Members
```
When: After a member's signup is complete (status: active)
Where: Member Profile → Actions → Change Plan, or Members list → Edit

Flow:
  - Owner selects a plan from dropdown
  - Start date: defaults to today (editable)
  - System calculates first due date based on billing cycle setting:
    DOJ-based: start date + billing cycle
    Calendar-based: 1st of next month
  - Creates/updates plan assignment on club_membership

A member can have exactly ONE active plan at a time.
Plan change:
  - Owner selects new plan
  - New plan starts immediately (or on a specified date)
  - Previous plan's remaining period is NOT pro-rated (Phase 1 — manual adjustment)
```

## Due Date Calculation
```
Given:
  - Plan: Monthly, ₹1,500
  - Billing cycle setting: DOJ-based
  - Member start date: 15 Mar 2026

Due dates generated:
  15 Apr 2026, 15 May 2026, 15 Jun 2026, ...

For Quarterly plan (DOJ-based, start 15 Mar):
  15 Jun 2026, 15 Sep 2026, 15 Dec 2026, ...

For Calendar-based Monthly (any start date):
  1 Apr 2026, 1 May 2026, 1 Jun 2026, ...

Per Session plans:
  - No recurring due date
  - Each session creates a payment record
  - Owner records payment per attendance (or bulk)
```

## Auto-Expiry
```
When a payment due date passes:
  1. Due date passes → member status: overdue
  2. Grace period: 7 days
  3. Due date + 7 days → if still unpaid → member status: expired
  4. Expired members:
     - Still visible in member list (with "Expired" badge)
     - Still appear in batch member lists (greyed out)
     - NOT included in attendance (coach doesn't see them in Take Attendance)
     - Reactivation: owner records a payment → status returns to active

Cron job: runs daily at midnight IST
  - Checks all active memberships for overdue payments
  - Updates statuses accordingly
  - Triggers notification to owner: "[X] members are now overdue"
```

---

# 9. Payments

## Core Principle
**Phase 1: All payments are manual recordings.** The owner receives money (cash, UPI, bank transfer) outside of Zenzo and records it in the system. Online payments via member portal are Phase 2.

## Record Payment
```
URL: /:clubSlug/payments/record (or modal from overdue list)

Fields:
  - Member (required) — searchable dropdown of all club members
    - If navigated from overdue card or member profile: pre-selected
    - Shows overdue amount if applicable: "Overdue: ₹1,500 (Monthly Plan)"
  - Amount in ₹ (required) — pre-filled from plan amount if member has overdue
  - Payment Method (required) — pill selector:
    [Cash] [UPI] [Bank Transfer] [Other]
    Cash is first (most common)
  - Date (required) — defaults to today, can backdate
  - Reference / Note (optional) — free text, e.g., "UPI txn ref: ABC123"
  - ☑ Send receipt via WhatsApp (checked by default)
  - ☑ Send receipt via Email (checked by default)

On save:
  1. Creates payment record
  2. Updates member status: overdue → active (if this payment covers the overdue amount)
  3. Calculates next due date based on billing cycle
  4. Sends WhatsApp receipt (if checked)
  5. Sends email receipt (if checked)
  6. Toast: "₹1,500 payment recorded for Arjun Kumar"
  7. Returns to previous screen (overdue list or member profile)
```

## Overdue List
```
URL: /:clubSlug/payments (default tab: Overdue)

Tabs: [Overdue (6)] [History] [Plans]

Header:
  - Total outstanding: ₹9,000
  - [Send Reminders to All (6)] — sends WhatsApp to all overdue members

Card list (sorted by most overdue first):
  Each card:
    - Avatar + Member name
    - Amount due + Plan name + Due date
    - Days overdue + urgency indicator (red badge, darker with more days)
    - [Send Reminder] button → sends WhatsApp payment reminder
    - [Record Payment] button → opens Record Payment with member pre-selected

"Send Reminders to All":
  - Confirmation: "Send payment reminder to 6 members via WhatsApp?"
  - [Cancel] [Send All]
  - Progress: sends sequentially, shows count "Sent 4 of 6..."
  - On complete: toast "Payment reminders sent to 6 members"

Empty state:
  "No overdue fees! All members are up to date. 🎉" (success-50 background)
```

## Payment History
```
URL: /:clubSlug/payments/history

Filters:
  - Date range: This month (default), Last month, This quarter, This year, Custom
  - Payment method: All, Cash, UPI, Bank Transfer, Other

Desktop: Data table
  Columns: Date, Member, Amount, Method, Reference
  
Mobile: Card list
  Each card: Date, Name, Amount, Method badge

Monthly summary (sticky at bottom):
  "This month: ₹12,400 collected (15 payments)"

Pagination: 25 per page desktop, infinite scroll mobile
Export: [Download CSV] (desktop header)

Click row → Payment detail view:
  - Full payment info
  - Receipt view
  - [Resend Receipt] button (WhatsApp + email)
```

## Payment for Per-Session Plans
```
Members on "Per Session" plans:
  - No recurring due date
  - Owner records payment per session attended (or in bulk for X sessions)
  - Attendance does NOT auto-create payment records
  - Owner manually records: "₹200 × 5 sessions = ₹1,000"
  - Simple: just a payment record with note "5 sessions"
```

---

# 10. Notifications

## Channels
All three channels active in Phase 1:
1. **WhatsApp** (via Interakt API) — primary
2. **Email** (via TBD provider) — secondary
3. **Push notifications** (via Firebase Cloud Messaging) — tertiary

## Notification Types

### 1. Payment Reminder
```
Trigger: Automated — 3 days before due date + on due date
Channels: WhatsApp + Email + Push
Recipients: Member with upcoming/current due payment

WhatsApp template:
  "Hi {name}, your {plan_name} fee of {amount} at {club_name} is due on {due_date}. 
   Please make the payment at your earliest convenience. Thank you! 🙏"

Email subject: "Payment reminder — {club_name}"
Push title: "Fee due soon"
Push body: "Your {plan_name} fee of {amount} is due on {due_date}"

Toggleable: Yes (per club in Settings)
```

### 2. Payment Receipt
```
Trigger: Automated — when owner records a payment (if checkbox checked)
Channels: WhatsApp + Email
Recipients: Member whose payment was recorded

WhatsApp template:
  "Hi {name}, we've received your payment of {amount} for {plan_name} at {club_name}. 
   Date: {date}. Method: {method}. Next due: {next_due_date}. 
   Thank you! 🙏"

Email: Formatted receipt with all payment details

Toggleable: Yes (per club in Settings)
```

### 3. Welcome Message
```
Trigger: Automated — when invited member completes signup
Channels: WhatsApp + Email
Recipients: Newly joined member

WhatsApp template:
  "Welcome to {club_name}, {name}! 🎉 
   We're excited to have you. Your portal: {portal_link}
   See you at your next session!"

Toggleable: Yes (per club in Settings)
```

### 4. Belt/Level Promotion
```
Trigger: Manual — when owner/coach logs a promotion (if checkbox checked)
Channels: WhatsApp + Email + Push
Recipients: Promoted member

WhatsApp template:
  "Congratulations {name}! 🎉 You've been promoted to {new_belt} at {club_name}. 
   Keep up the great work! — {promoter_name}"

Toggleable: Yes (per club in Settings)
```

### 5. Attendance Alert (to Owner)
```
Trigger: Automated — when a member misses 3 consecutive sessions
Channels: WhatsApp + Push (to owner only, NOT to member)
Recipients: Club owner

WhatsApp template:
  "⚠️ {member_name} has missed 3 consecutive sessions at {club_name}. 
   You may want to check in with them."

Toggleable: Yes (per club in Settings)
```

### 6. Membership Expiry Warning
```
Trigger: Automated — 7 days before membership expires
Channels: WhatsApp + Email + Push
Recipients: Member whose membership is expiring

WhatsApp template:
  "Hi {name}, your {plan_name} membership at {club_name} expires on {expiry_date}. 
   Please renew to continue your training. Contact us if you need help!"

Toggleable: Yes (per club in Settings)
```

### 7. Invite Message
```
Trigger: Manual — when owner invites a member
Channels: WhatsApp only
Recipients: Invited phone number

WhatsApp template:
  "Hi! {owner_name} has invited you to join {club_name} on Zenzo. 
   Sign up here to get started: {signup_link}"

Not toggleable — always sent on invite
```

## Notification Settings (Club Level)
```
URL: /:clubSlug/settings/notifications

Each notification type:
  - Toggle: On/Off
  - Channel indicators: WhatsApp ✓ Email ✓ Push ✓
  - Description of trigger
  - [Preview] — shows sample message with placeholder data

Phase 1: Templates are pre-built, NOT customizable by owner
Phase 2: Allow owners to edit template text
```

---

# 11. Belt / Level Progression

## Conditional Module
```
Visibility: Controlled by business type selection during onboarding
  - Martial Arts: ON (terminology: "Belts")
  - Dance: ON (terminology: "Levels" or "Grades")
  - Gym: OFF
  - Yoga: OFF
  - Other: Owner chooses in Settings

Can be toggled on/off anytime in Settings → Customization
When OFF: Progression nav item hidden, progression tab hidden on member profiles
```

## Pre-Built Belt/Level Orders

### Martial Arts (Belts)
```
Order (fixed sequence):
  1. ⚪ White Belt
  2. 🟡 Yellow Belt
  3. 🟠 Orange Belt
  4. 🟢 Green Belt
  5. 🔵 Blue Belt
  6. 🟤 Brown Belt
  7. ⚫ Black Belt

Owner can:
  - Add custom levels between existing ones (e.g., "Yellow Stripe" between White and Yellow)
  - Add levels after Black (e.g., "1st Dan", "2nd Dan")
  - Rename levels (but emoji color indicators stay)
  - Remove unused levels (only if no members are at that level)
```

### Dance (Grades/Levels)
```
Order (fixed sequence):
  1. Beginner
  2. Grade 1
  3. Grade 2
  4. Grade 3
  5. Grade 4
  6. Grade 5
  7. Advanced
  8. Professional

Owner can: same customization rules as martial arts
```

### Custom (for "Other" business types)
```
Owner creates levels from scratch:
  - Add level: name + display order
  - Drag to reorder
  - Delete unused levels
```

## Belt Distribution View
```
URL: /:clubSlug/progression

Header: [+ Promote] button

Horizontal bar chart:
  Each row: emoji + level name + bar + count (percentage)
  e.g., ⚪ White  ████████████████████████  24 (40%)
  Sorted by level order (not by count)

Recent Promotions list:
  Each row: member name, from→to, date
  e.g., "Rahul Sharma 🟡→🟠 Orange Belt 23 Mar 2026"
  Last 10 promotions shown, "View all" link
```

## Log a Promotion
```
URL: /:clubSlug/progression/promote (or modal)

Fields:
  - Member (required) — searchable dropdown
    - Shows current level: "Rahul Sharma · Current: 🟡 Yellow Belt"
  - Promote to (required) — dropdown of levels ABOVE current level
    - Next level pre-selected (opinionated default)
  - Date (required) — defaults to today
  - Notes (optional) — e.g., "Excellent kata performance"
  - ☑ Send congratulations via WhatsApp (checked by default)

On save:
  1. Creates promotion record
  2. Updates member's current level
  3. Sends WhatsApp congratulations (if checked)
  4. Toast: "Rahul Sharma promoted to Orange Belt"
```

## Member Progression History
```
Location: Member Profile → Progression tab

Display:
  - Current level with emoji + "Since [date]"
  - Timeline: each promotion with level, date, notes (if any)
  - [Promote to Next Belt →] button at bottom (owner/coach only)
```

---

# 12. Dashboard

## Owner Dashboard (Daily Digest)
```
URL: /:clubSlug/dashboard

Design intent: Morning newspaper. Scannable in 10 seconds. Actionable in one tap.

Greeting: "Good morning, Ravi 👋" + date

Stat cards (3 on desktop, 2×2 grid on mobile):
  1. Revenue this month: ₹ amount (mono font), % change vs last month, trend arrow
  2. Active members: count, "+X new this month"
  3. Avg attendance: %, % change vs last month
  4. (Mobile 4th card): Overdue count

Needs Attention block:
  Max 3 items, sorted by urgency (red → yellow):
  - 🔴 "6 members have overdue fees" → [View →] → /payments
  - 🟡 "3 members absent 5+ days" → [View →] → filtered members list
  - 🟡 "4 memberships expiring this week" → [View →] → filtered members list
  - If no alerts: "All clear! Nothing needs your attention today. 🎉" (success-50 bg)

Quick Actions bar:
  [+ Invite Member] [Take Attendance] [Record Payment]
  Desktop: inline row. Mobile: horizontal scroll.

Recent Activity feed:
  Chronological, most recent first. Max 10 items.
  Types: payment received, attendance marked, new member joined, membership renewed
  Each: icon + description + relative timestamp ("2 hours ago")
  "View all →" link at bottom

Loading: Shimmer skeletons matching each component shape. Stats load first.

Empty state (new club):
  - Stats: ₹0, 0, 0%
  - Needs Attention: "Add your first members to see insights here"
  - Quick Actions prominent
  - Activity: "Your activity will show up here"

Error: "Couldn't load dashboard. [Retry]" inline banner
```

## Coach Dashboard
```
URL: /:clubSlug/dashboard (coach role)

Design intent: "What batches do I have today?" — nothing else.

Greeting: "Good morning, Arjun 👋" + date

Today's Batches list:
  Each card:
    - Status indicator: 🟢 current/upcoming, ✓ completed (grey)
    - Batch name
    - Time + member count
    - [Take Attendance →] button

  Only batches assigned to this coach.
  Sorted by time.

Empty states:
  - "You have no batches scheduled for today. Enjoy your rest!"
  - "You haven't been assigned to any batches yet. Ask your admin to set you up."

No financial data. No reports. No settings. Just batches and attendance.
Desktop and mobile: identical layout.
```

---

# 13. Reports

## Reports Hub
```
URL: /:clubSlug/reports
Tabs: [Revenue] [Attendance] [Members] [Retention]
Owner-only. Coaches do not see reports.
```

## Revenue Report
```
Tab: Revenue

Filters:
  - Time period: This month (default), Last month, This quarter, This year, Custom range
  - Batch: N/A (plans are not linked to batches — this filter is removed)

Stat cards:
  - Collected: total payments recorded this period
  - Outstanding: total overdue amount across all members
  - Projected: collected + outstanding (what you should have collected)

Chart: Revenue trend — bar chart, last 6 months
  Bars: neutral-700, current month: primary-500

Collection breakdown:
  Cash: ₹48,000 (39%) — horizontal bar
  UPI: ₹52,000 (42%) — horizontal bar
  Bank Transfer: ₹24,000 (19%) — horizontal bar

Export: [Download CSV]
```

## Attendance Report
```
Tab: Attendance

Filters:
  - Time period: This month (default), Last week, This month, Custom
  - Batch: dropdown (default: All)

Stat cards:
  - Avg attendance rate: percentage
  - Total sessions: count
  - At risk: members absent 3+ of last 5

Chart: Daily attendance trend — line chart, current month

Batch-wise breakdown:
  Each batch: name + percentage + horizontal bar
  Morning: 85% ██████████░░
  Evening: 74% █████████░░░

At-risk members section:
  Members absent 3+ of last 5 sessions
  Each: name + attendance fraction + percentage
  Actionable: "Consider sending a WhatsApp check-in"

Export: [Download CSV]
```

## Member Growth Report
```
Tab: Members

Filters:
  - Time period: Last 6 months (default), Last 12 months, Custom

Stat cards:
  - Total active members: count
  - New this month: +count
  - Churned this month: -count

Charts:
  1. Growth trend — line chart, net members over time
  2. New vs Churned — stacked bar, monthly
     Green bars (above): new members
     Red bars (below): churned members

Export: [Download CSV]
```

## Retention Report
```
Tab: Retention

Filters:
  - Time period: This quarter (default), This year, Custom

Stat cards:
  - Retention rate: percentage
  - Avg tenure: X months
  - Renewals this month: count

Cohort analysis:
  "Jan cohort: 92% retained after 3 months"
  "Feb cohort: 88% retained after 2 months"

Churn risk list:
  High risk (low attendance + overdue): names listed
  Medium risk (low attendance only): names listed
  Medium risk (overdue only): names listed

Action: [Send reminder to at-risk members] → bulk WhatsApp

Export: [Download CSV]
```

## Report Design Rules
```
- Stat cards always at top — scannable in 3 seconds
- One primary chart per report — keep it simple
- Actionable insights at bottom — what to DO about the data
- Charts: minimal decoration, clear labels, no 3D, no pie charts
- Mobile: charts min-width 320px, horizontal scroll if needed
- Simple CSS bars on mobile (no heavy charting libraries)
- All reports exportable as CSV
```

---

# 14. Settings

## Settings Layout
```
URL: /:clubSlug/settings
Owner-only. Coaches and members never see these screens.

Desktop: Side tabs (vertical navigation)
Mobile: Drill-down list → tap to navigate to sub-page

Sections:
  - Business Profile
  - Notifications
  - Payment Gateway
  - Customization (terminology + progression toggle)
```

## Business Profile
```
URL: /:clubSlug/settings/profile

Fields:
  - Business Name (required)
  - Business Type (dropdown — changing this triggers terminology reset confirmation)
  - URL Slug (editable, availability check)
  - City (dropdown with search)
  - Business Phone
  - Logo (optional — upload, max 2MB, square crop)
  - Verification Photo (upload — one photo of premises)

Billing Cycle Setting:
  - "Payment due date calculation"
  - Radio: DOJ-based / Calendar-based
  - Changing this: confirmation dialog, recalculates all future due dates

[Save Changes] button (explicit save, not auto-save)
```

## Notifications Settings
```
URL: /:clubSlug/settings/notifications

Each notification type:
  - Name + description of trigger
  - Toggle: On / Off
  - [Preview] expandable section showing template with sample data

Types:
  1. Payment Reminder — "Sent 3 days before and on due date"
  2. Payment Receipt — "Sent when a payment is recorded"
  3. Welcome Message — "Sent when a new member joins"
  4. Belt/Level Promotion — "Sent when a member is promoted"
  5. Attendance Alert — "Alert owner when member misses 3+ sessions"
  6. Membership Expiry Warning — "Sent 7 days before membership expires"

Phase 1: Templates are pre-built, NOT editable
[Save Changes] button
```

## Payment Gateway (Razorpay)
```
URL: /:clubSlug/settings/payment-gateway

Phase 1: Manual payments only. This screen is informational.

Not Connected state:
  "Online payments from members will be available soon. 
   For now, record payments manually after receiving cash/UPI."
  
  "Want to set up Razorpay for future online payments?"
  [Connect Razorpay →]

Connected state:
  Status: ● Connected
  Account: [Business name from Razorpay]
  Key ID: rzp_live_**** (masked)
  [Test Connection] [Disconnect]

Note: Even when connected, member portal payments are Phase 2.
Razorpay connection in Phase 1 is forward-looking preparation.
```

## Customization
```
URL: /:clubSlug/settings/customization

Business Type (read-only, changeable in Profile):
  [Martial Arts]

Custom Terminology:
  "Customize labels to match your business language"
  
  Members are called: [Students     ] ← text input, default from business type
  Batches are called: [Classes      ]
  Progression levels: [Belts        ]

  These labels propagate across ALL UI — every instance of "Member" becomes "Student"

Show Progression Module: [On/Off toggle]
  When off: hides Progression nav item + member profile tab

Progression Level Order:
  - Shows current level hierarchy (drag to reorder)
  - [+ Add Level] button
  - Delete icon on unused levels (no members at that level)
  - Pre-populated from business type on onboarding

[Save Changes] button
```

## Staff Management
```
URL: /:clubSlug/settings/staff (or /:clubSlug/staff)

Staff list:
  Each card:
    - Avatar + Name + Role badge (Owner / Coach)
    - Phone + Email
    - Assigned batches listed
    - [Edit] [Remove] buttons

  Owner shown at bottom: "You (Ravi Kumar) — Owner" (cannot be removed)

[+ Add Staff] button

Add Staff flow:
  Fields:
    - Phone Number (required) — checks if Zenzo account exists
    - Full Name (shown if no existing account, for reference)
    - Role: Coach (radio — only option in Phase 1)
      Description: "Can take attendance, view members, log promotions"
    - Assign Batches: checkboxes for all club batches

  On submit:
    - If phone has Zenzo account: creates club_staff link, sends WhatsApp notification
    - If no account: sends WhatsApp invite with signup link, club_staff created after signup
    - Coach can be shared across branches (same owner's clubs)

Remove staff:
  - Confirmation: "Remove [Name] as coach? They will lose access to [Club Name]."
  - Removes club_staff row. Does NOT delete their Zenzo account.
  - If they're also a member of this club, membership is unaffected.
```

---

# 15. Member Portal

## Core Principle
**View-only in Phase 1.** Members can see their attendance, payments, and profile. They cannot make payments online or change their plan. Online payments are Phase 2.

## Access Method
```
- Token-gated URL: /m/:token
- Link sent via WhatsApp (welcome message, payment reminders, receipts)
- No login required — URL contains auth token
- Token encodes: user_id + club_id + expiry
- Token expiry: 30 days. New token sent with each WhatsApp message.
- If token expired: "This link has expired. Please ask your gym for a new link."
```

## Member Home
```
URL: /m/:token

Top bar: ← [Club Name]
Tabs: [Home] [Attendance] [Payments]

Home tab:
  Greeting: "Hi Arjun! 👋"

  Card 1 — Attendance this month:
    Progress bar + percentage
    "17 of 20 classes"

  Card 2 — Next fee due:
    Amount + date + "in X days"
    NO "Pay Now" button in Phase 1
    Instead: "Please pay your coach/owner directly"

  Card 3 — Last payment:
    Amount + date
    [View Receipt] → receipt detail view

  Card 4 — Your batch(es):
    Batch name(s) + schedule

  Card 5 — Current belt/level (if progression enabled):
    Level name + emoji + "Since [date]"
```

## Attendance Tab
```
Calendar heatmap:
  🟢 = present, 🔴 = absent, grey dot = no class, empty = future
  Swipe left/right to navigate months

Summary:
  "This month: 17/20 (85%)"
  "Last month: 18/22 (82%)"

Streak counter:
  "Streak: 5 consecutive ✓"
```

## Payments Tab
```
Next Due section:
  Amount + date
  "Please pay your coach/owner directly" (Phase 1)

Payment History:
  Card list, each:
    Amount + date
    Plan name + payment method
    [View Receipt] → receipt detail

Receipt detail view:
  ✓ Payment Successful
  Amount (large)
  Club name
  Member name
  Date
  Plan + period covered
  Method
  Reference number
  [Download PDF] [Share]
```

## Mobile-Only Design
```
- Always mobile layout, even on desktop (max-width 480px centered)
- Designed for mid-range Android, 4G, direct sunlight
- Min font size: 14px
- Large tap targets: 48px minimum
- No heavy JS — keep bundle small
```

## Error States
```
- Token expired: "This link has expired. Please contact your gym for a new link."
- No fee due: "You're all paid up! Next fee due on [date]."
- No attendance: "No attendance recorded yet."
- Offline: "You appear to be offline. Check your connection and try again."
```

---

# 16. Public Club Listing

## When It Goes Live
```
- Auto-generated at /clubs/:slug
- Only visible AFTER Zenzo admin approves verification
- Before approval: 404 page (club URL doesn't resolve publicly)
- Club can use all tools while listing is pending verification
```

## Listing Page Content
```
URL: /clubs/:slug (public, no auth required)

Sections:
  1. Hero: Club name, category, city, rating (if reviews exist)
  2. Photos: Gallery uploaded by owner (managed in Settings)
  3. About: Description written by owner
  4. Plans & Pricing: All fee plans with amounts and billing cycles
  5. Schedule: Batch timings and days
  6. Coaches: Staff profiles (name, optional photo)
  7. Trial: "Try a Session — Free" or "Try a Session — ₹200" (if trials enabled)
  8. Contact: WhatsApp button (opens WhatsApp to club's phone number)
  9. Reviews: Star ratings + text (Phase 2 — not in Phase 1)

Phase 1: Read-only. No booking, no enrollment, no online actions.
Phase 2: "Enroll Now" CTA, trial booking, reviews & ratings
```

## Verification Photo
```
- Uploaded by owner in Settings → Business Profile
- One photo of premises (exterior or interior)
- Max 5MB, JPEG/PNG
- Shown to Zenzo admin during verification review
- NOT displayed on public listing page
```

---

# 17. Zenzo Admin Panel

## Scope: Simple verification queue. Not a full CMS.
```
URL: /admin (separate app or route, protected by admin role)

Access: Zenzo team only (admin role in users table)
```

## Club Verification Queue
```
Layout: Table/list of clubs with verification_status = 'pending'

Each row:
  - Club name
  - Owner name + phone
  - Business type
  - City
  - Submitted date
  - Verification photo (clickable to view)
  - [Approve] [Reject] buttons

On Approve:
  - club.verification_status → 'verified'
  - club.listed → true
  - Public listing page goes live at /clubs/:slug
  - WhatsApp sent to owner: "Your club is now live on Zenzo! View your listing: [link]"

On Reject:
  - club.verification_status → 'rejected'
  - WhatsApp sent to owner: "We couldn't verify your club. Please upload a clear photo of your premises."
  - Owner can re-upload photo and re-submit
```

## Admin Dashboard (minimal)
```
Stats:
  - Total clubs: count (verified, pending, rejected)
  - Total users: count
  - Clubs pending verification: count

That's it for Phase 1. No analytics, no content management, no user management.
```

---

# 18. Data Model

## Complete Schema

### users
```sql
id              UUID PRIMARY KEY (Supabase Auth UID)
full_name       TEXT NOT NULL
phone           TEXT UNIQUE NOT NULL (with country code, e.g., +919876543210)
email           TEXT UNIQUE NOT NULL
avatar_url      TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
is_admin        BOOLEAN DEFAULT FALSE (Zenzo platform admin)
```

### clubs
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
slug            TEXT UNIQUE NOT NULL (URL slug, e.g., 'ravis-fitness')
name            TEXT NOT NULL
business_type   TEXT NOT NULL ('gym', 'martial_arts', 'dance', 'yoga', 'other')
city            TEXT NOT NULL
phone           TEXT NOT NULL
logo_url        TEXT
description     TEXT
verification_status  TEXT DEFAULT 'pending' ('pending', 'verified', 'rejected')
verification_photo_url TEXT
listed          BOOLEAN DEFAULT FALSE (true only after verification)

-- Billing configuration
billing_cycle_type TEXT DEFAULT 'doj' ('doj' = date-of-joining based, 'calendar' = 1st of month)

-- Trial configuration
trial_enabled   BOOLEAN DEFAULT FALSE
trial_price_paise INTEGER DEFAULT 0 (0 = free)
trial_duration_days INTEGER DEFAULT 1
max_trials_per_user INTEGER DEFAULT 1

-- Terminology customization
term_member     TEXT DEFAULT 'Member'
term_batch      TEXT DEFAULT 'Batch'
term_progression TEXT DEFAULT 'Level'
show_progression BOOLEAN DEFAULT FALSE

owner_id        UUID REFERENCES users(id) NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### club_staff
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
user_id         UUID REFERENCES users(id) NOT NULL
role            TEXT NOT NULL ('owner', 'coach')
created_at      TIMESTAMPTZ DEFAULT NOW()

UNIQUE(club_id, user_id, role)
```
*Note: A user can have multiple roles at the same club (e.g., coach + member via separate tables). A user can be coach at multiple clubs (shared coaching).*

### club_memberships
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
user_id         UUID REFERENCES users(id) NOT NULL
plan_id         UUID REFERENCES fee_plans(id)
status          TEXT DEFAULT 'pending_invite'
                -- 'pending_invite', 'active', 'overdue', 'expired', 'deleted'
joined_at       TIMESTAMPTZ (set when status first becomes 'active')
plan_start_date DATE (when current plan assignment started)
next_due_date   DATE (calculated from plan + billing cycle type)
expires_at      DATE (plan period end + 7 day grace)
deleted_at      TIMESTAMPTZ (soft delete)
invite_token    TEXT (for pending invites)
invite_sent_at  TIMESTAMPTZ

UNIQUE(club_id, user_id) -- one membership per club per user
```

### member_batches
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
membership_id   UUID REFERENCES club_memberships(id) NOT NULL
batch_id        UUID REFERENCES batches(id) NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()

UNIQUE(membership_id, batch_id)
```

### batches
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
name            TEXT NOT NULL
start_time      TIME NOT NULL
end_time        TIME NOT NULL
days            TEXT[] NOT NULL (e.g., ['mon','tue','wed','thu','fri'])
coach_id        UUID REFERENCES users(id) -- nullable (unassigned)
max_capacity    INTEGER -- nullable (unlimited)
description     TEXT
deleted_at      TIMESTAMPTZ (soft delete)
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### fee_plans
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
name            TEXT NOT NULL
amount_paise    INTEGER NOT NULL (₹1 = 100)
billing_cycle   TEXT NOT NULL ('monthly', 'quarterly', 'half_yearly', 'annual', 'per_session')
description     TEXT
deleted_at      TIMESTAMPTZ (soft delete)
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### attendance_records
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
membership_id   UUID REFERENCES club_memberships(id) NOT NULL
batch_id        UUID REFERENCES batches(id) NOT NULL
date            DATE NOT NULL
status          TEXT NOT NULL ('present', 'absent')
is_drop_in      BOOLEAN DEFAULT FALSE (true if member not assigned to batch)
marked_by       UUID REFERENCES users(id) NOT NULL (coach or owner who marked)
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()

UNIQUE(membership_id, batch_id, date) -- one record per member per batch per day
```

### payments
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
membership_id   UUID REFERENCES club_memberships(id) NOT NULL
amount_paise    INTEGER NOT NULL
method          TEXT NOT NULL ('cash', 'upi', 'bank_transfer', 'other')
payment_date    DATE NOT NULL
reference       TEXT -- optional note or transaction ref
recorded_by     UUID REFERENCES users(id) NOT NULL (owner who recorded)
receipt_sent    BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### progression_levels
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
name            TEXT NOT NULL (e.g., 'Yellow Belt', 'Grade 2')
display_order   INTEGER NOT NULL (determines sequence)
emoji           TEXT (e.g., '🟡', '🟠')
created_at      TIMESTAMPTZ DEFAULT NOW()

UNIQUE(club_id, display_order)
```

### promotions
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
membership_id   UUID REFERENCES club_memberships(id) NOT NULL
from_level_id   UUID REFERENCES progression_levels(id)
to_level_id     UUID REFERENCES progression_levels(id) NOT NULL
promoted_on     DATE NOT NULL
notes           TEXT
promoted_by     UUID REFERENCES users(id) NOT NULL
notification_sent BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### member_current_level
```sql
-- Denormalized for quick lookups (updated on each promotion)
membership_id   UUID REFERENCES club_memberships(id) PRIMARY KEY
level_id        UUID REFERENCES progression_levels(id) NOT NULL
since_date      DATE NOT NULL
```

### notifications_log
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
club_id         UUID REFERENCES clubs(id) NOT NULL
recipient_user_id UUID REFERENCES users(id) NOT NULL
type            TEXT NOT NULL ('payment_reminder', 'payment_receipt', 'welcome', 
                              'promotion', 'attendance_alert', 'expiry_warning', 'invite')
channel         TEXT NOT NULL ('whatsapp', 'email', 'push')
status          TEXT NOT NULL ('sent', 'delivered', 'failed')
failure_reason  TEXT
message_preview TEXT -- truncated content for history view
sent_at         TIMESTAMPTZ DEFAULT NOW()
```

### notification_settings
```sql
club_id         UUID REFERENCES clubs(id) PRIMARY KEY
payment_reminder BOOLEAN DEFAULT TRUE
payment_receipt  BOOLEAN DEFAULT TRUE
welcome_message  BOOLEAN DEFAULT TRUE
promotion_congrats BOOLEAN DEFAULT TRUE
attendance_alert BOOLEAN DEFAULT TRUE
expiry_warning   BOOLEAN DEFAULT TRUE
```

## Row Level Security (RLS) Summary
```
- clubs: owner can read/write own clubs. Verified+listed clubs readable by public.
- club_staff: readable by staff of same club. Writable by owner.
- club_memberships: readable by staff of same club + the member themselves. Writable by owner.
- batches: readable by staff + members of same club. Writable by owner.
- attendance_records: readable by staff + own records by member. Writable by coach/owner of club.
- payments: readable by owner + own records by member. Writable by owner.
- fee_plans: readable by staff + members of same club. Writable by owner.
- progression_levels: readable by staff + members. Writable by owner.
- promotions: readable by staff + own by member. Writable by owner/coach.
- notifications_log: readable by owner.
```

---

# 19. Revenue Model

## Summary
```
Zenzo is a SaaS company with a marketplace directory.
Primary revenue: Club SaaS subscription (~70-80%)
Secondary revenue: Featured listings + enrollment fees (~20-30%)
No transaction commission on member payments.
```

## Pricing Timeline
```
Phase 1: FREE for all clubs
  - Goal: 50-100 clubs using Zenzo daily
  - No time limit — free until Phase 2 consumer platform launches

Phase 2: SaaS subscription begins
  - Mandatory for all clubs (management tools + public listing)
  - First 50 clubs: early-adopter locked rate (significant discount, locked for 2 years)
  - Tiered pricing (indicative, finalize after data):
    Up to 50 members: ₹799/month
    Up to 150 members: ₹1,499/month
    Unlimited: ₹2,499/month
  - Annual plans: 2 months free (pay for 10, get 12)

Phase 3: Full revenue stack
  - SaaS subscription (ongoing)
  - Featured listings: clubs pay for promoted placement in consumer search
  - Enrollment fees: ₹200-500 per new member acquired through Zenzo consumer platform
```

---

# 20. Build Order & Phases

## Phase 1 — Club Supply Side

### Sprint 1: Foundation
```
- [ ] Supabase project setup + database migrations (all tables above)
- [ ] RLS policies for all tables
- [ ] Supabase Auth configuration (phone OTP via Interakt, email/password)
- [ ] Auth middleware (apps/web/src/middleware.ts)
- [ ] Login + Signup UI
- [ ] OTP verification flow (WhatsApp via Interakt)
- [ ] Post-signup routing logic
```

### Sprint 2: Club Onboarding
```
- [ ] Onboarding wizard (5 steps)
- [ ] Business type selection → auto-configure terminology + progression
- [ ] Studio setup (name, slug, city)
- [ ] Slug availability check (real-time)
- [ ] Create first batch (skippable)
- [ ] Invite first members (skippable)
- [ ] Club switcher (multi-club support from day one)
- [ ] Create additional club flow
```

### Sprint 3: Member Management
```
- [ ] Member list (table + card view + filters + search)
- [ ] Invite Member flow (single — WhatsApp invite via Interakt)
- [ ] Bulk invite flow (CSV upload → send invites)
- [ ] Invite acceptance flow (signup link → create membership)
- [ ] Pending invites dashboard (sent, joined, expired)
- [ ] Member profile (header + tabs)
- [ ] Member status lifecycle (pending → active → overdue → expired)
- [ ] Edit member
- [ ] Delete member (soft delete, preserve history)
```

### Sprint 4: Batch Management
```
- [ ] Batch list (card grid)
- [ ] Create batch form
- [ ] Batch detail page
- [ ] Assign members to batches (many-to-many)
- [ ] Remove members from batches
- [ ] Assign coach to batch
- [ ] Edit batch
- [ ] Delete batch (soft delete)
```

### Sprint 5: Fee Plans & Billing
```
- [ ] Fee plan management (create, edit, delete)
- [ ] Billing cycle setting (DOJ vs Calendar — club level)
- [ ] Assign plan to member
- [ ] Due date calculation engine
- [ ] Auto-status updates (active → overdue → expired)
- [ ] Daily cron job for status checks
- [ ] Grace period logic (7 days)
```

### Sprint 6: Attendance
```
- [ ] Take Attendance screen (THE ritual screen)
- [ ] Toggle component (present/absent/unmarked, 48x48 tap target, haptic)
- [ ] Progress bar
- [ ] Mark remaining absent (bulk)
- [ ] Save attendance
- [ ] Completion state (animated checkmark)
- [ ] Drop-in member support
- [ ] Search within attendance list
- [ ] Offline support (IndexedDB queue + sync)
- [ ] Auto-save prompt on navigate away
- [ ] Edit window (same day until midnight)
- [ ] Attendance history (owner view — grid + list)
- [ ] At-risk member detection (3+ of last 5 absent)
```

### Sprint 7: Payments
```
- [ ] Record Payment form
- [ ] Overdue list (sorted by most overdue)
- [ ] Send payment reminder (individual — WhatsApp)
- [ ] Send reminders to all (bulk — WhatsApp)
- [ ] Payment history (table + filters + export CSV)
- [ ] Payment receipt generation
- [ ] Auto-update member status on payment
- [ ] Next due date recalculation on payment
```

### Sprint 8: Notifications
```
- [ ] Interakt WhatsApp API integration
- [ ] Email provider integration (Resend / Postmark / SES)
- [ ] Push notification setup (Firebase Cloud Messaging)
- [ ] Payment reminder (automated — 3 days before + on due date)
- [ ] Payment receipt (automated — on record)
- [ ] Welcome message (automated — on member join)
- [ ] Attendance alert to owner (automated — 3 consecutive absences)
- [ ] Membership expiry warning (automated — 7 days before)
- [ ] Invite message (manual — on invite)
- [ ] Notification settings UI (toggles per type)
- [ ] Notifications log (history table)
```

### Sprint 9: Belt/Level Progression
```
- [ ] Pre-built level orders (martial arts belts, dance grades)
- [ ] Custom level management (add, reorder, delete)
- [ ] Belt distribution view (horizontal bar chart)
- [ ] Log promotion form
- [ ] Promotion congratulations notification (WhatsApp)
- [ ] Member profile progression tab
- [ ] Progression module show/hide toggle
```

### Sprint 10: Dashboard + Reports
```
- [ ] Owner dashboard (daily digest)
- [ ] Stat cards with trend indicators
- [ ] Needs attention block
- [ ] Quick actions bar
- [ ] Recent activity feed
- [ ] Coach dashboard (today's batches)
- [ ] Revenue report (stats + bar chart + breakdown)
- [ ] Attendance report (stats + line chart + batch breakdown)
- [ ] Member growth report (stats + trend + new vs churned)
- [ ] Retention report (stats + cohort + churn risk)
- [ ] CSV export for all reports
```

### Sprint 11: Settings + Staff + Portal
```
- [ ] Settings layout (side tabs desktop, drill-down mobile)
- [ ] Business profile settings
- [ ] Notification settings
- [ ] Payment gateway settings (Razorpay — connect/disconnect)
- [ ] Customization settings (terminology + progression toggle)
- [ ] Staff management (add, edit, remove coaches)
- [ ] Staff invite flow (WhatsApp)
- [ ] Shared coach across clubs
- [ ] Member portal (view-only — home, attendance, payments tabs)
- [ ] Token-gated URL generation + expiry
- [ ] Trial session settings (enable, price, duration)
```

### Sprint 12: Public Listing + Admin
```
- [ ] Public club listing page (/clubs/:slug)
- [ ] Listing content: name, type, city, plans, schedule, coaches
- [ ] Listing visible only after verification
- [ ] Zenzo admin panel (simple)
- [ ] Verification queue (table of pending clubs)
- [ ] Approve / Reject flow
- [ ] WhatsApp notification to owner on verification result
- [ ] Admin dashboard (basic stats)
```

---

## Phase 2 — Consumer Demand Side (Future — Not in Phase 1)
```
1. Consumer auth (Phone OTP + Google Sign-In)
2. Discovery (search, filters, map)
3. Trial booking flow
4. Enrollment flow (select plan → pay → activate)
5. Consumer dashboard
6. Reviews & ratings
7. Marketplace payments (Razorpay Route)
8. Native app (iOS + Android)
9. Club SaaS billing begins
10. Member portal online payments
```

---

# 21. Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | No shadow users — all members must sign up on Zenzo | Clean data model, no merge logic, every member is Phase 2 ready |
| 2 | Club tools available immediately, verification gates listing only | Don't block supply-side adoption |
| 3 | Consumer flow is enrollment-based, not session-booking | Gyms/martial arts/dance are commitment-based |
| 4 | Trial sessions are club-managed with dynamic pricing | Clubs set free or paid, duration, max per consumer |
| 5 | Many-to-many member-to-batch | Members attend multiple batches, billing is plan-based not batch-based |
| 6 | Plans = billing, Batches = scheduling (no link) | A member pays based on plan, attends based on batch schedule |
| 7 | Drop-in attendance for non-assigned members | Coach can mark walk-ins without permanently assigning them |
| 8 | Billing cycle: owner chooses DOJ-based or Calendar-based | Club-level setting, affects all due date calculations |
| 9 | Auto-expiry with 7-day grace period | System manages status lifecycle, owner doesn't manually expire |
| 10 | Offline attendance with IndexedDB queue | Coach's ritual must work in poor connectivity |
| 11 | SaaS-primary revenue model | Transaction commission doesn't work (clubs bypass) |
| 12 | Phase 1 is free, subscription starts at Phase 2 | Don't charge before product-market fit |
| 13 | All notification channels: WhatsApp + Email + Push | Maximum reach from Phase 1 |
| 14 | Member portal is view-only in Phase 1 | Online payments are Phase 2 |
| 15 | Pre-built belt orders per business type | Reduces setup friction, customizable later |
| 16 | No membership freeze in Phase 1 | Owner extends due date manually if needed |
| 17 | Soft delete members, preserve history | Reports remain accurate |
| 18 | Multi-club from day one, completely separate data | Coaches can be shared across branches |
| 19 | One person can be coach + member at same club | Common in small clubs |
| 20 | Owner can be coach at own club | Common in small/solo operations |
| 21 | Supabase Auth for authentication | Already in stack, supports phone + Google |
| 22 | WhatsApp OTP via Interakt | Primary channel, already integrated |
| 23 | Club verification: one photo of premises | Keep it simple, low friction |
| 24 | Simple admin panel (verify queue only) | No full CMS needed in Phase 1 |
| 25 | English only in Phase 1 | Hindi/regional languages are Phase 2 |
| 26 | Owner only can change member plans | Members request via WhatsApp |
| 27 | No pre-assignment at invite time | Assign plan + batch after member signs up |
| 28 | Fundraise planned | Enables patience on consumer platform build |

---

*End of Blueprint v1.0*

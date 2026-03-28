# Zenzo — Full Platform Product Definition v2.1
*Updated: March 2026. All decisions from product review locked in.*

---

## What Zenzo Is

A two-sided platform for recurring-attendance clubs — gyms, martial arts, dance, yoga.

**Supply side:** Clubs use Zenzo to manage their operations.
**Demand side:** Consumers use Zenzo to discover, enroll in, and track across clubs.

Zenzo is always the brand. Consumers interact with Zenzo, not individual club brands — exactly like Zomato. A user has a Zenzo account. They join clubs through Zenzo. They pay through Zenzo. Their attendance history lives on Zenzo.

---

## Launch Categories

| Category | Examples |
|---|---|
| Gyms / Fitness | CrossFit boxes, weight training gyms, fitness studios |
| Martial Arts / Combat | Karate, BJJ, MMA, Boxing, Taekwondo |
| Dance / Performing Arts | Bharatanatyam, Bollywood, Contemporary, Zumba |
| Yoga / Wellness | Hatha, Ashtanga, Power Yoga, Meditation |

Not at launch: Sports (cricket, football, badminton), Tuition centres. Phase 2+.

---

## The Two Products

---

### Product 1 — Zenzo for Clubs
*B2B. Club owners and their staff. Desktop-first, mobile-capable.*

#### Who Uses It
- **Owner** — Full access. Manages everything.
- **Coach / Staff** — Limited access. Attendance, members, progression. No financials, no settings.

#### How a Club Gets On Zenzo
1. Owner signs up (self-serve)
2. Fills business profile + uploads verification docs
3. **Club can use ALL management tools immediately** — no verification gate on tools
4. Zenzo team manually verifies in background (quality control, no bad actors)
5. **Verification gates public listing only** — club goes live on directory once verified
6. Club profile shows "Verification pending" status until approved
7. Free usage until consumer platform launches (Phase 2)
8. After Phase 2 launch → mandatory subscription (see Revenue Model)

*Rationale: Tools-first, listing-second. Never block a club from using the product they signed up for. Verification is about directory quality, not tool access.*

#### Member Identity — No Shadow Users

**All members must have a Zenzo account.** There are no "shadow" or placeholder users.

The flow:
1. Club owner clicks "Invite Member" and enters a phone number
2. Zenzo sends a signup/join link via WhatsApp
3. Person creates a Zenzo account (or is linked if they already have one)
4. Club-membership relationship is created upon signup completion
5. A dashboard shows the club owner who's joined and who hasn't responded

**Bulk onboarding:** Owner uploads a CSV of phone numbers → Zenzo sends invite links to all → dashboard tracks invite status (sent, joined, pending).

*Rationale: This is cleaner architecturally (no merge logic, no duplicate resolution), makes every member a first-class Zenzo user from day one, and sets up the consumer platform — every club member already has a Zenzo account when Phase 2 launches.*

#### Features — Club Management Tools

**Member Management**
- Invite members via WhatsApp link (name + phone → sends signup link)
- Bulk invite via CSV / Excel upload
- Member profile: personal info, membership status, plan, batches
- Member status: Active, Overdue, Expired, New, Pending (invited but not yet joined)
- Search, filter by batch / status / plan
- Edit and deactivate members

**Batch Management**
- Create batches (name, timing, days, capacity)
- Assign coaches to batches
- Add / remove members from batches
- **Many-to-many:** A member can belong to multiple batches (e.g., Morning + Weekend)
- View batch detail: members, avg attendance, today's count
- Schema: `member_batches` join table (membership_id, batch_id)

**Attendance**
- Take attendance per batch (the ritual screen — coach primary)
- Toggle: Present / Absent / Unmarked per member
- Progress bar, bulk "mark remaining absent"
- Edit same day until midnight
- History view: grid (owner), filtered by batch + date range
- At-risk alerts: members absent 3+ of last 5 sessions
- **Offline support:** Marks saved to IndexedDB immediately. Sync indicator shows "Saved locally" vs "Synced." Auto-pushes to server when connectivity returns. Last-write-wins conflict resolution with notification.

**Fee Plans & Payments**
- Create fee plans: name, amount, billing cycle (monthly, quarterly, half-yearly, annual, per session)
- Assign plans to members
- Record payments manually: member, amount, method (cash/UPI/bank/other), date, note
- Overdue list: sorted by most overdue first
- Payment history: filterable by date, method
- Send payment reminders via WhatsApp (individual or bulk)
- Auto-send receipt via WhatsApp on payment recorded
- Payment link via WhatsApp (Razorpay — money goes directly to club's account in Phase 1)

**Trial Session Management**
- Configurable per club in Settings:
  - Trials enabled: on/off
  - Trial pricing: free (₹0) or any amount set by club
  - Trial duration: single session or X days
  - Max trials per consumer: configurable (default: 1)
- On consumer listing page: "Try a session — Free" or "Try a session — ₹200"
- After trial, consumer gets follow-up nudge to enroll in a full plan
- Trial history visible in club dashboard

**Staff Management**
- Add staff (name, phone, role)
- Roles: Owner, Coach
- Assign coaches to batches
- Staff invited via WhatsApp login link
- Owner cannot be deleted

**WhatsApp Notifications (via Interakt)**
- Payment reminder (3 days before + on due date)
- Payment receipt (auto on record)
- Welcome message (on member add)
- Belt / level promotion congratulations
- Attendance alert to owner (member absent 3+ consecutive)
- All toggleable per club in Settings

**Belt / Level Progression**
- Conditional: only for club types that use levels (martial arts, dance grading)
- Log promotions: member, from belt, to belt, date, notes
- Auto-send WhatsApp congratulations
- Member profile progression tab: history timeline
- Distribution view: how many members at each level

**Dashboard (Owner)**
- Daily digest: revenue this month, active members, avg attendance, overdue count
- Needs attention: overdue fees, absent members, expiring memberships
- Quick actions: add member, take attendance, record payment
- Recent activity feed

**Dashboard (Coach)**
- Today's batches only
- One-tap to take attendance
- No financial data

**Reports**
- Revenue: collected, outstanding, projected, trend, breakdown by method
- Attendance: avg rate, by batch, at-risk members
- Member growth: new vs churned, trend
- Retention: rate, avg tenure, cohort analysis, churn risk list
- All exportable as CSV

**Settings**
- Business profile: name, type, city, logo, slug
- Terminology customisation: members/students/athletes, batches/classes, belts/levels
- Notification toggles
- Trial session settings (pricing, duration, enabled/disabled)
- Razorpay connection (direct to club account)
- Staff management
- Show/hide progression module

**Public Club Listing Page** *(the bridge to Phase 2)*
- Auto-generated at `/clubs/:slug` when club is verified and goes live
- Shows: name, category, location, photos, plans & pricing, coaches, ratings, trial option, WhatsApp contact button
- Read-only in Phase 1 (no online enrollment yet)
- This is what consumers will find in Phase 2 discovery

---

### Product 2 — Zenzo for Consumers
*B2C. End users discovering and joining clubs. Mobile-first.*
*Phase 2 — built after club supply side is established.*

#### Who Uses It
- **Consumer** — Anyone. Discovers clubs, enrolls, tracks their fitness across clubs.

#### Surfaces
- **Native app** (iOS + Android) — primary consumer surface
- **Mobile web** (PWA) — for SEO, sharing, non-app users

#### Consumer Authentication
- Phone OTP or Google Sign-In
- No email/password (friction reduction)
- One Zenzo account — works across all clubs

#### Discovery
Public, no login required.

- Search by city / locality
- Filter by:
  - Category (gym, yoga, dance, martial arts)
  - Price range
  - Timing / availability (morning, evening, weekend)
  - Distance (map view)
- Sort by: distance, rating, price
- Ratings & reviews visible on listing

#### Club Listing Page (Consumer View)
What a consumer sees at `/clubs/:slug`:

| Section | Content |
|---|---|
| Hero | Club name, category, rating, location, distance |
| Photos | Gallery (uploaded by club) |
| About | Description written by club owner |
| Plans & Pricing | All fee plans with amounts and billing cycles |
| Schedule | Batch timings and days |
| Coaches | Staff profiles (name, photo, bio) |
| Reviews | Star rating + text reviews from verified members |
| Trial | "Try a Session" CTA with club-set pricing (free or paid) |
| Contact | WhatsApp button (direct to club's WhatsApp) |

#### Consumer Flow — Enrollment, Not Booking

This is NOT a session-booking platform. In gyms, martial arts, and dance, consumers choose a club and commit to a membership plan. The flow reflects this:

```
Consumer discovers club on Zenzo (search, browse, recommendation)
       ↓
Views listing: pricing, schedule, coaches, reviews
       ↓
Optionally books a trial session (free or paid, per club settings)
       ↓
Decides to enroll → selects a membership plan
       ↓
Pays first installment through Zenzo
       ↓
Club is notified of new enrollment
       ↓
Membership activated → ongoing payments, attendance tracking via Zenzo
```

**Trial → Enrollment is the key conversion funnel.** Zenzo's role is to get consumers from discovery to commitment. Once enrolled, the member's recurring payments, attendance, and progression all flow through Zenzo.

**Payment timing:** Consumer pays only after deciding to enroll (or during trial if trial is paid). No upfront payment before club interaction.

**Drop-in sessions** can exist as a secondary feature (per-session plans), but the primary flow is plan-based enrollment.

#### Consumer Profile & Dashboard
- My clubs: all active memberships in one place
- Attendance: combined calendar across clubs
- Payments: upcoming fees, payment history, receipts
- Progression: belt/level history per club (if applicable)

#### Communications to Consumer
- **Push notifications** (app): enrollment confirmed, payment due, class reminders
- **WhatsApp**: receipts, reminders, club announcements
- **Email**: receipts, enrollment confirmations

#### Reviews & Ratings
- Only verified members can leave reviews (prevents fake reviews)
- Star rating (1–5) + optional text
- Club can respond to reviews
- Zenzo can remove reviews that violate policy

---

## Data Model — Key Entities

**No shadow users.** Every person on Zenzo is a real, authenticated user.

```
users (Zenzo-level)
  → id, name, phone, email, auth_provider
  → One account across all clubs

clubs (platform-level)
  → id, slug, name, category, owner_id
  → verification_status: pending | verified | rejected
  → listed: boolean (true only after verification)
  → trial_enabled, trial_price, trial_duration, max_trials_per_consumer

club_memberships (club-level relationship)
  → user_id → users
  → club_id → clubs
  → plan_id → fee_plans
  → status: active | overdue | expired | pending_invite
  → joined_at, expires_at

member_batches (many-to-many join table)
  → membership_id → club_memberships
  → batch_id → batches

batches
  → id, club_id, name, start_time, end_time, days[], coach_id, capacity

fee_plans
  → id, club_id, name, amount_paise, billing_cycle, description

attendance_records
  → id, membership_id, batch_id, date, status (present|absent), marked_by

payments
  → id, membership_id, amount_paise, method, date, reference, recorded_by
```

---

## Revenue Model

### Strategic Identity
Zenzo is primarily a **SaaS company that also runs a marketplace directory.** The consumer platform is a powerful moat and growth engine — it makes clubs want to be on Zenzo (because it brings them members) and makes the SaaS subscription more valuable. But the SaaS subscription is the primary revenue driver.

### Revenue Streams

**Primary (~70-80%): Club SaaS Subscription**
- Clubs pay monthly/annual fee for management tools
- Tiered by member count (indicative: ₹799 / ₹1,499 / ₹2,499 — final pricing TBD after first 50 clubs)
- Sticky: 6+ months of attendance data, payment records, and member relationships create high switching costs
- Kicks in after Phase 2 launch (Phase 1 is free)

**Secondary (~10-20%): Featured Listings & Promoted Placement**
- Clubs pay to appear higher in consumer search results
- Featured spots on category pages ("Top Gyms in Koramangala")
- Familiar model — clubs understand paying for visibility (like Google Ads / JustDial)
- Requires meaningful consumer directory traffic — Phase 2-3 stream

**Tertiary (~5-10%): Enrollment Fee**
- Flat fee (₹200-500) when a consumer who discovered the club through Zenzo actually enrolls
- Attribution-based, one-time per enrollment, not recurring
- Scales with consumer platform traffic — Phase 2-3 stream

### Pricing Timeline

| Phase | What Clubs Pay | Why |
|---|---|---|
| Phase 1 (now) | **Free** | Goal: get 50-100 clubs using Zenzo daily. Never charge before product-market fit. |
| Phase 2 (consumer launch) | **SaaS subscription** (mandatory) | Tools they depend on + consumer traffic they benefit from. First 50 clubs get early-adopter pricing (locked rate, significant discount). |
| Phase 3 (scale) | **SaaS + featured listings + enrollment fees** | Full revenue stack. Consumer platform has enough traffic to make secondary streams meaningful. |

### What Zenzo Does NOT Do for Revenue
- **No transaction commission on recurring payments.** Clubs will route payments off-platform (cash, direct UPI) to avoid fees. Fighting clubs on this creates adversarial incentives and undermines the payment tracking value proposition.
- **No consumer subscription in Phase 1 or 2.** Requires massive consumer base. Phase 3+ at earliest.

---

## Payment Architecture

### Phase 1 (Club Tools)
- Money flows: Member → Club's Razorpay account directly
- Zenzo does not touch member payments
- Zenzo invoices clubs separately for subscription (when charging begins)
- Simple. Shippable.

### Phase 2 (Consumer Platform)
- Enrollment payments flow: Consumer → Zenzo Razorpay → Club (minus enrollment fee if applicable)
- Requires Razorpay Route (marketplace setup) for enrollment payments
- Recurring payments after enrollment can continue direct to club's Razorpay
- Settlement: Zenzo retains enrollment fee, passes remainder to club

---

## Roles Summary

| Role | Product | Access |
|---|---|---|
| `owner` | Club tools | Full management + settings |
| `coach` | Club tools | Attendance, members (read), progression |
| `consumer` | Consumer app | Discovery, enrollment, own profile |
| `admin` | Zenzo internal | Club verification, platform management |

---

## Build Order

### Phase 1 — Club Supply Side
1. Auth + club onboarding (tools available immediately, verification in background)
2. Member management (invite-based, no shadow users)
3. Batch management (many-to-many member-batch)
4. Attendance (with offline queue / local save)
5. Payments + fee plans (direct Razorpay to club)
6. WhatsApp notifications (Interakt)
7. Belt / level progression
8. Dashboard + reports
9. Trial session settings (club-configurable)
10. Public club listing page (read-only, no enrollment — goes live after verification)

**Goal:** 50–100 clubs actively using Zenzo daily.
**Pricing:** Free for all clubs during Phase 1.

### Phase 2 — Consumer Demand Side
1. Consumer auth (phone OTP + Google)
2. Discovery: search, filters, map view
3. Club listing page (full consumer view with trial booking + enrollment)
4. Trial session flow (consumer books trial per club settings)
5. Enrollment flow (consumer selects plan → pays → membership activates)
6. Consumer dashboard (my clubs, attendance, payments)
7. Reviews & ratings
8. Enrollment payments (Razorpay Route)
9. Native app (iOS + Android)
10. **Club SaaS subscription billing begins** (first 50 clubs get early-adopter locked rate)

**Goal:** Consumers discovering and enrolling in clubs through Zenzo.

### Phase 3 — Monetisation & Growth
1. Featured listings / promoted placement
2. Enrollment fees (per consumer-sourced member)
3. Analytics for clubs (member insights, market benchmarks)
4. Consumer subscription (premium features — if justified by data)
5. Multi-city expansion playbook
6. Sports category (cricket, football, badminton)

---

## What We Are NOT Building (Ever, or Not Yet)

| Feature | Decision |
|---|---|
| Shadow / placeholder users | No. Every member must have a Zenzo account. |
| Dark mode | Phase 1: No. Revisit post-launch. |
| Social login (Facebook) | No. Google + phone is enough. |
| In-app chat between club and member | No. WhatsApp handles this. |
| Club website builder | No. Zenzo listing page is the club's web presence. |
| Transaction commission on payments | No. Clubs will route off-platform. Don't fight this. |
| Session-by-session booking (as primary flow) | No. Enrollment/plan-based is primary. Drop-in is secondary. |
| Sports / outdoor venues | Phase 2+ |
| Tuition centres | Phase 2+ |
| Live streaming classes | No. Out of scope. |
| Diet / nutrition tracking | No. Out of scope. |
| Equipment / inventory management | No. Out of scope. |

---

## Key Decisions Log (v2.1)

| # | Decision | Rationale |
|---|---|---|
| 1 | No shadow users — all members must sign up on Zenzo | Cleaner data model, no merge logic, every member is a Zenzo user for Phase 2 |
| 2 | Club tools available immediately, verification gates listing only | Don't block supply-side adoption with manual process |
| 3 | Consumer flow is enrollment-based, not session-booking | Gyms/martial arts/dance are commitment-based, not on-demand |
| 4 | Trial sessions are club-managed with dynamic pricing | Clubs set free or paid, duration, max per consumer |
| 5 | Many-to-many member-to-batch relationship | Members can attend multiple batches (Morning + Weekend) |
| 6 | Offline attendance with local queue | Coach's core ritual must work in poor connectivity |
| 7 | SaaS-primary revenue model | Transaction commission doesn't work (clubs bypass), SaaS is predictable and sticky |
| 8 | Phase 1 is free, subscription starts at Phase 2 launch | Don't charge before product-market fit; early adopters get locked pricing |
| 9 | Fundraise planned | Enables patience on consumer platform build without revenue pressure |

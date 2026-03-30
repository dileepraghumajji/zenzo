Sprint 0 — Refactor (do this first, unblocks everything)
These files exist but are broken against the new data model. Nothing else can be built correctly until this is done.

#	Task	File(s)	What to do
R1	Replace DB enums	packages/database/src/enums.ts	Replace all old enum values with new ones: UserRole (owner/coach), MembershipStatus, BillingCycle, PaymentMethod, ClubCategory, VerificationStatus, DayOfWeek, AttendanceStatus
R2	Replace DB types	packages/database/src/types/index.ts	Completely replace with new table types: users, clubs, club_staff, club_memberships, member_batches, batches, fee_plans, attendance_records, payments
R3	Rename route folder	app/(dashboard)/[tenantSlug]/	Move to app/(dashboard)/[clubSlug]/ — rename the folder and update all params.tenantSlug references inside
R4	Rewrite lib/auth.ts	apps/web/src/lib/auth.ts	Rewrite getUserProfile(clubSlug) to query clubs + club_staff tables instead of tenants + profiles
R5	Rewrite profile route	apps/web/src/app/api/auth/profile/route.ts	Update to query new schema, return clubSlug (not tenantSlug)
R6	Update Sidebar + BottomNav	sidebar.tsx, bottom-nav.tsx	Replace staff role with coach, tenantSlug with clubSlug
R7	Finalize Auth flow	app/(auth)/signup/page.tsx	Revert WhatsApp OTP, add Google Auth and standard email signup to save on Interakt costs initially
Sprint 1 — Foundation (P0.1)
Auth + Club Onboarding. Everything depends on this.

#	Task	Spec
S1.1	Club onboarding wizard (5 steps)	Step 1: Credentials (signup — done), Step 2: Business Type (card grid), Step 3: Studio Setup (name, slug, city), Step 4: Create First Batch (skippable), Step 5: Invite First Members (skippable)
S1.2	Club creation — API + DB	POST /api/clubs — create clubs row + club_staff row (role: owner). Club starts verification_status: pending, listed: false
S1.3	Post-login routing	On login: if user has 1 club → go to /:clubSlug/dashboard. If 2+ clubs → show club picker. If only member → go to member portal. If no clubs → go to onboarding
S1.4	Dashboard layout [clubSlug]/layout.tsx	Async server component, single getUserProfile() call, passes { role, fullName, initials, clubSlug } to Sidebar + BottomNav
Sprint 2 — Member Management (P0.2)
#	Task	Spec
S2.1	Member list page	/:clubSlug/members — data table (desktop), card list (mobile). Filters: status, batch, plan. Search by name/phone. Pagination 25/page
S2.2	Single invite flow	/:clubSlug/members/invite — phone + optional name. Check if Zenzo user exists: if yes → create club_memberships (active); if no → create (pending_invite) + send WhatsApp invite link
S2.3	Bulk invite	CSV/Excel upload → validate phone numbers → preview → send invites → progress bar → results summary
S2.4	Member profile page	/:clubSlug/members/:memberId — header (avatar, name, status badge), tabs: Overview / Attendance / Payments / Progression
S2.5	Member status engine	Cron or webhook to transition active → overdue → expired based on payment due dates
S2.6	Edit / deactivate / delete member	Soft delete (status: deleted, deleted_at). History preserved. Actions menu on profile
S2.7	Invite token system	Token encodes: club_id + phone + expiry (30 days). On signup via invite link → auto-create membership, status pending_invite → active
Sprint 3 — Batches (P0.3)
#	Task	Spec
S3.1	Batch list	/:clubSlug/batches — card grid. Name, timing, days, member count, avg attendance, assigned coach
S3.2	Create/edit batch	Fields: name, start/end time (30-min picker), days (pill toggles), coach, max capacity, description
S3.3	Batch detail	Member list, stat cards, [Take Attendance] CTA, [+ Add Member to Batch]
S3.4	Assign member to batch	Searchable picker of members not yet in batch. Creates member_batches row
S3.5	Remove member from batch	Deletes member_batches row. Member stays in club
S3.6	Delete batch	If has members: warning dialog. Soft delete. member_batches rows removed. Attendance records preserved
Sprint 4 — Attendance (P0.4) — The Most Important Feature
#	Task	Spec
S4.1	Take Attendance screen	/:clubSlug/attendance/take/:batchId — full member list, toggle (Unmarked → Present → Absent), progress bar, haptic feedback, search
S4.2	Offline queue	IndexedDB saves every toggle immediately. Sync indicator (Synced / Saved locally / Syncing...). Auto-push on reconnect. Last-write-wins conflict
S4.3	Completion screen	Animated checkmark, summary (15 present · 3 absent), auto-navigate to batches after 2s
S4.4	Drop-in support	[+ Add Drop-in] during attendance. Searchable picker of non-batch members. is_drop_in: true on record. Does NOT permanently add to batch
S4.5	Edit window	Editable same day until midnight (IST). Lock after midnight. Reloads previous marks
S4.6	Attendance history	/:clubSlug/attendance/history — date × member grid (desktop), list per member (mobile). Filters: batch, date range. At-risk highlights (absent 3+ of last 5)
Sprint 5 — Payments (P0.5 + P0.6)
#	Task	Spec
S5.1	Fee plans CRUD	/:clubSlug/settings/plans — card grid. Create/edit: name, amount (₹), billing cycle (monthly/quarterly/half-yearly/annual/per-session)
S5.2	Assign plan to member	Dropdown on member profile. Sets club_memberships.plan_id, calculates next_due_date
S5.3	Overdue list	/:clubSlug/payments — list sorted by most overdue. Status badges, days overdue count
S5.4	Record payment	Modal: member (searchable), amount, method (cash/UPI/bank/other), date, reference, note. Creates payments row, updates membership status
S5.5	Payment history	Filterable by date range, method
S5.6	Razorpay payment link	Send link via WhatsApp to member. Money goes to club's Razorpay account directly
Sprint 6 — Dashboard (P0.7)
#	Task	Spec
S6.1	Owner dashboard	Revenue this month, active members, avg attendance %, overdue count. Needs attention: overdue fees, absent members, expiring memberships. Recent activity feed. Quick actions
S6.2	Coach dashboard	Today's batches only. One-tap to take attendance. No financial data
S6.3	Dashboard skeleton	DashboardSkeleton component with .skeleton-shimmer for loading state
Sprint 7 — WhatsApp + Settings (P0.8 + P0.9)
#	Task	Spec
S7.1	WhatsApp invite	On member invite → send signup link via Interakt. Template: "Hi! [Owner] has invited you to join [Club] on Zenzo. Sign up: [link]"
S7.2	WhatsApp welcome	Auto-send when pending_invite → active. Togglable in Settings
S7.3	Payment receipt	Auto-send on recordPayment(). Togglable
S7.4	Payment reminder	3 days before due + on due date. Togglable. Bulk send from overdue list
S7.5	Settings — Business profile	Name, type, city, logo upload, slug (with slug change warning)
S7.6	Settings — Terminology	members/students/athletes, batches/classes, belts/levels. Persisted in clubs.terminology jsonb. All UI labels swap dynamically
S7.7	Settings — Notifications	Toggle per notification type (invite, welcome, receipt, reminder, attendance alert)
S7.8	Settings — Staff management	Add/remove coaches, invite via WhatsApp. Owner cannot be deleted
Where to Start Right Now
Start with Sprint 0 (R1–R7). It's the smallest sprint (7 focused tasks) and unblocks everything. The existing code is partially working but on the wrong data model — shipping features on top of the wrong model means double work.

Recommended first session: R1 + R2 (DB enums + DB types) — these are pure TypeScript rewrites with no UI, about 150 lines total, and every other refactor depends on them.
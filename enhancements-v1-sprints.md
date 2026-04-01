# Zenzo — Enhancement Sprints v1

> Work through these sprints one by one. Mark each task `[x]` when complete.
> Order: BF → RC → PH → DA → OA → RP → SR → QR → SEC → PERF

---

## Sprint BF — Bug Fixes & Cleanup
> **Priority: IMMEDIATE** — one is a data corruption bug, rest are credibility killers.

- [x] **BF.1** — Fix PATCH `clubId` bug in `api/clubs/[clubId]/members/[memberId]/route.ts`
  - Uses `params.clubId` directly without resolving slug → UUID first. Silent data failures.
  - Fix: use resolved `clubId` UUID consistently throughout the handler (same as GET/DELETE paths in the same file)

- [x] **BF.2** — Remove phantom nav items from `sidebar.tsx` + `bottom-nav.tsx`
  - Reports, Communications, Progression links show in nav but are empty stubs
  - Fix: removed from all nav definitions (sidebar + bottom-nav). Pages still accessible by URL but not linked.

- [x] **BF.3** — Fix mobile nav priority in `bottom-nav.tsx`
  - Owner mobile now: Dashboard | Members | **Payments** | Attendance | More
  - More sheet: Batches | Plans | Staff | Settings
  - Coach mobile: Dashboard | Attendance | Members (no More needed)

- [x] **BF.4** — Remove invite step from onboarding wizard `onboarding/page.tsx`
  - Reduced to 3 steps: Business Type → Studio Setup → First Batch → Done
  - Removed all invitee state, handlers, and step 4 JSX
  - Completion screen is now step 4 (was step 5)

---

## Sprint RC — Refactor / Code Health
> **Priority: HIGH** — prevents future bugs before building on messy foundations.

- [x] **RC.1** — Split `portal-club-client.tsx` (917 lines) into 4 components
  - Extract: `<PortalHome>`, `<PortalAttendance>`, `<PortalPayments>`, `<PortalProfile>`
  - Each component should be under 200 lines
  - Tab shell stays in the parent file

- [x] **RC.2** — Extract `resolveClub(identifier)` utility to `lib/resolve-club.ts`
  - UUID-or-slug resolution pattern duplicated in 5+ API routes with identical logic
  - Single function: accepts UUID or slug, returns `{ clubId, club }` or throws

- [x] **RC.3** — Extract `apiResponse` helper to `lib/api-response.ts`
  - Currently every route has `NextResponse.json({ error: "..." }, { status: N })` boilerplate
  - Add: `apiResponse.unauthorized()`, `apiResponse.badRequest(msg)`, `apiResponse.notFound()`, `apiResponse.forbidden()`, `apiResponse.ok(data)`

- [x] **RC.4** — Extract validators to `packages/utils/src/validators.ts`
  - Phone normalization, slug validation, UUID detection duplicated across 10+ routes
  - Export: `isValidPhone(phone)`, `normalizePhone(phone)`, `isUUID(str)`, `isValidSlug(str)`

---

## Sprint PH — Phone-First Invite System
> **Priority: CRITICAL** — email invites in India = ~16% open rate. This is the #1 conversion bottleneck.

- [ ] **PH.1** — Flip invite form field order and requirements
  - Phone = required (primary identifier)
  - Name = required
  - Email = optional
  - File: `members/invite/_components/invite-form.tsx`

- [ ] **PH.2** — Generate WhatsApp deep link invite (zero Interakt dependency)
  - On invite submit, if user not on Zenzo: show "Invite via WhatsApp" button
  - Link: `wa.me/91{phone}?text=Hi {name}, you've been invited to join {clubName} on Zenzo. Sign up here: {signupUrl}?token={inviteToken}`
  - File: `members/invite/_components/invite-form.tsx` + `POST /api/members/invite`

- [ ] **PH.3** — Update `POST /api/members/invite` for phone-first flow
  - Lookup by phone first (existing logic), email becomes optional secondary
  - When user not found: create invite token, return `{ status: 'not_on_zenzo', whatsappLink, inviteToken }`
  - Email invite as optional fallback only if email is provided

- [ ] **PH.4** — Update invite form UI result state
  - Replace current "not on Zenzo" error state with actionable CTA
  - Show: "Send invite via WhatsApp" button (opens wa.me link) + optional "Send email invite" secondary action

- [ ] **PH.5** — Update CSV bulk invite to phone-first columns
  - Column order: `phone` (required), `name` (required), `email` (optional)
  - Update parser in `members/invite/csv/_components/csv-invite-form.tsx`
  - Update preview table column order

---

## Sprint DA — Dashboard Alive
> **Priority: HIGH** — makes the product feel sticky. Daily return habit = retention.

- [ ] **DA.1** — Add delta indicators to KPI cards
  - Owner dashboard stat cards: show "+ N this week" or "▲ 12% vs last month"
  - File: `dashboard/_components/owner-dashboard.tsx` + `dashboard/_components/dashboard-ui.tsx` (update `StatCard`)

- [ ] **DA.2** — Contextual greeting on dashboard
  - Replace static "Welcome back" with: "Good morning {name}, {N} members are overdue and {N} batches today"
  - Pull counts from existing dashboard queries — no extra DB call
  - File: `dashboard/_components/owner-dashboard.tsx`

- [ ] **DA.3** — Activity feed widget (last 10 events)
  - Show recent events: "Rahul paid ₹5,000 · 2h ago", "Priya marked absent · 9 AM"
  - Sources: `payments` table (recent 5) + `attendance_records` (recent absent, today)
  - File: new `dashboard/_components/activity-feed.tsx`

- [ ] **DA.4** — "Updated X ago" timestamp on KPI section
  - Small text below KPI grid: "Last updated · 2 minutes ago"
  - Client component, uses `Date.now()` on mount

---

## Sprint OA — Offline Attendance
> **Priority: HIGH** — the core value prop. If attendance fails once, coach returns to paper.

- [ ] **OA.1** — Next.js PWA setup
  - Add `next-pwa` or manual service worker via `public/sw.js`
  - Cache the attendance take page shell

- [ ] **OA.2** — IndexedDB queue for pending attendance submissions
  - On `POST /api/attendance/[batchId]` failure (network error): save payload to IndexedDB
  - Key: `attendance-queue`, value: array of `{ batchId, records, timestamp }`

- [ ] **OA.3** — Auto-sync on reconnect
  - Listen to `window.addEventListener('online', ...)` in attendance client
  - On reconnect: drain IndexedDB queue → replay each pending submission

- [ ] **OA.4** — Sync status indicator UI
  - Show banner on attendance page: "✓ All synced" (green) / "⏳ 3 records pending sync" (amber)
  - File: `attendance/take/[batchId]/_components/take-attendance-client.tsx`

- [ ] **OA.5** — Conflict resolution on sync
  - If record already exists server-side (`ON CONFLICT DO NOTHING` behavior): skip silently
  - If record was updated server-side while offline: server wins, log the conflict

---

## Sprint RP — Razorpay Payment Collection
> **Priority: HIGH** — "Record Payment" is a digital notebook. Real value = actual money collection.

- [ ] **RP.1** — Razorpay client setup
  - Add `razorpay` package to `apps/web`
  - Create `lib/razorpay.ts` with server-side client
  - Env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

- [ ] **RP.2** — Generate payment links API
  - `POST /api/payments/link` — accepts `membershipId`, creates Razorpay payment link
  - Returns `{ paymentLinkUrl, paymentLinkId }`
  - Store `paymentLinkId` in payments table for reconciliation

- [ ] **RP.3** — Razorpay webhook handler
  - `POST /api/webhooks/razorpay` — verify signature, handle `payment_link.paid` event
  - Auto-record payment in `payments` table + advance `next_due_date` + update membership status
  - Verify webhook signature with `RAZORPAY_WEBHOOK_SECRET`

- [ ] **RP.4** — "Send Payment Link" button in UI
  - Add to member profile Overview tab: "Send Payment Link" button (alongside existing "Record Payment")
  - Add to overdue members list: inline "Send Link" action
  - Generates Razorpay link → opens WhatsApp with pre-filled message containing link

- [ ] **RP.5** — Update Record Payment UI to show both paths
  - "Record Cash/UPI" (existing manual flow)
  - "Send Razorpay Link" (new — generates link + copies/shares it)

---

## Sprint SR — Smart Payment Reminders
> **Priority: MEDIUM** — the "money printer" feature. No competitor does automated escalation.

- [ ] **SR.1** — Reminder schedule logic
  - States: Day -3 (gentle), Day 0 (due today), Day +3 (overdue warn), Day +7 (escalate to owner)
  - Function: `getReminderState(nextDueDate: string): 'upcoming' | 'due_today' | 'overdue_3' | 'overdue_7' | null`

- [ ] **SR.2** — Daily reminder cron job
  - `GET /api/cron/send-reminders` — Bearer token auth (same pattern as expire-memberships)
  - Queries memberships in each reminder window, generates WhatsApp links, logs to `notifications_log`
  - Add to `vercel.json` schedule: 8:00 UTC daily

- [ ] **SR.3** — WhatsApp reminder message templates
  - Day -3: "Hi {name}, your ₹{amount} fee at {clubName} is due in 3 days."
  - Day 0: "Hi {name}, your fee of ₹{amount} is due today."
  - Day +3: "Hi {name}, your membership at {clubName} is overdue by 3 days."
  - Each generates a `wa.me` link (no Interakt needed for now)

- [ ] **SR.4** — Owner escalation notification
  - Day +7: post to `notifications_log` + surface in dashboard "Overdue Members" section with "7+ days" badge
  - Optional WhatsApp to owner (wa.me link, not automated — owner triggers manually)

- [ ] **SR.5** — Respect notification settings
  - Check `notification_settings` row per club before queuing reminders
  - Toggle: `payment_reminders_enabled` (already in DB schema)

---

## Sprint QR — QR Code Attendance
> **Priority: MEDIUM** — the "10x" differentiator. No competitor has this.

- [ ] **QR.1** — QR code generation API
  - `GET /api/batches/[batchId]/qr` — returns signed URL token valid for today only
  - Token: `JWT { batchId, date: today, exp: end-of-day }` signed with `QR_SECRET`
  - Return: `{ checkInUrl: "/checkin?b={batchId}&t={token}" }`

- [ ] **QR.2** — Check-in page (public, no login required)
  - `/checkin` — member enters phone number
  - Validates token (not expired, batchId matches), looks up membership by phone, marks present
  - Shows: "✓ Attendance marked! Welcome, {name}" or error state
  - File: `app/checkin/page.tsx`

- [ ] **QR.3** — QR display on batch detail page
  - "Show QR Code" button on `batches/[batchId]` → fullscreen modal with QR
  - QR renders via `qrcode.react` package
  - Auto-refreshes token each day (or shows "expired" with refresh button)
  - File: `batches/[batchId]/_components/batch-detail-client.tsx`

- [ ] **QR.4** — Real-time attendance count update
  - Attendance count on batch detail page auto-refreshes every 30 seconds while QR modal is open
  - Use `setInterval` + re-fetch (simple polling, no Supabase Realtime needed for v1)

- [ ] **QR.5** — QR security
  - Token is date-scoped (expires at midnight)
  - Rate limit: max 1 check-in per membership per batch per day (server enforced)
  - Invalid/expired token shows clear error, not a blank page

---

## Sprint SEC — Security Hardening
> **Priority: MEDIUM** — not urgent for beta, critical before public launch.

- [ ] **SEC.1** — Rate limiting on auth endpoints
  - Add Upstash Redis rate limiting to: `/api/auth/*` (login, signup, reset), `/api/members/invite`
  - Limit: 5 requests/minute per IP on auth, 10/minute on invite
  - Return `429 Too Many Requests` with `Retry-After` header

- [ ] **SEC.2** — Input length validation across all routes
  - Max lengths: `name` (100), `description` (1000), `note` (500), `phone` (15), `email` (254), `slug` (50)
  - Add to `packages/utils/src/validators.ts` (from RC.4)
  - Apply at API route entry points — not in DB layer

- [ ] **SEC.3** — Admin client audit
  - Find every usage of `createSupabaseAdminClient()` across all routes
  - Add inline comment on each: `// admin: RLS bypassed because [reason]`
  - Ensure none are reachable without auth check upstream

- [ ] **SEC.4** — Confirm `CRON_SECRET` not in source control
  - Verify `.gitignore` covers `.env.local`
  - Ensure `vercel.json` cron config uses env var reference, not hardcoded value
  - Add `CRON_SECRET=` placeholder to `.env.example`

---

## Sprint PERF — Performance
> **Priority: LOW** — important at scale, not blocking for beta.

- [ ] **PERF.1** — Attendance history: add pagination + default to today
  - Currently loads last 30 days of ALL batches — potentially 15,000+ records
  - Fix: default view = today, date picker to navigate, server-side pagination (20 sessions/page)
  - File: `attendance/history/page.tsx` + `_components/attendance-history-client.tsx`

- [ ] **PERF.2** — Dashboard query optimization
  - Owner dashboard makes 4-6 parallel Supabase queries per load
  - Investigate: denormalized `club_stats` table updated by DB triggers (total_active, total_overdue, month_revenue)
  - Target: dashboard < 500ms cold load

- [ ] **PERF.3** — Next.js `<Image>` for club logos
  - Replace raw Supabase Storage `<img>` tags with Next.js `<Image>` component
  - Configure `next.config.js` with Supabase storage hostname
  - Automatic WebP conversion + responsive sizing

- [ ] **PERF.4** — CSV invite batch API
  - Current: 50-member CSV = 50 sequential HTTP calls
  - Fix: `POST /api/members/invite/bulk` accepts array, returns per-row results in one response
  - Update `csv-invite-form.tsx` to use bulk endpoint

---

## Summary

| Sprint | Focus | Tasks | Status |
|---|---|---|---|
| BF | Bug Fixes & Cleanup | 4 | ✅ Complete |
| RC | Refactor / Code Health | 4 | ✅ Complete |
| PH | Phone-First Invites | 5 | 🔴 Not Started |
| DA | Dashboard Alive | 4 | 🔴 Not Started |
| OA | Offline Attendance | 5 | 🔴 Not Started |
| RP | Razorpay Payments | 5 | 🔴 Not Started |
| SR | Smart Reminders | 5 | 🔴 Not Started |
| QR | QR Attendance | 5 | 🔴 Not Started |
| SEC | Security Hardening | 4 | 🔴 Not Started |
| PERF | Performance | 4 | 🔴 Not Started |

**Total tasks: 45**

---

## Deprioritized (not deleted)

| Feature | File(s) | Decision |
|---|---|---|
| `/explore` + `/clubs/[slug]` | `app/explore/`, `app/clubs/[slug]/` | Keep working, deprioritize. Revisit at 50+ clubs. |
| Consumer portal heatmap | `portal-club-client.tsx` | Simplify to progress bar in Sprint RC.1 |
| Achievement badges | `portal-club-client.tsx` | Keep code, not a priority |
| Progression tab | `members/[memberId]/` | Mark as "Coming Soon" in Sprint BF.2 |
| Reports page | `reports/page.tsx` | Mark as "Coming Soon" in Sprint BF.2 |
| Communications page | `communications/` (if exists) | Mark as "Coming Soon" in Sprint BF.2 |

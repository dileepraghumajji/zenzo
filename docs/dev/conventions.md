# Zenzo Code Conventions
*Reference this file when making any implementation decision. When in doubt, check here first.*

---

## File Naming

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `MemberList.tsx`, `AttendanceToggle.tsx` |
| Utility functions | camelCase | `formatCurrency.ts`, `slugify.ts` |
| API routes | kebab-case folders | `app/api/clubs/[clubId]/route.ts` |
| DB migrations | sequential numbered | `001_create_users.sql`, `002_create_clubs.sql` |
| Hooks | camelCase with `use` prefix | `useAttendanceQueue.ts` |
| Server actions | camelCase in `lib/actions/` | `lib/actions/members.ts` |
| Zod schemas | camelCase with `Schema` suffix | `inviteMemberSchema`, `createBatchSchema` |

---

## Folder Structure

```
apps/web/src/
  app/
    (auth)/                         # Auth group — no layout nesting
      login/page.tsx
      signup/page.tsx
      forgot-password/page.tsx
    (dashboard)/[clubSlug]/         # Club-scoped dashboard pages
      layout.tsx                    # Async SC: single profile fetch, role guard
      dashboard/page.tsx
      members/
        page.tsx                    # Member list
        invite/page.tsx             # Invite member
        [memberId]/page.tsx         # Member profile
      batches/
        page.tsx
        new/page.tsx
        [batchId]/page.tsx
      attendance/
        take/[batchId]/page.tsx     # THE ritual screen
        history/page.tsx
      payments/
        page.tsx                    # Overdue list (default tab)
        record/page.tsx
        history/page.tsx
      reports/page.tsx
      settings/
        page.tsx                    # Business profile
        notifications/page.tsx
        customization/page.tsx
        payment-gateway/page.tsx
        staff/page.tsx
    clubs/                          # Club picker (multi-club owners)
      page.tsx
    clubs/[slug]/page.tsx           # Public listing page
    m/[token]/page.tsx              # Member portal
    onboarding/
      page.tsx                      # Onboarding wizard
    api/                            # API Route Handlers
      auth/
        signup/route.ts
        verify-otp/route.ts
        profile/route.ts
        logout/route.ts
      onboarding/
        club/route.ts
        slug-check/route.ts
      clubs/[clubId]/
        route.ts
        staff/route.ts
        members/route.ts
        members/invite/route.ts
        members/bulk-invite/route.ts
        members/[memberId]/route.ts
        batches/route.ts
        batches/[batchId]/route.ts
        batches/[batchId]/members/route.ts
        fee-plans/route.ts
        fee-plans/[planId]/route.ts
        attendance/route.ts
        attendance/[batchId]/today/route.ts
        payments/route.ts
        payments/overdue/route.ts
        payments/send-reminders/route.ts
        reports/revenue/route.ts
        reports/attendance/route.ts
        reports/members/route.ts
        reports/retention/route.ts
        notification-settings/route.ts
        notifications-log/route.ts
      cron/
        update-membership-statuses/route.ts
        send-payment-reminders/route.ts
        send-expiry-warnings/route.ts
      portal/[token]/
        route.ts
        attendance/route.ts
        payments/route.ts

  components/
    ui/                             # Shadcn/UI primitives — do NOT modify these
    layout/
      sidebar.tsx                   # Desktop sidebar + SidebarSkeleton
      bottom-nav.tsx                # Mobile bottom nav + MoreSheet
      top-bar.tsx                   # Breadcrumb + search + avatar dropdown
    forms/                          # Form components
      MemberInviteForm.tsx
      PaymentForm.tsx
      BatchForm.tsx
    tables/                         # Table components
    attendance/                     # Attendance-specific components
      AttendanceToggle.tsx
      AttendanceGrid.tsx

  lib/
    supabase/
      server.ts                     # SSR Supabase client (Server Components)
      client.ts                     # Browser Supabase client (Client Components)
      admin.ts                      # Service role client (cron jobs only)
    auth.ts                         # getUserProfile(clubSlug) — the ONE profile fetch
    utils/
      format.ts                     # formatCurrency, formatDate
      validation.ts                 # All Zod schemas
    hooks/                          # Custom React hooks
      useAttendanceQueue.ts         # IndexedDB offline queue
    actions/                        # Server Actions
      members.ts
      attendance.ts
      payments.ts
```

---

## Component Patterns

### Server Component (default — use this unless you need interactivity)

```tsx
// app/(dashboard)/[clubSlug]/members/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function MembersPage({
  params,
}: {
  params: { clubSlug: string }
}) {
  // Create client directly in the function — never pass it through helpers
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get club_id from slug via club_staff
  const { data: staff } = await supabase
    .from('club_staff')
    .select('club_id, role, clubs(id, name, slug)')
    .eq('user_id', user.id)
    .eq('clubs.slug', params.clubSlug)
    .single()

  if (!staff) redirect('/login')

  const { data: members } = await supabase
    .from('club_memberships')
    .select('id, status, joined_at, users(id, full_name, phone)')
    .eq('club_id', staff.club_id)
    .is('deleted_at', null)

  return <MemberList members={members ?? []} role={staff.role} />
}
```

### Client Component (only when you need hooks, events, or browser APIs)

```tsx
// components/attendance/AttendanceToggle.tsx
'use client'

import { useState } from 'react'
import { AttendanceStatus } from '@zenzo/database/enums'

interface AttendanceToggleProps {
  membershipId: string
  initialStatus: 'unmarked' | 'present' | 'absent'
  onToggle: (membershipId: string, status: 'present' | 'absent' | 'unmarked') => void
}

export function AttendanceToggle({ membershipId, initialStatus, onToggle }: AttendanceToggleProps) {
  const [status, setStatus] = useState(initialStatus)

  function handleTap() {
    const next =
      status === 'unmarked' ? 'present' :
      status === 'present' ? 'absent' : 'unmarked'
    setStatus(next)
    navigator.vibrate?.(10)
    onToggle(membershipId, next)
  }

  return (
    <button
      onClick={handleTap}
      className="h-12 w-12 rounded-full transition-all duration-150 active:scale-95"
      // ... styles based on status
    />
  )
}
```

### Server Actions (for mutations from Client Components)

```tsx
// lib/actions/members.ts
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { inviteMemberSchema } from '@/lib/utils/validation'

export async function inviteMember(clubId: string, formData: FormData) {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = inviteMemberSchema.safeParse({
    phone: formData.get('phone'),
    name: formData.get('name'),
  })
  if (!parsed.success) throw new Error('Invalid input')

  // ... check phone, create membership, send WhatsApp

  revalidatePath(`/[clubSlug]/members`, 'page')
}
```

---

## Data Fetching Patterns

### DO: Fetch in Server Components (preferred)

```tsx
export default async function Page() {
  const data = await fetchData()         // runs on server
  return <ClientComponent data={data} /> // client component receives data as props
}
```

### DON'T: Fetch in Client Components via useEffect

```tsx
// Avoid this pattern — it causes loading flicker and is harder to type
'use client'
useEffect(() => {
  fetch('/api/members').then(r => r.json()).then(setMembers)  // ← avoid
}, [])
```

### Exception: Real-time updates (attendance sync, notifications)

```tsx
// OK for real-time subscriptions
'use client'
const channel = supabase.channel('attendance-sync')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'attendance_records',
    filter: `club_id=eq.${clubId}`,
  }, payload => {
    // update local state
  })
  .subscribe()
```

---

## API Route Patterns

Every route handler follows this exact structure: auth check → club access check → process.

```tsx
// app/api/clubs/[clubId]/payments/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { recordPaymentSchema } from '@/lib/utils/validation'

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  // 1. Auth check
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Club access check (owner only for payments)
  const { data: staff } = await supabase
    .from('club_staff')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', params.clubId)
    .eq('role', 'owner')
    .single()
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Validate input
  const body = await request.json()
  const parsed = recordPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  // 4. Process (RLS provides belt-and-suspenders security)
  const { data, error } = await supabase
    .from('payments')
    .insert({
      club_id: params.clubId,
      membership_id: parsed.data.membershipId,
      amount_paise: parsed.data.amountPaise,
      method: parsed.data.method,
      payment_date: parsed.data.paymentDate,
      reference: parsed.data.reference ?? null,
      recorded_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

---

## Validation (Zod)

All schemas live in `apps/web/src/lib/utils/validation.ts`.

```tsx
import { z } from 'zod'

export const inviteMemberSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number (+91 followed by 10 digits)'),
  name: z.string().min(1).optional(),
})

export const createBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  days: z.array(z.enum(['mon','tue','wed','thu','fri','sat','sun'])).min(1, 'Select at least one day'),
  coachId: z.string().uuid().optional(),
  maxCapacity: z.number().int().positive().optional(),
})

export const recordPaymentSchema = z.object({
  membershipId: z.string().uuid(),
  amountPaise: z.number().int().positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'other']),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  reference: z.string().optional(),
  sendWhatsApp: z.boolean().default(true),
})

export const createFeePlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  amountPaise: z.number().int().positive('Amount must be greater than 0'),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual', 'per_session']),
  description: z.string().optional(),
})
```

---

## Error Handling

Consistent error shape across all API routes:

```tsx
// Success
return NextResponse.json(data, { status: 200 })
return NextResponse.json(data, { status: 201 })  // created

// Error shapes
type ApiError = {
  error: string
  code?: string
  details?: Record<string, string[]>  // field-level errors from Zod
}

// 400 — validation
return NextResponse.json({
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: { phone: ['Invalid Indian phone number'] },
}, { status: 400 })

// 401 — not authenticated
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 403 — authenticated but not authorized
return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// 404 — not found
return NextResponse.json({ error: 'Member not found', code: 'NOT_FOUND' }, { status: 404 })

// 409 — conflict
return NextResponse.json({
  error: 'This person is already a member',
  code: 'ALREADY_MEMBER',
}, { status: 409 })

// 500 — server error
return NextResponse.json({ error: error.message }, { status: 500 })
```

---

## Styling

- **Tailwind CSS only.** No separate CSS files, no styled-components, no CSS modules (exception: `globals.css` for CSS variables and `.skeleton-shimmer`).
- **Shadcn/UI** components as the base. Customize via Tailwind classes on top. Do NOT modify the base Shadcn primitives in `components/ui/`.
- **Mobile-first:** base styles for mobile, `md:` for tablet, `lg:` for desktop.
- **Design tokens from `globals.css`:**
  - Primary: `#F97316` (orange-500) — mapped to CSS var `--primary`
  - Neutral: slate scale
  - Success: green-500
  - Error: red-500
- **Font:** Inter. Min 13px. Never go below 13px.
- **Spacing:** 4px base unit. Use Tailwind's default scale (`p-4` = 16px).
- **Borders:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs.

### Loading states (never spinners)

```tsx
// Always shimmer skeletons, never spinners
// Skeleton lives alongside its component

// sidebar.tsx
export function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg skeleton-shimmer" />
      ))}
    </div>
  )
}
```

---

## Naming Conventions

### Variables and functions
```ts
const memberCount = 10                  // camelCase
const clubSlug = params.clubSlug        // camelCase — always clubSlug, never tenantSlug
function calculateNextDueDate() {}      // camelCase
```

### Components
```tsx
function MemberCard() {}                // PascalCase
function AttendanceToggle() {}          // PascalCase
```

### Database columns
```sql
club_id, created_at, billing_cycle_type  -- snake_case
```

### URL routes
```
/ravis-fitness/members              -- kebab-case
/clubs/downtown-yoga                -- kebab-case
```

### Constants
```ts
const MAX_RETRY_ATTEMPTS = 3        // UPPER_SNAKE_CASE
const OTP_EXPIRY_MINUTES = 5        // UPPER_SNAKE_CASE
```

### Types and interfaces
```ts
interface ClubMembership {}          // PascalCase
type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other'  // PascalCase
```

### Enum objects (from `@zenzo/database/enums`)
```ts
// Import, never hard-code strings
import { StaffRole, MembershipStatus, BillingCycle } from '@zenzo/database/enums'

// Use
if (role === StaffRole.Owner) { ... }       // not "owner"
if (status === MembershipStatus.Active) { } // not "active"
```

### Route params
```ts
// Always destructure with the correct name
const { clubSlug } = params    // not tenantSlug, not slug
const { memberId } = params
const { batchId } = params
```

---

## Supabase Query Rules

### Always create the client directly in the calling function

```ts
// CORRECT
export async function getMembers(clubId: string) {
  const supabase = createSupabaseServerClient()  // ← create here
  const { data } = await supabase
    .from('club_memberships')
    .select('id, status, users(full_name, phone)')
    .eq('club_id', clubId)
    .is('deleted_at', null)
  return data
}

// WRONG — generic collapses, data becomes `never`
export async function getMembers(clubId: string, supabase: SupabaseClient) {
  const { data } = await supabase.from('club_memberships').select(...)
  // data is `never`
}
```

### Always filter soft-deleted records

```ts
// Batches
.is('deleted_at', null)

// Fee plans
.is('deleted_at', null)

// Memberships (use status filter, not deleted_at directly)
.neq('status', 'deleted')
```

### Explicit column selects

```ts
// CORRECT — explicit columns
.select('id, full_name, phone, email')
.select('id, status, joined_at, users(id, full_name, phone)')

// ONLY OK after running `supabase gen types typescript --local`
.select('*')
```

### Use getUser(), not getSession()

```ts
// CORRECT — validates JWT against Supabase auth server
const { data: { user } } = await supabase.auth.getUser()

// WRONG — trusts local cookie without re-validation
const { data: { session } } = await supabase.auth.getSession()
```

---

## Currency Handling

```ts
// Storage: always paise (integer)
// ₹1,500 is stored as 150000 (not 1500.0)

// Display: always use formatCurrency from @zenzo/utils
import { formatCurrency } from '@zenzo/utils'
formatCurrency(150000)  // → "₹1,500"

// Input: user types ₹ amount, multiply by 100 before storing
const amountPaise = Math.round(parseFloat(inputValue) * 100)

// NEVER store floats. NEVER use ₹${amount} directly in JSX.
```

---

## Date and Time

```ts
// Dates stored as UTC in the DB (TIMESTAMPTZ)
// Displayed in IST (Asia/Kolkata) for Phase 1

// Date format for display: DD MMM YYYY
import { formatDate } from '@zenzo/utils'
formatDate(date)  // → "23 Mar 2026"

// Time format: 12-hour
// "6:00 AM", "7:30 PM"

// Phone numbers stored with country code
// "+919876543210" — always +91 prefix
```

---

## Attendance Offline Queue (IndexedDB)

The offline queue is critical. Attendance toggles MUST work without network. The implementation pattern:

```ts
// lib/hooks/useAttendanceQueue.ts
// Every toggle saves to IndexedDB IMMEDIATELY
// Background sync pushes to server when online
// Never await network for a toggle — it must be instant

// IndexedDB store: "attendance_queue"
// Key: `${batchId}:${membershipId}:${date}`
// Value: { membershipId, batchId, date, status, markedAt, synced: false }

// On each toggle:
// 1. Update React state (instant)
// 2. Save to IndexedDB (instant)
// 3. Try to POST to /api/clubs/[clubId]/attendance (async, may fail)
// 4. On success: mark record synced: true in IndexedDB
// 5. On failure: leave as synced: false, retry when online

// Sync indicator based on IndexedDB state, not network state
```

---

## Testing

**Framework:** Vitest + React Testing Library

**What to test:**
- Server actions: happy path, auth failure, validation failure, edge cases
- Complex Client Components: AttendanceToggle (cycle logic), MemberInviteForm (validation)
- Utility functions: formatCurrency, calculateNextDueDate

**What NOT to test:**
- Simple display components
- Pages and layouts
- Supabase queries directly (test via API routes)

**File location:** `__tests__/` folder mirroring `src/` structure

```
__tests__/
  actions/
    members.test.ts
    payments.test.ts
  api/
    clubs/[clubId]/payments.test.ts
  components/
    attendance/AttendanceToggle.test.tsx
  utils/
    formatCurrency.test.ts
```

**Each server action/API route needs at minimum:**
1. Happy path test
2. Auth failure test (no token)
3. Authorization failure test (wrong club)
4. Validation failure test (bad input)

---

## Pre-Merge Checklist

Before merging any branch:
```
□ pnpm typecheck — zero errors
□ pnpm lint — zero warnings
□ Dev server starts without errors (pnpm dev)
□ Happy path works manually (test the feature)
□ Mobile view looks right (Chrome DevTools responsive mode)
□ Error states show correctly (try invalid inputs)
□ Loading states show (throttle network in DevTools)
□ No console errors in browser
□ Supabase types regenerated if any migrations were added
□ CLAUDE.md Session Log updated
```

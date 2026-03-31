# Zenzo — Development with Claude Code: Complete Guide
*How to build a production SaaS with a coding agent. Read this before writing any code.*

---

# Table of Contents

1. [The Reality of Building with a Coding Agent](#1-the-reality)
2. [Documentation Architecture — What Files to Maintain](#2-documentation-architecture)
3. [CLAUDE.md — The Most Important File in Your Repo](#3-claudemd)
4. [Git Workflow](#4-git-workflow)
5. [Sprint Execution Process](#5-sprint-execution-process)
6. [Code Conventions Document](#6-code-conventions)
7. [Testing Strategy](#7-testing-strategy)
8. [Quality Assurance Without a Human Dev Team](#8-quality-assurance)
9. [Prompt Engineering for Claude Code](#9-prompt-engineering)
10. [Common Failure Modes & How to Avoid Them](#10-common-failure-modes)
11. [Your Role as the Product Owner + QA](#11-your-role)
12. [Environment & DevOps Setup](#12-environment-setup)
13. [Security Checklist](#13-security-checklist)
14. [Pre-Development Checklist](#14-pre-development-checklist)

---

# 1. The Reality of Building with a Coding Agent

## What Claude Code Is Good At
- Writing code from clear specs (your blueprint)
- Following established patterns consistently
- Generating boilerplate (migrations, CRUD, API routes)
- Implementing UI from design specs
- Writing tests when given clear requirements
- Refactoring and fixing bugs when shown the problem
- Working within a defined architecture

## What Claude Code Struggles With
- Maintaining context across very long sessions (context window limits)
- Remembering decisions made 50 messages ago
- Knowing the current state of your codebase after many changes
- Making product decisions (that's YOUR job)
- Testing its own work end-to-end (it can't click through a browser)
- Managing state across files it hasn't recently viewed
- Debugging issues that span many files without being shown each one

## The Key Insight
**Claude Code is a very fast, very skilled developer who has amnesia between sessions and sometimes within long sessions.** Your job is to be the memory, the QA, the product manager, and the architect. The documentation you maintain IS the developer's brain between sessions.

---

# 2. Documentation Architecture — What Files to Maintain

## File Structure
```
docs/
  blueprint.md              ← Product blueprint (you have this)
  design/                   ← UI/UX specs (you have these — 16 files)
    00-design-philosophy.md
    01-design-system.md
    ...
  
  dev/                      ← NEW: Development documentation
    conventions.md           ← Code conventions & patterns
    api-contracts.md         ← API route specs (input/output/errors)
    db-migrations-log.md     ← Record of every migration run
    testing-guide.md         ← How to write and run tests
    environment.md           ← Env vars, services, setup instructions
    deployment.md            ← How to deploy, Vercel config
    changelog.md             ← What changed, when, why
    known-issues.md          ← Bugs and workarounds the agent should know
    
CLAUDE.md                    ← Agent context file (root of repo)
```

## Why Each File Matters

### CLAUDE.md (Section 3 below — detailed)
The agent reads this at the start of every session. It's the "briefing document." If something isn't here, the agent doesn't know it.

### docs/dev/conventions.md
Prevents the agent from making inconsistent choices. "Should I use `async/await` or `.then()`?" "Should I put this in a Server Component or Client Component?" "How should I name this file?" — all answered here.

### docs/dev/api-contracts.md
Defines every API route before building it. The agent can implement routes precisely when it knows the expected input, output, and error shapes. Without this, every route is a guess.

### docs/dev/db-migrations-log.md
Critical. The agent can't remember what migrations it ran last session. This file tells it "these tables exist, these columns were added, don't recreate them."

### docs/dev/changelog.md
Session-by-session log of what was built. The agent reads this to understand "where are we?" before starting work.

### docs/dev/known-issues.md
Things that are broken but not fixed yet. Prevents the agent from re-introducing bugs or working around issues you've already identified.

---

# 3. CLAUDE.md — The Most Important File in Your Repo

## Current Problems with Your CLAUDE.md
Your current CLAUDE.md is good for context but needs restructuring for Claude Code specifically. Here's what the ideal CLAUDE.md looks like:

## Structure of an Optimal CLAUDE.md

```markdown
# Zenzo — Agent Context

## CRITICAL RULES (read these first, every session)
- Never modify migration files that have already been run
- Always run `supabase gen types` after any migration
- Never commit .env files
- All amounts in paise (₹1 = 100). Use formatCurrency() for display.
- Server Components by default. "use client" ONLY when the component needs:
  hooks, event handlers, browser APIs, or state
- After completing any task, update docs/dev/changelog.md
- Before starting any task, read the relevant design doc in docs/design/

## What is Zenzo
[Brief — 2-3 lines max]

## Tech Stack
[Exact versions, not ranges]

## Repo Layout
[Current, accurate file tree — update this every session]

## Database State
[Which tables exist, last migration number]

## What's Been Built (Current State)
[Checklist: what works, what doesn't]

## What's In Progress
[Current sprint, current task]

## What's Next
[Next task after current one]

## Key Patterns to Follow
[Code patterns with examples — see Section 6]

## Known Issues
[Bugs the agent should know about]

## Commands Reference
[How to run dev server, run tests, generate types, deploy]
```

## Rules for Maintaining CLAUDE.md

1. **Update it after every session.** This is non-negotiable. After Claude Code finishes a session, ask it to update CLAUDE.md with what it built.

2. **Keep it under 500 lines.** Claude Code reads this every time. If it's too long, it skips or forgets parts. Be concise.

3. **Current state must be accurate.** If CLAUDE.md says "Members CRUD is done" but it's actually broken, the agent will skip fixing it and move on.

4. **Include exact file paths.** Not "the auth middleware" but "`apps/web/src/middleware.ts`".

5. **Include exact commands.** Not "run the dev server" but "`cd apps/web && pnpm dev`".

6. **Put CRITICAL RULES at the top.** The agent is most likely to read and follow things at the very top of CLAUDE.md.

---

# 4. Git Workflow

## Branch Strategy
```
main                    ← production (deployed to Vercel)
  └── dev               ← development (all work merges here first)
       ├── sprint-1/auth
       ├── sprint-1/onboarding
       ├── sprint-2/members
       ├── sprint-3/batches
       └── ...
```

## Rules

### One Branch Per Feature/Sprint Task
```
Every task from the blueprint gets its own branch:
  sprint-1/auth-signup
  sprint-1/auth-login
  sprint-1/auth-otp
  sprint-2/member-invite
  sprint-2/member-list
  ...

Why: If Claude Code breaks something on one branch, you can abandon it 
without losing work from other branches.
```

### Commit Often, Commit Small
```
Tell Claude Code explicitly:
  "After completing each sub-task, commit with a clear message."

Good: "feat: add member invite form with phone validation"
Bad: "update stuff"
Bad: One massive commit with 40 files changed
```

### Review Before Merging
```
You (the human) review every branch before merging to dev.
Even if you can't read every line of code, you should:
  1. Pull the branch
  2. Run the dev server
  3. Click through the feature manually
  4. Check if it matches the design spec
  5. If it works → merge to dev
  6. If it doesn't → create a new session with Claude Code to fix it
```

### Tag Working States
```
When dev is stable and features work:
  git tag v0.1.0-auth
  git tag v0.2.0-members
  git tag v0.3.0-batches

This gives you rollback points if a future session breaks things.
```

---

# 5. Sprint Execution Process

## The Session Workflow

### Before Each Claude Code Session
```
1. Decide: What specific task are you building this session?
   (Not "build member management" — too big.
    Yes "build the member invite form with WhatsApp integration")

2. Gather the docs Claude Code needs:
   - CLAUDE.md (it reads this automatically)
   - The relevant design doc (e.g., 06-screens-members.md)
   - The relevant section of the blueprint
   - Any existing code it needs to reference

3. Pull latest code. Make sure dev server runs.

4. Create a branch:
   git checkout -b sprint-2/member-invite-form
```

### Starting a Claude Code Session
```
Your opening prompt should include:

1. CONTEXT: "We're building Zenzo, a membership management SaaS. 
   Read CLAUDE.md for full context."

2. TASK: "In this session, build [specific feature]. 
   Here's the spec: [paste relevant blueprint section]"

3. DESIGN: "Follow the design in docs/design/[file].md"

4. CONSTRAINTS: "Use existing patterns from [reference file]. 
   Don't modify [these files]. Test with [these steps]."

5. OUTPUT: "When done, update CLAUDE.md and docs/dev/changelog.md 
   with what you built."
```

### During the Session
```
- Keep sessions focused: ONE feature per session
- If the session gets long (50+ messages), context degrades
  → Start a new session with fresh context
- If Claude Code goes in a wrong direction:
  → Stop it immediately. "Stop. That approach won't work because [reason]. 
     Instead, do [correct approach]."
- Ask Claude Code to explain its approach BEFORE writing code for complex features
- Have it commit after each sub-task completes
```

### After Each Session
```
1. Review the code changes (git diff)
2. Run the dev server and manually test
3. If it works:
   - Merge branch to dev
   - Update CLAUDE.md "What's Been Built" section
   - Update docs/dev/changelog.md
4. If it doesn't:
   - Note what's broken in docs/dev/known-issues.md
   - Either fix in a new session or continue on the same branch
5. Push everything
```

## Ideal Task Size Per Session

```
TOO BIG (will lose context, produce bugs):
  ✗ "Build the entire member management module"
  ✗ "Build attendance with offline support and history"

RIGHT SIZE (completable in one focused session):
  ✓ "Build the member list page with table, filters, and search"
  ✓ "Build the invite member form with WhatsApp API integration"
  ✓ "Build the Take Attendance screen with toggle component"
  ✓ "Build the attendance offline queue with IndexedDB"
  ✓ "Build the fee plan CRUD (create, edit, delete, list)"

TOO SMALL (wastes a session on setup overhead):
  ✗ "Add a single button to the header"
  ✗ "Fix the color of one badge"
```

---

# 6. Code Conventions Document

This should live at `docs/dev/conventions.md` and Claude Code should reference it.

```markdown
# Zenzo Code Conventions

## File Naming
- React components: PascalCase (MemberList.tsx, AttendanceToggle.tsx)
- Utility functions: camelCase (formatCurrency.ts, slugify.ts)
- API routes: kebab-case folders (app/api/members/route.ts)
- Database migrations: sequential numbered (001_create_users.sql, 002_create_clubs.sql)

## Folder Structure (apps/web/src/)
```
app/
  (auth)/                    # Auth group (no layout nesting)
    login/page.tsx
    signup/page.tsx
  (dashboard)/[clubSlug]/    # Club-scoped pages
    dashboard/page.tsx
    members/
      page.tsx               # Member list
      invite/page.tsx        # Invite member
      [memberId]/page.tsx    # Member profile
    batches/
      page.tsx
      new/page.tsx
      [batchId]/page.tsx
    attendance/
      take/[batchId]/page.tsx
      history/page.tsx
    payments/
      page.tsx               # Overdue list (default)
      record/page.tsx
      history/page.tsx
    ...
  api/                       # API routes
    members/
      route.ts               # GET (list), POST (create)
      [memberId]/route.ts    # GET, PUT, DELETE
    ...

components/                  # Shared components
  ui/                        # Shadcn/UI primitives (don't modify these)
  forms/                     # Form components (MemberForm, PaymentForm)
  tables/                    # Table components
  layout/                    # Sidebar, TopBar, BottomNav
  attendance/                # Attendance-specific components

lib/
  supabase/
    server.ts                # Server-side Supabase client
    client.ts                # Client-side Supabase client
    admin.ts                 # Service role client (for cron jobs)
  utils/
    format.ts                # formatCurrency, formatDate
    validation.ts            # Zod schemas
  hooks/                     # Custom React hooks
  actions/                   # Server Actions

types/
  database.ts                # Auto-generated Supabase types
  index.ts                   # App-level type definitions
```

## Component Patterns

### Server Component (default)
```tsx
// app/(dashboard)/[clubSlug]/members/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function MembersPage({ 
  params 
}: { 
  params: { clubSlug: string } 
}) {
  const supabase = createServerClient()
  const { data: members } = await supabase
    .from('club_memberships')
    .select('*, users(*)')
    .eq('club_id', clubId)
  
  return <MemberList members={members} />
}
```

### Client Component (only when needed)
```tsx
// components/attendance/AttendanceToggle.tsx
'use client'

import { useState } from 'react'

interface AttendanceToggleProps {
  memberId: string
  initialStatus: 'unmarked' | 'present' | 'absent'
  onToggle: (status: string) => void
}

export function AttendanceToggle({ memberId, initialStatus, onToggle }: AttendanceToggleProps) {
  const [status, setStatus] = useState(initialStatus)
  // ...
}
```

### Server Actions (for mutations)
```tsx
// lib/actions/members.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteMember(clubId: string, phone: string) {
  const supabase = createServerClient()
  // ... create membership, send WhatsApp
  revalidatePath(`/[clubSlug]/members`)
}
```

## Data Fetching Patterns

### DO: Fetch in Server Components
```tsx
// Page-level data fetching
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}
```

### DON'T: Fetch in Client Components (unless real-time)
```tsx
// Avoid useEffect data fetching
'use client'
useEffect(() => {
  fetch('/api/members') // ← avoid this pattern
}, [])
```

### Exception: Real-time updates
```tsx
// OK for real-time (e.g., attendance sync indicator)
'use client'
const channel = supabase.channel('attendance')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, 
    payload => { /* update local state */ })
  .subscribe()
```

## API Route Patterns
```tsx
// app/api/members/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  
  // Always check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Always check club access
  const clubId = request.nextUrl.searchParams.get('clubId')
  const hasAccess = await checkClubAccess(supabase, user.id, clubId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  
  // Fetch with RLS (belt and suspenders)
  const { data, error } = await supabase
    .from('club_memberships')
    .select('*')
    .eq('club_id', clubId)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

## Validation (Zod)
```tsx
// lib/utils/validation.ts
import { z } from 'zod'

export const inviteMemberSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number'),
  name: z.string().optional(),
})

export const createBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  startTime: z.string(),
  endTime: z.string(),
  days: z.array(z.string()).min(1, 'Select at least one day'),
  coachId: z.string().uuid().optional(),
  maxCapacity: z.number().positive().optional(),
})

export const recordPaymentSchema = z.object({
  membershipId: z.string().uuid(),
  amountPaise: z.number().positive(),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'other']),
  paymentDate: z.string(),
  reference: z.string().optional(),
})
```

## Error Handling
```tsx
// Consistent error shape across all API routes
type ApiError = {
  error: string
  code?: string
  details?: Record<string, string>
}

// Example: validation error
return NextResponse.json({
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: { phone: 'Invalid phone number format' }
}, { status: 400 })

// Example: not found
return NextResponse.json({
  error: 'Member not found',
  code: 'NOT_FOUND'
}, { status: 404 })
```

## Styling
```
- Tailwind CSS only. No CSS files, no styled-components, no CSS modules.
- Use Shadcn/UI components as base. Customize via Tailwind classes.
- Follow design system tokens:
  Colors: Use CSS variables defined in globals.css matching 01-design-system.md
  Spacing: Tailwind's default scale (p-4 = 16px, etc.)
  Typography: Inter font, sizes per design system
- Mobile-first: base styles for mobile, md: for tablet, lg: for desktop
```

## Naming Conventions
```
Variables/functions: camelCase
  const memberCount = 10
  function calculateDueDate() {}

Components: PascalCase  
  function MemberCard() {}
  function AttendanceToggle() {}

Database columns: snake_case
  club_id, created_at, billing_cycle_type

URL slugs/routes: kebab-case
  /ravis-fitness/members

Constants: UPPER_SNAKE_CASE
  const MAX_RETRY_ATTEMPTS = 3
  const OTP_EXPIRY_MINUTES = 5

Types/Interfaces: PascalCase
  interface ClubMembership {}
  type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other'
```
```

---

# 7. Testing Strategy

## The Reality
You don't have a QA team. Claude Code can't click through a browser. You need a testing strategy that catches bugs before you do.

## Testing Layers

### Layer 1: Type Safety (catches 40% of bugs)
```
TypeScript strict mode. No `any` types. Ever.
Supabase generates types from your schema.
Zod validates all inputs at API boundaries.

tsconfig.json:
  "strict": true
  "noUncheckedIndexedAccess": true
```

### Layer 2: Database Integrity (catches 20% of bugs)
```
- RLS policies tested with different user roles
- Foreign key constraints prevent orphaned data
- Unique constraints prevent duplicates
- NOT NULL constraints prevent missing data
- Check constraints on enums (status values, payment methods)

Test approach: write a SQL test script that:
  1. Creates test data as different roles
  2. Verifies RLS blocks unauthorized access
  3. Run after every migration
```

### Layer 3: Server Action / API Tests (catches 25% of bugs)
```
For each API route / server action:
  - Happy path test
  - Auth failure test (no token)
  - Authorization failure test (wrong club)
  - Validation failure test (bad input)
  - Edge case test (duplicate phone, empty batch, etc.)

Framework: Vitest
Location: __tests__/ folder mirroring app/ structure

Example:
  __tests__/actions/members.test.ts
  __tests__/api/payments/route.test.ts
```

### Layer 4: Component Tests (catches 10% of bugs)
```
Only for complex interactive components:
  - AttendanceToggle (toggle cycling logic)
  - MemberInviteForm (validation, submission)
  - PaymentForm (amount calculations)

Don't test: simple display components, pages, layouts
Framework: Vitest + React Testing Library
```

### Layer 5: Manual Testing by You (catches remaining 5%)
```
After every session, you click through:
  1. Does the page load?
  2. Does the happy path work? (add member, take attendance, etc.)
  3. Does the error state show? (try submitting empty form)
  4. Does it look right on mobile? (Chrome DevTools device mode)
```

## What to Tell Claude Code About Testing
```
Include in your session prompt:
  "Write tests for the server actions you create. 
   Each action needs: happy path, auth failure, validation failure.
   Use Vitest. Place tests in __tests__/ mirroring the source structure."
```

---

# 8. Quality Assurance Without a Human Dev Team

## Pre-Merge Checklist (YOU do this before merging any branch)

```
□ Dev server starts without errors
□ No TypeScript errors (pnpm typecheck)
□ Happy path works (manually test the feature)
□ Mobile view looks right (Chrome DevTools → responsive)
□ Error states show correctly (try invalid inputs)
□ Loading states show (throttle network in DevTools)
□ No console errors in browser
□ Supabase types regenerated if migrations were added
□ CLAUDE.md updated with what was built
□ changelog.md updated
```

## Automated Checks (set up once, run always)

```json
// package.json scripts
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx",
  "test": "vitest run",
  "check-all": "pnpm typecheck && pnpm lint && pnpm test"
}
```

```
Tell Claude Code: "Run pnpm check-all before committing. 
Fix any errors before moving to the next task."
```

## The 5-Minute Smoke Test
After every session, run through this manually:

```
1. Open localhost:3000 — does the landing page load?
2. Sign up flow — does OTP work? (use test mode)
3. Dashboard — does it show data? (or correct empty state?)
4. Navigate to the feature you just built — does it work?
5. Try the feature on mobile view — does it look right?

If any of these fail, don't merge. Fix first.
```

---

# 9. Prompt Engineering for Claude Code

## Session Opener Template
```
I'm building Zenzo, a membership management SaaS. CLAUDE.md has full context.

**This session's task:** [Specific task from blueprint]

**Spec:** [Paste relevant section from blueprint or design doc]

**Design:** Follow docs/design/[relevant file].md

**Existing patterns:** Reference [specific file] for how similar features are built.

**Rules:**
1. Follow conventions in docs/dev/conventions.md
2. Use Server Components by default, "use client" only when needed
3. All amounts in paise, use formatCurrency() for display
4. Write Vitest tests for server actions (happy path + error cases)
5. Commit after each sub-task with a clear message
6. When done, update CLAUDE.md and docs/dev/changelog.md

**Start by:** Reading the relevant files, then explaining your approach before coding.
```

## Effective Instruction Patterns

### Be Specific, Not Vague
```
BAD: "Build the member list page"
GOOD: "Build the member list page at app/(dashboard)/[clubSlug]/members/page.tsx.
       It should be a Server Component that fetches from club_memberships joined with users.
       Use the DataTable component for desktop and card list for mobile (< 768px).
       Include filters for status, batch, and plan. Search should filter by name or phone.
       Follow the layout in docs/design/06-screens-members.md."
```

### Reference Existing Code
```
BAD: "Build the batch list similar to how we did members"
GOOD: "Build the batch list following the same pattern as app/(dashboard)/[clubSlug]/members/page.tsx.
       Use the same data fetching approach (Server Component + Supabase query).
       Use card grid layout instead of table (see design doc for layout)."
```

### Break Complex Features Into Steps
```
BAD: "Build the attendance system"
GOOD: "Let's build the Take Attendance screen in 4 steps:

       Step 1: Create the page at attendance/take/[batchId]/page.tsx
               Server Component that fetches batch members.
       
       Step 2: Create the AttendanceToggle client component.
               Toggle cycles: unmarked → present → absent → unmarked.
               48x48px tap target, haptic feedback, color transitions.
       
       Step 3: Add the progress bar and 'mark remaining absent' button.
       
       Step 4: Add the save action (server action) and completion state.
       
       Start with Step 1. Commit after each step."
```

### Catch Mistakes Early
```
"Before writing any code, tell me:
 1. What files will you create or modify?
 2. What's your approach for [tricky part]?
 3. Are there any existing files you need to read first?
 
 Wait for my approval before proceeding."
```

## Prompts for Common Situations

### Starting a New Feature
```
"Read CLAUDE.md, then read docs/design/[XX].md.
 Explain your implementation plan for [feature].
 List the files you'll create and modify.
 Wait for my approval before coding."
```

### Fixing a Bug
```
"There's a bug: [describe what happens vs what should happen].
 The relevant files are: [list files].
 Read those files, identify the issue, explain the fix, 
 then implement it. Write a test that verifies the fix."
```

### Resuming After a Break
```
"Read CLAUDE.md for current project state.
 Read docs/dev/changelog.md for recent changes.
 Read docs/dev/known-issues.md for open bugs.
 We're currently on Sprint [X], working on [feature].
 Continue from where we left off: [specific next task]."
```

### End of Session
```
"We're done for this session. Please:
 1. Commit any uncommitted changes
 2. Update CLAUDE.md with what was built
 3. Add an entry to docs/dev/changelog.md
 4. Note any known issues in docs/dev/known-issues.md
 5. List what should be done next"
```

---

# 10. Common Failure Modes & How to Avoid Them

## 1. Context Window Overflow
```
Problem: Long sessions cause the agent to forget earlier decisions and code.

Solution:
  - Keep sessions under 30-40 messages
  - One feature per session
  - If you need to continue, start a new session with:
    "Read CLAUDE.md. Continue working on [feature]. 
     Last session we completed [X]. Next step is [Y]."
```

## 2. The "It Works on My Machine" Problem
```
Problem: Agent writes code that compiles but doesn't actually work 
         because it can't test in a browser.

Solution:
  - YOU test every feature manually after each session
  - Ask the agent to add console.log checkpoints at key steps
  - Use TypeScript strict mode to catch type errors
  - Write tests for server-side logic
```

## 3. Architecture Drift
```
Problem: Over many sessions, code patterns become inconsistent.
         Session 1 uses one data fetching approach, session 10 uses another.

Solution:
  - docs/dev/conventions.md is the source of truth for patterns
  - Start every session with: "Follow conventions in docs/dev/conventions.md"
  - When you notice drift, have a dedicated session just for refactoring
  - Reference specific files: "Follow the same pattern as [file]"
```

## 4. Migration Conflicts
```
Problem: Agent creates a migration that conflicts with existing data or 
         re-creates tables that already exist.

Solution:
  - docs/dev/db-migrations-log.md lists every migration that's been run
  - Tell the agent: "These migrations have already been run: [list]. 
    Don't recreate existing tables."
  - Number migrations sequentially: 001_, 002_, 003_...
  - After every migration: supabase gen types
```

## 5. Overengineering
```
Problem: Agent builds elaborate abstractions for simple features.
         Custom hook factories, generic type utilities, complex state machines.

Solution:
  - "Keep it simple. No abstractions until we need them in 3+ places."
  - "Don't build a generic component. Build the specific thing I asked for."
  - "We can refactor later. Right now, just make it work."
```

## 6. Incomplete Error Handling
```
Problem: Agent builds the happy path but skips error states, loading states,
         empty states, and edge cases.

Solution:
  - Include in every prompt: "Handle: loading state, error state, 
    empty state, and the happy path."
  - Reference design docs which specify empty states for each screen
  - Ask: "What happens if the API call fails? What does the user see?"
```

## 7. CSS/Styling Issues
```
Problem: Agent uses arbitrary Tailwind values, inconsistent spacing,
         or ignores mobile responsiveness.

Solution:
  - "Follow spacing from docs/design/01-design-system.md"
  - "Test with mobile viewport (375px width)"
  - "Use Shadcn/UI components, don't build custom UI from scratch"
  - "No arbitrary values in Tailwind (no w-[347px]). Use the scale."
```

## 8. Phantom Dependencies
```
Problem: Agent installs packages you don't need, or uses browser APIs 
         in Server Components, or imports client-only code in server code.

Solution:
  - Review package.json after each session for unwanted additions
  - "Don't install new packages without asking me first"
  - "This is a Server Component. Don't use useState, useEffect, 
    or any browser APIs."
```

---

# 11. Your Role as the Product Owner + QA

## You Are Four People

### 1. Product Manager
```
- Decide what to build next (follow the sprint plan)
- Write the session prompt with clear specs
- Make decisions when Claude Code asks questions
- Say "no" to scope creep ("just add this one thing...")
```

### 2. QA Engineer
```
- Test every feature manually after each session
- Check mobile view in Chrome DevTools
- Try to break things (empty inputs, rapid clicks, back button)
- File bugs in docs/dev/known-issues.md
```

### 3. Code Reviewer
```
- Read the git diff after each session (you don't need to understand every line)
- Look for: new dependencies, large files, "use client" where it shouldn't be
- Check: does the file structure match conventions?
- Trust but verify: if something seems wrong, ask Claude Code to explain it
```

### 4. DevOps
```
- Manage environment variables
- Run database migrations
- Monitor Vercel deployments
- Keep Supabase project healthy
```

## Daily Routine When Actively Building
```
Morning:
  1. Review what was built yesterday (changelog.md)
  2. Decide today's task (next item from sprint plan)
  3. Prepare the session prompt (spec from blueprint + design doc)

Building Session (1-3 hours):
  4. Run Claude Code session
  5. Monitor progress, course-correct as needed
  6. End session with documentation updates

Testing (30 min):
  7. Pull changes, run dev server
  8. Manual smoke test (5-minute checklist)
  9. Test the specific feature built today
  10. Log any bugs in known-issues.md

Wrap-up:
  11. Merge branch if it passes testing
  12. Update CLAUDE.md
  13. Commit and push documentation updates
  14. Plan tomorrow's task
```

---

# 12. Environment & DevOps Setup

## Required Accounts & Services
```
Service          Purpose                  Setup Required Before Dev
─────────────────────────────────────────────────────────────────
Supabase         Database + Auth          Project created, URL + keys in .env
Vercel           Hosting                  Project linked to repo
Interakt         WhatsApp API             Account created, API key in .env
Razorpay         Payments (Phase 2)       Account created (can defer)
Email provider   Transactional email      Account created, API key in .env
Firebase         Push notifications       Project created, credentials in .env
GitHub           Code hosting             Repo created
```

## Environment Variables
```
# .env.local (never committed)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Server-side only, never expose

# Interakt (WhatsApp)
INTERAKT_API_KEY=xxx
INTERAKT_WEBHOOK_SECRET=xxx

# Razorpay (can be test keys initially)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Email (example: Resend)
RESEND_API_KEY=re_xxx

# Firebase (push notifications)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Setup Checklist
```
□ Create Supabase project (production region: Mumbai / Singapore)
□ Enable Phone Auth provider
□ Configure custom SMTP for auth emails (optional but recommended)
□ Create initial migration with all tables from blueprint Section 18
□ Set up RLS policies for all tables
□ Generate TypeScript types: supabase gen types typescript --local
□ Create test data: 1 club, 1 owner, 3 batches, 10 members
□ Set up database webhooks for notification triggers (Phase 1 or cron)
```

## Vercel Setup Checklist
```
□ Connect GitHub repo to Vercel
□ Set environment variables in Vercel dashboard
□ Configure build command: cd apps/web && pnpm build
□ Configure output directory: apps/web/.next
□ Set up preview deployments for branches
□ Custom domain (when ready): zenzo.app
```

## Development Commands
```bash
# Install dependencies
pnpm install

# Run dev server
cd apps/web && pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# Generate Supabase types (after any migration)
supabase gen types typescript --local > packages/database/src/types/index.ts

# Create a new migration
supabase migration new <migration_name>

# Apply migrations locally
supabase db push

# Reset local database
supabase db reset
```

---

# 13. Security Checklist

## Authentication & Authorization
```
□ All API routes check auth (supabase.auth.getUser())
□ All API routes verify club access (user has role in that club)
□ RLS enabled on ALL tables (no exceptions)
□ RLS policies tested with different roles
□ Service role key NEVER exposed to client
□ SUPABASE_SERVICE_ROLE_KEY only in server-side code
□ JWT tokens in httpOnly cookies (not localStorage)
□ OTP rate limiting (max 3 attempts per phone per 5 minutes)
□ Password minimum 8 characters
□ Login: generic "Invalid credentials" error (no user enumeration)
```

## Data Protection
```
□ Phone numbers validated (Indian format: +91 + 10 digits)
□ No sensitive data in URL parameters
□ Member portal tokens expire (30 days)
□ Soft deletes preserve data integrity
□ Input sanitization on all user inputs (Zod validation)
□ SQL injection prevented (Supabase client handles parameterization)
□ XSS prevented (React handles escaping, no dangerouslySetInnerHTML)
```

## API Security
```
□ All mutations require authentication
□ All reads scoped by club_id via RLS
□ Rate limiting on WhatsApp sends (prevent spam)
□ File upload size limits (logo: 2MB, verification photo: 5MB)
□ File type validation (JPEG, PNG only for images)
□ CORS configured correctly on API routes
```

## Environment Security
```
□ .env files in .gitignore
□ .env.example committed (with placeholder values, no real keys)
□ Different keys for development and production
□ Vercel environment variables set via dashboard (not committed)
□ Supabase project has separate development and production environments
```

---

# 14. Pre-Development Checklist

## Before Writing Any Code, Complete These:

### Documentation (do now)
```
□ Blueprint v1.0 saved to docs/blueprint.md (you have this)
□ Design docs in docs/design/ (you have these)
□ Create docs/dev/conventions.md (use Section 6 of this guide)
□ Create docs/dev/changelog.md (empty, ready for entries)
□ Create docs/dev/known-issues.md (empty, ready for entries)
□ Create docs/dev/db-migrations-log.md (empty, ready for entries)
□ Create docs/dev/environment.md (list env vars and setup steps)
□ Update CLAUDE.md to the optimal structure (Section 3 of this guide)
```

### Accounts & Services (do now)
```
□ GitHub repo created and code pushed
□ Supabase project created (get URL + anon key + service role key)
□ Interakt account created (get API key) — or decide test mode for dev
□ Vercel project linked to repo
□ Email provider account created (Resend recommended — simple, cheap)
□ Firebase project created (for push notifications)
```

### Local Development (do now)
```
□ Node.js 18+ installed
□ pnpm installed
□ Supabase CLI installed (brew install supabase/tap/supabase)
□ Git configured
□ .env.local created with all required variables
□ pnpm install runs successfully
□ pnpm dev starts the dev server
□ Supabase local development running (supabase start)
```

### Database (Sprint 1, first task)
```
□ All tables from blueprint Section 18 created as migration
□ RLS policies written and applied
□ Supabase types generated
□ Test data seeded (1 club, 1 owner, a few members)
```

### Design System (Sprint 1, second task)
```
□ Tailwind configured with Zenzo color tokens
□ Inter font loaded
□ Shadcn/UI installed and configured
□ Base layout components: Sidebar, TopBar, BottomNav
□ Core UI components: Button, Input, Badge, Avatar, StatCard, Toast
```

---

# Summary: The Three Rules

## Rule 1: Documentation Is the Product
If it's not documented, the agent doesn't know it. Update CLAUDE.md and changelog after EVERY session. No exceptions.

## Rule 2: Small Sessions, Big Results
One feature per session. Commit often. Test after every session. Don't let sessions go past 40 messages.

## Rule 3: You Are QA
The agent can't test its own work in a browser. Every feature must pass YOUR manual testing before it's merged. If you don't test it, it's broken — you just don't know it yet.
```

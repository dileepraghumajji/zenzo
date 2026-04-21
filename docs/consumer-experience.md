# Zenzo — Consumer Experience Sprint Plan (Revised)
*Living document. Source of truth for Phase 2 (B2C) build order.*
*Created: 2026-04-20 · Revised: 2026-04-20*

---

## Vision

Phase 2 turns Zenzo into a two-sided platform. Members are not just passive recipients of club management — they are active users who discover, join, track, and celebrate their fitness journey.

Every person on Zenzo has **one real account** that works across all clubs. No shadow users.

---

## Sprint Order & Dependencies

```
UC1  Interest Onboarding       ← START HERE — unblocks UC2
UC2  Discovery Home            ← depends on UC1
UC4  Public Profiles + Nav     ← parallel with UC2 (start with UC4.1 — nav needed everywhere)
UC3  Global Search             ← depends on UC4 (results link to profiles)
UC5  Ratings & Reviews         ← depends on UC4 (profiles display ratings)
UC6  Achievements              ← depends on UC4 (profiles display badges)
UC7  Razorpay Payments         ← deferred
```

---

## Design Principles for Consumer Pages

1. **Dark by default** — portal already dark; extend to discover/search/profiles
2. **Mobile-first, app-like** — max-w-lg centered, bottom nav, no sidebar
3. **Fast-feeling** — skeleton shimmers everywhere, optimistic UI for toggles
4. **Personal** — use first name in greetings, "your clubs" not "the clubs"
5. **Social signals** — ratings, achievement counts, member-since dates build trust
6. **No jargon** — "Your clubs" not "Memberships"; "Classes" not "Batches" in consumer UI

---

## Sprint UC1 — Interest Onboarding

**Goal:** Every new user tells Zenzo what they're into. One-time screen, delightful UX.

### UC1.1 — Migration: User profile fields + interest tables

| Detail | Value |
|---|---|
| **Type** | Migration |
| **File** | `packages/database/migrations/006_user_interests.sql` |
| **Depends on** | Nothing |

**What to do:**
- ALTER `users` table: add `bio TEXT CHECK(char_length(bio) <= 160)`, `avatar_url TEXT`, `username TEXT UNIQUE CHECK(username ~ '^[a-z0-9_]{3,30}$')`, `city TEXT`, `onboarding_step TEXT CHECK(onboarding_step IN ('interests_done', 'interests_skipped'))`
- CREATE `user_interests` table: `user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `slug TEXT NOT NULL CHECK(slug IN ('martial_arts','fitness','dance','yoga','boxing','swimming','crossfit','other'))`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `PRIMARY KEY (user_id, slug)`
- CREATE unique index: `idx_users_username_lower ON users (lower(username))`

**Why no `interest_categories` table:** 8 categories that rarely change don't need a DB table. Store the display metadata (icon, label, color) as a TypeScript const array in the codebase. Only store the slug in `user_interests`.

### UC1.2 — Types + Enums update

| Detail | Value |
|---|---|
| **Type** | Code |
| **File** | `packages/database/src/types/index.ts`, `packages/database/src/enums.ts` |
| **Depends on** | UC1.1 |

**What to do:**
- Add `bio`, `avatar_url`, `username`, `city`, `onboarding_step` to `users.Row` and `users.Update` types
- Add `InterestSlug` as a const enum: `martial_arts | fitness | dance | yoga | boxing | swimming | crossfit | other`
- Add `INTEREST_CATEGORIES` const array with display data: `{ slug, label, icon (emoji), color (tailwind token) }` for all 8 categories
- Add reserved usernames list: `['admin', 'zenzo', 'support', 'api', 'portal', 'discover', 'search', 'profile', 'settings', 'help', 'about']`

### UC1.3 — Interest selection page

| Detail | Value |
|---|---|
| **Type** | Page |
| **File** | `apps/web/src/app/onboarding/interests/page.tsx` |
| **Depends on** | UC1.1, UC1.2 |

**What to do:**
- Full-screen dark card layout, centered max-w-lg
- Heading: "What are you into?" / Sub: "We'll show you clubs that match."
- 8 interest cards in 2×4 grid (mobile: 2 columns). Each card: emoji icon + label. Tap toggles a ring highlight. State managed locally (optimistic)
- City selector below the grid: autocomplete input with top 50 Indian cities seeded + free-text fallback. Label: "Where are you based?"
- Validation: at least 1 interest selected before "Let's go →" button enables
- "Skip for now →" small link below the CTA — sets `onboarding_step = 'interests_skipped'`, redirects to `/discover` with unfiltered feed
- On submit: POST `/api/users/interests` → redirect to `/discover`
- If API fails: show toast error, keep user on page, don't clear selections
- Back button handling: if user returns from `/discover`, pre-fill saved selections from DB
- Loading state: shimmer grid of 8 cards

### UC1.4 — Save interests API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/users/interests/route.ts` |
| **Depends on** | UC1.1 |

**What to do:**
- POST, auth required (`getUser()`)
- Body: `{ slugs: InterestSlug[], city?: string }` — validate min 1 slug, validate slugs against enum
- Delete existing `user_interests` for this user, insert new rows (idempotent upsert)
- Update `users.city` if provided
- Update `users.onboarding_step = 'interests_done'`
- Return `{ ok: true }`

### UC1.5 — Redirect logic updates

| Detail | Value |
|---|---|
| **Type** | Code |
| **File** | Multiple auth files |
| **Depends on** | UC1.3 |

**What to do:**
- `apps/web/src/app/(auth)/signup/page.tsx`: after successful signup, redirect to `/onboarding/interests` instead of `/portal`
- `apps/web/src/app/auth/callback/route.ts`: OAuth users without `onboarding_step` go to `/onboarding/interests`
- `apps/web/src/middleware.ts`: add `/onboarding/interests` to authenticated-only paths
- Account merge check: when user enters phone during complete-profile, query `users` for existing record with same phone. If found and current user is different, merge records (move memberships, attendance to the new authenticated user, delete the shadow record). This prevents duplicate users from the Phase 1 invite flow.

---

## Sprint UC2 — Discovery Home

**Goal:** After onboarding, members see a personalized home — pending invites + clubs matching their interests in their city.

### UC2.1 — Discovery API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/discover/route.ts` |
| **Depends on** | UC1.1 |

**What to do:**
- GET, auth required
- Read `user_interests` slugs for the user
- Map interest slugs to `ClubCategory` / `business_type` values
- Query `clubs` where `listed = true` AND `verification_status = 'verified'` AND `business_type` matches user interests AND `city` matches user city (case-insensitive)
- Scoring/sort: `ORDER BY (interest_match * 2 + COALESCE(avg_rating, 0)) DESC` — don't return a random list
- Count pending invites for user from `club_invites` where `status = 'pending'`
- Return `{ inviteCount: number, clubs: Club[], hasMore: boolean }` — paginate 20/page via `?cursor=`

### UC2.2 — Discover page

| Detail | Value |
|---|---|
| **Type** | Page |
| **File** | `apps/web/src/app/discover/page.tsx` + `_components/` |
| **Depends on** | UC2.1 |

**What to do:**
- Server component shell with Suspense boundaries
- Section 1 — Invites banner: if `inviteCount > 0`, show amber pill "You have N pending invites →" linking to `/portal`
- Section 2 — Heading: "For you in [City]" (use user's city from DB) or "Clubs matching your interests" if no city
- Section 3 — Club cards grid: 2-col mobile, 3-col desktop. Each card: club logo/icon, name, category badge, city, avg rating stars (read-only), "View →" link to `/clubs/[slug]`
- Section 4 — "Explore all clubs →" link at bottom
- Empty state: if no clubs match, show "No clubs match your interests in [City] yet. Explore all clubs →"
- Loading: shimmer banner + 6 shimmer cards

### UC2.3 — Portal routing update

| Detail | Value |
|---|---|
| **Type** | Code |
| **File** | `apps/web/src/app/portal/page.tsx`, auth profile route |
| **Depends on** | UC2.2 |

**What to do:**
- `portal/page.tsx`: if user has no club memberships, redirect to `/discover` instead of showing empty portal
- Auth profile route: for users with `onboarding_step = 'interests_done'` or `'interests_skipped'` and no memberships, return `{ destination: '/discover' }`

---

## Sprint UC4 — Public Profiles + Portal Nav

**Goal:** Every person on Zenzo has a public profile. Portal gets a proper bottom nav. Start this sprint with UC4.1 since all consumer pages need the nav shell.

### UC4.1 — Portal bottom nav

| Detail | Value |
|---|---|
| **Type** | Component + Layout |
| **File** | `apps/web/src/app/portal/layout.tsx` |
| **Depends on** | Nothing |

**What to do:**
- Top bar: "zenzo" wordmark left + avatar circle/initials right (links to `/profile`)
- Bottom nav (mobile, fixed): 4 items — Home (`/portal`) · Discover (`/discover`) · Search (`/search`) · Profile (`/profile`)
- Desktop: horizontal top nav bar with same 4 links
- Active state: use `usePathname()` with `startsWith` matching. Highlight current route icon + label
- Home icon href: dynamically resolve — if user has clubs → `/portal`, if no clubs → `/discover`

### UC4.2 — Profile update API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/profile/route.ts` |
| **Depends on** | UC1.1 |

**What to do:**
- PATCH, auth required (user can only update own profile)
- Fields: `full_name`, `phone`, `bio` (max 160), `username`, `avatar_url`, `city`
- Username validation: lowercase alphanumeric + underscores, 3–30 chars, not in reserved list, unique (catch DB constraint error → return `{ error: 'username_taken' }`, not a 500)
- Return updated user object

### UC4.3 — Username availability check API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/profile/check-username/route.ts` |
| **Depends on** | UC1.1 |

**What to do:**
- GET `?u=desired_username`, auth required
- Validate format (regex), check reserved list, query DB
- Return `{ available: boolean, reason?: 'invalid_format' | 'reserved' | 'taken' }`

### UC4.4 — Own profile edit page

| Detail | Value |
|---|---|
| **Type** | Page |
| **File** | `apps/web/src/app/profile/page.tsx` |
| **Depends on** | UC4.1, UC4.2, UC4.3 |

**What to do:**
- Auth required
- Avatar section: upload photo (max 2MB, JPEG/PNG/WebP, server-resize to 200×200) or show auto-generated initials circle
- Bio: 160-char textarea with character count
- Username: text input, validated on blur via UC4.3. Show green check / red error inline
- Name + Phone: editable text inputs
- City: autocomplete input (same component as UC1.3)
- Interests: re-selectable interest pills (toggleable, re-runs UC1.4 on save)
- Save button: PATCH `/api/profile`
- Loading: skeleton form

### UC4.5 — Member public profile page

| Detail | Value |
|---|---|
| **Type** | Page |
| **File** | `apps/web/src/app/u/[username]/page.tsx` |
| **Depends on** | UC4.2 |

**What to do:**
- Public (no auth required)
- Header: avatar circle + full name + @username + "Member since [date]"
- Interest pills row: e.g. "🥋 Martial Arts" "💃 Dance"
- Clubs section: list of clubs they're a member of (public info only — club name + category badge)
- Achievements grid: badge icon + title + awarded by + date (empty until UC6 is built — show "No achievements yet")
- Stats: total attendance count (number only, no dates — privacy)
- 404 page if username not found
- SEO: `generateMetadata()` → `<title>[Name] (@[username]) | Zenzo</title>`, Open Graph tags

### UC4.6 — Coach public profile page

| Detail | Value |
|---|---|
| **Type** | Page |
| **File** | `apps/web/src/app/coaches/[userId]/page.tsx` |
| **Depends on** | UC4.2 |

**What to do:**
- Public
- Header: avatar + full name + "Coach at [Club1], [Club2]"
- Bio section
- Avg rating stars + total reviews count (placeholder until UC5 — show "No ratings yet")
- Current batches: club name + batch name + timing + days
- Reviews list: most recent 5, "See all →" expands (placeholder until UC5)
- CTA: "Train with [Name] →" links to their club's public page
- SEO: `generateMetadata()` with coach name + clubs

### UC4.7 — Club public page: ratings section

| Detail | Value |
|---|---|
| **Type** | Page enhancement |
| **File** | `apps/web/src/app/clubs/[slug]/page.tsx` (existing — enhance) |
| **Depends on** | UC5.1 (can stub with placeholder until UC5) |

**What to do:**
- Add avg star rating display below club name
- Add reviews section at bottom (most recent 5)
- Add "Write a review" button (auth required, must be member of this club)
- Placeholder until UC5 migrations exist: show "No reviews yet. Be the first!"

---

## Sprint UC3 — Global Search

**Goal:** Anyone can search for clubs, coaches, or members from one search bar.

### UC3.1 — Migration: pg_trgm extension + indexes

| Detail | Value |
|---|---|
| **Type** | Migration |
| **File** | `packages/database/migrations/007_search_indexes.sql` |
| **Depends on** | Nothing |

**What to do:**
- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- `CREATE INDEX idx_clubs_name_trgm ON clubs USING gin (name gin_trgm_ops);`
- `CREATE INDEX idx_users_fullname_trgm ON users USING gin (full_name gin_trgm_ops);`
- `CREATE INDEX idx_users_username_trgm ON users USING gin (username gin_trgm_ops);`

### UC3.2 — Search API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/search/route.ts` |
| **Depends on** | UC3.1 |

**What to do:**
- GET `?q=rahul&type=clubs` — type: `clubs | coaches | members`
- Rate limit: 30 requests/min per IP (middleware or edge check)
- **Clubs** (public): `clubs` where `(name % $1 OR city ILIKE '%q%') AND listed = true` → return `id, slug, name, business_type, city, avg_rating`, ordered by `similarity(name, $1) DESC`
- **Coaches** (public): `club_staff` JOIN `users` where `full_name % $1 AND role = 'coach'` → return `user_id, full_name, clubs[{name, slug}], avg_rating`
- **Members** (auth required): `users` where `full_name % $1 OR username % $1` → return `id, username, full_name, avatar_url, interests[], achievement_count`
- Limit 20 results per type
- Empty query returns empty results (don't query with blank string)

### UC3.3 — Search page

| Detail | Value |
|---|---|
| **Type** | Page (client component) |
| **File** | `apps/web/src/app/search/page.tsx` |
| **Depends on** | UC3.2, UC4.1 (nav) |

**What to do:**
- Search bar sticky at top, 3 tabs below: Clubs / Coaches / Members
- Debounced input (300ms) → fetch `/api/search?q=&type=`
- Club result card: name, category badge, city, star rating → links to `/clubs/[slug]`
- Coach result card: avatar initials, name, clubs list, star rating → links to `/coaches/[userId]`
- Member result card: avatar initials, name, @username, interest pills, achievement count → links to `/u/[username]`
- Empty state per tab: "No [clubs/coaches/members] found for '[query]'"
- Loading: skeleton list of 5 items per tab
- URL reflects query: `/search?q=rahul&type=coaches` (shareable, bookmarkable)

---

## Sprint UC5 — Ratings & Reviews

**Goal:** Clubs and coaches have a reputation. Members can rate after being a member.

### UC5.1 — Migration: reviews + ratings tables

| Detail | Value |
|---|---|
| **Type** | Migration |
| **File** | `packages/database/migrations/008_ratings.sql` |
| **Depends on** | Nothing |

**What to do:**
- CREATE `club_reviews`: `id UUID PK`, `club_id UUID REFERENCES clubs(id) ON DELETE CASCADE`, `reviewer_user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `rating SMALLINT CHECK(1-5)`, `review_text TEXT CHECK(char_length <= 500)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`, `UNIQUE(club_id, reviewer_user_id)`
- CREATE `coach_ratings`: same shape — `coach_user_id`, `club_id`, `reviewer_user_id`, `rating`, `review_text`, `created_at`, `updated_at`, `deleted_at`, `UNIQUE(coach_user_id, club_id, reviewer_user_id)`
- CREATE index: `idx_club_reviews_club_rating ON club_reviews(club_id, rating) WHERE deleted_at IS NULL`
- Add types to `packages/database/src/types/index.ts`
- RLS: anyone can read (where `deleted_at IS NULL`); only authenticated users can insert/update their own review

### UC5.2 — Star rating component

| Detail | Value |
|---|---|
| **Type** | Component |
| **File** | `packages/ui/src/star-rating.tsx` |
| **Depends on** | Nothing |

**What to do:**
- Props: `value: number`, `max?: number (default 5)`, `interactive?: boolean (default false)`, `onChange?: (val: number) => void`, `size?: 'sm' | 'md' | 'lg'`
- Readonly mode: filled / half / empty stars based on value
- Interactive mode: hover preview + click to set rating
- Accessible: aria-label with numeric rating

### UC5.3 — Club reviews API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/clubs/[slug]/reviews/route.ts` |
| **Depends on** | UC5.1 |

**What to do:**
- GET (public): return `{ avgRating, count, reviews[] }` where `deleted_at IS NULL`, ordered by `created_at DESC`, paginate 10/page
- POST (auth required): body `{ rating: 1-5, reviewText?: string (max 500) }`. Authorization check: query `memberships` for `(reviewer_user_id, club_id)` with `status IN ('active', 'expired')` — reject if not a member. Insert row, return created review.
- PATCH (auth required): update own review only. Body: `{ rating?, reviewText? }`. Set `updated_at = NOW()`.
- DELETE (auth required): soft delete own review only. Set `deleted_at = NOW()`.

### UC5.4 — Coach ratings API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/coaches/[userId]/ratings/route.ts` |
| **Depends on** | UC5.1 |

**What to do:**
- GET (public): return `{ avgRating, count, ratings[] }`
- POST (auth required): body `{ rating: 1-5, reviewText?, clubId }`. Authorization check: user must have a batch assignment with this coach at this club (join `batch_members` → `batches` → check `coach_user_id`). Insert row.
- PATCH / DELETE: same pattern as UC5.3

---

## Sprint UC6 — Member Achievements

**Goal:** Owners and coaches award badges. Members display them on their profile.

### UC6.1 — Migration: achievements table

| Detail | Value |
|---|---|
| **Type** | Migration |
| **File** | `packages/database/migrations/009_achievements.sql` |
| **Depends on** | Nothing |

**What to do:**
- CREATE `member_achievements`: `id UUID PK`, `user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `club_id UUID REFERENCES clubs(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `description TEXT`, `badge_icon TEXT` (emoji or image URL), `awarded_by UUID REFERENCES users(id)`, `awarded_at DATE DEFAULT CURRENT_DATE`, `created_at TIMESTAMPTZ DEFAULT NOW()`
- RLS: anyone can read; only `club_staff` with role `owner` or `coach` at that `club_id` can insert
- Add types to `packages/database/src/types/index.ts`
- Add `ACHIEVEMENT_TEMPLATES` const array with 12 presets: `{ slug, title, icon, description }` — e.g. "100 Classes" (💯), "1 Year Member" (🎂), "Blue Belt" (🥋), "Top Performer" (🏆), "First Class" (⭐), "Iron Will" (🔥), "Rising Star" (🌟), "Team Player" (🤝), "Perfect Week" (✅), "Marathon Month" (📅), "Consistency King" (👑), "Custom" (🎯)

### UC6.2 — Achievement award API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/clubs/[clubId]/members/[memberId]/achievements/route.ts` |
| **Depends on** | UC6.1 |

**What to do:**
- GET: return all achievements for this member at this club, ordered by `awarded_at DESC`
- POST (auth required): must be owner or coach of `clubId`. Body: `{ title, description?, badgeIcon?, awardedAt? }`. If title matches a preset template slug, auto-fill icon. Insert row, return created achievement.

### UC6.3 — Public achievements API

| Detail | Value |
|---|---|
| **Type** | API |
| **File** | `apps/web/src/app/api/users/[userId]/achievements/route.ts` |
| **Depends on** | UC6.1 |

**What to do:**
- GET (public): return all achievements across all clubs for this user, ordered by `awarded_at DESC`. Include club name in response for context.

### UC6.4 — Award badge UI (club dashboard)

| Detail | Value |
|---|---|
| **Type** | Component |
| **File** | `apps/web/src/app/(dashboard)/[clubSlug]/members/[memberId]/_components/award-achievement-dialog.tsx` |
| **Depends on** | UC6.2 |

**What to do:**
- Add "Award Badge" button in the member profile actions dropdown (visible to owner + coach only)
- Dialog: preset template grid (12 cards, tap to select — auto-fills title + icon) + "Custom" option with free-text title input
- Description textarea (optional)
- Date picker (defaults to today)
- On submit: POST to UC6.2 endpoint

### UC6.5 — Achievements tab in member profile (club dashboard)

| Detail | Value |
|---|---|
| **Type** | Component |
| **File** | `apps/web/src/app/(dashboard)/[clubSlug]/members/[memberId]/_components/member-profile-client.tsx` |
| **Depends on** | UC6.2, UC6.4 |

**What to do:**
- Add "Achievements" as 4th tab (after Progression)
- Grid of achievement cards: badge icon + title + awarded date + awarded by name
- Empty state: "No achievements yet. Award one →" (links to UC6.4 dialog)

### UC6.6 — Achievements on public member profile

| Detail | Value |
|---|---|
| **Type** | Page enhancement |
| **File** | `apps/web/src/app/u/[username]/page.tsx` (UC4.5 — enhance) |
| **Depends on** | UC6.3, UC4.5 |

**What to do:**
- Replace the placeholder achievements section with real data from UC6.3
- Grid: badge icon + title + club name + date
- If no achievements: "No achievements yet"

---

## Sprint UC7 — Razorpay Member Payments *(Deferred)*

> Not building yet. Needs Razorpay account integration, webhook handling, and reconciliation logic. Tracked for planning.

### UC7.1 — "Pay Now" in portal
- `/portal/[clubSlug]` Payments tab: "Pay ₹[amount] now" CTA
- Creates Razorpay order → opens checkout modal → on success → POST `/api/portal/[clubSlug]/pay` → creates payment record, advances due date

### UC7.2 — Payment link generation (club side)
- Owner/coach generates "Send Payment Link" via Razorpay from member profile

---

## Permissions Matrix

| Endpoint | Anon | Member | Coach | Owner |
|---|---|---|---|---|
| POST `/api/users/interests` | ✗ | ✓ (self) | ✓ (self) | ✓ (self) |
| GET `/api/discover` | ✗ | ✓ | ✓ | ✓ |
| GET `/api/search?type=clubs` | ✓ | ✓ | ✓ | ✓ |
| GET `/api/search?type=coaches` | ✓ | ✓ | ✓ | ✓ |
| GET `/api/search?type=members` | ✗ | ✓ | ✓ | ✓ |
| PATCH `/api/profile` | ✗ | ✓ (self) | ✓ (self) | ✓ (self) |
| GET `/u/[username]` | ✓ | ✓ | ✓ | ✓ |
| GET `/coaches/[userId]` | ✓ | ✓ | ✓ | ✓ |
| POST `/api/clubs/[slug]/reviews` | ✗ | ✓ (member of club) | ✓ | ✓ |
| PATCH/DELETE `/api/clubs/[slug]/reviews` | ✗ | ✓ (own) | ✓ (own) | ✓ (own) |
| POST `/api/coaches/[userId]/ratings` | ✗ | ✓ (has batch) | ✗ | ✗ |
| POST achievements | ✗ | ✗ | ✓ (own club) | ✓ (own club) |
| GET achievements | ✓ | ✓ | ✓ | ✓ |

---

## Caching Strategy

| Resource | Cache-Control | Notes |
|---|---|---|
| Interest categories | Hardcoded in TS | Zero network calls |
| Discovery feed | `private, max-age=300` | Personalized, no CDN. 5 min client staleness OK |
| Club public pages | `public, s-maxage=3600, stale-while-revalidate=600` | CDN-cacheable, hourly revalidation |
| Search results | No cache | Always fresh |
| Public profiles | `s-maxage=600` | 10 min CDN cache |
| Own profile edit | No cache | Always fresh |
| Avg ratings | Denormalized column on `clubs` via DB trigger | Avoids computing on every read |

---

## SEO (Public Pages)

All public pages need `generateMetadata()` in Next.js:

| Page | Title pattern | OG image |
|---|---|---|
| `/clubs/[slug]` | `[Club Name] — [Category] in [City] \| Zenzo` | Club logo or default |
| `/u/[username]` | `[Name] (@[username]) \| Zenzo` | Avatar or initials |
| `/coaches/[userId]` | `[Name] — Coach at [Club] \| Zenzo` | Avatar or initials |
| `/search` | `Search Clubs, Coaches & Members \| Zenzo` | Default Zenzo OG |

Add `sitemap.xml` generation: list all public club pages + coach profiles. Exclude member profiles from sitemap (privacy) but allow indexing if visited directly.

---

## Rate Limiting

| Endpoint | Limit | Scope |
|---|---|---|
| GET `/api/search` | 30 req/min | Per IP |
| POST `/api/clubs/[slug]/reviews` | 5 req/hour | Per user |
| POST `/api/users/interests` | 10 req/hour | Per user |
| PATCH `/api/profile` | 20 req/hour | Per user |
| GET `/u/[username]` | 60 req/min | Per IP |
| GET `/clubs/[slug]` | 60 req/min | Per IP |

---

## Open Questions (Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Username: auto-generate or user picks? | Auto-generate as `firstname_lastname` (lowercase, stripped), user can edit in profile. Collision → append `_2`, `_3` etc. |
| 2 | Member profile privacy? | Public: name, username, interests, achievements, club list. Hidden: attendance dates, payment amounts, phone, email. |
| 3 | City detection? | Ask during onboarding (city field on interest screen). No phone-number inference. |
| 4 | Reviews: non-member blocked? | Yes — POST requires active or expired membership, enforced at API level. |
| 5 | Avatar storage? | Supabase Storage. Max 2MB, JPEG/PNG/WebP. Server-resize to 200×200. |
| 6 | Search: ILIKE or pg_trgm? | pg_trgm from day one. 3 lines of SQL, prevents scaling issues. |
| 7 | Account merge for invited users? | Merge during complete-profile step when phone is entered. Move memberships + attendance to authenticated user, delete shadow record. |
| 8 | Review moderation? | V1: users can edit/delete own reviews. Club owners can flag (report) but not delete. Moderation queue deferred to post-MVP. |
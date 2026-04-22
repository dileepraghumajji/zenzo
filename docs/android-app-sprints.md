# Zenzo Android App — Atomic Sprint Tasks
*Living document. Check off tasks as completed. Update sprint status headers when done.*
*Created: 2026-04-22 · Android-first, consumer-priority.*
*Build in parallel with web — same Supabase backend, shared packages.*

---

## Architecture Overview

```
monorepo (Turborepo)
├── apps/
│   ├── web/          ← Existing Next.js web app
│   └── mobile/       ← NEW: Expo React Native (Android first)
├── packages/
│   ├── database/     ← SHARED: types, enums, constants
│   ├── utils/        ← SHARED: validators, formatCurrency, billing
│   └── config/       ← SHARED: Supabase config
```

**Backend:** Same Supabase project + same Next.js API routes.
**No new APIs needed** — the mobile app calls the same endpoints the web app uses.

---

## Sprint MA0 — Project Scaffold ⬜

> **Goal:** Expo app builds and runs with Supabase connected. No features yet.

### MA0.1 — Workspace setup
- [ ] Add `"apps/mobile"` to `pnpm-workspace.yaml`
- [ ] Verify workspace resolves: `pnpm ls --filter @zenzo/mobile` shows no errors

### MA0.2 — Init Expo app
- [ ] Run `npx create-expo-app@latest --help` to check available options
- [ ] Run `npx create-expo-app@latest apps/mobile --template blank-typescript`
- [ ] Verify `cd apps/mobile && npx expo start` launches Metro bundler
- [ ] Verify Android emulator or device shows the default Expo screen

### MA0.3 — Install core dependencies
- [ ] `cd apps/mobile && pnpm add @supabase/supabase-js @react-native-async-storage/async-storage`
- [ ] `pnpm add expo-router expo-linking expo-constants expo-status-bar`
- [ ] `pnpm add nativewind tailwindcss react-native-reanimated react-native-safe-area-context`
- [ ] `pnpm add @tanstack/react-query`
- [ ] `pnpm add expo-image expo-haptics expo-secure-store`
- [ ] `pnpm add react-native-gesture-handler`
- [ ] Configure `nativewind` in `tailwind.config.js` + `babel.config.js`
- [ ] Configure `expo-router` in `app.json`: set `"scheme": "zenzo"`, `"web.bundler": "metro"`

### MA0.4 — Supabase client
- [ ] Create `apps/mobile/lib/supabase.ts`:
  ```ts
  import { createClient } from '@supabase/supabase-js'
  import AsyncStorage from '@react-native-async-storage/async-storage'

  export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
  )
  ```
- [ ] Create `apps/mobile/.env`: `EXPO_PUBLIC_SUPABASE_URL=`, `EXPO_PUBLIC_SUPABASE_ANON_KEY=`
- [ ] Verify: call `supabase.auth.getSession()` on app launch — returns `null` (no crash)

### MA0.5 — Shared package wiring
- [ ] Add to `apps/mobile/package.json`: `"@zenzo/database": "workspace:*"`, `"@zenzo/utils": "workspace:*"`
- [ ] Verify import works: `import { InterestSlug } from '@zenzo/database'` compiles
- [ ] If Metro can't resolve workspace packages: add `watchFolders` to `metro.config.js`

### MA0.6 — Design system foundation
- [ ] Create `apps/mobile/constants/theme.ts`:
  - Colors: surface, border, text, action, status tokens (matching web's `globals.css` dark theme)
  - Typography: font sizes, weights (use system fonts initially)
  - Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48
- [ ] Create `apps/mobile/components/ui/Button.tsx` — primary, secondary, danger, ghost variants
- [ ] Create `apps/mobile/components/ui/Input.tsx` — text input with label, error, focus states
- [ ] Create `apps/mobile/components/ui/Card.tsx` — surface-raised card with border
- [ ] Create `apps/mobile/components/ui/Avatar.tsx` — circular, initials fallback, image support
- [ ] Create `apps/mobile/components/ui/Badge.tsx` — status badge (active/overdue/expired/pending)
- [ ] Create `apps/mobile/components/ui/Skeleton.tsx` — shimmer loading placeholder
- [ ] Create `apps/mobile/components/ui/Toast.tsx` — success/error toast notification

### MA0.7 — App config
- [ ] Configure `app.json`:
  - `name`: "Zenzo"
  - `slug`: "zenzo"
  - `scheme`: "zenzo"
  - `android.package`: "club.zenzo.app"
  - `android.adaptiveIcon`: create 1024×1024 icon with Forge Orange theme
  - `splash`: create splash screen (Zenzo wordmark, dark background)
- [ ] Create `eas.json` for EAS Build (development + preview + production profiles)
- [ ] Run `eas build --platform android --profile development` — verify APK builds

### MA0.8 — API fetch wrapper
- [ ] Create `apps/mobile/lib/api.ts`:
  ```ts
  export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const session = await supabase.auth.getSession()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token}`,
        ...options?.headers,
      },
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
  ```
- [ ] Set `API_BASE_URL` from env (same domain as web: `https://zenzo.club` or local dev)

**Gate: app builds, Supabase connects, shared packages import. Proceed to MA1.**

---

## Sprint MA1 — Auth Screens ⬜

> **Goal:** Users can sign up, log in, verify OTP, and reset password. Session persists across restarts.

### MA1.1 — Auth context + session hook
- [ ] Create `apps/mobile/lib/auth-context.tsx`:
  - `AuthProvider` wrapping the app
  - `useAuth()` hook: returns `{ user, session, loading, signIn, signUp, signOut }`
  - On mount: `supabase.auth.getSession()` + `supabase.auth.onAuthStateChange()` listener
  - `loading = true` until initial session check completes
- [ ] Create `apps/mobile/app/_layout.tsx`:
  - Wrap with `<AuthProvider>`, `<QueryClientProvider>`, `<SafeAreaProvider>`
  - Root navigation: if `loading` → splash, if `!user` → `(auth)`, if `user` → `(tabs)`

### MA1.2 — Login screen
- [ ] Create `apps/mobile/app/(auth)/login.tsx`
- [ ] UI:
  - Zenzo wordmark (top center)
  - "Welcome back" heading
  - Email or Phone input (single field, auto-detect +91 = phone)
  - Password input (show/hide toggle)
  - [Log In] primary button (full width)
  - "Forgot Password?" text link → `/(auth)/forgot-password`
  - "Don't have an account? Sign up" → `/(auth)/signup`
- [ ] Logic:
  - `supabase.auth.signInWithPassword({ email, password })` or phone-based
  - On success: `POST /api/auth/profile` → read `{ clubSlug, role, destination }`
  - Route: `club_staff` → dashboard, `club_memberships` only → `/portal`, neither → `/portal`
  - On error: inline error message (not toast — keep user on page)
- [ ] Loading state: button shows spinner, inputs disabled

### MA1.3 — Signup screen
- [ ] Create `apps/mobile/app/(auth)/signup.tsx`
- [ ] UI:
  - "Create your account" heading
  - Full Name input (required)
  - Phone input (+91 prefix, 10 digits, required)
  - Email input (required)
  - Password input (min 8 chars, show/hide, strength indicator)
  - [Sign Up] primary button
  - "Already have an account? Log in" → `/(auth)/login`
- [ ] Logic:
  - Validate: name ≥ 2 chars, phone = 10 digits, email format, password ≥ 8 chars
  - `POST /api/auth/signup` → send WhatsApp OTP
  - On success: navigate to `/(auth)/verify-otp` with phone as param
  - Read `?token` from deep link → pass through to OTP screen
- [ ] Error handling: "Phone already registered" / "Email already taken" inline

### MA1.4 — OTP verification screen
- [ ] Create `apps/mobile/app/(auth)/verify-otp.tsx`
- [ ] UI:
  - "Verify your phone" heading
  - "We sent a code to +91 XXXXX XXXXX" subtext
  - 6-digit code input (auto-focus first box, auto-advance on digit)
  - [Verify] primary button (enabled only when 6 digits entered)
  - "Resend OTP" text link (disabled with countdown: 60s, 45s, 30s on each resend)
  - "X attempts remaining" helper text
- [ ] Logic:
  - `POST /api/auth/verify-otp` with `{ phone, code }`
  - Max 3 attempts → "Too many attempts. Request a new code."
  - 5-minute expiry → "Code expired. Request a new one."
  - On success: `supabase.auth.signUp()` → if invite token → activate invite → portal, else → interests
- [ ] Keyboard: auto-show numeric keyboard, auto-focus

### MA1.5 — Forgot password screen
- [ ] Create `apps/mobile/app/(auth)/forgot-password.tsx`
- [ ] UI:
  - "Reset password" heading
  - Email input
  - [Send Reset Link] button
  - "Back to login" link
- [ ] Logic:
  - `supabase.auth.resetPasswordForEmail(email)`
  - On success: "Check your email for the reset link" confirmation screen
- [ ] No phone-based reset in Phase 1

### MA1.6 — Google Sign-In
- [ ] Install `expo-auth-session`, `expo-web-browser`
- [ ] Create `apps/mobile/app/(auth)/google.tsx` (or inline button on login)
- [ ] [Sign in with Google] button with Google logo
- [ ] `supabase.auth.signInWithOAuth({ provider: 'google' })` via `expo-auth-session`
- [ ] On success: check if `users.phone` is empty → redirect to complete-profile
- [ ] Complete-profile: phone input → `PATCH /api/profile` → continue to routing

### MA1.7 — Post-auth routing
- [ ] Create `apps/mobile/lib/post-auth-router.ts`:
  ```ts
  export async function getPostAuthDestination(user): Promise<string> {
    const profile = await apiFetch('/api/auth/profile', { method: 'POST' })
    if (profile.destination === '/clubs') return '/(dashboard)/clubs' // 2+ clubs
    if (profile.clubSlug) return `/(dashboard)/${profile.clubSlug}/dashboard`
    if (profile.destination === '/onboarding/interests') return '/onboarding/interests'
    return '/(tabs)/home' // member home / empty state
  }
  ```
- [ ] Wire into auth context: on `signIn` / `signUp` success → call router → navigate

### MA1.8 — Invite deep link handling
- [ ] Configure `expo-linking` for `https://zenzo.club/signup?token=xxx`
- [ ] In signup screen: read token from URL params
- [ ] After OTP verification: `POST /api/auth/activate-invite?token=xxx`
- [ ] On success: navigate to portal with "Welcome!" toast
- [ ] On token expired/invalid: show error, continue to normal portal

**Acceptance: user can signup → OTP → land on interests/portal. Login → dashboard/portal. Session survives app restart.**

---

## Sprint MA2 — Interest Onboarding ⬜

> **Goal:** New users select interests + city. Stored in DB. Redirects to discover.

### MA2.1 — Interests screen
- [ ] Create `apps/mobile/app/onboarding/interests.tsx`
- [ ] UI (dark theme, full screen):
  - "What are you into?" heading (bold, 24px)
  - "We'll show you clubs that match." subtext (muted, 14px)
  - 2×4 grid of interest cards (each ~160×100px):
    - 🥋 Martial Arts, 💪 Fitness, 💃 Dance, 🧘 Yoga
    - 🥊 Boxing, 🏊 Swimming, 🏋️ CrossFit, 🎯 Other
  - Each card: emoji (32px) + label (13px) + ring highlight on select (forge orange border)
  - State: local array of selected slugs, tap toggles
  - City input below grid: autocomplete with top 50 Indian cities (from `@zenzo/database` const)
  - [Let's go →] primary button (disabled until ≥ 1 interest selected)
  - "Skip for now →" small text link below
- [ ] Loading state: 8 shimmer cards matching grid layout

### MA2.2 — Save interests
- [ ] On "Let's go →":
  - `POST /api/users/interests` with `{ slugs: string[], city?: string }`
  - On success: navigate to `/(tabs)/discover`
  - On error: toast "Something went wrong", keep selections
- [ ] On "Skip for now →":
  - `POST /api/users/interests` with `{ slugs: [] }` (sets onboarding_step = 'interests_skipped')
  - Navigate to `/(tabs)/discover`

### MA2.3 — Revisit guard
- [ ] In auth router: if `user.onboarding_step` is null/undefined → redirect to interests
- [ ] If user navigates back to interests from discover: pre-fill saved selections from DB
  - On mount: `GET` user interests from profile endpoint → pre-select cards

**Acceptance: new user → interests screen → select 3 → city → "Let's go" → lands on discover.**

---

## Sprint MA3 — Tab Navigation Shell ⬜

> **Goal:** Bottom tab bar with Home, Discover, Search, Profile. Top bar with avatar.

### MA3.1 — Tab layout
- [ ] Create `apps/mobile/app/(tabs)/_layout.tsx`
- [ ] Bottom tab bar with 4 tabs:
  - Home (🏠) → `/(tabs)/home`
  - Discover (🔍) → `/(tabs)/discover`
  - Search (🔎) → `/(tabs)/search`
  - Profile (👤) → `/(tabs)/profile`
- [ ] Active state: filled icon + label in forge orange
- [ ] Inactive state: outline icon + label in muted text
- [ ] Tab bar height: 56px with safe area bottom padding
- [ ] Hide tab bar on certain screens (e.g., full-screen views) via `tabBarStyle`

### MA3.2 — Top bar component
- [ ] Create `apps/mobile/components/TopBar.tsx`
- [ ] Left: "zenzo" wordmark (16px bold, text-primary)
- [ ] Right: avatar circle (32px, tap → profile tab)
  - If `avatar_url`: show image
  - Else: show initials on forge-orange background
- [ ] Used as header in all tab screens

### MA3.3 — Home tab dynamic routing
- [ ] Home icon href resolves dynamically:
  - User has `club_memberships` → shows portal (list of clubs)
  - User has no memberships → shows "Find your first club" empty state with CTAs

**Acceptance: bottom tabs navigate correctly. Active state visible. Avatar shows in top bar.**

---

## Sprint MA4 — Discovery Home ✅

> **Goal:** Personalized club feed based on user interests and city.

### MA4.1 — Discover screen
- [x] Create `apps/mobile/app/(tabs)/discover.tsx`
- [x] Uses `@tanstack/react-query` for data fetching: `useQuery(['discover'], () => apiFetch('/api/discover'))`
- [x] UI sections (top to bottom):
  1. **Invites banner** (if `inviteCount > 0`): amber pill "You have N pending invites →" → portal invites
  2. **Heading**: "For you in [City]" or "Clubs matching your interests"
  3. **Club cards**: FlatList, 2-col grid
  4. **"Explore all clubs →"** link at bottom
- [x] Empty state: "No clubs match your interests in [City] yet.\nExplore all clubs →"
- [x] Pull-to-refresh: `RefreshControl` on FlatList
- [x] Loading: 6 shimmer cards in 2-col grid

### MA4.2 — Club card component
- [x] Create `apps/mobile/components/search/ClubCard.tsx`
- [x] Props: `{ id, slug, name, business_type, city, description, avg_rating, logo_url }`
- [x] Renders:
  - Category emoji or logo image (48x48, rounded)
  - Club name (bold, 1 line, truncated)
  - Category badge pill
  - City text (muted)
  - Star rating: "★ 4.5" in amber (if rating > 0)
  - Description snippet (2 lines max, ellipsis)
- [x] Pressable: navigate to `/club/${slug}`
- [x] Create `apps/mobile/components/search/ClubCardSkeleton.tsx` — shimmer matching layout

**Acceptance: discover loads personalized feed. Cards show. Tap → club detail. Pull to refresh.**

---

## Sprint MA5 — Explore Clubs ✅

> **Goal:** Full club exploration with search, filters, infinite scroll.

### MA5.1 — Explore screen (in discover, or separate)
- [x] Enhance `/(tabs)/discover.tsx` or create separate explore route
- [x] Search bar: sticky at top, debounced 300ms, clear (X) button
- [x] Category filter chips: horizontal ScrollView, single-select
  - All · Gym · Yoga · Martial Arts · Dance · Boxing · Swimming · CrossFit · Other
  - Active chip: filled bg (forge orange), inactive: border-only
- [x] City filter: text input with autocomplete
- [x] Results: FlatList with `onEndReached` → fetch next page (cursor pagination)
- [x] `useInfiniteQuery` for paginated fetch: `GET /api/search/clubs?q=&category=&cursor=`

### MA5.2 — Advanced filters (bottom sheet)
- [x] Install `@gorhom/bottom-sheet`
- [x] Create `apps/mobile/components/search/AdvancedFilters.tsx`
- [x] "Filters" button with active count badge
- [x] Bottom sheet sections:
  - Category (single-select pills)
  - Subcategories (multi-select chips)
  - Amenities (multi-select chips — AC, Parking, Shower, etc.)
  - Price Range (Budget · Mid · Premium)
  - Minimum Rating (4+ · 3+ · Any)
  - Sort By (Relevance · Rating · Price ↑ · Price ↓ · Newest)
- [x] Footer: [Clear All] + [Apply (N)] buttons
- [x] On Apply: close sheet, refetch with new params

### MA5.3 — Near Me button
- [x] Create `apps/mobile/components/search/NearMeButton.tsx`
- [x] "Near Me 📍" button
- [x] `expo-location`: request `foregroundPermission`
- [x] On success: show radius pills (1km · 3km · 5km · 10km)
- [x] Pass `lat`, `lng`, `radius_km` to search API
- [x] On denied: toast "Location permission denied"
- [x] Loading state: pulse animation while fetching location

### MA5.4 — Featured carousel
- [x] Create `apps/mobile/components/search/FeaturedCarousel.tsx`
- [x] Horizontal ScrollView of featured club cards
- [x] `GET /api/search/featured` — show when no active search query
- [x] Each item: cover image (or placeholder), name, rating badge, category
- [x] Pressable → club detail

### MA5.5 — Active filter chips
- [x] Create `apps/mobile/components/search/ActiveFilterChips.tsx`
- [x] Shown above results when any filter active
- [x] Each chip: label + (X) to remove
- [x] Horizontal scroll

**Acceptance: search, filter, infinite scroll all work. Near Me gets location. Filters apply correctly.**

---

## Sprint MA6 — Club Detail Screen ⬜

> **Goal:** Full public club page with all sections.

### MA6.1 — Club detail screen
- [ ] Create `apps/mobile/app/club/[slug].tsx`
- [ ] Fetch: `GET /api/clubs/${slug}/public` (public, no auth)
- [ ] ScrollView layout, sections:

### MA6.2 — Hero section
- [ ] Cover image (full-width, 200px height) or category gradient placeholder
- [ ] Club name overlay (white text, semi-transparent dark gradient at bottom)
- [ ] Verified badge (✓ blue) if `verification_status = 'verified'`
- [ ] Back button (top-left, translucent circle)

### MA6.3 — Info section
- [ ] Category badge + subcategory pills
- [ ] City + Area
- [ ] Star rating + review count: "★ 4.5 (23 reviews)"
- [ ] Tagline (italic, muted)

### MA6.4 — About section
- [ ] Description text (expandable: show 3 lines → "Read more")
- [ ] Amenity icons row (top 6, show "+" badge for more)

### MA6.5 — Plans & Pricing section
- [ ] Card per plan: name, ₹ amount (formatted), billing cycle, description
- [ ] "Starting from ₹X/mo" header

### MA6.6 — Schedule section
- [ ] Card per batch: name, timing (6:00–7:30 AM), days (Mon–Fri pills), coach name
- [ ] "Batches" section header with count

### MA6.7 — Coaches section
- [ ] Horizontal scroll of coach avatars: avatar circle + name + role
- [ ] Pressable → `/coaches/${userId}`

### MA6.8 — CTAs section (sticky bottom)
- [ ] If `trial_enabled`: "Book a Trial" secondary button (shows price/free)
- [ ] "Contact on WhatsApp" button → `Linking.openURL('https://wa.me/91${phone}')`
- [ ] "Join This Club" primary button (future — enrollment flow)

### MA6.9 — Reviews section (stub)
- [ ] "Reviews" section header
- [ ] "No reviews yet. Be the first!" placeholder
- [ ] Will be wired in Phase 2 (Sprint MA-RV)

### MA6.10 — Loading + error states
- [ ] Skeleton matching layout (hero shimmer + 4 section shimmers)
- [ ] 404: "Club not found" with back button
- [ ] Share button in top-right: native share sheet with club URL

**Acceptance: club page loads all sections. WhatsApp CTA works. Navigation back works.**

---

## Sprint MA7 — Member Portal ⬜

> **Goal:** Members see their clubs, attendance, payments, and receipts.

### MA7.1 — Portal home (Home tab)
- [ ] Enhance `apps/mobile/app/(tabs)/home.tsx`
- [ ] Fetch: `GET /api/portal` — user's memberships
- [ ] Membership cards: FlatList
  - Each card: club logo/initials (48px), club name, status badge, batch name, next due date
  - Status badges: Active (green ✓), Overdue (amber ⚠), Expired (red ✗), Trial (blue 🔵), Pending (grey ⏳)
  - Overdue cards: amber border + "₹X overdue" + [Pay Now] chip
- [ ] Empty state (no memberships):
  - "No memberships yet"
  - [Explore Clubs] CTA → discover tab
  - [Check Invites] CTA → invites screen
  - [Create a Club] CTA → onboarding (if user wants to be owner)
- [ ] Pull-to-refresh

### MA7.2 — Club portal screen
- [ ] Create `apps/mobile/app/portal/[clubSlug].tsx`
- [ ] Fetch membership details for this user+club
- [ ] 3 tabs using top tab navigator (or scrollable tabs):

### MA7.3 — Portal: Home tab
- [ ] Attendance this month: circular progress ring (e.g., "12/20")
- [ ] "Present X times this month" text
- [ ] Next fee section: amount, due date, days remaining
- [ ] Last payment: amount, date, method
- [ ] Batch schedule: day/time grid
- [ ] Quick stats: streak count, total attendance

### MA7.4 — Portal: Attendance tab
- [ ] Calendar view: month grid
  - Green dot = present, Red dot = absent, Grey = no class
  - Swipe left/right between months
- [ ] Monthly summary: "15 present · 3 absent · 2 no-class"
- [ ] Streak counter: "🔥 5 day streak"
- [ ] Tap on a day: bottom sheet showing batch + status for that day

### MA7.5 — Portal: Payments tab
- [ ] Next due: amount, date, plan name
- [ ] Payment history: FlatList
  - Each row: date, amount (₹ formatted), method badge, reference
  - Pressable → receipt detail
- [ ] "No payments recorded yet" empty state

### MA7.6 — Receipt detail screen
- [ ] Create `apps/mobile/app/portal/[clubSlug]/payment/[paymentId].tsx`
- [ ] Header: "✓ Payment Successful" with green checkmark
- [ ] Fields: Amount (large, bold), Club, Member, Date, Plan, Method, Reference
- [ ] [Share] button → native share sheet (text summary of receipt)

### MA7.7 — Pending invites screen
- [ ] Create `apps/mobile/app/portal/invites.tsx`
- [ ] Fetch: `GET /api/portal/invites` or from invite endpoints
- [ ] Each invite card: club name, invited by, plan, batch, expiry date
- [ ] [Accept] → `POST /api/auth/activate-invite` → refresh + toast "Welcome!"
- [ ] [Decline] → confirm dialog → mark expired → remove from list
- [ ] Empty state: "No pending invites"

**Acceptance: member sees clubs, attendance heatmap, payments. Accept invite works.**

---

## Sprint MA8 — Search Screen ⬜

> **Goal:** Unified search across clubs, coaches, members.

### MA8.1 — Search screen
- [ ] Create `apps/mobile/app/(tabs)/search.tsx`
- [ ] Sticky search bar at top (auto-focus on tab entry)
- [ ] 3 tab pills below: Clubs · Coaches · Members
- [ ] Debounced input (300ms) → `GET /api/search?q=${q}&type=${tab}`

### MA8.2 — Clubs search results
- [ ] Club result card: category emoji, name, city, rating
- [ ] Pressable → `/club/${slug}`
- [ ] Empty: "No clubs found for '[query]'"
- [ ] Skeleton: 5 shimmer list items

### MA8.3 — Coaches search results
- [ ] Coach result card: avatar circle (initials fallback), name, clubs list, rating
- [ ] Pressable → `/coaches/${userId}`
- [ ] Empty: "No coaches found for '[query]'"

### MA8.4 — Members search results
- [ ] Member result card: avatar, name, @username, interest pills
- [ ] Pressable → `/u/${username}`
- [ ] Empty: "No members found for '[query]'"
- [ ] Auth required to search members (show "Sign in to search members" if anon)

### MA8.5 — Autocomplete dropdown
- [ ] On input focus: show recent searches (from AsyncStorage, last 10)
- [ ] After 2+ chars: fetch `GET /api/search/suggest?q=` → show suggestion list
- [ ] Each suggestion: label, type badge (Club / Coach)
- [ ] Tap suggestion: fill bar + execute search
- [ ] "Clear history" link at bottom of recents
- [ ] Store search on submit: `AsyncStorage.setItem('zenzo_recent_searches', JSON.stringify(...))`

**Acceptance: search all 3 types works. Autocomplete shows. Recent searches persist.**

---

## Sprint MA9 — Public Profiles ⬜

> **Goal:** View member and coach profiles. Edit own profile.

### MA9.1 — Member public profile
- [ ] Create `apps/mobile/app/u/[username].tsx`
- [ ] Fetch user by username (from search result or direct link)
- [ ] Avatar (80px) + full name + @username + "Member since [date]"
- [ ] Interest pills row: emoji + label for each interest
- [ ] Clubs section: list of clubs (name + category badge)
- [ ] Achievements grid: badge emoji + title + club + date
  - Empty: "No achievements yet"
- [ ] Stats: "Attended X classes total"
- [ ] 404: "User not found" with back button

### MA9.2 — Coach public profile
- [ ] Create `apps/mobile/app/coaches/[userId].tsx`
- [ ] Fetch coach data (from search result or club page link)
- [ ] Avatar (80px) + name + "Coach at [Club1], [Club2]"
- [ ] Bio section (expandable)
- [ ] Rating: "★ 4.5 (12 ratings)" or "No ratings yet"
- [ ] Specializations pills
- [ ] Experience: "8 years experience"
- [ ] Session price: "₹500/session"
- [ ] Languages: "Telugu, English, Hindi"
- [ ] Availability dot: green = available
- [ ] Batches: club name + batch name + timing
- [ ] CTA: "Train with [Name] →" → linked club page
- [ ] Certifications list

### MA9.3 — Own profile edit (Profile tab)
- [ ] Create `apps/mobile/app/(tabs)/profile.tsx`
- [ ] Avatar section:
  - Current avatar (80px) or initials circle
  - [Change Photo] → `expo-image-picker` (camera or gallery)
  - Upload to Supabase Storage `avatars` bucket, max 2MB, resize to 200×200
  - Update `users.avatar_url` via `PATCH /api/profile`
- [ ] Full Name input (editable)
- [ ] Phone input (read-only, shown as text)
- [ ] Email input (editable)
- [ ] Username input:
  - On blur: `GET /api/profile/check-username?u=${value}`
  - Green ✓ "Available" / Red ✗ "Taken" / "Invalid format" / "Reserved"
- [ ] Bio textarea (160 char, character count shown)
- [ ] City: autocomplete input (same city list as interests)
- [ ] Interests: re-selectable pills (8 cards, tap toggles)
- [ ] [Save] button → `PATCH /api/profile`
- [ ] Success toast: "Profile updated"
- [ ] [Log Out] danger button at bottom → `supabase.auth.signOut()` → auth screen

**Acceptance: view others' profiles. Edit own: avatar upload, username check, bio, interests. Logout works.**

---

## Sprint MA10 — QR Check-In (Consumer Side) ⬜

> **Goal:** Members scan QR code at gym to mark attendance.

### MA10.1 — Deep link handler for check-in
- [ ] Configure universal link: `https://zenzo.club/checkin?b={batchId}&t={token}`
- [ ] In `app.json`: add `intentFilters` for this URL pattern
- [ ] Create `apps/mobile/app/checkin.tsx`

### MA10.2 — Check-in screen
- [ ] Parse `batchId` and `token` from URL params
- [ ] Validate token (or call API to validate server-side)
- [ ] Show: Zenzo wordmark, batch name, date, name input, phone input
- [ ] [Check In] button → `POST /api/checkin` with `{ batchId, token, phone, name }`
- [ ] Success: "✓ Checked in!" with green checkmark animation
- [ ] Error: "QR expired. Ask your coach for a fresh one."
- [ ] Error: "Invalid link."

**Acceptance: scanning QR in camera app → opens Zenzo → check-in completes.**

---

## Sprint MA11 — Polish + App Store ⬜

> **Goal:** Final polish, performance, accessibility. Submit to Play Store.

### MA11.1 — Animations & micro-interactions
- [ ] Screen transitions: slide from right (stack), fade (tabs)
- [ ] Card press: `scale(0.98)` on press down, `scale(1)` on release
- [ ] Filter chips: `active:scale(0.95)` spring animation
- [ ] Skeleton shimmers: smooth gradient animation
- [ ] Attendance toggle: `expo-haptics` vibrate on toggle
- [ ] Pull-to-refresh: custom refresh indicator with Zenzo branding
- [ ] Toast entry: slide from top with spring animation

### MA11.2 — Accessibility
- [ ] All touchable: `accessibilityLabel`, `accessibilityRole="button"`
- [ ] Star ratings: `accessibilityLabel="4.5 out of 5 stars"`
- [ ] Tab bar: `accessibilityLabel` per tab
- [ ] Minimum tap targets: 44×44px (iOS guideline)
- [ ] Screen reader: logical focus order on all screens
- [ ] Dynamic text sizing support (respect OS font scale)

### MA11.3 — Performance
- [ ] FlatList: `getItemLayout` for fixed-height items (skip measurement)
- [ ] Images: `expo-image` with cached: disk policy
- [ ] React Query: staleTime 5min for discovery, 0 for portal data
- [ ] Memoize expensive components: `React.memo` on cards
- [ ] Lazy load heavy screens: `React.lazy` with Suspense

### MA11.4 — Error handling
- [ ] Global error boundary: catch unhandled errors, show "Something went wrong" with [Retry]
- [ ] Network error: "No internet connection. Check your connection and try again." with [Retry]
- [ ] Session expired: auto-redirect to login with "Session expired. Please log in again."
- [ ] API errors: parse error message, show in toast or inline

### MA11.5 — App Store submission
- [ ] Generate signed AAB: `eas build --platform android --profile production`
- [ ] Create Google Play Console listing:
  - App name: "Zenzo — Fitness & Club Discovery"
  - Short description: "Find gyms, martial arts, dance & yoga clubs near you"
  - Full description: feature list + value prop
  - Screenshots: 5+ screens (phone), optional tablet
  - Feature graphic: 1024×500
  - Category: Health & Fitness
  - Content rating questionnaire
  - Privacy policy URL
  - Data safety form
- [ ] Upload AAB → Internal Testing track → verify on real device → Production

**Gate: app submitted to Play Store.**

---

## Future Sprints (Post-Launch)

### MA-RV — Ratings & Reviews
> Wire star rating component + review form + club review section

### MA-ACH — Achievements
> Badge grid component + achievement display on profiles and portal

### MA-PAY — Consumer Payments
> Install `react-native-razorpay` + Pay Now flow + enrollment checkout

### MA-ENROLL — Enrollment Flow
> Plan selection → batch selection → Razorpay checkout → success

### MA-TRIAL — Trial Booking
> Calendar date picker + batch selection + booking confirmation

### MA-DASH — B2B Dashboard (Owner/Coach)
> Owner: KPIs + needs attention + quick actions. Coach: today's batches.

### MA-ATT — Take Attendance (Coach/Owner)
> Toggle list + offline queue (MMKV) + sync indicator + drop-in

### MA-MEM — Member Management
> Member list + profile + invite + actions

### MA-MAP — Map View
> `react-native-maps` + club pins + mini-card popups

### MA-PUSH — Push Notifications
> `expo-notifications` + token registration + deep link on tap

---

## Dependency Map

```
MA0 (Scaffold)
 └── MA1 (Auth)
      ├── MA2 (Interests)
      │    └── MA4 (Discovery)
      │         └── MA5 (Explore)
      │              └── MA6 (Club Detail)
      ├── MA3 (Tab Nav) ← can run parallel with MA2
      ├── MA7 (Portal) ← depends on MA3
      ├── MA8 (Search) ← depends on MA3
      ├── MA9 (Profiles) ← depends on MA3
      └── MA10 (QR Check-In) ← depends on MA1 only

MA11 (Polish) ← after all above
```

**Parallelizable pairs:**
- MA2 + MA3 (interests + tab nav — no dependency between them)
- MA5 + MA7 (explore + portal — independent screens)
- MA8 + MA9 (search + profiles — independent screens)
- MA10 can be built anytime after MA1

---

## Status Tracker

| Sprint | Name | Tasks | Status |
|---|---|---|---|
| MA0 | Project Scaffold | 8 | ⬜ Not started |
| MA1 | Auth Screens | 8 | ⬜ Not started |
| MA2 | Interest Onboarding | 3 | ⬜ Not started |
| MA3 | Tab Navigation Shell | 3 | ⬜ Not started |
| MA4 | Discovery Home | 2 | ✅ Completed |
| MA5 | Explore Clubs | 5 | ✅ Completed |
| MA6 | Club Detail | 10 | ⬜ Not started |
| MA7 | Member Portal | 7 | ⬜ Not started |
| MA8 | Search | 5 | ⬜ Not started |
| MA9 | Public Profiles | 3 | ⬜ Not started |
| MA10 | QR Check-In | 2 | ⬜ Not started |
| MA11 | Polish + Play Store | 5 | ⬜ Not started |
| **Total** | | **61 tasks** | |

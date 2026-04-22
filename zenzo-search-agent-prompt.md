# Claude Code Prompt — Zenzo Coach & Club Search 100x Upgrade

---

> **How to use**: Copy the section between the ``` markers into Claude Code. It is self-contained and designed for maximum agent output quality.

---

## THE PROMPT

```
You are upgrading the Coach Search and Club Search features in Zenzo to be on par with consumer-grade discovery apps like Playo, Cult.fit, ClassPass, and Google Maps local search.

## Context

Zenzo is a horizontal membership management SaaS (gyms, martial arts, dance, yoga, tuition centers). Stack: Turborepo monorepo, Next.js 14 App Router, TypeScript, Tailwind CSS, Shadcn/UI, Supabase (Postgres + Auth + Storage + Edge Functions + PostGIS), Razorpay, Vercel. Mobile-first. The current coach search and club search are basic list/filter views. They need to become a full discovery experience.

## Your Task

Upgrade coach search and club search to a **Playo/Cult.fit-grade discovery system**. This means:

### 1. Study the Codebase First

Before writing ANY code:
- Read the full project structure, existing schemas, existing search components, existing API routes, and existing types/interfaces related to clubs and coaches.
- Identify every file that touches coach or club listing, searching, filtering, or detail views.
- List what currently exists vs what's missing compared to a Playo-level experience.
- Present your gap analysis to me before proceeding.

### 2. Data Model Gaps

Evaluate the current Supabase schema for clubs and coaches. A pro discovery system needs at minimum:
- **Clubs**: slug, tagline, description, logo, cover image, gallery, category (gym/yoga/martial_arts/dance/tuition), subcategories array, amenities array, operating hours (JSONB), full address with area/locality, PostGIS geography point for geo-search, Google Maps link, social links, verified badge, featured flag, avg rating, review count, member count, price range indicator, starting price, established year, and a tsvector column for Postgres full-text search with weighted triggers (name=A, tagline/area/subcategories=B, description/amenities=C).
- **Coaches**: slug, display name, bio, avatar, specializations array, certifications array, experience years, languages array, independent/freelance flag, PostGIS point, session price, verified badge, avg rating, review count, availability status, gender (for filter preference), and tsvector with weighted triggers.
- **Reviews table** (if missing): polymorphic — reviewable_type (club/coach), reviewable_id, user_id, rating (1-5), comment, created_at.

Write migrations for anything missing. Do NOT drop existing columns or data.

### 3. Search API — Supabase Edge Functions or Server Actions

Build search endpoints that support ALL of the following simultaneously:
- **Text search**: Postgres full-text search using ts_query against the tsvector columns. Support partial matching and typo tolerance via trigram similarity (pg_trgm) as fallback.
- **Geo search**: "Near me" using PostGIS ST_DWithin with configurable radius (1km, 3km, 5km, 10km). Return distance in results. Sort by distance when geo-active.
- **Category filter**: Single-select (gym, yoga, martial_arts, dance, tuition).
- **Subcategory filter**: Multi-select chips (crossfit, powerlifting, calisthenics, zumba, kickboxing, etc — dynamic from data).
- **Amenities filter** (clubs): Multi-select (AC, parking, shower, locker, steam, sauna, cafe, wifi).
- **Specialization filter** (coaches): Multi-select (weight loss, muscle gain, rehab, sports specific, prenatal, postnatal).
- **Price range filter**: Budget / Mid / Premium, or a min-max slider.
- **Rating filter**: 4+, 3+, or any.
- **Availability filter** (coaches): Available now, accepting new clients.
- **Sort options**: Relevance (default for text search), Distance (default for geo search), Rating (highest first), Price (low to high / high to low), Popularity (member/client count), Newest.
- **Pagination**: Cursor-based, not offset. Return 20 results per page.

The API must accept all filters as query params and combine them with AND logic. Return enriched results with all display fields — no N+1 queries.

### 4. Search UI — The Full Experience

Build these screens/components. Every component must be mobile-first (375px baseline), use only Shadcn/UI + Tailwind, have skeleton loaders during fetch, zero layout shift, and feel like a native app.

#### 4a. Search Landing Page (`/explore` or `/search`)

- **Search bar** pinned to top — large, prominent, with search icon and "Search gyms, coaches, yoga studios..." placeholder. Debounced input (300ms). Shows recent searches (from localStorage) and trending/popular searches as suggestions in a dropdown as user focuses.
- **Quick filter chips** horizontally scrollable below search bar — category pills (All, Gyms, Yoga, Martial Arts, Dance, Coaches). Single-select. Tapping a chip immediately filters results.
- **"Near Me" toggle/button** — requests geolocation permission, activates geo-search with radius selector (pill group: 1km, 3km, 5km, 10km).
- **Featured/Promoted section** — horizontal scroll carousel of featured clubs/coaches with cover image, name, rating badge, category tag. Only shows when no active search query.
- **Results list** — loads below filters. Default: popular/featured when no query. Switches to search results on query input.

#### 4b. Search Results — Club Card

Each club result card must show:
- Cover image (with lazy loading + blur placeholder)
- Verified badge (if verified)
- Club name (bold, truncated to 1 line)
- Category + subcategory tags (small pills)
- Star rating + review count ("4.5 ★ (128)")
- Area/locality ("Madhurawada, Vizag")
- Distance (if geo-search active, "2.3 km away")
- Starting price ("From ₹1,500/mo")
- Amenity icons (top 4, with "+3 more" overflow)
- Open/Closed status (green/red dot based on current time vs operating hours)
- CTA: "View Details" or "Book Trial"

Card must be tappable — navigates to `/club/[slug]`.

#### 4c. Search Results — Coach Card

Each coach result card must show:
- Avatar (circular, lazy loaded)
- Verified badge
- Display name
- Specialization tags (top 3 as small pills)
- Star rating + review count
- Experience ("8 yrs exp")
- Session price ("₹500/session")
- Languages (icon + "Telugu, English")
- Availability status (green dot = available, yellow = busy)
- Area/locality + distance if geo-active
- Club affiliation (if attached to a club, show club name as link)
- CTA: "View Profile" or "Book Session"

Card must be tappable — navigates to `/coach/[slug]`.

#### 4d. Advanced Filters — Bottom Sheet (Mobile) / Sidebar (Desktop)

A "Filters" button next to the search bar opens a bottom sheet on mobile (Shadcn Sheet component, slides up from bottom, 80vh max) or a sidebar panel on desktop. Contains:
- All filter groups from Section 3 above, organized into collapsible sections.
- Each filter group shows active count badge.
- "Clear All" and "Apply" buttons at bottom (sticky).
- Applying filters closes the sheet and updates results with URL query params (so filters are shareable/bookmarkable).

#### 4e. Search Results — View Modes

- **List view** (default on mobile): Vertical stack of cards.
- **Map view** (toggle button): Full-screen map (use Leaflet with OpenStreetMap — no Google Maps API key needed) with club/coach pins. Tapping a pin shows a mini-card popup. Map + list split view on desktop.
- Smooth animated transition between views.

#### 4f. Empty & Error States

- **No results**: Friendly illustration + "No gyms found in Madhurawada. Try expanding your search radius or removing some filters." with a "Clear Filters" button.
- **Search error**: Retry button with toast notification.
- **Loading**: Skeleton cards (3-4 shimmer cards matching the card layout exactly).

### 5. Search UX Polish — What Makes It 100x

These are the details that separate a basic search from Playo-level:

- **URL-driven state**: Every search query, filter, sort, and view mode is reflected in URL params (`/explore?q=crossfit&category=gym&sort=rating&radius=5km`). Back button works. Shareable URLs.
- **Debounced search with instant feedback**: As user types, show a loading spinner in the search bar. Results update after 300ms debounce.
- **Recent searches**: Store last 10 searches in localStorage. Show on search focus. Tap to re-execute. "Clear history" link.
- **Search suggestions/autocomplete**: As user types, show matching club names, coach names, and categories from a lightweight suggestion endpoint (SELECT name FROM clubs WHERE name ILIKE $1 LIMIT 5 UNION SELECT display_name FROM coaches WHERE display_name ILIKE $1 LIMIT 5).
- **Active filter indicators**: Show active filter count on the filter button ("Filters (3)"). Show active filters as removable chips above results.
- **Smooth scroll pagination**: IntersectionObserver-based infinite scroll. Show a small loading spinner at bottom when fetching next page. No "Load More" button.
- **Result count**: "Showing 47 gyms in Visakhapatnam" at top of results.
- **Animated transitions**: Cards fade-in on load (staggered, 50ms delay each). Filter sheet slides up smoothly. View mode toggle cross-fades.
- **Micro-interactions**: Filter chips have a subtle scale-on-tap (active:scale-95 transition). Cards have hover lift on desktop (shadow increase). Rating stars are colored amber.
- **Responsive breakpoints**: 1 column on mobile (<640px), 2 columns on tablet (640-1024px), 3 columns on desktop (>1024px) for card grid.

### 6. Implementation Rules

- Work in phases: Schema → API → UI components → Integration → Polish. Commit after each phase.
- Create all new components in the appropriate app/package within the Turborepo structure.
- Use Supabase client SDK for queries — not raw fetch to Supabase REST API — unless building Edge Functions.
- All search params must be typed with Zod schemas for validation.
- Use React Server Components where possible. Client components only for interactive elements (search input, filters, map).
- Use `nuqs` or manual `useSearchParams` for URL state management — pick whichever is already in the project, or install `nuqs` if neither exists.
- Write the PostGIS extension enable migration: `CREATE EXTENSION IF NOT EXISTS postgis;` and `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- All images must use Next.js Image component with proper width/height/sizes for responsive loading.
- Accessibility: All interactive elements must be keyboard navigable. Filter bottom sheet must trap focus. Search input must have proper aria labels.

### 7. Execution Order

1. Present your gap analysis (what exists vs what's needed). Wait for my approval.
2. Write and run all Supabase migrations.
3. Build the search API layer (server actions or edge functions).
4. Build UI components bottom-up: Card → CardList → Filters → SearchBar → SearchPage.
5. Integrate everything on the `/explore` route.
6. Add map view.
7. Polish pass: animations, empty states, responsive QA, skeleton loaders.
8. Test with seed data — generate 15 realistic Visakhapatnam gyms and 20 coaches as seed data for visual QA.

Do NOT proceed past step 1 without my confirmation.
```

---

## FOLLOW-UP ADD-ON PROMPTS (use after the main build)

### Add-on A: Review System
```
Now add a review/rating system for clubs and coaches. Polymorphic reviews table, star rating (1-5) with comment, user can review after visiting. Show reviews on club/coach detail pages with avg rating auto-calculated via Supabase trigger. Include a "Write a Review" CTA. Prevent duplicate reviews from same user for same entity.
```

### Add-on B: Book a Trial Flow
```
Add a "Book Free Trial" CTA on club cards and detail pages. Tapping it opens a bottom sheet with: name, phone number, preferred date (date picker), preferred time slot (morning/afternoon/evening). On submit, create a record in a trial_bookings table and send a WhatsApp notification to the club owner via Interakt API. Show a success confirmation with the club's address and "Open in Google Maps" link.
```

### Add-on C: Coach Booking
```
Add a "Book Session" flow for coaches. Coach sets available time slots per day in their dashboard. User sees available slots on coach profile, picks one, confirms. Creates a booking record. WhatsApp notification to both coach and user via Interakt.
```

### Add-on D: SEO & Social Sharing
```
Add proper SEO metadata for all club and coach profile pages — dynamic OG images using @vercel/og, structured data (LocalBusiness schema for clubs, Person schema for coaches), and a sitemap.xml that includes all club and coach slugs. Make every club and coach page shareable on WhatsApp with a rich preview.
```

### Add-on E: Owner Analytics
```
Add a search analytics view in the club owner dashboard: how many times their club appeared in search results (impressions), how many profile views, how many trial bookings — over last 7d / 30d / 90d. Store events in a search_events table with created_at timestamps.
```

---

## PROMPT ENGINEERING NOTES (why this prompt works)

| Technique | Where Used | Why |
|---|---|---|
| **Role anchoring** | "You are upgrading..." | Gives the agent a clear mission, not an open-ended ask |
| **Reference anchoring** | "Playo, Cult.fit, ClassPass" | Concrete quality bar instead of vague "make it better" |
| **Codebase-first gate** | Section 1 | Forces the agent to read before writing — prevents hallucinated file paths |
| **Approval checkpoint** | "Do NOT proceed past step 1" | Keeps you in control of a large multi-phase task |
| **Exhaustive spec with zero ambiguity** | Sections 3-5 | Every filter, every card field, every UX detail is named — no room for "I assumed..." |
| **Anti-patterns called out** | "cursor-based not offset", "no N+1", "no Google Maps API" | Prevents common agent mistakes |
| **Exact tech choices** | "Shadcn Sheet", "Leaflet + OSM", "nuqs" | Removes decision paralysis, prevents wrong library installs |
| **Phased execution order** | Section 7 | Agent can't skip ahead or combine steps poorly |
| **Constraint boxing** | Section 6 | "No new UI libraries", "mobile-first", "Zod schemas" — guardrails |
| **Seed data request** | Step 8 | Ensures you can visually QA immediately, with realistic local data |
| **Modular add-ons** | Add-ons A-E | Keeps main prompt focused; each add-on is a clean follow-up session |

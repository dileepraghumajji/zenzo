# Sprint SD — Search & Discovery 100x Upgrade
*Derived from: `zenzo-search-agent-prompt.md`*
*Goal: Upgrade club and coach search to Playo/Cult.fit-grade discovery.*

---

## Overview

The current `/search` and `/explore` pages are basic list-and-filter views. This sprint upgrades them to a full consumer-grade discovery system: geo-search, full-text search, rich cards, advanced filters, map view, and real-time autocomplete.

**Quality bar:** Playo, Cult.fit, ClassPass, Google Maps local search.

---



## Execution Order (locked — do not reorder)

```
SD0 → Gap Analysis           ← must wait for approval before SD1
SD1 → Schema Migrations      ← PostGIS, tsvector, new columns
SD2 → Search APIs            ← text + geo + all filters + cursor pagination
SD3 → UI Components          ← cards, search bar, filters, skeletons
SD4 → Integration            ← /explore route, URL state, autocomplete, infinite scroll
SD5 → Map View               ← Leaflet + OSM, pins, mini-card popups
SD6 → Polish                 ← animations, a11y, responsive QA, micro-interactions
SD7 → Seed Data              ← 15 Vizag gyms + 20 coaches for visual QA
```

---

## Sprint SD0 — Gap Analysis *(Planning — no code)*

> Read the codebase first. Present analysis. Wait for approval before writing any code.

| # | Task |
|---|---|
| SD0.1 | Read all files that touch club/coach listing, searching, filtering, or detail views |
| SD0.2 | Read existing search components: `/search/page.tsx`, `/explore/page.tsx`, `/api/search/route.ts`, `/api/clubs/explore/route.ts` |
| SD0.3 | Read existing DB schema: `clubs`, `users`, `club_staff`, relevant migrations |
| SD0.4 | Identify every field that exists vs every field required by Sections 2–4 of the spec |
| SD0.5 | Identify every filter/sort that exists vs what's required |
| SD0.6 | Identify every UI component that exists vs what needs building |
| SD0.7 | Present gap analysis table: **exists** vs **missing** vs **needs upgrade** |

**Gate: Do NOT proceed past SD0 without user approval.**

## SD0 Results *(Approved — 2026-04-22)*

> Architectural decision: **no separate `coaches` table**. Coach-specific discovery fields (`specializations`, `certifications`, `experience_years`, `session_price_paise`, `is_available`, etc.) added as nullable columns on `users`. Coaches remain `club_staff.role = 'coach'`. Existing `/coaches/[userId]` routes and `coach_ratings.coach_user_id` references unchanged.

### SD0.4 — DB Fields

| Field | Table | Status |
|---|---|---|
| `id, slug, name, business_type, city, phone, logo_url, description, listed, avg_rating` | `clubs` | ✅ Exists |
| `verification_status` | `clubs` | ✅ Exists |
| `tagline` | `clubs` | ❌ Missing → SD1.2 |
| `cover_image_url` | `clubs` | ❌ Missing → SD1.2 |
| `gallery TEXT[]` | `clubs` | ❌ Missing → SD1.2 |
| `subcategories TEXT[]` | `clubs` | ❌ Missing → SD1.2 |
| `amenities TEXT[]` | `clubs` | ❌ Missing → SD1.2 |
| `operating_hours JSONB` | `clubs` | ❌ Missing → SD1.2 |
| `area TEXT` (locality) | `clubs` | ❌ Missing → SD1.2 |
| `full_address TEXT` | `clubs` | ❌ Missing → SD1.2 |
| `google_maps_url TEXT` | `clubs` | ❌ Missing → SD1.2 |
| `social_links JSONB` | `clubs` | ❌ Missing → SD1.2 |
| `location geography(Point,4326)` | `clubs` | ❌ Missing → SD1.2 |
| `featured BOOLEAN` | `clubs` | ❌ Missing → SD1.2 |
| `review_count INTEGER` | `clubs` | ❌ Missing → SD1.2 (only `avg_rating` exists) |
| `member_count INTEGER` | `clubs` | ❌ Missing → SD1.2 |
| `price_range TEXT` | `clubs` | ❌ Missing → SD1.2 |
| `starting_price_paise INTEGER` | `clubs` | ❌ Missing → SD1.2 |
| `established_year SMALLINT` | `clubs` | ❌ Missing → SD1.2 |
| `search_vector TSVECTOR` | `clubs` | ❌ Missing → SD1.2 |
| `bio, avatar_url, city, username` | `users` | ✅ Exists (reused for coach cards) |
| `specializations TEXT[]` | `users` | ❌ Missing → SD1.3 |
| `certifications TEXT[]` | `users` | ❌ Missing → SD1.3 |
| `experience_years SMALLINT` | `users` | ❌ Missing → SD1.3 |
| `languages TEXT[]` | `users` | ❌ Missing → SD1.3 |
| `is_freelance BOOLEAN` | `users` | ❌ Missing → SD1.3 |
| `session_price_paise INTEGER` | `users` | ❌ Missing → SD1.3 |
| `is_available BOOLEAN` | `users` | ❌ Missing → SD1.3 |

### SD0.5 — Filters/Sort

| Filter/Sort | Location | Status |
|---|---|---|
| `q` (name ILIKE) | `/api/clubs/explore` | ✅ Exists |
| `category` (business_type) | `/api/clubs/explore` | ✅ Exists |
| `city` (ILIKE) | `/api/clubs/explore` | ✅ Exists |
| Offset pagination (`page`) | `/api/clubs/explore` | ⚠️ Needs upgrade → cursor |
| Sort by name ASC only | `/api/clubs/explore` | ⚠️ Needs upgrade → multi-sort |
| `subcategories` filter | — | ❌ Missing → SD2.1 |
| `amenities` filter | — | ❌ Missing → SD2.1 |
| `price_range` filter | — | ❌ Missing → SD2.1 |
| `min_rating` filter | — | ❌ Missing → SD2.1 |
| `lat/lng/radius_km` geo-search | — | ❌ Missing → SD2.1 |
| Sort: relevance/distance/rating/price/popularity/newest | — | ❌ Missing → SD2.1 |
| Cursor pagination | — | ❌ Missing → SD2.1 |
| Coach: `specializations` filter | — | ❌ Missing → SD2.2 |
| Coach: `availability` filter | — | ❌ Missing → SD2.2 |
| Coach: `max_price_paise` filter | — | ❌ Missing → SD2.2 |

### SD0.6 — UI Components

| Component | Status | Notes |
|---|---|---|
| Club card (basic — name, city, category, description) | ✅ Exists | Inline in `explore-client.tsx` + `search/page.tsx` |
| Category filter chips (horizontal scroll) | ✅ Exists | Inline in `explore-client.tsx`, not standalone |
| Search input (debounced, X clear) | ✅ Exists | Inline in both pages |
| City text filter | ✅ Exists | Inline in `explore-client.tsx` |
| Infinite scroll (IntersectionObserver) | ✅ Exists | In `explore-client.tsx` |
| Result count | ✅ Exists | Inline, basic |
| Club card skeleton | ✅ Exists | `ClubCardSkeleton` inline |
| 3-tab search (clubs/coaches/members) | ✅ Exists | `/search/page.tsx` |
| URL param sync | ⚠️ Partial | `/search` syncs; `/explore` does NOT sync to URL |
| `ClubCard` (rich — cover image, rating, price, distance, amenities, open/closed) | ❌ Missing | → SD3.1 |
| `CoachCard` (rich — avatar, specializations, rating, price, availability) | ❌ Missing | → SD3.2 |
| `SearchBar` with autocomplete dropdown | ❌ Missing | → SD3.3 |
| `QuickFilterChips` (standalone reusable) | ❌ Missing | → SD3.4 |
| `NearMeButton` + radius selector | ❌ Missing | → SD3.5 |
| `FeaturedCarousel` | ❌ Missing | → SD3.6 |
| `AdvancedFilters` sheet/sidebar | ❌ Missing | → SD3.7 |
| `ActiveFilterChips` | ❌ Missing | → SD3.8 |
| `SearchMap` (Leaflet) | ❌ Missing | → SD5.2 |
| Map/List view toggle | ❌ Missing | → SD5.4 |
| Recent searches (localStorage) | ❌ Missing | → SD4.5 |
| Loading spinner in search bar | ❌ Missing | → SD3.3 |

### SD0.3 — Extensions & Indexes

| Item | Status |
|---|---|
| `pg_trgm` extension | ✅ Exists (migration 007) |
| `idx_clubs_name_trgm` GIN | ✅ Exists |
| `idx_users_fullname_trgm` GIN | ✅ Exists |
| `idx_users_username_trgm` GIN | ✅ Exists |
| `postgis` extension | ❌ Missing → SD1.1 |
| `clubs_location_idx` GIST | ❌ Missing → SD1.2 |
| `clubs_search_vector_idx` GIN | ❌ Missing → SD1.2 |
| `clubs_subcategories_idx` GIN | ❌ Missing → SD1.2 |
| `clubs_amenities_idx` GIN | ❌ Missing → SD1.2 |
| `users_specializations_idx` GIN | ❌ Missing → SD1.3 |

### SD0.4 — APIs

| Endpoint | Status |
|---|---|
| `GET /api/clubs/explore` (offset, basic filters) | ✅ Exists — needs full upgrade |
| `GET /api/search?type=clubs\|coaches\|members` | ✅ Exists — basic ILIKE only, no filters |
| `GET /api/search/clubs` (full spec) | ❌ Missing → SD2.1 |
| `GET /api/search/coaches` (full spec) | ❌ Missing → SD2.2 |
| `GET /api/search/suggest` (autocomplete) | ❌ Missing → SD2.3 |
| `GET /api/search/featured` | ❌ Missing → SD2.4 |

### SD0.7 — Summary

| Category | Exists | Needs Upgrade | Missing |
|---|---|---|---|
| DB columns on `clubs` | 11 | 0 | 18 → SD1.2 |
| DB columns on `users` (coach fields) | 4 (bio/avatar/city/username) | 0 | 7 → SD1.3 |
| DB enums/consts | 8 types | 0 | 4 (AMENITY_OPTIONS, SPECIALIZATION_OPTIONS, PriceRange, CoachAvailability) → SD1.4 |
| DB extensions | `pg_trgm` | — | `postgis` → SD1.1 |
| DB indexes | 3 (trgm) | — | 5 → SD1.2–SD1.3 |
| API endpoints | 2 (basic) | 2 (explore + search) | 4 → SD2 |
| UI components | ~6 inline | 3 (cards, chips, search bar) | 9 → SD3–SD5 |
---

## Sprint SD1 — Schema Migrations

> Add all missing columns. Enable PostGIS + pg_trgm. Write weighted tsvector triggers. Do NOT drop or rename existing columns.

### SD1.1 — Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- may already exist (migration 007)
```
- Migration file: `packages/database/migrations/012_search_extensions.sql`

### SD1.2 — Clubs schema additions
New columns on `clubs` (ALTER TABLE — no drops):
| Column | Type | Notes |
|---|---|---|
| `tagline` | `TEXT` | Short one-liner for card |
| `cover_image_url` | `TEXT` | Hero image for card |
| `gallery` | `TEXT[]` | Additional photos |
| `subcategories` | `TEXT[]` | e.g. `['crossfit','powerlifting']` |
| `amenities` | `TEXT[]` | e.g. `['ac','parking','shower']` |
| `operating_hours` | `JSONB` | `{mon:{open:"06:00",close:"21:00"}, ...}` |
| `area` | `TEXT` | Locality (e.g. "Madhurawada") |
| `full_address` | `TEXT` | Street address |
| `google_maps_url` | `TEXT` | |
| `social_links` | `JSONB` | `{instagram,facebook,youtube}` |
| `location` | `geography(Point,4326)` | PostGIS point for geo-search |
| `featured` | `BOOLEAN DEFAULT false` | For promoted carousel |
| `review_count` | `INTEGER DEFAULT 0` | Denormalized — updated by trigger |
| `member_count` | `INTEGER DEFAULT 0` | Denormalized — updated by trigger |
| `price_range` | `TEXT` | `'budget'|'mid'|'premium'` |
| `starting_price_paise` | `INTEGER` | Lowest plan price |
| `established_year` | `SMALLINT` | |
| `search_vector` | `TSVECTOR` | Weighted: name=A, tagline/area/subcategories=B, description/amenities=C |

Indexes:
- `CREATE INDEX clubs_location_idx ON clubs USING GIST(location)`
- `CREATE INDEX clubs_search_vector_idx ON clubs USING GIN(search_vector)`
- `CREATE INDEX clubs_name_trgm_idx ON clubs USING GIN(name gin_trgm_ops)`
- `CREATE INDEX clubs_subcategories_idx ON clubs USING GIN(subcategories)`
- `CREATE INDEX clubs_amenities_idx ON clubs USING GIN(amenities)`

tsvector trigger:
```sql
CREATE FUNCTION clubs_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.area, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.subcategories, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.amenities, '{}'), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER clubs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION clubs_search_vector_update();
```

Migration file: `packages/database/migrations/013_clubs_search_columns.sql`

### SD1.3 — Coaches schema (nullable columns on `users`)

**Decision:** No separate `coaches` table. Coaches are users with `club_staff.role = 'coach'`. Coach-specific discovery fields are added as nullable columns on `users` — non-coaches leave them null. Keeps the existing `/coaches/[userId]` URL scheme and `coach_ratings.coach_user_id` reference intact.

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS specializations    TEXT[],
  ADD COLUMN IF NOT EXISTS certifications     TEXT[],
  ADD COLUMN IF NOT EXISTS experience_years   SMALLINT,
  ADD COLUMN IF NOT EXISTS languages          TEXT[],
  ADD COLUMN IF NOT EXISTS is_freelance       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_price_paise INTEGER,
  ADD COLUMN IF NOT EXISTS is_available       BOOLEAN DEFAULT true;
```

Indexes:
- `CREATE INDEX users_specializations_idx ON users USING GIN(specializations)`

> `bio`, `avatar_url`, `city`, `username` already exist on `users` — reused for coach cards.
> No separate tsvector for coaches — the coach search API uses `users.full_name` trgm index (already exists from migration 007).

Migration file: `packages/database/migrations/014_users_coach_columns.sql`

### SD1.4 — Update DB types + enums
- Add all new `clubs` columns to `packages/database/src/types/index.ts`
- Add new `users` coach columns to `packages/database/src/types/index.ts`
- Add to `enums.ts`:
  - `AMENITY_OPTIONS` const array (AC, parking, shower, locker, steam, sauna, cafe, wifi)
  - `SPECIALIZATION_OPTIONS` const array (weight_loss, muscle_gain, rehab, sports_specific, prenatal, postnatal)
  - `PriceRange` enum (`budget | mid | premium`)
  - `CoachAvailability` enum (`available | busy | not_accepting`)

---

## Sprint SD2 — Search APIs ✅ Complete

### SD2.1 — Club Search API ✅
`GET /api/search/clubs`

Query params (all optional, combined with AND):
| Param | Type | Notes |
|---|---|---|
| `q` | string | Full-text search via `search_vector @@ query` + trigram fallback |
| `category` | string | Maps to `business_type` enum |
| `subcategories` | string (comma-sep) | `subcategories @> '{crossfit}'` |
| `amenities` | string (comma-sep) | `amenities @> '{ac,parking}'` |
| `price_range` | string | `budget|mid|premium` |
| `min_rating` | number | `avg_rating >= X` |
| `lat` | number | Required with `lng` for geo-search |
| `lng` | number | |
| `radius_km` | number | `ST_DWithin(location, point, radius_m)` |
| `sort` | string | `relevance|distance|rating|price_asc|price_desc|popularity|newest` |
| `cursor` | string | Cursor for next page (base64 encoded row id + sort value) |

Response:
```ts
{
  clubs: ClubSearchResult[],  // max 20
  total: number,
  nextCursor: string | null,
  hasMore: boolean
}
```

`ClubSearchResult` includes: id, slug, name, tagline, cover_image_url, business_type, subcategories, amenities (top 4), area, city, avg_rating, review_count, starting_price_paise, price_range, is_verified, featured, location (lat/lng), distance_km (if geo), operating_hours (for open/closed calc), member_count.

No N+1 queries — single JOIN query.

Validate all params with Zod schema.

### SD2.2 — Coach Search API ✅
`GET /api/search/coaches`

Same pattern. Coach-specific filters:
- `specializations` (multi-select)
- `availability` (`available|busy`)
- `min_rating`
- `max_price_paise`

Include: user_id, slug, display_name, avatar_url, specializations (top 3), certifications, experience_years, languages, session_price_paise, avg_rating, review_count, is_available, is_verified, area, distance_km (if geo), affiliated clubs (from `club_staff`).

### SD2.3 — Autocomplete / Suggestions API ✅
`GET /api/search/suggest?q=`

```sql
SELECT name AS label, slug, 'club' AS type FROM clubs
  WHERE name ILIKE $1 AND verification_status = 'verified' LIMIT 5
UNION ALL
SELECT display_name AS label, slug, 'coach' AS type FROM coaches
  WHERE display_name ILIKE $1 LIMIT 5
```

Returns up to 10 results. No auth required. No pagination.

### SD2.4 — Featured Clubs API ✅
`GET /api/search/featured`

Returns up to 8 clubs where `featured = true AND verification_status = 'verified'`.
Used for the landing carousel when no search query is active.

### SD2.5 — Geo-search proximity index ✅
Ensure `ST_DWithin` uses the GIST index efficiently. Add a note: queries must pass `geography` type, not `geometry`.

**Implementation note:** `lat`/`lng`/`radius_km` params are accepted and parsed in `GET /api/search/clubs`. Distance sort falls back to relevance sort until a PostGIS RPC function is added (future migration `015_search_geo_rpc.sql`). The `location` column is `geography(Point,4326)` — queries MUST cast coordinates to `::geography` not `::geometry` to hit the GIST index.

---

## Sprint SD3 — UI Components (bottom-up) ✅ Complete

> All components: mobile-first (375px baseline), Shadcn/UI + Tailwind only, skeleton loaders, zero layout shift.

### SD3.1 — `ClubCard` component ✅
File: `apps/web/src/components/search/club-card.tsx`

Props: `ClubSearchResult`, `showDistance?: boolean`

Renders:
- Cover image (`next/image`, blur placeholder, lazy load)
- Verified badge overlay (top-left)
- Club name (bold, truncated, 1 line)
- Category + subcategory pills (small)
- Star rating + review count ("4.5 ★ (128)")
- Area/locality
- Distance ("2.3 km away") — only if `showDistance && distance_km`
- Starting price ("From ₹1,500/mo") — from `starting_price_paise`
- Amenity icons (top 4, "+ N more")
- Open/Closed dot (computed from `operating_hours` + current time)
- "View Details" CTA button

Tappable → navigates to `/clubs/[slug]`

Skeleton variant: `ClubCardSkeleton` (exact same layout, shimmer)

### SD3.2 — `CoachCard` component ✅
File: `apps/web/src/components/search/coach-card.tsx`

Renders:
- Circular avatar (`next/image`, lazy load)
- Verified badge
- Display name
- Top 3 specialization pills
- Star rating + review count
- Experience ("8 yrs exp")
- Session price ("₹500/session")
- Languages ("Telugu, English")
- Availability dot (green = available, yellow = busy)
- Area/locality + distance if geo-active
- Club affiliation (if in `club_staff`, show club name as link)
- "View Profile" CTA

Tappable → `/coaches/[slug]`

Skeleton: `CoachCardSkeleton`

### SD3.3 — `SearchBar` component ✅
File: `apps/web/src/components/search/search-bar.tsx`

- Large, prominent, pinned to top
- Placeholder: "Search gyms, coaches, yoga studios..."
- Debounced 300ms input
- Loading spinner inside bar while fetching
- `aria-label`, `role="combobox"`, keyboard nav (↑↓ arrows, Escape)
- Dropdown on focus: recent searches (from localStorage, last 10) + suggestions from SD2.3
- Each suggestion: label, type badge (Club / Coach / Category)
- "Clear history" link at bottom of recent searches
- X button to clear current query

### SD3.4 — `QuickFilterChips` component ✅
File: `apps/web/src/components/search/quick-filter-chips.tsx`

- Horizontal scroll, `overflow-x: auto`, hide scrollbar
- Pills: All · Gyms · Yoga · Martial Arts · Dance · Coaches
- Single-select, active state (filled background)
- `active:scale-95` micro-interaction
- Immediately filters results on tap

### SD3.5 — `NearMeButton` component ✅
File: `apps/web/src/components/search/near-me-button.tsx`

- Single button: "Near Me 📍"
- On click: calls `navigator.geolocation.getCurrentPosition()`
- On success: activates geo-search, shows radius selector pills (1km · 3km · 5km · 10km)
- On error: shows toast "Location permission denied"
- Loading state while waiting for geolocation

### SD3.6 — `FeaturedCarousel` component ✅
File: `apps/web/src/components/search/featured-carousel.tsx`

- Horizontal scroll carousel
- Each item: cover image, name, rating badge, category tag
- Only shown when no active search query
- Fetches from SD2.4

### SD3.7 — `AdvancedFilters` component (Sheet + Sidebar) ✅
File: `apps/web/src/components/search/advanced-filters.tsx`

Mobile: Shadcn `Sheet` from bottom (80vh max, slides up, focus-trapped)
Desktop: collapsible sidebar panel (lg:block)

Filter groups (collapsible sections, each shows active count badge):
- **Category** (single-select: Gym, Yoga, Martial Arts, Dance, Other)
- **Subcategories** (multi-select chips — dynamic from `AMENITY_OPTIONS` enum)
- **Amenities** (multi-select chips — clubs only)
- **Specializations** (multi-select chips — coaches only)
- **Price Range** (Budget · Mid · Premium pill group OR min-max slider)
- **Minimum Rating** (4+ · 3+ · Any pill group)
- **Availability** (coaches only: Available Now · Accepting Clients)
- **Sort By** (Relevance · Distance · Rating · Price ↑ · Price ↓ · Popularity · Newest)

Footer (sticky): "Clear All" + "Apply (N)" buttons

On Apply: closes sheet, updates URL params, re-fetches results

### SD3.8 — `ActiveFilterChips` component ✅
File: `apps/web/src/components/search/active-filter-chips.tsx`

- Shows above results when any filter is active
- Each active filter as removable chip (X to clear individual filter)
- "Filters (3)" count badge on the filter button

### SD3.9 — `ResultCount` component ✅
- "Showing 47 gyms in Visakhapatnam"
- Shown at top of results

### SD3.10 — Empty & Error States ✅
- **No results**: friendly message + "Clear Filters" button. Message includes what was searched and where.
- **Error**: "Something went wrong" + Retry button + toast
- **Location denied**: inline note to enable location

---

## Sprint SD4 — Integration & UX ✅ Complete

### SD4.1 — `/explore` page full rebuild ✅
File: `apps/web/src/app/explore/page.tsx` (currently exists — rebuild)

Layout (top to bottom):
1. Sticky `SearchBar` (pinned, always visible)
2. `QuickFilterChips` (below bar)
3. `NearMeButton` + radius pills row
4. `ActiveFilterChips` (conditional)
5. `ResultCount`
6. `FeaturedCarousel` (only when no query)
7. Results grid (see SD4.2)
8. Infinite scroll trigger

### SD4.2 — Results grid layout ✅
- 1 col on mobile (<640px)
- 2 cols on tablet (640–1024px)
- 3 cols on desktop (>1024px)
- Toggle button (top-right): List View / Map View

### SD4.3 — URL-driven state ✅
Every search state reflected in URL:
```
/explore?q=crossfit&category=gym&subcategories=powerlifting&sort=rating&radius=5&lat=17.7&lng=83.2
```
- Use `useSearchParams` + `router.replace()` (or install `nuqs` if not present)
- Back button works, URLs are shareable/bookmarkable
- No state that lives only in React state

### SD4.4 — Infinite scroll ✅
- `IntersectionObserver` on a sentinel div at the bottom of results
- Fetches next cursor page when sentinel is visible
- Appends new results to existing list (no "Load More" button)
- Loading spinner at bottom while fetching next page
- No spinner on initial load (skeleton cards instead)

### SD4.5 — Recent searches (localStorage) ✅
- On search submit: prepend to `zenzo_recent_searches` (max 10, deduplicated)
- Show in SearchBar dropdown on focus
- "Clear history" wipes localStorage key
- Tap on recent search: fills bar + executes search

### SD4.6 — Debounced live search ✅
- 300ms debounce on input
- Show loading spinner in bar after debounce fires
- Results update without full page reload

### SD4.7 — URL state via `useSearchParams` ✅ (nuqs not installed — using Next.js built-in)
- Check if `nuqs` is in `package.json`. If not, install `nuqs` in `apps/web`.
- Use `useQueryState` / `useQueryStates` for all URL params.

---

## Sprint SD5 — Map View ✅ Complete

### SD5.1 — Install Leaflet ✅
- Installed `leaflet @types/leaflet` in `apps/web` via pnpm
- OpenStreetMap tiles (no API key required)
- `react-leaflet` not needed — imperative Leaflet API used directly in `useEffect`

### SD5.2 — `SearchMap` component ✅
File: `apps/web/src/components/search/search-map.tsx`

- Loaded via `dynamic({ ssr: false })` in `explore-client.tsx` — Leaflet is browser-only
- Top-level `import * as L from "leaflet"` + `import "leaflet/dist/leaflet.css"` safe since file is never evaluated server-side
- Color-coded `L.divIcon` circle pins per category (gym=blue, yoga=green, martial_arts=red, dance=purple, other=gray)
- `L.Popup` mini-card: cover image, name, area, star rating + review count, "View details →" link
- Auto-fit `fitBounds` on first render, suppressed after user pans/zooms (`interactedRef`)
- `flyTo()` when "Near Me" geo changes; resets `interactedRef` so bounds re-fit after relocation
- Separate `LayerGroup` for markers — `clearLayers()` + re-add on every clubs change
- Added `location: { lat: number; lng: number } | null` to `ClubSearchResult` type

### SD5.3 — Desktop split view ✅
- `lg:grid lg:grid-cols-[1fr_420px] lg:gap-4 lg:items-start` when map view active
- Left: full result grid (hidden on mobile)
- Right: `lg:sticky lg:top-36` map panel — `h-[calc(100dvh-148px)]` on desktop, `h-[calc(100dvh-200px)]` on mobile

### SD5.4 — View mode toggle ✅
- `List` / `Map` icon buttons with text label (hidden on mobile via `hidden sm:inline`)
- `aria-pressed` + `role="group"` for accessibility
- View reflected in URL via `?view=map` — shareable, back-button-compatible
- Toggle disabled in coach mode (coaches have no geo data — map not meaningful)
- `pushUrl()` preserves `?view=map` across all filter/query/geo changes

---

## Sprint SD6 — Polish & Accessibility

### SD6.1 — Animations
- Cards fade-in on load: staggered 50ms delay each (`animation-delay`)
- Filter sheet slides up smoothly (Shadcn Sheet already handles this)
- View mode toggle cross-fades

### SD6.2 — Micro-interactions
- Filter chips: `active:scale-95 transition-transform duration-100`
- Cards: `hover:shadow-lg transition-shadow duration-200` on desktop
- Rating stars: amber (`text-amber-400`)
- Near Me button: pulse animation while fetching location

### SD6.3 — Accessibility
- `SearchBar`: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, keyboard nav (↑↓, Enter, Escape)
- Filter sheet: focus trap (Shadcn Sheet handles this), `aria-label="Search filters"`
- All interactive elements: keyboard navigable
- `ClubCard` / `CoachCard`: `role="article"`, accessible CTA labels

### SD6.4 — Responsive QA
- Test at 375px, 640px, 768px, 1024px, 1280px
- No horizontal overflow at any breakpoint
- Touch targets ≥ 44×44px on mobile

### SD6.5 — Skeleton loaders
- `ClubCardSkeleton` × 3 shown on initial load and page transitions
- Skeleton matches exact card dimensions (no layout shift)
- Use `.skeleton-shimmer` from `globals.css`

---

## Sprint SD7 — Seed Data (Visual QA)

### SD7.1 — 15 Visakhapatnam gyms seed
File: `packages/database/seeds/vizag_clubs.sql`

Realistic clubs with:
- Real Vizag area names (Madhurawada, Gajuwaka, MVP Colony, Rushikonda, etc.)
- Varied categories (gym, yoga, martial_arts, dance)
- Varied subcategories, amenities
- Realistic operating hours
- Lat/lng coordinates within Vizag bounding box
- Realistic starting prices (₹800–₹3000/mo)
- avg_rating between 3.8–4.9

### SD7.2 — 20 coaches seed
File: `packages/database/seeds/vizag_coaches.sql`

Realistic coaches with:
- Real Telugu names
- Varied specializations
- Experience 2–15 years
- Session prices ₹300–₹1500
- Some affiliated with seeded clubs, some freelance

---

## Add-ons (Future Sessions)

### Add-on B — Book a Trial Flow
- "Book Free Trial" CTA on club cards and detail pages
- Bottom sheet: name, phone, preferred date, time slot (morning/afternoon/evening)
- Creates `trial_bookings` record
- WhatsApp notification to club owner via Interakt
- Success screen with address + "Open in Google Maps"

### Add-on C — Coach Booking
- Coach sets available time slots per day
- User picks slot on coach profile
- Creates booking record
- WhatsApp to coach + user

### Add-on D — SEO & Social Sharing
- Dynamic OG images via `@vercel/og` for club + coach profiles
- `LocalBusiness` structured data (JSON-LD) for clubs
- `Person` schema for coaches
- `sitemap.xml` with all club + coach slugs
- Rich WhatsApp preview on share

### Add-on E — Owner Analytics
- Search impressions + profile views + trial bookings per club
- `search_events` table with timestamps
- Analytics view in club owner dashboard: 7d / 30d / 90d

---

## Technical Decisions (locked)

| Decision | Choice | Reason |
|---|---|---|
| URL state management | `nuqs` (install if absent) or `useSearchParams` | Shareable URLs, back button works |
| Maps library | Leaflet + OpenStreetMap | No API key required |
| Geo column type | PostGIS `geography(Point,4326)` | Accurate distance, meters input |
| Full-text search | `tsvector` + `ts_query` (primary), `pg_trgm` fallback | Best of both: ranked FTS + fuzzy |
| Pagination | Cursor-based (not offset) | Stable with concurrent inserts |
| Image handling | `next/image` with `sizes` prop | Responsive loading, blur placeholder |
| Coaches storage | Nullable columns on `users` (no separate table) | Coaches are already users with `club_staff.role = 'coach'`; existing `/coaches/[userId]` + `coach_ratings.coach_user_id` stay intact |
| Filter validation | Zod schemas on all API routes | Type safety, injection prevention |
| Recent searches | localStorage key `zenzo_recent_searches` | No auth required, instant |

---

## File Inventory — New Files to Create

```
apps/web/src/
  components/search/
    club-card.tsx             ← SD3.1
    coach-card.tsx            ← SD3.2
    search-bar.tsx            ← SD3.3
    quick-filter-chips.tsx    ← SD3.4
    near-me-button.tsx        ← SD3.5
    featured-carousel.tsx     ← SD3.6
    advanced-filters.tsx      ← SD3.7
    active-filter-chips.tsx   ← SD3.8
    result-count.tsx          ← SD3.9
    search-map.tsx            ← SD5.2
  app/
    explore/
      page.tsx                ← SD4.1 (rebuild)
      layout.tsx              ← update if needed
    api/search/
      clubs/route.ts          ← SD2.1 ✅
      coaches/route.ts        ← SD2.2 ✅
      suggest/route.ts        ← SD2.3 ✅
      featured/route.ts       ← SD2.4 ✅

packages/database/
  migrations/
    012_search_extensions.sql ← SD1.1
    013_clubs_search_columns.sql ← SD1.2
    014_users_coach_columns.sql  ← SD1.3
  seeds/
    vizag_clubs.sql           ← SD7.1
    vizag_coaches.sql         ← SD7.2
```

---

## File Inventory — Files to Modify

```
packages/database/src/
  types/index.ts              ← add clubs new columns + users coach columns
  enums.ts                   ← add AMENITY_OPTIONS, SPECIALIZATION_OPTIONS, PriceRange, CoachAvailability

apps/web/src/
  middleware.ts               ← ensure /explore and /api/search/* are in PUBLIC_PATHS
  app/explore/page.tsx        ← full rebuild (SD4.1)
  app/search/page.tsx         ← update to use new search APIs (SD2.1/SD2.2)
```

---

## Status Tracker

| Sprint | Status |
|---|---|
| SD0 — Gap Analysis | ✅ Complete |
| SD1 — Schema Migrations | ✅ Complete |
| SD2 — Search APIs | ✅ Complete |
| SD3 — UI Components | ✅ Complete |
| SD4 — Integration & UX | ✅ Complete |
| SD5 — Map View | ✅ Complete |
| SD6 — Polish | ✅ Complete |
| SD7 — Seed Data | ⬜ Not started |

# Zenzo Design System

## Colour Palette

> Full color system specification: `docs/design/18-zenzo-color-system.md`
> This section is the reference summary. Read the full spec before building any component.

### Forge — Brand Orange
```
forge-50:  #FFF6EC   ← tints, subtle bg
forge-100: #FFEBD3   ← chip/alert bg
forge-200: #FDD1A3   ← disabled state
forge-300: #FBAD65
forge-400: #F88030
forge-500: #EF6014   ← icons, active nav, progress, focus rings
forge-600: #C84A08   ← PRIMARY BUTTON BG (white text: 4.73:1 ✓ WCAG AA)
forge-700: #A13907   ← hover/pressed
forge-800: #7D2C05
forge-900: #5B2004
```

### Stone — Warm Neutral
```
stone-0:   #FFFFFF   ← page bg, card surface
stone-50:  #FAF9F7   ← table headers, subtle bg
stone-100: #F4F3F0   ← hover bg, disabled input
stone-200: #E9E7E3   ← borders, dividers
stone-300: #D4D0CA   ← strong borders
stone-400: #A8A39A   ← placeholder text (never real content text)
stone-500: #78746C   ← secondary text (4.67:1 ✓)
stone-600: #5A5650   ← labels, meta (6.72:1 ✓)
stone-700: #3C3935   ← body text (10.2:1 ✓)
stone-800: #252320   ← headings (14.1:1 ✓)
stone-900: #151310   ← max contrast
```

### Semantic
```
jade-50: #F0FDF5   jade-500: #16A34A   jade-700: #15803D    ← success / present
sand-50: #FFFBEB   sand-500: #D97706   sand-700: #B45309    ← warning / expiring
flame-50:#FFF1F2   flame-500:#DC2626   flame-700:#B91C1C    ← error / absent / overdue
sky-50:  #EFF9FF   sky-500:  #0284C7   sky-700:  #0369A1    ← info / neutral notice
```

### Core Usage Rules
- **Forge-500** for accents (icons, active states, focus rings) — NOT for white text at body size
- **Forge-600** for all interactive elements (buttons, links) — white text passes WCAG AA
- **Stone-500 minimum** for any readable text — stone-400 is placeholder/decorative only
- **Semantic -700** for text in badges/alerts. **Semantic -50** for badge/alert backgrounds.
- **Color alone never communicates status** — always pair with an icon

---

## Typography

Font: **Inter** (already in codebase). Fallback: `system-ui, -apple-system, sans-serif`
Why Inter: Excellent legibility on low-res screens, open-source, supports Indian languages when extended.

### Scale
```
display:   32px / 40px lh / 700 weight   ← page titles (desktop only)
h1:        24px / 32px lh / 700 weight   ← section headers
h2:        20px / 28px lh / 600 weight   ← card headers, modal titles
h3:        16px / 24px lh / 600 weight   ← sub-headers
body:      14px / 20px lh / 400 weight   ← default text
body-sm:   13px / 18px lh / 400 weight   ← secondary text, table cells
caption:   12px / 16px lh / 400 weight   ← labels, timestamps, metadata
label:     12px / 16px lh / 500 weight   ← form labels, badges (uppercase tracking 0.05em)
mono:      13px / 18px lh / 400 weight   ← amounts, IDs (font-family: monospace)
```

### Rules
- Minimum font size: 13px (legibility on mid-range Android in sunlight)
- Line length max: 72ch for body text
- Headings: neutral-900. Body: neutral-700. Secondary: neutral-500
- Monetary values always use mono style: `₹1,499.00`
- Design containers to handle 140% text width for future i18n

---

## Spacing

Base unit: **4px**

```
space-0:   0px
space-1:   4px    ← tight: icon-to-label gap
space-2:   8px    ← default: between inline elements
space-3:   12px   ← form field internal padding
space-4:   16px   ← card padding, list item gap
space-5:   20px   ← section gap (mobile)
space-6:   24px   ← section gap (desktop)
space-8:   32px   ← between sections
space-10:  40px   ← page-level vertical rhythm
space-12:  48px   ← major section breaks
space-16:  64px   ← page top/bottom padding
```

### Rules
- Card padding: `space-4` (mobile), `space-6` (desktop)
- Form fields vertical gap: `space-4`
- Section gap: `space-8`
- Sidebar width: 240px (desktop), hidden (mobile)
- Max content width: 1200px (centered)

---

## Borders, Radius & Elevation

### Border Radius
```
radius-sm:   4px   ← badges, small tags
radius-md:   8px   ← inputs, buttons, cards
radius-lg:   12px  ← modals, popovers, large cards
radius-xl:   16px  ← bottom sheets (mobile)
radius-full: 9999px ← avatars, pills
```

### Borders
- Default: 1px solid neutral-200
- Focus: 2px solid primary-500
- Error: 1px solid error-500

### Shadows
```
shadow-sm:  0 1px 2px rgba(0,0,0,0.05)               ← cards at rest
shadow-md:  0 4px 6px -1px rgba(0,0,0,0.07)           ← cards on hover, dropdowns
shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.08)         ← modals, popovers
shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.10)         ← bottom sheets
```

### Rules
- Cards: `shadow-sm` at rest, `shadow-md` on hover
- Modals: `shadow-lg` + neutral-900/50 backdrop overlay
- No box-shadow on mobile cards — use border only (performance)

---

## Iconography

Style: **Lucide Icons** (consistent with modern SaaS, open-source, tree-shakeable)
- Size: 16px (inline), 20px (nav/action), 24px (empty state illustration accent)
- Stroke width: 1.5px (default), 2px (active nav)
- Color: inherits text color. Active: primary-500

---

## Dark Mode
**No** in Phase 1. Rationale:
- Target users (Tier 2 India gym owners) don't expect it
- Doubles design/dev effort
- Revisit post-launch based on user requests
- System already uses neutral tokens — migration will be straightforward

---

## Component Inventory

### Atoms
| Component | Variants | Notes |
|---|---|---|
| Button | primary, secondary, ghost, danger | Sizes: sm(32px), md(40px), lg(48px). Min touch target: 44px on mobile |
| IconButton | primary, ghost | 40px square, 44px touch target |
| Input | text, email, phone, search, password | States: default, focus, error, disabled. Always show label above |
| Select | single, multi | Native on mobile, custom dropdown desktop |
| Checkbox | default, indeterminate | 20px box, 44px touch target |
| Toggle | on/off | 44px wide |
| Radio | default | 20px circle |
| Badge | neutral, success, warning, error, info, primary | Pill shape, label-size text |
| Avatar | image, initials, icon | Sizes: sm(28px), md(36px), lg(48px) |
| Tag | removable, static | Used for batch labels, belt colours |
| Divider | horizontal, vertical | neutral-200 |

### Molecules
| Component | Notes |
|---|---|
| FormField | Label + Input + helper/error text. Standardized spacing |
| SearchBar | Input with search icon, optional filter chips |
| StatCard | Label + large number + trend indicator. Dashboard widgets |
| ListItem | Avatar + title + subtitle + action. Used in member lists |
| EmptyState | Illustration placeholder + heading + description + CTA button |
| AlertBanner | Icon + message + optional action. Top of page, dismissible |
| Toast | Success/error/info. Bottom-right desktop, bottom-center mobile. Auto-dismiss 4s |
| Breadcrumb | Home > Section > Page. Desktop only |
| TabBar | Underline style. Scrollable on mobile |

### Organisms
| Component | Notes |
|---|---|
| DataTable | Sortable columns, row actions, pagination, mobile→card view |
| Modal | sm(400px), md(560px), lg(720px). Overlay + shadow-lg. ESC to close |
| BottomSheet | Mobile alternative to modals. Drag to dismiss. radius-xl top |
| Sidebar | 240px fixed. Collapsible to 64px icons-only. Hidden on mobile |
| TopBar | Logo + breadcrumb + search + avatar dropdown. Sticky |
| CommandBar | Cmd+K palette. Search members, navigate, quick actions |
| AttendanceGrid | The hero component — batch member list with large tap targets |
| DailyDigest | Stacked stat cards + action items. Owner dashboard core |
| PageHeader | Title + description + primary action button. Consistent per page |
| FilterBar | Active filters as chips + "Add filter" dropdown |

### Patterns
| Pattern | Notes |
|---|---|
| Loading | Subtle shimmer placeholders matching content shape. No spinners on primary paths |
| ErrorState | Friendly message + retry button. Never show stack traces |
| ConfirmDialog | Title + message + cancel/confirm buttons. Danger variant for destructive actions |
| Skeleton | Matches the layout of the content it replaces |
| InfiniteScroll | For member lists, payment history. Load 25 at a time |
| PullToRefresh | Mobile only. On lists and dashboard |

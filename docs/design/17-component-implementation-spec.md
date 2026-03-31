# Zenzo Component Implementation Spec

> Implementation-ready reference for all UI components.
> Every decision traces back to the three tests:
> - **Ravi Test** — non-technical gym owner, Tier 2 India, zero hand-holding
> - **Arjun Test** — coach, attendance in < 60s, mid-range Android
> - **Stripe Test** — Linear/Stripe designer nods, does not cringe

Design tokens live in `docs/design/01-design-system.md`.
Motion rules live in `docs/design/16-micro-interactions-responsive.md`.

---

## Build Order

Build in this exact order — each layer depends on the one before.

```
1. Tokens     → Tailwind config (colours, spacing, typography, shadows, radius)
2. Atoms      → Button, IconButton, Input, Select, Checkbox, Toggle, Radio, Badge, Avatar, Tag, Divider
3. Molecules  → FormField, SearchBar, StatCard, ListItem, AlertBanner, Toast, Breadcrumb, TabBar
4. Organisms  → Modal/BottomSheet, Sidebar, TopBar, DataTable, PageHeader, FilterBar, EmptyState
5. Heroes     → AttendanceGrid, DailyDigest, CommandBar
6. Patterns   → Skeleton, ErrorState, ConfirmDialog, InfiniteScroll, PullToRefresh
```

---

## Tokens (Tailwind Config)

Before writing a single component, extend `tailwind.config.ts` with these tokens.
All components reference token names — never raw hex values.

```ts
// tailwind.config.ts — full spec in docs/design/18-zenzo-color-system.md
colors: {
  forge: {
    50: '#FFF6EC',  100: '#FFEBD3',  200: '#FDD1A3',
    300: '#FBAD65', 400: '#F88030',  500: '#EF6014',
    600: '#C84A08', 700: '#A13907',  800: '#7D2C05',
    900: '#5B2004',
  },
  stone: {
    0:  '#FFFFFF',  50: '#FAF9F7',   100: '#F4F3F0',
    200: '#E9E7E3', 300: '#D4D0CA',  400: '#A8A39A',
    500: '#78746C', 600: '#5A5650',  700: '#3C3935',
    800: '#252320', 900: '#151310',
  },
  jade:  { 50: '#F0FDF5', 100: '#DCFAE8', 500: '#16A34A', 700: '#15803D' },
  sand:  { 50: '#FFFBEB', 500: '#D97706', 700: '#B45309' },
  flame: { 50: '#FFF1F2', 100: '#FFE4E6', 500: '#DC2626', 700: '#B91C1C' },
  sky:   { 50: '#EFF9FF', 500: '#0284C7', 700: '#0369A1' },
},
borderRadius: {
  sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px',
},
boxShadow: {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.07)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.08)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.10)',
},
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
},
```

---

---

# ATOMS

---

## 1. Button

**Purpose:** The single most-used interactive element. Must be instantly recognizable as tappable. Coaches use this one-handed on a phone.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode         // leading icon
  iconRight?: React.ReactNode    // trailing icon
  fullWidth?: boolean
}
```

### Variants

| Variant | Background | Text | Border | Hover | Active | Disabled |
|---|---|---|---|---|---|---|
| `primary` | primary-500 | white | none | primary-600 | primary-700 | primary-200, opacity-50 |
| `secondary` | white | neutral-700 | neutral-200 | neutral-50 | neutral-100 | opacity-50 |
| `ghost` | transparent | neutral-700 | none | neutral-100 | neutral-200 | opacity-50 |
| `danger` | error-500 | white | none | error-700 | error-800 | opacity-50 |

### Sizes

| Size | Height | Padding H | Font | Icon | Radius |
|---|---|---|---|---|---|
| `sm` | 32px | 12px | 13px/400 | 14px | radius-md |
| `md` | 40px | 16px | 14px/400 | 16px | radius-md |
| `lg` | 48px | 20px | 14px/500 | 20px | radius-md |

### Rules
- **Mobile touch target:** always min 44px height regardless of declared size (wrap in a touch-target div if needed)
- **Loading state:** fade text out (100ms), fade spinner in (100ms). Maintain exact width — no layout shift. Spinner: 16px, white for primary, neutral-500 for secondary.
- **Focus ring:** `ring-2 ring-primary-500 ring-offset-2` — visible on keyboard nav, never on mouse click
- **Icon-only:** use `IconButton` instead — do not strip text from `Button`
- **Full width:** use on mobile forms, never in dense desktop toolbars

### Accessibility
- `type="button"` default (prevent accidental form submit)
- `aria-disabled` not `disabled` when loading (keeps focusable for screen readers)
- `aria-label` required when icon-only (should use `IconButton` instead)

---

## 2. IconButton

**Purpose:** Square tap target for icon-only actions (close, edit, delete, filter). Prevents creating buttons with no accessible label.

```tsx
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon: React.ReactNode
  label: string    // REQUIRED — used as aria-label and tooltip
}
```

| Size | Dimensions | Icon | Touch target |
|---|---|---|---|
| `sm` | 32×32 | 16px | 44×44 via padding |
| `md` | 40×40 | 20px | 44×44 via padding |

- Shape: radius-md (not round — round feels too playful for a data app)
- Ghost variant used for table row actions, modal close, filter chips
- Tooltip on hover (desktop): label text, 200ms delay

---

## 3. Input

**Purpose:** Text entry for forms. Clear, scannable, touch-friendly. Never ambiguous about state.

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'search'
  helperText?: string
  error?: string
  required?: boolean
  prefix?: string       // "₹" or "+91" — rendered inside left of field
  suffix?: string       // "kg", "%" — rendered inside right of field
}
```

### States

| State | Border | Shadow | Background |
|---|---|---|---|
| Default | 1px neutral-200 | none | white |
| Focus | 2px primary-500 | 0 0 0 3px primary-100 | white |
| Error | 1px error-500 | 0 0 0 3px error-50 | white |
| Disabled | 1px neutral-200 | none | neutral-100 |
| Filled | 1px neutral-300 | none | white |

### Anatomy
```
[label text] *         ← 12px/500, neutral-700, asterisk in error-500 if required
[prefix] [input text]  ← height 40px (48px on mobile), padding 12px
[helper text / error]  ← 12px, neutral-500 / error-500
```

### Rules
- **Label always above** — never floating. Floating labels break on autofill and i18n.
- **Prefix/suffix** (`₹`, `+91`): render in neutral-100 bg separated by neutral-200 border. Text neutral-500.
- **Error replaces** helper text — they never stack.
- **Error animation:** fade in 150ms + slide down 4px. No shake.
- **Password:** include show/hide toggle (eye icon, 16px) in trailing position.
- **Phone:** type="tel", prefix "+91" baked in. Native keyboard on mobile.
- **Number:** for monetary amounts use type="text" with pattern validation (avoid browser spinner arrows).
- Mobile height: 48px (larger touch target than desktop 40px).

### Accessibility
- `id` on input, `htmlFor` on label — always linked
- `aria-describedby` points to helper/error text element
- `aria-invalid="true"` when error is present
- `aria-required="true"` when required

---

## 4. Select

**Purpose:** Dropdown selection. Native on mobile (respects OS keyboard/picker), custom on desktop (better UX, consistent styling).

```tsx
interface SelectProps {
  label: string
  options: { value: string; label: string; disabled?: boolean }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  searchable?: boolean    // desktop only — adds search input inside dropdown
}
```

### Mobile (< 768px)
- Renders a native `<select>` styled to match Input
- No custom dropdown — native picker is more accessible and touch-friendly
- Chevron icon right-aligned inside field

### Desktop (≥ 768px)
- Custom dropdown: `Input`-like trigger + floating panel
- Panel: `bg-white border border-neutral-200 shadow-md radius-md`
- Options: 40px height, hover `bg-neutral-50`, selected `bg-primary-50 text-primary-700`
- Searchable: adds a search input at top of panel when `searchable` is true
- Max height: 280px with scroll

### Rules
- Dropdown width matches trigger width
- Open animation: fade in + slide down 4px, 150ms ease-out
- Close on: option select, click outside, Escape key
- `z-index`: 50 (above cards, below modals)

---

## 5. Checkbox

**Purpose:** Multi-select in forms and tables. Consistent visual with brand colour.

```tsx
interface CheckboxProps {
  label?: string
  checked: boolean
  indeterminate?: boolean    // for "select all" in tables
  onChange: (checked: boolean) => void
  disabled?: boolean
}
```

| State | Border | Fill | Icon |
|---|---|---|---|
| Unchecked | neutral-300 | white | — |
| Checked | primary-500 | primary-500 | white ✓ |
| Indeterminate | primary-500 | primary-500 | white — |
| Disabled | neutral-200 | neutral-100 | — |

- Box: 20×20px, radius-sm (4px)
- Touch target: 44×44px (padding expands hit area)
- Animation: check appears with scale(0) → scale(1), 100ms ease-out
- Label: body (14px), neutral-700, 8px gap from box, inline-flex aligned

---

## 6. Toggle (Switch)

**Purpose:** Binary on/off for settings. Feels immediate and physical.

```tsx
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}
```

| Size | Track W×H | Thumb | Thumb travel |
|---|---|---|---|
| `sm` | 36×20 | 16×16 | 16px |
| `md` | 44×24 | 20×20 | 20px |

| State | Track | Thumb |
|---|---|---|
| Off | neutral-300 | white |
| On | primary-500 | white |
| Disabled-off | neutral-200 | neutral-100 |
| Disabled-on | primary-200 | white |

- Thumb transition: `transform 150ms ease-in-out`
- Track transition: `background-color 150ms ease-in-out`
- Touch target: 44×44 minimum
- Label right of toggle, 8px gap

---

## 7. Radio

**Purpose:** Single-select between mutually exclusive options. Used in forms and filter groups.

```tsx
interface RadioProps {
  label: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  disabled?: boolean
}
```

- Circle: 20×20px. Outer ring: neutral-300. Inner dot: primary-500 when checked.
- Touch target: 44×44px
- Animation: inner dot scale(0) → scale(1), 100ms ease-out
- Use `RadioGroup` wrapper for keyboard navigation (arrow keys)

---

## 8. Badge

**Purpose:** Compact status labels. Membership status, payment status, belt rank, attendance rate.

```tsx
interface BadgeProps {
  variant: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary'
  size?: 'sm' | 'md'
  label: string
  dot?: boolean    // optional coloured dot prefix instead of bg colour
}
```

| Variant | Background | Text colour |
|---|---|---|
| `neutral` | neutral-100 | neutral-700 |
| `success` | success-50 | success-700 |
| `warning` | warning-50 | warning-700 |
| `error` | error-50 | error-700 |
| `info` | info-50 | info-700 |
| `primary` | primary-50 | primary-700 |

| Size | Height | Padding H | Font |
|---|---|---|---|
| `sm` | 20px | 6px | 11px/500 |
| `md` | 24px | 8px | 12px/500 |

- Shape: radius-full (pill)
- Text: **UPPERCASE**, letter-spacing 0.05em
- Never interactive (not a button). If clickable, use a button styled as badge.
- Dot variant: 6px circle (matching variant colour) + neutral-700 text on neutral-100 bg

### Status Mappings (use consistently)
| Status | Variant |
|---|---|
| Active / Present | success |
| Overdue / Absent | error |
| Expiring Soon | warning |
| Trial / Pending | info |
| Inactive / Unmarked | neutral |
| Belt rank / Category | primary |

---

## 9. Avatar

**Purpose:** Member identification at a glance. Image fallback to initials ensures no broken states.

```tsx
interface AvatarProps {
  src?: string
  name: string         // required — drives initials + bg colour
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean     // green dot indicator (for staff status)
}
```

| Size | Dimensions | Font | Use case |
|---|---|---|---|
| `sm` | 28×28 | 11px | Table rows, dense lists |
| `md` | 36×36 | 13px | Standard list items |
| `lg` | 48×48 | 16px | Profile headers, attendance rows |
| `xl` | 64×64 | 20px | Member profile page |

### Initials Fallback
- Take first letter of first name + first letter of last name (or first 2 chars if single name)
- Background: deterministic pastel from hash of `name` — 8 options:
  ```
  rose-100, amber-100, lime-100, cyan-100,
  violet-100, pink-100, teal-100, orange-100
  ```
- Text colour: matching -700 shade of the bg colour
- This ensures the same person always gets the same colour — feels personal, not random.

### Rules
- Image: `object-cover`, `object-center`, circular clip
- Serve images at 2× declared size for retina screens
- `online` dot: 8px green dot, white border 2px, absolute bottom-right
- `alt={name}` always set for accessibility

---

## 10. Tag

**Purpose:** Removable or static labels for batch assignments, filter chips, skill tags.

```tsx
interface TagProps {
  label: string
  onRemove?: () => void    // if provided, shows × button
  colour?: string          // hex — for belt colours, batch colours
  size?: 'sm' | 'md'
}
```

- Default: neutral-100 bg, neutral-700 text, neutral-200 border
- Custom colour: passed as bg, with auto-computed contrast text (light or dark)
- Remove icon: `×` (14px), neutral-500, hover error-500. Tap target: 24×24.
- Height: 24px (`sm`), 28px (`md`)
- Radius: radius-full
- Spacing between tags: 4px gap

---

## 11. Divider

**Purpose:** Visual separation between sections. Use sparingly — whitespace is preferred.

```tsx
interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string    // optional centred label (e.g. "or", "today")
}
```

- Colour: neutral-200
- Horizontal: 1px height, full width, margin 16px top/bottom
- Vertical: 1px width, full height, margin 8px left/right
- Label variant: text sits centred with line on both sides. Text: 12px neutral-400, padding 8px.

---

---

# MOLECULES

---

## 12. FormField

**Purpose:** The standard wrapper for all form inputs. Enforces consistent label → input → feedback structure across every form in the app.

```tsx
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode    // the Input, Select, etc.
}
```

```
[Label text] [*]           ← label + required asterisk
[children (Input/Select)]  ← the field itself
[helper text / error]      ← below field, error-500 or neutral-500
```

- Gap between label and field: 4px
- Gap between field and helper: 4px
- Gap between FormFields in a form: 16px (space-4)
- Never skip the wrapper — it ensures consistent vertical rhythm and accessible linking

---

## 13. SearchBar

**Purpose:** Filter lists by name/phone. The primary navigation tool on mobile (no sidebars).

```tsx
interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  filters?: FilterChip[]    // active filters shown as chips below
}
```

- Anatomy: search icon (16px, neutral-400) left → input → clear × (16px, neutral-400) right when value present
- Matches `Input` height: 40px desktop, 48px mobile
- Radius: radius-md
- Clear button: fade in when value length > 0 (150ms)
- Filter chips appear below, scrollable horizontal, 4px gap, 8px top margin
- Debounce: 300ms before triggering search (avoid re-render on every keystroke)

---

## 14. StatCard

**Purpose:** Single KPI at a glance. The dashboard building block. Must communicate trend instantly without requiring reading.

```tsx
interface StatCardProps {
  label: string
  value: string             // "₹1.2L", "118", "76%"
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string           // "↑12% vs last month"
    positive?: boolean      // is "down" good here? (e.g. churn going down)
  }
  subtitle?: string         // "this month", "today"
  icon?: React.ReactNode    // 20px icon, primary-500
  onClick?: () => void      // makes card navigable
}
```

| Property | Value |
|---|---|
| Padding | 16px (mobile), 24px (desktop) |
| Border | 1px neutral-200 |
| Radius | radius-md |
| Label | 12px/500, neutral-500 |
| Value | 24px/700, neutral-900. **Monospace for ₹ amounts** |
| Trend up | success-500 |
| Trend down (bad) | error-500 |
| Trend down (good) | success-500 (e.g. churn dropping) |
| Subtitle | 12px/400, neutral-400 |
| Hover | shadow-md transition |

- If `onClick` is provided: cursor-pointer, hover lifts with shadow-md
- Icon: 40×40 soft primary-50 bg circle, icon centred, float right
- Grid layout: 2-col mobile, 3-col desktop (handled by parent `StatsGrid`)

---

## 15. ListItem

**Purpose:** A single row in any list — members, staff, batches. Consistent structure makes lists scannable.

```tsx
interface ListItemProps {
  avatar?: React.ReactNode     // Avatar component
  title: string
  subtitle?: string
  meta?: string                // right-aligned secondary text
  badge?: React.ReactNode      // Badge component
  action?: React.ReactNode     // IconButton or Button
  onClick?: () => void
  selected?: boolean
}
```

```
[Avatar]  [Title        ]  [badge]  [meta]  [action]
          [Subtitle     ]
```

- Height: 56px min (expands for long content)
- Padding: 12px vertical, 16px horizontal
- Border-bottom: 1px neutral-100
- Hover: neutral-50 bg
- Selected: primary-50 bg, primary-500 left border (3px)
- Title: 14px/500, neutral-900
- Subtitle: 13px/400, neutral-500
- Meta: 13px/400, neutral-500, right-aligned
- On mobile: action moves to swipe-reveal (left swipe shows action buttons)

---

## 16. AlertBanner

**Purpose:** Page-level notices — trial expiry, sync error, action required. Dismissible. Appears once per session unless critical.

```tsx
interface AlertBannerProps {
  variant: 'info' | 'warning' | 'error' | 'success'
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
}
```

| Variant | Background | Border-left | Icon |
|---|---|---|---|
| `info` | info-50 | info-500 | Info |
| `warning` | warning-50 | warning-500 | AlertTriangle |
| `error` | error-50 | error-500 | AlertCircle |
| `success` | success-50 | success-500 | CheckCircle |

- Position: top of page content (below TopBar, above PageHeader)
- Left border: 4px
- Padding: 12px 16px
- Radius: radius-md
- Dismiss: × button top-right, opacity-50 hover opacity-100
- Action button: ghost or inline link style
- Never auto-dismiss — user must act or dismiss

---

## 17. Toast

**Purpose:** Ephemeral feedback for user actions — "Member added", "Payment recorded", "Error saving". Non-blocking.

```tsx
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning'
  message: string
  action?: { label: string; onClick: () => void }
  duration?: number    // default: 4000ms, error: 8000ms
}

// Usage (via hook, not direct render):
const { toast } = useToast()
toast.success('Attendance saved')
toast.error('Failed to save. Try again.')
```

| Property | Value |
|---|---|
| Position | bottom-right (desktop), bottom-center (mobile) |
| Width | 280–400px |
| Padding | 12px 16px |
| Radius | radius-md |
| Shadow | shadow-md |
| Left border | 3px, variant colour |
| Icon | 16px, variant colour |
| Max stack | 3 visible. Oldest dismisses when 4th appears. |

### Animation
- Enter: `translateY(16px)` → `translateY(0)` + `opacity 0→1`, 200ms ease-out
- Exit: `translateY(8px)` + `opacity 1→0`, 150ms ease-in
- Hover pauses auto-dismiss (desktop)
- Error duration: 8000ms (user needs time to read what went wrong)

### Implementation Pattern
Use a `ToastProvider` at app root + `useToast()` hook. Never import Toast directly — always go through the hook. This ensures stacking, deduplication, and portal rendering.

---

## 18. Breadcrumb

**Purpose:** Desktop wayfinding. Shows context depth. Hidden on mobile (replaced by back arrow in TopBar).

```tsx
interface BreadcrumbProps {
  items: { label: string; href?: string }[]
}
// Last item: current page, no link, neutral-900
// Earlier items: links, neutral-500, hover primary-500
```

- Separator: `/` in neutral-300, margin 6px each side
- Font: 13px/400
- Hidden on mobile (`hidden md:flex`)
- Current item: neutral-900, no underline, aria-current="page"

---

## 19. TabBar

**Purpose:** Secondary navigation within a page — member profile tabs, payment history tabs, report categories.

```tsx
interface TabBarProps {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}
```

- Style: underline tabs (not pills — pills feel too heavy for secondary nav)
- Active tab: primary-500 underline (2px), neutral-900 text
- Inactive: neutral-500 text, hover neutral-700
- Count badge: inline, neutral-400 text, 13px — not a Badge component, just a number
- Scrollable horizontal on mobile with no scrollbar visible
- Height: 44px (meets touch target requirement)
- Bottom border: neutral-200 full width (tabs sit on top of it)

---

---

# ORGANISMS

---

## 20. Modal / BottomSheet

**Purpose:** Focused task completion without navigating away. Forms, confirmations, previews.

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode    // typically cancel + confirm buttons
  children: React.ReactNode
}
```

| Size | Width | Use case |
|---|---|---|
| `sm` | 400px | Confirm dialogs, 1–2 field forms |
| `md` | 560px | Standard forms (member add, payment record) |
| `lg` | 720px | Complex content, multi-step, previews |

### Desktop Behaviour
- Centred, vertically centred (slight above-centre feels balanced)
- Overlay: neutral-900 at 50% opacity
- Shadow: shadow-lg
- Radius: radius-lg (12px)
- Header: h2 title + × close button (top right)
- Footer: right-aligned buttons, 16px top padding, 1px neutral-200 top border
- ESC to close

### Mobile Behaviour (< 768px)
**Becomes a bottom sheet automatically — no separate component needed.**
- Slides up from bottom, 250ms ease-out
- Top radius: radius-xl (16px), bottom: none (full bleed to edge)
- Drag handle: 40×4px neutral-300 pill, centred 8px from top
- Max height: 90vh. Scrollable body.
- `safe-area-inset-bottom` padding
- Velocity-based drag-to-dismiss
- Enter: `translateY(100%)` → `translateY(0)`
- Overlay fades in simultaneously, 200ms

### Implementation
Single `Modal` component with responsive behaviour built in. Do NOT create separate `BottomSheet` component — same API, same component, responsive automatically.

---

## 21. Sidebar

**Purpose:** Primary navigation container for desktop. Always visible on desktop, always hidden on mobile.

```tsx
interface SidebarProps {
  tenant: { name: string; slug: string; logo?: string }
  navItems: NavItem[]
  activeItem: string
  collapsed?: boolean
  onToggleCollapse: () => void
}
```

| State | Width | Content |
|---|---|---|
| Expanded | 240px | Logo + labels + icons |
| Collapsed | 64px | Icons only (tooltips on hover) |

- Collapse animation: 200ms ease-in-out
- Labels fade out at 120ms (before width finishes animating)
- Active item: primary-50 bg, primary-500 left border (3px), primary-600 text + icon
- Inactive item: hover neutral-100 bg, neutral-600 text + icon
- Bottom pinned: user avatar + name + settings link
- Always `position: fixed` left, full height, above content
- Content area has `ml-[240px]` or `ml-[64px]` based on state
- `hidden lg:flex` — never shown on mobile

---

## 22. TopBar

**Purpose:** Page-level header bar. Contains brand, navigation context, search, and user controls.

```tsx
interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[]
  onMenuOpen?: () => void          // mobile: hamburger → opens drawer
  onSearch?: () => void            // opens CommandBar
  user: { name: string; avatar?: string }
}
```

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Logo | ✓ | ✓ | ✓ |
| Back arrow | ✓ (replaces breadcrumb) | — | — |
| Breadcrumb | — | ✓ | ✓ |
| Search icon | — | ✓ | ✓ (opens CommandBar) |
| Avatar dropdown | ✓ (small) | ✓ | ✓ |
| Notification bell | ✓ | ✓ | ✓ |

- Height: 56px, sticky top, `bg-white border-b border-neutral-200 z-40`
- No shadow — border is cleaner for a data-dense app
- Avatar dropdown: name, role, profile link, logout

---

## 23. DataTable

**Purpose:** Display structured data (member lists, payment history, staff list). Sortable, selectable, paginatable.

```tsx
interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  selectable?: boolean
  sortBy?: { key: string; direction: 'asc' | 'desc' }
  onSort?: (key: string) => void
  pagination?: { page: number; pageSize: number; total: number; onChange: (page: number) => void }
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  loading?: boolean
}
```

### Desktop Table

| Property | Value |
|---|---|
| Header row | neutral-50 bg, 12px/500 uppercase, neutral-500, tracking 0.05em |
| Header height | 40px |
| Row height | 48px |
| Row border | 1px neutral-100 bottom |
| Row hover | neutral-50 bg |
| Row selected | primary-50 bg |
| Cell padding | 16px horizontal |
| Sorted column header | primary-600 text + sort icon |

- Loading state: replace rows with 5 Skeleton rows (matching column structure)
- Sticky header on scroll if table exceeds viewport
- Checkbox column: 48px wide, `indeterminate` on header when partial selection

### Mobile Card Transformation (< 768px)

Each table row becomes a card:
```
┌──────────────────────────────────┐
│ [Avatar] [Title]          [Badge]│
│          [Subtitle]              │
│          [Meta line]        [⋮] │
└──────────────────────────────────┘
```
- Primary column → card title (14px/500)
- Up to 2 secondary columns → subtitle lines (13px, neutral-500)
- Status column → Badge (top-right)
- Row actions → collapsed into `⋮` IconButton (action sheet on tap)
- Card tap → row click handler

### Pagination
- Desktop: "Page X of Y" text + Prev/Next buttons + page size selector
- Mobile: infinite scroll (no pagination UI — see InfiniteScroll pattern)

---

## 24. PageHeader

**Purpose:** Consistent entry point for every page. Title + description + primary action. Must not vary across pages.

```tsx
interface PageHeaderProps {
  title: string
  description?: string     // hidden on mobile
  action?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
  breadcrumbs?: BreadcrumbItem[]   // rendered above title on desktop
}
```

```
[Breadcrumb]             ← desktop only
[Title]                  [+ Primary Action Button]
[Description]            ← hidden on mobile
[Divider]
```

- Title: h1 (24px/700), neutral-900
- Description: body (14px), neutral-500
- Action: Button variant="primary" size="md"
- Padding-bottom: 24px, border-bottom: 1px neutral-200
- Mobile: title + action only (no description, no breadcrumb)

---

## 25. FilterBar

**Purpose:** Active filter state display + ability to add/remove filters. Lives between PageHeader and DataTable.

```tsx
interface FilterBarProps {
  filters: ActiveFilter[]
  onRemove: (id: string) => void
  onClear: () => void
  onAdd: () => void      // opens filter panel
}

interface ActiveFilter {
  id: string
  label: string          // "Status: Active"
}
```

- Active filters: Tags with × remove button
- "Add filter" button: ghost, small, + icon
- "Clear all" link: appears when > 1 active filter, neutral-500 text
- Scrollable horizontal on mobile
- Height: 40px, padding 8px 0

---

## 26. EmptyState

**Purpose:** Teach users what to do when a list is empty. Never a dead end — always an onramp.

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode     // Lucide icon, 48px, neutral-300
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}
```

| Property | Value |
|---|---|
| Layout | vertically centered, max-width 400px, text-center |
| Padding | 48px vertical |
| Icon | 48×48, neutral-300 stroke |
| Icon → title gap | 12px |
| Title | h2 (20px/600), neutral-700 |
| Title → description gap | 8px |
| Description | body (14px), neutral-500, max 60ch |
| Description → action gap | 20px |

### Tone Guide
| Situation | Title | Description | CTA |
|---|---|---|---|
| No members | "No members yet" | "Add your first member to start tracking attendance and fees." | "Add Member" |
| No payments | "All clear" | "No overdue payments. You're on top of things." | — |
| No attendance | "Attendance not marked" | "Mark who showed up today before you forget." | "Mark Attendance" |
| Search no results | "No matches found" | "Try a different name or phone number." | "Clear search" |

- Tone: warm, human, specific. Never: "No data available", "No records found".
- CTA: primary Button for main action. Ghost for secondary.

---

---

# HEROES

---

## 27. AttendanceGrid

**Purpose:** THE ritual screen. Mark who showed up in < 60 seconds. Every design decision here optimises for speed, accuracy, and satisfaction.

```tsx
interface AttendanceGridProps {
  members: AttendanceMember[]
  date: string
  onToggle: (memberId: string, status: AttendanceStatus) => void
  onSave: () => void
  saving?: boolean
}

interface AttendanceMember {
  id: string
  name: string
  avatarSrc?: string
  status: 'unmarked' | 'present' | 'absent'
}
```

### Row Anatomy (56px height, mobile)
```
[Avatar md]  [Name]                    [Toggle 48×48]
             [Subtitle if any]
```

### Toggle States
| Status | Toggle bg | Icon | Tap sound feel |
|---|---|---|---|
| `unmarked` | neutral-200 | — dash, neutral-400 | — |
| `present` | success-500 | ✓ white | vibrate(10) |
| `absent` | error-100 | ✗ error-500 | vibrate(10) |

### Tap Cycle
`unmarked` → `present` → `absent` → `unmarked`

### Performance Rules (non-negotiable)
- **Optimistic update:** update local state immediately on tap, sync to server in background
- **Zero re-renders:** toggling one member re-renders only that row. Use `React.memo` + `useCallback`.
- **No loading states on individual toggles** — optimistic UI only. Show error toast if server fails.
- **Batch save:** a single "Save" button at bottom saves all changes at once. Not auto-save on each tap.

### Progress Bar
- Sticky below TopBar during attendance session
- "12 / 24 marked" — fraction + neutral progress bar, primary-500 fill
- Disappears when all marked (replaced by "All done ✓")

### Save Bar (sticky bottom)
```
[X unmarked remaining]    [Save Attendance ↑]
```
- Full width, white bg, neutral-200 top border
- Safe area inset bottom
- Save button: primary, lg, full width on mobile
- Disabled until at least 1 toggle changed

### Completion State
When all members marked:
- Progress bar → `"All marked ✓"` in success-500
- Scale(0) → scale(1.1) → scale(1.0), 200ms ease-out
- Save button pulses once (scale 1.02, 150ms)

---

## 28. DailyDigest

**Purpose:** Owner dashboard. A morning brief in one scroll. "What do I need to know and do today?"

```tsx
interface DailyDigestProps {
  stats: DigestStat[]
  actions: ActionItem[]       // "3 overdue payments", "1 new member"
  recentActivity: Activity[]
}
```

### Layout
```
[Good morning, Ravi]             ← personalised greeting, h2
[Today: Day Name · Date]         ← neutral-500

[Stats Grid: 2 col mobile, 3 col desktop]
  Revenue this month
  Active members
  Attendance today
  Overdue payments

[Action Items (if any)]
  → card per action, orange left border

[Recent Activity]
  → last 5 events, timeline style
```

- Stats: `StatCard` components in responsive grid
- Action items: AlertBanner-like cards, primary-500 left border 3px
- Each action item: title + description + CTA button (ghost, sm)
- No action items → show nothing (not an empty state — silence is good news)

---

## 29. CommandBar

**Purpose:** Power-user shortcut palette. Cmd+K / Ctrl+K. Search members, navigate to any page, trigger quick actions. Desktop only.

```tsx
interface CommandBarProps {
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}
```

- Appears as modal sm (400px), centred
- Search input at top: 48px height, prominent
- Results: 40px rows, grouped by category (Members, Navigation, Actions)
- Keyboard: ↑↓ to navigate, Enter to select, Escape to close
- Category labels: 11px uppercase neutral-400
- Match highlight: primary-600 on matched characters
- Empty: "No results for X" — not an error, just feedback
- Recent: shows last 5 actions if search is empty
- Hidden on mobile (no Cmd key on mobile keyboards)

---

---

# PATTERNS

---

## 30. Skeleton

**Purpose:** Perceived performance. Show content shape immediately while data loads. No spinners on primary paths.

```tsx
// Atom — the shimmer block
interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

// Pre-built skeletons:
<SkeletonListItem />     // matches ListItem shape
<SkeletonStatCard />     // matches StatCard shape
<SkeletonTableRow />     // matches DataTable row shape
<SkeletonText lines={3} />  // paragraph shimmer
```

### Shimmer Animation
```css
background: linear-gradient(
  90deg,
  neutral-200 25%,
  neutral-100 50%,
  neutral-200 75%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- Shape MUST match the content it replaces (same height, same radius, same layout)
- Avatar skeleton: circle (radius-full), same size as Avatar size prop
- Text skeleton: height 14px for body, 24px for h1
- Button skeleton: exact button size

---

## 31. ErrorState

**Purpose:** Graceful failure. The user knows something went wrong, knows what to do next. Never a dead end, never a stack trace.

```tsx
interface ErrorStateProps {
  title?: string         // default: "Something went wrong"
  description?: string   // default: "We couldn't load this. Please try again."
  onRetry?: () => void
  fullPage?: boolean     // centers vertically in viewport
}
```

- Icon: `AlertCircle`, 48px, error-500
- Title: h2, neutral-900
- Description: body, neutral-500
- Retry button: secondary size="md"
- Tone: "Something went wrong. We're looking into it." — not "Error 500"
- Full page variant: vertically centered, for route-level failures
- Inline variant: same width as the content it replaces (table, list, etc.)

---

## 32. ConfirmDialog

**Purpose:** Destructive action confirmation. Forces intent before an irreversible action.

```tsx
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string      // default: "Confirm"
  cancelLabel?: string       // default: "Cancel"
  variant?: 'default' | 'danger'
  loading?: boolean
}
```

- Uses `Modal size="sm"`
- `danger` variant: confirm button is `Button variant="danger"`
- Default variant: confirm button is `Button variant="primary"`
- Focus: confirm button on open (allows Enter to confirm, Escape to cancel)
- Loading: confirm button shows spinner while `loading={true}`, cancel disabled
- Title: action-oriented ("Delete Member", "Remove Staff", "Void Payment")
- Description: states the consequence ("Arjun Kumar will be permanently deleted. This cannot be undone.")

---

## 33. InfiniteScroll

**Purpose:** Mobile-native way to paginate long lists. No "load more" button, no pagination UI.

```tsx
interface InfiniteScrollProps {
  children: React.ReactNode
  onLoadMore: () => Promise<void>
  hasMore: boolean
  loading?: boolean
  threshold?: number    // default: 200px from bottom
}
```

- Uses `IntersectionObserver` — no scroll event listeners
- Trigger: invisible sentinel div at the bottom of the list
- When sentinel enters viewport: call `onLoadMore`
- Loading: show 3 `SkeletonListItem` at bottom while loading
- End of list: show "You've seen all X members" — 13px neutral-400, centred
- Never trigger `onLoadMore` if already loading

---

## 34. PullToRefresh

**Purpose:** Mobile-native content refresh. Expected on every list and dashboard by Android users.

```tsx
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}
```

- Trigger: 64px pull distance
- Spinner appears at 32px pull distance, scale grows with pull
- Release: spinner rotates, refresh executes
- Complete: spinner scale(0) 100ms, content fades in
- Bounce-back animation if threshold not met
- **Mobile only** — no-op on desktop
- Implemented with touch events (`touchstart`, `touchmove`, `touchend`) + CSS transforms

---

---

# Component Checklist

Use this checklist before marking any component as done.

## Visual
- [ ] Matches design token colours exactly (no raw hex)
- [ ] Typography matches the type scale
- [ ] Spacing uses 4px multiples
- [ ] All states implemented: default, hover, active, focus, disabled, loading (where applicable)
- [ ] Mobile touch targets ≥ 44×44px

## Functional
- [ ] Loading state does not cause layout shift
- [ ] Error state is handled and visible
- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] Keyboard navigable (Tab, Enter, Space, Escape where appropriate)

## Responsive
- [ ] Mobile breakpoint (< 768px) tested
- [ ] No horizontal overflow on 375px viewport
- [ ] Modals render as bottom sheets on mobile

## Accessibility
- [ ] All interactive elements have accessible labels
- [ ] Focus rings visible on keyboard navigation
- [ ] `aria-*` attributes correct (aria-label, aria-describedby, aria-invalid, aria-expanded)
- [ ] Colour is not the only differentiator (icons accompany colour-coded states)
- [ ] Contrast ratio: WCAG AA minimum (4.5:1 for body text, 3:1 for large text)

## The Three Tests
- [ ] **Ravi Test** — would a non-technical Tier 2 gym owner understand what this component does without explanation?
- [ ] **Arjun Test** — can a coach interact with this one-handed on a mid-range Android phone without frustration?
- [ ] **Stripe Test** — would a Linear/Stripe designer find this component unremarkable (in the best way)?

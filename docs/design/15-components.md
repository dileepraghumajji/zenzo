# Component Specifications

Detailed specs for key components. All sizes in px. All colours reference design system tokens from 01-design-system.md.

---

## Button

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  icon?: ReactNode       // leading icon
  iconRight?: ReactNode  // trailing icon
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}
```

| Variant | Default | Hover | Active | Disabled |
|---|---|---|---|---|
| primary | bg:primary-500, text:white | bg:primary-600 | bg:primary-700 | bg:primary-200, text:white, opacity 0.5 |
| secondary | bg:white, border:neutral-200, text:neutral-700 | bg:neutral-50 | bg:neutral-100 | opacity 0.5 |
| ghost | bg:transparent, text:neutral-700 | bg:neutral-100 | bg:neutral-200 | opacity 0.5 |
| danger | bg:error-500, text:white | bg:error-700 | bg:error-800 | opacity 0.5 |

| Size | Height | Padding H | Font | Icon Size | Border Radius |
|---|---|---|---|---|---|
| sm | 32px | 12px | body-sm (13px) | 14px | radius-md |
| md | 40px | 16px | body (14px) | 16px | radius-md |
| lg | 48px | 20px | body (14px, 500wt) | 20px | radius-md |

- Loading: replace text with 16px spinner, maintain button width
- Mobile touch target: min 44px height regardless of size
- Focus: 2px primary-500 ring, 2px offset

---

## Input / FormField

```tsx
interface FormFieldProps {
  label: string
  type: 'text' | 'email' | 'phone' | 'password' | 'number' | 'search'
  placeholder?: string
  helperText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  prefix?: string       // e.g., "₹", "+91"
}
```

| Property | Value |
|---|---|
| Height | 40px (md), 48px on mobile |
| Padding | 12px horizontal |
| Border | 1px neutral-200 |
| Border radius | radius-md (8px) |
| Font | body (14px) |
| Label | caption weight-500, neutral-700, 4px gap below |
| Placeholder | neutral-400 |
| Focus | border 2px primary-500, shadow 0 0 0 3px primary-100 |
| Error | border error-500, helper text error-500 |
| Disabled | bg neutral-100, text neutral-400 |
| Gap below field | space-4 (16px) |

- Label always above input (never floating — better for i18n and accessibility)
- Error text replaces helper text when present
- Required indicator: red asterisk after label
- Prefix (₹, +91): neutral-500 text in neutral-100 bg area left of input

---

## Badge

```tsx
interface BadgeProps {
  variant: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary'
  size: 'sm' | 'md'
}
```

| Variant | Background | Text |
|---|---|---|
| neutral | neutral-100 | neutral-700 |
| success | success-50 | success-700 |
| warning | warning-50 | warning-700 |
| error | error-50 | error-700 |
| info | info-50 | info-700 |
| primary | primary-50 | primary-700 |

| Size | Height | Padding H | Font |
|---|---|---|---|
| sm | 20px | 6px | 11px, 500wt |
| md | 24px | 8px | 12px, 500wt |

- Border radius: radius-full (pill)
- Always uppercase, tracking 0.05em

---

## Avatar

```tsx
interface AvatarProps {
  src?: string
  name: string         // for initials fallback
  size: 'sm' | 'md' | 'lg'
}
```

| Size | Dimensions | Font |
|---|---|---|
| sm | 28x28 | 11px |
| md | 36x36 | 13px |
| lg | 48x48 | 16px |

- Shape: circle (radius-full)
- Fallback: 2-letter initials (first + last name), random pastel bg from hash of name
- Pastel palette: 8 colours derived from name hash (consistent per member)

---

## StatCard

```tsx
interface StatCardProps {
  label: string
  value: string          // e.g., "₹1.2L", "118", "76%"
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string        // e.g., "↑12%"
  }
  subtitle?: string      // e.g., "this month"
}
```

| Property | Value |
|---|---|
| Padding | space-4 (16px) |
| Border | 1px neutral-200 |
| Border radius | radius-md |
| Label | caption, neutral-500 |
| Value | h1 (24px, 700wt), neutral-900, mono for ₹ amounts |
| Trend up | success-500 text |
| Trend down | error-500 text |
| Subtitle | caption, neutral-400 |
| Hover | shadow-md |

---

## DataTable

```tsx
interface DataTableProps {
  columns: Column[]
  data: Row[]
  selectable?: boolean    // checkboxes
  sortable?: boolean
  pagination?: { page: number, pageSize: number, total: number }
  emptyState?: ReactNode
  onRowClick?: (row: Row) => void
}
```

| Property | Value |
|---|---|
| Header | neutral-50 bg, label font (12px, 500wt), neutral-500, uppercase |
| Row height | 48px |
| Row border | 1px neutral-100 bottom |
| Row hover | neutral-50 bg |
| Padding | 16px horizontal per cell |
| Checkbox | 20x20, primary-500 when checked |

### Mobile Transformation (< 768px)
Table becomes a card list:
- Each row → a card with key columns stacked vertically
- Primary column (name) as card title
- Secondary columns as subtitle lines
- Row actions → tap card to navigate, long-press for menu

---

## Modal / Dialog

```tsx
interface ModalProps {
  size: 'sm' | 'md' | 'lg'
  title: string
  onClose: () => void
}
```

| Size | Width | Use case |
|---|---|---|
| sm | 400px | Confirmations, simple forms |
| md | 560px | Standard forms |
| lg | 720px | Complex content, previews |

| Property | Value |
|---|---|
| Border radius | radius-lg (12px) |
| Padding | space-6 (24px) |
| Shadow | shadow-lg |
| Overlay | neutral-900 / 50% opacity |
| Close | X button top-right, ESC key |
| Header | h2, neutral-900, space-4 gap below |
| Footer | right-aligned buttons, space-4 gap above, top border neutral-200 |

### Mobile (< 768px)
Modals become **bottom sheets:**
- Slides up from bottom
- Top radius: radius-xl (16px)
- Drag handle: 40x4px neutral-300 pill at top center
- Max height: 90vh
- Scrollable content
- Safe-area-inset-bottom padding

---

## Toast / Notification

```tsx
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning'
  message: string
  action?: { label: string, onClick: () => void }
  duration?: number    // default 4000ms
}
```

| Property | Value |
|---|---|
| Position | Bottom-right (desktop), bottom-center (mobile) |
| Width | max 400px, min 280px |
| Padding | 12px 16px |
| Border radius | radius-md |
| Shadow | shadow-md |
| Animation | slide up + fade in (200ms), slide down + fade out (150ms) |
| Stack | max 3 visible, oldest auto-dismissed |

| Variant | Left border | Icon |
|---|---|---|
| success | 3px success-500 | ✓ circle |
| error | 3px error-500 | ✗ circle |
| info | 3px info-500 | ℹ circle |
| warning | 3px warning-500 | ⚠ triangle |

---

## EmptyState

```tsx
interface EmptyStateProps {
  icon?: ReactNode        // 48px, neutral-300
  title: string           // h2
  description: string     // body, neutral-500
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}
```

| Property | Value |
|---|---|
| Layout | Centered, max-width 400px |
| Padding | space-12 (48px) vertical |
| Icon | 48x48, neutral-300 |
| Title gap | space-3 below icon |
| Description gap | space-2 below title |
| Action gap | space-5 below description |

- Tone: warm, helpful, never corporate. "No members yet" not "No data available."
- Always include a CTA — empty states are onramps, not dead ends.

---

## AttendanceToggle (Hero Component)

```tsx
interface AttendanceToggleProps {
  memberId: string
  memberName: string
  memberInitials: string
  status: 'unmarked' | 'present' | 'absent'
  onChange: (status) => void
}
```

| Property | Value |
|---|---|
| Row height | 56px |
| Padding | 12px 16px |
| Avatar | md (36px) |
| Name font | body (14px, 500wt) |
| Toggle area | 48x48px min tap target |
| Border bottom | 1px neutral-100 |

| Status | Toggle Style |
|---|---|
| unmarked | neutral-200 bg, neutral-400 dash icon |
| present | success-500 bg, white ✓ icon |
| absent | error-100 bg, error-500 ✗ icon |

- Tap animation: scale(0.95) → scale(1) over 100ms
- Color transition: 150ms ease
- Haptic feedback: navigator.vibrate(10) on status change

# Micro-interactions & Motion + Responsive Behaviour

---

## Motion Principles
1. **Fast** — no animation > 300ms. Users are on 4G, mid-range phones.
2. **Purposeful** — animation communicates state change, not decoration.
3. **Subtle** — if you notice the animation, it's too much.

## Easing
- **ease-out** for entering elements (slide in, fade in)
- **ease-in** for exiting elements (fade out, slide out)
- **ease-in-out** for layout shifts (sidebar collapse, tab switch)
- CSS: `cubic-bezier(0.4, 0, 0.2, 1)` for standard, `cubic-bezier(0, 0, 0.2, 1)` for decelerate

---

## Page Transitions
- Fade: opacity 0→1, 150ms ease-out
- No slide transitions between pages (feels slow on low-end devices)
- Skeleton content appears immediately (0ms), fades out when data loads

## Attendance Mark Feedback
- Toggle: bg colour transition 150ms ease
- Scale: tap → scale(0.95) → scale(1.0), 100ms total
- Haptic: `navigator.vibrate(10)` on every tap (gracefully fails on desktop)
- Progress bar: width transition 200ms ease-out
- Completion checkmark: scale(0) → scale(1.1) → scale(1.0), 200ms ease-out

## Payment Success State
- Large checkmark: scale + fade in, 300ms ease-out
- Amount text: fade in 150ms after checkmark
- Confetti: NO — too much for a payment receipt. Keep it professional.
- Green success-500 checkmark circle, 64px

## Form Validation Feedback
- Error text: fade in 150ms, slide down 4px
- Error border: colour transition 150ms
- On fix: error fades out 100ms
- No shake animations — they feel aggressive

## Notification Toast
- Enter: slide up 16px + fade in, 200ms ease-out
- Exit: slide down 8px + fade out, 150ms ease-in
- Auto-dismiss: 4s default, 8s for error toasts
- Hover pauses auto-dismiss timer (desktop)

## Onboarding Progress
- Dot fill: colour transition 200ms
- Step content: fade in 150ms (no slide — keeps it fast)
- On final step completion: subtle confetti burst (300ms) — this IS a celebration moment

## Button Loading
- Text fades out (100ms), spinner fades in (100ms)
- Maintain button width (no layout shift)
- Spinner: 16px, white for primary, neutral-500 for secondary

## Sidebar Collapse
- Width: 240px → 64px, 200ms ease-in-out
- Labels: opacity 0 at 120ms (before width finishes)
- Icons: remain centered throughout

## Bottom Sheet
- Enter: slide up from bottom, 250ms ease-out
- Overlay: fade in 200ms
- Drag to dismiss: follows finger, velocity-based threshold
- Exit: slide down 200ms ease-in

## Pull to Refresh (Mobile)
- Spinner appears after 64px pull distance
- Release: spinner rotates, content refreshes
- Complete: spinner scale(0) 100ms, content fades in

## Skeleton Loading
- Shimmer: left-to-right gradient sweep, 1.5s infinite
- Gradient: neutral-200 → neutral-100 → neutral-200
- Shape matches content it replaces (rounded rects for text, circles for avatars)
- No spinner on critical paths — skeletons only

---

# Responsive Behaviour

## Breakpoints
```
mobile:   < 768px    (portrait phones, small tablets)
tablet:   768–1024px (landscape tablets, small laptops)
desktop:  > 1024px   (laptops, desktops)
```

Using mobile-first CSS: `@media (min-width: 768px)` and `@media (min-width: 1024px)`

## Layout Shifts by Breakpoint

### Navigation
| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Sidebar | Hidden | Hidden | Visible (240px) |
| Bottom nav | Visible (56px) | Visible | Hidden |
| TopBar | Logo + back arrow | Logo + breadcrumb | Logo + breadcrumb + search + avatar |
| Breadcrumbs | Hidden (back arrow) | Visible | Visible |

### Content
| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Page max-width | 100% | 100% | 1200px centered |
| Page padding | 16px | 24px | 32px |
| Card padding | 16px | 16px | 24px |
| Stat cards | 2-col grid | 3-col grid | 3-col grid |
| Data tables | Card list | Compact table | Full table |
| Forms | Single col | Single col | Two col for short fields |
| Modals | Bottom sheet | Centered modal | Centered modal |

### Attendance Screen
| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Row height | 56px | 52px | 48px |
| Toggle size | 48x48 | 44x44 | 40x40 |
| Search | Hidden, pull to reveal | Visible | Visible |
| Save bar | Sticky bottom | Sticky bottom | Inline bottom |

### Member Portal
- **Always mobile layout** — even on desktop, max-width 480px centered
- This is a mobile experience by design

## Touch Targets
- Minimum: **44x44px** on mobile (Apple HIG standard)
- Buttons: use padding to hit min target even if text is short
- List items: full-width tap target
- Spacing between interactive elements: min 8px

## What Gets Hidden on Mobile
- Breadcrumbs → back arrow
- Sidebar → bottom nav
- Table columns beyond 3 → hidden, accessible in card/detail view
- Secondary actions → moved to overflow menu (⋮)
- Command bar (Cmd+K) → not available on mobile
- Export/Download buttons → moved to overflow menu
- Page descriptions → hidden (title only)

## What Gets Added on Mobile
- Bottom nav (56px)
- Pull-to-refresh on lists and dashboard
- Swipe gestures on cards (left to reveal actions)
- Bottom sheets replace modals
- Floating action button (FAB) for primary action on key screens (optional)

## Tables → Cards Transformation
```
Desktop table row:
| [AK] Arjun Kumar | 98765xxxxx | Morning | Active | ₹1,500 | ⋮ |

Mobile card:
┌──────────────────────────────┐
│ [AK] Arjun Kumar       Active│
│ Morning Batch · 98765xxxxx   │
│ ₹1,500 due                  │
└──────────────────────────────┘
```

- Card tap → navigate to detail
- Card long-press → action sheet (Edit, Delete, Send WhatsApp)

## Typography Scaling
- No font scaling between breakpoints (Inter is legible at all sizes)
- Exception: `display` (32px) only used on desktop. Mobile uses `h1` (24px) for page titles.

## Images / Assets
- Use WebP with JPEG fallback
- Lazy load images below the fold
- Avatar images: serve at 2x size for retina (72px for 36px display)

## Performance Budget (Mobile)
- First Contentful Paint: < 1.5s on 4G
- Largest Contentful Paint: < 2.5s on 4G
- Bundle size: < 200KB initial JS (gzipped)
- No heavy charting libraries on mobile — use simple CSS bars for reports
- Attendance screen: zero unnecessary re-renders on toggle

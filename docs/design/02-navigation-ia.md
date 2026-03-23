# Navigation & Information Architecture

## Site Map

```
/ ............................ Landing / Marketing
/login ....................... Auth (login, signup, forgot password)
/onboarding .................. Post-signup wizard (5 steps)

/:tenantSlug/
  dashboard .................. Daily Digest (owner) / Today's Batches (coach)
  members .................... Member Management
    /new ..................... Add Member
    /:memberId ............... Member Profile
    /:memberId/edit .......... Edit Member
    /import .................. Bulk Import
  batches .................... Batch & Group Management
    /new ..................... Create Batch
    /:batchId ................ Batch Detail
  attendance ................. Attendance Hub
    /take/:batchId ........... Take Attendance (THE ritual screen)
    /history ................. Attendance History
  payments ................... Fee & Payment Management
    /overdue ................. Overdue List (default view)
    /record .................. Record Payment
    /history ................. Payment History
    /plans ................... Fee Plan Management
      /new ................... Create Plan
      /:planId/edit .......... Edit Plan
  reports .................... Reports Hub
    /revenue ................. Revenue Report
    /attendance .............. Attendance Report
    /members ................. Member Growth Report
    /retention ............... Retention Report
  communications ............. WhatsApp Hub
    /templates ............... Message Templates
    /history ................. Sent Messages Log
  progression ................ Belt / Level System
    /promote ................. Log Promotion
  staff ...................... Staff Management
    /new ..................... Add Staff
    /:staffId ................ Staff Profile
  settings ................... Business Settings
    /profile ................. Business Profile
    /notifications ........... WhatsApp Settings
    /payment-gateway ......... Razorpay Connection
    /terminology ............. Custom Labels (belt→level, batch→class)

/m/:token .................... Member Portal (public, token-gated via WhatsApp link)
  / .......................... Member Home (attendance %, next due, last payment)
  /pay ....................... Make Payment
  /receipts .................. Payment Receipts
  /attendance ................ My Attendance History
```

---

## Primary Navigation — Sidebar (Desktop) / Bottom Nav (Mobile)

### Owner View — Sidebar
```
[Logo]
──────────────
📊 Dashboard          ← default landing
👥 Members
📋 Batches
✓  Attendance
₹  Payments
📈 Reports
──────────────
💬 Communications
🏅 Progression        ← hidden if business type doesn't use levels
👤 Staff
⚙️ Settings
──────────────
[User avatar + name]
[Tenant switcher]     ← for multi-location owners (Phase 2)
```

### Owner View — Mobile Bottom Nav (5 items max)
```
Dashboard | Members | Attendance | Payments | More
```
"More" opens a bottom sheet with: Reports, Communications, Progression, Staff, Settings.

### Coach View — Sidebar / Bottom Nav
Coaches see a simplified nav. No financial data, no settings.
```
📊 Dashboard (today's batches only)
✓  Attendance          ← primary
👥 Members (read-only view)
🏅 Progression (if applicable)
```
Mobile bottom nav: `Dashboard | Attendance | Members | Profile`

### Member Portal — No Nav
Single-page feel. Top bar with back arrow. Tabs for sections:
```
[← Business Name]
[Home] [Attendance] [Payments]
```

---

## Secondary Navigation

### Tabs
- Member profile: `Overview | Attendance | Payments | Progression`
- Reports: `Revenue | Attendance | Members | Retention`
- Settings: `Profile | Fee Plans | Staff | Notifications | Gateway | Terminology`
- Use underline-style tabs, scrollable horizontally on mobile

### Breadcrumbs (desktop only)
`Dashboard > Members > Arjun Kumar`
- Max 3 levels. Current page not linked.
- Hidden on mobile — use back arrow in TopBar instead.

### Contextual Actions
- Page-level: PageHeader primary action button (e.g., "Add Member")
- Row-level: Three-dot menu on table rows / list items → Edit, Delete, Send WhatsApp
- Bulk actions: Appear in a sticky bar when checkboxes selected

---

## Navigation Behaviour

### Desktop
- Sidebar always visible (240px)
- Collapse to icon-only (64px) via toggle button at bottom
- Remember collapsed state in localStorage
- Active nav item: primary-500 text + primary-50 background + left 3px primary-500 border

### Mobile
- Bottom nav fixed, 56px height, safe-area-inset-bottom padding
- 5 items max, icon + label (caption size)
- Active: primary-500 icon + label. Inactive: neutral-400
- "More" item opens bottom sheet with remaining nav items
- No sidebar on mobile — ever

### Transitions
- Page transitions: fade (150ms ease-out)
- Sidebar collapse: width transition (200ms ease-in-out)
- Bottom sheet: slide up (250ms ease-out)

---

## Role-Based Access Summary

| Route | Owner | Coach | Member |
|---|---|---|---|
| Dashboard | Full digest | Today's batches only | — |
| Members | CRUD | Read-only | — |
| Batches | CRUD | Read-only (own batches) | — |
| Attendance | View all history | Take + view own batches | Own history |
| Payments | Full management | — | Pay + receipts |
| Reports | All | — | — |
| Communications | Full | — | — |
| Progression | Promote + view | Promote + view | Own history |
| Staff | CRUD | — | — |
| Settings | Full | — | — |
| Member Portal | — | — | Full |

Unauthorized route access → redirect to dashboard (owner/coach) or member home (member).

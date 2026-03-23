# Screen Specs — Members

## Members List

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Members (118)                        [+ Add Member]  │
│                                                      │
│ [Search members...]  [Batch ▾] [Status ▾] [Plan ▾]  │
│                                                      │
│ ☐ Name          Phone        Batch      Status  Fee  │
│ ──────────────────────────────────────────────────── │
│ ☐ [AK] Arjun K  98765xxxxx  Morning    Active  ₹1.5K│ ⋮
│ ☐ [PN] Priya N  91234xxxxx  Evening    Active  ₹2K  │ ⋮
│ ☐ [RS] Rahul S  99887xxxxx  Morning    Overdue ₹1.5K│ ⋮
│ ☐ [DG] Deepa G  98123xxxxx  Kids       Expired —    │ ⋮
│ ...                                                  │
│                                                      │
│ Showing 1–25 of 118              [← 1 2 3 4 5 →]    │
└──────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────┐
│ Members (118) [+]    │
│ [🔍 Search...]       │
│ [Batch ▾] [Status ▾] │ ← horizontal scroll filter chips
│                      │
│ ┌──────────────────┐ │
│ │ [AK] Arjun Kumar │ │
│ │ Morning · Active │ │
│ │ ₹1,500 due       │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ [PN] Priya Nair  │ │
│ │ Evening · Active │ │
│ │ Paid             │ │
│ └──────────────────┘ │
│ ...                  │
│                      │
│ [Bottom Nav]         │
└──────────────────────┘
```

- **Primary action:** + Add Member
- **Table → Cards on mobile** (< 768px)
- **Search:** Instant filter on name or phone, debounced 300ms
- **Filters:** Batch, Status (Active/Overdue/Expired/All), Fee Plan. Active filters shown as chips
- **Sort:** Name (default), join date, last attendance
- **Row actions (desktop):** Three-dot menu → View Profile, Edit, Send WhatsApp, Delete
- **Row actions (mobile):** Tap card → Member Profile. Long-press → action sheet
- **Bulk actions:** When checkboxes selected, sticky bar appears: "3 selected — [Send Reminder] [Assign Batch] [Delete]"
- **Pagination:** 25 per page desktop, infinite scroll mobile

### Status Badges
- `Active` — success badge (green)
- `Overdue` — error badge (red)
- `Expired` — neutral badge (grey)
- `New` — info badge (blue, first 7 days)

### Empty State
```
┌──────────────────────────────┐
│                              │
│    👥                        │
│    No members yet            │
│                              │
│    Add your first member to  │
│    get started.              │
│                              │
│    [+ Add Member]            │
│    or [Import from CSV]      │
└──────────────────────────────┘
```

---

## Add Member Form

### Layout
```
┌──────────────────────────────────────┐
│ ← Add Member                        │
│                                      │
│ BASIC INFO                           │
│                                      │
│ Full Name *                          │
│ [                            ]       │
│                                      │
│ Phone Number *                       │
│ [+91] [                      ]       │
│                                      │
│ Email (optional)                     │
│ [                            ]       │
│                                      │
│ Date of Birth (optional)             │
│ [DD / MM / YYYY             ]        │
│                                      │
│ Gender (optional)                    │
│ [Male] [Female] [Other]             │
│                                      │
│ ─────────────────────────────        │
│ MEMBERSHIP                           │
│                                      │
│ Batch *                              │
│ [Select batch              ▾]       │
│                                      │
│ Fee Plan *                           │
│ [Select plan               ▾]       │
│                                      │
│ Start Date                           │
│ [23 Mar 2026               ]        │
│                                      │
│ ─────────────────────────────        │
│ EMERGENCY CONTACT (optional)         │
│                                      │
│ Name                                 │
│ [                            ]       │
│                                      │
│ Phone                                │
│ [+91] [                      ]       │
│                                      │
│ ─────────────────────────────        │
│                                      │
│ ☑ Send welcome message via WhatsApp  │
│                                      │
│ [Cancel]              [Add Member]   │
└──────────────────────────────────────┘
```

- **Required fields:** Name, Phone, Batch, Fee Plan (minimum to create member)
- **Opinionated defaults:** Start date = today, WhatsApp welcome = on
- **Gender:** Pill selector, not dropdown (faster)
- **On submit:** Creates member, optionally sends WhatsApp, redirects to member profile
- **Validation:** Inline on blur. Phone: check uniqueness. Name: non-empty
- **Mobile:** Same form, single column, sticky "Add Member" button at bottom
- **Loading:** Button spinner during save

---

## Member Profile

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ ← Members                                [Edit] [⋮] │
│                                                      │
│ ┌───────────────────────────────────────────────────┐│
│ │ [AK]  Arjun Kumar              Status: Active     ││
│ │       98765 43210 · arjun@email.com               ││
│ │       Morning Batch · Monthly Plan (₹1,500)       ││
│ │       Member since 15 Jun 2025                    ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ [Overview] [Attendance] [Payments] [Progression]     │
│                                                      │
│ ── Overview Tab ──                                   │
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Attendance  │ │ Next Due    │ │ Belt        │     │
│ │ 85%         │ │ 01 Apr 2026 │ │ 🟡 Yellow    │     │
│ │ this month  │ │ ₹1,500      │ │              │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ Recent Activity                                      │
│ • Attended Morning Batch           today 6:15 AM     │
│ • Payment ₹1,500 received         20 Mar 2026       │
│ • Promoted to Yellow Belt          15 Jan 2026       │
│ ...                                                  │
└──────────────────────────────────────────────────────┘

Mobile:
- Same content, single column
- Profile header stacks vertically
- Tabs scroll horizontally
```

### Tabs
- **Overview:** Stats + recent activity timeline
- **Attendance:** Calendar heatmap (green=present, red=absent, grey=no class) + attendance list
- **Payments:** Payment history table/cards + next due info
- **Progression:** Belt/level history timeline + promote button (if applicable)

### Actions Menu (⋮)
- Send WhatsApp
- Record Payment
- Change Batch
- Deactivate Member
- Delete Member (danger — confirm dialog)

---

## Bulk Import

### Layout
```
┌──────────────────────────────────────┐
│ ← Import Members                     │
│                                      │
│ Upload your member list              │
│                                      │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │  📄 Drop your CSV or Excel    │   │
│ │     file here, or browse      │   │
│ │                                │   │
│ │  [Browse Files]                │   │
│ │                                │   │
│ │  Download template: [CSV]     │   │
│ └────────────────────────────────┘   │
│                                      │
│ After upload: Preview table          │
│ ┌────────────────────────────────┐   │
│ │ ✓ 45 members ready to import  │   │
│ │ ⚠ 3 rows have issues          │   │
│ │                                │   │
│ │ [Show issues]                  │   │
│ │                                │   │
│ │ [Cancel]    [Import 45 Members]│   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

- **Template download:** Pre-formatted CSV with columns: Name, Phone, Email, Batch, Plan
- **Validation:** Preview shows errors inline (duplicate phone, missing name)
- **Partial import:** Can import valid rows, skip errored ones
- **Progress:** Progress bar during import with count

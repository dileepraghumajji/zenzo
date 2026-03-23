# Screen Specs — Batches

## Batches List

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Batches (5)                          [+ Create Batch]│
│                                                      │
│ ┌──────────────────┐ ┌──────────────────┐            │
│ │ Morning Batch    │ │ Evening Batch    │            │
│ │ 6:00–7:30 AM     │ │ 5:00–6:30 PM     │            │
│ │ Mon–Fri          │ │ Mon–Sat          │            │
│ │ 18 members       │ │ 12 members       │            │
│ │ Avg att: 82%     │ │ Avg att: 74%     │            │
│ │ Coach: Arjun     │ │ Coach: Priya     │            │
│ └──────────────────┘ └──────────────────┘            │
│ ┌──────────────────┐ ┌──────────────────┐            │
│ │ Kids Batch       │ │ Weekend Special  │            │
│ │ 4:00–5:00 PM     │ │ 8:00–9:30 AM     │            │
│ │ Mon Wed Fri      │ │ Sat Sun          │            │
│ │ 8 members        │ │ 15 members       │            │
│ │ Avg att: 90%     │ │ Avg att: 68%     │            │
│ │ Coach: —         │ │ Coach: Arjun     │            │
│ └──────────────────┘ └──────────────────┘            │
└──────────────────────────────────────────────────────┘
```

- **Primary action:** + Create Batch
- **Layout:** Card grid — 2 cols desktop, 1 col mobile
- **Card info:** Name, timing, days, member count, avg attendance %, assigned coach
- **Card action:** Click → Batch Detail page
- **Card menu (⋮):** Edit, Delete (only if 0 members)
- **Empty state:** "Create your first batch — a batch is a group that trains together at the same time."

---

## Create Batch Form

### Layout
```
┌──────────────────────────────────────┐
│ ← Create Batch                       │
│                                      │
│ Batch Name *                         │
│ [                            ]       │
│                                      │
│ Timing *                             │
│ [06:00 AM] to [07:30 AM]            │
│                                      │
│ Days *                               │
│ [M] [T] [W] [T] [F] [S] [S]        │
│  ●   ●   ●   ●   ●   ○   ○         │
│                                      │
│ Coach (optional)                     │
│ [Select coach              ▾]       │
│                                      │
│ Max Capacity (optional)              │
│ [                            ]       │
│                                      │
│ Description (optional)               │
│ [                            ]       │
│                                      │
│ [Cancel]            [Create Batch]   │
└──────────────────────────────────────┘
```

- **Defaults:** Mon–Fri selected, time pickers with 30-min increments
- **Day selector:** Large pill toggles, min 44px tap target
- **Validation:** Name required, at least 1 day selected, start < end time

---

## Batch Detail

### Layout
```
┌──────────────────────────────────────────────────────┐
│ ← Batches                                [Edit] [⋮] │
│                                                      │
│ Morning Batch                                        │
│ 6:00 – 7:30 AM · Mon–Fri · Coach: Arjun            │
│                                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│ │ Members │ │ Avg Att │ │ Today   │                 │
│ │ 18      │ │ 82%     │ │ 15/18   │                 │
│ └─────────┘ └─────────┘ └─────────┘                 │
│                                                      │
│ [Take Attendance]                                    │
│                                                      │
│ Members in this batch                                │
│ ┌────────────────────────────────────────────────┐   │
│ │ [AK] Arjun Kumar    98765xxxxx    Active       │   │
│ │ [PN] Priya Nair     91234xxxxx    Active       │   │
│ │ ...                                            │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ [+ Add Member to Batch]                              │
└──────────────────────────────────────────────────────┘
```

- **Primary action:** Take Attendance → navigates to attendance/take/:batchId
- **Members list:** Simplified view with quick stats
- **Add member:** Opens searchable member picker (existing members not in this batch)
- **Actions menu:** Edit batch, Delete batch (confirm if has members — reassign first)

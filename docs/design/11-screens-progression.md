# Screen Specs — Belt / Level Progression

**Conditional module** — only shown when business type uses levels (martial arts, dance grading, etc.). Configurable terminology in Settings.

---

## Belt Distribution View

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Progression                            [+ Promote]   │
│                                                      │
│ Belt Distribution                                    │
│                                                      │
│ ⚪ White      ████████████████████████  24 (40%)     │
│ 🟡 Yellow     ██████████████           14 (23%)     │
│ 🟠 Orange     ████████                  8 (13%)     │
│ 🟢 Green      ██████                    6 (10%)     │
│ 🔵 Blue       ████                      4 (7%)      │
│ 🟤 Brown      ███                       3 (5%)      │
│ ⚫ Black      █                         1 (2%)      │
│                                                      │
│ Recent Promotions                                    │
│ ┌────────────────────────────────────────────────┐   │
│ │ Rahul Sharma  🟡→🟠  Orange Belt  23 Mar 2026 │   │
│ │ Deepa Gupta   ⚪→🟡  Yellow Belt  20 Mar 2026 │   │
│ │ ...                                            │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- **Primary action:** + Promote (opens member picker → promotion form)
- **Horizontal bar chart** showing distribution by belt/level
- **Recent promotions** list below
- **Mobile:** Same layout, bars go full-width

---

## Log a Promotion

(See Journey 5 in 03-user-journeys.md for full flow)

### Form
```
┌──────────────────────────────────────┐
│ ← Promote Member                     │
│                                      │
│ Member *                             │
│ [Search member...          ▾]        │
│ → Rahul Sharma · Current: 🟡 Yellow  │
│                                      │
│ Promote to *                         │
│ [🟠 Orange Belt            ▾]        │
│                                      │
│ Date                                 │
│ [23 Mar 2026               ]         │
│                                      │
│ Notes (optional)                     │
│ [                            ]       │
│                                      │
│ ☑ Send congratulations via WhatsApp  │
│                                      │
│ [Cancel]             [Confirm]       │
└──────────────────────────────────────┘
```

- **Next belt auto-selected** based on defined order
- **Date defaults to today**
- **WhatsApp on by default**

---

## Member Progression History

(Shown as a tab on Member Profile page — see 06-screens-members.md)

```
┌──────────────────────────────────────┐
│ Current: 🟠 Orange Belt              │
│ Since 23 Mar 2026                    │
│                                      │
│ History                              │
│ ──────                               │
│ 🟠 Orange   23 Mar 2026  "Excellent │
│                           kata"      │
│ 🟡 Yellow   15 Jan 2026             │
│ ⚪ White    01 Jun 2025  "Joined"   │
│                                      │
│ [Promote to Next Belt →]             │
└──────────────────────────────────────┘
```

- Timeline view with belt colour dots
- Notes shown if present
- Promote button at bottom (owner/coach only)

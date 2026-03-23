# Screen Specs — Attendance

## THE MOST IMPORTANT SCREEN IN THE PRODUCT

The attendance flow is used daily by every coach. It must be fast, satisfying, and foolproof. Design it like a ritual, not a form.

---

## Coach — Today's Batches

(Same as Coach Dashboard — see 05-screens-dashboard.md)

---

## Take Attendance (THE Ritual Screen)

### Layout
```
Mobile (primary context — coach standing in class):
┌──────────────────────────────┐
│ ← Morning Batch              │
│ 23 Mar 2026 · 6:00 AM        │
│                              │
│ ████████████░░░░░░  12/18    │
│                              │
│ [🔍 Search]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │ [AK] Arjun Kumar   [✓]  │ │ ← 56px row height
│ │                          │ │    48x48 toggle target
│ ├──────────────────────────┤ │
│ │                          │ │
│ │ [PN] Priya Nair    [✓]  │ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │                          │ │
│ │ [RS] Rahul Sharma  [✗]  │ │
│ │                          │ │
│ ├──────────────────────────┤ │
│ │                          │ │
│ │ [DG] Deepa Gupta   [ ]  │ │ ← unmarked
│ │                          │ │
│ ├──────────────────────────┤ │
│ │ ...                      │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ [Mark rest absent] [Save]│ │ ← sticky bottom bar
│ └──────────────────────────┘ │
└──────────────────────────────┘

Desktop (owner reviewing, less common):
┌──────────────────────────────────────────────────────┐
│ ← Morning Batch                                     │
│ 23 Mar 2026 · 6:00 AM               12 of 18 marked │
│ ████████████████████████░░░░░░░░░░░░░░░░░  67%      │
│                                                      │
│ [🔍 Search members]                                  │
│                                                      │
│ Name                    Status         Marked        │
│ ─────────────────────────────────────────────────── │
│ [AK] Arjun Kumar       Active         [✓ Present]  │
│ [PN] Priya Nair        Active         [✓ Present]  │
│ [RS] Rahul Sharma      Active         [✗ Absent ]  │
│ [DG] Deepa Gupta       Active         [  ——     ]  │
│ ...                                                  │
│                                                      │
│              [Mark remaining absent]  [Save & Done]  │
└──────────────────────────────────────────────────────┘
```

### Toggle States
```
[ ] Unmarked — neutral-200 bg, neutral-400 dash icon
[✓] Present — success-500 bg, white checkmark icon
[✗] Absent  — error-100 bg, error-500 cross icon
```
- Tap cycles: Unmarked → Present → Absent → Unmarked
- Or: Tap once = Present. Tap again = Absent. Tap again = Unmarked
- Visual feedback: instant colour change, no animation delay
- Haptic: single tap vibration on mobile (navigator.vibrate(10))

### Progress Bar
- Fills as members are marked (any state — present or absent counts as "marked")
- Colour: primary-500
- Shows fraction: "12 of 18 marked" (not percentage — more concrete)
- When 100%: bar turns success-500, text says "All marked!"

### Behaviour
- **Sort:** Alphabetical by default. Option to show "absent last session" first
- **Search:** Hidden by default, pull down or tap search icon to reveal. Filters list in real-time
- **Save:** Saves all marks at once. Disables button during save (spinner)
- **"Mark remaining absent":** Bulk-marks all unmarked as absent. Confirmation not needed (reversible)
- **Auto-save:** If user navigates away with marks, prompt: "Save attendance before leaving?"
- **Edit window:** Attendance can be edited same day until midnight. After that, locked (owner can unlock in settings)

### Completion State
```
┌──────────────────────────────┐
│                              │
│         ✓                    │ ← large animated checkmark
│   Attendance saved!          │
│                              │
│   Morning Batch              │
│   15 present · 3 absent     │
│                              │
│   [Back to Batches]          │
│                              │
└──────────────────────────────┘
```
- Checkmark scales in (200ms ease-out)
- Auto-navigate to batch list after 2s
- Or tap "Back to Batches" immediately

### Loading State
- Skeleton list with shimmer (member rows shape)
- Progress bar at 0

### Error State
- Save failed: toast "Couldn't save attendance. [Retry]" — data preserved locally
- Load failed: "Couldn't load batch members. [Retry]"

### Empty State
- "No members in this batch yet. [Add members →]"

---

## Attendance History (Owner View)

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Attendance                                           │
│                                                      │
│ [Batch: All ▾]  [Date range ▾]                       │
│                                                      │
│ ┌─────────────────────────────────────────────────┐  │
│ │        Mon  Tue  Wed  Thu  Fri  Sat  Sun       │  │
│ │ Arjun   ✓    ✓    ✗    ✓    ✓    —    —        │  │
│ │ Priya   ✓    ✓    ✓    ✓    ✓    —    —        │  │
│ │ Rahul   ✗    ✗    ✓    ✗    ✓    —    —        │  │
│ │ Deepa   ✓    ✓    ✓    ✗    ✓    —    —        │  │
│ │ ...                                             │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ Summary: 82% avg attendance this week                │
│ Consecutive absentees:                               │
│ • Rahul Sharma — absent 3 of last 5 sessions        │
└──────────────────────────────────────────────────────┘

Mobile:
- Grid scrolls horizontally
- Or: switch to list view per member
  "Arjun Kumar — 4/5 this week (80%)"
```

### Filters
- Batch: dropdown with all batches
- Date range: This week (default), Last week, This month, Custom range

### Symbols
- ✓ green — present
- ✗ red — absent
- — grey — no class scheduled
- Empty — not yet marked

### Key Insight
- "Consecutive absentees" section below the grid — highlights members missing 3+ sessions
- This is the owner's early warning system for churn

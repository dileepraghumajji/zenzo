# Screen Specs — Reports

## Reports Hub

### Layout
```
┌──────────────────────────────────────────────────────┐
│ Reports                                              │
│                                                      │
│ [Revenue] [Attendance] [Members] [Retention]         │
│                                                      │
│ (Tab content below)                                  │
└──────────────────────────────────────────────────────┘
```

---

## Revenue Report

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [This Month ▾]  [All Batches ▾]                      │
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Collected   │ │ Outstanding │ │ Projected   │     │
│ │ ₹1,24,000  │ │ ₹9,000     │ │ ₹1,33,000  │     │
│ │ ↑8% vs last │ │ 6 members  │ │ this month  │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ Revenue Trend (bar chart — last 6 months)            │
│ ┌────────────────────────────────────────────────┐   │
│ │  █                                             │   │
│ │  █  █     █                                    │   │
│ │  █  █  █  █  █                                 │   │
│ │  █  █  █  █  █  █                              │   │
│ │ Oct Nov Dec Jan Feb Mar                        │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ Collection Breakdown                                 │
│ Cash: ₹48,000 (39%) ████████░░░                      │
│ UPI:  ₹52,000 (42%) █████████░░                      │
│ Online: ₹24,000 (19%) ████░░░░░░                     │
│                                                      │
│ [Download CSV]                                       │
└──────────────────────────────────────────────────────┘
```

- **Filters:** Time period (This month, Last month, This quarter, This year, Custom), Batch
- **Charts:** Simple bar charts — not fancy. Use neutral-700 bars, primary-500 for current period
- **Mobile:** Stats stack 1-col. Chart scrolls horizontally. Breakdown as horizontal bars

---

## Attendance Report

```
┌──────────────────────────────────────────────────────┐
│ [This Month ▾]  [All Batches ▾]                      │
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Avg Rate    │ │ Total Sess. │ │ At Risk     │     │
│ │ 78%         │ │ 440         │ │ 5 members   │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ Daily Attendance Trend (line chart)                   │
│ ┌────────────────────────────────────────────────┐   │
│ │ ──────────╲─────────╱──────────                │   │
│ │                                                │   │
│ │  1  5  10  15  20  25  30                      │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ Batch-wise Breakdown                                 │
│ Morning:  85% ██████████░░                           │
│ Evening:  74% █████████░░░                           │
│ Kids:     90% ███████████░                           │
│ Weekend:  62% ████████░░░░                           │
│                                                      │
│ At-Risk Members (absent 3+ of last 5)                │
│ • Rahul Sharma — 1/5 (20%)                          │
│ • Kiran Patel — 2/5 (40%)                           │
│ ...                                                  │
└──────────────────────────────────────────────────────┘
```

---

## Member Growth Report

```
┌──────────────────────────────────────────────────────┐
│ [Last 6 Months ▾]                                    │
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Total       │ │ New this mo │ │ Churned     │     │
│ │ 118         │ │ +7          │ │ -2          │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ Growth Trend (line chart — net members over time)    │
│                                                      │
│ New vs Churned (stacked bar — monthly)               │
│ ┌────────────────────────────────────────────────┐   │
│ │  +8  +5  +10  +3  +6  +7    ← new (green)    │   │
│ │  -1  -2   -1  -3  -2  -2    ← churned (red)  │   │
│ │ Oct Nov Dec Jan Feb Mar                        │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Retention Report

```
┌──────────────────────────────────────────────────────┐
│ [This Quarter ▾]                                     │
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Retention   │ │ Avg Tenure  │ │ Renewals    │     │
│ │ 89%         │ │ 8.2 months  │ │ 12 this mo  │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ Retention by Cohort (join month)                     │
│ Jan cohort: 92% retained after 3 months              │
│ Feb cohort: 88% retained after 2 months              │
│ Mar cohort: 95% retained after 1 month               │
│                                                      │
│ Members at Risk of Churning                          │
│ • Low attendance + overdue fees (high risk)          │
│   Rahul Sharma, Kiran Patel                         │
│ • Low attendance only (medium risk)                  │
│   Vikram Mehta                                      │
│ • Overdue fees only (medium risk)                   │
│   Deepa Gupta, Sneha Agarwal                       │
│                                                      │
│ [Send reminder to at-risk members]                   │
└──────────────────────────────────────────────────────┘
```

### Report Design Rules
- Stats cards always at top — scannable in 3 seconds
- One primary chart per report — keep it simple
- Actionable insights at bottom — not just data, but "what to do about it"
- All charts: minimal decoration, clear labels, no 3D, no pie charts (bars/lines only)
- Mobile: charts min-width 320px, horizontal scroll if needed
- Export: CSV download available on every report

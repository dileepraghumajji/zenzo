# Screen Specs — Payments

## Overdue List (Default Payments View)

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Payments                              [+ Record Pay] │
│                                                      │
│ [Overdue (6)] [History] [Plans]                      │
│                                                      │
│ Total outstanding: ₹9,000                            │
│ [Send Reminders to All (6)]                          │
│                                                      │
│ ┌────────────────────────────────────────────────┐   │
│ │ [RS] Rahul Sharma                              │   │
│ │ ₹2,000 · Monthly Plan · Due 10 Mar 2026       │   │
│ │ 13 days overdue                    🔴          │   │
│ │                  [Send Reminder] [Record Pay]  │   │
│ ├────────────────────────────────────────────────┤   │
│ │ [AK] Arjun Kumar                               │   │
│ │ ₹1,500 · Monthly Plan · Due 15 Mar 2026       │   │
│ │ 8 days overdue                     🔴          │   │
│ │                  [Send Reminder] [Record Pay]  │   │
│ ├────────────────────────────────────────────────┤   │
│ │ ...                                            │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘

Mobile:
- Card list, same info stacked vertically
- Actions as full-width buttons within card
```

- **Primary action:** + Record Payment
- **Sort:** Most overdue first (more days = higher urgency)
- **"Send Reminders to All":** Sends WhatsApp to all overdue members in one tap. Confirm dialog: "Send payment reminder to 6 members via WhatsApp?"
- **Urgency indicator:** Days overdue — red badge, gets darker with more days
- **Empty state:** "No overdue fees! All members are up to date. 🎉" (success-50 bg)

---

## Record Payment (Manual)

### Layout
```
┌──────────────────────────────────────┐
│ ← Record Payment                     │
│                                      │
│ Member *                             │
│ [Search member...          ▾]        │
│                                      │
│ → Selected: Arjun Kumar              │
│   Overdue: ₹1,500 (Monthly Plan)    │
│                                      │
│ Amount *                             │
│ ₹ [1,500                    ]        │
│                                      │
│ Payment Method *                     │
│ [Cash] [UPI] [Bank Transfer] [Other] │
│                                      │
│ Date                                 │
│ [23 Mar 2026               ]         │
│                                      │
│ Reference / Note (optional)          │
│ [                            ]       │
│                                      │
│ ☑ Send receipt via WhatsApp          │
│                                      │
│ [Cancel]          [Record Payment]   │
└──────────────────────────────────────┘
```

- **Member picker:** Searchable dropdown. If navigated from overdue card, pre-selected
- **Amount:** Pre-filled from plan amount if member has overdue
- **Payment method:** Pill selector (Cash is most common — first option)
- **Date:** Default today, can backdate
- **Receipt:** WhatsApp checkbox on by default
- **On save:** Toast "₹1,500 payment recorded for Arjun Kumar", return to overdue list

---

## Payment History

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Payments                              [+ Record Pay] │
│                                                      │
│ [Overdue (6)] [History] [Plans]                      │
│                                                      │
│ [Date range ▾] [Method ▾] [Search...]                │
│                                                      │
│ Date         Member        Amount  Method  Ref       │
│ ──────────────────────────────────────────────────── │
│ 23 Mar 2026  Arjun Kumar  ₹1,500  Cash    —         │
│ 22 Mar 2026  Priya Nair   ₹2,000  UPI     txn123    │
│ 20 Mar 2026  Deepa Gupta  ₹1,500  Online  rzp_456   │
│ ...                                                  │
│                                                      │
│ This month: ₹12,400 collected (15 payments)          │
│                                                      │
│ Showing 1–25 of 89              [← 1 2 3 4 →]       │
└──────────────────────────────────────────────────────┘

Mobile: Card list with date, name, amount, method badge
```

- **Filters:** Date range (This month default), Payment method
- **Monthly summary:** Total collected + count, sticky at bottom
- **Row action:** Click → Payment detail (receipt view)
- **Export:** [Download CSV] button in header (desktop)

---

## Fee Plan Management

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Payments                                             │
│                                                      │
│ [Overdue (6)] [History] [Plans]                      │
│                                                      │
│ Fee Plans                             [+ Create Plan]│
│                                                      │
│ ┌──────────────────────┐ ┌──────────────────────┐    │
│ │ Monthly Plan         │ │ Quarterly Plan       │    │
│ │ ₹1,500 / month      │ │ ₹4,000 / 3 months   │    │
│ │ 85 members           │ │ 22 members           │    │
│ │ [Edit]               │ │ [Edit]               │    │
│ └──────────────────────┘ └──────────────────────┘    │
│ ┌──────────────────────┐ ┌──────────────────────┐    │
│ │ Annual Plan          │ │ Drop-in              │    │
│ │ ₹15,000 / year       │ │ ₹200 / session       │    │
│ │ 11 members           │ │ 0 members            │    │
│ │ [Edit]               │ │ [Edit]               │    │
│ └──────────────────────┘ └──────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Create/Edit Plan Form
```
┌──────────────────────────────────────┐
│ ← Create Fee Plan                    │
│                                      │
│ Plan Name *                          │
│ [Monthly Plan              ]         │
│                                      │
│ Amount (₹) *                         │
│ [1500                      ]         │
│                                      │
│ Billing Cycle *                      │
│ [Monthly ▾]                          │
│ Options: Monthly, Quarterly,         │
│ Half-yearly, Annual, Per Session     │
│                                      │
│ Description (optional)               │
│ [Standard monthly membership ]       │
│                                      │
│ [Cancel]            [Save Plan]      │
└──────────────────────────────────────┘
```

- **Opinionated:** "Monthly" pre-selected as default cycle
- **Amount in rupees** (not paise — UI handles conversion)
- **Can't delete a plan with active members** — must reassign first

---

## Send Payment Link

### Layout (Modal)
```
┌──────────────────────────────────────┐
│ Send payment link                    │
│                                      │
│ To: Arjun Kumar (98765 43210)        │
│ Amount: ₹1,500                       │
│                                      │
│ Message preview:                     │
│ ┌──────────────────────────────────┐ │
│ │ Hi Arjun, your monthly fee of   │ │
│ │ ₹1,500 at Ravi's Fitness Hub    │ │
│ │ was due on 15 Mar. Pay securely │ │
│ │ here: [payment link]            │ │
│ │                                 │ │
│ │ Thank you! 🙏                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Cancel]          [Send via WhatsApp]│
└──────────────────────────────────────┘
```

- **Read-only preview** — message is templated, not editable per-send
- **Templates configured in Settings** → Notifications

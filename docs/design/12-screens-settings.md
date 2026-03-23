# Screen Specs — Settings & Staff

**Owner-only module.** Coaches and members never see these screens.

---

## Settings Layout

### Navigation
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Settings                                             │
│                                                      │
│ ┌──────────┐                                         │
│ │ Profile  │ [Tab content area]                      │
│ │ Fee Plans│                                         │
│ │ Staff    │                                         │
│ │ Notifs   │                                         │
│ │ Payments │                                         │
│ │ Custom   │                                         │
│ └──────────┘                                         │
└──────────────────────────────────────────────────────┘

Mobile: Vertical list of settings categories → tap to drill in
┌──────────────────────┐
│ Settings             │
│                      │
│ Business Profile   → │
│ Fee Plans          → │
│ Staff Management   → │
│ Notifications      → │
│ Payment Gateway    → │
│ Customization      → │
└──────────────────────┘
```

Desktop: Side tabs (vertical). Mobile: Drill-down list.

---

## Business Profile

```
┌──────────────────────────────────────┐
│ Business Profile                     │
│                                      │
│ Business Name                        │
│ [Ravi's Fitness Hub         ]        │
│                                      │
│ Business Type                        │
│ [Gym / Fitness             ▾]        │
│                                      │
│ URL Slug                             │
│ zenzo.app/ [ravis-fitness   ]        │
│                                      │
│ City                                 │
│ [Hyderabad                 ▾]        │
│                                      │
│ Phone                                │
│ [+91 98765 43210            ]        │
│                                      │
│ Logo (optional)                      │
│ [Upload] or drag and drop            │
│                                      │
│                     [Save Changes]   │
└──────────────────────────────────────┘
```

- **Auto-save indicator** or explicit Save button (using explicit Save — less confusing for target users)
- **Business type change** triggers terminology reset confirmation

---

## Staff Management

```
┌──────────────────────────────────────────────────────┐
│ Staff                                  [+ Add Staff] │
│                                                      │
│ ┌────────────────────────────────────────────────┐   │
│ │ [AJ] Sensei Arjun         Coach                │   │
│ │ 98765 43210 · arjun@email.com                  │   │
│ │ Batches: Morning, Evening, Kids                │   │
│ │                              [Edit] [Remove]   │   │
│ ├────────────────────────────────────────────────┤   │
│ │ [PN] Priya                  Coach               │   │
│ │ 91234 56789                                    │   │
│ │ Batches: Weekend Special                       │   │
│ │                              [Edit] [Remove]   │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ You (Ravi Kumar) — Owner                             │
└──────────────────────────────────────────────────────┘
```

### Add Staff Form
```
┌──────────────────────────────────────┐
│ ← Add Staff                         │
│                                      │
│ Full Name *                          │
│ [                            ]       │
│                                      │
│ Phone *                              │
│ [+91] [                      ]       │
│                                      │
│ Email (optional)                     │
│ [                            ]       │
│                                      │
│ Role *                               │
│ (●) Coach — Can take attendance,     │
│     view members, log promotions     │
│ ( ) Staff — Same as coach            │
│                                      │
│ Assign Batches                       │
│ [☑ Morning] [☑ Evening] [☐ Kids]    │
│ [☐ Weekend Special]                  │
│                                      │
│ [Cancel]              [Add Staff]    │
└──────────────────────────────────────┘
```

- **Role descriptions inline** — coach doesn't need to guess what "Coach" means
- **Batch assignment** — checkboxes for existing batches
- **Invitation:** On add, sends WhatsApp invite with login link

---

## Notification Settings

```
┌──────────────────────────────────────┐
│ Notifications                        │
│                                      │
│ WhatsApp Notifications               │
│                                      │
│ Payment Reminder         [On/Off]    │
│ "Sent 3 days before and on due date" │
│ [Preview template]                   │
│                                      │
│ Payment Receipt          [On/Off]    │
│ "Sent automatically after payment"   │
│ [Preview template]                   │
│                                      │
│ Welcome Message          [On/Off]    │
│ "Sent when a new member is added"    │
│ [Preview template]                   │
│                                      │
│ Belt Promotion           [On/Off]    │
│ "Sent when a member is promoted"     │
│ [Preview template]                   │
│                                      │
│ Attendance Alert         [On/Off]    │
│ "Alert owner when member misses      │
│  3+ consecutive sessions"            │
│                                      │
│                     [Save Changes]   │
└──────────────────────────────────────┘
```

- **Toggle switches** — On/Off for each notification type
- **Preview:** Expandable section showing template text
- **Phase 1:** Templates are pre-built, not customisable. Phase 2: custom templates

---

## Payment Gateway (Razorpay)

```
┌──────────────────────────────────────┐
│ Payment Gateway                      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Status: ● Not Connected          │ │
│ │                                  │ │
│ │ Connect Razorpay to enable       │ │
│ │ online payments from members.    │ │
│ │                                  │ │
│ │ [Connect Razorpay →]             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ After connection:                    │
│ ┌──────────────────────────────────┐ │
│ │ Status: ● Connected              │ │
│ │ Account: Ravi's Fitness Hub      │ │
│ │ Key ID: rzp_live_****           │ │
│ │                                  │ │
│ │ [Test Connection] [Disconnect]   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## Business Type & Terminology

```
┌──────────────────────────────────────┐
│ Customization                        │
│                                      │
│ Business Type                        │
│ [Martial Arts            ▾]          │
│                                      │
│ Custom Terminology                   │
│ "Customize labels to match your      │
│  business language"                  │
│                                      │
│ Members are called                   │
│ [Students               ]            │
│                                      │
│ Batches are called                   │
│ [Classes                ]            │
│                                      │
│ Progression levels are called        │
│ [Belts                  ]            │
│                                      │
│ Show progression module              │
│ [On/Off toggle]                      │
│                                      │
│                     [Save Changes]   │
└──────────────────────────────────────┘
```

- **Auto-populated from business type** on sign-up
- **Overridable** — owner can change any label
- **These labels propagate across all UI** — every instance of "Member" becomes "Student" etc.

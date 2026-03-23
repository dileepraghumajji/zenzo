# Screen Specs — Communications (WhatsApp Hub)

**Owner-only module.** Manages WhatsApp messaging via Interakt API.

---

## Communications Hub

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ Communications                    [Send Message]     │
│                                                      │
│ [Templates] [History]                                │
│                                                      │
│ Quick Stats                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ Sent Today  │ │ This Month  │ │ Delivery %  │     │
│ │ 4           │ │ 47          │ │ 96%         │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                      │
│ (Tab content below)                                  │
└──────────────────────────────────────────────────────┘
```

---

## Templates Tab

```
┌──────────────────────────────────────────────────────┐
│ Message Templates                                    │
│                                                      │
│ "These templates are used for automatic messages.    │
│  Customize them in Settings → Notifications."        │
│                                                      │
│ ┌────────────────────────────────────────────────┐   │
│ │ 💰 Payment Reminder                    Active  │   │
│ │ "Hi {name}, your fee of {amount}..."           │   │
│ │ Trigger: 3 days before + on due date           │   │
│ │                                   [Preview]    │   │
│ ├────────────────────────────────────────────────┤   │
│ │ 🧾 Payment Receipt                    Active   │   │
│ │ "Hi {name}, we received your payment..."       │   │
│ │ Trigger: on payment recorded                   │   │
│ │                                   [Preview]    │   │
│ ├────────────────────────────────────────────────┤   │
│ │ 👋 Welcome Message                    Active   │   │
│ │ "Welcome to {business}, {name}!"               │   │
│ │ Trigger: on member added                       │   │
│ │                                   [Preview]    │   │
│ ├────────────────────────────────────────────────┤   │
│ │ 🎉 Belt Promotion                    Inactive  │   │
│ │ "Congratulations! {name} promoted to..."       │   │
│ │ Trigger: on promotion logged                   │   │
│ │                                   [Preview]    │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- **Read-only in Phase 1** — templates are pre-built
- Active/Inactive badge
- Preview expands to show full template with sample data

---

## History Tab

```
┌──────────────────────────────────────────────────────┐
│ [Date range ▾]  [Type ▾]  [Search...]                │
│                                                      │
│ Date         To              Type        Status      │
│ ──────────────────────────────────────────────────── │
│ 23 Mar 10:15  Arjun Kumar   Reminder    ✓ Delivered │
│ 23 Mar 10:15  Rahul Sharma  Reminder    ✓ Delivered │
│ 22 Mar 18:30  Priya Nair    Receipt     ✓ Delivered │
│ 22 Mar 09:00  Vikram Mehta  Welcome     ✗ Failed    │
│ ...                                                  │
│                                                      │
│ Showing 1–25 of 47                                   │
└──────────────────────────────────────────────────────┘
```

- **Status:** Delivered (green), Sent (yellow), Failed (red)
- **Click row:** Expand to see full message content
- **Failed messages:** Show reason, offer [Retry] button

---

## Send Message (Manual)

### Modal
```
┌──────────────────────────────────────┐
│ Send WhatsApp Message                │
│                                      │
│ To *                                 │
│ [Search members...          ▾]       │
│ or: [Select batch ▾] (all members)  │
│                                      │
│ Template *                           │
│ [Payment Reminder          ▾]       │
│                                      │
│ Preview:                             │
│ ┌──────────────────────────────────┐ │
│ │ Hi Arjun, your monthly fee of   │ │
│ │ ₹1,500 at Ravi's Fitness Hub    │ │
│ │ was due on 15 Mar...            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Sending to: 1 member                 │
│                                      │
│ [Cancel]                [Send]       │
└──────────────────────────────────────┘
```

- **Recipient:** Individual member or entire batch
- **Template selection** — shows preview with real data
- **Batch send:** Shows count "Sending to: 18 members"

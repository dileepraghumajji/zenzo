# Screen Specs — Member Portal

**Mobile web app** — accessed via WhatsApp link. No login. Token-gated URL.
**Route:** `/m/:token`

Design for: mid-range Android, 4G, direct sunlight. This is NOT an app — it's a clean mobile web page.

---

## Member Home

### Layout
```
┌──────────────────────────────┐
│ ← Ravi's Fitness Hub         │
│                              │
│ [Home] [Attendance] [Payments]│
│                              │
│ Hi Arjun! 👋                 │
│                              │
│ ┌──────────────────────────┐ │
│ │ Attendance this month     │ │
│ │                          │ │
│ │ ████████████████░░░ 85%  │ │
│ │ 17 of 20 classes          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Next fee due              │ │
│ │ ₹1,500                   │ │
│ │ 01 Apr 2026 · in 9 days  │ │
│ │                          │ │
│ │     [Pay Now →]           │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Last payment              │ │
│ │ ₹1,500 · 01 Mar 2026     │ │
│ │     [View Receipt]        │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Your batch: Morning       │ │
│ │ Mon–Fri · 6:00–7:30 AM   │ │
│ └──────────────────────────┘ │
│                              │
│ Belt: 🟡 Yellow              │ ← only if progression enabled
│ Since 15 Jan 2026            │
└──────────────────────────────┘
```

- **Three key numbers above the fold:** Attendance %, Next due date, Last payment
- **"Pay Now"** — prominent CTA, only shown if fee is due or upcoming (within 7 days)
- **No login needed** — URL contains auth token
- **Token expiry:** 30 days. New token sent with each WhatsApp message.
- **If token expired:** "This link has expired. Please ask your gym for a new link."

---

## Attendance Tab

```
┌──────────────────────────────┐
│ ← Ravi's Fitness Hub         │
│                              │
│ [Home] [Attendance] [Payments]│
│                              │
│ March 2026                   │
│ ┌──────────────────────────┐ │
│ │ Mo Tu We Th Fr Sa Su     │ │
│ │                    1  2  │ │
│ │ 🟢 🟢 🟢 🟢 🟢  ·  ·   │ │
│ │ 🟢 🟢 🔴 🟢 🟢  ·  ·   │ │
│ │ 🟢 🟢 🟢 🔴 🟢  ·  ·   │ │
│ │ 🟢 🟢  ·  ·  ·  ·  ·   │ │
│ └──────────────────────────┘ │
│                              │
│ This month: 17/20 (85%)      │
│ Last month: 18/22 (82%)      │
│                              │
│ Streak: 5 consecutive ✓      │
└──────────────────────────────┘
```

- **Calendar heatmap:** Green=present, Red=absent, Grey dot=no class, Empty=future
- **Monthly summary** below calendar
- **Streak counter** — gamification element, encourages consistency
- **Swipe left/right** to navigate months

---

## Payments Tab

```
┌──────────────────────────────┐
│ ← Ravi's Fitness Hub         │
│                              │
│ [Home] [Attendance] [Payments]│
│                              │
│ ┌──────────────────────────┐ │
│ │ Next Due                  │ │
│ │ ₹1,500 · 01 Apr 2026     │ │
│ │      [Pay Now →]          │ │
│ └──────────────────────────┘ │
│                              │
│ Payment History              │
│ ┌──────────────────────────┐ │
│ │ ₹1,500 · 01 Mar 2026    │ │
│ │ Monthly Plan · UPI       │ │
│ │         [View Receipt]    │ │
│ ├──────────────────────────┤ │
│ │ ₹1,500 · 01 Feb 2026    │ │
│ │ Monthly Plan · Cash      │ │
│ │         [View Receipt]    │ │
│ ├──────────────────────────┤ │
│ │ ...                      │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Payment Flow

```
[Pay Now] → Razorpay checkout overlay
         → Pre-filled: amount, name, phone
         → UPI / Cards / Net Banking
         → Success → Receipt screen

┌──────────────────────────────┐
│                              │
│      ✓ Payment Successful    │
│                              │
│      ₹1,500.00              │
│                              │
│ Ravi's Fitness Hub           │
│ Member: Arjun Kumar          │
│ Date: 23 Mar 2026            │
│ Plan: Monthly                │
│ Period: 01 Apr – 30 Apr 2026 │
│ Method: UPI                  │
│ Ref: TXN-20260323-001        │
│                              │
│ [Download PDF]  [Share]      │
│                              │
│ A receipt has been sent to   │
│ your WhatsApp.               │
│                              │
│ [← Back to Home]             │
└──────────────────────────────┘
```

---

## Error & Edge States

- **Token expired:** "This link has expired. Please contact your gym for a new link."
- **No fee due:** "You're all paid up! Your next fee will be due on [date]."
- **No attendance yet:** "No attendance recorded yet. Your classes start on [date]."
- **Payment failed:** "Payment couldn't be completed. Please try again or contact your gym."
- **Offline:** "You appear to be offline. Please check your connection and try again."

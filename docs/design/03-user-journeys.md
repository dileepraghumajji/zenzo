# User Journey Maps

## Journey 1 — Owner Onboarding

**Goal:** Sign up → see members on dashboard in under 5 minutes.
**Persona:** Ravi (gym owner, Hyderabad)

```
Step 1: SIGN UP
┌─────────────────────────────┐
│ Welcome to Zenzo            │
│                             │
│ [Name          ]            │
│ [Phone number  ]            │
│ [Email         ]            │
│ [Password      ]            │
│                             │
│ [Sign Up — primary btn]     │
│                             │
│ Already have an account?    │
│ Log in                      │
└─────────────────────────────┘
- Phone is primary identifier (Indian market)
- OTP verification on phone number
- Social login NOT in Phase 1 (adds complexity, low value for target market)

Step 2: BUSINESS TYPE
┌─────────────────────────────┐
│ What type of business       │
│ do you run?                 │
│                             │
│ [🏋️ Gym / Fitness     ]     │
│ [🥋 Martial Arts       ]     │
│ [💃 Dance Academy      ]     │
│ [📚 Tuition Centre     ]     │
│ [🧘 Yoga Studio        ]     │
│ [   Other...           ]     │
│                             │
│ ← Back          [Next →]    │
└─────────────────────────────┘
- Selection auto-configures terminology:
  gym→members, martial arts→students+belts, dance→students+levels
- "Other" shows free-text field
- This drives feature toggles (belt system on/off)

Step 3: STUDIO SETUP
┌─────────────────────────────┐
│ Set up your studio          │
│                             │
│ Business name               │
│ [Ravi's Fitness Hub    ]    │
│                             │
│ Your URL                    │
│ zenzo.app/ [ravis-fitness]  │
│ ✓ Available                 │
│                             │
│ City                        │
│ [Hyderabad          ▾]      │
│                             │
│ ← Back          [Next →]    │
└─────────────────────────────┘
- Slug auto-generated from name, editable
- Availability check in real-time
- City for timezone + locale defaults

Step 4: CREATE FIRST BATCH
┌─────────────────────────────┐
│ Create your first batch     │
│                             │
│ "A batch is a group of      │
│  members who train at the   │
│  same time."                │
│                             │
│ Batch name                  │
│ [Morning Batch         ]    │
│                             │
│ Timing                      │
│ [06:00 AM] to [07:30 AM]    │
│                             │
│ Days                        │
│ [M][T][W][T][F][S][S]       │
│  ●  ●  ●  ●  ●  ○  ○       │
│                             │
│ ← Back          [Next →]    │
│              Skip for now → │
└─────────────────────────────┘
- Pre-filled suggestion: "Morning Batch, 6:00–7:30 AM, Mon–Fri"
- Day selector: large tap targets, toggle on/off
- "Skip" always available — never block onboarding

Step 5: ADD FIRST MEMBERS
┌─────────────────────────────┐
│ Add your first members      │
│                             │
│ "Add a few members to see   │
│  your dashboard come alive" │
│                             │
│ ┌─ Quick add ────────────┐  │
│ │ Name  [           ]    │  │
│ │ Phone [           ]    │  │
│ │        [+ Add member]  │  │
│ └────────────────────────┘  │
│                             │
│ ✓ Arjun Kumar  9876543210  │
│ ✓ Priya Nair   9123456789  │
│                             │
│ Or: [Import from Excel/CSV] │
│                             │
│ ← Back    [Go to Dashboard]│
└─────────────────────────────┘
- Minimum fields: name + phone only
- Members appear in list immediately as added
- "Go to Dashboard" is the primary CTA — celebration moment
- Confetti or subtle animation on first member added

COMPLETION: → Dashboard with members visible
"Welcome to Zenzo! Here's your daily digest."
- First-time dashboard shows contextual tips (dismissible)
- Empty widgets show helpful empty states, not blank space
```

**Success metric:** 80%+ of users who start onboarding complete all 5 steps.
**Escape hatches:** Skip on steps 4 and 5. Can always add later.

---

## Journey 2 — Daily Coach Flow

**Goal:** Open app → mark attendance → done. Under 60 seconds.
**Persona:** Sensei Arjun (karate coach, Pune)

```
Step 1: OPEN APP → TODAY'S BATCHES (auto-landing)
┌──────────────────────────────┐
│ Good morning, Arjun 👋       │
│ Sunday, 23 Mar 2026          │
│                              │
│ TODAY'S BATCHES              │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🟢 Morning Batch         │ │
│ │ 6:00 – 7:30 AM           │ │
│ │ 18 members               │ │
│ │            [Take Attendance →] │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ ○ Evening Batch          │ │
│ │ 5:00 – 6:30 PM           │ │
│ │ 12 members               │ │
│ │            [Take Attendance →] │
│ └──────────────────────────┘ │
│                              │
│ ✓ Kids Batch — completed     │
└──────────────────────────────┘
- Current/next batch highlighted with green dot
- Completed batches greyed out with checkmark
- One-tap to start taking attendance

Step 2: TAKE ATTENDANCE (THE ritual screen)
┌──────────────────────────────┐
│ ← Morning Batch              │
│ 23 Mar 2026 · 6:00 AM        │
│ 4 of 18 marked               │
│ ████░░░░░░░░░░░░░░  22%      │
│                              │
│ ┌──────────────────────────┐ │
│ │ [AK] Arjun Kumar    [✓] │ │
│ │ [PN] Priya Nair     [✓] │ │
│ │ [RS] Rahul Sharma   [✗] │ │
│ │ [DG] Deepa Gupta    [✓] │ │
│ │ [VM] Vikram Mehta   [ ] │ │
│ │ [SA] Sneha Agarwal  [ ] │ │
│ │ [KP] Kiran Patel    [✓] │ │
│ │ ...                      │ │
│ └──────────────────────────┘ │
│                              │
│ [Mark remaining absent]      │
│ [Save & Done ✓]              │
└──────────────────────────────┘
- Each row: Avatar initials + Name + large toggle (Present ✓ / Absent ✗ / Unmarked)
- Toggle size: minimum 44x44px — coach has sweaty hands
- Tap → instant visual feedback (green check, red cross)
- Progress bar fills as members are marked
- "Mark remaining absent" — bulk action for efficiency
- List sorted alphabetically by default, recently absent shown first (optional)
- Search/filter bar at top (hidden until scroll up or tap)

Step 3: COMPLETION STATE
┌──────────────────────────────┐
│                              │
│         ✓                    │
│   Attendance saved!          │
│                              │
│   Morning Batch              │
│   15 present · 3 absent     │
│                              │
│   [Back to Batches]          │
│                              │
└──────────────────────────────┘
- Satisfying checkmark animation
- Summary: X present, Y absent
- Auto-returns to batch list after 2 seconds (or tap)
```

**Success metric:** Average time from open to done < 45 seconds for 20-member batch.
**Key design decisions:**
- No confirmation dialog — save is instant and reversible (edit within same day)
- No scrolling between toggle states — each row is a single tap target
- Works offline-first — sync when connected (Phase 2)

---

## Journey 3 — Fee Collection

**Goal:** Owner identifies overdue → sends WhatsApp → member pays → receipt auto-sent.
**Persona:** Ravi (gym owner)

```
Step 1: OVERDUE LIST (default Payments view)
┌──────────────────────────────┐
│ Payments           [+ Record]│
│                              │
│ [Overdue (6)] [History] [Plans]│
│                              │
│ 6 members have overdue fees  │
│ Total outstanding: ₹9,000    │
│                              │
│ ┌──────────────────────────┐ │
│ │ [AK] Arjun Kumar        │ │
│ │ ₹1,500 · Due 15 Mar     │ │
│ │ 8 days overdue           │ │
│ │ [Send Reminder] [Record] │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ [RS] Rahul Sharma        │ │
│ │ ₹2,000 · Due 10 Mar     │ │
│ │ 13 days overdue          │ │
│ │ [Send Reminder] [Record] │ │
│ └──────────────────────────┘ │
│ ...                          │
│                              │
│ [Send Reminders to All (6)]  │
└──────────────────────────────┘
- Sorted by most overdue first
- Each card: member name, amount, due date, days overdue
- Two actions per card: Send Reminder (WhatsApp), Record (manual payment)
- Bulk action: "Send Reminders to All"

Step 2: SEND PAYMENT LINK (via WhatsApp)
┌──────────────────────────────┐
│ Send reminder to             │
│ Arjun Kumar                  │
│                              │
│ Preview:                     │
│ ┌──────────────────────────┐ │
│ │ Hi Arjun, your monthly   │ │
│ │ fee of ₹1,500 at Ravi's  │ │
│ │ Fitness Hub was due on    │ │
│ │ 15 Mar. Pay securely      │ │
│ │ here: [payment link]      │ │
│ │                           │ │
│ │ Thank you! 🙏             │ │
│ └──────────────────────────┘ │
│                              │
│ [Cancel]     [Send WhatsApp] │
└──────────────────────────────┘
- Pre-composed, human-sounding message
- Owner can preview before sending
- Payment link embedded in message
- WhatsApp delivery via Interakt API

Step 3: MEMBER PAYS (Member Portal)
→ See Journey 4

Step 4: OWNER SEES CONFIRMATION
- Toast: "₹1,500 received from Arjun Kumar"
- Overdue list auto-updates (member removed)
- Payment appears in history
- Receipt auto-sent to member via WhatsApp
```

---

## Journey 4 — Member Self-Service

**Goal:** Member clicks WhatsApp link → sees their info → optionally pays.
**Persona:** Sneha (parent of dance student)

```
Step 1: TAP WHATSAPP LINK → MEMBER HOME
┌──────────────────────────────┐
│ ← Priya's Dance Academy     │
│                              │
│ [Home] [Attendance] [Payments]│
│                              │
│ Hi Ananya! 👋                │
│                              │
│ ┌──────────────────────────┐ │
│ │ Attendance this month     │ │
│ │ ████████████░░░  80%     │ │
│ │ 16 of 20 classes          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Next fee due              │ │
│ │ ₹2,500 · 01 Apr 2026     │ │
│ │ Due in 9 days             │ │
│ │         [Pay Now →]       │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Last payment              │ │
│ │ ₹2,500 · 01 Mar 2026     │ │
│ │        [View Receipt]     │ │
│ └──────────────────────────┘ │
│                              │
│ Current level: Grade 3       │
└──────────────────────────────┘
- No login required — token-gated URL from WhatsApp
- Token expires after 30 days, re-sent on next WhatsApp message
- Mobile-optimized — this IS the primary device
- Three key numbers visible without scrolling:
  1. Attendance %
  2. Next fee due date + amount
  3. Last payment

Step 2: PAY NOW (Razorpay)
- Tap "Pay Now" → Razorpay checkout overlay
- Pre-filled: amount, member name, phone
- UPI, cards, netbanking supported
- Success → receipt screen + WhatsApp receipt auto-sent

Step 3: RECEIPT
┌──────────────────────────────┐
│ ← Payment Receipt            │
│                              │
│ ✓ Payment Successful         │
│                              │
│ ₹2,500.00                   │
│                              │
│ Priya's Dance Academy        │
│ Member: Ananya               │
│ Date: 23 Mar 2026            │
│ Plan: Monthly – Bharatanatyam│
│ Period: 01 Apr – 30 Apr 2026 │
│ Method: UPI                  │
│ Ref: TXN-20260323-001        │
│                              │
│ [Download PDF] [Share]       │
└──────────────────────────────┘
```

---

## Journey 5 — Belt / Level Promotion

**Goal:** Coach promotes a student → student gets congratulations via WhatsApp.
**Persona:** Sensei Arjun + student's parent

```
Step 1: OPEN MEMBER PROFILE → PROGRESSION TAB
┌──────────────────────────────┐
│ ← Rahul Sharma               │
│                              │
│ [Overview][Attendance][Payments][Progression]│
│                              │
│ Current Belt: 🟡 Yellow       │
│ Since: 15 Jan 2026           │
│                              │
│ Progression History           │
│ 🟡 Yellow    15 Jan 2026     │
│ ⚪ White     01 Jun 2025     │
│                              │
│ [Promote to Next Belt →]     │
└──────────────────────────────┘

Step 2: LOG PROMOTION
┌──────────────────────────────┐
│ Promote Rahul Sharma         │
│                              │
│ Current: 🟡 Yellow Belt       │
│                              │
│ Promote to                   │
│ [🟠 Orange Belt        ▾]    │
│                              │
│ Date                         │
│ [23 Mar 2026           ]     │
│                              │
│ Notes (optional)             │
│ [Excellent kata performance] │
│                              │
│ ☑ Send congratulations       │
│   via WhatsApp               │
│                              │
│ [Cancel]      [Confirm]      │
└──────────────────────────────┘
- Next belt pre-selected (opinionated default)
- Date pre-filled to today
- WhatsApp toggle on by default

Step 3: WhatsApp sent:
"Congratulations! 🎉 Rahul has been promoted
to Orange Belt at [Dojo Name]. Keep up the
great work! — Sensei Arjun"

Step 4: Progression history updated on member profile + member portal.
```

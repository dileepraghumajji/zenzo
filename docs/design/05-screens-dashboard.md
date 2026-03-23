# Screen Specs — Dashboard

## Owner Dashboard (Daily Digest)

### Design Intent
This is NOT a traditional dashboard with charts. It's a **morning newspaper** — scannable in 10 seconds, actionable in one tap. The owner opens this with their morning chai and knows exactly what needs attention today.

### Layout
```
Desktop:
┌──────────────────────────────────────────────────────┐
│ [Sidebar]  Good morning, Ravi 👋                     │
│            23 Mar 2026, Sunday                       │
│                                                      │
│            ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│            │ Revenue  │ │ Active  │ │ Attend. │      │
│            │ ₹1.2L   │ │ 118     │ │ 76%     │      │
│            │ this mo  │ │ members │ │ avg     │      │
│            │ ↑12%     │ │ +3 new  │ │ ↓2%     │      │
│            └─────────┘ └─────────┘ └─────────┘      │
│                                                      │
│  ┌─── Needs Attention ─────────────────────────────┐ │
│  │ 🔴 6 members have overdue fees     [View →]     │ │
│  │ 🟡 3 members absent 5+ days        [View →]     │ │
│  │ 🟡 4 memberships expiring this week [View →]    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─── Quick Actions ──────────────────────────────┐  │
│  │ [+ Add Member] [Take Attendance] [Record Pay]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── Recent Activity ────────────────────────────┐  │
│  │ ₹1,500 received from Arjun Kumar    2 hrs ago  │  │
│  │ Priya Nair marked present           3 hrs ago  │  │
│  │ New member: Vikram Mehta            yesterday   │  │
│  │ ...                                             │  │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────┐
│ Good morning, Ravi 👋│
│ 23 Mar 2026          │
│                      │
│ ┌──────┐ ┌──────┐   │ ← 2-col stat cards, scrollable
│ │₹1.2L │ │ 118  │   │
│ │rev.  │ │membrs│   │
│ └──────┘ └──────┘   │
│ ┌──────┐ ┌──────┐   │
│ │ 76%  │ │  6   │   │
│ │attend│ │overdue│  │
│ └──────┘ └──────┘   │
│                      │
│ Needs Attention      │
│ [overdue card]       │
│ [absent card]        │
│ [expiring card]      │
│                      │
│ Quick Actions        │
│ [horizontal scroll]  │
│                      │
│ Recent Activity      │
│ [feed items...]      │
│                      │
│ [Bottom Nav]         │
└──────────────────────┘
```

### Component Breakdown

**Stat Cards (3 on desktop, 2x2 grid on mobile)**
- Revenue this month: ₹ amount (mono), % change vs last month, trend arrow
- Active members: count, new this month
- Avg attendance: %, change vs last month
- (Mobile 4th card): Overdue count as a stat

**Needs Attention Block**
- 3 alert items max, sorted by urgency (red → yellow)
- Each: icon + count + description + "View →" link
- Types:
  - Overdue fees (red) → links to /payments/overdue
  - Absent 5+ days (yellow) → links to filtered members list
  - Expiring memberships (yellow) → links to filtered members list
- If no alerts: "All clear! Nothing needs your attention today." (success-50 bg)

**Quick Actions Bar**
- 3 buttons: Add Member, Take Attendance, Record Payment
- Desktop: inline row. Mobile: horizontal scroll
- Secondary button style

**Recent Activity Feed**
- Chronological, most recent first
- Types: payment received, attendance marked, new member, membership renewed
- Max 10 items, "View all" link at bottom
- Each: icon + description + relative timestamp

### States
- **Loading:** Shimmer skeletons matching each card shape. Stat cards load first (fastest query).
- **Empty (new account):**
  - Stats show ₹0, 0, 0%
  - Needs Attention: "Add your first members to see insights here"
  - Quick Actions prominent
  - Activity feed: "Your activity will show up here"
- **Error:** "Couldn't load dashboard. [Retry]" — inline error banner

---

## Coach Dashboard

### Design Intent
Coach doesn't need a digest. Coach needs: "What batches do I have today?" — and nothing else.

### Layout
```
┌──────────────────────────────┐
│ Good morning, Arjun 👋       │
│ 23 Mar 2026, Sunday          │
│                              │
│ TODAY'S BATCHES              │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🟢 Morning Batch         │ │
│ │ 6:00 – 7:30 AM · 18 ppl │ │
│ │      [Take Attendance →] │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ ○ Evening Batch          │ │
│ │ 5:00 – 6:30 PM · 12 ppl │ │
│ │      [Take Attendance →] │ │
│ └──────────────────────────┘ │
│                              │
│ No more batches today.       │
└──────────────────────────────┘
```

- Only shows batches assigned to this coach
- Current/upcoming: green dot. Future: hollow dot. Done: grey checkmark.
- Each card: batch name, time, member count, CTA
- **Empty:** "You have no batches scheduled for today. Enjoy your rest!"
- **No batches assigned:** "You haven't been assigned to any batches yet. Ask your admin to set you up."
- Desktop and mobile: identical layout (it's already simple enough)

# Zenzo

Membership management for recurring-attendance businesses — gyms, yoga studios, martial arts academies, dance schools, and more.

**Strategy:** Build horizontal, sell vertical — launching with gyms as the beachhead vertical.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 14 (App Router) |
| Database & Auth | Supabase (Postgres + RLS) |
| Payments | Razorpay |
| WhatsApp Notifications | Interakt |
| Hosting | Vercel |

---

## Repository Structure

```
zenzo/
├── apps/
│   └── web/                        # Next.js 14 application
├── packages/
│   ├── database/                   # Supabase client + DB types
│   ├── ui/                         # Shared React components
│   ├── utils/                      # Formatters, helpers
│   └── config/                     # Shared tsconfig + eslint
├── .env.example                    # Required environment variables
├── turbo.json
└── CLAUDE.md                       # Full project context for AI agents
```

---

## Phase 1 Modules

| Module | Description |
|---|---|
| Auth | Multi-tenant login via Supabase (email + OTP) |
| Dashboard | KPIs — active members, revenue, attendance rate |
| Members | Add, edit, view members and membership status |
| Plans | Dynamic pricing plans (duration + price) |
| Attendance | Mark and view daily attendance per member |
| Payments | Collect fees via Razorpay, track dues and history |
| Staff | Invite staff, assign roles, manage access |
| Communications | WhatsApp notifications via Interakt (renewal reminders, etc.) |
| Reports | Revenue, attendance, and churn reports with date filters |

---

## User Roles

| Role | Access |
|---|---|
| `owner` | Full access — all modules + settings |
| `staff` | Members, attendance, payments. No settings or staff management. |
| `member` | Own profile, payment history, attendance |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase, Razorpay, and Interakt keys

# Start development server
pnpm dev
```

The app runs at `http://localhost:3000`.

---

## Multi-Tenant Architecture

Each business gets a slug-scoped workspace. All routes live under `/:tenantSlug/*` — e.g. `/iron-forge-gym/members`. Every database table carries a `tenant_id` foreign key, and Supabase RLS policies ensure complete data isolation between tenants.

---

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay credentials
- `INTERAKT_API_KEY` — Interakt API key for WhatsApp

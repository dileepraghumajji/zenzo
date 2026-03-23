# Screen Specs — Authentication & Onboarding

## Common Auth Layout
- Centered card (max 420px) on neutral-50 background
- Zenzo logo top-center
- No sidebar, no nav — clean focus

---

## Landing / Marketing Homepage

### Layout
```
Desktop:                              Mobile:
┌────────────────────────────────┐    ┌──────────────────┐
│ [Logo]              [Login]    │    │ [Logo]  [Login]  │
│                                │    │                  │
│  Headline (display)            │    │ Headline (h1)    │
│  Subline (body, neutral-500)   │    │ Subline          │
│                                │    │                  │
│  [Get Started Free — primary]  │    │ [Get Started]    │
│                                │    │                  │
│  [Screenshot/illustration]     │    │ [Screenshot]     │
│                                │    │                  │
│  Feature grid (3 columns)      │    │ Feature stack    │
│  Testimonials                  │    │ Testimonials     │
│  Pricing                       │    │ Pricing          │
│  Footer                        │    │ Footer           │
└────────────────────────────────┘    └──────────────────┘
```

- **Primary action:** "Get Started Free" → /login?tab=signup
- **Secondary:** "Login" in top nav
- Feature grid: 3 cols desktop, 1 col mobile
- Headline speaks to pain: "Stop chasing fees. Start growing your gym."

---

## Sign Up — Step 1 (Credentials)

### Layout
```
┌────────────────────────────────┐
│        [Zenzo Logo]            │
│                                │
│    Create your account         │
│                                │
│    Full Name                   │
│    [                    ]      │
│                                │
│    Phone Number                │
│    [+91] [                ]    │
│                                │
│    Email                       │
│    [                    ]      │
│                                │
│    Password                    │
│    [                 ] [👁]    │
│    At least 8 characters       │
│                                │
│    [Create Account — primary]  │
│                                │
│    Already have an account?    │
│    Log in                      │
└────────────────────────────────┘
```

- **Primary action:** Create Account
- **Fields:** Name, Phone (+91 prefix default), Email, Password
- **Validation:** Inline, on blur. Error text below field in error-500
- **Phone:** OTP verification after submit (modal with 6-digit input)
- **Empty state:** N/A
- **Error state:** "Phone already registered" — link to login. Network error — retry button
- **Loading:** Button shows spinner, disabled during submit
- **Mobile:** Same layout, full-width card, no horizontal padding on outer container

---

## Sign Up — Step 2 (Business Details)

→ Steps 2–5 are the onboarding wizard. See Onboarding Wizard below.

---

## Login

### Layout
```
┌────────────────────────────────┐
│        [Zenzo Logo]            │
│                                │
│    Welcome back                │
│                                │
│    Phone or Email              │
│    [                    ]      │
│                                │
│    Password                    │
│    [                 ] [👁]    │
│                                │
│    [Log In — primary]          │
│                                │
│    Forgot password?            │
│                                │
│    Don't have an account?      │
│    Sign up                     │
└────────────────────────────────┘
```

- **Primary action:** Log In
- **Login with:** Phone or email (single field, auto-detect format)
- **Error:** "Invalid credentials" — generic message (security). Toast, not inline.
- **Loading:** Button spinner
- **Mobile:** Same layout

---

## Forgot Password

### Layout
```
┌────────────────────────────────┐
│        [Zenzo Logo]            │
│                                │
│    Reset your password         │
│    Enter your email and we'll  │
│    send you a reset link.      │
│                                │
│    Email                       │
│    [                    ]      │
│                                │
│    [Send Reset Link — primary] │
│                                │
│    ← Back to login             │
└────────────────────────────────┘
```

- **Success state:** "Check your email. We've sent a reset link to r***@email.com"
- **Error:** "No account found" or network error

---

## Onboarding Wizard

### Chrome
```
┌────────────────────────────────┐
│ Step 2 of 5  ●●○○○            │
│                                │
│ [Content area]                 │
│                                │
│ ← Back              [Next →]  │
│                   Skip for now │
└────────────────────────────────┘
```
- Progress dots at top (not a stepper — less intimidating)
- Back always available. Skip available on steps 4 & 5.
- Steps:
  1. Credentials (already done — sign up form)
  2. Business type selection (card grid)
  3. Studio setup (name, slug, city)
  4. Create first batch (skippable)
  5. Add first members (skippable)
- On completion → redirect to `/:tenantSlug/dashboard`

### Empty states during onboarding
- Step 4 (batch): "A batch is a group of members who train at the same time."
- Step 5 (members): "Add a few members to see your dashboard come alive."

### Mobile differences
- Full-screen wizard, no card container
- Progress dots smaller
- Buttons full-width at bottom with safe-area padding

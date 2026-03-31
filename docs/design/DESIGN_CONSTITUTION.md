# Zenzo Design Constitution

> Read this before building any component, page, or flow.
> This is not a style guide. It is a point of view.
> The design movement is **Form**. Read `DESIGN_MANIFESTO_V2.md` first.

---

## The Core Idea

**"Form"** — the interface disappears. The user's task remains.

The palette and its tension still hold:

- **Stone** — the foundation. Calm, warm, structural. The stone is always present. It never shouts.
- **Forge** — the action. Energy, heat, transformation. The forge fires only when you need to act.

A gym embodies this duality. Discipline is quiet. The workout is fire. The app should feel the same way.

**In practice:**
- Stone-50 backgrounds. Warm off-white, not cold white. The stone palette has amber undertones — warmth without orange.
- Forge-orange on ONE element per screen: the primary action button. One. Not two. Not a panel.
- The rest of the screen breathes.

---

## What We Learned From the Industry

We studied Vercel, Linear, Notion, Stripe, Superhuman, Raycast, Arc, Cal.com, Resend, Clerk, CRED, Zerodha, Razorpay, Framer, and others. The pattern across every premium product is the same and nobody says it directly:

> **Brand color almost never appears at full saturation on backgrounds.**
> It appears on the one element the user needs to interact with next.

- Vercel's black button on white page.
- Linear's purple on a near-black background — used for one CTA.
- CRED's minimal UI — exclusivity through restraint, not decoration.
- Zerodha's blue — appears on the login button, nowhere else on the page.
- Cal.com — grayscale everything, brand color on the CTA only.

**The result:** When the brand color appears, it has gravity. The eye goes there immediately. Nothing competes.

**What we must NOT do:** Pour the brand color on a large background. It reads as: *"We're trying to impress you."* Premium design says: *"We didn't need to."*

---

## The Color Rules

### Orange is a Verb, Not a Noun

Orange marks **action**. It does not mark **space**.

```
✅ Orange IS allowed on:
   — Primary buttons (one per screen)
   — The wordmark/logo
   — Active nav indicators (3px pill, not full background)
   — Focus rings (forge-500, not 600)
   — Progress bars, loading indicators
   — Key metric numbers on the dashboard

❌ Orange is NEVER allowed on:
   — Page backgrounds
   — Card backgrounds
   — Section backgrounds
   — Any area larger than a button
   — Decorative elements
   — Secondary buttons
   — Text (except the wordmark and rare brand moments)
```

### The Warmth Comes From Stone

The stone palette has warm amber undertones. This is intentional and sufficient.

- Stone-50 (#FAF9F7) as page backgrounds — already warm, no orange needed
- Stone-200 (#E9E7E3) for borders — warm gray, not cold blue-gray
- Stone-700 (#3C3935) for body text — warm dark, not pure black
- Stone-800 (#252320) for headings — rich, not harsh

The warmth is already there. You do not need orange to make the page feel warm.

### The Atmospheric Touch

On auth pages and landing pages only, a very subtle atmospheric element is allowed:

```
A soft radial gradient at 6-8% opacity using forge-50 (#FFF6EC)
positioned in one corner (top-right on desktop, hidden on mobile).

This is: the warmth of the forge felt through stone, not seen directly.
This is NOT: a background color, a decorative panel, or a brand statement.

If you can immediately notice the gradient, it is too strong. Turn it down.
```

---

## Dark Mode — "Midnight Forge"

Dark mode is not inverted light mode. It is the same stone palette at night: warmer, quieter, with the forge glowing more vividly in the darkness.

Implementation: `next-themes` with `attribute="class"`, `defaultTheme="system"`. The OS decides. A user toggle lives in Settings (Phase 2). The token system handles the switch automatically — no `dark:` Tailwind classes in components.

### The Dark Palette

```
Background:   #141210  — midnight stone. Warm, not cold. Has amber undertones.
Surface:      #242118  — cards. Clearly above page, not floating.
Subtle:       #1A1815  — sidebars, table headers. Between page and card.
Brand tint:   #2A1A08  — forge-tinted dark area (nav active state bg).

Border:       #2E2A25  — barely visible. Warm dark, not gray.
Border strong:#3D3932  — when definition is needed (cards, inputs).
Focus ring:   #EF6014  — forge-500. Unchanged. Still vivid in darkness.

Text:         #EDE8E2  — headings. Warm off-white, not pure white.
Body text:    #B5B0A8  — warm light gray. Not cold.
Muted:        #726D67  — captions. Warm mid-gray.
Brand text:   #F88030  — forge-400 (not forge-600). More vivid on dark bg.
```

### Why These Values, Not Just #0D1117 (GitHub) or #1C1C1E (Apple)?

- GitHub's dark is cool blue-gray. Zenzo's warm amber undertones would clash.
- Apple's dark is neutral gray. Correct but characterless.
- Zenzo's dark carries the same warmth as the stone palette — just at a different luminance.

The hex `#141210` looks like charcoal. It has an amber shift you don't consciously notice but would miss if gone.

### Orange in Dark Mode

Forge orange becomes MORE powerful in dark mode. On a dark stone background:
- `forge-600` (#C84A08) on `#242118` = contrast ratio ~4.8:1 ✓ (WCAG AA for large text)
- The button looks like an ember. It commands attention without needing to compete.

**The hover state flips:** In light mode, hover darkens (forge-700). In dark mode, hover brightens (forge-500) — because darkening an already-dark button makes it disappear. Brightening creates a "glow" effect that matches the forge metaphor.

### The Atmospheric Glow in Dark Mode

```
Light: radial-gradient(circle, rgba(255, 246, 236, 0.08) 0%, transparent 65%)
       → forge-50 warmth felt through stone. Very subtle.

Dark:  radial-gradient(circle, rgba(200, 74, 8, 0.12) 0%, transparent 65%)
       → forge-600 ember glow in the corner. Like fire seen through stone.
```

Both set via `--auth-glow` CSS variable. Components reference the variable, never the color directly.

### What Does NOT Change in Dark Mode

- The forge orange still appears on exactly ONE element per screen.
- All spacing, typography, and layout rules are identical.
- The atmospheric glow stays in the same corner.
- Status colors (success/error/warning/info) use darker tinted backgrounds with vivid text — the same principle as light mode, adapted for dark backgrounds.

---

## Typography Rules

### Hierarchy IS the Design

On minimal pages (auth, empty states, onboarding), typography carries the entire design.
Color is not the hierarchy. Type weight, size, and spacing are.

```
Page title (auth pages):  28-32px / 700 weight / stone-800
Subheading:               14px / 400 weight / stone-500 — muted, recedes
Form labels:              12px / 500 weight / stone-500 / UPPERCASE / tracking-[0.05em]
Input text:               14px / 400 weight / stone-700
Placeholder:              14px / 400 weight / stone-400
Helper text:              12px / 400 weight / stone-500
Error text:               12px / 400 weight / flame-700
Link text:                14px / 500 weight / forge-600 — the only colored text
```

### The Confident Heading Pattern

Every page should have exactly one dominant heading. It should be:
- Bold enough to anchor the page
- Short enough to scan in under 1 second
- Written for a human, not a product manager

```
✅ "Welcome back"           — human, direct
✅ "Create your account"    — clear, simple
✅ "Reset your password"    — practical, no fluff

❌ "Sign In to Your Zenzo Account"  — corporate, redundant
❌ "Access Your Dashboard"          — robotic
❌ "Get Started with Zenzo Today"   — marketing copy on a form
```

---

## Spacing Rules

4px base unit. All spacing is multiples of 4.

### Auth Page Spacing
```
Page padding (mobile):  24px (6 units)
Page padding (desktop): 48px (12 units)
Card padding:           32px (8 units)
Between form fields:    20px (5 units)
Between label + input:  6px  (1.5 units)
Below input + error:    6px  (1.5 units)
Below form + CTA:       20px (5 units)
Below CTA + links:      24px (6 units)
```

### The Breathing Room Test
Every component must have visible breathing room around it.
If elements feel cramped, the answer is always more space, never smaller type.

---

## Auth Page Philosophy

Auth pages are the first thing a user sees. They set the tone for the entire product.

### What an auth page must communicate in 3 seconds:
1. **This is Zenzo** — brand is clear, not shouted
2. **This is what I do here** — heading is immediately clear
3. **This is how I do it** — the primary action is obvious

### The Centered Layout Rule

Auth pages use centered layouts. No split panels.

Split-panel layouts (colored left, form right) were the dominant SaaS pattern in 2021-2022. They now signal: *"We used a template."* More importantly, they put marketing content next to functional content — they compete for attention when the user wants to focus on the form.

**The form IS the page.** Everything else recedes.

```
✅ Correct auth page layout:
   — Stone-50 background
   — Atmospheric forge glow, corner, 6-8% opacity
   — Centered white card (max-w-[420px] mobile, max-w-[440px] desktop)
   — Thin border (stone-200), no shadow — flat precision, not floating
   — Forge-600 wordmark small, centered above card
   — h1 inside card (confident, bold)
   — Muted subheading (stone-500, 14px)
   — Form fields with generous spacing
   — Full-width forge-600 primary button
   — Muted footer links

❌ What we had (and will not go back to):
   — Giant forge-600 left panel
   — Split layout
   — White text on orange background
   — Social proof / testimonials on an auth page (distracts from task)
```

### Error States

Errors on auth pages are always inline banners, never toasts (user needs to see the error while the form is still on screen).

Error banner: flame-50 background, flame-700 text, AlertCircle icon, thin flame-500 border.
Generic message only — never reveal "email not found" or "wrong password" (security).

---

## Component Design Principles

### Every Component Answers These Questions:

1. **What is the user's job?** Design for that job. Cut everything else.
2. **What is the one visual signal this component sends?** It should only send one.
3. **Does it work on a mid-range Android phone at arm's length?** Min 44px touch targets.
4. **Does the forge-orange appear on this component?** Only if it is the primary action.

### Button Hierarchy

Only one primary (forge-600) button per screen.
If you have two primary buttons, you have zero primary buttons.

```
Primary   — forge-600 bg, white text    — ONE per screen
Secondary — white bg, stone-700 text, stone-200 border
Ghost     — transparent, stone-600 text
Danger    — flame-600 bg, white text
```

### Input Fields

Inputs are never just boxes. They communicate state:

```
Default:  stone-200 border
Hover:    stone-300 border  (subtle acknowledgment)
Focus:    forge-500 ring, stone-300 border  (the forge warms up)
Error:    flame-500 border, flame-500 ring
Disabled: stone-100 bg, stone-400 text
```

The focus ring uses forge-500 (lighter than the button's forge-600) — it glows, it doesn't burn.

### Cards

Auth cards and content cards:
- White background
- Stone-200 border (1px)
- Border-radius: 12px (rounded-xl)
- No shadow on auth pages — flat precision
- Subtle shadow (shadow-sm) on dashboard cards — just enough lift

---

## What Premium Feels Like — The Tests

Before shipping any screen, pass all three:

### 1. The Ravi Test
Ravi runs a martial arts academy in Nagpur. He has a mid-range Android, uses WhatsApp constantly, and has never paid for B2B software before. Can he complete this task without asking anyone?

### 2. The Arjun Test
Arjun is a boxing coach. He's standing ringside with sweaty hands and his phone at arm's length. Can he mark attendance for 20 students in under 60 seconds?

### 3. The Design Peer Test
Would a designer at Linear, Vercel, or Razorpay nod at this — or cringe? They won't cringe at simplicity. They will cringe at: decorative orange panels, cluttered forms, 8 competing colors, rounded everything, and copy that sounds like a pitch deck.

---

## Anti-Patterns — Never Do These

These are patterns that look reasonable but are wrong for Zenzo:

| Anti-pattern | Why it fails |
|---|---|
| Orange background panels | Orange is a verb. It marks action. Using it as a background dilutes the action signal and overwhelms the warmth. |
| Split-panel auth layout | It's a 2021 SaaS template. It competes with the form. Users want to sign in, not be marketed to. |
| Multiple orange elements per screen | Kills the gravity of the CTA. If everything is orange, nothing is urgent. |
| Pure white (#FFFFFF) backgrounds | Cold. Our stone-50 (#FAF9F7) has a warm amber undertone that matches the forge brand. Use it. |
| Heavy card shadows | Makes cards feel like floating popups. We want grounded, not floating. |
| Long copy on auth pages | Auth is a task. State one thing (what the page does), then get out of the way. |
| Spinner loading states | Skeletons only. Spinners feel 2015. Skeletons feel considered. |
| Colored section headers | Headers are text. Stone-800, bold. If you need color to communicate hierarchy, your spacing is wrong. |
| Decoration for decoration's sake | No background illustrations, no icon-heavy UI, no gradient overlays. Every visual element earns its place or it doesn't exist. |
| Cold dark backgrounds (#0D1117, #1C1C1E) | Zenzo dark mode uses warm charcoal (#141210). Cold dark clashes with the amber undertones in the stone + forge palette. |
| `dark:` Tailwind classes in components | All dark mode is handled by CSS variable overrides in `.dark {}`. Components reference semantic tokens only — never primitives. |

---

## Brand Voice in UI Copy

Copy is part of the design. Zenzo speaks like a knowledgeable friend who respects your time.

```
Headings: Confident, direct. One idea. No brand name in headings.
Buttons:  Verbs. "Sign in" not "Login". "Create account" not "Get Started".
Errors:   Practical, not clinical. "Invalid email or password" not "Authentication failed".
Empty:    Helpful, not apologetic. "No members yet — add your first one" not "No data found".
Success:  Warm but brief. "Done" or "Saved" — not "Great! Your changes have been saved successfully!"
```

---

## Design Inspiration Reference

We do not copy these. We understand what they got right and why.

| Product | What they got right |
|---|---|
| Linear | Restraint. Brand color used in one place. The dark palette feels intentional, not default. |
| Vercel | Precision. Every border, every shadow, every spacing value is exact. Nothing is arbitrary. |
| Notion | Reduction. When you remove everything unnecessary, what's left has clarity. |
| Stripe | Distinctiveness. Their auth page background is ART. It doesn't follow any template. |
| Cal.com | Conviction. Monochromatic palette. They committed and it works. |
| CRED | Premium through restraint. Dark Indian fintech done right. Exclusivity through less, not more. |
| Zerodha | Trust through clarity. Professional without being corporate. Indian without being loud. |
| Superhuman | Emotional design. How it makes you feel matters as much as what it does. |
| Raycast | Power user tool. Dense information, clean UI. Not a contradiction. |

---

## The One Rule

> If you find yourself adding an orange element and you can't answer "this is the primary action the user takes next" — remove it.

---

*Last updated: Session 6 — 2026-03-24*
*Read before: building any auth page, any dashboard component, any empty state, any modal.*

# Lessons Learned

Mistakes caught during development. Read this before writing any component.

---

## 1. Primitive tokens in components — caught in Session 4

### What happened
First 4 components (Button, Badge, IconButton, Avatar) were written using primitive
Tailwind color tokens directly:

```tsx
// ❌ WRONG — primitive tokens in a component
"bg-forge-600 text-white hover:bg-forge-700"
"bg-jade-50 text-jade-700"
"bg-stone-100 text-stone-700"
```

### Why it's wrong
If the primary color changes from `#C84A08` to anything else:
- You update one CSS variable in `globals.css`
- But nothing in components changes — they still reference `forge-600` directly
- You must grep every component file and manually update each one
- This defeats the entire purpose of a two-tier token system

### The rule
**Components consume semantic tokens only. Never primitive tokens.**

```tsx
// ✅ CORRECT — semantic tokens in a component
"bg-primary text-primary-foreground hover:bg-primary-hover"
"bg-success text-success-foreground"
"bg-surface-subtle text-foreground"
```

### How the system works
```
globals.css (CSS variables)          tailwind.config.ts (semantic aliases)
────────────────────────────         ──────────────────────────────────────
--action-primary-bg: #C84A08;   →    primary.DEFAULT: "var(--action-primary-bg)"
--action-primary-bg-hover: ...  →    primary.hover:   "var(--action-primary-bg-hover)"
--text-secondary: #3C3935;      →    foreground:      "var(--text-secondary)"
```

Changing the brand color = update **one CSS variable**. Every button, link, and active
nav item updates automatically. Zero component edits required.

### Semantic token reference

| Tailwind class           | Maps to CSS variable            | Use for                        |
|---|---|---|
| `bg-background`          | `--surface-page`                | page backgrounds               |
| `bg-surface-subtle`      | `--surface-subtle`              | table headers, hover states    |
| `bg-primary`             | `--action-primary-bg`           | primary button backgrounds     |
| `bg-primary-hover`       | `--action-primary-bg-hover`     | primary button hover           |
| `bg-primary-subtle`      | `--surface-brand`               | soft orange tint areas         |
| `text-primary-foreground`| `--action-primary-text`         | text on primary buttons        |
| `bg-destructive`         | `--action-danger-bg`            | danger button backgrounds      |
| `bg-destructive-hover`   | `--action-danger-bg-hover`      | danger button hover            |
| `text-destructive-foreground` | `--action-primary-text`    | text on danger buttons         |
| `text-foreground`        | `--text-secondary`              | default body text              |
| `text-heading`           | `--text-primary`                | h1, h2, h3 text                |
| `text-muted`             | `--text-tertiary`               | captions, timestamps           |
| `text-brand`             | `--text-brand`                  | orange text on white           |
| `text-inverse`           | `--text-inverse`                | text on dark/coloured bg       |
| `border-border`          | `--border-default`              | card borders, input borders    |
| `ring-ring`              | `--border-focus`                | focus rings                    |
| `bg-success`             | `--status-success-bg`           | success badge background       |
| `text-success-foreground`| `--status-success-text`         | success badge text             |
| `bg-success-accent`      | `--status-success-border`       | success icon / toast border    |
| `bg-warning`             | `--status-warning-bg`           | warning badge background       |
| `text-warning-foreground`| `--status-warning-text`         | warning badge text             |
| `bg-error`               | `--status-error-bg`             | error badge background         |
| `text-error-foreground`  | `--status-error-text`           | error badge text               |
| `bg-info`                | `--status-info-bg`              | info badge background          |
| `text-info-foreground`   | `--status-info-text`            | info badge text                |

### Allowed exceptions
Primitive tokens (`forge-*`, `stone-*`, etc.) are only allowed in:
1. `globals.css` — to define the CSS variables
2. `tailwind.config.ts` — the palette definition itself
3. Avatar initials palette — purely decorative, not functional UI colour decisions

---

## 2. Missing tsconfig.json in packages/ui — caught in Session 4

### What happened
`packages/ui` had no `tsconfig.json`. TypeScript fell back to defaults, which have no
`"jsx"` setting. Every `.tsx` file in `packages/ui` showed:
```
Cannot use JSX unless the '--jsx' flag is provided.ts(17004)
```

### The rule
Every package that contains TypeScript must have its own `tsconfig.json` that extends
the shared config from `packages/config`.

```json
{
  "extends": "../config/tsconfig/nextjs.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 3. noUncheckedIndexedAccess breaks naive array access — caught in Session 4

### What happened
`base.json` has `"noUncheckedIndexedAccess": true`. Any array index access returns
`T | undefined`, not `T`. This code failed:

```tsx
// ❌ parts[0][0]! — TypeScript errors before the ! is even evaluated
return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
```

### The rule
Always extract array elements to named variables before chaining operations.
Use `?? fallback` for safe defaults.

```tsx
// ✅ correct
const first = parts[0] ?? "";
const last  = parts[parts.length - 1] ?? "";
return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
```

---

## 4. Workspace tsconfig path must be relative, not package name — caught in Session 4

### What happened
`apps/web/tsconfig.json` used `"extends": "@zenzo/config/tsconfig/nextjs.json"`.
TypeScript couldn't resolve the package name despite the symlink existing in
`node_modules/@zenzo/config/`. This is a known pnpm + Windows path resolution issue.

### The rule
Use relative paths for workspace tsconfig extends:

```json
// ✅
{ "extends": "../../packages/config/tsconfig/nextjs.json" }

// ❌
{ "extends": "@zenzo/config/tsconfig/nextjs.json" }
```

## Summary

<!-- What does this PR do? 1–3 bullet points -->

-

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code restructure, no behaviour change
- [ ] `chore` — build, CI, dependencies, tooling
- [ ] `docs` — documentation only

## Related issue

Closes #

## Test plan

- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero warnings
- [ ] Tested locally (mobile + desktop)

## Zenzo checklist

- [ ] No `any` or `as unknown as` casts introduced
- [ ] All Supabase queries use explicit column selects (no `select("*")`)
- [ ] No hard-coded enum strings — imported from `@zenzo/database/enums`
- [ ] Monetary amounts use `formatCurrency()` — never `` ₹${amount} ``
- [ ] Loading states use skeleton shimmer, not spinners
- [ ] Server Components are default; `"use client"` only where strictly needed

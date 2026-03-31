# Branch Strategy

Zenzo follows a **two-tier branching model** — stable `main` + integration `develop` — with short-lived feature branches.

## Branch Hierarchy

```
main          ← production-ready, always deployable
  └── develop ← integration branch, deployed to staging
        ├── feat/<ticket>-short-description
        ├── fix/<ticket>-short-description
        └── chore/<short-description>
```

## Branch Types

| Prefix | Branch from | Merges into | Purpose |
|--------|------------|-------------|---------|
| `feat/` | `develop` | `develop` | New features |
| `fix/` | `develop` | `develop` | Non-critical bug fixes |
| `hotfix/` | `main` | `main` + `develop` | Critical production bug |
| `release/` | `develop` | `main` + `develop` | Release prep (version bumps, changelogs) |
| `chore/` | `develop` | `develop` | Tooling, deps, CI, refactors |

## Naming Convention

```
feat/123-member-invite-flow
fix/456-payment-date-overflow
hotfix/missing-rls-policy
release/v1.2.0
chore/upgrade-supabase-ssr
```

- Lowercase, hyphen-separated
- Include issue number when applicable
- Keep it short but descriptive (3–6 words)

## Commit Messages (Conventional Commits)

```
feat(members): add bulk invite via CSV
fix(payments): handle paise overflow on display
chore(ci): add typecheck step to PR workflow
refactor(auth): consolidate getUserProfile call
docs(claude): update session log for sprint 8
```

Format: `type(scope): description`

Types: `feat` · `fix` · `refactor` · `chore` · `docs` · `test` · `perf` · `revert`

## PR Rules

1. **All PRs target `develop`** (except `hotfix/*` and `release/*` which also target `main`)
2. **PR title must follow Conventional Commits** — enforced by CI
3. **Fill the PR template** — summary, type, test plan, Zenzo checklist
4. **1 approving review required** before merge
5. **Squash merge** feature branches into develop (clean history)
6. **Merge commit** for `develop → main` (preserve release boundary)

## Release Flow

```
develop
  └── release/v1.x.0    # bump version, update changelog
        └── PR → main   # merge commit
        └── PR → develop # back-merge
main → tag v1.x.0       # create GitHub release
```

## Branch Protection (configure in GitHub Settings)

### `main`
- Require PR before merging
- Require 1 approving review
- Require status checks: `typecheck`, `lint`, `build`
- Require branches to be up to date before merging
- No direct pushes (including admins)
- No force-push

### `develop`
- Require PR before merging
- Require status checks: `typecheck`, `lint`
- Allow force-push: off

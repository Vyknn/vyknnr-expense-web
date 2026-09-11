# PG Management Web

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Git Workflow

### 1. Creating a Branch

Naming convention:

```
<type>/<ticket-id>-<short-description>
```

Examples:

```
feature/GAME-123-add-transfer-inquiry
fix/GAME-456-token-cache-race
hotfix/GAME-789-prod-timeout
chore/update-dependencies
refactor/reconcile-service-cleanup
```

Common types:

| Type        | Use when                                    |
| ----------- | -------------------------------------------- |
| `feature/`  | Adding a new feature                          |
| `fix/`      | Fixing a bug                                  |
| `hotfix/`   | Fixing an urgent bug in production            |
| `refactor/` | Restructuring code without changing behavior  |
| `chore/`    | Chores such as updating deps or config        |
| `docs/`     | Documentation-only changes                    |
| `test/`     | Adding/updating tests only                    |

General rule: every branch is cut from `main` (or `develop` if used), named lowercase and
separated with `-`.

### 2. Commits (Summary + Description)

Format: [Conventional Commits](https://www.conventionalcommits.org/) — enforced by `commitlint`
(`commitlint.config.js`, extends `@commitlint/config-conventional`) via the Husky `commit-msg`
hook:

```
<type>(<scope>): <summary, ≤ 50 characters>

<description/body — explain "why", not "what">

<footer — e.g. Closes #123, BREAKING CHANGE: ...>
```

Types used: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `build`, `ci`

Examples:

```
feat(transfer): add fund transfer inquiry endpoint

Adds a new query to check transfer status by reference ID.
Needed because the caller service currently has no way to
verify a transfer completed after a timeout.

Closes #456
```

```
fix(auth): prevent duplicate token refresh under concurrent load

Two goroutines could both see an expired token and race to
refresh it, causing a redundant PRIME auth call.

Fixes #789
```

Rules:

- Summary line: use imperative mood ("add", not "added"/"adds"), no trailing period
- 1 commit = 1 change with a single reason (atomic commit)
- Never commit code that fails to build or has failing tests

If the message doesn't match the format (e.g. missing `type` or missing the `:` separator), the
`commit-msg` hook rejects it immediately:

```
⧗   --- input ---
app init
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

Fix it by committing again with the format above, e.g. `git commit -m "chore: init app"`.

### 3. Review and Merge

Before requesting review:

- Rebase/sync with the latest `main` first
- Run lint + tests and make sure everything passes — unit tests, integration tests, e2e
- PR description follows the template: **What / Why / How to test**
- PR title format: same as a commit summary, e.g. `feat(transfer): add fund transfer inquiry endpoint`

Review checklist (for reviewers):

- Logic is correct and matches the requirement
- Tests cover the important edge cases
- No hardcoded secrets/credentials
- Clearly distinguish "must fix" from "nit/suggestion" comments — use prefixes like `nit:`,
  `blocking:`

Merge conditions:

- At least 1 approval required (or more per team policy, e.g. 2 for code touching
  money/critical systems)
- CI must pass entirely (build, lint, test, api generate)
- No unresolved conversations left open

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

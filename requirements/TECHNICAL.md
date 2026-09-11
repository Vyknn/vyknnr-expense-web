## Framework

- Next.js v16.3.1 (App Router, Turbopack, Cache Components)
- React v19.2.8

## Language

- TypeScript v5 (`strict` mode)

## Styling

- Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-based config via `@theme inline` — no
  `tailwind.config.js`)

## Database

- SQLite — local dev database (`src/db/database.sqlite3`, gitignored)
- better-sqlite3 — synchronous SQLite driver, accessed only via the singleton connection in
  `src/lib/db.ts`
- Schema defined in DBML (`requirements/database.dbml`), migrated to SQLite via
  `requirements/database.sql`

## Testing

- Jest v30 (`jest-environment-jsdom`) — unit, component, and integration tests
- React Testing Library (`@testing-library/react`, `@testing-library/dom`,
  `@testing-library/jest-dom`) — component rendering assertions
- Playwright (`@playwright/test`) — end-to-end tests

## Tooling

- ESLint v9 (`eslint-config-next`) — linting (there is no `next lint` in Next.js 16)
- Husky — git hooks (`pre-commit`: lint + typecheck, `commit-msg`: commitlint)
- commitlint (`@commitlint/config-conventional`) — enforces Conventional Commits
- Turborepo — task caching for `build`/`lint`/`test` (single-package mode, no workspaces)
- ts-node — running TypeScript config/scripts directly

## Runtime & Package Manager

- Node.js >=22.12.0
- yarn v1.22.22 (Classic) — local dev, Husky hooks
- npm — Docker and GitHub Actions CI only, via committed `package-lock.json` (kept in sync with
  `yarn.lock` intentionally; both lockfiles are required, do not delete either)

## Infrastructure

- Docker — multi-stage build (`deps` → `builder` → `runner`) on `node:22-alpine`,
  `next.config.ts` `output: 'standalone'`
- GitHub Actions — CI/CD (`ci-cd.yml`: lint → typecheck → build, `tests.yml`: Jest)

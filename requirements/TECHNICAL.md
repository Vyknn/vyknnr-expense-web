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
- Schema documented in DBML (`requirements/database.dbml`); runtime applies ordered SQL migrations
  from `src/db/migrations/` through the `schema_migrations` ledger in `src/lib/db.ts`.
  `requirements/database.sql` is the synchronized full-schema reference.

## Authentication & authorization

- Native local email/password authentication — no OAuth/OIDC provider and no public registration
- Passwords use Node `crypto.scrypt` with a random salt; plaintext passwords are never stored
- Opaque, random session tokens live in an `httpOnly`, `sameSite=lax` cookie; SQLite stores only their SHA-256 hashes and enforces a seven-day expiry
- Bootstrap the first Admin only when no users exist with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`; inject production values from Secret Manager, never source control
- Roles: `admin`, `editor`, `viewer`. Server Actions and route handlers enforce RBAC; UI gating is only a usability layer
- Admin provisions members with temporary passwords, changes roles, and activates/deactivates accounts. Every role/status change revokes target sessions; at least one active Admin must remain

## Image processing

- Sharp — server-side receipt image resize/compression in `src/lib/receipt-image.ts`, called only from Server Actions

## Icons

- Tabler Icons React (`@tabler/icons-react`) — shared UI icon set, imported directly in application components

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
- Cloud Run + local SQLite requires a single instance (`--max-instances=1`) to avoid split-brain data and sessions. This is a deployment-capacity decision; do not change it without explicit approval. Use Secret Manager for `INITIAL_ADMIN_*` values.

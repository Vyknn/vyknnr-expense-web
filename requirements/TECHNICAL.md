## Framework

- Next.js v16.3.1 (App Router, Turbopack, Cache Components)
- React v19.2.8

## Language

- TypeScript v5 (`strict` mode)

## Styling

- Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-based config via `@theme inline` — no
  `tailwind.config.js`)

## Database

- PostgreSQL — connection string from `DB_PRIMARY_DSN` env var (`DB_DRIVER=postgres` is currently
  informational; no other driver is implemented)
- `pg` (node-postgres) — async driver, accessed only via the singleton `Pool` in `src/lib/db.ts`
  through the exported `query`/`queryRows`/`queryRow`/`withTransaction` helpers
- `users.email` is `citext` (case-insensitive unique) — requires the `citext` extension
  (`CREATE EXTENSION IF NOT EXISTS citext`, applied by migration `0002_auth.sql`)
- Timestamp columns are `TIMESTAMPTZ`; `src/lib/db.ts` overrides `pg`'s type parser for
  `timestamp`/`timestamptz` to return raw ISO strings instead of JS `Date` objects, so
  `queries.ts`/`actions.ts` TypeScript types (all `string`) stay accurate
- Schema documented in DBML (`requirements/database.dbml`); runtime applies ordered SQL migrations
  from `src/db/migrations/` through the `schema_migrations` ledger in `src/lib/db.ts`.
  `requirements/database.sql` is the synchronized full-schema reference.

## Authentication & authorization

- Native local email/password authentication — no OAuth/OIDC provider and no public registration
- Passwords use Node `crypto.scrypt` with a random salt; plaintext passwords are never stored
- Opaque, random session tokens live in an `httpOnly`, `sameSite=lax` cookie; PostgreSQL stores only their SHA-256 hashes and enforces a seven-day expiry
- Bootstrap the first Admin only when no users exist with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`; inject production values from Secret Manager, never source control
- Roles: `admin`, `editor`, `viewer`. Server Actions and route handlers enforce RBAC; UI gating is only a usability layer
- Admin provisions members with temporary passwords, changes roles, and activates/deactivates accounts. Every role/status change revokes target sessions; at least one active Admin must remain

## Image processing

- Sharp — server-side receipt image resize/compression in `src/lib/receipt-image.ts`, called only from Server Actions

## Receipt storage

- Google Cloud Storage — compressed receipt images are uploaded to the bucket named by
  `GOOGLE_BUCKET_PATH` (`<bucket>` or `<bucket>/<prefix>`, no `gs://` scheme; the optional
  prefix lets several apps share one bucket under separate folders, e.g. `autobotz-dev/expense`)
- `@google-cloud/storage`, accessed only via the singleton client in `src/lib/storage.ts`
  (`uploadReceipt`/`downloadReceipt`/`deleteReceipts`), authenticated via a service-account key
  file at `GOOGLE_CERT_PATH` (gitignored — never commit it) when set, otherwise falls back to
  Application Default Credentials (Cloud Run's attached service account, or
  `gcloud auth application-default login` locally)
- PostgreSQL stores only the object key (`expense_item_receipts.storage_key`); the receipt route
  (`/rounds/[roundId]/receipts/[itemId]/[receiptId]`) downloads from GCS and streams the bytes
  through the server response — never a redirect to a signed URL — so the existing auth check
  stays in front of every read

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
- Cloud Run may now scale to multiple instances — PostgreSQL is an external, shared database (via `DB_PRIMARY_DSN`), so the previous single-instance (`--max-instances=1`) constraint from the local-SQLite era no longer applies. Use Secret Manager for `INITIAL_ADMIN_*` and `DB_PRIMARY_DSN` values.

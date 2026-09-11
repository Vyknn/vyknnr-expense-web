# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js **16.3.1** / React **19.2.8** / TypeScript **5** (strict) / Tailwind **v4** App Router
admin backoffice, using `yarn`. Code lives under `src/`, imported via the `@/*` path alias
(`src/*`). Senior-level Next.js 16 conventions (Server vs. Client component defaults, Server
Actions for mutations, Cache Components, TypeScript discipline) are encoded in the
`.claude/skills/nextjs-senior-dev` skill, which loads automatically when writing/reviewing
App Router code in this repo.

## Rules

- **[requirements/STRUCTURE.md](requirements/STRUCTURE.md) is the source of truth for file/folder
  placement.** It contains the exhaustive, up-to-date file tree and the rationale for every
  top-level folder. Read it before adding, moving, or renaming any directory — do not invent a
  different structure. If you add or restructure a directory, update this file in the same
  change.
- **[requirements/TECHNICAL.md](requirements/TECHNICAL.md) is the source of truth for the
  technical stack.** Do not introduce a different framework, UI library, CSS approach, or
  replace a listed piece of the stack without updating this file first.
- If the code in this repo and either doc ever disagree, treat the doc as authoritative and flag
  the mismatch rather than silently following whichever one you saw first.

## Commands

```bash
yarn dev                 # Turbopack dev server
yarn build               # production build (next.config.ts: output 'standalone')
yarn start               # run the production build

yarn lint                # eslint directly — there is no `next lint` in Next.js 16
npx next typegen         # generate LayoutProps/PageProps/RouteContext ambient types into .next/types
yarn tsc --noEmit        # typecheck (no dedicated package.json script)

yarn test                # Jest: unit + component + integration, one-shot
yarn test:watch          # Jest watch mode
yarn jest path/to.test.tsx           # single Jest file
yarn jest -t "test name"             # single Jest test by name

yarn test:e2e            # Playwright, headless — requires the app already running
yarn test:e2e:ui         # Playwright UI mode
yarn playwright test tests/e2e/home.spec.ts   # single Playwright spec

npx turbo run <build|lint|test>      # same tasks, cached via Turborepo (single-package mode)
```

Playwright has no `webServer` configured (deliberate) — start `yarn dev` or
`yarn build && yarn start` yourself first, then run `yarn test:e2e` against it.

`LayoutProps`/`PageProps`/`RouteContext` only exist after Next.js generates them into
`.next/types/` (via `next dev`, `next build`, or `next typegen`) — if you've deleted `.next/` and
run `yarn tsc --noEmit` standalone, run `npx next typegen` first or you'll hit
`TS2304: Cannot find name 'LayoutProps'`. CI runs `next typegen` before typecheck for exactly
this reason (fresh checkout, no `.next/` yet).

Husky enforces on every commit: `pre-commit` runs `yarn lint && yarn tsc --noEmit`, `commit-msg`
runs commitlint against `@commitlint/config-conventional` (Conventional Commits required).

## Architecture

**This is not the Next.js you know.** Training-data assumptions about Next.js APIs and
conventions are likely stale — see `AGENTS.md` (above) and read `node_modules/next/dist/docs/`
for the current version before writing framework-adjacent code. Load-bearing breaking changes
already accounted for in this codebase:
- `params`/`searchParams` are `Promise`s in pages, layouts, and route handlers — always `await`.
- `middleware.ts` is deprecated; edge-level auth/redirect logic goes in `proxy.ts` at the repo
  root instead (not implemented yet).
- Cache Components (`"use cache"`) is the caching model — dynamic/uncached is the default, opt
  in explicitly rather than assuming implicit `fetch` caching.
- Turbopack is the default bundler; linting is plain `eslint`, not `next lint`.

**Route colocation, not a central API layer.** Each route folder under `src/app/` owns its own
`actions.ts` (Server Actions, for all mutations) and `queries.ts` (server-side data reads)
instead of a shared `lib/api.ts`, because each route/epic has a materially different data shape.
`src/lib/` holds infra/domain code specific to this system (auth, the API client, money/percent
formatting per business rule); `src/utils/` holds domain-agnostic helpers — when unsure which,
default to `lib/`.

**Root layout is split in two.** Next.js requires the root layout file convention
(`<html>`/`<body>`) to live at `src/app/layout.tsx`, so that file stays a thin wrapper. The actual
layout UI lives in `src/components/layouts/` (`RootLayout.tsx`, `AuthLayout.tsx`) and is imported
into the route-level layout files.

**`components/` vs `features/`.** Generic UI shared across routes (data table, filter bar, modal,
toggle, layouts) lives in `src/components/`. `src/features/` is reserved for logic complex or
cross-route enough to need its own module (e.g. a future `auth/` used by both a login page and
`proxy.ts`) — it does not exist yet and should not be pre-scaffolded before a real feature needs
it.

**State lives in the URL.** Filter and pagination state belongs in `searchParams`, not in
`contexts/`/`providers/`/`stores/` — those three directories exist for cases that genuinely can't
be expressed as a prop or URL param; don't reach for them by default.

**Four-tier testing, split by scope, not just by tool:**
1. Unit (Jest) and 2. Component (Jest + React Testing Library) tests are colocated as
   `*.test.ts(x)` next to the source file (e.g. `src/app/page.test.tsx`).
3. Integration tests (Jest + RTL, composing multiple modules together, e.g. a layout wrapping a
   page) live in `tests/integration/` since they aren't tied to one source file.
4. E2E tests (Playwright, real browser) live in `tests/e2e/`.
`jest.config.ts` excludes `tests/e2e/` via `testPathIgnorePatterns` so the two runners don't
collide. Jest/RTL cannot test `async` Server Components (a React ecosystem limitation) — since
nearly every `page.tsx`/`queries.ts` here is an async Server Component, Jest only covers
synchronous Client Components; full-route behavior is Playwright's job.

**Most route/component folders are scaffolded, not implemented.** Outside of the root
`layout.tsx`/`page.tsx` and `src/components/layouts/`, most directories under `src/app/` and
`src/components/` currently contain only a `README.md` placeholder describing what belongs there
— check for an actual implementation file before assuming one exists.

**Docker & CI.** `next.config.ts` sets `output: 'standalone'`; the `Dockerfile` is a 3-stage
build (`deps` → `builder` → `runner`) pinned to `node:22-alpine` because `@commitlint/cli`
requires Node >=22.12.0 (stricter than Next.js's own >=20.9.0 minimum), reflected in
`package.json`'s `engines.node`. `.github/workflows/ci-cd.yml` (lint → typecheck → build) and
`tests.yml` (Jest only — Playwright is not wired into CI yet) both trigger on push/PR to `main`
only; there is no manual `workflow_dispatch`.

**Two lockfiles, intentionally.** `yarn.lock` is for local dev and the Husky hooks; `package.json`
also has a committed `package-lock.json` used only by the `Dockerfile` (`npm ci`) and both GitHub
Actions workflows (`npm ci`, `actions/setup-node` cache: npm) — plain `yarn` everywhere else.
This isn't drift; don't delete either lockfile. If you change a dependency, run
`yarn install` then `npm install --package-lock-only` to keep both in sync. The `deps` Docker
stage also runs `apk add python3 make g++` before `npm ci` because `better-sqlite3` is a native
addon that needs to compile via `node-gyp`, which `node:22-alpine` doesn't ship by default.

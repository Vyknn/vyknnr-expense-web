---
name: nextjs-senior-dev
description: Use whenever writing, reviewing, or refactoring TypeScript/Next.js code in this repo — implementing a page, component, Server Action, or route handler for the admin dashboard. Encodes senior-level conventions for Next.js 16.3.1 (App Router, Cache Components, async request APIs, Turbopack) plus this project's own data-table/filter/modal patterns.
---

# Senior Next.js 16 + TypeScript conventions

This repo is a Next.js **16.3.1** / React **19.2.8** / TypeScript **5** / Tailwind **v4** App Router
project (`app/`, no `src/`). It's an internal admin backoffice — dense data tables, date-range
filters, pagination, popups/modals, and toggle switches, organized by role level
(Senior / Master / Agent).
Write code the way a senior engineer maintaining this for years would: correct against the
current framework version, no speculative abstraction, typed at every boundary.

## 1. Next.js 16 facts to never get wrong

- **`params` and `searchParams` are `Promise`s** in pages, layouts, and route handlers — always
  `await` them. Never type them as plain objects.
  ```tsx
  type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
  export default async function Page({ params, searchParams }: Props) {
    const { id } = await params
    const query = await searchParams
  }
  ```
- **`middleware.ts` is deprecated in favor of `proxy.ts`.** If you need edge-level
  auth/redirect logic for the admin area, create `proxy.ts` at the project root, not
  `middleware.ts`.
- **Cache Components (`"use cache"`) is the caching model.** Dynamic (uncached, per-request)
  is the default now — opt a function/component *into* caching explicitly with the
  `"use cache"` directive plus `cacheTag`/`cacheLife` where you want it, instead of assuming
  implicit caching. Don't add manual `fetch` cache workarounds; use the directive.
- **Turbopack is the default bundler.** Don't add webpack-specific config unless a dependency
  genuinely requires it — check for a Turbopack-native alternative first.
- **There is no `next lint`.** Linting is plain `eslint` (see `package.json`'s `"lint"` script)
  — run `npm run lint`, not `next lint`.
- Minimums: Node **20.9+**, TypeScript **5.1+** — don't suggest anything that assumes older
  runtimes (e.g. no `?.` polyfills, no CJS-only packages without checking ESM support).

## 2. Server vs. Client components

- Default every new component to a **Server Component**. Only add `"use client"` when the
  file genuinely needs it: event handlers, `useState`/`useEffect`, browser APIs, or a
  third-party client-only library.
- Push `"use client"` as far down the tree as possible — a page/layout stays a Server
  Component that renders a small interactive leaf (e.g. `<FilterBar />`, `<StatusToggle />`),
  rather than making the whole page client-rendered because one button needs `onClick`.
- Fetch data in Server Components or Server Actions, not in `useEffect` + client `fetch`.
  This dashboard is read-heavy (reports, member lists) — that data belongs in the server
  render, with client components only for the interactive filter/pagination controls that
  update the URL (`useSearchParams` + `router.push`/`<Link>`), letting the server component
  re-fetch on navigation.
- Mutations (create/edit/delete member, toggle game status, generate API key, save preset,
  etc.) go through **Server Actions** (`"use server"`), called from a `<form action={...}>` or
  `useActionState`, not ad-hoc `fetch` calls to hand-rolled API routes, unless the consumer is
  external (e.g. a genuinely public API).

## 3. TypeScript discipline

- `strict` is already on (`tsconfig.json`) — keep it that way. Never introduce `any`; use
  `unknown` at untyped boundaries and narrow it.
- Model domain state with discriminated unions instead of optional-everything objects, e.g.
  a report's loading state as `{ status: 'idle' | 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: Row[] }`,
  not a bag of nullable fields.
- Prefer `type` for data shapes and unions; reach for `interface` only when you need
  declaration merging or a class contract.
- Use `satisfies` instead of a type annotation when you want literal-type inference preserved
  (route configs, option lists for dropdowns like game brands, status enums).
- Validate anything crossing a real trust boundary (external API responses, form submissions,
  route handler bodies) at runtime, not just at compile time — don't trust a `fetch` response's
  inferred type. If a validation library isn't already a dependency, ask before adding one
  rather than assuming Zod/Valibot are available.
- No non-null assertions (`!`) as a substitute for a real narrow or an early return.

## 4. Project structure

- Route the admin sections to mirror the FRD epics, using route groups for organization
  without affecting the URL where that fits: `app/(dashboard)/`, `app/members/`,
  `app/reports/`, `app/tier-settings/`, `app/settings/`, `app/assistants/`.
- Colocate a route's server-only data access and Server Actions next to it
  (`app/members/actions.ts`, `app/members/queries.ts`), not in one global `lib/api.ts` dumping
  ground.
- Shared UI (the data table, filter bar, pagination, modal/dialog, toggle switch — used across
  nearly every report and settings screen per the FRD) belongs in a top-level `components/`
  directory, built generic over the row/column shape rather than duplicated per report.
- Shared cross-cutting types (role levels, currency, pagination envelope) belong in `types/`
  (already exists at the repo root).

## 5. Recurring UI patterns in this app

The FRD describes the same shapes repeatedly — build them once, generically, and reuse:

- **Filtered, paginated table**: date-range filter + dropdown filters + a search button +
  a table + page-size/page-index controls. Model pagination and filter state in the URL
  (`searchParams`) so it survives refresh/back-nav and the server component can read it
  directly — don't stash it in client-only React state.
- **Modal/pop-up forms** (add/edit member, edit preset, add API key, etc.): confirm/cancel
  pair, submits via a Server Action, closes on success. Build one `<Modal>` primitive, not a
  bespoke overlay per feature.
- **Toggle switches** (enable/disable game, seamless on/off): should optimistically update via
  `useOptimistic` around a Server Action rather than a full page reload for a single boolean
  flip.
- **Summary/total rows** under a data table (turnover totals, dividend totals): compute from
  the same typed row array the table renders, not a second parallel query.
- Numbers are money/percentages throughout this domain — always format via a single shared
  formatter (locale-aware, e.g. `Intl.NumberFormat`), never ad-hoc `.toFixed()` scattered
  across components.

## 6. Styling

- Tailwind v4 config lives in CSS (`app/globals.css` via `@theme inline`), not a
  `tailwind.config.js` — add design tokens (colors, fonts) there, don't create a JS config
  file.
- Keep class lists readable; extract a `cn()` helper (clsx/tailwind-merge or a hand-rolled
  equivalent) before reaching for long conditional template strings, but don't add the
  dependency speculatively — introduce it when the first real conditional-class need shows up.

## 7. Before calling anything done

- `npm run lint` and `npx tsc --noEmit` both clean.
- No leftover `console.log`, no `any`, no unused `"use client"` on components that don't need
  it.
- Every interactive control (toggle, modal trigger, pagination button) has a real accessible
  name/label — this is an internal tool but still keyboard/screen-reader operable.
- Prefer editing the shared table/filter/modal primitives over copy-pasting a report page to
  make a new one.

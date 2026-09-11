# tests

Root-level test folders for cross-module/cross-page testing. Unit tests (pure functions/utils)
and component tests (React Testing Library) stay **colocated** next to their source file
(e.g. `Toggle.test.tsx` next to `Toggle.tsx`) per the "Colocate ต่อ route" principle in
[STRUCTURE.md](../requirements/STRUCTURE.md) — only tests that span multiple files/routes or
drive a real browser live here.

- `integration/` — Jest + React Testing Library tests that combine multiple modules together
  (e.g. a layout wrapping a page, a component wired to a hook/store). Same constraints as
  colocated Jest tests: only synchronous Client Components are testable, not `async` Server
  Components.
- `e2e/` — Playwright specs that drive a real browser against a running app. Requires the app
  to be running first (`yarn dev` or `yarn build && yarn start`), then `yarn test:e2e`.

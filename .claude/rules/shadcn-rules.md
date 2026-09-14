# shadcn/ui Rules

Rules for shadcn-generated components in this repo. Read alongside `tailwind-rules.md` (tokens
live there) and `.claude/skills/nextjs-senior-dev` (Server/Client component rules — not repeated
here).

## Stack

- **shadcn/ui**, style `base-mira` (`components.json`) — components are generated source code
  copied into `src/components/ui/`, not an npm dependency you upgrade. Treat files there as
  owned/editable project code, not vendor code.
- **Base UI** (`@base-ui/react`) is the headless primitive library underneath — **not Radix**.
  Prop shapes and data attributes follow Base UI's API (e.g. `data-slot`, Base UI's own
  open/state data attributes), so don't copy Radix-specific patterns from memory or from
  shadcn examples written against Radix.
- **Tabler Icons** (`@tabler/icons-react`) is the icon set. Import icons directly from the
  package; mark decorative icon SVGs with `aria-hidden`.
- **class-variance-authority (cva)** defines variant/size APIs on every primitive; **cn**
  (`src/lib/utils.ts`, re-exported from the `cn` package) merges class names — always compose
  new variants through `cva` + `cn`, never string-concatenate classes.
- **tw-animate-css** supplies animation utility classes (`animate-in`, `fade-out-0`, etc.) for
  Base UI's open/close state transitions.

## Adding components

```bash
npx shadcn@latest add <component>
```

Install one component at a time, only when a route actually needs it — do not bulk-install the
full catalog. Generated files land in `src/components/ui/`; this is separate from
`src/components/` (custom shared UI: `data-table/`, `filter-bar/`, `modal/`, `toggle/`,
`layouts/`). Route-level composition still follows the project's colocation rule — build
feature-specific compositions in the route folder or `src/features/<feature>/components/`, not
by editing shadcn primitives to fit one screen's needs.

## Variants

Every primitive exposes `variant` and `size` via `cva`. Before adding a one-off style prop,
check whether the existing variant set already covers it:
- `variant`: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- `size` (buttons): `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

If a new visual variant is genuinely needed, add it to the component's `cva` config (so it's
reusable and typed via `VariantProps`) instead of overriding classes with `className` at the
call site.

## Accessibility (already baked in — don't fight it)

Focus rings (`focus-visible:ring-2 focus-visible:ring-ring/30`) and invalid states
(`aria-invalid:*`) are wired into the base component styles. When building forms:
- Set `aria-invalid` on the field (not a custom red border) to get the destructive ring/border
  automatically.
- Don't remove `focus-visible` outlines for aesthetic reasons — this is an internal admin tool
  but keyboard navigation still needs to be usable.
- Icon-only buttons (`size="icon*"`) need an accessible name (`aria-label`) since there's no
  visible text.

## QA loop

For every new/changed screen:
1. `yarn dev` and manually exercise the golden path + at least one edge case in a real browser
   before calling the work done.
2. Add/update a Playwright spec in `tests/e2e/` covering that path.
3. `yarn build && yarn start` (Playwright has no `webServer` config in this repo — start the
   server yourself), then `yarn test:e2e` against it.

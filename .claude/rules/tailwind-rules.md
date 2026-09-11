# Tailwind CSS Rules

Rules for Tailwind v4 usage and design tokens in this repo. Read alongside `shadcn-rules.md`
(component-level conventions built on top of these tokens).

## Config model

Tailwind v4 uses CSS-based config — there is no `tailwind.config.js`. All tokens live in
`src/styles/globals.css` as CSS variables (OKLch color space), mapped into Tailwind utility
classes via `@theme inline`. Never hardcode a hex/rgb color in a component — reference the
semantic token instead.

## Color tokens

| Token | Use for |
|---|---|
| `background` / `foreground` | page background / default text |
| `card` / `card-foreground` | panel and card surfaces |
| `primary` / `primary-foreground` | primary actions, brand emphasis — **indigo** (light: indigo-600, dark: indigo-500), only token carrying brand hue; everything else stays neutral gray |
| `secondary`, `muted`, `accent` (+ `-foreground`) | secondary surfaces, de-emphasized text, hover/active states |
| `destructive` | delete/error actions only |
| `border`, `input`, `ring` | borders, form field borders, focus rings |
| `sidebar*` | sidebar-specific surface, kept separate from `card` so the nav can have its own contrast |
| `chart-1`..`chart-5` | data visualization series — see the `dataviz` skill before choosing chart colors instead of picking manually |

## Dark mode

Class-based (`.dark` on `html`/`body` — see `RootLayout.tsx`/theme toggle), **not**
`prefers-color-scheme` media queries. Both palettes are already fully defined in
`globals.css` — don't add a separate `@media (prefers-color-scheme: dark)` override block.

## Radius & sizing scale

`--radius` (0.625rem) is the base; `radius-sm/md/lg/xl/2xl/3xl/4xl` are derived multiples in
`@theme inline` — pick from that scale rather than an arbitrary `rounded-[Npx]`.

This is an **admin backoffice** — default control density is compact: shadcn's `default` button
size here is `h-7` with `text-xs/relaxed`, not the spacious `h-10`/`text-sm` you may recall from
marketing-site Tailwind examples. Match this density (prefer `sm`/`xs`/`default` sizes) for
data-dense screens like tables and filter bars; reserve `lg` for standalone primary CTAs.

## General usage

- Compose classes with `cn()` (`src/lib/utils.ts`), not manual string concatenation — needed to
  correctly merge/override conflicting Tailwind classes.
- Prefer existing `@theme inline` tokens/scale over arbitrary values (`bg-[#...]`,
  `w-[123px]`); reach for arbitrary values only when no token fits.

# WEB-002 — Design System Law (SAQEEL)

> Status: **BINDING**.
> The design system is **SAQEEL**. It is the only visual vocabulary this app has.
> Astryx is banned — no `ax-` class, no `ax-` token, no `astryx.css` import, zero
> references. This carries forward the existing repository law and is not
> negotiable at task level.

---

## 1. Why Saqeel and not something else

The repository already owns an audited, owner-approved token sheet
(`apps/web/src/app/tokens.css`) with contrast ratios recorded per token, a dark
theme, an RTL story, and ten canonical status roles. That is the expensive part
of a design system and it already exists and already passes accessibility
review. What is missing is a disciplined **component layer** on top of it. This
programme builds that layer. It does not restart the token work.

---

## 2. The single source of visual truth

`apps/web/src/app/tokens.css` is the **only** file in the repository permitted
to contain a raw visual value.

Banned everywhere else in `apps/web/src/**` — components, CSS modules, page
files, inline styles:

- hex colours (`#0f4938`), `rgb()`, `rgba()`, `hsl()`, named colours (`red`)
- pixel, rem, or em literals for spacing, size, radius, border width, or blur
- `font-family` declarations and numeric `font-size`
- `box-shadow` literals
- numeric `z-index`
- `transition`/`animation` durations and easing curves as literals

Permitted: `var(--token)` and nothing else.

```css
.card {
  background: var(--surface-primary);
  border: var(--border-w) solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}
```

If a value looks bespoke, it is a token you have not found yet. If the token
truly does not exist, **stop**. A missing token is a design-system change
request recorded in the tracker, resolved in `tokens.css` with its contrast
ratio measured — never a local workaround.

`gate:no-literals` fails the build on any of the banned forms.

---

## 3. Where components live

```
apps/web/src/components/saqeel/
  actions/      Button, IconButton, ButtonGroup, SplitButton
  inputs/       Field, Input, TextArea, Select, Combobox, Choice, Switch,
                SegmentedControl, FileUpload, DateRangePicker, StatusSelector
  surface/      Card, Panel, Section, SectionHeader, Divider, Stack, Grid, Cluster
  data/         StatusPill, Tag, Avatar, KpiTile, MetricStrip, DescriptionList,
                DetailRow, Timeline, Accordion, DataGrid
  feedback/     Alert, Toast, Modal, Drawer, Tooltip, Menu, EmptyState,
                Skeleton, Progress, StateSurface, SyncIndicator, DiffView
  navigation/   Sidebar, TopBar, PageHeader, Breadcrumb, Tabs, Steps, Pagination,
                UserMenu, CommandPalette, FilterBar, ColumnManager
  media/        Icon, IconRegistry, Thumbnail, Figure
  index.ts      the one sanctioned barrel in the repository
```

Domain components — anything that knows what an inspection is — live in
`components/<domain>/` and are **composed from** Saqeel primitives. They never
reach past the primitive to write their own visuals.

---

## 4. What a Saqeel primitive is allowed to be

Every primitive obeys all of the following. A primitive that breaks one is not a
primitive; it is a domain component in the wrong folder.

1. **No domain knowledge.** It does not know what a visit, factory, finding,
   region, or inspector is. `<StatusPill status="critical">` is a primitive;
   `<InspectionStatusPill visit={visit}>` is not.
2. **No data access.** No Supabase, no `fetch`, no `cookies()`, no server action
   import.
3. **No baked-in copy.** Every user-visible string arrives as a prop. Default
   English labels may exist as an exported constant table, never inline.
4. **Server component by default.** It carries `"use client"` only if it owns an
   event handler or a browser API, and then the interactive part is split out so
   the static part stays on the server.
5. **Closed variant API.** Appearance is chosen through string-literal unions
   (`variant`, `tone`, `size`, `density`, `emphasis`). There is **no `className`
   escape hatch and no `style` prop**. An escape hatch is how a design system
   dies: within a month every screen has its own private variant.
6. **Layout is the parent's job.** A primitive never sets its own outer margin.
   Spacing between things comes from `Stack`, `Cluster`, `Grid`, or `Section`.
7. **Typed, forwarded, and complete.** Explicit props type, `forwardRef` where a
   DOM node exists, native attributes passed through where they are safe,
   `readonly` on array props.
8. **Accessible by construction.** The primitive owns its roles, labelling
   relationships, focus management, and keyboard contract so callers cannot get
   them wrong. See WEB-003.
9. **Dark and RTL correct.** No physical direction properties, no colour that
   only works in one theme.
10. **Under 200 lines.** A primitive that needs more is two primitives.

### The one legitimate use of `style`

Passing a **token-valued CSS custom property** for a genuinely dynamic value:

```tsx
<div className={styles.grid} style={{ "--grid-columns": String(columnCount) }} />
```

Never a literal. Never a colour. Never a size.

---

## 5. Icons — `lucide-react`, and nothing else

Hand-authored `<svg>` in application code is banned. `gate:no-svg` fails the
build on any `<svg`, `<path`, `<circle`, `<rect`, `<polyline`, or `<use` in
`apps/web/src/**`.

The reasons: a hand-rolled SVG set is unaudited for accessibility, duplicated
across files, unminified, impossible to restyle globally, and grows without
limit. Ninety inline icon components is ninety opportunities to get
`aria-hidden` wrong.

### The two-layer contract

**Layer 1 — the registry.** One file maps semantic names to Lucide components:

```ts
import { AlertTriangle, Factory, ShieldCheck } from "lucide-react";

export const ICONS = {
  riskCritical: AlertTriangle,
  factory: Factory,
  compliancePassed: ShieldCheck,
} as const;

export type IconName = keyof typeof ICONS;
```

**Layer 2 — the wrapper.** Exactly one component renders an icon:

```tsx
export function Icon({ name, size = "md", label }: IconProps) {
  const Glyph = ICONS[name];
  return label
    ? <Glyph className={styles[size]} role="img" aria-label={label} />
    : <Glyph className={styles[size]} aria-hidden="true" focusable="false" />;
}
```

Consequences that matter in twenty years:

- Application code writes `<Icon name="riskCritical" />` and never touches a
  glyph. Swapping icon libraries is a one-file change.
- Icon names are **semantic** (`riskCritical`), never pictorial (`triangle`).
  The picture may change; the meaning must not.
- Size comes from a token-driven class, never a numeric prop.
- Colour is always `currentColor`, inherited from the surrounding text context.
- Direct `lucide-react` imports outside the registry are banned by
  `gate:icon-registry`.
- An icon adjacent to a text label is `aria-hidden`. An icon that **is** the
  only content of a control requires a `label`, and the control requires an
  accessible name.
- **Icon-only never carries meaning alone.** A status is a `StatusPill` with
  text. An icon may accompany it; it may never replace it (WCAG 1.4.1).

`apps/web/src/app/icons.tsx` is on the retirement ledger and is deleted once its
last import is gone.

---

## 6. Styling mechanism — one system stylesheet

The entire visual system lives in `apps/web/src/app/saqeel.css`: tokens, base layer,
and every component class, organised with
`@layer saqeel.tokens, saqeel.base, saqeel.components`. Components apply
`.saqeel-*` classes and data attributes; they do not ship CSS. There are no
`.module.css` files, no CSS-in-JS, no Tailwind, and no `style` prop except a
token-valued custom property. A visual change is made in one file, reviewed in
one diff, and cannot drift per screen. The legacy sheets `saqeel-components.css`,
`saqeel-runtime.css` and `v2-components.css` are frozen and shrink as screens
migrate. `tokens.css` is frozen and untouched. This supersedes the previous CSS
Modules rule.

---

## 7. Status, always text plus shape

Every status renders as a `StatusPill` carrying a **text label**. A coloured dot
may sit beside the label; it may never be the whole thing. The ten canonical
roles are fixed by the token sheet: `critical`, `major`, `warning`, `compliant`,
`info`, `pending`, `draft`, `onhold`, `completed`, `disabled`. New roles require
a token change request, not a new colour in a component.

---

## 8. Density, motion, and elevation

- Two densities only: `comfortable` (default) and `compact` (dense grids). They
  are a prop on the primitive, driven by token pairs. No third.
- Elevation is a fixed ladder: flat → `--shadow-xs` → `--shadow-card` →
  `--shadow-md` → `--shadow-lg`. Nothing between rungs.
- Motion uses `--motion-fast|base|slow` and `--ease-standard` only, and every
  animation is disabled under `prefers-reduced-motion: reduce`.
- Z-index comes from the token ladder (`--z-sticky`, `--z-toast`, …). A raw
  number is a defect.

---

## 9. Adding to the system

A new primitive requires, in this order:

1. A tracker entry stating which two existing usages justify it (Rule of Two).
2. Confirmation that no existing primitive plus a variant covers it.
3. Tokens verified to exist; any new token added to `tokens.css` **with its
   measured contrast ratio recorded**.
4. The component, its CSS module, and its entry in `components/saqeel/index.ts`.
5. A row in `brain/web/04-COMPONENT-LEDGER.md`.
6. A rendered example on the internal reference route so the manager can see it.

A "variant" that only one screen will ever use is not a variant. It is that
screen composing primitives differently, and it belongs in
`components/<domain>/`.

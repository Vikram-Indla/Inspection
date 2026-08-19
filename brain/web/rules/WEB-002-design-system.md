# WEB-002 — Design System Law (SAQEEL)

> Status: **BINDING**.
> The design system is **SAQEEL** — that is the name, the `--sqx-` prefix, and
> the component layer. Its **visual language**, adopted 2026-08-17 on the
> manager's approval, is the reference at `design/linear/design.md`.
> Astryx is banned — no `ax-` class, no `ax-` token, no `astryx.css` import, zero
> references. This carries forward the existing repository law and is not
> negotiable at task level.

---

## 1. One system, one language

SAQEEL is the **system**: the prefix, the primitives, the ledger, the gates.
The **language** it renders is the approved reference. Those are separate
things and the distinction matters, because the language has now been replaced
once (IRP → the reference, 2026-08-17) without the system changing at all.

That replacement is the proof the architecture works. Because every component
consumes `var(--sqx-*)` and never a literal, retargeting the token sheet
re-skinned **28 already-migrated routes without editing one of them**. A
component that hardcodes a value opts out of that and is a defect, not a
shortcut.

Three things the language fixes, which are law and not taste:

1. **Surfaces separate by a HAIRLINE, not a shadow.** Elevation is the surface
   ladder plus a 1px inset ring. Only genuinely floating layers — menu, modal —
   earn a drop shadow.
2. **The accent is a FILL, never text.** Acid lime measures 1.23:1 on white. No
   label, link or body copy is ever chromatic; text accents are neutral plus an
   underline.
3. **Status is the one place chroma carries meaning**, and it is derived and
   measured (§7).

---

## 2. The single source of visual truth

`apps/web/src/saqeel.css` is the **core system sheet** and the **only** file in
the repository permitted to contain a raw visual value. It holds primitives,
semantic colour roles, the typography scale, space, radius, sizing, elevation,
z-index, motion, gradient and direction tokens, the keyframes, the base layer,
and the reduced-motion block.

It holds **no component classes**. Component styling is §6.

`apps/web/src/app/tokens.css` is the **frozen legacy** sheet. It is still
consumed by hundreds of files and is retired screen by screen. Never add a token
to it, never change a value in it, never delete from it.

**One edit is permitted, and only one: repointing a declaration at
`var(--sqx-*)`.** That is not growth — it *shrinks* the sheet's authority, moving
a decision out of frozen legacy and into the design system, and it is how a
change of visual language reaches the routes the sheet still styles without
touching them. T-131 and T-132 used it to bring one typeface and one type scale
to ~80 legacy routes by editing two blocks of aliases.

Everything else about the sheet stays frozen. A new property, a new raw value, or
a deletion is still forbidden, and "I was only aliasing" does not cover any of
them.

### The prefix

Every token in the new system is prefixed **`--sqx-`** and every class
**`.sqx-`**. Both were verified free before adoption. Neither `--sq-` nor
`.sq-` nor `.saqeel-` may be used: `saqeel-runtime.css` already defines 281
`.sq-*` classes — including `.sq-btn`, `.sq-panel`, `.sq-stack`, `.sq-table`,
`.sq-input`, `.sq-modal`, `.sq-shell` — plus seven surviving `--sq-*`
properties, and 16 `.saqeel-*` classes exist. The prefix is also the migration
signal: a file using `--sqx-*` is on the new system, a file using bare
`--surface-*` is not, and one grep tells you which screens are done.

Banned everywhere in `apps/web/src/**` outside the `saqeel.css` primitives
block — components, CSS modules, page files, inline styles:

- hex colours (`#0f4938`), `rgb()`, `rgba()`, `hsl()`, named colours (`red`)
- pixel, rem, or em literals for spacing, size, radius, border width, or blur
- `font-family` declarations and numeric `font-size`
- `box-shadow` literals
- numeric `z-index`
- `transition`/`animation` durations and easing curves as literals

Permitted: `var(--sqx-*)` and nothing else.

```css
.root {
  background: var(--sqx-surface-default);
  border: var(--sqx-border-width-hair) solid var(--sqx-border-subtle);
  border-radius: var(--sqx-radius-card);
  padding: var(--sqx-inset-card);
  box-shadow: var(--sqx-shadow-card);
}
```

If a value looks bespoke, it is a token you have not found yet.

**Adding a token is a change request, not a task step.** If a component appears
to need a new one, it almost always needs an existing one. A genuine gap is
**reported and stopped on** — recorded in the task, raised, and resolved
deliberately in `saqeel.css` with its measured contrast ratio. It is never added
inline while building a component. This single rule is what stops the token
sheet growing a token per screen.

`gate:no-literals` fails the build on any of the banned forms.

---

## 3. Where components live

**One folder per component. The file is named after the component. Its CSS
Module sits beside it.** No `index.tsx` containing a component.

```
apps/web/src/components/saqeel/<name>/
  <name>.tsx
  <name>.module.css
  <name>.types.ts        only when the types exceed ~30 lines
```

Design-system primitives — anything with no domain knowledge — live under
`components/saqeel/`. Everything that knows what an inspection is lives under
`components/<area>/<name>/` and is **composed from** primitives; it never
reaches past a primitive to write its own visuals.

```
components/saqeel/select/select.tsx           a primitive
components/app-shell/shell/shell.tsx          an app component
components/app-shell/shell/shell.module.css   its styles
```

The one sanctioned barrel in the repository is `components/saqeel/index.ts`.
Barrels anywhere else create import cycles and defeat tree-shaking.

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

## 6. Styling mechanism

Two layers, and nothing between them.

**The core sheet.** `apps/web/src/saqeel.css` holds the system: primitives,
semantic colour roles, typography scale, space, radius, sizing, elevation,
z-index, motion, gradient and direction tokens, the keyframes, the base layer,
and the reduced-motion block. It contains **no component classes**. It is
imported once, in `app/layout.tsx`.

**The component layer.** Every component's styles are a **colocated CSS Module**
beside it:

```
components/app-shell/shell/shell.tsx
components/app-shell/shell/shell.module.css
```

CSS Modules are scoped by construction so there are no cascade accidents, cost
nothing at runtime, work in Server Components, ship only the CSS a route
actually uses, and cannot leak into a neighbour.

Rules for a module:

- It consumes `var(--sqx-*)` and nothing else. Not one literal colour, size,
  radius, shadow, font, or z-index.
- Class names are local and semantic: `.root`, `.header`, `.isActive`,
  `.toneCritical`. No utility soup.
- Variants are data attributes on the root — `[data-tone="subtle"]`,
  `[data-size="lg"]` — so a React prop maps onto the DOM with no string
  concatenation.
- Logical properties only. No `left`, `right`, `margin-left`, `padding-right`.
- No `!important`, no `:global`, no element selectors beyond one level, no
  selector deeper than a class plus a data attribute.
- **A missing token stops the work** (§2). It is never invented in a module.

Banned throughout: CSS-in-JS, Tailwind, any new global stylesheet, and the
`style` prop except for a token-valued custom property.

**The legacy sheets** `tokens.css` (18 KB), `saqeel-components.css` (50 KB),
`saqeel-runtime.css` (170 KB) and `v2-components.css` are **frozen**: nothing is
added to any of them. As each screen migrates, the rules it exclusively owned
are deleted. Shrinking them is a tracked metric of this programme.

---

## 7. Status, always text plus shape

Every status renders as a `StatusPill` carrying a **text label**. A coloured dot
may sit beside the label; it may never be the whole thing. The ten canonical
roles are fixed by the token sheet: `critical`, `major`, `warning`, `compliant`,
`info`, `pending`, `draft`, `onhold`, `completed`, `disabled`. New roles require
a token change request, not a new colour in a component.

**The five status families are derived, not taken from the reference.** The
reference calls its green and red *"supporting accents, not status colours"* —
guidance written for a marketing site, which cannot govern a platform where
severity is legally meaningful. `success`, `error` and `info` are its
pulse-green, coral-red and signal-teal verbatim; `warning` and `major` have no
counterpart and were derived in its saturation idiom, because acid lime cannot
serve as warning — it **is** the primary action, and a warning pill would be
indistinguishable from a CTA.

Two asymmetries in the token sheet exist for measured reasons and must not be
"tidied up":

- **`main` is the graphic fill on dark; `dark` is the graphic fill on light.**
  Warning and info at full strength measure 2.25:1 and 2.41:1 on white — under
  the 3:1 WCAG 1.4.11 requires for a dot, bar or border.
- **Text on a tint uses `darker` (light) / `light` (dark)**, never `main`.

---

## 8. Density, motion, and elevation

- Two densities only: `comfortable` (default) and `compact` (dense grids). They
  are a prop on the primitive, driven by token pairs. No third.
- **Elevation is a hairline.** `--sqx-elevation-1` and `-2` are `inset 0 0 0 1px`
  rings; only `-3` (menu) and `-4` (modal) carry a drop, and it stays tight
  rather than soft. A component that reaches for a shadow to separate a card
  from the canvas is working against the language — use the surface ladder and
  the ring.
- Motion uses `--sqx-duration-*` and `--sqx-ease-*` only, and every animation is
  disabled under `prefers-reduced-motion: reduce`.
- Z-index comes from the token ladder (`--sqx-z-sticky`, `--sqx-z-toast`, …). A
  raw number is a defect.

The full visual grammar every component obeys — control heights, border and
surface behaviour, the rim light, focus, radii, icon sizing, spacing, motion,
and the gradient budget — is
[`WEB-009-component-design-language.md`](./WEB-009-component-design-language.md).

---

## 9. Adding to the system

A new primitive requires, in this order:

1. A tracker entry stating which two existing usages justify it (Rule of Two).
2. Confirmation that no existing primitive plus a variant covers it.
3. Every token it needs verified to already exist in `saqeel.css`. A gap stops
   the work and is raised (§2) — never filled inline.
4. The component folder: `<name>.tsx`, `<name>.module.css`, and its entry in
   `components/saqeel/index.ts`.
5. A row in `brain/web/04-COMPONENT-LEDGER.md`.
6. A rendered example on the internal reference route so the manager can see it.

A "variant" that only one screen will ever use is not a variant. It is that
screen composing primitives differently, and it belongs in
`components/<area>/`.

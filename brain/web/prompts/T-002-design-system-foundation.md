# AGENT PROMPT — T-002 · SAQEEL Design System Foundation

You are building the design system foundation for `apps/web` in the Inspection Platform
repository. This is the single most important task in the programme: every screen rebuilt
after this consumes what you produce here, so a shortcut taken now is repeated four hundred
times later.

---

## 0 · Read before you write anything

In this order:

1. `brain/web/README.md`
2. `brain/web/rules/WEB-000-code-law.md`
3. `brain/web/rules/WEB-002-design-system.md`
4. `brain/web/rules/WEB-003-accessibility.md`
5. `brain/web/rules/WEB-005-performance.md`
6. `brain/web/rules/WEB-006-definition-of-done.md`
7. `brain/web/rules/WEB-007-session-record-and-commits.md`
8. `brain/web/04-COMPONENT-LEDGER.md`
9. The existing `apps/web/src/app/tokens.css` — **read it, do not change it**

Then read §1 below very carefully. Every value in this document is decided. You are
implementing a specification, not designing one. **Do not invent a colour, a size, a
weight, a duration, or a token name that is not in this document.**

---

## 1 · The hard constraints

### 1.1 `tokens.css` is untouchable

`apps/web/src/app/tokens.css` is still consumed by roughly five hundred files. It is being
retired gradually, screen by screen, over the coming weeks.

- **Do not delete it. Do not edit it. Do not reformat it. Do not remove a single token from it.**
- Do not add anything to it either — it is frozen.
- The two systems coexist. The old one shrinks as screens migrate; the new one grows.

### 1.2 Everything you create is prefixed

Every new custom property is prefixed `--sq-`.

Before you start, run a repo-wide search for `--sq-` under `apps/web/src`. The legacy
compatibility shim of that name was removed, so it should return zero hits. **If it returns
any hit, use `--saqeel-` instead throughout** and say so in your report. Do not proceed with
a colliding prefix.

The prefix is what makes the migration legible: any file using `--sq-*` is on the new system,
any file using bare `--surface-*` is not, and a single grep tells you which screens are done.

### 1.3 One file may contain raw values

`saqeel.primitives.css` — the raw ramps — is the only file in the entire application allowed
to contain a hex colour, a pixel value, a font stack, or a shadow definition. Every other
file in the repository, forever, consumes `var(--sq-*)`.

### 1.4 No component mixes systems

A component consumes `--sq-*` tokens **or** legacy tokens. Never both in the same file. A
half-migrated component is worse than an unmigrated one, because nobody can tell by looking.

---

## 2 · What to build

```
apps/web/src/components/saqeel/tokens/
  saqeel.primitives.css      raw ramps — the ONLY file with literal values
  saqeel.semantic.css        colour roles, light theme + dark theme
  saqeel.typography.css      type scale, weights, families, Arabic adjustments
  saqeel.system.css          space, radius, size, elevation, z-index, motion, gradients
  saqeel.tokens.ts           typed token map for TypeScript consumers

apps/web/src/components/saqeel/typography/
  Text.tsx + Text.module.css
  Heading.tsx + Heading.module.css

apps/web/src/components/saqeel/surface/
  Stack.tsx + Stack.module.css
  Cluster.tsx + Cluster.module.css
  Grid.tsx + Grid.module.css
  Card.tsx + Card.module.css
  Panel.tsx + Panel.module.css
  Section.tsx + Section.module.css
  SectionHeader.tsx + SectionHeader.module.css
  Divider.tsx + Divider.module.css

apps/web/src/app/(reference)/design-system/page.tsx   the showcase route
```

The four CSS files are imported **once**, in `apps/web/src/app/layout.tsx`, immediately
**after** the existing `tokens.css` import so the new system cascades last. Do not use CSS
`@import` chains — WEB-005 §3 bans them.

Each CSS file stays under 300 lines. Each component stays under 200 lines.

---

## 3 · `saqeel.primitives.css` — the raw ramps

The only file with literal values. Structure it in these blocks, in this order.

### 3.1 Green — hue 153°, 100% saturation throughout

```
--sq-green-1000: #00150C;   --sq-green-950:  #001F11;
--sq-green-900:  #002D19;   --sq-green-850:  #003D22;
--sq-green-800:  #00512E;   --sq-green-750:  #006B3C;
--sq-green-700:  #00713F;   --sq-green-600:  #008C4E;
--sq-green-500:  #00B364;   --sq-green-400:  #00D97A;
--sq-green-350:  #0FF08A;   --sq-green-300:  #4DFFAE;
--sq-green-200:  #8FFFCB;   --sq-green-100:  #C2FFE2;
--sq-green-050:  #E8FFF3;
```

### 3.2 Ink — dark-theme neutrals, green-tinted

```
--sq-ink-1000: #010A06;   --sq-ink-950: #05100A;
--sq-ink-900:  #081710;   --sq-ink-850: #0C1E14;
--sq-ink-800:  #142A1C;   --sq-ink-700: #1E3527;
--sq-ink-600:  #4E6A56;   --sq-ink-550: #5C7A66;
--sq-ink-400:  #849C8E;   --sq-ink-300: #ABC2B3;
--sq-ink-200:  #C9DCD1;   --sq-ink-100: #E4F1E8;
--sq-ink-tint-success: #0A2416;   --sq-ink-tint-danger:  #260E13;
--sq-ink-tint-warning: #261E05;   --sq-ink-tint-info:    #032027;
--sq-ink-tint-major:   #2B1A0C;
```

### 3.3 Warm — light-theme neutrals

```
--sq-warm-000: #FFFFFF;   --sq-warm-050: #FAF9F6;
--sq-warm-100: #F2F4F0;   --sq-warm-200: #E9EDE8;
--sq-warm-300: #DEE3DC;   --sq-warm-400: #8A9189;
--sq-warm-500: #6F776E;   --sq-warm-900: #404A44;
--sq-warm-950: #59635C;   --sq-warm-1000: #0B1912;
--sq-warm-tint-success: #E0FBED;  --sq-warm-tint-danger:  #FDE9EB;
--sq-warm-tint-warning: #FBF1DC;  --sq-warm-tint-info:    #E0F7FA;
--sq-warm-tint-major:   #FDEEE3;
--sq-warm-tint-success-border: #B6EFD3;
```

### 3.4 Neon — dark values and their light twins

```
--sq-neon-success: #00E87A;   --sq-neon-success-deep: #006B3C;
--sq-neon-warning: #FFC61A;   --sq-neon-warning-deep: #7A4A00;
--sq-neon-danger:  #FF4D5E;   --sq-neon-danger-deep:  #B3101F;
--sq-neon-info:    #00E5FF;   --sq-neon-info-deep:    #00636F;
--sq-neon-live:    #B8FF2E;   --sq-neon-live-deep:    #4A5D08;
--sq-neon-ai:      #B57BFF;   --sq-neon-ai-deep:      #5B3FC7;
--sq-neon-mint:    #00FFA3;   --sq-neon-mint-deep:    #00693F;
--sq-neon-major:   #FF9A4D;   --sq-neon-major-deep:   #98380B;
--sq-neon-onhold:  #E0B84A;
--sq-halo-green:   #083019;   --sq-halo-cyan:  #032A31;
--sq-halo-light:   #E8FBF1;
```

Every colour line carries its measured WCAG ratio as a trailing note in the block comment
that opens each section — **not as an inline comment on the declaration**. One block comment
per section is permitted in this file only, because a token sheet without recorded ratios is
how accessibility debt starts. Format each as `#00E87A 11.8:1 on --sq-ink-950`.

---

## 4 · `saqeel.semantic.css` — the roles

Two blocks: `:root, :root[data-theme="light"]` and `:root[data-theme="dark"]`. Never a raw
value — every declaration references a primitive from §3.

Reuse the existing theme mechanism: the repo already switches on `:root[data-theme]` via
`ThemeScript`. Do not invent a new mechanism.

### 4.1 Surfaces

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--sq-surface-canvas` | `warm-050` | `ink-1000` | the page itself |
| `--sq-surface-default` | `warm-000` | `ink-950` | cards, panels, the default container |
| `--sq-surface-subtle` | `warm-100` | `ink-900` | secondary panels, table headers, inset regions |
| `--sq-surface-sunken` | `warm-200` | `ink-900` | wells, code blocks, disabled fields |
| `--sq-surface-raised` | `warm-000` | `ink-850` | menus, popovers, modals, tooltips, drawers |
| `--sq-surface-accent` | `warm-tint-success` | `ink-tint-success` | soft green highlight panel |
| `--sq-surface-inverse` | `warm-1000` | `ink-100` | high-contrast blocks, print headers |
| `--sq-surface-overlay` | `rgba(11,25,18,.52)` | `rgba(1,10,6,.68)` | modal scrim |

`--sq-surface-overlay` is the one place an `rgba()` may appear outside the primitives file,
because a scrim is inherently an alpha value. Define it in the semantic file and nowhere else.

### 4.2 Text

| Token | Light | Dark |
| --- | --- | --- |
| `--sq-text-primary` | `warm-1000` (18.1:1) | `ink-100` (16.6:1) |
| `--sq-text-secondary` | `warm-900` (9.2:1) | `ink-300` (10.2:1) |
| `--sq-text-muted` | `warm-950` (6.2:1) | `ink-400` (6.6:1) |
| `--sq-text-disabled` | `warm-500` (4.6:1) | `ink-550` (4.1:1) |
| `--sq-text-inverse` | `warm-000` | `ink-1000` |
| `--sq-text-on-action` | `warm-000` | `green-1000` |
| `--sq-text-link` | `green-800` (9.5:1) | `green-300` (15.0:1) |
| `--sq-text-link-hover` | `green-900` | `green-200` |
| `--sq-text-accent` | `green-800` | `neon-success` |
| `--sq-text-success` | `neon-success-deep` | `neon-success` |
| `--sq-text-warning` | `neon-warning-deep` | `neon-warning` |
| `--sq-text-danger` | `neon-danger-deep` | `neon-danger` |
| `--sq-text-info` | `neon-info-deep` | `neon-info` |

`--sq-text-muted` is the floor. Nothing in the application is ever quieter than it.

### 4.3 Borders

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--sq-border-subtle` | `warm-300` | `ink-800` | card edges, dividers, table rules |
| `--sq-border-default` | `warm-300` | `ink-700` | default control outline |
| `--sq-border-strong` | `warm-400` (3.2:1) | `ink-600` (3.2:1) | anything that must meet 1.4.11 |
| `--sq-border-input` | `warm-500` (4.6:1) | `ink-550` (4.1:1) | text inputs, selects |
| `--sq-border-accent` | `green-800` | `green-800` | active/selected boundaries |
| `--sq-border-focus` | `green-800` | `neon-success` | the focus ring colour |

### 4.4 Actions — three tiers, plus destructive

```
--sq-action-primary-bg        light green-800   dark green-400
--sq-action-primary-hover     light green-850   dark green-350
--sq-action-primary-active    light green-900   dark green-500
--sq-action-primary-text      light warm-000    dark green-1000
--sq-action-primary-gradient  → --sq-gradient-cta (see §7)

--sq-action-secondary-bg      transparent (both)
--sq-action-secondary-border  light warm-400    dark ink-600
--sq-action-secondary-text    light warm-1000   dark ink-100
--sq-action-secondary-hover   light warm-100    dark ink-900

--sq-action-tertiary-text     light green-800   dark green-300
--sq-action-tertiary-hover    light warm-tint-success   dark ink-tint-success

--sq-action-danger-bg         light neon-danger-deep    dark neon-danger
--sq-action-danger-hover      light #8F0C18             dark #FF6B78
--sq-action-danger-text       light warm-000            dark green-1000

--sq-action-disabled-bg       light warm-200    dark ink-900
--sq-action-disabled-text     light warm-500    dark ink-550
```

Destructive actions are **never** a gradient. Add nothing to make them one.

### 4.5 Status — ten canonical roles, three tokens each

Roles: `critical` `major` `warning` `compliant` `info` `pending` `draft` `onhold`
`completed` `disabled`.

Each gets `--sq-status-<role>` (the base/text colour), `--sq-status-<role>-soft` (the pill
fill), `--sq-status-<role>-on-soft` (the text on that fill).

| Role | Light base / soft / on-soft | Dark base / soft / on-soft |
| --- | --- | --- |
| critical | `neon-danger-deep` / `warm-tint-danger` / `neon-danger-deep` | `neon-danger` / `ink-tint-danger` / `neon-danger` |
| major | `neon-major-deep` / `warm-tint-major` / `neon-major-deep` | `neon-major` / `ink-tint-major` / `neon-major` |
| warning | `neon-warning-deep` / `warm-tint-warning` / `neon-warning-deep` | `neon-warning` / `ink-tint-warning` / `neon-warning` |
| compliant | `neon-success-deep` / `warm-tint-success` / `neon-success-deep` | `neon-success` / `ink-tint-success` / `neon-success` |
| info | `neon-info-deep` / `warm-tint-info` / `neon-info-deep` | `neon-info` / `ink-tint-info` / `neon-info` |
| pending | `warm-950` / `warm-100` / `warm-950` | `ink-300` / `ink-900` / `ink-300` |
| draft | `warm-950` / `warm-100` / `warm-950` | `ink-400` / `ink-900` / `ink-400` |
| onhold | `neon-warning-deep` / `warm-tint-warning` / `neon-warning-deep` | `neon-onhold` / `ink-tint-warning` / `neon-onhold` |
| completed | `green-800` / `warm-tint-success` / `green-800` | `green-300` / `ink-tint-success` / `green-300` |
| disabled | `warm-500` / `warm-200` / `warm-500` | `ink-400` / `ink-850` / `ink-400` |

Then four semantic aliases so application code can speak in outcomes rather than in the
inspection domain's vocabulary:

```
--sq-status-success → --sq-status-compliant
--sq-status-danger  → --sq-status-critical
(warning and info already exist under their own names)
```

### 4.6 Data visualisation

Eight series, hue-separated so they survive a greyscale test:

```
light: green-800 · neon-info-deep · neon-live-deep · neon-warning-deep ·
       neon-danger-deep · neon-ai-deep · #12557F · #00693F
dark:  neon-success · neon-info · neon-live · neon-warning ·
       neon-danger · neon-ai · #6EC8FF · green-300
```

Expose as `--sq-chart-1` … `--sq-chart-8`, plus `--sq-chart-grid` and `--sq-chart-axis`.

---

## 5 · `saqeel.typography.css` — one scale, no exceptions

This is the part that makes every heading in the application identical. There are **twelve
type roles and no thirteenth**. If a screen appears to need one, it does not — it needs an
existing role.

Each role exposes five tokens plus one `font` shorthand:

```
--sq-text-<role>-size
--sq-text-<role>-line
--sq-text-<role>-weight
--sq-text-<role>-tracking
--sq-text-<role>-family
--sq-text-<role>          the `font:` shorthand — weight size/line family
```

| Role | Size | Line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | 2.5rem | 1.1 | 650 | -0.03em | login, hero, single-number screens |
| `title` | 1.875rem | 1.2 | 650 | -0.025em | the page `h1` — exactly one per route |
| `heading` | 1.375rem | 1.3 | 650 | -0.02em | section `h2` |
| `subheading` | 1.0625rem | 1.4 | 600 | -0.01em | card `h3`, panel titles |
| `body-lg` | 1rem | 1.6 | 400 | 0 | intro paragraphs, empty-state copy |
| `body` | 0.9375rem | 1.6 | 400 | 0 | **the default paragraph** |
| `body-strong` | 0.9375rem | 1.6 | 600 | 0 | emphasis inside body copy |
| `label` | 0.8125rem | 1.4 | 600 | 0.01em | form labels, button text, tabs |
| `caption` | 0.78125rem | 1.45 | 400 | 0 | helper text, metadata, timestamps |
| `overline` | 0.6875rem | 1.3 | 650 | 0.12em | KPI labels, section eyebrows — uppercase |
| `metric` | 1.75rem | 1.15 | 650 | -0.02em | KPI values — `font-variant-numeric: tabular-nums` |
| `code` | 0.78125rem | 1.6 | 500 | 0 | CR numbers, ids, hashes — mono family |

Families:

```
--sq-font-sans:  the existing self-hosted IBM Plex Sans Arabic stack (copy it from tokens.css, do not re-declare the @font-face)
--sq-font-mono:  ui-monospace, "SF Mono", Menlo, Consolas, monospace
```

Weights: `--sq-weight-regular: 400` · `-medium: 500` · `-semibold: 600` · `-bold: 650`.
There is no 700 and no 800. Four weights, and the font files already shipped cover them.

**Arabic.** Arabic script needs more leading than Latin at the same size. Add one block:

```css
:lang(ar) {
  --sq-text-title-line: 1.35;
  --sq-text-heading-line: 1.45;
  --sq-text-body-line: 1.8;
  --sq-text-label-line: 1.55;
  --sq-text-caption-line: 1.6;
}
```

This is a language adjustment, not a direction flip, and is permitted. Do not add any other
`:lang()` rule.

Also define `--sq-numeric-tabular: tabular-nums` and apply it to `metric` and `code`, so
figures in a column never jitter.

---

## 6 · `saqeel.system.css` — space, radius, size, elevation, z, motion

### 6.1 Spacing — a 4px base scale, plus semantic aliases

```
--sq-space-0:  0        --sq-space-1:  0.125rem  (2px)
--sq-space-2:  0.25rem  (4)   --sq-space-3:  0.5rem    (8)
--sq-space-4:  0.75rem  (12)  --sq-space-5:  1rem      (16)
--sq-space-6:  1.25rem  (20)  --sq-space-7:  1.5rem    (24)
--sq-space-8:  2rem     (32)  --sq-space-9:  2.5rem    (40)
--sq-space-10: 3rem     (48)  --sq-space-11: 4rem      (64)
--sq-space-12: 5rem     (80)  --sq-space-13: 6rem      (96)
```

Then the aliases that guarantee identical spacing across screens. **Application code uses
these, not the numbers.**

```
--sq-inset-card:        --sq-space-6     padding inside a Card
--sq-inset-panel:       --sq-space-7     padding inside a Panel
--sq-inset-control:     --sq-space-4     padding inside a button/input
--sq-inset-cell:        --sq-space-4     table cell padding
--sq-inset-cell-compact: --sq-space-3    dense grid cell padding
--sq-stack-tight:       --sq-space-3     gap between tightly related items
--sq-stack-default:     --sq-space-5     gap between items in a group
--sq-stack-loose:       --sq-space-8     gap between sections
--sq-stack-section:     --sq-space-10    gap between major page regions
--sq-gutter:            --sq-space-5     grid and cluster gap
--sq-page-inline:       --sq-space-8     page horizontal padding (desktop)
--sq-page-inline-sm:    --sq-space-5     page horizontal padding (mobile)
--sq-page-block:        --sq-space-8     page vertical padding
```

### 6.2 Radius

```
--sq-radius-xs: 0.25rem   --sq-radius-sm: 0.375rem  --sq-radius-md: 0.5625rem
--sq-radius-lg: 0.75rem   --sq-radius-xl: 1rem      --sq-radius-2xl: 1.375rem
--sq-radius-full: 999px
```

Semantic aliases, which is what components use:

```
--sq-radius-control → md     buttons, inputs, selects
--sq-radius-card    → lg     cards, panels, modals
--sq-radius-surface → xl     large containers, hero panels
--sq-radius-pill    → full   badges, pills, avatars
--sq-radius-inline  → xs     inline code, small chips
```

### 6.3 Sizing

```
--sq-control-h-sm: 2rem      --sq-control-h-md: 2.375rem   --sq-control-h-lg: 2.75rem
--sq-touch-target: 2.75rem   (44px — the field minimum, never reduced on mobile surfaces)
--sq-icon-sm: 1rem   --sq-icon-md: 1.125rem   --sq-icon-lg: 1.375rem   --sq-icon-xl: 1.75rem
--sq-row-h: 3rem     --sq-row-h-compact: 2.5rem
--sq-sidebar-w: 15.5rem   --sq-sidebar-w-collapsed: 4rem   --sq-topbar-h: 3.5rem
--sq-container-max: 90rem   --sq-prose-max: 68ch
--sq-border-width-hair: 1px   --sq-border-width-thick: 2px
--sq-focus-ring-width: 2px    --sq-focus-ring-offset: 2px
```

### 6.4 Elevation — five rungs, nothing between them

Shadows differ per theme (a dark theme needs deeper, tighter shadows plus a subtle rim
light). Define `--sq-elevation-0` through `--sq-elevation-4` in both blocks, and semantic
aliases: `--sq-shadow-card → 1`, `--sq-shadow-card-hover → 2`, `--sq-shadow-menu → 3`,
`--sq-shadow-modal → 4`.

### 6.5 Z-index ladder

```
--sq-z-base: 0        --sq-z-raised: 10     --sq-z-sticky: 100
--sq-z-drawer: 200    --sq-z-modal: 300     --sq-z-popover: 400
--sq-z-toast: 500     --sq-z-tooltip: 600
```

A raw z-index number anywhere in the application is a defect.

### 6.6 Motion

```
--sq-duration-instant: 100ms   --sq-duration-fast: 160ms
--sq-duration-base: 240ms      --sq-duration-slow: 360ms
--sq-duration-sweep: 850ms     --sq-duration-flow: 5500ms
--sq-duration-drift: 22000ms

--sq-ease-standard:   cubic-bezier(.2,0,0,1)
--sq-ease-decelerate: cubic-bezier(0,0,0,1)
--sq-ease-accelerate: cubic-bezier(.3,0,1,1)
--sq-ease-sweep:      cubic-bezier(.3,0,.2,1)
```

---

## 7 · Gradients and directional motion

### 7.1 The direction tokens — declared once, consumed everywhere

CSS has no logical gradient direction; there is no `to inline-end`. So direction is a token
pair, declared in exactly two places and nowhere else:

```css
:root {
  --sq-flow-angle: 104deg;
  --sq-flow-from: 0% 50%;
  --sq-flow-to: 100% 50%;
  --sq-sweep-start: -140%;
  --sq-sweep-end: 240%;
  --sq-sweep-skew: -18deg;
}

:root:dir(rtl) {
  --sq-flow-angle: 256deg;
  --sq-flow-from: 100% 50%;
  --sq-flow-to: 0% 50%;
  --sq-sweep-start: 240%;
  --sq-sweep-end: -140%;
}
```

104° is 90° (inline-end) plus a 14° tilt. 256° is its mirror.

**This is the only `dir()` / `[dir]` rule permitted in the application.** Add nothing else
that keys off direction. See §11 for the rulebook amendment you must also write.

### 7.2 The gradients

Every flowing gradient repeats its first colour at 100% over a 220% background so the loop
is seamless. A two-stop gradient snaps on restart; a three-stop one does not.

```
--sq-gradient-cta        linear-gradient(var(--sq-flow-angle), green-400, neon-info, green-400)
                         light theme override: (green-850, green-700, green-850)
--sq-gradient-signal     linear-gradient(var(--sq-flow-angle), neon-success, neon-live, neon-success)
--sq-gradient-edge       linear-gradient(var(--sq-flow-angle), transparent, green-400, neon-info, transparent)
--sq-gradient-halo       dark:  two radial glows (halo-green at 15% -20%, halo-cyan at 85% -10%) over ink-1000
                         light: linear-gradient(180deg, halo-light 0%, warm-050 60%)
--sq-gradient-flow-size  220% 100%
--sq-gradient-halo-size  180% 180%
```

`--sq-gradient-cta` resolves per theme, so a component writes
`background: var(--sq-gradient-cta)` once and gets the right gradient in both.

### 7.3 The keyframes

Define exactly three, in `saqeel.system.css`:

```css
@keyframes sq-flow  { from { background-position: var(--sq-flow-from); }
                      to   { background-position: var(--sq-flow-to); } }

@keyframes sq-sweep { from { transform: translateX(var(--sq-sweep-start)) skewX(var(--sq-sweep-skew)); }
                      to   { transform: translateX(var(--sq-sweep-end))   skewX(var(--sq-sweep-skew)); } }

@keyframes sq-drift { 0%   { background-position: var(--sq-flow-from); }
                      50%  { background-position: var(--sq-flow-to); }
                      100% { background-position: var(--sq-flow-from); } }
```

Only `background-position` and `transform` are animated. Both are compositor-only, which is
why this costs nothing on the field phones.

### 7.4 Reduced motion — non-negotiable

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

The gradient stays; the motion stops. This is the one `!important` permitted in the
application, and it lives only in this block. WEB-003 §8.

### 7.5 The motion budget — encode it in the reference route's documentation

- Flow: 5.5 s, linear, infinite. Under 4 s it reads as a progress bar.
- Sweep: 0.85 s, once, **on hover only**. Never on load.
- Drift: 22 s, ease-in-out, infinite. Ambient backgrounds only.
- **One animated gradient per screen** — the hero CTA *or* the background halo, never both.
- Never a gradient behind body text, a table, or a form.

---

## 8 · `saqeel.tokens.ts` — the typed map

So TypeScript callers can write `text.heading` and `radius.lg` and get compile-time safety,
and so a token name can never be mistyped into silence.

```ts
export const text = {
  display: "var(--sq-text-display)",
  title: "var(--sq-text-title)",
  heading: "var(--sq-text-heading)",
  subheading: "var(--sq-text-subheading)",
  bodyLarge: "var(--sq-text-body-lg)",
  body: "var(--sq-text-body)",
  bodyStrong: "var(--sq-text-body-strong)",
  label: "var(--sq-text-label)",
  caption: "var(--sq-text-caption)",
  overline: "var(--sq-text-overline)",
  metric: "var(--sq-text-metric)",
  code: "var(--sq-text-code)",
} as const;

export type TextRole = keyof typeof text;
```

Do the same for `space`, `radius`, `elevation`, `zIndex`, `duration`, `easing`, `gradient`,
and `color` (grouped `color.surface.*`, `color.text.*`, `color.border.*`, `color.action.*`,
`color.status.*`). Export a union type for each.

Keep the file under 300 lines. If it exceeds that, split by group into a `tokens/` folder
with one file per group and re-export from `saqeel.tokens.ts`.

This map is for typed lookup and for the reference route. It is **not** a licence to write
inline styles — CSS Modules remain the styling mechanism (WEB-002 §6).

---

## 9 · The components

All are Server Components. None carries `"use client"`. None accepts a `className` or
`style` prop (WEB-002 §4.5). Each has a colocated `.module.css` consuming only `--sq-*`
tokens. Each under 200 lines. No comments.

### `Text`

```ts
interface TextProps {
  variant?: TextRole;            // default "body"
  tone?: "primary" | "secondary" | "muted" | "disabled" | "accent" | "success" | "warning" | "danger" | "info" | "inverse";
  as?: "p" | "span" | "div" | "dd" | "dt" | "figcaption";
  align?: "start" | "center" | "end";
  truncate?: boolean | number;   // number = line clamp
  numeric?: boolean;             // tabular figures
  children: React.ReactNode;
}
```

### `Heading`

```ts
interface HeadingProps {
  level: 1 | 2 | 3 | 4;                          // the semantic level — always correct
  variant?: "display" | "title" | "heading" | "subheading";  // the visual size — defaults to match level
  tone?: "primary" | "secondary" | "accent" | "inverse";
  children: React.ReactNode;
}
```

Level and variant are **separate on purpose**: a page may need an `h2` that looks like a
subheading without breaking the document outline. Defaulting variant from level means the
correct thing happens when nobody thinks about it.

### `Stack` · `Cluster` · `Grid`

```ts
type Gap = "none" | "tight" | "default" | "loose" | "section";

interface StackProps   { gap?: Gap; align?: "start" | "center" | "end" | "stretch"; as?: "div" | "ul" | "ol" | "section"; children: React.ReactNode }
interface ClusterProps { gap?: Gap; align?: "start" | "center" | "baseline"; justify?: "start" | "center" | "end" | "between"; wrap?: boolean; children: React.ReactNode }
interface GridProps    { columns?: 2 | 3 | 4 | 6 | 12 | "auto"; gap?: Gap; minItemWidth?: "sm" | "md" | "lg"; children: React.ReactNode }
```

**These three are the only source of spacing between elements in the entire application.**
No component ever sets its own outer margin. `Grid` with `columns="auto"` uses
`repeat(auto-fit, minmax(var(--sq-grid-min-<size>), 1fr))`.

### `Card` · `Panel` · `Section` · `SectionHeader` · `Divider`

```ts
interface CardProps {
  tone?: "default" | "subtle" | "accent" | "raised";
  elevation?: "flat" | "raised" | "floating";
  interactive?: boolean;      // hover elevation + focus ring; requires the caller to wrap in a Link or button
  accentEdge?: boolean;       // the 2px animated --sq-gradient-edge hairline on the top
  padding?: "none" | "compact" | "default" | "loose";
  children: React.ReactNode;
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  level?: 1 | 2 | 3;
  actions?: React.ReactNode;
  children?: never;
}
```

`SectionHeader` is what guarantees every section title in the app is identical: same size,
same weight, same gap to its description, same alignment of its action slot.

---

## 10 · The reference route

`apps/web/src/app/(reference)/design-system/page.tsx` — a Server Component under 40 lines
that composes named section components (each under 200 lines, in
`components/design-system/`).

It renders, in this order:

1. Every colour primitive ramp, with the token name and hex under each swatch
2. Every semantic role, grouped: surfaces, text, borders, actions, status, chart
3. Every type role, rendered at its real size, with the token name and its metrics
4. The spacing scale, drawn to scale, with the semantic aliases labelled
5. The radius scale and elevation ladder
6. Every gradient, animated, with a live LTR/RTL toggle
7. Live examples of `Card`, `Panel`, `SectionHeader`, `Stack`, `Cluster`, `Grid`
8. The ten status roles as pills, both themes

It must work in light and dark, English and Arabic. This is the page that gets opened in
the review meeting, so it is a real page, not a scratchpad.

---

## 11 · Rulebook amendment you must write

Add to `brain/web/rules/WEB-001-architecture-and-nextjs.md` §9, as a clearly-bounded named
exception:

> **The one direction exception.** CSS provides no logical equivalent of a gradient
> direction — there is no `to inline-end`. Direction is therefore expressed as a token pair
> declared exactly once, at `:root` and `:root:dir(rtl)`, in
> `components/saqeel/tokens/saqeel.system.css`: `--sq-flow-angle`, `--sq-flow-from`,
> `--sq-flow-to`, `--sq-sweep-start`, `--sq-sweep-end`. Every gradient in the application
> consumes those tokens. No other `dir()` or `[dir]` rule may exist anywhere in
> `apps/web/src`, and no component may declare its own directional override.

Also add a row to `brain/web/04-COMPONENT-LEDGER.md` for every component you create, and
record the decisions in your task record.

---

## 12 · Verification

Before you report done:

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run build` — succeeds; record the CSS delta the new sheets add
- [ ] `tokens.css` is byte-identical to before (`git diff --stat` shows it untouched)
- [ ] Zero comments in any `.tsx` or `.ts` file you wrote; the only comments anywhere are
      the per-section block comments in `saqeel.primitives.css`
- [ ] Zero `any`, zero `let` in `.tsx`, zero `className`/`style` props on any primitive
- [ ] No literal hex, px, rem, font stack, shadow, or z-index outside `saqeel.primitives.css`
      (`saqeel.system.css` may hold the rem/px scale values; nothing else may)
- [ ] Every component is a Server Component
- [ ] Every file within its line budget
- [ ] axe-core: zero violations on `/design-system` in light and dark
- [ ] Manual pass: keyboard through the reference route, 200% zoom, 320 px width,
      Arabic/RTL (gradients reverse), reduced motion (all animation stops, gradients remain)
- [ ] Contrast spot-check: `--sq-text-muted` on `--sq-surface-subtle` in both themes;
      `--sq-border-strong` on `--sq-surface-default` in both themes. Report the measured
      numbers.

## 13 · Close the task

Per `brain/web/rules/WEB-007-session-record-and-commits.md`:

1. Set T-002 to `done` in `brain/web/03-REDESIGN-TRACKER.md`, move the next item into NOW
2. Write `brain/web/sessions/2026-08/<YYYY-MM-DD>-T-002-design-system-foundation.md`
3. Index it in `brain/web/02-SESSION-LOG.md`
4. Refresh `brain/web/01-PROJECT-STATUS.md` and `04-COMPONENT-LEDGER.md`

Then **never commit**. Print the changed files grouped by action, and propose exactly one
Conventional Commit line, ≤ 72 characters.

---

## 14 · Before you write a single line

Produce and show me:

1. The exact file list you will create, with the expected line count of each
2. The complete list of `--sq-*` token names you will define, grouped by file
3. The result of the `--sq-` prefix collision search
4. Any place in §3–§9 above where you believe the specification is ambiguous or wrong

**Then stop and wait for confirmation.** Do not begin implementation until I reply.

This is required by WEB-006 §2 step 3, and it exists because a token sheet is the hardest
thing in the codebase to change once four hundred files depend on it.

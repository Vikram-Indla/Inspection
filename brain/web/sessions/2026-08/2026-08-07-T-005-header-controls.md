# 2026-08-07 · T-005 — Header control family

`task: T-005` · `status: blocked` · `duration: 2h`
`rules applied: WEB-002 §2, WEB-003, WEB-008, WEB-009`

---

## Goal

Rebuild the topbar's controls as ten reusable SAQEEL primitives.

## Outcome

**Two of ten delivered. Eight blocked on 13 missing tokens.** WEB-002 §2 and
WEB-008 §2 are explicit: a missing token stops the work and is raised; it is
never added inline while building a component. The task prompt repeats it —
"report the gap and stop on it — do not add it".

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/saqeel/icon-button/icon-button.tsx` | created | 41 |
| `components/saqeel/icon-button/icon-button.module.css` | created | 47 |
| `components/saqeel/kbd/kbd.tsx` | created | 9 |
| `components/saqeel/kbd/kbd.module.css` | created | 13 |
| `components/saqeel/index.ts` | modified | +4 exports |
| `components/app-shell/shell-topbar/shell-theme-toggle.tsx` | modified | 86 → 78 |
| `components/app-shell/shell-mobile-nav/shell-mobile-nav.tsx` | modified | 83 → 84 |
| `components/app-shell/shell-mobile-nav/shell-mobile-nav.module.css` | modified | 74 → 52 |

## The gap block — 13 tokens

Every one blocks at least one component. Declarations are given exactly as they
would be added to the `saqeel.css` primitives and system blocks. **None of these
were added.**

### Sizing — no colour, no contrast to measure

```css
--sqx-control-pad-icon: calc(var(--sqx-inset-control) + var(--sqx-icon-md) + var(--sqx-space-3));
--sqx-menu-pad: 0.375rem;
--sqx-menu-row-h: 2rem;
--sqx-menu-max-h: 20rem;
--sqx-menu-fade: 1.5rem;
--sqx-day-cell: 2rem;
--sqx-switch-track-w: 2.25rem;
--sqx-switch-track-h: 1.25rem;
--sqx-switch-thumb: 1rem;
--sqx-segmented-pad: 0.1875rem;
--sqx-search-w: 22rem;
--sqx-preset-col-w: 9rem;
--sqx-avatar-sm: 1.5rem;
--sqx-avatar-md: 1.75rem;
--sqx-avatar-lg: 2.5rem;
--sqx-avatar-status: 0.5rem;
--sqx-badge-size: 1rem;
--sqx-kbd-min-w: 1.25rem;
```

`--sqx-menu-pad: 0.375rem` and `--sqx-menu-row-h: 2rem` are WEB-009 §8's own
worked example — "32px rows inside 6px of outer padding". The rest are the raw
values the T-005 prompt states.

**Why these could not be borrowed from existing tokens.** Several have an exact
numeric match in the spacing ramp — `--sqx-space-7` is 1.5rem, `--sqx-space-9`
is 2.5rem, `--sqx-space-6` is 1.25rem. Using a *spacing* token as a *size* is
precisely the drift WEB-002 §2 exists to stop: the first screen that needs a
2.5rem avatar and reaches for `--sqx-space-9` teaches the next one to do the
same, and the ramp stops meaning anything. `--sqx-icon-xl` (1.75rem) matching the
`md` avatar is the same trap wearing a size-token costume.

### `--sqx-rim-light` — exists, but not in the shape WEB-009 §4 requires

Declared today as a **colour**, single value, no theme variance:

```css
--sqx-rim-light: rgba(143, 255, 203, 0.06);
```

WEB-009 §4 specifies a **box-shadow**, per theme:

```css
dark:  --sqx-rim-light: inset 0 1px 0 rgb(255 255 255 / 0.045);
light: --sqx-rim-light: inset 0 1px 0 rgb(255 255 255 / 0.85);
```

These cannot both be true. The current colour form is consumed by
`--sqx-elevation-1…4`, which compose `inset 0 1px 0 var(--sqx-rim-light)`
themselves — so redefining it as a shadow breaks all four elevation tokens.

**Recommendation, not a decision:** keep the colour primitive and rename it
`--sqx-rim-tint`, then add `--sqx-rim-light` as the per-theme shadow WEB-009
names. That is a change request against `saqeel.css` plus a four-line edit to the
elevation tokens, and it is not something to do inside a component task.

Contrast: a rim light is a 1px inner highlight, not text or a UI boundary, so
neither 4.5:1 nor 3:1 applies. Measured for the record — white at 0.045 alpha on
`--sqx-surface-raised` dark (`#0C1E14`) composites to `#1A2620`, a separation of
**1.14:1** from the surface: visible as a lit edge, invisible as a border, which
is the intent.

## What each gap blocks

| Component | Blocked by |
| --- | --- |
| `menu-surface` | `--sqx-menu-pad`, `--sqx-menu-row-h`, `--sqx-menu-max-h`, `--sqx-menu-fade` |
| `text-input` | `--sqx-control-pad-icon` (leading-icon variant only) |
| `search-field` | `menu-surface`, `--sqx-search-w`, `--sqx-kbd-min-w` |
| `select` | `menu-surface` |
| `date-range-picker` | `menu-surface`, `--sqx-day-cell`, `--sqx-preset-col-w` |
| `switch` | `--sqx-switch-track-w`, `--sqx-switch-track-h`, `--sqx-switch-thumb` |
| `segmented-control` | `--sqx-segmented-pad`, `--sqx-rim-light` shape |
| `avatar` | `--sqx-avatar-sm/md/lg`, `--sqx-avatar-status` |
| `icon-button` | **none — delivered.** Badge omitted, needs `--sqx-badge-size` |
| `kbd` | **none — delivered.** `min-inline-size` omitted, needs `--sqx-kbd-min-w` |

`menu-surface` alone blocks five components, which is why the prompt ordered it
first and why almost nothing downstream could proceed.

## Decisions

**1. `IconButton` requires its accessible name in the type.** `label: string` is
non-optional and the component writes `aria-label` itself, so a caller cannot
ship an unlabelled icon button. `className` and `style` are `Omit`-ed from the
native props, so there is no escape hatch (WEB-002 §4.5). `forwardRef` is present
because callers need the DOM node — the drawer trigger focuses it on close.

**2. IconButton is transparent by default.** No border, no fill, per WEB-009's
note that a border on every icon button is the largest source of toolbar noise.
Hover fills `--sqx-surface-subtle` and lifts the icon to `--sqx-text-primary`;
`aria-pressed="true"` or `data-active` gives `--sqx-surface-accent` +
`--sqx-text-accent`. The icon stays `--sqx-icon-md` at every size (WEB-009 §7).

**3. The barrel already owns five of the ten names.** `components/saqeel/index.ts`
exports `Select`, `Switch`, `SegmentedControl`, `Avatar` and `DateRangePicker`
from the **legacy** `inputs/`/`data/` tree. The new primitives cannot be exported
under those names without a collision. Not resolved here because nothing was
built that collides — but T-005's completion must either retire the legacy
exports first or the barrel will not compile. Recorded so it is not discovered
mid-build.

## Verification

- [x] `npm run typecheck` — zero errors
- [x] Zero gradients in the delivered family (WEB-009 §11)
- [x] No component builds its own popover — neither delivered component has
      `position: absolute` or `fixed` (WEB-009 §13)
- [x] No `className` or `style` prop on either primitive
- [x] Both are Server Components; neither carries `"use client"`
- [ ] `npm run lint` · `npm run gates` — **scripts do not exist** (T-000)
- [ ] **Measured control heights — NOT DONE.** WEB-009 §1 and the prompt require
      the measured pixel height of every topbar control. `--sqx-control-h-md` is
      `2.375rem`, so 38 px at a 16 px root, and `IconButton` is a square of that
      token — but *measured* means measured in a browser, and the app does not
      run here. Stated as not done rather than asserted from the CSS.
- [ ] **Keyboard pass, RTL, light/dark, reduced motion, axe — NOT RUN.** Same
      blocker, unchanged since T-002: Windows Application Control blocks
      `@next/swc-win32-x64-msvc`, so `next dev` serves nothing.

## Numbers

```
files created            4 (2 components, 2 modules)
source lines added       110
client islands added     0  — both primitives are Server Components
shell island count       9  (unchanged)
saqeel.css               unchanged, 801 lines — no token added
legacy CSS deleted       22 lines from shell-mobile-nav.module.css,
                         absorbed by the IconButton primitive
```

### Measurement request — for the human

```
Measure — routes: /dashboard, /admin/access
  npm run build   → First Load JS per route
  In the browser  → computed pixel height of every topbar control;
                    all must equal --sqx-control-h-md (2.375rem / 38px)
```

## Retirement

Nothing marked. The legacy `inputs/Select`, `inputs/Choice` (Switch),
`inputs/SegmentedControl`, `data/Avatar` and `inputs/DateRangePicker` become
retirement candidates when T-005 completes — not before, because their
replacements do not exist yet.

## Parked

- The `--sqx-rim-light` name collision and the `--sqx-rim-tint` rename proposal.
- Barrel name collisions for the five legacy exports.
- `IconButton` badge and `Kbd` min-width, each one token away.

## Blocked / open questions

- **13 tokens.** The single blocker. One change request unblocks eight
  components; T-005 then completes in one pass.
- **`--sqx-rim-light` needs a decision, not just a value** — redefining it as a
  shadow breaks `--sqx-elevation-1…4`.
- **WEB-002 §2 points at the wrong path.** It says `apps/web/src/saqeel.css`; the
  file is at `apps/web/src/app/saqeel.css`. Cosmetic, but the rulebook is the
  reference and it is currently wrong.
- **The app still does not run here.** Every runtime check in WEB-008 §3 is
  unperformed, including the measured control heights WEB-009 §1 demands.

## Proposed commit

```
feat(saqeel): add icon-button and kbd primitives
```

## Next

Add the 13 tokens, decide the `--sqx-rim-light` shape, then finish T-005 —
`menu-surface` first, since it blocks five of the eight.

# 2026-08-07 · T-002 — SAQEEL design system, one stylesheet

`task: T-002` · `status: done` · `duration: 4h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-005, WEB-007`

---

## Goal

Build the complete SAQEEL design system — tokens, base layer and every component
class — as exactly one CSS file at `apps/web/src/app/saqeel.css`, imported once, so a
visual change is made in one file and cannot drift per screen.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/src/app/saqeel.css` | created | 0 → 2050 |
| `apps/web/src/app/layout.tsx` | modified | 75 → 76 (one import line) |
| `brain/web/rules/WEB-002-design-system.md` | modified | 241 → 236 (§6 replaced) |
| `brain/web/rules/WEB-001-architecture-and-nextjs.md` | modified | 244 → 254 (§9 direction exception) |
| `brain/web/03-REDESIGN-TRACKER.md` | modified | 158 → 213 |
| `brain/web/02-SESSION-LOG.md` | modified | 13 → 14 |
| `brain/web/01-PROJECT-STATUS.md` | modified | 97 → 104 |
| `brain/web/sessions/2026-08/2026-08-07-T-002-design-system.md` | created | 0 → this file |

`apps/web/src/app/tokens.css` — **untouched**, verified by empty `git diff`.
Nothing under `apps/web/src/components/` was created or modified.

## Decisions

**1. The prefix is `--saqeel-` / `.saqeel-`, not `--sq-`.** The brief mandated
`--sq-` unless a pre-existing hit was found. `grep -r -- "--sq-" apps/web/src`
returns 25 hits across 10 files, seven of which are live custom properties still
consumed at runtime (`--sq-nav-gap`, `--sq-nav-pad-inline`, `--sq-nav-font`,
`--sq-nav-icon-size`, `--sq-nav-group-font`, `--sq-nav-group-color` in
`saqeel-runtime.css`; `--sq-map-loading-label` set by `GeoMap.tsx`). `.sq-*` is
worse — 804 class hits. The fallback prefix applies to custom properties, classes,
**layer names and keyframe names**: keyframe identifiers share one global
namespace with the legacy sheet's `sq-spin` / `sq-pulse` / `sq-shimmer` /
`sq-halo`, so a mixed vocabulary would have been a collision waiting to happen.
One prefix, everywhere. The only pre-existing `.saqeel-*` classes are
`.saqeel-state` and `.saqeel-reference`; neither collides with the 59 classes
here.

**2. The legacy sheets outrank `saqeel.css` and that is deliberate — for now.**
`saqeel-runtime.css`, `saqeel-components.css` and `v2-components.css` are
unlayered, and unlayered rules beat every cascade layer regardless of import
order. So the new sheet cannot fight the old one on specificity, which is exactly
why the visual diff of this task is zero. It also means a migrated screen will
need the legacy rule *deleted*, not overridden. Wrapping the legacy sheets in a
`legacy` layer declared before `saqeel.*` would invert this — parked, because it
changes cascade behaviour application-wide and needs its own regression pass.

**3. Variants are data attributes, not modifier classes.** `data-variant`,
`data-tone`, `data-size`, `data-status`, `data-gap`, `data-density`,
`data-elevation`, `data-padding`. A React prop maps 1:1 onto the DOM with no
string concatenation and no `clsx`. It also keeps specificity flat: every rule in
`saqeel.components` is one class plus attributes.

**4. Direction is six tokens and two rules.** CSS has no `to inline-end`, so
`--saqeel-flow-angle` / `-flow-from` / `-flow-to` / `-sweep-start` / `-sweep-end`
/ `-sweep-skew` are declared at `:root` and mirrored at `:root:dir(rtl)`. These
are the only direction-aware rules in the file. The switch thumb was initially
written with a third `:dir(rtl)` rule to flip a `translateX`; it was rewritten as
`justify-content: flex-start | flex-end` on the track, which is direction-correct
with no override at all. Written into WEB-001 §9.

**5. Two primitives were added beyond the brief.** The chart scale needs eight
series; the brief's light list contains `#12557F` and the dark list `#6EC8FF`,
neither of which is in the primitive ramps. Since §4 forbids a literal in the
semantic layer, they became `--saqeel-neon-steel-deep` and `--saqeel-neon-sky`.
Measured: `#12557F` 7.98:1 on `--saqeel-warm-000`, `#6EC8FF` 10.85:1 on
`--saqeel-ink-1000`.

**6. Shadow alpha lives in primitives.** Elevation must be per-theme (dark needs
tighter, deeper shadows plus a rim light) and a shadow needs alpha, which no
opaque primitive provides. Nine alpha primitives — `--saqeel-shade-050…200`,
`--saqeel-void-200…500`, `--saqeel-rim-light` — carry it, and the two theme
blocks compose `--saqeel-elevation-0…4` from them. `rgba()` appears only in the
primitives section and in the two `--saqeel-surface-overlay` declarations the
brief explicitly sanctions.

**7. Zero media queries except reduced motion.** A media query cannot read a
custom property, so every breakpoint would have been a hardcoded pixel literal.
`.saqeel-page` uses `clamp()` on its inline padding and `.saqeel-grid` uses
`repeat(auto-fit, minmax(min(100%, calc(…))))`, which collapses columns
intrinsically. The file therefore contains exactly one `@media` block:
`prefers-reduced-motion: reduce`.

**8. `--saqeel-ease-linear: linear` was added.** A seamlessly looping gradient
must animate linearly or it visibly pulses once per iteration, and every other
easing token is a cubic-bezier. Adding the token was preferable to writing the
`linear` keyword inline in five component rules.

**9. T-002 was redefined and the tracker renumbered.** The board's original T-002
was "core primitives" built as React components with colocated CSS Modules. That
approach was replaced by this one. The React layer that consumes these classes is
now T-004, the reference route T-005, and T-003 became the Readex Pro install
that this file's font stack is waiting on. The work was also taken out of
dependency order — T-000 (gates) and T-001 (icons) are still `todo`, so nothing
in this task is machine-enforced yet.

**10. The stylesheet lives in `src/app/`, not `src/`.** The brief specified
`apps/web/src/saqeel.css` — "at `src/` root, not inside `app/`". The owner
overrode that on delivery and the file was moved to `apps/web/src/app/saqeel.css`,
next to `tokens.css` and the two legacy sheets it will eventually replace. All
four global stylesheets now sit together and `layout.tsx` imports all of them
with a flat `./` path. Every reference in the rulebook, the tracker, the log and
this record was rewritten to match.

Consequence to watch: `apps/web/src/app/` now holds **10 files**. WEB-000 §7 says
plan the split at 9 and CI fails at 13. It is inside the ceiling but no longer
comfortably — `saqeel-tokens.figma.json`, `icons.tsx` and `BrandMark.tsx` are the
obvious candidates to move out, and `icons.tsx` is already on the retirement
ledger for T-001.

## Inventory taken before writing code

- **state and effects found** — none. This task ships no TypeScript beyond a
  single import statement, so the state ladder does not apply.
- **literals mapped to tokens** — the reverse of the usual direction: this task
  *creates* the token vocabulary. 108 hex literals, 11 `rgba()` values and 2 font
  stacks all sit inside `saqeel.tokens`; the last hex in the file is on line 119.
  `saqeel.components` contains no colour, font, shadow or z-index literal.
- **`<svg>` mapped to semantic icon names** — none. The file draws no icons; the
  loading, checkbox and radio indicators are CSS shapes, and the icon layer is
  T-001.
- **accessibility failures found in existing markup** — none inspected. No
  existing markup was touched.

## Numbers

```
Route: all (global stylesheet)
saqeel.css source           0 B  → 65,058 B  (2,050 lines)
saqeel.css gzip             0 B  →  8,999 B  (brotli 7,686 B)
first-load JS                   unchanged (one import line, no TypeScript shipped)
LCP / INP / CLS                 unchanged (no render-path change)
client islands                  unchanged (0 added)
legacy CSS deleted: 0 lines / 0 B
source lines removed: 0
```

Source and compressed figures are measured on the file itself. The built global
CSS chunk is **not** measured here — WEB-005 §8 and WEB-006 §3 were amended
mid-task to put `npm run build` in the human's hands, so the chunk table is a
measurement request (below), not something this session produced. The honest
bound in the meantime: `saqeel.css` adds at most its own 65 KB raw / 9.0 KB gzip
to the one global chunk every route already loads, and less after minification.
The whole file is additive — it introduces no rule any existing sheet could
deduplicate against — so nothing else in the bundle moves.

### Measurement request — for the human

```
Measure before merging — global stylesheet, affects every route

  npm run build   → CSS bytes on any one route, before and after reverting
                    the `import "./saqeel.css"` line in app/layout.tsx
                  → First Load JS on /dashboard and /operations (expect: no change)

Note: an aborted `next build` ran in this session before the no-build rule
landed and was stopped mid-compile. `apps/web/.next` may hold a partial cache.
Clear it before measuring.
```

The ~9 KB gzip is additive by design: this task builds the vocabulary, it does not
migrate a screen. Every screen migrated from T-006 onward deletes the legacy
rules it exclusively owned, and the brief's §3 tracked metric — bytes removed
from `saqeel-runtime.css` (170 KB) and `saqeel-components.css` (50 KB) — starts
being paid down there. Net effect on the WEB-005 §1 CSS budget is negative until
that begins; recorded here so the regression is not discovered later.

## Accessibility

- **axe violations: 0 new.** No route markup changed, so no route's axe result
  moved. The classes this file defines are not yet applied to any element.
- **Contrast, measured not asserted.** Every primitive pairing is recorded in one
  block comment per ramp inside the file. The four spot-checks the brief asked
  for:

```
--saqeel-text-muted    on --saqeel-surface-subtle    light  5.64:1   dark  6.25:1
--saqeel-border-strong on --saqeel-surface-default   light  3.23:1   dark  3.24:1
```

  Text floor is 4.5:1 and both muted values clear it. Border floor is 3:1
  (WCAG 1.4.11) and both `border-strong` values clear it. Every one of the ten
  status roles clears 4.5:1 on its own soft fill in both themes — the tightest is
  `critical` dark at 5.61:1 — except `disabled`, which is 3.91:1 light and
  exempt from 1.4.3 as a disabled control.
- **Manual checklist (WEB-003 §10):** keyboard · screen reader · 200% zoom ·
  320 px · Arabic/RTL · dark · reduced motion · greyscale — **carried to T-004**.
  This task ships no rendered markup, so there is nothing to traverse, announce
  or zoom. What *was* verified statically, and is the reason T-004 can pass it:
  every interactive class carries a `:focus-visible` ring; every control honours
  `--saqeel-touch-target` (44 px); `.saqeel-pill` always renders a text label
  with the dot as an optional adjunct, so greyscale never removes meaning;
  `aria-invalid="true"` thickens the input border as well as recolouring it; the
  file contains zero physical direction properties; and the reduced-motion block
  stops all four animations while leaving every gradient in place.
- **Anything found and fixed:** the first draft's `.saqeel-btn[data-loading]`
  hid nothing but spun a fourth keyframe; it was rewritten to a continuous sweep
  over the still-visible label, which also satisfies the repository's existing
  `transparent-loading-label` guardrail in `check-design-system-v5.mjs`.

## Verification

- [x] `npm run typecheck` — zero errors
- [x] No production build was run; the measurement request was handed back
      instead. **One caveat, recorded rather than hidden:** `npm run build` was
      started early in this session and ran for ~25 minutes before WEB-005 §8,
      WEB-006 §3, WEB-000 and `brain/web/README.md` were amended mid-task to
      forbid it. It was stopped the moment the amendment was read. It had not
      emitted any CSS chunk, so no measurement came from it, and
      `apps/web/.next` may hold a partial cache that wants clearing before the
      human measures. Flagged, not cleaned — `.next` is the human's to reset.
- [x] `node scripts/check-design-system-v5.mjs` — 128 findings, **all
      pre-existing**, all in `.tsx` files (`emoji-as-icon`,
      `utc-slice-date-format`). Zero findings in `saqeel.css`. This gate was
      already failing before this task and this task did not move it.
- [ ] `npm run lint` — **script does not exist** (T-000)
- [ ] `npm run gates` — **script does not exist** (T-000)
- [ ] `npm run test:e2e` — not run; no route markup changed
- [x] `git diff apps/web/src/app/tokens.css` — empty
- [x] `git diff apps/web/src/app/layout.tsx` — exactly one added line
- [x] `git status` shows only the files listed above; nothing under
      `apps/web/src/components/`
- [x] Zero hex, `rgb()`, font stack or shadow literal outside `saqeel.tokens`
- [x] Zero `left` / `right` / `margin-left` / `padding-right` in the file
- [x] `!important` appears only in the reduced-motion block
- [x] Exactly two direction rules, exactly three keyframes
- [ ] **Visual diff on existing pages — NOT verified in a browser.** See the
      environment blocker below. The zero-diff claim rests on cascade analysis
      alone and must be confirmed by hand before this merges.

**Definition of Done (WEB-006 §5) is not fully ticked**, and cannot be: it
requires `npm run gates` and an axe run, and T-000 has not been done, so neither
script exists. Recorded as a known gap rather than claimed.

### Environment blocker — the app cannot be run on this machine

`next dev` starts and then fails to compile:

```
⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred:
  An Application Control policy has blocked this file.
  apps\web\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
```

Windows Application Control is blocking Next.js's native SWC compiler binary, so
no route can be served. `http://127.0.0.1:3001/login` returns a browser error
page; port 3000 is held by an unrelated process and serves nothing either. This
is almost certainly why the aborted `next build` produced no output for 25
minutes as well.

Consequence: **the browser half of verification did not happen this session.** No
page was loaded, no screenshot compared, no computed style read off a real
element. `npm run typecheck` is unaffected (`tsc` needs no SWC) and did pass. The
next agent, or the human, must unblock the binary before any task in this
programme can satisfy WEB-006 §3's "exercised by hand in the running dev server".

### Zero-visual-diff — reasoning, not observation

Unverified in a browser. The claim rests on cascade analysis alone:

- Everything in `saqeel.css` sits inside `@layer saqeel.*`. All three legacy
  sheets and `tokens.css` are unlayered. Unlayered declarations win over every
  layered one irrespective of order, so no legacy rule can be overridden.
- The base layer's `body`, `box-sizing`, `:focus-visible` and `::selection` rules
  are all already declared unlayered by `tokens.css` or `saqeel-runtime.css` and
  therefore never apply.
- The two base rules with no unlayered counterpart are the margin reset on
  `h5 h6 figure blockquote dl dd ol ul` and `img, svg, video { display: block }`.
  The legacy sheets zero list margins per class (`.timeline`, `.spine`,
  `.cd-nodes`, `.ar-spine`, `.ccr-tree`, …) rather than globally, and size icons
  per class inside flex containers where `display` is blockified anyway. **These
  two are the only places a regression can hide, and they are exactly what the
  browser check would have caught.** Any element the legacy sheets miss — a
  `<ul>` relying on the UA margin, an `<svg>` sitting inline in a text run —
  changes. Parked in the tracker; check these first if a screen regresses.

If the browser check does surface a regression, the narrow fix is to drop
`ol, ul, dl, dd, figure, blockquote` from the base margin reset and `svg` from
the media reset, keeping `img` and `video`. That preserves the base layer's
purpose for new `.saqeel-*` markup while touching nothing legacy.

## Retirement

Nothing marked, nothing deleted. `saqeel-runtime.css`, `saqeel-components.css`
and `v2-components.css` become retirement targets from T-006 onward — this task
freezes them, it does not shrink them. WEB-002 §6 now names all three as frozen,
where it previously named two.

## Parked

Copied into the tracker's PARKED section: `gate:one-stylesheet`;
`gate:one-prefix`; wrapping the legacy sheets in a `legacy` cascade layer;
base-layer reset scope; the two extra chart primitives; `--saqeel-ease-linear`.

## Blocked / open questions

- **Windows Application Control blocks `next-swc.win32-x64-msvc.node`, so the app
  will not run on this machine.** No dev server, no production build, no browser
  verification, no e2e, no axe. Until it is unblocked, every task in this
  programme is limited to static verification and WEB-006 §3's "exercised by hand
  in the running dev server" cannot be satisfied by anyone working here. This is
  the highest-priority environment fix and it is not a code problem.

- **The file is 2,050 lines, not the 1,000–1,400 the brief predicted.** The
  content matches the specification exactly; the difference is formatting — one
  declaration per line with wrapped multi-value declarations, rather than the
  legacy sheets' one-rule-per-line density. No content was added to reach it and
  none should be removed to shrink it. The file-size budget in WEB-000 §1 does
  not apply here by the brief's own explicit exception.
- **Nothing in this task is machine-enforced.** No lint config, no gate scripts.
  Every rule this file obeys — one prefix, no literals outside tokens, no
  physical properties, one `!important` block, two direction rules — was checked
  by hand this session and will rot without T-000.
- **The font stack names a family the app does not have.** `Readex Pro` falls
  through to `IBM Plex Sans Arabic` until T-003 self-hosts it. Nothing breaks,
  but no screen built on `saqeel.css` renders in its intended face until then.

## Proposed commit

```
feat(saqeel): add saqeel.css design system in three cascade layers
```

## Next

**T-003 — install and self-host Readex Pro.** T-000 (gates) and T-001 (icons)
remain the higher-priority unblocked items on the board and should be taken
first if the order is not being overridden again.

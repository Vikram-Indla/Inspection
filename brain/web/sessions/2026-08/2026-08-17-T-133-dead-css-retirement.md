# 2026-08-17 · T-133 — retiring 1,394 lines of unreachable design-system CSS

`task: T-133` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-006 §4, WEB-009, WEB-010`

---

## Goal

Delete `components/saqeel/primitives/primitives.module.css` and the tokens
orphaned by T-130, and close the WEB-002 §2 wording gap that T-131 and T-132 both
had to work around.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/saqeel/primitives/primitives.module.css` | **deleted** | 1,301 → 0 |
| `app/saqeel.css` | 13 gradient definitions, 14 declarations, 3 keyframes removed | 1,023 → 930 |
| `rules/WEB-002-design-system.md` §2 | the freeze now carves out aliasing | +11 |
| `05-RETIREMENT-LEDGER.md` | deletion recorded, running total updated | +30 |

**1,394 lines removed. No component touched, no route touched.**

## The death check, run in full

T-077's rule is that zero importers is not evidence of death when a ledger says
otherwise, and T-078's is that a spec reading a file at module scope throws before
its first assertion. Both were checked before anything was deleted:

```
code importers                 0   only use-media-query.ts is imported from that folder, and it is .ts
e2e specs reading it as text   0
scripts naming it              0
component ledger row           0   the ledger documents use-media-query.ts, which stays
retirement ledger row          0
```

**The independent confirmation came from the gate.** Deleting the file moved the
typography gate from **115 → 129 violations removed**, because the baseline had
recorded its 14 `retired-typography-role` entries. A file that contributes to the
baseline is a file the scanner really reads — so the deletion was of something
real, not of a phantom.

It was never `@retiring`-marked because it was never *replaced*. It was
unreachable, and marking it would have asserted a supersession nobody performed —
the same reasoning T-054 used when it deleted rather than banner-marked.

## Cascading orphans, resolved by re-scanning rather than assuming

Removing the stylesheet orphaned more than the two tokens I had parked. The scan
was run **after** the deletion, because doing it before would have counted the
dead file's own references as consumers:

```
fully orphaned  --sqx-gradient-* (13) · --sqx-rim-light · --sqx-ease-sweep
                --sqx-flow-angle/-from/-to · --sqx-sweep-start/-end/-skew
                @keyframes sqx-flow · sqx-sweep · sqx-drift
kept, live      --sqx-glare-050 + --sqx-duration-flow   skeleton shimmer
                --sqx-duration-sweep + --sqx-ease-linear  button spinner
                --sqx-mirror                            Icon, DateRangePicker, SegmentedControl
```

The keyframes were the part I would have missed by only chasing tokens:
`sqx-flow`, `sqx-sweep` and `sqx-drift` were all defined in `saqeel.css` and
referenced nowhere. Found by listing every `animation-name` in `src/` and diffing
against the `@keyframes` definitions — the live `sqx-*` animations are
`button-spin`, `menu-enter`, `menu-fade` and `ping`.

**Verified structurally, not just by exit code:** braces balanced 26/26, zero
malformed declarations, and every surviving token re-read in the browser to
confirm it still resolves (`--sqx-elevation-1`, `--sqx-radius-card`,
`--sqx-text-body-size`, `--sqx-mirror`) while every pruned one reads empty.

## The rule gap, closed

T-131 and T-132 both edited `tokens.css`, which WEB-002 §2 called frozen —
"never edit it, never add to it, never delete from it" — and both recorded the
tension rather than relying on it quietly. §2 now says what the freeze actually
protects:

> One edit is permitted, and only one: repointing a declaration at `var(--sqx-*)`.
> That is not growth — it *shrinks* the sheet's authority… A new property, a new
> raw value, or a deletion is still forbidden, and "I was only aliasing" does not
> cover any of them.

That is the distinction the freeze was always reaching for: it exists to stop the
legacy sheet **accumulating**, not to stop it **deferring**.

## A memory-integrity defect found and deliberately not fixed

`04-COMPONENT-LEDGER.md` contains **two versions of itself**. Lines 5–23 repeat at
232–250, and then the copies diverge: line 24 and line 251 are both the `Button`
row with **different content** — the first cites T-040's `name`/`value` work, the
second is an older, thinner note about `className`.

The ledger is the authority for *never build what already exists*. Two divergent
copies mean a reader consulting the second half gets stale facts about the same
component.

**Not fixed here, on purpose.** Merging them means deciding row by row which
version is authoritative across a 574-line file, and a careless dedupe silently
destroys institutional memory — the exact thing this ledger exists to prevent.
Raised as its own tracker item with the line ranges.

## Numbers

```
primitives.module.css   1,301 → deleted
saqeel.css              1,023 → 930   (13 gradients + 14 declarations + 3 keyframes)
total removed           1,394 lines
typography gate         115 → 129 violations removed
braces                  26 / 26 balanced · 0 malformed declarations
render                  7 sections · 112 text nodes · overflow-x false · unchanged
```

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, **129** below baseline (was 115)
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] `/dashboard` rendered after the prune; every live token re-verified as
      resolving, every pruned token confirmed empty
- [ ] axe, 200% zoom, browser e2e — **owed**

## Parked

- **`04-COMPONENT-LEDGER.md` holds two divergent copies of itself** (dup at
  lines 5–23 ↔ 232–250; divergence from line 24 ↔ 251). Needs a deliberate
  row-by-row merge, not a dedupe.
- `/dashboard` still has no `h1` — `Shell` receives `title=""`. Shell-wide fix.
- `StatusPill` defaults `ping` to `true`, so 11 dots animate at once on
  `/dashboard`. Compositor-only and reduced-motion guarded; an owner call.

## Proposed commit

```
refactor(saqeel): delete unreachable design-system css and orphaned tokens
```

## Next

The remaining work is genuinely per-route: legacy component classes, `<svg>` in
application code, and hardcoded copy. The design-system layer is now clean —
one typeface, one scale, one palette, no dead sheet, no orphaned tokens.

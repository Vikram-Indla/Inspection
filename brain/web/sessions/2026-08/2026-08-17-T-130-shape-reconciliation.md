# 2026-08-17 · T-130 — reconciling the shapes the tokens could not carry

`task: T-130` · `status: done` · `duration: ~2h`
`rules applied: WEB-000, WEB-002, WEB-009, WEB-010, WEB-014`

---

## Goal

T-129 changed the language through tokens. This closes the gap the tokens could
not reach: decorative gradients, the rim light, pill geometry and control
density — the parts of the visual grammar expressed in component CSS rather than
in a variable.

## What changed

| File | Action |
| --- | --- |
| `saqeel/card/card.module.css` | `box-shadow` fixed — was silently invalid |
| `dashboard/explain-panel/explain-panel.module.css` | same fix, repointed to `--sqx-shadow-menu` |
| `saqeel/button/button.module.css` | AI variant flattened; orphaned `button-sweep` keyframe deleted |
| `saqeel/status-pill/status-pill.module.css` | `body` (15px) → `label` (13px) |

Four files. The sweep was expected to be much larger — §"What was already dead"
is why it was not.

## The card's elevation was never rendering

`card.module.css` declared:

```css
box-shadow: var(--sqx-shadow-card), var(--sqx-rim-light);
```

`--sqx-rim-light` is `none` in **both** themes (saqeel.css:288 and :433). So the
declaration resolved to `inset 0 0 0 1px #23252A, none` — and **`none` is only
valid as the sole value of `box-shadow`**, so the entire declaration was invalid
and dropped.

Proved by direct probe rather than inference:

```
box-shadow: inset 0 0 0 1px #23252A, none   →  computed: none
box-shadow: inset 0 0 0 1px #23252A         →  computed: rgb(35,37,42) 0 0 0 1px inset
```

**Every `Card` in the application has been rendering with no box-shadow**, its
edge coming from the `border` alone. Which is, by accident, exactly the single
hairline the new language wants — so nothing looked wrong, and nothing would
have, until someone gave `--sqx-rim-light` a value and every card in the app
silently gained a doubled edge.

Resolved by making the CSS say what it does: `box-shadow: none`, border stays as
the hairline. Zero visual change, latent trap removed. The explain panel — which
genuinely floats — took `--sqx-shadow-menu` instead.

**A token that resolves to `none` is not inert inside a comma list. It poisons
the declaration.**

## What was already dead

The gradient sweep looked large and was not, because
**`components/saqeel/primitives/primitives.module.css` — 1,301 lines — has zero
importers.** Only `use-media-query` is imported from that folder, and it is a
`.ts` hook, not the stylesheet. Every `--sqx-gradient-cta`, `-sweep`, `-halo`,
`-edge` and `-signal` consumer in it, and five of its infinite animations, are
never bundled.

`.sqx-btn[data-gradient]` likewise has **zero consumers** in JSX.

So the live decorative-gradient surface was exactly **one component**: the AI
button, with one consumer (`ai-advisory.tsx`). Flattened to
`--sqx-ai-deep` with a hover step, and its `::after` glare sweep plus the
now-orphaned `button-sweep` keyframe deleted.

## Numbers

```
infinite animations on /dashboard   before: gradient flow + 11 ping   after: 11 ping only
                                    all compositor-only (will-change: transform, opacity)
                                    reduced-motion guarded (saqeel.css:1013, ping-dot:75)
StatusPill                          15px body → 13px label, weight 590 → 510
                                    contrast 7.13 dark · 4.61 light · 10.22 neutral light
Card                                border 1px hairline · box-shadow none · radius 12px
light-theme contrast sweep          302 elements, 0 failures
```

## Control density — measured, and left alone

```
Button    radius 6px · heights 32/38px · 13.3px label      reference: 6px, 8–10px padY
Segment   radius 9999px · 26px · 13px                      reference: pill, 12–13px
Pill      radius 9999px · 20px · 13px                      reference: 4px badge / pill tag
```

These already match the reference's compact density, so nothing was changed. The
one apparent outlier — a **20px** button — is `variant="link"`, which sets
`min-block-size: auto` deliberately so a text action sits on the baseline of the
prose around it. WCAG 2.2 §2.5.8 exempts inline targets, so it is compliant and
was left as it is.

## My contrast tooling produced a false failure twice, and that is the finding

A light-theme sweep reported **11 pill failures at 4.16:1** and one at **1.87:1**.
Both were artefacts. The failing rows had `backgroundColor: rgba(0,0,0,0)` —
they were the **inner label `<span>`s**, matched by the same
`[class*="status-pill"]` selector as the pill root, and a transparent background
parses to black, so the ratio was computed against a surface that does not
exist.

The real pairs, resolved to the nearest **painted** ancestor, are 4.61 and 10.22
— both pass. Re-running the whole page that way: **302 elements, 0 failures.**

This is the second instance in two tasks. T-129's was the mirror image: the
selected segment read 1.3:1 because the lime pill is a **sibling**, so walking
*up* missed it. Together they give the rule:

> **A contrast check is only as good as its background resolution.** Never
> compare against a transparent element's own background, never assume the
> painted surface is an ancestor, and re-measure a failure before fixing it.

I nearly "corrected" a palette that was already correct. The check that saved it
was recomputing the same pair three ways — from hex, from the computed strings,
and live — and getting 4.61 every time.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] Rendered and measured in dark and light; 0 contrast failures across 302
      elements; 0 decorative-gradient animations remaining
- [ ] axe, 320px, 200% zoom, browser e2e — **owed**

## Retirement

**`components/saqeel/primitives/primitives.module.css` (1,301 lines) is dead** —
zero importers, verified. It is the largest single deletion candidate in the
design system and now also carries rules that contradict the language. Not
deleted here because deletion is its own task under WEB-006 §4; added to the
retirement ledger.

## Parked

- **11 ping dots animate simultaneously on `/dashboard`.** Compositor-only and
  reduced-motion guarded, so not a defect — but the language is deliberately
  quiet, and `StatusPill` defaults `ping` to `true`. Flipping that default is a
  design decision affecting every pill in the app; it wants the owner, not me.
- `--sqx-rim-light` now has no consumers and resolves to `none` in both themes.
  It can be deleted with the gradient tokens once `primitives.module.css` goes.
- `--sqx-gradient-*` (13 tokens) are consumed only by dead CSS.

## Proposed commit

```
refactor(design): reconcile component shape with the approved language
```

## Next

The ~80 legacy routes, straight onto the system. `primitives.module.css` and the
gradient/rim-light tokens retire together in a single deletion task once its
ledger gate clears.

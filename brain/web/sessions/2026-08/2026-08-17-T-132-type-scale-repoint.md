# 2026-08-17 · T-132 — the frozen type scale defers to the approved one

`task: T-132` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-011, WEB-014`

---

## Goal

Close the last piece of the typography divide. T-131 unified the typeface; the
frozen sheet still carried its own **sizes**, so the routes it styles rendered
14px body and 11.5–12px small text against the approved 15px and 13px floor.

## What changed

| File | Action |
| --- | --- |
| `app/tokens.css` | 14 composite shorthands + 34 size/line/weight tokens repointed at `--sqx-text-*` |
| `e2e/design-foundation-contract.spec.ts` | 3 assertions re-pointed and strengthened |
| `e2e/shell-f0-design-system.spec.ts` | 3 assertions re-pointed |

One file of product code. No component was touched.

## The mapping is deliberate, not mechanical

Consumption is heavily lopsided, and measuring it first changed the plan:

```
--type-caption-font  105 consumers  (12px)      ← the dominant surface
--type-micro          76            (11.5px)
--type-body-strong    39            (14px/600)
--type-compact-size   29            (13px)
--type-body-font      22            (14px)
--type-label-size     18            (12px)
--type-heading-lg     15 (17px) · --type-title 11 (22px) · --type-display 6 (28px)
```

I had flagged the **heading jumps** as the risk in T-131. They are ~32 consumers.
The real mass is **208 consumers below 13px** rising to the floor — so the risk
was at the small end, not the large one.

Three mappings were judgement calls, recorded so they are not "corrected" later:

1. **`caption` and `micro` → `label` (13px), not `body` (15px).** Their call
   sites are labels, metadata, ID codes, legend titles and a small button — not
   prose. 12px → 13px raises everything to the accessibility floor with a 1px
   change instead of 3px.
   **This is not the retirement rule.** WEB-014 §2.1 retires SAQEEL's
   `--sqx-text-caption` and aliases it to `body`; `--type-caption-font` is a
   *different*, frozen-legacy token, and choosing its target is a migration
   decision rather than a rule breach.
2. **`title` (22px) → `heading` (24px), not `display` (32px).** The frozen sheet
   keeps `--type-display` separately, so sending both to display would collapse
   two levels into one and inflate page titles by 10px.
3. **`--type-input` stays 14px.** That is the reference's control size, and
   `input` is the only token whose 14px is correct rather than legacy.

Also deliberate: `compact-lh`, `table-lh`, `meta-lh` and `caption-lh` point at
`--sqx-text-body-line` (1.6) rather than `label-line` (1.2). The **size** comes
from `label`; the **leading** does not, because these style multi-line content
where 1.2 is cramped. Label's tight leading is for single-line labels.

## Numbers

```
/factories sizes   before  13 · 15 · 14 · 24 · 32        after  13 · 15 · 20 · 24 · 32
                   smallest 13px (was 14px on 10 nodes, 11.5–12px elsewhere)
                   weights  510 · 400 · 590 — within the 590 cap
overflow           document overflow-x: false · elements past viewport: 0
320px              document scrollWidth exactly 320 · no page overflow
Arabic             same 13/15/20/24/32 scale · letter-spacing 0 non-zero
                   line-height 1.55 / 1.80 (looser than Latin, per WEB-011)
```

**The Arabic leading overrides survived the repoint**, which was the thing most
likely to break: `tokens.css`'s `[dir="rtl"]` block overrides only line-heights,
never sizes, so Arabic keeps its looser leading on top of the new sizes.

## A 320px overhang that is not mine

At 320px, 12 `definition-list` elements report a 9px overhang. Checked before
attributing it: **`definition-list.module.css` consumes zero `--type-*` tokens**
— only `--sqx-*` — so this task cannot have caused it. Its 288px width is
exactly `--sqx-grid-min-md` (18rem), so the grid's minimum column exceeds the
viewport once card inset is applied. The document does not scroll
(`scrollWidth: 320`), so it is clipped and harmless, but it is a real
pre-existing responsive defect in the primitive. Parked, not silently fixed.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] Measured on `/factories` at 960px, at **320px**, and in Arabic; `/dashboard`
      rendered
- [ ] axe, 200% zoom, browser e2e — **owed**

## Spec changes

Two specs pinned the frozen px values — and both are *named* for resolving
through canonical tokens ("typography and visual values resolve through canonical
SAQEEL tokens", "typography is productive and bilingual"). So the assertions were
**strengthened rather than swapped**: they now assert the frozen sheet *aliases*
`--sqx-text-*`, plus that `saqeel.css` holds the approved values. That fails if
the frozen sheet ever re-acquires an independent scale — which the old literal
could not detect.

The comments on the old assertions asserted the *previous* decision
("SAQEEL scale supersedes 32px", "14px body supersedes 16px minimum"). Those are
now false and were corrected rather than left to mislead.

## Parked

- **`DefinitionList` overflows at 320px** by 9px — `--sqx-grid-min-md` (288px)
  exceeds the viewport once card inset applies. Pre-existing, clipped, real.
- `tokens.css` is nominally frozen (WEB-002 §2) and T-131 and T-132 have now
  edited it twice. Both edits *reduce* its authority by aliasing rather than
  growing it, which is the opposite of what the freeze protects against — but
  the rule's wording still does not carve this out and should.

## Proposed commit

```
refactor(tokens): defer the frozen type scale to the approved language
```

## Next

The typography divide is closed: one typeface, one scale, one palette across
migrated and legacy routes alike. What remains is genuinely per-route work —
legacy component classes, `<svg>` in application code, hardcoded copy — and the
retirement of `primitives.module.css` with the orphaned rim-light and gradient
tokens.

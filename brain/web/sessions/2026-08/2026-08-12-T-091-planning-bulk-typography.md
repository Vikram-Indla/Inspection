# 2026-08-12 · T-091 — `/planning/bulk` typography, and a hole in the gate

`task: T-091` · `status: done` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §2.1, §4.1, §8`

---

## Goal

Clear the last substantial pocket in the planning family: 19 route-owned
declarations across the bulk targeting surface.

## What changed

**19 declarations across 7 modules → 0**, plus **4 rendered elements** the gate
could not see. `/planning/bulk`'s only remaining violation is
`NotificationBell.tsx:270`, the shell.

| Module | Removed | Note |
| --- | --- | --- |
| `sections/ai/ai-advisory` | 5 | incl. **2 retired `caption` refs**; shared with `ContextualAiPanel` |
| `bulk-campaign-summary` | 4 | KPI label → value → empty |
| `bulk/criteria-builder` | 4 | h3, and a **grouped selector** `.tree, .notice` |
| `bulk-selection-bar` | 2 | |
| `bulk-evidence-table` | 2 | one on `<bdi>` — no primitive exists |
| `bulk-targeting-form` | 1 | |
| `bulk-results-pager` | 1 | |
| `bulk/DistributionPanels.tsx` | **(0 counted)** | 4 × `t-caption` — **invisible to the gate** |

## Decisions

**The gate cannot see a legacy global type class applied from JSX, and this
route proved it.** `/planning/bulk` reported **1 violation** — the shell — while
still rendering **four elements at 11.5px**, off every scale. The source is
`DistributionPanels.tsx`, a live route-local component using
`className="t-caption"`, a class defined in the **frozen** `tokens.css`
(`--type-caption-size: 11.5px`).

Every gate rule scans **CSS files for declarations**. The frozen sheets are
exempt by design, and `className="t-caption"` in a `.tsx` matches no rule at all.
So the count and the render disagreed, and **only measuring found it**.

`t-caption` appears in **162 `.tsx` files** repo-wide. A route can be at "1
violation" and still be off-scale.

**`--sqx-status-critical-on-soft` and `--sqx-text-danger` are the same value —
checked, not assumed.** `ai-advisory`'s `.error` used a status token that is not
one of the nine tones, which normally forces the T-090 treatment (keep the colour
on a wrapper). But both resolve to `--sqx-error-darker` in light and
`--sqx-error-light` in dark, so `tone="danger"` is exact and the class could be
deleted outright. **A colour token outside the tone list is not automatically a
different colour.**

**`.tree, .notice` is a grouped selector, and the selector→element map only
reported the first class.** The `font` applied to *both*. Both are flex rows of
chips and text — mixed-content containers — so the declaration was deleted and
they inherit, per T-065. **Read the selector, not just the map's first match.**

**`<bdi>` has no primitive, so the declaration was deleted rather than
composed.** `Text`'s `as` union has no `bdi`, and `<bdi>` cannot be dropped — it
carries bidirectional isolation for factory codes in Arabic. The class held
`font-size: var(--sqx-text-body-size)` and inherits its line-height from `<body>`
either way, so deleting the declaration renders **identically**. Same reasoning
already applied to `<td>`.

**Two KPI values moved 600 → 700**, the same deliberate correction as T-087:
`bulk-campaign-summary`'s `.value` was metric *size* with semibold, which is not
the `metric` role. `<Metric>` renders 700.

## Inventory taken before writing code

- 19 declarations, 7 modules, each mapped **selector → rendered element by
  script** before editing. **No native controls in this set** — all `<p>`,
  `<h3>`, `<li>`, `<span>`, `<strong>`, `<a>`, `<bdi>` — so no `font: inherit`
  was needed anywhere, unlike T-090.
- `ai-advisory` is shared (`ContextualAiPanel`, `bulk-screen`) — checked before
  editing; the change is internal to it, so consumers are unaffected.
- `BulkForm.tsx` (route-local, ~240 lines of legacy globals) has **zero
  importers** — confirmed dead, see Parked.

## Numbers

```
/planning/bulk   20 → 1 violations   (route-owned 19 → 0)
repo baseline   768 → 749
classes deleted   9
```

Rendered and measured before and after:

```
                 before                                    after
sizes            30 · 28 · 20 · 16 · 14 · 12 · 11.5        30 · 28 · 20 · 16 · 14 · 12
off-scale        4 elements at 11.5px (t-caption)          0
typefaces        1 (plexArabic)                            1
h3 subheading    —                                         16px / 22.4px / 600  (16 × 1.4)
```

**Twelve of the thirteen planning routes now sit at 1 violation — the shell.**
Only `/planning/visits` remains at 16, and it owns none of them
(`components/sections/visits/`).

## Accessibility

- The four `t-caption` elements moved **up** in size: the risk advisory sentence
  11.5px → 14px `body`, the three counts 11.5px → 12px `label`. 11.5px was below
  WEB-014 §7's 11px floor for prose by a wide margin.
- `role="status"` / `aria-live="polite"` preserved on every live region; where a
  span became `Text live="status"`, `role="status"` carries the implicit
  `aria-live="polite"` (the pattern T-080 established).
- `<bdi>` retained everywhere — dropping it would break mixed Arabic/Latin
  ordering of factory codes.
- No heading level, `id` or landmark changed.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 19 removed, re-baselined 768 → 749
- [x] Zero typography declarations left in the bulk set — asserted by grep
- [x] No orphaned `styles.x`, no unused class — both directions
- [x] **Rendered and measured, before and after** — 309 leaf nodes, zero
      off-scale, one typeface
- [ ] `npm run test:e2e` — not run; needs a production build

## Three mistakes, all caught by a check rather than by reading

1. **A missing `Text` import compiled into a DOM global.** `bulk-selection-bar`
   used `<Text>` without importing it; TypeScript resolved it to the **DOM
   `Text` interface** and failed with *"cannot be used as a JSX component"*.
   Silent in the gate, obvious in `tsc` — **the compile is the check for this
   class of error**, and it caught the same omission in `bulk-evidence-table`.
2. **Two more unbalanced `</span>` tags** from converting a wrapper to `<Text>`,
   the same slip as T-090. Found by grepping the converted sites for stray
   closers immediately after the edit.
3. **`.filterStatus` nearly lost its layout.** It carried
   `display: inline-flex; align-items: center; gap` **as well as** the font, and
   the first pass replaced the whole span with `<Text>`, which would have
   collapsed the CountBadge row. Caught by the **unused-class check** — the class
   showed as unused, which is what prompted re-reading the block. **A class that
   becomes unused after a migration is a signal to re-read it, not to delete it
   reflexively.**

Also: **a scripted class-removal matched 0 of 4 patterns** (CRLF again) and
reported success. Third occurrence; switched to per-block edits immediately, per
the rule recorded in T-090.

## Retirement

9 CSS classes deleted. No files deleted.

## Parked

1. **`BulkForm.tsx` is dead — zero importers, ~240 lines of legacy globals**
   (`t-caption`, `sq-kpi`, `sq-lozenge`, a hand-rolled `<table>`). It is a
   complete parallel implementation of the bulk targeting screen, superseded by
   `components/sections/planning-bulk/*`. **Check the T-077 trap (no spec reads
   it as source text) before deleting.**
2. **`t-caption` and its `.t-*` siblings are used in 162 `.tsx` files and the
   gate cannot see any of them.** This is a whole class of off-scale rendering
   invisible to `npm run gates:typography`. **A rule matching
   `className=".*\bt-(caption|body|label|meta|micro)\b"` in `.tsx` would close
   it** — raised, not added, since a new gate rule is a change request.
3. **`DistributionPanels.tsx` still renders legacy structural globals** —
   `panel`, `panel-header`, `panel-title`, `sq-grid-2`, `stack`, `row`, `grow`,
   `badge`. Its typography is now on-scale; its markup is not SAQEEL. That is a
   rebuild, not a typography task.

## Blocked / open questions

None.

## Proposed commit

```
refactor(planning): render bulk targeting text through the type primitives
```

## Next

`/planning/visits` — 16 violations, all owned by `components/sections/visits/`,
which is a different feature sharing a planning URL. After that the planning
family is done except the shell.

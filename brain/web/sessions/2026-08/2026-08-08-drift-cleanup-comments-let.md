# 2026-08-08 · WEB-000 sweep — comments + `let` across migrated surface

`task: ad-hoc (owner-requested)` · `status: done` · `duration: ~1h`
`rules applied: WEB-000 §1 (zero comments), WEB-000 §6 (no let in .tsx), WEB-002 §2/§6`

---

## Goal

Resolve drift between the stated rules and the shipped code on the four
migrated areas (dashboard, operations, factories, layout/shell), and resolve any
missing/changed TypeScript imports across that surface.

## What changed

Zero-comment law (WEB-000 §1) and no-`let`-in-`.tsx` (WEB-000 §6) were violated
in 16 already-migrated files: 75 non-TSDoc comments (`//`, `/* */`, `{/* */}`)
and one `let`. All removed; the three legitimate TSDoc `/**` blocks and the
`@retiring` exception were preserved.

| File | Action | Change |
| --- | --- | --- |
| `components/saqeel/menu-surface/menu-surface.tsx` | rewritten | 14 comments removed; `let rect` → `const initial`/`flipped`/`rect` (behaviour-preserving: re-measures only on align-flip, exactly as before) |
| `components/saqeel/data-table/data-table.tsx` | rewritten | 9 comments removed |
| `components/saqeel/index.ts` | rewritten | 8 comments removed (barrel banner + `PRn` section markers) |
| `components/saqeel/list-row/list-row.tsx` | rewritten | 7 comments removed (incl. one JSX comment) |
| `components/saqeel/count-badge/count-badge.tsx` | rewritten | 4 comments removed |
| `components/saqeel/definition-list/definition-list.tsx` | rewritten | 3 comments removed |
| `components/saqeel/timeline/timeline.tsx` | rewritten | 3 comments removed (TSDoc kept) |
| `components/sections/operations/operations-alerts/operations-alerts.tsx` | rewritten | 5 comments removed |
| `components/sections/operations/operations-timeline/operations-timeline-picker.tsx` | rewritten | 5 comments removed (incl. one JSX comment) |
| `components/sections/operations/operations-skeleton/operations-skeleton.tsx` | rewritten | 4 comments removed |
| `components/sections/operations/operations-export/operations-export.tsx` | rewritten | 2 comments removed |
| `components/sections/operations/operations-risk-table/operations-risk-table.tsx` | rewritten | 2 comments removed |
| `components/sections/operations/operations-workload-table/operations-workload-table.tsx` | rewritten | 2 comments removed |
| `components/sections/dashboard/compliance-explorer/compliance-explorer.tsx` | rewritten | 3 comments removed |
| `components/sections/dashboard/operational-view/operational-view.tsx` | rewritten | 3 comments removed |
| `components/sections/dashboard/search-results/search-results.tsx` | rewritten | 1 JSX comment removed |

No behavioural change beyond the one `menu-surface` restructure; every other
edit is pure comment deletion.

## Decisions

- The zero-comment rule was applied literally: `//`, `/* */` and `{/* */}` are
  all removed regardless of how much "why" they carried. The two documented
  exceptions — TSDoc `/**` on design-system public API, and the `@retiring`
  banner — are the only comments allowed to remain, and were kept.
- `menu-surface` `let rect` was reassigned after a possible align-flip, so it
  could not become a plain `const`. Restructured to `const initial` → derive
  `flipped` → `const rect = flipped ? re-measure : initial`. Same number of
  `getBoundingClientRect()` calls in every branch as before.

## Import audit (the "missing or changed imports" ask)

The tracker's BLOCKED note said `/dashboard` still imports
`@/components/dashboard/**`. The current `page.tsx` and `loading.tsx` already
import the correct `@/components/sections/dashboard/**` — the blocker is stale
and is cleared here.

A static resolver was run over the migrated surface (64 route/section/shell
source files + their dependency targets in `features/`, `lib/`, `app/`,
`i18n/`, and the saqeel primitives): **371 import edges checked for both path
and named-export correctness, zero broken.** All 23 imports whose targets were
not staged were confirmed to exist via directory listing. No import fixes were
required — the migrated code type-resolves.

Not run: a full-repo `tsc` (the SWC/Windows blocker and the absence of
`node_modules` in this environment prevent it). The audit covers the migrated
surface and the legacy files still sitting in its route folders, not every file
in the repo.

## Drift checked and found clean

- CSS modules across `sections/**`, `app-shell/**`, and
  `saqeel/primitives/primitives.module.css`: no banned literals in property
  values (hex, rgb, px, rem, font-family, z-index, shadow), logical properties
  only, no physical `left`/`right`.
- `saqeel.css` holds only tokens/base/keyframes + two base-layer utilities
  (`.sqx-visually-hidden`, `.sqx-skip-link`) — the 638 shell lines the status
  doc still attributes to it have already moved to colocated modules. That
  styling drift is resolved.
- No `<svg>` in application components; `lucide-react` imported only by the
  icon registry; no `any`/`as any`/`!`/`@ts-ignore`/`eslint-disable` in the
  migrated surface.

## Numbers

```
No performance-affecting change. Comment removal only + 1 const restructure.
Source: 75 comment lines/blocks removed across 16 files; 1 let eliminated.
```

## Accessibility

Unchanged — no markup or ARIA touched. `list-row`, `search-results` and
`operations-timeline-picker` kept their `dir="auto"` / `Field` labelling; only
the explanatory comments around them were removed.

## Verification

- [ ] `npm run typecheck` — could not run here (no node_modules / SWC blocker)
- [ ] `npm run lint` / `gates` — not yet machine-enforced (T-000 outstanding)
- [x] Static re-scan of the 16 fixed files: 0 residual non-TSDoc comments, 0
  `let`/`var` in `.tsx`, diffs reviewed for syntactic soundness
- [x] Import resolver: 371 edges, 0 broken

Owner measurement request: run `npm run typecheck` once on an unblocked machine
to confirm the migrated surface compiles clean.

## Parked

- Breakpoint-literal convention split: `sections/**` modules use `rem`
  breakpoints in `@media`, `app-shell/**` modules use `px` (1024/1025/640).
  Not a rule violation (media conditions can't consume custom properties), but
  the two migrated areas should agree. A T-000 gate could pin one.
- `01-PROJECT-STATUS.md` still says `saqeel.css` carries 59 classes + 638 shell
  lines and is 59 KB; the file is now 36 KB and tokens-only. Status doc is stale
  vs. the shipped sheet.

## Blocked / open questions

None. Full-repo `tsc` verification is owner-side (environment blocker).

## Proposed commit

```
style(web): strip non-TSDoc comments and a let across migrated surface
```

## Next

T-000 (guardrails) — a lint/gate for `no comments` + `no let in .tsx` would have
caught all 76 of these at authoring time.

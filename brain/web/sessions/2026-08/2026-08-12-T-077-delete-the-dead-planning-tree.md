# 2026-08-12 · T-077 — delete the dead planning tree

`task: T-077` · `status: done (1 of 4 orphan trees; the other 3 are blocked)` · `duration: 45m`
`rules applied: WEB-000, WEB-006 §4, WEB-008, WEB-011`

---

## Goal

Owner asked for the deletion task covering four orphan trees (72 typography
violations). **Only one of the four clears WEB-006 §4's safe-to-delete gate.**

## What changed

Deleted, all with zero importers and zero references anywhere in `src`, `e2e`
or `scripts`:

| Deleted | Bytes |
| --- | --- |
| `components/sections/planning/planning-filter-bar` | 11,439 |
| `components/sections/planning/planning-quick-actions` (2 files) | 6,765 |
| `components/sections/planning/planning-visit-table` | 5,172 |
| `features/planning/assistant-view.ts` | 4,396 |
| `components/sections/planning/planning-recommendations` | 3,867 |
| `components/sections/planning/planning-ai-advisory` | 2,695 |
| `components/sections/planning/planning-insights` | 2,108 |
| `components/sections/planning/planning-assistant` | 1,410 |
| `components/sections/planning/planning-stat-cards` | 957 |
| **Total** | **38,809 (~38 KB)** |

Plus 9 rows added to `05-RETIREMENT-LEDGER.md` under *Retired*, and the
baseline re-levelled 893 → 863.

## Decisions

**The task as scoped was wrong, and checking the gate is what revealed it.**
"Four dead trees, 72 violations" turned out to be one deletable tree and three
blocked ones. WEB-006 §4's second condition — *no dynamic import, no
string-referenced path, no test fixture references it* — fails for the other
three:

| Tree | Blocker |
| --- | --- |
| `DashboardView` + 3 siblings | **4 spec files read `DashboardView.tsx` as source text** — `execution-crossmodule-contract`, `insp-717-reports-index`, `responsive-dashboard-operations` (×2), plus a comment in `wcag-inspector-field-audit` |
| `dashboard.module.css` | read by `design-foundation-contract` and `responsive-dashboard-operations` (×2) |
| `FactoryList` + `factory-list.module.css` | read by `factory360-cr-dossier-contract` (×2) and `ui-compliance-contract` |
| `operations.module.css` | **not dead at all** — still imported by the live `OperationsPreview` |

**`operations.module.css` was mis-scoped by me in T-072.** I recorded it as a
dead stylesheet. What is true is narrower: **all 49 of its typography
declarations sit on classes only the dead `operations-details.tsx` uses**, but
the *file* is live because `OperationsPreview` imports it for seven `preview*`
classes. The file cannot be deleted; only `operations-details.tsx` can, and that
is itself referenced by name in `web-admin-m3-operations.spec.ts`. T-072's
record has been amended.

**Deleting a file that a spec reads as text does not fail the type checker —
it fails the suite at runtime**, when `readFileSync` throws. That is invisible
to `tsc`, invisible to the typography gate, and invisible to a grep for
`import`. It is the same class of hazard the other agent recorded in T-063/T-070
about specs that name files.

**The tree was larger and more tangled than the parked note said.** The tracker
recorded 7 dead components; the directory holds 10, and the real shape was:

- `planning-skeleton` — **live**, imported by `/planning/loading.tsx`. Kept.
- `planning-insights`, `planning-quick-actions`, `planning-stat-cards` — imported
  **for types only** by `features/planning/assistant-view.ts`…
- …which is itself imported **only** by `planning-recommendations`, which is
  dead. A closed dead cycle.

A cycle like that reads as "still referenced" to a naive import search. It was
resolved by checking whether anything *outside* the candidate set imports the
types — nothing does.

**There is also a name collision worth recording:** `planning-assistant` exists
twice — `components/planning/planning-assistant` (live, edited in T-076) and
`components/sections/planning/planning-assistant` (dead, deleted here).
Deleting by basename would have taken the live one.

## Inventory taken before writing code

- WEB-006 §4 read in full **before** touching anything.
- Every candidate searched across `src`, `e2e` **and** `scripts` — not just `src`,
  which is what made the spec references visible.
- Each of the 10 directories checked individually rather than trusting the
  parked list of 7.
- The type-only cycle traced to its root.
- `planning-skeleton`'s own imports checked to confirm it does not depend on
  anything in the doomed set.

## Numbers

```
files deleted                9 (8 component dirs + 1 feature module)
bytes removed           38,809  (~38 KB)
violations removed          30
repo violations        893 → 863
orphan trees cleared     1 of 4
```

## Accessibility

Not applicable — deleted code renders nowhere. No route markup changed.

## Verification

- [x] Zero importers, confirmed per directory
- [x] Zero references in `src`, `e2e`, `scripts` — including string paths
- [x] The live `planning-skeleton` confirmed independent of the deleted set
- [x] `npm run typecheck` — clean after deletion
- [x] `npm run gates:typography` — PASSED, 863 known, 30 removed
- [x] **`/planning` SSR healthy after deletion** — 200, 552 KB, content present,
      **no `Module not found`**. (The pane would not finish streaming, so this
      was verified against the server response, per the T-074 method.)
- [ ] **Full e2e suite not run** — WEB-006 §4 also requires green e2e on the
      replacement routes, and that needs a production build (WEB-005 §8, the
      human's). For code with zero inbound references the risk is minimal, but
      the condition is formally unmet.
- [ ] The "survived one demo/review cycle" condition is the owner's to confirm.

## Retirement

9 rows added to `05-RETIREMENT-LEDGER.md` under *Retired*.

**Note:** none of the deleted files carried the `@retiring` banner WEB-006 §4
requires, and **`gate:retirement` does not exist in `package.json`** — so the
banner/ledger pairing the rule describes is currently unenforced. Logged as a
parked item.

## Parked

- **Three orphan trees remain, ~42 violations, all blocked on spec work.** Each
  needs its assertions re-pointed at the replacement before the file can go —
  and per T-063's lesson, **re-point the assertion, do not delete it**. That is
  a contract change and wants its own task.
- **`gate:retirement` does not exist**, alongside the already-parked missing
  `lint`. The `@retiring` banner regex in WEB-006 §4 is documented but
  unenforced.
- `operations.module.css` cannot be deleted; only `operations-details.tsx` can,
  once its spec reference is re-pointed.

## Blockers

None for this task. The remaining three trees are blocked on spec re-pointing.

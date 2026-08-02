# Planner batch 01 — audit and first fixes

Six read-only workstreams ran against the Planner frames. Four have reported. Fixes below are
mine as sole Web-master writer.

## The Jira framing was wrong, and the correction matters

**Planner is not an uncovered persona.** Epic **INSP-4 Planning** exists and owns all six frames
(`traceability/JIRA-COVERAGE-2026-08-01.md:49`). This is the second time in this programme that a
"no Jira coverage" assumption has been refuted by reading the repo.

The real defect is one level down: **INSP-4 declares 16 stories against 6 frames**, and the 16
child keys exist nowhere in the repository. The file meant to hold them —
`docs/design/figma/traceability/story-screen-map.csv`, the INSP-524 deliverable — **does not
exist**. So at least 10 Planning stories have no identified screen, and the "100% story coverage"
claim cannot be verified from this repo.

## Two workstreams contradicted each other — I measured it myself

QA reported **27 crunched text nodes** in `29:528`; the inventory reported **zero**. Both were
right about different questions:

- Measured against its **immediate parent**, every text node fits — 0 overflow.
- Measured against the **clipping ancestor**, 3 of 13 columns start beyond the 992px clip.

Verified directly: columns total **1275** against **992** available. **AI score (x=998), Status
(x=1060) and Updated (x=1187) are entirely outside the visible width.**

And the shipped CSS settles it — `.planning-visit-table { inline-size: max-content; min-inline-size: 100% }`
with `.table-wrap { overflow: auto }` and `.planning-table-wrap { scrollbar-gutter: stable }`.
**The table is meant to scroll.** Clipping is correct behaviour; what was missing is any
statement that it scrolls. Added `table-scroll-note` **`373:44347`** naming the three columns that
sit beyond the fold.

## Fixes applied

| # | Fix | Node | Evidence |
|---|---|---|---|
| 1 | **`Input` placeholder was `HUG`** — long strings overhang an unclipped input. Set to `FILL` on all 5 variants | `9:66` | `189:17745`: text 430 wide at **x = −51** in a 328 input that does not clip, overhanging 51px each side |
| 2 | Shortened that placeholder to fit | `189:17745` | Was a five-target string; now "Visit ID, factory, CR or licence" — 304 wide at x=12 |
| 3 | Declared the planning table a scroll region | `373:44347` | shipped CSS above |
| 4 | **SCR-WEB-150 had no publish control at all** | `376:44186` | Frame is "Plan Review & Publish"; content ended on two `ad-state` instances. Added *Return to edit · Save draft · Publish plan*, with Publish **Disabled** because the validation and notification rule sets it gates on are both unconfigured |
| 5 | Recorded the DEC-024 route divergence in the frame name | `193:19875` | Catalogue says `/planning/:id/review`; **no such route ships**. DEC-024 re-homed publish to `/planning/bulk/review` and keeps `/planning/plans/[id]` read-only |

## Four shipped routes had no frame, no catalogue row and no story

Now contracted:

| Frame | Route | Lines | Note |
|---|---|--:|---|
| **`378:44187`** SCR-PLN-160 | `/planning/plans` | 114 | Register — uses `Table row` `108:296`, not hand-built cells |
| **`378:44437`** SCR-PLN-170 | `/planning/visits` | 53 | Scoped visit list |
| **`378:44637`** SCR-PLN-171 | `/planning/visits/[id]` | 69 | Visit detail |
| **`378:44851`** SCR-PLN-180 | `/planning/supervision` | 126 | **Persona undefined** — the route gates on "Supervisor access required" but the catalogue defines no Supervisor persona |

All four: **0 clipped, 0 crunched, 0 unbound, 0 placeholder literals at 1280 / 1024 / 834 / 680.**

`SCR-PLN-180` states the persona gap on the frame itself rather than inventing a Supervisor role.

## Recorded, deliberately not changed

**`Brand lockup` `156:213` uses 18px and 9.5px** — both off the ramp, on all six Planner frames
and every other web screen. This is the **SAQEEL brand mark, governed by DEC-011**. Changing brand
type sizes is a brand decision, not a design-system fix. Recorded, untouched.

**SCR-WEB-150's tables clip 12–18 cells below 1280.** Pre-existing: `Table cell` instances are
fixed at 248px. Not introduced by this batch; it is the same column-strategy question as
SCR-WEB-100 and needs the same scroll-or-collapse decision.

## Duplicates found — 7, awaiting the remaining workstreams before action

D1 raw `thead`/`tr` in `29:528` vs `Table row` `108:296` — **the library already tombstones the
old ones by name**, and frames 110/150 already use the replacement, so `29:528` is internally
inconsistent. D2 `DetailRow` `167:7087` vs `DescriptionList row` `166:12`. D3 filter bar built
three ways. D4 `metric-tile` vs `stat` `70:9`. **D5 — nine `panel-content` components are one
component nine times**; "Visit type" and "Assigned inspector" are each authored three times.
D6 "Create visit ▾" types a caret instead of using `SplitButton` `171:34`. D7 the Planner reaches
into the **Admin** `ad-state` when the State page has Planner-specific copy.

Two workstreams — repo route/data-state evidence and shared-capability duplication — are still
running. D1–D7 will be actioned against their findings rather than piecemeal.

---

# Planner batch 02 — all six workstreams in

## What the repo evidence corrected

**SCR-WEB-150 maps to `/planning/bulk/review`, not `/planning/plans/[id]`.** Confirmed from the
code header: *"CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish… Mounted on the governed
`/planning/bulk/review` route (relocation approved: `governance/HUMAN_APPROVALS.yaml` gate
CD-021-P02-relocation-approval)"*. Every SCR-WEB-150 acceptance item — readiness/blockers,
notification ledger, publish, return-to-edit — exists there and **none** exists at
`/planning/plans/[id]`.

**`/planning/plans/[id]` had no screen ID at all.** Now **`380:44764` SCR-PLN-161** — read-only
drill-down, progress legend as shape-plus-label, 7-column child table.

**The table note said 13 columns. The shipped table has 22.** Corrected on `373:44347` with the
full column list.

**`/planning/visits` is genuinely unreachable** — zero inbound navigation anywhere; the only
matches are `revalidatePath` cache invalidation. Recorded on the frame.

**`/planning/visits/[id]` is reachable from exactly one place, and it is not Planning** —
`execution/RevampExecutionWorkspace.tsx:383`.

**No `/planning/*` route implements an offline state** — zero matches for `offline`,
`navigator.onLine` or `serviceWorker` across the tree. Recorded on all four new frames so no
Planner design invents one.

**`/planning/supervision` is the only planning route with no `loading.tsx` and no i18n at all** —
every string hard-coded English, so no Arabic source exists for it.

## A stale governance note, corrected

SCR-WEB-110 carried *"AND/OR — Not configured. The operator model is not configured."* **It is
configured.** `planning/bulk/criteria.ts` implements a `CondNode`/`GroupNode` ALL/ANY tree over a
typed `FIELD_REGISTRY`, canonical operators `eq · neq · contains · in · gt · lt · between`,
serialised to a single `ct` URL parameter with depth and node caps. `193:19081` now says so.

This is the inverse of the usual defect: the design was **more** conservative than the code.

## Duplicate dispositions taken

`193:19843` "SCR-WEB-140-team" contains **no team** — it is `193:19631` plus one multi-select row,
and the repo has no team concept at all: no `teams` table, no team picker, assignment is
inspector-singular everywhere. Both renamed to `panel-content/inspector-picker — Multi=Yes|No`
with the collapse recorded in their descriptions.

Nine `panel-content` components are one component nine times; "Visit type" and "Assigned
inspector" are each authored three times. Recorded for a single `FieldStack` with a `Fields=1…4`
variant.

## A false positive in my own detector

`SCR-PLN-161` reported 8 clipped nodes at every width. They are **2px hatch rectangles inside
`ExceptionMark`'s `stripes` frame**, deliberately overflowing a 14px clip to draw a diagonal
pattern. Decorative overflow is not a defect. The check now excludes rectangles inside a
`stripe|hatch|pattern` parent under 40px wide — and I had to look at the actual nodes to find
that, which is the point.

## Validation — all Planner frames, decorative overflow excluded

| Frame | 1280 | 1024 | 834 | 680 |
|---|---|---|---|---|
| SCR-PLN-160 `378:44187` | clean | clean | clean | clean |
| SCR-PLN-161 `380:44764` | clean | clean | clean | clean |
| SCR-PLN-170 `378:44437` | clean | clean | clean | clean |
| SCR-PLN-171 `378:44637` | clean | clean | clean | clean |
| SCR-PLN-180 `378:44851` | clean | clean | clean | clean |
| SCR-WEB-120 `193:19181` | clean | clean | clean | clean |
| SCR-WEB-130 `193:19408` | clean | clean | clean | clean |
| SCR-WEB-140 `193:19644` | clean | clean | clean | clean |
| SCR-WEB-100 `29:528` | **9 clipped** | 9 | 15 + 1 crunched | 24 + 5 |
| SCR-WEB-110 `193:18887` | clean | **8 clipped** | 12 | 16 |
| SCR-WEB-150 `193:19875` | clean | **12 clipped** | 12 | 18 |

The three failing frames all fail for the **same pre-existing cause**: `Table cell` instances at
fixed widths (166 / 198 / 248) that cannot reflow. Every new frame in this batch is clean because
it uses `Table row` `108:296` with cells sized to the column.

**This is one column strategy decision across three frames**, not three bugs — and the shipped
CSS already answers it: `inline-size: max-content` with `overflow: auto` and a stable scrollbar
gutter. The frames need the scroll region declared and the fixed cells released; that is the next
batch, not a piecemeal patch.

## Still open — decisions, not fixes

1. `screen_route_catalogue.csv:21` still points SCR-WEB-150 at `/planning/:id/review`, a route
   that has never existed. Row 20 already records the DEC-024 reconciliation; row 21 does not.
2. **INSP-4's 16 story keys are not in the repo**, and `story-screen-map.csv` — the INSP-524
   deliverable — does not exist. At least 10 Planning stories have no identified screen.
3. **`/planning/supervision` implies a Supervisor persona the catalogue never defines.**
4. `/planning` and `/visits` render the same row under two different identities —
   `visit_reference` versus `id.slice(0,8)`. A correctness defect surfaced by the audit.
5. Five design-system components — `InspectionCard`, `FilterBar`, `Combobox`, `ReviewPanel`,
   `DiffView` — are exported, persona-ready, and have **zero call sites**. Every screen
   re-authored the markup instead. That is the root cause behind the duplicate count, and it is a
   repo change, out of scope for the Figma master.

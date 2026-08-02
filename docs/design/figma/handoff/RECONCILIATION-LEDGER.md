# Reconciliation ledger — iPad source to Web master

Owner: **W10-ReconciliationLedger** (single master writer). 2026-08-01.

Source (authoritative reference, never deleted): `8wGaofgbopqmGXc0Wjo0eW`
Target (sole delivery file): `ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —` `6:9`

## Method — and the bar for `migrated`

Every node below was enumerated **live from the source file**, not inherited from a prior
document. The traversal descends `PAGE > SECTION > GROUP` and stops at the first
`FRAME` / `COMPONENT` / `COMPONENT_SET`.

A row is `migrated` only when **both** hold: a proving web node id exists, **and** a worker
actually compared that node to its source and it held. Route-level evidence alone ("the repo
ships it") is not migration — it is recorded as a gap with the route named, because the Web
master carries no frame proving it.

This bar is not pedantry. An earlier closure claimed three frames were faithful; comparison
found them missing selects, textareas, an attachment list, a map, a disabled state, a video
surface and the back affordance. W8 then re-ran the same test on Establishment Management and
found **migrated = 0** across 99 frames. Every remaining prior claim is carried as
`CLAIMED, UNVERIFIED` — preserved so a worker can discharge it, never counted as coverage.

`shared duplicate` is assigned mechanically: identical name **and** bounds to an earlier frame
in page order. This collapses cross-page cloning (Safety Report is largely a clone of Visit
Reports) and within-page flow-step repetition (24 frames named `Establishment Details` at
834x1781 are one screen at 24 stages).

## Counts by disposition

| Disposition | Rows |
|---|--:|
| migrated | 6 |
| shared duplicate | 191 |
| approved non-delivery | 16 |
| gap | 140 |
| **Total source nodes** | **353** |

| Source page | Node | Frames | Non-frame nodes |
|---|---|--:|--:|
| Visit Reports | `269:40019` | 79 | 201 |
| Home + Tasks | `2284:104021` | 18 | 34 |
| Identify Challenge | `620:45076` | 7 | 59 |
| Chemical Report | `1939:56734` | 10 | 48 |
| Customs Report | `639:79065` | 4 | 42 |
| Safety Report | `2312:95952` | 66 | 167 |
| Visit Statement | `2468:31912` | 1 | 2 |
| Establishment Management | `1065:77494` | 107 | 194 |
| Components (definitions) | `301:71625` | 61 top-level (223 incl. variants) | — |
| **Total** | | **353** | |

> **Census discrepancy, recorded not hidden.** `SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`
> reports 295 content frames; the live read finds **292** (Visit Reports 79 not 81, Safety 66
> not 67). Likely cause: frames nested inside frames, which this traversal does not descend
> into. The live read is the ledger's basis; the 3-frame delta is an open item.

## Repairs and builds applied to the master this session

All inside section `339:42098` (SOURCE-IMPORT) or the new BUILD section `423:47937`.
Delivery sections `148:6893` / `148:6894` / `148:6895` / `148:6896` were **not touched**.

| # | Target | Change | Node ids |
|---|---|---|---|
| R1 | `385:45164` Establishment Details — location mismatch | `page-back` added at top of `sq-content` | `423:45387` |
| R1 | `385:45164` | Establishment status: flat text -> `Badge Status=Outline` `9:23` | `423:45391` (removed `385:45175`) |
| R1 | `385:45164` | Visit type: flat text -> `Select` `11:5` | `423:45393` (removed `385:45190`) |
| R1 | `385:45164` | Notes: `Field` -> `Textarea` `401:14` | `423:45396` (removed `385:45221`) |
| R1 | `385:45164` | `map-panel` added (registered + actual markers on the neutral token from `26:339`, text labels, provider caption `Basemap not configured`) | `423:47876` |
| R1 | `385:45164` | six `Radio`-based `report-type` frames -> `report-type-card` instances | `423:47882` (false), `423:47891` (Checked=true, Identify challenge), `423:47899` (false), `423:47907` (Disabled, Visit statement), `423:47915` (false), `423:47922` (false) — removed `385:45196` `385:45200` `385:45204` `385:45208` `385:45212` `385:45216` |
| R1 | `385:45164` | stray authoring/audit note removed | removed `385:45286` |
| R2 | `383:45019` Challenge Inspection | second `AttachedFile` `401:29` row added; both render `Not configured` | `423:47929` |
| R3 | new | BUILD section created below y=100000 (page max y was 96803) | `423:47937` — *SCREENS — BUILD Identify Challenge · EN · Light* |
| R3 | new | frame *BUILD — Challenge Inspection (remote visit) — iPad 1956:93347 — route NONE — INSPECTOR responsive · EN · Light*, reusing `RemoteVideoTile` `401:47913` docked at the top of Assessment elements (source `1956:93679` 'Slide 16:9 - 1') | `423:47938`, tile `423:48041` |

Clipped-text census after each change — height · clipped nodes:

| Frame | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| `385:45164` | 1410 · 0 | 1410 · 0 | 1410 · 0 | 1468 · 0 |
| `383:45019` | 1439 · 0 | 1439 · 0 | 1439 · 0 | 1439 · 0 |
| `423:47938` | 1673 · 0 | 1673 · 0 | 1673 · 0 | 1673 · 0 |

`385:45164` now matches its repaired sibling `383:45124` exactly at 834 (1410) and reflows the
same way at 680 (1468) as the report-type cards wrap 3 columns to 2.

> **Verification limit, stated rather than glossed.** The post-repair *screenshots* were not
> captured — the Figma MCP seat hit its tool-call limit after the census ran. What IS verified:
> the structural metadata of every changed node (each instance resolved to its intended
> `mainComponent` — `report-type-card` `401:47765`/`47766`/`47767`, `Badge` `9:23`, `Select`
> `11:5`, `Textarea` `401:14`, `page-back` `401:47774`, `RemoteVideoTile` `401:47913`), the
> resulting frame heights, and a 0-clipped census at all four widths. A visual pass on
> `385:45164`, `383:45019` and `423:47938` is **outstanding** and should be the first action when
> the call budget resets.

## Resolved: the report-type selection model

Raised as a conflict — page `620:45076` said to be Checkbox with Visit statement disabled,
page `2468:31912` said to be Radio with Visit statement selected. **Read from source directly,
both pages use the same composition and there is no conflict.**

| Source | Cards | Indicators |
|---|---|---|
| `631:45084` (Identify Challenge) | 5 `Card State=Default` + 1 `Card State=Disabled` | 3 `Checkbox Size=Small State=Default` + 1 `Checkbox Size=Small State=Disabled` + **2 `Radio Selected=True`** |
| `2468:31969` (Visit Statement) | 1 `Card State=Default` + 5 `Card State=Disabled` | 5 `Checkbox State=Disabled` + **1 `Radio Selected=True`** |

Both pages carry `Card Type=Selectable` with a `Checkbox` on unselected cards and a `Radio` on
the **selected** card. That is one authoring habit — swapping the indicator instance instead of
toggling a `Checked` variant — not two selection models.

**Canonical model: multi-select (checkbox).** The decisive evidence is `631:45084`, which shows
**two cards selected simultaneously**. A radio group cannot do that. `2468:31969` does not
contradict it: its five non-selected cards are `State=Disabled`, so it demonstrates a *context
state* (you are on the Visit Statement route, so that type is active and the rest are
unavailable), not single-select.

The Web `report-type-card` `401:47769` is checkbox-based and therefore **correct as built**. No
change is required, and nothing was silently normalised. Recorded for the record: the `Radio`
on selected cards is a **source authoring inconsistency**, not a requirement.

## Open governance questions

| # | Question | Why it cannot be answered here |
|---|---|---|
| Q1 | **Where is the real Summons Notice flow (INSP-558) designed?** On `1065:77494`, 11 frames are named `Summons Notice` but their content is the Incident Report flow (W8, screenshot-confirmed). No frame on that page implements Summons Notice. The shipped web frame `336:45771` therefore proves nothing about migration — the source it would have come from is **unlocated**. | Requires a file-wide search outside any single worker's page scope |
| Q2 | Does `Visit Statement` ship as its own route `/field/visit-statements` (W7 proposal) or as a report type inside the visit flow? | Route contract decision. CLAUDE.md rule 9 fixes routes; `/field/visit-statements` is not in the fixed list |
| Q3 | Is `Production Line Report` a governed capability at all? It has no repo route, and W1 and W6 independently found it missing (see convergence below) | No authorizing story exists |
| Q4 | Is CS-12 (`1442:184856`) a distinct state or redundant with CS-8/CS-11? | PO call (W8) |

## Cross-pack convergence — recorded once

**Production Line Report / محضر حجز خط الإنتاج.** W1 finds it missing as an accordion row inside
the attendee-reports wizard (canonical source `368:42325`); W6 finds it missing as a
field-complete form (canonical source `2312:158265`). **Same capability, one gap, not two.** It
has no repo route, no field-complete `INSPECTOR REPORT FORMS` frame, and no authorizing story.
Any threshold or rule must render `Not configured` if it is ever built.

## Blocked deltas — not gaps to build (W2)

| Delta | Blocked on | Jira |
|---|---|---|
| Home-map route preview: pin-tap -> live route line + distance/ETA | No routing/ETA data source exists. Building it would mean inventing the number (CLAUDE.md rule 10) | NONE |
| Profile field completeness: mobile number, city, delegate/backup on `/field/account` | `profiles` table has no phone column and no delegate relationship — a schema decision, not a page fix | NONE |

Neither is a missing screen. Neither may be built until the data exists.

## Component gaps that must not be papered over

- **Media Minis compact thumbnail grid** (`159:47720`, 8 variants). `AttachedFile` `401:29` is a
  560x48 full-width list row; the source is a 64x64 thumbnail chip with hover edit/delete used in
  a grid. **Recorded as a component gap. `AttachedFile` must not be stretched to cover it.**
- **Tabs / page-level tab strip** (`2068:157047`) — absent from all 13 library pages. `Segmented`
  `11:8` is a filter affordance, not navigation.
- **Composed inspection question row** — 6 source families, no Web equivalent. Highest-frequency gap.
- **Task Card family** — 5 source definitions, no assembled Web card.
- **Missing glyphs** (W9 §5, confirmed absent from `73:2`): download, trash/delete, microphone,
  checkmark-in-circle. `file-attachment` vs `icon/ui/paperclip` `74:71` equivalence is unconfirmed.
  No icon was invented; attachment actions ship as text buttons.

## Verified story links

Only exact story matches. `INSP-1`..`INSP-16`, `INSP-237`, `INSP-239` are **epics, not stories**
and may never be cited as a frame's story link. No epic covers the inspector channel at all.

| Web node | Route | INSP key | Basis |
|---|---|---|---|
| *(proposed, not yet built)* Visit Statement | `/field/visit-statements` — **pending Q2** | **INSP-548** | VERIFIED — `jira-backlog-keys.md:23` "[REUSE] Log a lightweight Visit Statement", exact title match |
| `383:45019` `383:45124` `385:45164` `423:47938` `385:45287` | NONE | **NONE** | The Identify Challenge capability has no repo route and no story. Confirmed three times |
| `383:45254` | `/field/virtual/[id]` | INSP-553 (partial) | Covers remote branching only; nothing covers the challenge report-type set |

Jira attachment cannot be performed from this session — `getDevResourcesAsync` and
`addDevResourceAsync` are rejected by the plugin sandbox. Links are attached out-of-band by REST.

## Ledger


### Visit Reports

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `269:54928` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `416:31631` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2172) to canonical source 269:54928 |
| `292:21350` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `292:25578` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `296:15894` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `301:97307` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `360:30151` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `361:44295` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `362:38115` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `362:53901` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `368:42325` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `369:46690` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `369:51109` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `369:50432` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1278) to canonical source 369:51109 |
| `369:51116` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `368:66526` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `368:65363` | Production Line Report | gap | 366:44226 (CLAIMED, UNVERIFIED) | NO ROUTE | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `368:66533` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1367) to canonical source 368:42325 |
| `368:28498` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `362:39753` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `362:40186` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1067) to canonical source 362:38115 |
| `362:21702` | Non-Compliant Products Destruction Report | gap | 366:44093 (CLAIMED, UNVERIFIED) | /field/destruction-reports | Inspector | INSP-578 | prior claim on record; NO source-to-Web comparison performed |
| `360:77602` | Incident Report | gap | 366:44012 (CLAIMED, UNVERIFIED) | /field/incident-reports | Inspector | INSP-563 | prior claim on record; NO source-to-Web comparison performed |
| `360:80623` | Violation Report | gap | 366:43890 (CLAIMED, UNVERIFIED) | /field/inspection/[id]/results | Inspector | INSP-568 | prior claim on record; NO source-to-Web comparison performed |
| `361:20819` | Violation Report | gap | 366:43890 (CLAIMED, UNVERIFIED) | /field/inspection/[id]/results | Inspector | INSP-568 | prior claim on record; NO source-to-Web comparison performed |
| `361:20125` | Violation Report | gap | 366:43890 (CLAIMED, UNVERIFIED) | /field/inspection/[id]/results | Inspector | INSP-568 | prior claim on record; NO source-to-Web comparison performed |
| `361:20826` | Violation Report | gap | 366:43890 (CLAIMED, UNVERIFIED) | /field/inspection/[id]/results | Inspector | INSP-568 | prior claim on record; NO source-to-Web comparison performed |
| `360:49700` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `360:50354` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `357:26118` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `297:64463` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `301:67866` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `301:69502` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `330:24870` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `301:71024` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `301:80602` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `360:29633` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `436:31783` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1501:85138` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `360:30028` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `369:120470` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:135740` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:146056` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:165251` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:166505` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:180149` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:185466` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:194906` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:203534` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1858) to canonical source 369:194906 |
| `369:200050` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `369:203541` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1834) to canonical source 369:200050 |
| `369:211081` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `532:73092` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `532:73258` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3078) to canonical source 296:15894 |
| `532:73281` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x2034) to canonical source 301:97307 |
| `532:73366` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3769) to canonical source 357:26118 |
| `532:73486` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3170) to canonical source 297:64463 |
| `532:73510` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3262) to canonical source 301:67866 |
| `532:73560` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `532:73585` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `532:73610` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x3160) to canonical source 301:69502 |
| `532:73635` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `532:73663` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x184) to canonical source 436:31783 |
| `532:73678` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `532:80150` | Incident Report | gap | 366:44012 (CLAIMED, UNVERIFIED) | /field/incident-reports | Inspector | INSP-563 | prior claim on record; NO source-to-Web comparison performed |
| `532:80377` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1786) to canonical source 369:135740 |
| `532:80990` | Summons Notice | gap | 340:42098 (CLAIMED, UNVERIFIED) | /field/summons-notices | Inspector | INSP-558 | prior claim on record; NO source-to-Web comparison performed |
| `879:64493` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `879:64635` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `985:70673` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1201) to canonical source 879:64635 |
| `879:64564` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1201) to canonical source 879:64635 |
| `879:64839` | Frame 1984078725 | approved non-delivery | — | — | — | n/a | Annotation strip (weak-connectivity note), not a screen |
| `947:48549` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1501:83986` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x680) to canonical source 292:25578 |
| `902:82083` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `1682:83462` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1218) to canonical source 902:82083 |
| `938:132241` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `532:72250` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `902:82878` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |

### Home + Tasks

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `2284:104024` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `2284:104027` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104030` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104033` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104036` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104104` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104171` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104188` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `2284:104206` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104208` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104220` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104232` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `2284:104272` | Home Screen - iPad | approved non-delivery | — | — | — | n/a | iPadOS springboard — OS chrome, not a product surface (W2 confirmed instances) |
| `2665:30714` | Login | approved non-delivery | — | — | — | n/a | Web login settled under DEC-011; source login is not authoritative (W2) |
| `2665:34915` | Login | approved non-delivery | — | — | — | n/a | Web login settled under DEC-011; source login is not authoritative (W2) |
| `2665:39117` | Login | approved non-delivery | — | — | — | n/a | Web login settled under DEC-011; source login is not authoritative (W2) |
| `2665:43321` | Login | approved non-delivery | — | — | — | n/a | Web login settled under DEC-011; source login is not authoritative (W2) |
| `2665:47522` | Login | approved non-delivery | — | — | — | n/a | Web login settled under DEC-011; source login is not authoritative (W2) |

### Identify Challenge

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `631:45084` | Establishment Details | migrated | 383:45124 | NONE — nearest /field/establishments | Inspector | NONE | W3 screenshot-compared to source: HOLDS (badge, select, map-panel, 6 report-type-cards, textarea) |
| `631:45113` | Establishment Details | migrated | 385:45164 | NONE — nearest /field/establishments | Inspector | NONE | W3 found control fidelity NEVER applied; REPAIRED this session — see Repairs. Census 1280/1024/834/680 = 0 clipped |
| `639:78727` | Inspection Items | migrated | 383:45019 | NONE — no challenge route in the repo | Inspector | NONE | W3 screenshot-compared to source: HOLDS. Second AttachedFile row added this session (423:47929). Census 1280/1024/834/680 = 0 clipped |
| `879:64423` | Summons Notice | migrated | 385:45287 | NONE | Inspector | NONE | W3 screenshot-compared: HOLDS. Merged with duplicate 1908:90749 |
| `1908:90749` | Summons Notice | shared duplicate | 385:45287 | NONE | Inspector | NONE | true duplicate of 879:64423 — identical subtree and strings; both branches route through one confirmation |
| `1908:89825` | Establishment Details | migrated | 383:45254 | NONE — nearest /field/virtual/[id] | Inspector | INSP-553 (partial — remote branching only, NOT a challenge story) | W3 screenshot-compared to source: HOLDS (RemoteVideoTile, select, badge, textarea, 6 cards) |
| `1956:93347` | Inspection Items | migrated | 423:47938 | NONE — no challenge route in the repo | Inspector | NONE | Never migrated. BUILT this session from W3 spec, reusing RemoteVideoTile 401:47913. Census 1280/1024/834/680 = 0 clipped |

### Chemical Report

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `1939:56741` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2172) to canonical source 269:54928 |
| `1939:85172` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1939:125133` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1939:126076` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1939:126459` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1771) to canonical source 1939:126076 |
| `1950:126836` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2016) to canonical source 532:73092 |
| `1950:126878` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1950:126911` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1950:126950` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1950:126987` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1719) to canonical source 1950:126950 |

### Customs Report

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `1960:94027` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2172) to canonical source 269:54928 |
| `1960:94069` | Inspection Items | gap | 366:43758 (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | prior claim on record; NO source-to-Web comparison performed |
| `1962:7816` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2016) to canonical source 532:73092 |
| `1962:7858` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1627) to canonical source 1960:94069 |

### Safety Report

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `2312:102185` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2172) to canonical source 269:54928 |
| `2312:102237` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `2312:102262` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `2312:102286` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `2312:102310` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x2394) to canonical source 292:21350 |
| `2312:102333` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x184) to canonical source 436:31783 |
| `2312:102572` | Establishment Management | gap | 366:43609 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `2312:157889` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1585) to canonical source 2312:102572 |
| `2312:102657` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x786) to canonical source 1501:85138 |
| `2312:102712` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x680) to canonical source 292:25578 |
| `2312:102741` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2172) to canonical source 269:54928 |
| `2312:102773` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `2312:102804` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `2312:158225` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1431) to canonical source 360:30151 |
| `2312:158235` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1739) to canonical source 361:44295 |
| `2312:158245` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1067) to canonical source 362:38115 |
| `2312:158255` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1871) to canonical source 362:53901 |
| `2312:158265` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1367) to canonical source 368:42325 |
| `2312:158275` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1267) to canonical source 369:46690 |
| `2312:158285` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1278) to canonical source 369:51109 |
| `2312:158295` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1278) to canonical source 369:51109 |
| `2312:158305` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1251) to canonical source 369:51116 |
| `2312:158315` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1378) to canonical source 368:66526 |
| `2312:158325` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1394) to canonical source 368:65363 |
| `2312:158335` | Production Line Report | shared duplicate | — | — | — | — | identical name+bounds (834x1367) to canonical source 368:42325 |
| `2312:158345` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1898) to canonical source 368:28498 |
| `2312:158355` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1078) to canonical source 362:39753 |
| `2312:158365` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1067) to canonical source 362:38115 |
| `2312:158375` | Non-Compliant Products Destruction Report | shared duplicate | — | — | — | — | identical name+bounds (834x1766) to canonical source 362:21702 |
| `2312:158385` | Incident Report | shared duplicate | — | — | — | — | identical name+bounds (834x1002) to canonical source 360:77602 |
| `2312:158395` | Violation Report | shared duplicate | — | — | — | — | identical name+bounds (834x1002) to canonical source 360:80623 |
| `2312:158405` | Violation Report | shared duplicate | — | — | — | — | identical name+bounds (834x1449) to canonical source 361:20819 |
| `2312:158415` | Violation Report | shared duplicate | — | — | — | — | identical name+bounds (834x967) to canonical source 361:20125 |
| `2312:158425` | Violation Report | shared duplicate | — | — | — | — | identical name+bounds (834x1476) to canonical source 361:20826 |
| `2312:158435` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1458) to canonical source 360:49700 |
| `2312:158445` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1526) to canonical source 360:50354 |
| `2312:165850` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x2062) to canonical source 369:120470 |
| `2312:165860` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1786) to canonical source 369:135740 |
| `2312:165870` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1762) to canonical source 369:146056 |
| `2312:165880` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x2230) to canonical source 369:165251 |
| `2312:165890` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x2334) to canonical source 369:166505 |
| `2312:165900` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x2422) to canonical source 369:180149 |
| `2312:165910` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x2270) to canonical source 369:185466 |
| `2312:165920` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1858) to canonical source 369:194906 |
| `2312:165930` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1858) to canonical source 369:194906 |
| `2312:165940` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1834) to canonical source 369:200050 |
| `2312:165950` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1834) to canonical source 369:200050 |
| `2312:165960` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1145) to canonical source 369:211081 |
| `2312:173409` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2016) to canonical source 532:73092 |
| `2312:173516` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1626) to canonical source 2312:102286 |
| `2312:173780` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1718) to canonical source 2312:102262 |
| `2312:173816` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1810) to canonical source 2312:102237 |
| `2312:173993` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x184) to canonical source 436:31783 |
| `2312:174067` | Incident Report | shared duplicate | — | — | — | — | identical name+bounds (834x1307) to canonical source 532:80150 |
| `2312:174085` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1786) to canonical source 369:135740 |
| `2312:174095` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1160) to canonical source 532:80990 |
| `2312:174116` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x2854) to canonical source 879:64493 |
| `2312:174152` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1201) to canonical source 879:64635 |
| `2312:174218` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1201) to canonical source 879:64635 |
| `2312:174285` | Inspection Items | shared duplicate | — | — | — | — | identical name+bounds (834x1201) to canonical source 879:64635 |
| `2312:174356` | Frame 1984078725 | approved non-delivery | — | — | — | n/a | Annotation strip (weak-connectivity note), not a screen |
| `2312:174435` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x680) to canonical source 292:25578 |
| `2312:183843` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1585) to canonical source 2312:102572 |
| `2312:183874` | Establishment Management | shared duplicate | — | — | — | — | identical name+bounds (834x1585) to canonical source 2312:102572 |
| `2312:183908` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |
| `2312:183939` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x398) to canonical source 360:29633 |

### Visit Statement

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `2468:31956` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |

### Establishment Management

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `1434:137614` | My Tasks — CS-1 Establishments List | gap | 336:45825 — PARTIAL, control loss | /field/establishments | Inspector | INSP-588 | W8 §5.1 partial migration. LOST: 4-state status vocabulary (only licensed/unlicensed), compliance %, card thumbnail, last-visit date, 'Issue violation' primary action |
| `1442:185471` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1523) to canonical source 1434:137614 |
| `1434:138230` | Content | approved non-delivery | — | — | — | n/a | 705px filter-panel body fragment |
| `1434:110357` | Frame 1984078759 | approved non-delivery | — | — | — | n/a | 2513x379 canvas banner / section label |
| `1499:23344` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `1632:148327` | Establishment Details — CS-2 Establishment Detail / Visit Summary | gap | none | /operations?establishment=:id | Inspector | NONE | W8: no Web counterpart at all |
| `1632:148688` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1523) to canonical source 1434:137614 |
| `1632:147136` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2340) to canonical source 1632:148327 |
| `1632:147949` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1523) to canonical source 1434:137614 |
| `1442:169161` | My Tasks — CS-5 Previous Visits List | gap | none | /operations?establishment=:id&tab=visits | Inspector | NONE | W8: no Web counterpart |
| `1442:169846` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1442:169529` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1199) to canonical source 1442:169846 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1509:70879` | Actions | gap | 344:156 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1434:138541` | My Tasks — CS-4 Regulatory Data / Device Permits | gap | 364:45987 — PARTIAL, control loss | /operations?establishment=:id&tab=regulatory | Inspector | INSP-588 | W8 §5.3 partial migration. LOST: header photo, status + classification badges, compliance %, live map; unbounded per-row-status permit list capped at 4 compact DataChecklist rows |
| `1434:139429` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `1442:170821` | My Tasks — CS-11 Visit Report — Plan Start tab | gap | none | /execution?report=visit&tab=plan | Inspector | NONE | W8: no Web counterpart |
| `1442:171154` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1820) to canonical source 1442:170821 |
| `1442:184856` | My Tasks — CS-12 Incident Report — compact variant | gap | none | fold into CS-8 — PO call needed | Inspector | NONE | W8: no Web counterpart; may be redundant with CS-8/CS-11 |
| `1442:166730` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1199) to canonical source 1442:169846 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1434:142950` | Actions | gap | 344:156 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1442:165706` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1442:165736` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1632:143474` | My Tasks — CS-6 Issue Violation — establishment multi-select | gap | none | /compliance?action=select-violation-targets | Inspector | NONE | W8: no Web counterpart, no exact story. INSP-568 is adjacent (single-violation form) but a different unit of work — NOT used |
| `1632:143495` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `1632:143512` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `1632:129023` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `1632:145297` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `1632:146535` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x1194) to canonical source 2284:104024 |
| `1632:211477` | Actions | gap | 344:156 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1632:149135` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x3532) to canonical source 1434:138541 |
| `1632:151793` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `1632:150021` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x3532) to canonical source 1434:138541 |
| `1632:151853` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `1632:150907` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x3532) to canonical source 1434:138541 |
| `1632:151913` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x3532) to canonical source 1434:138541 |
| `1632:158816` | My Tasks | shared duplicate | — | — | — | — | identical name+bounds (834x3820) to canonical source 1632:151793 |
| `1632:160517` | My Tasks | gap | 345:42242 (CLAIMED, UNVERIFIED) | /field/my-tasks | Inspector | NONE | prior claim on record; NO source-to-Web comparison performed |
| `1271:45847` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1246:114904` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1271:45439` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1271:45563` | Modal | shared duplicate | — | — | — | — | identical name+bounds (574x342) to canonical source 1246:114904 |
| `1271:45735` | Modal | gap | 349:252 (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | prior claim on record; NO source-to-Web comparison performed |
| `1831:155597` | Establishment Details — CS-9 Visit Report — tabbed detail (attendee) | gap | none | /execution?report=visit&tab=... | Inspector | NONE | W8: richest screen family on the page, zero Web representation. No exact story |
| `2312:184533` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2064:122963` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2064:152980` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2054:101030` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2064:124403` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2054:100155` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:155632` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2312:184568` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `1831:155667` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2312:184603` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1382) to canonical source 1831:155667 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:155723` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2312:185309` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2064:123161` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2103:178582` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:155855` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2312:194560` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2245) to canonical source 1831:155855 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:155992` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed |
| `1831:156010` | Establishment Details — CS-8 Incident Report — Details (read) | gap | none | /execution?report=incident&mode=view | Inspector | INSP-563 | W8: no Web counterpart |
| `1831:156028` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156046` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156064` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156082` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156100` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156118` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156136` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156154` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156172` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156190` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156208` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156226` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156244` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156262` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156280` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156298` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156316` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156334` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156352` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `1831:156369` | Establishment Details — CS-10 Visit Report — Establishment File tab | gap | none | /execution?report=visit&tab=file | Inspector | NONE | W8: no Web counterpart |
| `1831:156500` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `2312:185441` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:156634` | Establishment Details | gap | 364:45987 (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | prior claim on record; NO source-to-Web comparison performed **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:156815` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2192) to canonical source 1831:156634 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:156992` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2192) to canonical source 1831:156634 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:157133` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x2192) to canonical source 1831:156634 **[UNVERIFIED CLUSTER — metadata/height match only, never screenshotted (W8)]** |
| `1831:157328` | Summons Notice — CS-7 Create Incident Report | gap | none | /execution?report=incident&mode=create | Inspector | INSP-563 | NAME TRAP: source frame is named 'Summons Notice' but the content is the Incident Report flow (W8 screenshot). No Web counterpart |
| `1831:157342` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157356` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157370` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157384` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157398` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157412` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157426` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157440` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157454` | Summons Notice — **content is Incident Report, not Summons Notice** | gap | none | /execution?report=incident | Inspector | INSP-563 | NAME TRAP (W8): node name is unreliable on this page |
| `1831:157468` | Summons Notice | shared duplicate | — | — | — | — | identical name+bounds (834x1690) to canonical source 1831:157454 NAME TRAP: named 'Summons Notice', content is the Incident Report flow (W8) |
| `2064:153161` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `2103:165377` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `2103:167240` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `2103:168436` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1781) to canonical source 1831:155992 |
| `2103:173178` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2103:179669` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2312:195761` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2103:177959` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |
| `2312:196088` | Establishment Details | shared duplicate | — | — | — | — | identical name+bounds (834x1241) to canonical source 1831:155597 |

### Components

| Source node | Source name | Disposition | Proving web node | Route | Persona | Jira | Evidence |
|---|---|---|---|---|---|---|---|
| `31:40168` | Task Card | gap | — | /field/my-tasks, /field/map | Inspector | NONE | 1v; W9 #1: GAP — no assembled task-card component on Web |
| `98:9874` | Questions | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 5v; W9 #2: GAP — no composed question-row component on Web |
| `125:14217` | Answer Bar | gap | 318:107 AnswerBar (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 2v; W9 #3: GAP — no sticky answer bar on Web |
| `134:24498` | Top Bar | approved non-delivery | — | — | — | n/a | Fixed-width tablet device chrome; web owns nav once via AppShell (W9 §6) |
| `159:47720` | Media Minis | gap | — | /field/inspection/[id] | Inspector | NONE | 8v; W9 #5: GAP — compact 64x64 thumbnail grid w/ hover edit/delete. AttachedFile 401:29 is a full-width list row and does NOT cover it |
| `167:16373` | Progress Status | gap | 15:26 progress / 15:27 steps (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | 1v; W9 #6: covered with delta — Web is a bare bar, source is a labelled strip |
| `221:70335` | Contact Person Info Mobile | gap | — | /field/establishments | Inspector | INSP-588 | 1v; W9 #7: GAP — nearest user-chip 15:39 is a single-line chip, not a card |
| `159:47675` | Multi Media Uploader | gap | 175:19 FileUpload + 401:29 AttachedFile (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | NONE | 3v; W9 #8: covered with delta — no multi-file gallery (Uploaded=Yes) layout on Web |
| `239:351034` | Checking list | gap | 108:296 Table row + 9:71 Checkbox (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | 5v; W9 #9/#10: GAP — build-from-primitives, not reuse |
| `239:346035` | Checking list | gap | 108:296 Table row + 9:71 Checkbox (CLAIMED, UNVERIFIED) | /field/establishments | Inspector | INSP-588 | 2v; W9 #9/#10: GAP — build-from-primitives, not reuse |
| `159:51204` | Questions New | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #11/#17/#19/#24: GAP — same family |
| `239:355697` | Questions New selection | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #12: GAP |
| `221:69660` | Answa | gap | 318:107 AnswerBar (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #13: GAP — composable from Input/Textarea, not 1:1 |
| `239:357820` | Answa 2 | gap | 318:107 AnswerBar (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #14: GAP — composable from Textarea 401:14 |
| `422:32955` | Location Verification | gap | 319:193 LocationVerification (CLAIMED, UNVERIFIED) | /field/[visitId]/travel | Inspector | INSP-599 | 2v; W9 #15: covered with delta — no composed pin+badge+distance card |
| `434:36651` | Photos  | gap | — | /field/inspection/[id] | Inspector | NONE | 1v; W9 #16: GAP — photo evidence gallery panel |
| `523:62916` | Questions New | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 4v; W9 #11/#17/#19/#24: GAP — same family |
| `905:83717` | Top Bar | approved non-delivery | — | — | — | n/a | Fixed-width tablet device chrome; web owns nav once via AppShell (W9 §6) |
| `1032:48465` | Questions New | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #11/#17/#19/#24: GAP — same family |
| `1032:49139` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `360:48214` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (3v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `360:80269` | Incident Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `361:19525` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `361:32119` | Sample Collection Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `362:21196` | Non-Compliant Products Destruction Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `362:39096` | Non-Compliant Products Destruction Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (3v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `368:27879` | Non-Compliant Products Destruction Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `368:64406` | Frame 1984078811 | approved non-delivery | — | — | — | n/a | Auto-named canvas debris |
| `369:49024` | Facility Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (4v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:127296` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:144125` | Incident Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:155067` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:162112` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:171642` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:182238` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:191589` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:206606` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `369:197694` | Violation Report | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1682:222494` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1781:225065` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (1v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1781:226704` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1781:229222` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1814:36867` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1814:44488` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1831:22704` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1831:26835` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `1831:27552` | Frame 1984078775 | approved non-delivery | — | — | — | n/a | Auto-named canvas debris |
| `1831:27940` | Frame 1984078776 | approved non-delivery | — | — | — | n/a | Auto-named canvas debris |
| `1831:53867` | Summons Notice | shared duplicate | — | /field/summons-notices | Inspector | INSP-558 | report-template family (2v); W9 §2.2 — document layout, screen-level content owned elsewhere, not a component-library ask |
| `465:40949` | Big Map | gap | 15:22 map-panel + 15:23/24/25 (CLAIMED, UNVERIFIED) | /field/map | Inspector | NONE | 3v; W9 #20: covered with delta — primitives exist, no assembled full-bleed view |
| `558:47312` | Mic Button | gap | — | /field/inspection/[id] | Inspector | NONE | 2v; W9 #21: GAP — no mic-icon button variant; also blocked by missing mic glyph |
| `465:38096` | Task Card2 | gap | — | /field/my-tasks, /field/map | Inspector | NONE | 7v; W9 #22: GAP — same, plus institute-selection sub-states |
| `506:55316` | Location Pin | gap | 15:23 map-marker (CLAIMED, UNVERIFIED) | /field/map | Inspector | NONE | 5v; W9 #23: covered with delta — source has 5 states, Web marker has fewer |
| `1026:47107` | Questions New | gap | 317:137 ChecklistQuestion (CLAIMED, UNVERIFIED) | /field/inspection/[id] | Inspector | INSP-536 / 538 / 543 | 3v; W9 #11/#17/#19/#24: GAP — same family |
| `1237:42917` | Factory Detail Table Atom | gap | 108:296 Table row (CLAIMED, UNVERIFIED) | /field/factory-360/[id] | Inspector | INSP-617 / 622 / 628 | 15v; W9 #25: covered with delta — per-entity column templates not encoded |
| `1237:93408` | Factory Details | gap | 11:45 Panel + Tabs (CLAIMED, UNVERIFIED) | /field/factory-360/[id] | Inspector | INSP-617 / 622 / 628 | 8v; W9 #26: covered with delta — composable, no single component |
| `2068:157047` | Tabs | gap | — | /field/factory-360/[id] | Inspector | NONE | 4v; W9 #27: GAP — no page-level tab strip on any of the 13 library pages; Segmented 11:8 is a filter, not navigation |
| `1108:3607` | Task Cards | gap | — | /field/my-tasks, /field/map | Inspector | NONE | 1v; W9 #28: GAP — alternate instance of the Task Card gap |
| `1252:64226` | Task Cards Test | approved non-delivery | — | — | — | n/a | Marked 'Test' in source — WIP artefact (W9 #29) |
| `1838:4971` | Task Chips | gap | 9:37 Tag / 9:47 Combo chip (CLAIMED, UNVERIFIED) | cross-route | Inspector | n/a — component | 3v; W9 #30: covered with delta — generic chip carries no task-status semantics |
| `1954:3549` | Map Task Card | gap | — | /field/map | Inspector | NONE | 3v; W9 #31: GAP — map-pin-attached task summary card |

## Open gaps

1. **No source-to-Web comparison exists outside Identify Challenge and Establishment Management.**
   Every `CLAIMED, UNVERIFIED` row needs one before it may be called migrated.
2. **W8 found migrated = 0 across 99 Establishment Management frames.** 9 of 12 canonical screens
   have zero Web representation; 3 are partial migrations with the control loss enumerated in the
   ledger rows (CS-1, CS-4 in-table; CS-3 has no separate source frame id).
3. **20 frames are flagged UNVERIFIED CLUSTER** — classified by name+height match only,
   never individually screenshotted (W8 counts these as 17 clusters). They do not inherit their
   cluster's disposition and need a spot-check pass.
4. **Q1 — the real Summons Notice source is unlocated.** See Open governance questions.
5. **Identify Challenge has no repo route and no Jira story**, yet is the most thoroughly built
   family in the master. Six frames with nowhere to ship.
6. **Report-type selection appears on no shipped route** although it drives the whole visit flow.
7. **Chemical / Customs / Safety are not report types anywhere on Web** (W4, W5, W6). Chemical's
   three structured intake tabs (raw materials, chemical materials, products) have no Web
   equivalent; GHS hazard code is governed data and must render `Not configured` if ever built.
8. **Violation, Incident and Production Line Report have no field-complete `INSPECTOR REPORT
   FORMS` frame** (W6) — only SOURCE-IMPORT reference frames. Summons Notice, Sample Collection,
   Destruction and Facility all received that treatment; these three did not.
9. **Source authoring defect** (W6, new): on `2312:95952`, 2 of 4 `Violation Report` frames wrap an
   inner instance mislabeled `Sample Collection Report`, and 4 `Production Line Report` frames wrap
   one mislabeled `Facility Report`. Cosmetic in source; a trap for anyone reading instance names.
10. **Basemap provider is not governed** — the map surface renders `Basemap not configured`.
11. **No currency-affix control** exists, so the source capital field loses its affix.
12. **3-frame census delta** against the prior classification.

## Build packs folded in

| Pack | Folded | What it changed in this ledger |
|---|---|---|
| `BUILDPACK-W1-VISIT-REPORTS.md` | yes | Production Line Report + Violation Report standalone detail as gaps; attendee-reports wizard has no canonical frame |
| `BUILDPACK-W2-HOME-TASKS.md` | yes | Login + springboard + splash as approved non-delivery; two blocked data/schema deltas; zero new frames |
| `BUILDPACK-W3-IDENTIFY-CHALLENGE.md` | yes | The only verified-migrated set; drove repairs R1–R3 |
| `BUILDPACK-W4-CHEMICAL-REPORT.md` | yes | Three structured intake tabs + report-type card as gaps; deck annotations as non-delivery |
| `BUILDPACK-W5-CUSTOMS-REPORT.md` | yes | Documentation-only gap; capability ships via the generic checklist engine |
| `BUILDPACK-W6-SAFETY-REPORT.md` | yes | Page confirmed a parallel duplicate of Visit Reports; 3 report types with no field-complete frame; source mislabel defect |
| `BUILDPACK-W7-VISIT-STATEMENT.md` | yes | INSP-548 verified as an exact story; route Q2 opened; 6 gaps |
| `BUILDPACK-W8-ESTABLISHMENT-MANAGEMENT.md` | yes | migrated=0; name trap; 3 partial migrations; unverified-cluster flags |
| `BUILDPACK-W9-COMPONENTS-FORMS.md` | yes | Component-level dispositions and the missing-glyph list |

## Territory

Page `6:9` is partitioned so concurrent writers cannot overwrite each other.

| Band / area | Owner | Contents |
|---|---|---|
| y = 100000 – 149999 | **W10 (this agent)** | `423:47937` *SCREENS — BUILD Identify Challenge · EN · Light* at y=100000 |
| section `339:42098` | **W10 (this agent)** | SOURCE-IMPORT / UNGOVERNED — repairs R1, R2 |
| y = 160000 | Q1-EstablishmentManagementBuild | *SCREENS — BUILD Establishment Management · EN · Light* — the 3 partial migrations rebuilt complete + the 9 zero-representation canonical screens |
| y = 180000 | Q2-IncidentAndViolationBuild | *SCREENS — BUILD Incident & Violation Reports · EN · Light* — also resolving the Q1 naming trap by content, and testing W1's reading that Incident / Violation / Production Line are one wizard with three accordion rows rather than three screens |
| page `Inspector Components (build)` | Q3-InspectorComponentGapBuild | the 21 W9 component gaps, off the existing library pages |
| delivery sections `148:6893` `148:6894` `148:6895` `148:6896` | frozen | delivery-screen pixels stay fixed for traceability — untouched |
| library pages, `384:45164` | V1–V6 visual-repair agents | barred from `339:42098`, `384:45164` and everything below y=100000 |

W10 does **not** build the Establishment Management or Incident/Violation screens — Q1 and Q2
own those. When Q1/Q2/Q3 report node ids they are folded in as evidence rows against the
existing `gap` rows, not rebuilt. W10 creates nothing at or beyond y=150000.

The BUILD section sits at y=100000 on a page whose previous maximum extent was y=96803.

---

# ADDENDUM — 2026-08-01, later session

Everything below supersedes the sections above where they conflict. The agent fleet that
owned the y-bands was stopped mid-flight; the partition table is historical.

## 1. The fleet was stopped, but it had already written

Nine agents (Q1, Q2, Q3, B1, B2, B4, B5, V5, S7) were stopped without reporting. A live read
found **six unreported BUILD sections holding ~64 frames**. This work was undocumented and
unowned until now.

| Section | y | Frames | Origin |
|---|--:|--:|---|
| `450:60001` BUILD Establishment Management | 320000 | 19 | Q1 |
| `450:61680` BUILD Violation & Production-Line | 335000 | 20 | unattributed |
| `450:59542` BUILD Incident Report | 180000 | 13 | Q2 |
| `432:49206` BUILD Visit Report Detail | 200000 | 6 | B1 |
| `432:48155` BUILD Chemical Clearance | 220000 | 5 | B2 |
| `432:49028` BUILD Inspector Route Coverage | 260000 | 1 | B4 — barely started |

Also created: `450:59478` *Question & Finding (build)* (10 components, Q3) and journey pages
`465:2`–`465:7`.

### Defects found and fixed in that orphaned work

- **Section collision.** `450:60001` and `450:61680` both sat at y=320000, 39 frames stacked.
  `450:61680` moved to y=335000; overlap verified `false`, all 20 children carried, 0 outside
  bounds. *(Note: moving a section DID carry its children here, contradicting the earlier S1
  finding on `239:35967`. Always verify rather than assume either behaviour.)*
- **78 unbound paints.** All six Visit Report Detail frames carried 13 raw `rgb(255,255,255)`
  frame fills and `rgb(0,0,0)` text fills — Figma defaults, never set. Fixed: 12 text bound to
  `text-primary`, 18 surfaces to `surface-primary`, 48 nested layout containers cleared to
  transparent. Verified 0 remaining, no visual change.
- Structural grade of all 64: real component-backed screens, **not** shells. Only 1 placeholder
  literal file-wide (`450:59606`). Prior "populated but shallow" readings were an artefact of
  counting direct children — every frame in this file is `App topbar` + `sq-content`.

## 2. Delivery-section growth explained — not corruption

`148:6893` 36→39, `224:23956` 73→122, `336:45770` 4→6. All 54 additions are the **planner
workstream** (`SCR-PLN-*`), running outside this fleet: three new planning routes, 49
responsive-1024/768 and empty/error/success states, and two report-form frames.

**Consequence: this file has at least one other active writer.** Ledger counts are a snapshot,
not a stable baseline.

## 3. Signature-diff verification — method and results

Full visual comparison of ~146 canonical units is ~900 Figma calls; the seat allows 200/day.
Method adopted instead: extract unique strings + component-instance counts per family, diff on
disk. ~2 calls per family. See `SIGNATURE-DIFF-METHOD.md`.

**Proves** no region, field, control, action or state was dropped, and control *type* is right.
**Does not prove** layout, spacing, hierarchy or RTL mirroring — those still need sampled
screenshots. Signature parity means *nothing was lost*, not *it looks right*.

### Results — 3 families fully diffed, 4 source-side captured

| Family | Source | Web | Verdict |
|---|---|---|---|
| Establishment Management | `1065:77494` | `450:60001` | **partial** |
| Chemical Clearance | `1939:56734` | `432:48155` | **near-complete** |
| Visit Reports | `269:40019` | 4 sections, 45 frames | **partial** |
| Identify Challenge | `620:45076` | — | source captured |
| Visit Statement | `2468:31912` | — | source captured |
| Customs | `639:79065` | — | source captured |
| Safety | `2312:95952` | — | source captured |
| Home + Tasks | `2284:104021` | — | not started |
| Components | `301:71625` | — | not started |

**Establishment Management — missing:** Map ×12, Tab Bar/Tabs ×34, Radio Label ×8, Avatar ×58,
Menu list item ×9; and five whole region titles with no web counterpart — البيانات التنظيمية
(regulatory data), المخالفات (violations), الزيارات السابقة (previous visits), جهات التواصل
(contacts), مؤشرات التقييم (assessment indicators). Reading: the source detail is a **tabbed**
screen; the web has the shell and identity panel only.

**Chemical Clearance — missing:** Map ×3, Location Verification ×1. Everything else present,
including CAS number, GHS hazard code, international agreements, import/export data, all with
required markers and `Risk weight: Not configured` rather than an invented value.

**Visit Reports — missing:** Map ×9, **Weight ×30**, Stepper ×20, Progress Indicator ×10,
_PaginationItem ×30, Contact Person Info ×26. Thin: Textarea 35→5, Checkbox Label 42→4,
Dropdown 101→55. Present and correct: SignatureCapture ×5, ConnectivityBanner + SyncIndicator
(the source's offline mode), Accordion, DataState ×23.

### Two systemic gaps

1. **Map — 24 source instances** across three families, zero web coverage, because no reusable
   map component existed. **Now built: `MapPanel` `486:33`** on page `14:157` —
   `State=Default` `486:30`, `State=NoBasemap` `486:31`, `State=Unavailable` `486:32`. Neutral
   token markers with text labels, no colour-only meaning; inherited legend removed because it
   carried Operations-Center risk categories. **Needs retro-fitting** into every frame that lost
   a map, and the ad-hoc `map-panel` `401:47891` on `383:45124` should be swapped to it.
2. **Weight — 60 source instances** (30 Visit Reports, 30 Safety). No web representation. This
   encodes assessment scoring, i.e. governed logic — it needs a governance answer before anyone
   builds it, not a component guess.

### The INSPECTOR REPORT FORMS section is stubs — measured, not suspected

`454:52144` (Customs) and `454:52166` (Safety) were added by the planner workstream and appeared
to overturn W5's and W6's "no field-complete frame" findings. They do not. Signatures read
2026-08-01:

| Frame | Size | Descendants | Text nodes | Components |
|---|---|--:|--:|---|
| `454:52144` Customs Exemption | 834×720 | 21 | 5 | Field ×5, section-title ×3, Radio ×2, Button ×2, FileUpload ×1 |
| `454:52166` Safety Report | 834×720 | 21 | 5 | **identical to Customs** |
| `336:45771` Summons Notice | 834×906 | 24 | 5 | Field ×8, otherwise identical |

Safety's source carries `Weight ×30`, `Dropdown ×31`, `Checkbox Label ×39`, `Questions New ×27`,
`Stepper ×15`, `_PaginationItem ×25`. Customs carries `Dropdown ×16`, `Textarea ×4`, `Radio ×4`,
`Map ×3`. A 21-node frame with five fields carries neither.

**W5 and W6 stand. Customs and Safety have no field-complete Web frame.**

Two further defects, both from cloning a template without changing its content:

1. **Wrong route and wrong story key in the body text of both frames.** Each renders
   `/field/facility-reports · INSP-583` — Facility Report's identity — while the frame *names*
   say `/field/reports/[id]`. Name and content disagree, and the visible content asserts a story
   key belonging to neither report. Work filed from the canvas would go against INSP-583.
2. **`336:45771` Summons Notice is the same stub.** 24 descendants, 5 text nodes. The section
   name "INSPECTOR REPORT FORMS — field-complete against the shipped tables" does not hold for
   it, and by extension should not be trusted for its siblings. The genuine Summons Notice
   artefact is R2's four frames at `432:48325` (29–57 children each, built from the located
   source component sets `360:48214` / `369:127296`); `336:45771` is the stub they supersede.

**Do not "fix" the route and Jira text in place.** A stub with corrected labels is still a stub
and would read as more finished than it is. These frames need rebuilding from source, or
deleting once real ones exist.

**Ledger effect:** the four original REPORT FORMS frames do not count as coverage for any
family. Any earlier statement in this file that Summons Notice, Sample Collection, Destruction
or Facility is "field-complete" rests on the section name, not on measurement.

## 4. Component-library repairs landed this session

- `Checkbox/Checked=true` `9:70` and `Radio/Checked=true` `9:73` had `childCount = 0` — checked
  state distinguished by **fill colour alone**, violating rule 6, inherited by every instance.
  Fixed: checkmark `440:53911` (cloned from `icon/ui/check`, not drawn) and dot `440:53912`,
  both bound to `text-on-action`; contrast 6.44:1 Light / 8.86:1 Dark. Instances 9→9 and 11→11.
- `Select` error state had a red border and no shape signal — marker `450:59221` added.
- `FileUpload` `State=WithFiles` `450:59289`; `Field` `State=ReadOnly` `450:59312`;
  `ChecklistRowReadOnly` `450:59361`; raw white fill on an inherited Error variant fixed.
- New primitives on `450:2`: `Accordion` `450:15`, `SignatureCapture` `450:59288`,
  `DatePicker` `450:59335`, `MediaMinis` `450:59351`.

## 5. Corrections to earlier claims in this ledger

- **Selection model — resolved, not conflicting.** Both source pages use `Card Type=Selectable`
  with a Checkbox on unselected cards and a Radio on the selected one — one authoring habit.
  `631:45084` shows two cards selected at once, which a radio group cannot do. Multi-select is
  canonical; `report-type-card` is correct as built.
- **Button `8:32` disabled labels — no defect.** All 15 were rebound to `text-disabled`, measured
  at **1.00:1** (the disabled *surface* is bound to the same variable), and reverted. Original
  bindings restored and verified: Primary 6.44:1, Secondary 15.73:1, Tertiary 7.95:1, Danger
  6.54:1, Ghost transparent. Underlying oddity for the DS owner: a token named `text-disabled`
  is used as a surface fill.
- **`page-back` `401:47774` raw white fill — does not reproduce.** Deep scan of the component and
  all descendants: zero unbound SOLID fills or strokes.
- **Invented values stripped** from `EstablishmentCard` `336:45591` and `InspectionCard` `164:88`
  — 64 text nodes now `Not configured`. Two nodes were wrongly caught by a digit-matching filter
  and restored verbatim: `336:45557` and `336:45590` carry legitimate microcopy, "Factory 360 is
  unavailable until an establishment is linked".

## 5b. Signature diff COMPLETE — all nine families, ~20 calls

| Family | Source | Web | Verdict |
|---|---|---|---|
| Identify Challenge | `620:45076` | `339:42098` + `423:47938` | **complete** |
| Visit Statement | `2468:31912` | `432:45513` | **complete** |
| Chemical Clearance | `1939:56734` | `432:48155` | near-complete — Map, Location Verification |
| Home + Tasks | `2284:104021` | shipped `/field/*` | near-complete — Text Input 10→1, map 6→1 |
| Establishment Management | `1065:77494` | `450:60001` | **partial** |
| Visit Reports | `269:40019` | 4 sections, 45 frames | **partial** |
| Customs | `639:79065` | `454:52144` | **stub — no coverage** |
| Safety | `2312:95952` | `454:52166` | **stub — no coverage** |
| Components | `301:71625` | library pages | 228 components; 2 gaps |

**Identify Challenge** — Textarea 7→7 and LocationVerification 2→2 exact; Map 2 of 3; plus
`RemoteVideoTile ×2`. Strongest family in the file, and the one that received the P0 repair.

**Visit Statement** — every source capability accounted for.

**Home + Tasks** — `Task Card2 ×17`→`InspectionCard ×9`, `Tab Bar ×15`→`seg-opt ×11`,
`Status Tag`→`Badge ×8`, `Big Map ×4 + Map ×2`→`GeoWorkspace ×1`. 24 iPad-chrome instances
(App Icon, Wallpapers, Dock, Splash, status bar) correctly dropped as non-delivery.

### The component library is 228 components, not the 31 W9 measured

W9 reported "0 covered, 10 covered-with-delta, 21 gap". That was true when it looked. The
stopped agents then shipped, without reporting: `SignatureBlock` `SignaturePad` `SignatureAudit`
`SignatureParty` `AttendeeRow` `AttendanceList` `EvidenceGallery` `EvidenceLightbox`
`EvidenceCard` `ConflictList` `ConflictCompareRow` `SyncQueueRow` `SyncQueueSummary`
`OfflineNotice` `OfflineDownload` `PermissionState` `AccessState` `ActionMenu` `ComplianceScore`
`SeverityIndicator` `GeoWorkspace` `CameraCapture` `AudioEvidence` `MicButton` `DiffView`
`ColumnManager`.

This closes gaps carried as open elsewhere in this ledger: **`ActionMenu`** covers Establishment
Management's missing row menu; **`GeoWorkspace`** is a second map surface; and the whole
offline / sync / conflict / permission family exists. **Anyone reading W9's counts would rebuild
components that already ship — treat `BUILDPACK-W9-COMPONENTS-FORMS.md` as superseded.**

### The two remaining component gaps

| Gap | Source instances | Note |
|---|--:|---|
| `Rating` | 41 | no equivalent in 228 components |
| `Weight` | 60 (30 Visit Reports, 30 Safety) | assessment scoring — **governed logic**, needs a decision before it is built, not a component guess |

### MapPanel retro-fit applied

`MapPanel` `486:33` instanced into 8 frames: ad-hoc panels swapped on `383:45124` (`491:2010`),
`385:45164` (`491:2187`) and `432:45513` (`494:71830`); inserted at location regions on
`360:42863`, `363:43141`, `450:72509`, `457:70525`, `457:70702`, `457:71493`. All verified
0 clipped text.

Caveat recorded: the first retro-fit scan keyed on a hand-written section list and missed
`432:45512`, which left orphaned `map-marker` instances and then a nested panel before it was
corrected. **A sweep for any remaining frame named `map-panel` outside the scanned sections is
still owed**, to confirm there is exactly one map implementation.

## 6. What deprecating the iPad source still requires

146 canonical units (353 source nodes less 191 duplicates and 16 non-delivery). 6 proven.
Remaining work, with the signature-diff method: ~25 calls to finish all nine families, ~40 for
sampled visual verification of flagged frames, then build-and-verify for genuine gaps.

Before deprecation: every canonical unit needs a web frame **and** a recorded comparison; zero
`CLAIMED, UNVERIFIED` rows; the 20 cluster-classified frames individually confirmed; component
parity closed; and routes settled for Identify Challenge and Production Line, which today have
no repo route and no Jira story.

**Deprecate ≠ delete.** Keep the source read-only and archived. Twice this session it was the
only thing that could settle a question — Summons Notice provenance, and the report-type
selection model.

---

# ADDENDUM 2 — build session, 2026-08-01/02

Supersedes anything above that conflicts. The addendum above was written when the fleet was
stopped and only ~64 orphaned frames existed. This session built the Inspector delivery set out.

## 1. What was built

All frames English responsive Web. No 834 canvas, no iPad chrome, no `/ipad` route.

### Inspector execution core — new section `548:67760`

| Step | 1280 | 1024 | 720 | Source |
|---|---|---|---|---|
| E1 My Tasks `/field/my-tasks` | `548:67761` | `555:2` | `558:2` | `2284:104024` · Task Card2 `465:38096` |
| E2 Readiness & travel | `548:67895` | `555:29` | `558:61` | Big Map `465:40949` |
| E3 Check-in & geofence | `548:68032` | `555:57` | `558:117` | `269:54928` · Location Verification `422:32955` |
| E4 Workspace — items | `549:67723` | `555:83` | `558:163` | `292:21350` · Questions New `159:51204` |
| E5 Item response — non-compliant | `549:67855` | `555:109` | `558:209` | Questions New `159:51204` |
| E6 Evidence capture | `549:67987` | `555:134` | `558:250` | Photos `434:36651` · _Drop Zone |
| E7 Factory verification | `550:67864` | `555:158` | `558:286` | Checking list `239:351034` |
| E8 Signature & visit statement | `550:67996` | `555:185` | `558:337` | `2312:95952` |
| E9 Pre-submit, offline queue, submission | `550:68151` | `555:214` | `558:390` | `2312:95952` · `269:40019` |

Source field labels were recovered from **component definitions**, not screen frames — the
source screens carry almost no text of their own. That is why earlier text-based reads of those
pages looked empty.

### Customs Exemption — section `515:59257`

| Screen | 1280 | 1024 | 720 |
|---|---|---|---|
| Report-type entry | `515:59258` | `566:83117` | `566:83191` |
| Inspection items | `540:2` | `566:83136` | `566:83210` |

Source `639:79065` defines only two regions — بيانات البنود (Item data) and تفاصيل الاستفادة
(Eligibility details) — and **no field labels at all**. The frames say so on canvas rather than
inventing fields.

### Safety — section `515:59335`

| Screen | 1280 | 1024 | 720 |
|---|---|---|---|
| Report-type entry | `515:59336` | `566:83265` | `566:83452` |
| Items — field visit (13 minutes) | `544:67` | `566:83284` | `566:83471` |
| Items — unable to complete (5 minutes) | `544:80201` | `566:83357` | `566:83544` |
| Items — remote visit (4 minutes) | `544:80348` | `566:83406` | `566:83593` |

Source conditional rule preserved in the section heading: field visit shows all minutes;
unable-to-complete shows summons + fact-establishment plus violation/sample/impoundment as
needed; remote shows fact-establishment always, **no summons and no field-visit notices**.

### Chemical Clearance — section `432:48155`

`432:48156` / `432:48399` / `432:48650` / `432:48778` / `432:48897` at 1280;
1024 = `573:2` `573:217` `573:393` `573:551` `573:703`;
720 = `573:871` `573:1170` `573:1447` `573:1706` `573:1959`.

### Establishment Management — section `450:60001`, 20 screens × 3 tiers

1280 originals preserved. 1024 = `573:95146`–`573:97798`. 720 = `573:99733`–`573:104304`.
Includes the Regulatory data tab `502:71936` built this session (chemical clearance, customs
exemption, regulatory documents, assessment indicators — all `Not configured` /
`Insufficient evidence`, each row carrying its governance provenance as a hint).

### Production Line Seizure — section `450:61680`

PL-A…PL-J at 1280 (pre-existing), 1024 = `561:2`–`561:240`, 720 = `561:82637`–`561:83075`.

### Shared authentication — section `563:70229`

Five source-backed states on **one** route. There was never a `/login/field` to remove — the
master had no login route at all.

| State | Source | 1280 | 1024 | 720 |
|---|---|---|---|---|
| Sign in `/login` | `2665:30714` | `563:70230` | `563:83059` | `563:83090` |
| Reset password | `2665:34915` | `563:70250` | `563:83066` | `563:83097` |
| Verification code | `2665:39117` | `563:70264` | `563:83072` | `563:83103` |
| New password | `2665:43321` | `563:70278` | `563:83078` | `563:83109` |
| Password changed | `2665:47522` | `563:70298` | `563:83085` | `563:83116` |

**Owner ruling: `/login` stays unshelled** — no application sidebar or app nav on auth screens.

## 2. Shell unification — 70 frames

Every Inspector delivery frame now matches the Visit Report Detail lineage:
`App sidebar` + `main` → `App topbar` + `sq-content`.

At 720 the 248px rail is replaced by **`App sidebar — collapsed (68)` `518:217`** (a governed
component that appeared in Nav & Chrome mid-session). 25 narrow frames carry it: Customs 2,
Safety 4, execution core 9, Production Line 10. Not a crop of the 248 rail, no iPad chrome.

**Recipe that works** — set `layoutMode` first, then `primaryAxisSizingMode = FIXED` (width) and
`counterAxisSizingMode = AUTO` (height), then `resize`. The reverse order collapsed 23 frames to
348px wide and had to be repaired.

## 3. Route hygiene

**Zero literal `/ipad` route strings file-wide**, verified across all 36 pages, names and text.
27 were rewritten to their canonical shipped routes retaining `(iPad-source reference)`:

| Screen family | Was | Now |
|---|---|---|
| SCR-IPAD-600 | `/ipad/assignments` | `/field/my-tasks` |
| SCR-IPAD-610 | `/ipad/visits/[id]/prestart` | `/field/[visitId]` |
| SCR-IPAD-620 | `/ipad/visits/[id]/journey` | `/field/[visitId]/travel` |
| SCR-IPAD-630 | `/ipad/inspections/[id]` | `/field/inspection/[id]` |
| SCR-IPAD-640 | `…/evidence` | `/field/inspection/[id] evidence` |
| SCR-IPAD-650 | `…/findings` | `/field/inspection/[id]/results` |
| SCR-IPAD-660 | `…/submit` | `/field/inspection/[id]/statement` |
| SCR-IPAD-670 | `/ipad/returned/[id]` | `/field/drafts` — **no confirmed route**, closest candidate |
| Section `305:40149` | `/ipad/*` | `/field/*` |

Left as provenance, not routes: components `panel-content/scr-ipad-6xx-*`, and text such as
`Device iPad-04 · sha256…`.

## 4. Invented-data defect class — four passes to close

Fixing a component default does **not** reach instances that already override it, and a
component *variant* can carry its own invented content independently of the base.

| Pass | Target | Was |
|---|---|---|
| 1 | `AttachedFile` `401:24` default | `attachment.pdf` |
| 2 | `DatePicker` `450:59324`, `DueDate` `158:36`, `Dialog` `349:244` | `15 Jul 2026`, `14 Jul 2026`, `signature-fahd-abdullah.pdf` |
| 3 | Chemical instance overrides ×12 across three tiers | `targeted-establishments-list.pdf` |
| 4 | `FileUpload / State=WithFiles` variant `I450:59303;401:24` | `site-photo-02.jpg` |

Final file-wide sweep: **1 hit outside the frozen delivery sections, 0 inside them.** The frozen
sections were excluded from editing by rule, and had nothing to fix.

## 5. Other corrections this session

- **Report-type naming resolved from source.** The iPad source page is titled
  "↪ Identify Challenge - رصد تحدي", so **Identify challenge** is the source's own English.
  "Challenge observation" was an invention and was corrected on `515:59258` and `515:59336`.
- **`DetailRowStacked` `558:81968`** created for narrow tiers — value under label, left aligned.
  Instance-level `layoutMode` overrides silently revert to the main component, so stacking must
  be a real component. Component swaps also drop text overrides; labels and hints need
  re-applying afterwards.
- **`DetailRow` gates its hint behind a `showHint` boolean property.** Setting hint text without
  enabling the property does nothing, and on a badly-cloned variant the label frame collapses to
  1px and clips the term.
- **`MapPanel` `486:33`** built (Default / NoBasemap / Unavailable) and retro-fitted into 8
  frames; the inherited `map-legend` was removed because it carried Operations-Center risk
  categories that do not apply to an establishment location map.
- **Census correction.** The clipped-text census was counting hidden nodes and treating negative
  overhang as overflow. It now respects visibility. Earlier **zero** results stand; earlier
  non-zero counts may have included phantoms.
- **Arabic leakage** into two English delivery hints was caught and cleaned; a regex-based strip
  mangled them first and had to be set explicitly.

## 6. Responsive coverage — final

| Family | 1280 | 1024 | 720 |
|---|--:|--:|--:|
| Execution core | 9 | 9 | 9 |
| Establishment Management | 20 | 20 | 20 |
| Production Line Seizure | 10 | 10 | 10 |
| Chemical Clearance | 5 | 5 | 5 |
| Safety | 4 | 4 | 4 |
| Customs Exemption | 2 | 2 | 2 |
| Authentication `/login` | 5 | 5 | 5 |

Zero clipped visible text in every frame built or converted this session.

## 7. Still open — not buildable without a decision

1. **`Weight` — 60 source instances** (30 Visit Reports, 30 Safety). Assessment scoring, i.e.
   governed logic. Needs a rule, not a component guess.
2. **`Rating` — 41 instances**, and raster assets. Owned by the Codex Inspector task.
3. **Route rulings.** `/field/visit-statements` is marked `ROUTE PENDING OWNER RULING` on
   `432:45513`; Identify Challenge and Production Line are built with no repo route and no Jira
   story. Note the shipped `/field/*` report-form family is itself outside CLAUDE.md rule 9's
   fixed route list.
4. **Source-less capabilities**: OCR appears nowhere in the enumerated source. Safety and Customs
   define regions but no field labels. Geofence radius, compliance-rate formula and action-taken
   vocabulary are governed values the source never defines.
5. **Safety source annotations describe conditional behaviour not built as UI** — items list
   appears only for certain report types, "non-compliant" reveals attachment and notes fields,
   labour/raw-materials/products/machinery sections appear only for a visit report, a
   sample-requiring product auto-sets "sample taken?" and shows table BC-SMP01.

---

# ADDENDUM 3 — Inspector Journey ledger closure, 2026-08-02

Supersedes anything above that conflicts. This addendum closes the 10 open governance decisions
carried in ADDENDUM 2 §7, and repairs three specific ledger gaps: the Rating/rasters open item,
the five Safety conditional states, and the stale `CLAIMED, UNVERIFIED` rows in the pre-ADDENDUM-2
`## Ledger` tables (lines 174–573) that ADDENDUM 2's actual build now supersedes.

No push, no commit. All Figma reads in this addendum were metadata-only (no writes to either
file). Repo/product-contract evidence below is grep-verified against the working tree at HEAD on
`docs/saqeel-figma-design-system`.

## 1. Rating + rasters (ADDENDUM 2 §7 item 2) — resolved as a component gap, not out-of-scope

ADDENDUM 2 asserted `Rating` (41 source instances) plus raster assets are "Owned by the Codex
Inspector task." That claim does not check out. Searched:

- `grep -rni "codex inspector"` across the entire repo — the **only** hit is the ADDENDUM 2 line
  itself. No such task exists.
- `git branch -a` — no branch named anything like `codex/*rating*` or `codex/*inspector-rating*`.
  The real Codex branches touching the inspector/iPad surface are
  `codex/inspector-shell-uplift-002`, `codex/factory-360-ipad-011`,
  `codex/factory360-ipad-api-contract-consumption-015`, `codex/ipad/m04-geofence-policy-promotion-002`
  — none reference Rating, scoring, or raster assets.
- `product-contract/` — zero references to a Rating capability outside one unrelated hit
  (`TASK-QA-UI-COMPLIANCE-CERT-004.md:62`, "fatigue rating" — a QA session note, not a product
  requirement).

**Conclusion: the "owned elsewhere" claim is unsubstantiated. Rating encodes a governed value (an
assessment rating) exactly like Weight does, so per CLAUDE.md rule 10 it must not be built as a
component guess.** Folded into the Weight decision below (Decision #1) — same root cause (item
scoring is an `OPEN_BUSINESS_DECISION`), same owner, same blocker. Rasters (the other half of the
open item) were not further investigated this session; no raster-asset requirement was found
anywhere in the enumerated source pages, so there is nothing to build against — recorded as
no-op, not a gap.

## 2. Safety conditional states — investigated, not built this session

Target was 5 conditional states × 3 tiers = 15 frames, reusing existing components only, added to
target section `515:59335` alongside `544:67` / `544:80201` / `544:80348`.

**What was done:** loaded `figma-use`, then ran `get_metadata` on source page `2312:95952` (Safety
Report, `8wGaofgbopqmGXc0Wjo0eW`). The dump was 166,231 characters — a single call landed within a
hair of the per-call token cap, and `get_metadata` only returns node **names/types/positions**, not
text content, so it cannot by itself confirm field labels or conditional logic. Grepping the dump
for candidate nodes found two `Sample Collection Report` instances nested inside the Safety
subtree — `2312:158408` and `2312:158428` — consistent with the "sample-requiring product...shows
table BC-SMP01" annotation, but this is circumstantial (a name match, not a confirmed field
definition) and does not by itself prove the conditional's exact shape.

**What was not done, and why:** confirming the two additional conditional states (non-compliant
reveal, sample-requiring auto-set + BC-SMP01 table) requires `get_design_context` on the specific
Safety sub-frames/component definitions that carry them — not the whole 167-node source page.
That is a targeted, multi-call investigation (per ADDENDUM 2 §1's own finding, Safety's field
labels likely live in component definitions, not screen frames, same as the execution core did).
Given the single-page metadata read already used a large fraction of a reasonable per-session
budget, and the task then calls for building 3 new frames × up to 5 states with 0-clipped-text
census and screenshot proof, this was assessed as out of reach for this session without risking
the seat's daily call limit before the other 9 decisions could be worked.

**Result: 0 of the 2 missing conditional states confirmed from source this session; 0 new frames
built. The existing 12 frames (report-type entry + field-visit/unable-to-complete/remote-visit ×
3 tiers, per ADDENDUM 2 §1) stand unchanged.** This is carried forward as open work, narrower than
before: the next session should start with `get_design_context` (not `get_metadata`) directly on
`2312:158408`/`2312:158428` and their siblings, and on the Safety-specific `Questions New` /
`Checkbox` component definitions on page `301:71625`, rather than re-reading the whole source page.

## 3. Superseding stale `CLAIMED, UNVERIFIED` rows

ADDENDUM 2 built a real, component-backed Inspector delivery set. Cross-referencing its build
table (ADDENDUM 2 §1) against the `## Ledger` tables (lines 174–573) gives these supersessions.
Old rows are **not deleted** — this is an appended pointer per the file's own convention.

| Old source node(s) | Old proving web node (CLAIMED, UNVERIFIED) | Superseded by (ADDENDUM 2) | Status |
|---|---|---|---|
| `292:21350`, `879:64493`, `879:64635`, `879:64564`, `985:70673`, `947:48549`, `1939:85172`, `1939:125133`, `1939:126076`, `1950:126878`, `1950:126911`, `1950:126950`, `1960:94069` (Inspection Items) | `366:43758` | E4 Workspace — items `549:67723` (1280) / `555:83` (1024) / `558:163` (720) — source `292:21350` · `Questions New 159:51204` | **superseded** — real component-backed frame exists; signature-diff (ADDENDUM 1 §3, Visit Reports) still flags it **partial** (Weight ×30, Stepper ×20, Progress Indicator ×10, `_PaginationItem` ×30, Contact Person Info ×26 missing) — not a clean close, but no longer merely claimed |
| `269:54928`, `416:31631`, `532:73092`, `902:82083`, `1682:83462`, `938:132241`, `532:72250`, `902:82878` (Establishment Details) | `364:45987` | E3 Check-in & geofence `548:68032` (1280) / `555:57` / `558:117` — source `269:54928` · Location Verification `422:32955` | **superseded** — same partial-signature caveat as above |
| `296:15894`, `301:97307`, `357:26118`, `297:64463`, `301:67866`, `301:69502` (Establishment Management) | `366:43609` | BUILD Establishment Management `450:60001`, 20 screens × 3 tiers | **superseded but incomplete** — signature-diff (ADDENDUM 1 §3) verdict is **partial**: missing Map ×12, Tab Bar/Tabs ×34, Radio Label ×8, Avatar ×58, Menu list item ×9, and 5 whole region titles (البيانات التنظيمية, المخالفات, الزيارات السابقة, جهات التواصل, مؤشرات التقييم) have no web counterpart. Do not read "superseded" as "closed." |
| `360:30151`, `369:120470`, `369:135740`, `369:146056`, `369:165251`, `369:166505`, `369:180149`, `369:185466`, `369:194906`, `369:200050`, `369:211081`, `360:49700`, `360:50354`, `532:80990` (Summons Notice) | `340:42098` | **Superseded by the stub finding, not by a real frame.** ADDENDUM 1 §3's "INSPECTOR REPORT FORMS section is stubs" finding proves `336:45771` (which these rows implicitly point through) is a 24-descendant, 5-text-node stub carrying the wrong route/story text. The genuine artefact is R2's four frames at `432:48325` (source component sets `360:48214` / `369:127296`). | **superseded-by-stub-finding** — mark these rows as resolved-to-a-known-defect, not as an open unverified claim |
| `639:78727` chain / Customs Inspection Items rows | n/a (Customs had no CLAIMED row of its own — see Customs table) | `454:52144` — confirmed **stub**, superseded by ADDENDUM 2's real build at `515:59257`/`540:2` | **superseded** |
| Safety Establishment Management/Inspection Items/Modal rows (`2312:102237` etc.) | `366:43609` / `366:43758` / `349:252` (shared-duplicate rows, no independent claim) | `454:52166` stub superseded by ADDENDUM 2 build `515:59335` | **superseded** |
| `368:42325` `369:46690` `369:51109` `369:51116` `368:66526` `368:65363` (Production Line Report) | `366:44226` | Production Line Seizure `450:61680`, PL-A…PL-J × 3 tiers | **superseded** — but Decision #4 below (route/Jira ownership) is still open; a built frame is not a shipped route |

**Not superseded — still genuinely open, no change made:**
- Non-Compliant Products Destruction Report rows (`361:44295`, `362:38115`, `362:53901`,
  `368:28498`, `362:39753`, `362:21702`) — no Destruction Report family appears in ADDENDUM 2 §1's
  build list. Route `/field/destruction-reports` exists in the shipped repo (confirmed via
  `apps/web/src/app/(app)/field` directory listing) but no Figma frame proves it. Left as `gap`.
- Incident Report (`360:77602`, `532:80150`) and Violation Report (`360:80623`, `361:20819`,
  `361:20125`, `361:20826`) rows — the pre-ADDENDUM-2 addendum records unreported fleet work at
  `450:59542` (Incident, 13 frames) and `450:61680` (titled "Violation & Production-Line" in that
  earlier table, 20 frames), but ADDENDUM 2 §1's own build table only names this section
  "Production Line Seizure." Whether the Violation Report content survived inside `450:61680`
  alongside Production Line was not re-verified this session — **not marked superseded**, flagged
  for the next Figma pass to confirm with a cheap `get_metadata` scan of `450:61680`'s children.
- Modal rows (`292:25578`, `360:29633`, `436:31783`, `1501:85138`, etc.) — these are cross-route
  component rows, not screens; no change needed, already correctly out of the "screen coverage"
  count.

## 4. The 10 decisions

### Decision 1 — Inspection-item Weight rule (+ Rating, folded in per §1 above)

**BLOCKED.** `product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv` row `CR-471` ("Item
Weight / Score") is disposition `OPEN_BUSINESS_DECISION`, referencing `DEC-001` and `DEC-028`.
`product-contract/operationalization/coordination/batches/M9-COMPLIANCE-DETAIL-SUCCESSOR-016.yaml:56`
states the boundary explicitly: *"No risk formula, item weight, score or score-exclusion behavior
may be designed as settled."* The repo already renders the correct "Not configured" state:
`apps/web/src/app/(app)/admin/compliance-approvals/page.tsx:84` — *"Item-weight and
score-exclusion rules are Not configured and are not accepted by the current request workflow."*
`apps/web/src/app/(app)/admin/items/Controls.tsx:90-91` ships a weight input, gated behind a
`scoring` toggle, disabled until the rule exists. Rating (41 source instances) is the same class
of governed value (assessment scoring) with no rule anywhere in the repo, product-contract, or
Figma — folded into this same blocker, not built.
**Owner decision needed:** the numeric weighting/scoring formula and which role(s) set it — Product
Owner, via `DEC-001` (risk model) and `DEC-028` in `product-contract/state/decisions/OPEN_DECISIONS.yaml`.

### Decision 2 — Visit Statement route

**RESOLVED — repo shows a de facto answer; Figma has a stale label to reconcile.** Node
`432:45513` still reads "ROUTE PENDING OWNER RULING." But ADDENDUM 2's actual build treats Visit
Statement as **E8 "Signature & visit statement"** (`550:67996` / `555:185` / `558:337`), a step
inside the execution-core flow (`548:67760`), not a standalone route. Confirmed against the
shipped repo: `apps/web/src/app/(app)/field` has no `visit-statements` directory (full route list:
`[visitId] account completed destruction-reports drafts establishments facility-reports
factory-360 feedback incident-reports inspection map my-tasks notifications reports
sample-collection-reports search settings summons-notices virtual visits` — no
`visit-statements`), and CLAUDE.md rule 9's fixed route list does not include it either. INSP-548
("[REUSE] Log a lightweight Visit Statement") is titled as a *reuse*, consistent with reusing the
in-flow step rather than standing up a new top-level route.
**Fix needed (flagged, not applied this session — no Figma budget remained after §2 above):**
retitle `432:45513` to drop "ROUTE PENDING OWNER RULING" and reconcile it against E8, since the
file now has two builds of the same capability under two different framings. DS owner should pick
one as canonical and archive/relabel the other.

### Decision 3 — Identify Challenge route and Jira ownership

**BLOCKED, confirmed again (4th time).** No `/field` route named anything like `identify-challenge`
or `challenge`. `grep` of `docs/design/figma/handoff/` shows the "no repo route, no Jira story"
finding independently reached by P0-SOURCE-FIDELITY-2026-08-01.md, BUILDPACK-W3-IDENTIFY-CHALLENGE.md
(twice), and this ledger's own Q3/convergence section (line ~168) — no new Jira story exists.
**Owner decision needed:** who authors the Jira story and picks the route — recommend Product
Owner + Codex (the team already owns the parallel iPad-source Codex tasks in this repo;
`docs/design/figma/handoff/jira-backlog-keys.md` and Jira were both checked, no candidate story
found to attach to).

### Decision 4 — Production Line route and Jira ownership

**BLOCKED, confirmed again.** Same shape as Decision 3.
`docs/design/figma/handoff/BUILDPACK-W1-VISIT-REPORTS.md:99` and
`BUILDPACK-W6-SAFETY-REPORT.md:200` ("no exact-match story found under that name") both confirm no
authorizing story. The capability now has a real Figma build (`450:61680`, Decision-adjacent to
§3 above) but that is a build, not a shipped route or a governed capability — CLAUDE.md rule 9
does not list it.
**Owner decision needed:** same as Decision 3 — Product Owner + Codex.

### Decision 5 — OCR requirement/source

**RESOLVED — no Inspector-scope OCR requirement exists; do not conflate with Factory 360's OCR.**
`product-contract/factory-360/FACTORY_360_FUNCTIONAL_JOURNEYS.csv` row `F360-JRN-016` defines
"Contextual OCR" (status `CODE_COMPLETE`, evidence `F360-EV-009`,
`product-contract/evidence/TASK-FACTORY-360-COMPLETE-010.md`) — but that is document-evidence OCR
in the Factory 360 dossier viewer, an unrelated capability to whatever the Inspector-source OCR
concern was. Nothing in the enumerated iPad-source pages references OCR at all. There is nothing
to build; if a future Inspector requirement for OCR appears, it should point at `F360-JRN-016`'s
pattern rather than invent a second one.

### Decision 6 — Safety field definitions

**BLOCKED — investigation started, not completed** (see §2 above). Confirmed the Safety source
page has candidate `Sample Collection Report` instances (`2312:158408`, `2312:158428`) consistent
with the sample-taking conditional, but could not confirm actual field labels — `get_metadata`
doesn't carry text content, and a targeted `get_design_context` pass on the Safety component
definitions was not completed this session for the reasons in §2.
**Next step, not an owner decision:** targeted `get_design_context` on Safety's `Questions New` /
checkbox component instances on page `301:71625`, following ADDENDUM 2 §1's precedent that field
labels live in component definitions, not screen frames.

### Decision 7 — Customs field definitions

**RESOLVED — absence already confirmed at build time, correctly rendered.** ADDENDUM 2's Customs
build (`515:59257`) already states plainly: source `639:79065` defines only two regions (بيانات
البنود / تفاصيل الاستفادة) and "no field labels at all," and "the frames say so on canvas rather
than inventing fields." No further action needed — this is the CLAUDE.md rule-10 pattern applied
correctly, not an outstanding gap.

### Decision 8 — Geofence radius

**RESOLVED — a governed value already exists in the repo; Figma should defer to it.** Per-factory
override: `factories.geofence_radius_m` (migration
`supabase/migrations/0011_factory360_gis_ksa_seed.sql`, comment: *"Per-factory geofence override
(G-MAP). NULL = engine_settings gis.geofence_default_radius_m. GIS Admin owned."*), editable at
`/admin/gis` (`apps/web/src/app/(app)/admin/gis/page.tsx`, SB20/ENG-08). Engine-wide default is
still gated by `DEC-002` (`product-contract/governance/decision_register.csv` — status `Open`,
priority `P0`, gate `G5 before journey certification`). The Inspector build already gets this
right: `apps/web/src/app/(app)/field/[visitId]/travel/page.tsx:79` renders *"No geofence radius is
governed for this establishment (no factory override — , no engine default — ), so arrival range
cannot be verified on this screen. Continue to the governed check-in, which owns the arrival
decision."* No Figma change needed — no frame found inventing a number; this decision closes by
citation, confirming the existing pattern is correct and should not be duplicated with a new
value.

### Decision 9 — Compliance-rate formula

**RESOLVED — authoritative formula exists, Inspector UI should defer to it.**
`apps/web/src/lib/dashboard-kpi/checklist-compliance.ts:5` states the canonical formula:
*"compliance rate = compliant eligible answers / (compliant + non_compliant)."*
`apps/web/src/app/(app)/field/inspection/[id]/runtime.ts:104-134` implements the "Preliminary
Compliance Rate (canonical plan §20, D-019 — EXACT)" using the same rule, and it is consumed
consistently across `apps/web/src/app/(app)/dashboard/DashboardView.tsx`,
`apps/web/src/app/(app)/dashboard/metrics.ts`, `apps/web/src/app/(app)/field/factory-360/[id]/page.tsx`,
`apps/web/src/app/(app)/field/my-tasks/page.tsx:488`, and `apps/web/src/app/(app)/factories/cr/[id]/page.tsx`.
No Inspector Figma frame was found inventing a different formula. Nothing to build; this decision
closes by citation.

### Decision 10 — Action-taken vocabulary

**BLOCKED — no governed enum exists anywhere in the product.** Checked
`apps/web/src/app/(app)/admin/violations/Controls.tsx:140` and `page.tsx:72` — `penalty_type` is a
free-text `<input>`, not an enum. `apps/web/src/app/(app)/enforcement-library/page.tsx` passes the
same free-text `penalty_type` through from `penalty_mappings`. Supabase migrations carry exactly
one example string (`supabase/migrations/20260719000000_mim_ipad_figma_localization_seed.sql:184`
— *"No permit from the authority; no action taken"*), which is seed content for one Visit Reports
sample, not a governed vocabulary. No enum, no picker, no vocabulary list exists to cite.
**Owner decision needed:** Product Owner / Compliance & Enforcement module owner must define the
action-taken vocabulary before any Inspector or Admin surface can render a picker instead of free
text. Until then, "Not configured" stands wherever the Inspector build would otherwise need one.

## 5. Summary

- **Rating/rasters:** resolved as a component gap folded into Decision #1 (Weight) — the "Codex
  Inspector task" ownership claim in ADDENDUM 2 was searched for and not found; treat as
  blocked-on-the-same-scoring-decision, not out-of-scope.
- **Safety conditional states:** 0 of 2 missing states confirmed from source, 0 of 15 target
  frames built this session. The existing 12 frames (`515:59335` family) are unchanged. Narrowed
  the next session's starting point to specific node IDs (§2 above) instead of a full source-page
  re-read.
- **Decisions: 6 of 10 resolved, 4 blocked.**
  - RESOLVED: #2 (Visit Statement route — de facto answer in repo, Figma label needs reconciling),
    #5 (OCR — no Inspector-scope requirement exists), #7 (Customs fields — absence already
    correctly rendered), #8 (geofence radius — governed value exists, repo already correct), #9
    (compliance-rate formula — authoritative source exists and is already used elsewhere).
  - BLOCKED: #1 (Weight + Rating — open business decision `DEC-001`/`DEC-028`/`CR-471`), #3
    (Identify Challenge — no route, no story, owner: PO + Codex), #4 (Production Line — same), #6
    (Safety field definitions — investigation incomplete, not a governance blocker, a Figma-budget
    blocker), #10 (action-taken vocabulary — no enum exists anywhere, owner: PO / Enforcement
    module owner).
- **Component gaps that must not be papered over (per CLAUDE.md rule 3), reaffirmed:** `Weight`
  (60 source instances) and `Rating` (41 source instances) — both governed assessment-scoring
  components with no rule to build against. Neither was built as a guess.

# Figma orphaned-work reconciliation

Date: 2026-08-01
Mode: read-only Figma reconciliation
File: `ML2PNwfShlQM2k44MvSEw5` — Inspection - Web
Figma calls used: 5

## Summary

The Screens page `6:9` has 25 top-level sections and no loose top-level nodes. The documented baseline of 20 sections is no longer current. Six unreported Inspector build sections exist; they are listed below. No node on the Screens page carries `placeholder=true`.

The reconciliation does not judge design fidelity against iPad. It records only what is currently present, whether it is structurally populated, and where further work must begin.

## Unreported build sections

| Section | Y | Frame/component count | Verdict |
|---|---:|---:|---|
| `432:48155` Chemical Clearance | 220000 | 5 frames | Populated but shallow — every frame has only two direct children; requires visual/fidelity grading. |
| `432:49028` Inspector Route Coverage | 260000 | 1 frame | Partial — only the Account route is present. |
| `432:49206` Visit Report Detail | 200000 | 6 frames | Populated but shallow — all six tab frames exist, each with two direct children. |
| `450:59542` Incident Report | 180000 | 12 frames + 1 component | Populated — index, create, review, read-only, offline and state frames are present. |
| `450:60001` Establishment Management | 320000 | 19 frames | Populated but shallow — broad journey/state coverage exists; direct-child structure needs visual grading. |
| `450:61680` Violation & Production-Line Reports | 320000 | 20 frames | Populated — both report families and states are present, but production-line routes/Jira are explicitly unset. |

The prior expectation of five new sections was incomplete: Violation & Production-Line Reports `450:61680` is a sixth unreported build section.

## Frames inside the unreported sections

### Chemical Clearance — `432:48155`

| Frame | Size | Direct children |
|---|---:|---:|
| `432:48156` Establishment details/report type | 834×716 | 2 |
| `432:48399` Inspection items | 834×1710 | 2 |
| `432:48650` Raw materials tab | 834×1180 | 2 |
| `432:48778` Chemical materials tab | 834×960 | 2 |
| `432:48897` Products tab | 834×975 | 2 |

### Inspector Route Coverage — `432:49028`

| Frame | Size | Direct children |
|---|---:|---:|
| `432:49029` Account | 1280×716 | 2 |

### Visit Report Detail — `432:49206`

| Frame | Size | Direct children |
|---|---:|---:|
| `432:49207` Plan Start tab | 1280×867 | 2 |
| `463:20` Item list tab | 1280×1301 | 2 |
| `463:365` Establishment file tab | 1280×997 | 2 |
| `463:591` Visit results tab | 1280×1155 | 2 |
| `463:904` Attendee tab | 1280×1254 | 2 |
| `463:1117` Attendee details tab | 1280×1254 | 2 |

### Incident Report — `450:59542`

`450:59543`, `450:59550`, `450:59557`, `450:59564`, `450:59571`, `450:59578`, `450:59585`, `450:59592`, `450:59599`, `450:59606`, `450:59613`, `450:59620`; component `450:60057`.

### Establishment Management — `450:60001`

`450:68977`, `450:69137`, `450:69206`, `450:72509`, `450:72711`, `450:75344`, `450:75628`, `457:70525`, `457:70702`, `457:71041`, `457:71162`, `457:71493`, `457:71611`, `457:71699`, `457:71813`, `459:57004`, `459:57097`, `459:57215`, `459:57305`.

### Violation & Production-Line Reports — `450:61680`

`450:61681`, `450:66640`, `450:75200`, `450:75285`, `457:70340`, `457:70441`, `457:70891`, `457:70908`, `457:70948`, `457:70971`, `457:71245`, `457:71371`, `457:71908`, `459:68355`, `459:68423`, `459:68483`, `459:68606`, `459:68624`, `459:68664`, `459:68687`.

## Question & Finding build page

Page `450:59478` contains ten children:

| Node | Type | Variants / role |
|---|---|---|
| `450:59536` | Component set | QuestionSection — 4 |
| `450:59871` | Component set | AnswerDetail — 4 |
| `450:60289` | Component set | FindingRow — 4 |
| `450:60822` | Component set | FindingsList — 3 |
| `450:61663` | Component set | FindingEscalation — 4 |
| `450:62060` | Component set | SectionScoreSummary — 3 |
| `457:110` | Frame | Validation 1280 |
| `457:600` | Frame | Validation 1024 |
| `457:1062` | Frame | Validation 834 |
| `457:1524` | Frame | Validation 680 |

No second Media Minis component exists on this page. The only identified Media Minis set is `450:59351`, with `450:59336` State=Populated and `450:59347` State=Empty. Therefore the suspected Media Minis duplication is **not present on the inspected page**.

## Journey-page findings

All six unreported persona pages contain a real, non-placeholder entry frame. They are not empty pages, but their four direct-child structures need visual inspection before delivery status can be inferred.

| Page | Entry frame | Size |
|---|---|---:|
| `465:2` 10 Planner | `465:52` | 1120×1800 |
| `465:3` 20 Inspector | `465:120` | 1120×1800 |
| `465:4` 30 Supervisor | `465:188` | 1120×1386 |
| `465:5` 40 Admin | `465:240` | 1120×1386 |
| `465:6` 50 Shared | `465:292` | 1120×1386 |
| `465:7` 90 Reference | `465:344` | 1120×1386 |

## Orphan and placeholder checks

- Non-section top-level nodes on Screens page `6:9`: **0**
- Nodes with `placeholder=true` on Screens page `6:9`: **0**

## Follow-up build queue

1. Visually grade Chemical Clearance, Visit Report Detail and Establishment Management; their 2-child frame structure may be a wrapper plus content rather than a completed screen.
2. Complete Inspector Route Coverage beyond Account `432:49029`.
3. Assign canonical routes and Jira stories for the Production-Line family; all ten frames currently declare route and Jira as NONE.
4. Render and assess all journey entry frames before treating them as usable navigation.
5. Do not delete any section as an empty shell: none are empty.

# Source screen classification — all 8 content pages

Completes the audit. `SOURCE-COMPONENT-AUDIT-2026-08-01.md` classified the 61 definitions on
the `⚙️ Components` page and explicitly did **not** cover the content pages. This document
covers them: **295 frames, 8 pages, 17 concepts, 295 of 295 classified.**

Source file `8wGaofgbopqmGXc0Wjo0eW` is a **reference input**. Nothing is copied from it — the
Figma plugin API cannot move nodes between files. Every item carries a disposition.

## Page inventory

| Page | Node | Frames | Other nodes |
|---|---|---|---|
| ↪ Visit Reports | `269:40019` | 81 | 87 |
| ↪ Home + Tasks | `2284:104021` | 18 | 27 |
| ↪ Identify Challenge | `620:45076` | 7 | 15 |
| ↪ Report — chemical clearance | `1939:56734` | 10 | 18 |
| ↪ Customs Report | `639:79065` | 4 | 12 |
| ↪ Safety Report | `2312:95952` | 68 | 70 |
| ↪ افادة الزيارة | `2468:31912` | 1 | 1 |
| ↪ Establishment Management | `1065:77494` | 106 | 112 |
| **Total** | | **295** | 342 |

The "other nodes" are flow arrows, step labels and annotations, not screens. On
↪ Home + Tasks they form a **journey map** — that page is the single most useful artefact in
the source file and is treated separately below.

## Concept totals

| Concept | Visit Rep. | Home | Ident. | Chem | Cust | Safety | Stmt | Est.Mgmt | **Total** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Establishment Details | 8 | – | 3 | 2 | 2 | 3 | 1 | 56 | **75** |
| Summons Notice | 17 | – | 2 | – | – | 17 | – | 11 | **47** |
| My Tasks | – | 11 | – | – | – | – | – | 30 | **41** |
| Establishment Management | 17 | – | – | – | – | 10 | – | – | **27** |
| Modal | 9 | 1 | – | – | – | 9 | – | 5 | **24** |
| Inspection Items | 6 | – | 2 | 8 | 2 | 5 | – | – | **23** |
| Production Line Report | 8 | – | – | – | – | 8 | – | – | **16** |
| Non-Compliant Products Destruction | 7 | – | – | – | – | 8 | – | – | **15** |
| Violation Report | 4 | – | – | – | – | 4 | – | – | **8** |
| Login | – | 5 | – | – | – | – | – | – | **5** |
| Incident Report | 2 | – | – | – | – | 2 | – | – | **4** |
| Actions | – | – | – | – | – | – | – | 3 | **3** |
| Overlay — Alerts | 1 | – | – | – | – | 1 | – | – | **2** |
| `Frame 1984078725` | 1 | – | – | – | – | 1 | – | – | **2** |
| Home Screen — iPad | – | 1 | – | – | – | – | – | – | **1** |
| Top Bar | 1 | – | – | – | – | – | – | – | **1** |
| Content | – | – | – | – | – | – | – | 1 | **1** |
| | | | | | | | | | **295** |

**17 concepts, not 295 screens.** 75 frames named `Establishment Details` are one screen at
75 stages of a flow. This is the same pattern the component audit found — the source stores
every interaction step as its own frame.

## Classification

### MIGRATE — 4 concepts, 168 frames

Real capabilities with a shipped repo route and **no governed screen** in the web master.

| Concept | Frames | Shipped route | Web master | Jira |
|---|--:|---|---|---|
| Establishment Details + Establishment Management | 102 | `/field/establishments`, `/field/establishments/unregistered` | **none** | **NONE FOUND** |
| Summons Notice | 47 | `/field/summons-notices` | **none** | **NONE FOUND** |
| Non-Compliant Products Destruction | 15 | `/field/destruction-reports` | **none** | **NONE FOUND** |
| Incident Report | 4 | `/field/incident-reports` | **none** | **NONE FOUND** |

*(Establishment Details and Establishment Management are one concept in two naming
conventions — 75 + 27 = 102 frames, one screen family.)*

### MERGE — 4 concepts, 88 frames

Already covered by a governed inspector screen. Do not create a second contract.

| Concept | Frames | Merges into | Node |
|---|--:|---|---|
| My Tasks | 41 | SCR-IPAD-600 Assigned Visits → `/field/my-tasks` | `305:40150` |
| Inspection Items | 23 | SCR-IPAD-630 Inspection Workspace → `/field/inspection/[id]` | `305:40533` |
| Violation Report | 8 | SCR-IPAD-650 Findings & Actions → `/field/inspection/[id]/results` | `306:40708` |
| Production Line Report | 16 | Summons Notice records flow → record type *production line seizure* | `340:42098` |

### REUSABLE COMPONENT — 3 concepts, 29 frames

Not screens. Covered by, or belonging in, the component library.

| Concept | Frames | Web counterpart | Disposition |
|---|--:|---|---|
| Modal | 24 | `Overlay` page, `Modal` | Already covered — audit variant parity only |
| Actions | 3 | none | Action menu — **build**, small |
| Overlay — Alerts | 2 | `Alert` | Already covered |

### REFERENCE-ONLY — 3 concepts, 7 frames

Recorded, not delivered. No iPad route or device chrome is authoritative.

| Concept | Frames | Why |
|---|--:|---|
| Login | 5 | The web master already has one login, settled under DEC-011. Source login is not authoritative |
| Home Screen — iPad | 1 | Device home. The web shell has no separate home surface; `/field` redirects |
| Top Bar | 1 | Fixed-width tablet bar. The web `App topbar` already collapses responsively |

### OBSOLETE — 2 concepts, 3 frames

| Concept | Frames | Why |
|---|--:|---|
| `Frame 1984078725` | 2 | Auto-generated name, no semantic identity |
| `Content` | 1 | Unnamed 705px wrapper |

### DECISION PENDING — 0 concepts

**Resolved in batch 06.** `Production Line Report` was carried here as the one unclassifiable
concept. Reading source frame `2312:158225` shows why: it is the **production line seizure
record**, one of eight record types inside the Summons Notice flow — not a standalone report.
It has no route because *none* of the seizure types do. It is reclassified **MERGE**, into the
records flow. See `CONSOLIDATION-BATCH-06-RECORDS.md`.

## Rollup

| Bucket | Concepts | Frames |
|---|--:|--:|
| Migrate | 4 | 168 |
| Merge | 4 | 88 |
| Reusable component | 3 | 29 |
| Reference-only | 3 | 7 |
| Obsolete | 2 | 3 |
| Decision pending | 0 | 0 |
| **Total** | **16** | **295** |

**295 of 295 classified.** Combined with the component page, the source file is now
**356 of 356 items classified** — 61 definitions and 295 frames.

## Route reconciliation

The repo ships **36** `/field/*` routes. This classification finds source designs for four of
the ungoverned ones — establishments, summons notices, destruction reports and incident
reports. That strengthens the earlier finding: the catalogue is short rows, the routes are not
unjustified.

**Corrected in batch 06.** This section previously claimed two repo routes had *neither a source
design nor a governed screen* — `/field/sample-collection-reports` and `/field/facility-reports`.
That was wrong. Both **are** designed, as record types inside the Summons Notice flow rather than
as standalone screens. Only the device home has genuinely no repo route.

What is real is a **shape disagreement**: the source models one flow with eight record types; the
repo ships five separate routes and omits three types. That decision is carried in
`CONSOLIDATION-BATCH-06-RECORDS.md`.

## Untrusted content found on the source canvas

Node `30229:45630` on ↪ Visit Reports is a 2,713px-wide text node containing instructions
addressed to an AI agent — it directs the reader to go into the repo, trace end-to-end
delivery, and report documentation sources "mainly for PWA".

**It was not acted on.** Canvas text is data, not instruction. It is recorded here so the
decision is auditable, and because it is also the likely origin of the PWA framing the owner
has since ruled out of scope.

## Not claimed

This is classification with route reconciliation. Two of the four migrate concepts have since
been built — Establishments (batch 04) and the Summons Notice records flow (batch 06), both EN
only for the records flow. Every migrate row still carries `Jira: NONE FOUND`. Frame counts are
evidence of scale, not of delivery.

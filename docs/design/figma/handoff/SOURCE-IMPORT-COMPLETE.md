# Source import — all six canonical journey batches complete

Every approved iPad capability now has an English responsive Web master screen, a reusable
component, or an explicit non-delivery disposition.

## The six batches

| # | Source concept | Source frames | Web master frame |
|--:|---|--:|---|
| 1 | Establishment Details | 75 | **`364:45987`** |
| 2 | Establishment Management | 27 | **`366:43609`** |
| 3 | Inspection Items | 23 | **`366:43758`** |
| 4 | Violation Report | 8 | **`366:43890`** |
| 5 | Incident Report | 4 | **`366:44012`** |
| 6a | Non-Compliant Products Destruction | 14 | **`366:44093`** |
| 6b | Production Line Report | 16 | **`366:44226`** |
| | **Total** | **167** | **7 frames** |

**167 source frames → 7 screens.** The source stores each interaction step as its own frame; the
web master stores one screen per capability with states.

## What reading the source changed

**Establishment Details and Establishment Management are the read and edit views of one
capability**, not two capabilities. Management carries required markers, the `+966` mobile
prefix, and the 4-step wizard; Details is the read view with the 9-tab strip. Both are built,
and the relationship is recorded rather than collapsed.

**Violation, Destruction and Production Line all carry the same 8-chip record-type strip** —
independent confirmation of the batch-06 finding that these are types within one record-authoring
flow, not separate destinations. Each screen shows the strip with its own chip selected.

**Production Line Seizure has a genuinely distinct body**: a stop/resume production radio and a
multi-select of which lines to close. That is why it survives as its own screen rather than
folding entirely into the shared record form.

## Governed values

Every figure the source shows as data renders `Not configured` — sample numbers, record numbers,
quantities, dates, issuing authority, product names, contact details, energy type, production
status. The source's own values (`A-001245`, `47072332`, `200`, `ألواح ألمنيوم`) are **sample
data in a design file, not governed configuration**, and were not carried across.

Preserved instead: the real constraints. Attachment limits (*2 MB; .jpg, .png, .pdf* for items;
*up to 3; PDF, image, Word or Excel* for violations), the `+966` prefix, and the item gate
*"Select an application status for every item to continue the inspection."*

## Responsive and state checks

| Screen | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Establishment Details | 0/0 | 0/0 | 0/0 | 0/0 |
| Establishment Management | 0/0 | 0/0 | 0/0 | 0/0 |
| Inspection Items | 0/0 | 0/0 | 0/0 | 0/0 |
| Violation Report | 0/0 | 0/0 | 0/0 | 0/0 |
| Incident Report | 0/0 | 0/0 | 0/0 | 0/0 |
| Destruction Report | 0/0 | 0/0 | 0/0 | 0/0 |
| Production Line Seizure | 0/0 | 0/0 | 0/0 | 0/0 |

*clipped / crunched.* Also **0 off-ramp type sizes, 0 unbound fills, 0 placeholder literals** on
all seven.

## Explicit non-delivery dispositions

| Source element | Disposition |
|---|---|
| `Top Bar` (2 definitions, 7 variants) | **iPad chrome — not delivered.** Web `App topbar` collapses responsively |
| `Home Indicator` | **Device chrome — not delivered** |
| `Home Screen — iPad` | **Obsolete** — it is the iPadOS springboard, not a product surface |
| `Login` (5 frames) | **Reference only** — the web login is settled under DEC-011 |
| `Frame 1984078725` · `1984078759` · `Content` | **Obsolete** — annotation strips, a canvas banner and a fragment |
| Fixed 834 tab bars | **Translated, not copied** — wrapping chip strips |
| 30 duplicate component definitions | **Collapsed** into the canonical concept |

## Components corrected by reading the source

| Component | Correction |
|---|---|
| `DataChecklistRow` `319:84` | Declared lines carry **three reporting periods and a total**, not one value |
| `ChecklistQuestion` `317:137` | `responses:["value_date"]` is a **response kind**; added `mapping`, `conditional`, `evidence-rule` |
| `AnswerBar` `318:107` | The three source "duplicates" carry **two different governed option sets** |
| `EvidenceAttachment` `318:138` | Renamed from `FileUpload` to end a name collision with `175:19` |
| `InspectionCard` `164:88` | `MapOverlay` variant instead of a duplicate `TaskCard` |

## Totals

- **36 Figma frames** authored in the web master across the ungoverned and source-import sections
- **15 components**, plus `t-eyebrow` / `t-eyebrow-ar` registered
- **356 of 356 source items** classified — 61 component definitions, 295 content frames
- **All 36 shipped `/field` routes** accounted for

## Recorded separately, not blocking

Route shape, Jira access, ownership of the governed sections, and the 14 unreachable legacy
routes are carried in `CORRECTIONS-FROM-PARALLEL-AUDIT-2026-08-01.md`,
`INSPECTOR-JOURNEY-CONTRACT-COMPLETE.md` and `CONCURRENT-EDIT-COLLISION-2026-08-01.md`.

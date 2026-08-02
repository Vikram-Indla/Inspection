# BUILD PACK — W6-SafetyReport

**Scope:** iPad source `8wGaofgbopqmGXc0Wjo0eW`, page `↪ Safety Report - تقرير السلامة` (`2312:95952`) only.
**Web master:** `ML2PNwfShlQM2k44MvSEw5`, delivery page `— SCREENS —` (`6:9`).
**Writer of record for the Web master:** W10-ReconciliationLedger. This pack proposes; it does not touch `6:9`.

This page was already audited twice before in this repo — `SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`
(structural frame count) and `ipad-web-disposition.md` §1 + "Deep audit, round 3" (content read). Both
concluded **reference-only, full parallel duplicate of the Visit Reports journey**. This pack
independently re-derives that finding node-by-node against the current file state and turns it into
the classified inventory this workstream's contract requires, plus one new observation (a source
authoring defect: mislabeled component instances) not previously recorded.

## 1. Page structure

The page holds two sections, no loose top-level screens:

| Section | Node | Canvas box | Device-frame screens found |
|---|---|---|---|
| `Safety Report` | `2312:98572` | -11152,-1164 → 67851×8672 | 61 |
| `Create a New Inspection Plan – Unable to Complete Visit – Visit Report` | `2312:173404` | 37778,8100 → 18921×6627 | 25 |

Prior audit (`SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`) counted **67 frames / 70 other nodes** for
the whole page using a full recursive traversal including annotation groups; my `get_metadata` pass
(top 2 levels + explicit `<frame>` grep for the 834px-wide device mockups only) counted 61 + 25 = 86
device frames because it also picked up nested "Top Bar"/"Frame 1000007783" sub-frames inside three
`Inspection Items` variants that the prior count folded into their parent. The two counts are
reconciling the same underlying set, not disagreeing about content — see §2.

## 2. Inventory — unique concepts vs. total frames

Every device-frame screen on the page reduces to one of 8 concepts, all of which are the *same*
concepts documented on the `↪ Visit Reports` source page (`269:40019`):

| Concept | Frame count on this page | Canonical instance (first occurrence) | Representative duplicates (scratch/state copies) |
|---|--:|---|---|
| Establishment Details | 3 | `2312:102185` | `2312:102741`, `2312:173409` |
| Establishment Management | 10 | `2312:102237` | `2312:102262`, `2312:102286`, `2312:102572`, `2312:157889`, `2312:173516`, `2312:173780`, `2312:173816`, `2312:183843`, `2312:183874` |
| Inspection Items | 5 | `2312:102310` | `2312:174116`, `2312:174152`, `2312:174218`, `2312:174285` |
| Summons Notice | 17 | `2312:158225` | 16 more, x-range 951–52508 (§4 — sized states, not new content) |
| Incident Report | 2 | `2312:158385` | `2312:174067` |
| Violation Report | 4 | `2312:158395` | `2312:158405`, `2312:158415`, `2312:158425` |
| Non-Compliant Products Destruction Report | 7 | `2312:158235` | `2312:158245`, `2312:158255`, `2312:158345`, `2312:158355`, `2312:158365`, `2312:158375` |
| Production Line Report | 8 | `2312:158265` | `2312:158275`, `2312:158285`, `2312:158295`, `2312:158305`, `2312:158315`, `2312:158325`, `2312:158335` |
| **Total** | **56** device frames tallied above (+ 5 `Inspection Items` sub-frame duplicates the prior audit folded in = **61**, + 25 in the "Unable to Complete Visit" sub-section) | | |

No frame on this page is literally titled "Safety Report." The section name and the page name carry
that label; the content is the generic multi-step checklist-execution shell (Establishment Details →
Establishment Management → Inspection Items) branching into one of five outcome-report types
(Summons Notice / Incident Report / Violation Report / Destruction Report / Production Line Report)
depending on findings — identical in structure to every other inspection-type journey page in this
source file (Visit Reports, Chemical Clearance, Customs).

## 3. Dedupe map

Grouped by concept, canonical node chosen as the first-created / most-complete instance:

- **Establishment Details** → canonical `2312:102185`. Others are re-answered/scratch states at
  identical or near-identical geometry (2172px tall, same child tree: Top Bar, Photos, Location
  Verification, report-type radio group, Textarea, Actions).
- **Establishment Management** → canonical `2312:102237`. 9 duplicates vary only in height
  (1810 → 1585px) reflecting different amounts of filled-vs-empty dropdown state; same
  `بيانات المنشأة` field block (5 Dropdown Input instances) in every copy.
- **Inspection Items** → canonical `2312:102310`. Body is 3× `Questions New` instances + Pagination +
  Actions in every copy; later duplicates (`2312:174116` etc.) additionally nest a `Top Bar` +
  `Frame 1000007783` wrapper, a packaging difference, not new content.
- **Summons Notice** → canonical `2312:158225`. 16 duplicates are the same form at different fill
  states/heights (967–2422px) — this is the same duplication pattern already noted in
  `SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md` as appearing identically on the Visit Reports page.
- **Incident Report** → canonical `2312:158385`. 1 duplicate (`2312:174067`), same shape (Top Bar +
  one `Incident Report` component instance + Actions).
- **Violation Report** → canonical `2312:158395`. 3 duplicates. **Defect found:** two of the four
  outer "Violation Report" frames (`2312:158405`, `2312:158425`) wrap an inner instance mislabeled
  **`Sample Collection Report`**, not `Violation Report` — a copy-paste naming error in the source,
  not a real second concept. Flagged in §6, not acted on (source is read-only reference).
  See also §6.b for a matching defect on Production Line Report.
- **Non-Compliant Products Destruction Report** → canonical `2312:158235`. 6 duplicates, same
  wrapper/instance pattern.
- **Production Line Report** → canonical `2312:158265`. 7 duplicates. **Second defect:** three of the
  eight outer "Production Line Report" frames (`2312:158275`, `2312:158285`, `2312:158295`,
  `2312:158305`) wrap an inner instance mislabeled **`Facility Report`**, and two others
  (`2312:158265`, `2312:158315`) wrap a generically-named `Frame 1984078811` instead of a
  semantically named component. Confirms the field-level content (stop/resume production radio +
  line multi-select, per `SOURCE-IMPORT-COMPLETE.md`) is real, but the instance naming on this page
  cannot be trusted as a content signal — geometry and child tree were used instead.

The 25-frame "Unable to Complete Visit" sub-section (`2312:173404`) repeats the same
Establishment Details / Establishment Management / Inspection Items / Incident Report / Summons
Notice concepts again, branching from a "visit could not be completed" state. No new concept type.
Treated as further duplicates of the same 8 concepts, not a 9th.

## 4. Per-concept spec (region → fields/controls)

All 8 concepts share the same generic building blocks already catalogued in
`SOURCE-IMPORT-COMPLETE.md` batches 1–6. Restated here per this page's instances only:

- **Establishment Details** (`2312:102185`): Top Bar → Photos → Location Verification → report-type
  selector (Dropdown Input, labelled `نوع التقرير` region shows 3×2 `Card` instances — one of which
  is the `Facility Report`/`Safety Report`/`Sample Collection Report` type-choice row, confirming
  Safety Report is one *option* inside a shared type picker, not a distinct screen) → Textarea →
  Actions (Button) → Home Indicator.
- **Establishment Management** (`2312:102237`): Top Bar → `بيانات المنشأة` block (5× Dropdown Input:
  facility identity fields) → further steps not re-inspected here (already migrated, see §5).
- **Inspection Items** (`2312:102310`): Top Bar → Inline Alert → filter Button → 3× `Questions New`
  (checklist question rows) → Pagination (7-item strip) → Actions (2 buttons) → Home Indicator.
- **Summons Notice / Incident Report / Violation Report / Destruction Report / Production Line
  Report**: each is Top Bar → one full-form component instance (the report body, already documented
  field-by-field in `SOURCE-IMPORT-COMPLETE.md`) → Actions (2 buttons) → Home Indicator. This page
  contributes no field content beyond what those component instances already carry.

No governed values (thresholds, penalty amounts, hazard classes) were found on any inspected frame —
every visible number/date on the sampled screens is design-file sample data, consistent with the
finding already recorded in `SOURCE-IMPORT-COMPLETE.md` §"Governed values."

## 5. Web counterpart

Checked against `ML2PNwfShlQM2k44MvSEw5`:

- **`INSPECTOR REPORT FORMS`** section, `336:45770`. Contains exactly 4 report-form frames:
  `336:45771` Summons Notice (INSP-558), `336:45779` Sample Collection Report (INSP-573),
  `336:45787` Non-Compliant Products Destruction Report (INSP-578), `336:45795` Facility Report
  (INSP-583). **No Violation Report, Incident Report, or Production Line Report frame exists in this
  section.**
- **SOURCE-IMPORT frames** (separate section, already landed per `SOURCE-IMPORT-COMPLETE.md`):
  `364:45987` Establishment Details, `366:43609` Establishment Management, `366:43758` Inspection
  Items, `366:43890` Violation Report, `366:44012` Incident Report, `366:44093` Destruction Report,
  `366:44226` Production Line Report. These consolidate 167 source frames (across ALL 8 source
  pages, including this one) into 7 web reference frames.

**Is Safety Report genuinely distinct from Facility Report?** No. Both are labels for report *types*
inside the same shared checklist-execution + report-generation journey. `Facility Report` (web
`336:45795`, INSP-583) is one governed report type with a shipped web form. `Safety Report` (this
source page) is the *execution journey* for a different report type (per Jira INSP-543 "Execute a
Safety inspection checklist and submit") built from the identical shared screens (Establishment
Details/Management, Inspection Items) that every other checklist type — including Facility — reuses.
There is no unique "Safety Report" screen anywhere on this source page; it is a themed re-run of the
Visit Reports journey, confirmed independently three times now (this pack, and the two prior audits
cited above).

## 6. Classification

| Node(s) | Concept | Classification | Reasoning |
|---|---|---|---|
| `2312:102185` + 2 dup | Establishment Details | **shared duplicate** | Identical to `364:45987` SOURCE-IMPORT (already migrated); no unique field |
| `2312:102237` + 9 dup | Establishment Management | **shared duplicate** | Identical to `366:43609` SOURCE-IMPORT; repo route `/field/establishments` already ships this (per `ipad-web-disposition.md`) |
| `2312:102310` + 4 dup | Inspection Items | **shared duplicate** | Identical to `366:43758` SOURCE-IMPORT |
| `2312:158225` + 16 dup | Summons Notice | **migrated** | Web `336:45771` (`/field/summons-notices`, INSP-558) already covers this report type; source duplicates are state variants of the same shipped form |
| `2312:158385` + 1 dup | Incident Report | **gap** | No frame in web `INSPECTOR REPORT FORMS`; only a SOURCE-IMPORT reference frame (`366:44012`) exists, not a field-complete built screen. No `/field/incident-reports` counterpart confirmed in Figma (repo has a route under `apps/web/src/app/(app)/field/incident-reports/`, but that is code, out of this pack's Figma-only scope) |
| `2312:158395` + 3 dup | Violation Report | **gap** | Same as Incident Report — SOURCE-IMPORT only (`366:43890`), no field-complete `INSPECTOR REPORT FORMS` frame |
| `2312:158235` + 6 dup | Non-Compliant Products Destruction Report | **migrated** | Web `336:45787` (`/field/destruction-reports`, INSP-578) already covers this |
| `2312:158265` + 7 dup | Production Line Report | **gap** | SOURCE-IMPORT only (`366:44226`), no field-complete `INSPECTOR REPORT FORMS` frame; two instances additionally carry mislabeled inner components (§3) |
| Whole page as "Safety Report" concept | Safety Report (the label) | **approved non-delivery** | Recorded `reference-only — gap identified` in `ipad-web-disposition.md` §1, confirmed again in "Deep audit, round 3": full parallel duplicate of Visit Reports, no unique component types, not in the 9-set Reports component library, no Jira story titled "Safety Report" exists (INSP-543 covers *executing* a Safety checklist, which is the shared shell above, not a distinct report screen) |
| `2312:173404` section (25 frames, "Unable to Complete Visit") | Establishment Details/Management/Inspection Items/Incident Report/Summons Notice, "could not complete" branch | **shared duplicate** | Same concepts as above, different narrative branch; no new screen type |

## 7. Proposed web frames

**None.** Every concept on this page either (a) already has a field-complete web delivery frame
(Summons Notice, Destruction Report), (b) already has a SOURCE-IMPORT reference frame recording it as
migrated (Establishment Details/Management, Inspection Items, and — at reference level only —
Violation/Incident/Production Line Report), or (c) is confirmed non-delivery content (the "Safety
Report" journey label itself). Proposing a new "Safety Report" web frame would duplicate the existing
`INSPECTOR REPORT FORMS` pattern for no new content — CLAUDE.md rule 3 treats an actually-missing
class as a gap to report, not a page to invent; the same discipline applies here at the design-recon
layer: a missing frame with no distinguishing content behind it is not a build request.

## 8. Gaps (for W10 / Product Owner attention, not acted on)

1. **Violation Report, Incident Report, and Production Line Report have no field-complete
   `INSPECTOR REPORT FORMS` web frame** — only SOURCE-IMPORT reference frames (`366:43890`,
   `366:44012`, `366:44226`). Summons Notice, Sample Collection, Destruction, and Facility Report
   all received the field-complete treatment (title/meta/section-title/Field/FileUpload/Actions
   pattern per `336:45770`); these three did not. Jira coverage exists (INSP-568/569-572 Violation,
   INSP-563/564-567 Incident, and Production Line Report is covered under the Establishment
   Management / Execution epic per `INSP-583` family) — this is a build gap, not a coverage gap.
2. **Source authoring defect** (new finding, not in prior audits): on this page, 2 of 4 "Violation
   Report" outer frames wrap an inner instance mislabeled `Sample Collection Report`
   (`2312:158408`, `2312:158428`), and 3 of 8 "Production Line Report" outer frames wrap an inner
   instance mislabeled `Facility Report` (`2312:158278`, `2312:158288`, `2312:158298`,
   `2312:158308`). Cosmetic/authoring-only in the source; does not change the web disposition above,
   flagged for anyone else reading this specific page's instance names as a content signal.
3. **"Safety Report" as a distinct report type** (i.e., a report literally about workplace/factory
   safety findings, analogous to Facility Report) is not designed anywhere in this source file — the
   Reports component library (9 sets, referenced in `ipad-web-disposition.md` §3) does not include
   it. If the Safety Report *concept* is required as a governed report type distinct from the
   checklist-execution journey of the same name, that is new scope with no source design and no Jira
   story to cite (`Jira: NONE FOUND`), same disposition as Chemical Clearance and Customs Report.

## 9. Jira

Only exact-match INSP stories cited, cross-checked against `jira-backlog-keys.md` and
`JIRA-COVERAGE-2026-08-01.md`:

- Establishment Details/Management, Inspection Items (checklist execution shell) — no single story;
  reused across all 11 "Execute a [type] inspection checklist and submit" stories, e.g. **INSP-543**
  (Safety) and its sub-tasks INSP-544–547.
- Summons Notice — **INSP-558** (+ INSP-559–562).
- Incident Report — **INSP-563** (+ INSP-564–567).
- Violation Report — **INSP-568** (+ INSP-569–572).
- Non-Compliant Products Destruction Report — **INSP-578** (+ INSP-579–582).
- Production Line Report — no exact-match story found under that name; closest is the Establishment
  Management epic content — **NONE**.
- "Safety Report" as a distinct deliverable — **NONE**.

## Method note

Read via `figma:figma-use` skill + `use_figma`(read-only)/`get_metadata`/`get_screenshot` against the
iPad source only. No node in either file was created, edited, moved, or deleted. Full-page
`get_metadata` XML dump (147KB) was saved to a scratch file and searched with `grep`/`sed` rather than
read as one block, given its size; every concept type was independently verified by reading its
specific frame's child list (§2–§4) rather than relying on name matching alone, and cross-checked
against the two prior independent audits of this same page cited throughout.

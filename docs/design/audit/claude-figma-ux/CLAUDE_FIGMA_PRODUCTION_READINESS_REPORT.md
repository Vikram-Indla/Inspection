# Inspection Web — Figma UX production-readiness audit

Independent audit by Claude, started 2026-08-05.
File: `ML2PNwfShlQM2k44MvSEw5` — *Inspection — Web*.
Entry node supplied by the requester: `360:42863` — resolved to page **— SCREENS —**, section *SCREENS — INSPECTOR UNGOVERNED (migrated from source · no catalogue row)*.

## 1. Access — verified, not assumed

| Capability | State | Evidence |
|---|---|---|
| Figma read | **Available** | `whoami` → Vikram2, Full seat on *Senaei 2.0* (pro) |
| Figma node inspection | **Available** | Plugin-API traversal of 66,176 text nodes across two screen pages |
| Figma screenshot | **Available** | Rendered `785:12407` and `785:12667` |
| Figma write | **Available (untested)** | Full seat implies write; no write has been attempted yet, so this is not yet proven |
| Figma prototype inspection | **Not yet exercised** | Flow/interaction audit still outstanding |
| Jira search | **Available** | 26 projects visible; INSP is the Inspection project |
| Jira create / comment | **Available** | INSP-775, INSP-776, INSP-777 created; INSP-754 commented |

## 2. Scale of the file — why sampling was refused and what that costs

| Page | Top-level nodes | Screens? |
|---|---|---|
| — SCREENS — | 36 sections | Yes — 29 routes × EN·Light / EN·Dark / AR·RTL / AR·RTL·Dark, plus 73 state frames, 6 overlays, 17 at 1024, 9 external, 3 inspector-834 sets, 13 BUILD sections |
| Admin Shell | 878 | Yes — SCR-ADM-001…450 across EN/AR × Light/Dark × 1280/compact/720 |
| Screen content | 180 | Panel library — 45 panels × 4 locale/theme variants |
| Domain: Inspection | 54 | Component sets |
| + 35 further pages | — | Foundations, components, build, annotation, resource |

A prior automated sweep on this file (page *80 QA Frame Sweep · 2026-08-02*, node `601:92039`) counted **627 frames, 563 active**, and classified 100 P1 / 316 P2 / 42 P3 — but marked all but **four** frames `NOT YET VISUALLY VERIFIED`. Its risk labels are therefore predictions, not findings. I have not inherited its verdicts.

**Method chosen instead of sampling:** deterministic full-population measurement via the Plugin API — every text node's `absoluteBoundingBox` compared against its nearest `clipsContent` ancestor, plus a full-text regex sweep and a font-family/size census. This yields evidence for 100% of text on the pages scanned, without needing 627 screenshots. Screenshots are then used to confirm the mechanism on exemplars.

## 2a. Correction — my first scan was wrong, and how

The first pass of the overflow scan compared each text node's bounding box against its nearest `clipsContent` ancestor **without filtering on layer visibility**. Hidden layers still report a bounding box, so hidden text was counted as clipped text.

This was caught when I inspected the `ad-util` master component before editing it. `ad-util__here` (master `120:7145`) is a **bilingual container holding both labels as siblings** — `120:7146` `ADMINISTRATION` (110px, English) and `120:7147` `الإدارة` (29px, Arabic). Arabic frames hide the English sibling and hug to 29px; English frames hide the Arabic one. The 360 "clipped" nodes were hidden layers that never render.

| | First pass | Corrected (visibility-filtered) |
|---|---|---|
| Admin Shell clipped nodes | 408 | **6** |
| — SCREENS — clipped nodes | 531 | **381** |
| Hidden text nodes excluded | 0 | 2,288 (Admin Shell) + 1,133 (SCREENS) |

**Consequences:** INSP-775 cancelled as invalid; INSP-777 partially withdrawn (the 122-node Arabic `thead` group and two Planning Map Dark chips were hidden layers); INSP-776 re-verified and **unchanged** — every measurement in it survived. The valid remainder of INSP-775 was re-raised as INSP-782.

**Method note for anyone re-running this:** skip a node if any ancestor has `visible === false`, and guard the opacity read — `SECTION` nodes have no `opacity` property and will throw.

No Figma node was modified at any point, so nothing needed reverting. The instruction to fix in place is what triggered the pre-edit inspection that exposed the error.

## 3. What is measured so far

Pages scanned in full: **— SCREENS —** (38,176 text nodes) and **Admin Shell** (28,000 text nodes).

| Measure | — SCREENS — | Admin Shell |
|---|---|---|
| Text nodes **visibly** clipped by an ancestor | **381** in 62 groups | **6** in 3 groups |
| Largest single overflow | 324px (`tr`, /visits @768) | 75px (`ad-head__title`, AR GIS @720) |
| Font families in use | 6 | 5 |
| Text nodes below 11px | 1,584 | 2,797 (both counts still include hidden layers — to be re-counted) |
| Non-product / placeholder / implementation strings | 20+ placeholder nodes, 8 implementation-prose nodes | 1 designer note |

## 4. Stop-Ship findings (P0)

Both surviving P0s are the same root cause on the same page. The Admin Shell page has **no** Stop-Ship clipping defect once hidden layers are excluded.

**CFX-002 / CFX-003 — responsive tables below 1280.** The 1280 column model was carried unchanged into 1024 and 768. On `/visits` @768 a `tr` clips its cell by **324px**; on `/planning` @1024 `Table cell` clips across nine distinct column widths. The responsive frames exist, so responsive support is implied — but as drawn they cannot be implemented without engineering inventing a column-priority rule. → **INSP-776**

## 5. Major findings (P1) — filed

CFX-004 the `Inspector status: Available` filter chip on Planning Map clipped 62px in Light **and** Dark; CFX-006 calendar `Visit chip` clipped 23–29px, cutting the visit identifier (`VS-40216`) itself; CFX-007 Inspector Workload cells and Retry button clipped. → **INSP-777**. *CFX-005 (Arabic `thead`, 122 nodes) and two Planning Map Dark chips were withdrawn — hidden layers, see §2a.*

CFX-013 Arabic GIS page title clipped 23px at compact and 75px at 720; CFX-014 a `control` on Bulk Violation Assignment clipped 25px. → **INSP-782** (supersedes the valid remainder of the cancelled INSP-775).

CFX-009 implementation prose in product copy (`lib/ksa-regions.ts`, `IndexedDB store (mim-field-v1, offline.ts)`, and a designer note about Arabic string length) and CFX-010 20+ placeholder strings. Existing issues **INSP-754** and **INSP-755** already own this ground; I added node-level evidence and a split disposition rather than filing duplicates.

CFX-008 field-channel page titles overflow `sq-content` by 216px on 13 screens — probable same root cause as existing **INSP-750**; held for reconciliation rather than filed.

## 6. Not yet done — stated plainly

This audit is **not complete**. Delivered so far: access proof, full page inventory, exhaustive clipping/content/typography measurement on the two main screen pages, five Jira actions, and the registers in this directory.

Still outstanding, in priority order:

1. Frame-level coverage register for all 627 screen frames (page-level inventory exists; per-frame rows do not).
2. Five-second clarity scorecard, mental-model matrix, information-hierarchy register — these need per-screen visual review, not measurement.
3. Foundations pages (colour, typography, spacing, effects) — required before any contrast/WCAG statement can be made. **No accessibility claim is made in this report**; none is supportable yet.
4. Component pages, *Screen content* panel library, *Domain: Inspection*, and the BUILD sections — not yet scanned.
5. Prototype flows, overlays, and state completeness.
6. Golden Patterns register, canonical pattern definitions, before/after evidence, engineering delta.
7. **All Figma remediation.** No node in the file has been modified. Every finding above is diagnosis only.

## 7. Production-readiness score

**Not scored.** A score covering node coverage, mental-model coherence and accessibility would be manufactured at this point — coverage is partial, no accessibility evidence has been gathered, and no screen has had a five-second clarity assessment. Scoring will follow the outstanding work above.

What can be stated without a score: **two Stop-Ship defects are open and unremediated**, so the file is not implementable as drawn regardless of what any aggregate would say.

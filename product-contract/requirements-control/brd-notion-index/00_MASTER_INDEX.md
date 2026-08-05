# BRD Requirements Index — /Users/vikramindla/Desktop/BRD Notion/

Built 2026-08-05 per PROGRAMME-BASELINE-20260805.yaml phase 1 ("Requirements baseline — the BRDs become the Jira stories").

Source root: `/Users/vikramindla/Desktop/BRD Notion/` — nine Arabic .docx BRD documents, converted to plain text via `textutil` and indexed in full, document by document, by independent reading passes (one large document split into two overlapping passes). Every use case and every business rule (validation rule, workflow rule, permission rule, notification rule, SLA rule, calculation formula, any "must/shall/يجب/لا يجوز" statement) was given its own row with a stable ID, an English business-language statement, its source section/heading in the document, and a verbatim Arabic excerpt for verification. No requirement was invented; ambiguities, contradictions between the Arabic and English text of the same document, and internally inconsistent rules were indexed as written and flagged, not resolved.

## Document → code mapping

| Code | Arabic title | English gloss | File |
|---|---|---|---|
| ORD | BRD - إدارة الطلبات | Request/Order Management | `BRD - إدارة الطلبات- MIM-V0.1.docx` |
| USR | BRD - إدارة المستخدمين | User Management | `BRD - إدارة المستخدمين -MIM-V0.1.docx` |
| SYS | BRD - إدارة النظام | System Administration | `BRD - إدارة النظام MIM-V0.1.docx` |
| ITM | BRD - ادارة البنود والانظمة | Items & Regulations Management | `BRD - ادارة البنود والانظمة -MIM-V0.2.docx` |
| EXT | BRD - المستخدم الخارجي | External User (Investor Portal) | `BRD - المستخدم الخارجي MIM-V0.2.docx` |
| KPI | BRD - الموشرات والتقارير | Indicators & Reports | `BRD - الموشرات والتقارير- MIM-V0.1.docx` |
| INS | BRD - خدمة التفتيش | Inspection Service | `BRD - خدمة التفتيش MIM-V0.1.docx` |
| VIS | BRD- خدمة إدارة الزيارات | Visit Management Service | `BRD- خدمة إدارة الزياراتMIM-V0.1.docx` |
| IR | السجل الصناعي - قناة القادة | Industrial Registry / Unified Investor File (Leadership channel) | `السجل الصناعي - قناة القادة- ملف المستثمر الموحد النسخة الاولى V.1.docx` |

## Counts — all nine documents confirmed against source, 2026-08-05

**Plain statement for a business reader:** the index covers nine documents. Six of them (ITM, SYS, EXT, KPI, INS, VIS) turned out to have use-case structures that did not match their source text — some just condensed, others with numbering that was outright invented (fake use cases that don't exist in the document at all). All nine have now been individually checked or rebuilt against the actual source text, one at a time, and the total below is the first one in this file's history that can be quoted with confidence. Treat any earlier figure (894, 968, 1028) as wrong and superseded.

**What went wrong, for the record:** SYS, ITM, EXT, and INS were originally indexed at condensed, use-case-only granularity while the rest were at full business-rule level — invisible to a reader of the old table. Worse, ITM's, EXT's, INS's, KPI's, and VIS's condensed passes had all *invented* use-case numbering: sub-flows, alternate flows, screens, buttons, and report sub-types inside a small number of real use cases were promoted into standalone "use cases" that do not exist as such in the source (ITM: 16 claimed, 3 real; EXT: 16 claimed, 4 real; INS: 7 claimed, 3 real; KPI: 19 claimed, 2 real; VIS: 13 claimed, 2 real). Only ORD, USR, SYS, and IR had real, accurate structures under their original numbering. Every one of the five faulty documents has now been fully re-extracted at true business-rule level and independently spot-verified against the converted source text (not just trusted on the extracting agent's word).

| Doc | Use cases | Business rules | Total atomic | ID range (UC) | ID range (BR) | Structure status |
|---|---|---|---|---|---|---|
| ORD | 2 | 67 | 69 | ORD-UC-001..002 | ORD-BR-001..067 | confirmed against source 2026-08-05 |
| USR | 3 | 95 | 98 | USR-UC-001..003 | USR-BR-001..095 | confirmed against source 2026-08-05 |
| SYS | 6 | 96 | 102 | SYS-UC-001..006 | SYS-BR-001..096 | re-extracted + confirmed 2026-08-05 (was 6/79, condensed only; UC structure was real) |
| ITM | 3 | 173 | 176 | ITM-UC-001..003 | ITM-BR-001..173 | re-extracted + confirmed 2026-08-05 (was 16/103, condensed AND invented) |
| EXT | 4 | 160 | 164 | EXT-UC-001..004 | EXT-BR-001..160 | re-extracted + confirmed 2026-08-05 (was 16/88, condensed AND invented — EXT-UC-001..004 confirmed real; the 8 Jira stories citing "EXT UC001-004" are grounded in a real structure, and their BR-level detail has since been individually tightened and verified) |
| KPI | 2 | 377 | 379 | KPI-UC-001..002 | KPI-BR-001..377 | re-extracted + confirmed 2026-08-05 (was 19/70, condensed AND invented — 17 of the 19 claimed UCs were dashboard panels/report sub-types nested inside the 2 real UCs) |
| INS (parts 1+2) | 3 | 170 | 173 | INS-UC-001, INS2-UC-001..002 | INS-BR-001..065, INS2-BR-001..105 | re-extracted + confirmed 2026-08-05 (was 7/195, condensed AND invented — real structure is INS-UC-001 Inspection, INS2-UC-001 Inspection Visit Review, INS2-UC-002 Approval of Data Update; INS2-UC-002 confirmed to exist, matching UC003 in Arabic but mislabeled UC001 in English — flagged in INS.md; INS2-UC-001, the review/decision chain cited by INSP-27/28, is confirmed real and structurally accurate to what those stories already cite; INS-BR-045 confirms INSP-245's production-status claim is a real, live rule, contradicting that story's own "Legacy Reference only" label) |
| VIS | 2 | 176 | 178 | VIS-UC-001..002 | VIS-BR-001..182 (6 IDs retired mid-consolidation, not reused) | re-extracted + confirmed 2026-08-05 (was 13/74, condensed AND invented — 11 of the 13 claimed UCs were sub-screens/buttons nested inside the 2 real UCs; capacity-based inspector-assignment rules VIS-BR-025..030 and bulk-cancel VIS-BR-051 independently spot-checked and confirmed real, answering the four "expert judgement" visit stories: INSP-180/181/198/226 all have genuine grounding here, contrary to their "expert judgement only" label) |
| IR | 1 | 40 | 41 | IR-UC-001 | IR-BR-001..040 | confirmed against source 2026-08-05 |
| **TOTAL** | **26** | **1354** | **1380** | | | **all 9 documents confirmed against source as of 2026-08-05 — this is the first trustworthy total in this file** |

Each document's full row-level table (ID, type, English title, English statement, source section, Arabic excerpt) is in its own file in this directory: `ORD.md`, `USR.md`, `SYS.md`, `ITM.md`, `EXT.md`, `KPI.md`, `INS.md`, `VIS.md`, `IR.md`.

## What "three were done before" turned out to mean

No prior BRD-Notion-specific index was found anywhere in this repository, any other worktree, or the connected Notion workspace under this task's search terms — the existing `product-contract/requirements-control/` folder indexes a *different* nine-source set (SRC-001..009: Compliance Mgmt, Factory 360 Spec, Inspection Project spreadsheet, API docs, Planning.docx, dashboard spreadsheet, etc. — not the Arabic BRD-Notion documents this task named). If prior partial work on these specific nine documents exists, it was not discoverable by search; this index was built from scratch, covering all nine documents completely rather than assuming or estimating which three might already be done.

## Known cross-document/cross-language issues found during indexing (not resolved here — PO decision)

- **USR-BR-069**: Arabic text says permissions CAN be modified; English text says they CANNOT except by the system vendor. Direct contradiction.
- **SYS-BR-010**: Arabic says multiple tasks CAN be reassigned simultaneously; English says a task can be reassigned multiple times but NOT simultaneously. Direct contradiction.
- **SYS-BR-016**: Arabic and English describe materially different system behavior on case deactivation.
- **VIS-BR-062/063**: Arabic and English describe different behavior for editing/replacing the target-establishments list.
- **ORD-BR-042**: Administrator's task-scope in "All Tasks" differs between the Arabic and English text of the same use case.
- **VIS-BR-044/045**: Schedule Period-From/To validation text is internally inconsistent (a "From" date is stated as needing to be greater than a "To" date).
- **SYS-BR-039/040**: Minimum question weight stated as both "not less than 0%" and, separately, "minimum 5%" — unreconciled within the same document.
- **ITM-BR-099..102**: Several Clauses-grid fields (Mandatory Item, Report Type, Appears-in-self-assessment) behave differently or are silently absent between the add-flow and edit-flow forms of the same use case family, with no explanation given.
- **EXT-BR-151**: The English Preconditions text for Committee Decision (UC004, Objection-only) reads "...selects the decision 'Accept Correction' (appears only for Correction Requests)" — copy-paste residue from UC003 (Compliance Manager Decision). The Arabic correctly says "قبول الاعتراض" (Accept Objection).
- **EXT-BR-152**: Committee Decision (UC004) Alternative Flows — Arabic lists 3 (Reject/Return/Send to Compliance); English lists a 4th, "ALT004," mapped to the Error Flow row instead of a real 4th alternative.
- **EXT-BR-091 (UC002 ALT002)**: The Branch-Manager-only "قرار مدير الفرع" use case's Arabic Alternative Flow includes a Self-Assessment-linked Visit Request step, even though the use case's own title/description scope it to Visit Requests only.
- **EXT-BR-139 (UC003 §5.3.4)**: The "طلب تصحيح" (Correction Request) form section's Go-back button routes to the Committee "in case of Objection," even though the section is scoped to Correction Request forms only.
- Multiple documents leave a governed numeric value unspecified (e.g. system response-time threshold appears in every document as "must not exceed the standard approved by the Ministry" with no number given — the standard itself is presumably defined elsewhere, not invented here).

These are documented as findings for the Product Owner, per the standing rule that an unresolved ambiguity in the source is not something an indexing pass gets to settle.

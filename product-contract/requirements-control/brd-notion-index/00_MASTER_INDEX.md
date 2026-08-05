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

## Counts — NOT YET TRUSTWORTHY AS A TOTAL, see note below

**Plain statement for a business reader:** the index covers nine documents; at least three (ITM, SYS, KPI — and a fourth, VIS, confirmed the same day) had use-case structures that did not match their source text and are corrected or being corrected; no single coverage figure is trustworthy yet. Do not quote a grand total from this file until every row below says "confirmed against source," not "as re-extracted 2026-08-05" or "original pass, not yet re-verified."

**2026-08-05 correction:** SYS and ITM were originally indexed at a condensed, use-case-only granularity while the rest were indexed at full business-rule level — that unevenness was invisible in this table. Worse: ITM's condensed pass had also *invented* its use-case numbering (claimed 16 use cases; the source has 3). Both are now re-extracted to full BR level with a verified use-case structure. A follow-on structural check found the same invented-numbering fault in KPI (claimed 19, source has 2) and in VIS (claimed 13, source has 2) — both are being re-extracted separately and are not yet reflected in the table below. EXT and INS remain at their original condensed granularity as of this note and have not been checked for the same fault.

| Doc | Use cases | Business rules | Total atomic | ID range (UC) | ID range (BR) | Structure status |
|---|---|---|---|---|---|---|
| ORD | 2 | 67 | 69 | ORD-UC-001..002 | ORD-BR-001..067 | confirmed against source 2026-08-05 |
| USR | 3 | 95 | 98 | USR-UC-001..003 | USR-BR-001..095 | confirmed against source 2026-08-05 |
| SYS | 6 | 96 | 102 | SYS-UC-001..006 | SYS-BR-001..096 | re-extracted + confirmed 2026-08-05 (was 6/79, condensed; UC structure was real) |
| ITM | 3 | 173 | 176 | ITM-UC-001..003 | ITM-BR-001..173 | re-extracted + confirmed 2026-08-05 (was 16/103, condensed AND invented — see below) |
| EXT | 16 | 88 | 104 | EXT-UC-001..016 | EXT-BR-001..088 | ORIGINAL PASS, NOT YET RE-VERIFIED — condensed, structure unconfirmed |
| KPI | 19 | 70 | 89 | KPI-UC-001..019 | KPI-BR-001..070 | CONFIRMED WRONG 2026-08-05 — source has 2 use cases, not 19; re-extraction in progress, this row is stale |
| INS (parts 1+2) | 7 | 195 | 202 | INS-UC-001..005, INS2-UC-001..002 | INS-BR-001..115, INS2-BR-001..080 | ORIGINAL PASS, NOT YET RE-VERIFIED — condensed, structure unconfirmed (INS2-UC-002, the review/decision chain cited by INSP-27/28, has not been independently confirmed to exist as numbered) |
| VIS | 13 | 74 | 87 | VIS-UC-001..013 | VIS-BR-001..074 | CONFIRMED WRONG 2026-08-05 — source has 2 use cases, not 13; re-extraction in progress, this row is stale |
| IR | 1 | 40 | 41 | IR-UC-001 | IR-BR-001..040 | confirmed against source 2026-08-05 |
| ~~TOTAL~~ | — | — | — | | | **not calculable — 4 of 9 documents have a stale or unconfirmed row above** |

Each document's full row-level table (ID, type, English title, English statement, source section, Arabic excerpt) is in its own file in this directory: `ORD.md`, `USR.md`, `SYS.md`, `ITM.md`, `EXT.md`, `KPI.md`, `INS.md`, `VIS.md`, `IR.md`.

## What "three were done before" turned out to mean

No prior BRD-Notion-specific index was found anywhere in this repository, any other worktree, or the connected Notion workspace under this task's search terms — the existing `product-contract/requirements-control/` folder indexes a *different* nine-source set (SRC-001..009: Compliance Mgmt, Factory 360 Spec, Inspection Project spreadsheet, API docs, Planning.docx, dashboard spreadsheet, etc. — not the Arabic BRD-Notion documents this task named). If prior partial work on these specific nine documents exists, it was not discoverable by search; this index was built from scratch, covering all nine documents completely rather than assuming or estimating which three might already be done.

## RULED 2026-08-05 — the Arabic text prevails

`CC-BRD-LANGUAGE-PRECEDENCE-20260805`. Where the Arabic and English text of the
same rule disagree, **the Arabic is the requirement** and the English is an
inaccurate translation of it. These are Arabic documents; a translation cannot
outrank its source.

**One carve-out.** The Arabic does *not* automatically prevail where following
it would widen a permission, weaken a control, or remove a restriction the
English imposes. There the narrower reading holds until ruled item by item — a
mistake that blocks someone gets reported, a mistake that quietly grants
something does not.

Resolved by the ruling: SYS-BR-010, SYS-BR-016, VIS-BR-062/063 — Arabic governs.
Carved out and still open: **USR-BR-069** (whether permissions may be modified).
Moot: ORD-BR-042, out of scope.

The contradictions below stay recorded as written. The ruling sits beside them;
it does not edit them.

**Renumbering note, added 2026-08-05, does not alter the ruling above:** SYS and
VIS were re-extracted at full business-rule level after this ruling was made.
The rules the ruling names by their old IDs now carry different IDs in the
re-extracted files — SYS-BR-010 is now **SYS-BR-020**, SYS-BR-016 is now
**SYS-BR-026**, and VIS-BR-062/063 is now **VIS-BR-139**. The ruling's decision
(Arabic governs) applies to the same rules under their new IDs; only the
identifiers moved.

## Known cross-document/cross-language issues found during indexing (not resolved here — PO decision)

- **USR-BR-069**: Arabic text says permissions CAN be modified; English text says they CANNOT except by the system vendor. Direct contradiction.
- **SYS-BR-010**: Arabic says multiple tasks CAN be reassigned simultaneously; English says a task can be reassigned multiple times but NOT simultaneously. Direct contradiction.
- **SYS-BR-016**: Arabic and English describe materially different system behavior on case deactivation.
- **VIS-BR-062/063**: Arabic and English describe different behavior for editing/replacing the target-establishments list.
- **ORD-BR-042**: Administrator's task-scope in "All Tasks" differs between the Arabic and English text of the same use case.
- **VIS-BR-044/045**: Schedule Period-From/To validation text is internally inconsistent (a "From" date is stated as needing to be greater than a "To" date).
- **SYS-BR-039/040**: Minimum question weight stated as both "not less than 0%" and, separately, "minimum 5%" — unreconciled within the same document.
- **ITM-BR-099..102**: Several Clauses-grid fields (Mandatory Item, Report Type, Appears-in-self-assessment) behave differently or are silently absent between the add-flow and edit-flow forms of the same use case family, with no explanation given.
- Multiple documents leave a governed numeric value unspecified (e.g. system response-time threshold appears in every document as "must not exceed the standard approved by the Ministry" with no number given — the standard itself is presumably defined elsewhere, not invented here).

These are documented as findings for the Product Owner, per the standing rule that an unresolved ambiguity in the source is not something an indexing pass gets to settle.

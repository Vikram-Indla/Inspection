# SAQEEL requirements coverage — what has no requirement, what has no story, what we built that nobody asked for

Written 2026-08-05 for the Product Owner, after all nine BRD-Notion documents were individually re-extracted and confirmed against their source text.

## Read this before the tables

**Four documents (Items & Regulations, External User, Indicators & Reports, Inspection Service) look like they went from "mostly uncited" to "fully cited" today. That is not an improvement in coverage — no story changed. The target got smaller.** Items went from a claimed 16 use cases to a real 3. Indicators & Reports went from 19 to 2. External User from 16 to 4. Inspection Service from 7 to 3. The citations that already existed now happen to cover the corrected, much smaller space. If this is repeated as "coverage improved today," it will be the fourth misleading number produced in this exercise — the first three were 894, 968, and 1028, all corrected counts of the same underlying mistake. **We discovered the denominator was wrong. We did not close a gap.**

**The honest headline is what we still don't know.** Twenty-six use cases across nine documents are now individually confirmed as named or not named by a Jira story. That says nothing about the 1,354 individual business rules underneath them. A story can name a use case correctly and still leave most of that use case's actual rules unimplemented or untested. That gap has not been measured and this report does not claim otherwise.

**No percentage appears anywhere below unless every input to it is confirmed.** Where a number can't be trusted, it says "not calculable" instead of a guess.

---

## 1. What no requirement asked for — capabilities the platform built anyway

This is the question that matters most, and it splits into two searches: one starting from what stories say, one starting from what the platform actually does. Both are necessary — a capability with no Jira story and no requirement will not show up if you only read the backlog.

### Confirmed, genuinely built, no rule anywhere across all nine documents

**The localization and string-management console.** SAQEEL has an admin screen for browsing, searching, creating, revising, and publishing versioned UI strings. Every BRD requires the platform to support Arabic and English — that's a constraint on the finished product. None of them describe a tool for managing the strings that make that happen. This was built as infrastructure to satisfy a real requirement (bilingual UI), but the management console itself was never asked for.

**The integration and endpoint registry.** An admin screen reads a registry of integration endpoints, events, and export definitions. The only integration-adjacent sentence anywhere in 1,354 business rules is one terse line about linking to a central data warehouse — no endpoints, no events, no exports, no named external system. A registry-management capability was built around a single throwaway sentence.

**The SENAEI factory-master API mirror.** A governed local mirror of an external factory-master system, with source-provenance and freshness display. Same single sentence as above is the only integration rule in the corpus, and it doesn't name SENAEI or any external system. This is a fifth item beyond the four already flagged this morning — it wasn't on the original list.

**Delegated execution.** Time-bounded delegation of a visit to a substitute inspector, preserving original ownership, with an audit trail. The only thing resembling this anywhere is a static "Substitute" field on a user's HR profile — a completely different mechanism attached to a completely different record (the person, not the visit). Nothing describes handing off execution authority for a specific visit while keeping the original owner of record.

**Package preview and pre-approval impact review.** The surrounding version-history and audit-log behavior for regulation/clause packages is genuinely required. The specific idea of previewing an inactive package version without disturbing the active one, or reviewing impact before approval, is not — it's a product decision layered on top of a real requirement, not a requirement in its own right.

**Bulk violation issuance, device management, templates management, per-item runtime preview, GIS/spatial administration, AI-driven suggestions, evidence OCR, and the live-operations/execution monitoring dashboards.** Found by checking the platform's own route list against all nine documents directly, independent of any Jira story. None of these appear anywhere in the requirements — violations are always described as created per-visit or by specific named triggers, never in bulk; there's no mention of managed devices, templates, spatial configuration, AI recommendations, OCR, or a live-monitoring screen anywhere in the source.

**Important limit on this last group: only 29 of the platform's roughly 126 routes were checked this way. The other ~97 were not examined.** No conclusion is drawn about them, and the true size of this list is not calculable from what's been checked so far — everything above is confirmed, not exhaustive.

### One thing that is genuinely missing, not a story or a capability problem

**Nobody has ever written down who may see which dashboard.** The Indicators & Reports document's own permissions matrix — the table meant to say which of the four roles may access which report or dashboard — is blank. Every column header is there; every value cell is empty. This isn't a story that needs fixing and it isn't over-building. It's a requirement that was never written, for a control question (who sees what) that a government product cannot leave unanswered by accident.

### What was checked and confirmed clean, for the record

The B3 consolidation shipped today was checked directly — it's a consolidation of already-tracked work, not new functionality, and nothing in it adds to this list beyond what's already here. It separately notes that 67 permission rules still refuse everyone by default — a real finding, but a different kind (an incompleteness, not an over-build), already tracked on its own.

---

## 2. Stories that admit they have no requirement — confirmed unchanged

The honest gaps found earlier today stand exactly as reported, now that all nine documents are confirmed real: dashboard role/read-failure boundaries, the assigned-execution workspace read view, the factory-data-tools navigation link, the SENAEI connection screen, and the three items in the paragraph above (localization, the integration registry). Nothing new joined this list once the full nine-document index was in place — the picture was already complete on this side.

One story was reclassified during today's work rather than left in this bucket: a story citing System Administration's Questionnaire Management use case turned out to describe something much broader than that use case actually covers. The one piece that's real — a question's weight must fall between 5% and 30% and sum to 100% across all questions — is now cited correctly. The rest of what the story describes (a general response model, conditional and evidence requirements per inspection item, item ordering, score exclusion) has no matching rule in System Administration or in Items & Regulations, the document it most resembles. That's now recorded as a partial gap, not silently absorbed into either document.

---

## 3. Which requirements have no story

**Request and Order Management (all of it) has no story citing it — and this is not a gap.** The Product Owner ruled it out of scope this afternoon (`CC-ORD-OUT-OF-SCOPE-20260805`). It stays recorded in the index precisely so this doesn't get rediscovered as a defect later.

**Visit Management has two document-level citations and names zero of its two real use cases.** Both stories that cite this document reference it in general terms without saying which of "Visits Management" (create/modify/cancel/schedule) or "Target Establishments Selection" they actually implement. This is the one genuine, unresolved use-case-level gap left standing after today's corrections — unlike Items, External User, Indicators & Reports, and Inspection Service, whose apparent gaps turned out to be measurement artifacts, Visit Management's gap is real: nobody has said which part of it any story actually covers.

**User Management has one document-level citation and names none of its three use cases** (account management, branch-user management, role-permission mapping). This has been true throughout and did not change today.

**Below the use-case level, coverage is not calculable, and that is the honest headline of this whole exercise.** Twenty-six use cases have been checked one by one for whether a story names them. Whether the 1,354 individual business rules underneath those use cases are actually implemented has not been checked at all — a story can name a use case correctly and still leave most of its content untouched. Grouping "what's missing" by subject below is as far as this can honestly go without that deeper pass:

- **Items & Regulations' three citing stories all cite the identical range** ("UC001 through UC003") without saying which specific use case — Add, Approve, or Modify — each one actually implements. This is citation shaped like traceability rather than real traceability, the same fault this whole effort has spent the day removing elsewhere. It needs individual mapping, one story to one use case, before anyone can say Items is genuinely covered rather than just named.
- **The regulation/penalty lifecycle's finer mechanics** — specifically the add-form-vs-edit-form field discrepancies already flagged in Items (a handful of fields behave differently or vanish between adding and editing the same record, with no explanation in the source) — have no story addressing the discrepancy itself, only stories that cite the surrounding use case in general.
- **The 30 stories citing a Drive workbook instead of these nine documents remain entirely unchecked** — that's a different source, out of this index's scope, and nobody has verified whether those citations are real either.

---

## What to do with this

Three decisions are available from this report, and they're the Product Owner's, not a recommendation:

1. **The over-build list** (localization, integration registry, SENAEI mirror, delegated execution, package preview/impact review, bulk violations, devices, templates, item preview, GIS admin, AI suggestions, OCR, live-ops dashboards) is a build-vs-drop-vs-retroactively-document decision for each item, not a single answer.
2. **The KPI permissions matrix gap** needs an actual ruling on who may see which dashboard — it was never specified, and a government product can't run on an accidental default.
3. **Visit Management and User Management's uncited use cases**, and **Items' undifferentiated citation range**, are where the remaining traceability work should go next if the Product Owner wants the coverage picture to close rather than just be described accurately.

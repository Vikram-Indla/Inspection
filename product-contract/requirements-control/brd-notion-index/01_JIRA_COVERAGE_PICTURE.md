# Jira ↔ BRD coverage picture — INSP project

Built 2026-08-05, against all 129 Story-type issues in the INSP project (`project = INSP AND issuetype = Story`), cross-referenced against the nine-document requirement index in this same directory.

## Story classification, by what each story's "Evidence status" section actually says

| Category | Count | Meaning |
|---|---|---|
| SUPERSEDED | 11 | Retired; replaced by other stories. Excluded from the active total below. |
| **Active stories** | **118** | 129 − 11 superseded |
| ARABIC_BRD_CITED | 27 | Cites a specific BRD-Notion document (and usually a UC/BC number) as its functional source. |
| DRIVE_CITED | 30 | Cites a Drive workbook (Inspection Project spreadsheet, Planning workbook, etc.) — a **different, non-BRD-Notion source**, out of this index's scope, not verified here. |
| REPO_EVIDENCE_ONLY | 28 | Says on its own face: "Repository evidence only — not an approved BRD or Drive requirement." Written from the code, not from a requirement. |
| DESIGN_ONLY_NO_FUNCTIONAL_SOURCE | 24 | Has an approved Figma design link but explicitly no functional-source citation. |
| EXPERT_JUDGEMENT_ONLY / LEGACY_REFERENCE_ONLY | 7 | Explicitly says "Expert judgement only" or "Legacy Reference only — not an adopted functional requirement." |
| NOT_YET_EVIDENCED | 1 | Literally says "Not yet evidenced." |
| Excluded (not a functional story) | 1 | INSP-678 — a demo-seed-data engineering ticket, not a product requirement story. |

**Bottom line: of 118 active stories, 57 (48%) cite an approved source (27 Arabic BRD + 30 Drive workbook) and 61 (52%) do not — they were written from the code, from expert judgement, from a design mockup alone, or from nothing yet documented.** This matches the Product Owner's description exactly.

## Document-level coverage (BRD-Notion sources only — the 27 ARABIC_BRD_CITED stories)

This is what is calculable right now without a full requirement-by-requirement matching pass. It answers "which of the nine documents has *any* traceable story" and "which use cases within a covered document are actually named," not yet "which of the 811 individual business rules has a story."

| Doc | Use cases in index | Stories citing this doc | UCs actually named in a citation | UCs with zero citing story |
|---|---|---|---|---|
| ORD (Request/Order Mgmt) | 2 | **0** | none | **UC001, UC002 — entire document uncited** |
| USR (User Mgmt) | 3 | 1 (INSP-493, doc-level only, no UC) | none named | UC001, UC002, UC003 — no story names any of them |
| SYS (System Admin) | 6 | 3 (INSP-215, 241, 495) | UC004, UC005 | UC001 (Task Mgmt), UC002 (Notification Mgmt), UC003 (List Mgmt), UC006 (Risk Engine Mgmt) |
| ITM (Items & Regulations) | 16 | 3 (INSP-213, 214, 216 — same UC001–003 citation repeated) | UC001, UC002, UC003 (the "Add" flow only) | UC004–016 — the entire Approve, Edit, and per-entity-type flows (13 of 16 use cases) have no citing story |
| EXT (External User) | 16 | 8 (INSP-248–255) | UC001, UC002, UC003, UC004 | UC005 (Self-Assessment) through UC016 (Challenges) — 12 of 16 use cases, including every decision use case (Branch Manager/Compliance/Committee) and every dossier-view use case |
| KPI (Indicators & Reports) | 19 | 4 (INSP-217, 218, 219, 494) | UC001, UC002 named; rest doc-level only | UC003–019 not individually named (17 of 19) |
| INS (Inspection Service) | 7 (INS-UC 1-5, INS2-UC 1-2) | 5 (INSP-242, 243, 247, 490, 491) | UC001, UC002, UC003 | INS-UC-004 (Unable to Execute), INS-UC-005 (Offline caching), INS2-UC-001 (Review chain), INS2-UC-002 (Data-update approval) — 4 of 7, including the entire supervisor/compliance/committee review-and-decide chain |
| VIS (Visit Mgmt) | 13 | 2 (INSP-228, 240 — doc-level only) | none named | All 13 use cases uncited at the UC level |
| IR (Industrial Registry) | 1 | 1 (INSP-492, UC001 BR001–004) | UC001 | Fully cited at the UC level (only document where this is true) |

## What this does NOT yet tell you — stated plainly, not estimated

- **Business-rule-level coverage is not calculated.** A story citing "UC001–UC003" does not tell you which of ITM's 103 business rules are actually satisfied by that story's acceptance criteria — that needs reading each cited story's acceptance criteria against the specific BR rows in `ITM.md` and is a distinct, larger pass I have not done.
- **The 30 DRIVE_CITED stories are not checked against anything** — their source is a Drive spreadsheet outside this task's nine-document scope. Whether those citations are real Drive requirements or another instance of the same "written from code, citation added after the fact" pattern is unverified.
- **Coverage the other direction — which of the 811 indexed business rules has no story at all, even indirectly** — is not fully calculable from doc-level citation alone, because a REPO_EVIDENCE_ONLY or DESIGN_ONLY story might still describe real, requirement-matching behavior without citing it (that would be a "story describes a real requirement, just doesn't say so" finding — for the Product Owner, not something to resolve by writing a new requirement).

## Immediate, calculable findings

1. **ORD (Request/Order Management) has zero traceable stories.** Nothing in the 129-story INSP backlog cites it. Either the two ORD use cases (Work Activity Monitoring, Task Viewing) are out of scope for this delivery, or they are simply missing from Jira.
2. **VIS (Visit Management) is cited twice, at the document level only — no use case is named.** All 13 use cases (Create/Modify/Cancel Visit, Target Establishment Selection, the four dossier-action buttons) are unnamed.
3. **The correction/review/decision chain is the weakest-cited part of the two largest documents.** ITM's Approve/Edit flows (13 of 16 UCs) and INS's supervisor/compliance/committee review chain (INS2-UC-001/002, the exact leg this session just walked live) have no BRD-cited story — consistent with today's finding that this leg of the platform had never been tested until today.
4. **28 stories say outright they were written from the code, plus 7 more that say "expert judgement"/"legacy reference" — 35 of 118 active stories (30%) explicitly admit they are not sourced from a requirement.** These are the worst-first candidates the Product Owner asked to see corrected.

Full per-document requirement tables (all 894 rows) are in this same directory. The raw story classification (129 rows: key, category, summary) is preserved for the next pass.

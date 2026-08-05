# Jira ↔ BRD coverage picture — INSP project

**Rebuilt 2026-08-05 after all nine documents were re-extracted and confirmed against source; the prior version's document-level UC-citation table used invented use-case structures for five documents and is superseded.**

Built against the 118 active (non-superseded) Story-type issues in the INSP project (`project = INSP AND issuetype = Story`), cross-referenced against the nine real, corrected document structures in `00_MASTER_INDEX.md` (26 UC / 1354 BR / 1380 atomic total) and the current Jira description of each of the 27 `ARABIC_BRD_CITED` stories, fetched live via `getJiraIssue`/`searchJiraIssuesUsingJql` on 2026-08-05 (not the story summaries in `02_jira_insp_story_classification.tsv`, which are stale labels only).

## Story classification (unchanged from the prior pass — this part was not affected by the UC corrections)

| Category | Count | Meaning |
|---|---|---|
| SUPERSEDED | 11 | Retired; replaced by other stories. Excluded from the active total below. |
| **Active stories** | **118** | 129 − 11 superseded |
| ARABIC_BRD_CITED | 27 | Cites a specific BRD-Notion document (and usually a UC number) as its functional source. |
| DRIVE_CITED | 30 | Cites a Drive workbook — a different, non-BRD-Notion source, out of this index's scope, not verified here. |
| REPO_EVIDENCE_ONLY | 28 | Says on its own face: "Repository evidence only — not an approved BRD or Drive requirement." |
| DESIGN_ONLY_NO_FUNCTIONAL_SOURCE | 24 | Has an approved Figma design link but explicitly no functional-source citation. |
| EXPERT_JUDGEMENT_ONLY / LEGACY_REFERENCE_ONLY | 7 | Explicitly says "Expert judgement only" or "Legacy Reference only." |
| NOT_YET_EVIDENCED | 1 | Literally says "Not yet evidenced." |
| Excluded (not a functional story) | 1 | INSP-678 — a demo-seed-data engineering ticket. |

Bottom line unchanged: of 118 active stories, 57 (48%) cite an approved source (27 Arabic BRD + 30 Drive workbook) and 61 (52%) do not.

## The 27 ARABIC_BRD_CITED stories, as read from their current Jira descriptions today

| Story | Functional source line (verbatim citation) | Doc | Real UC(s) named |
|---|---|---|---|
| INSP-213 | "BRD - إدارة البنود والأنظمة MIM-V0.2, UC001–UC003" | ITM | UC001, UC002, UC003 (range) |
| INSP-214 | "BRD - إدارة البنود والأنظمة MIM-V0.2, UC001–UC003" | ITM | UC001, UC002, UC003 (range) |
| INSP-215 | "BRD - إدارة النظام MIM-V0.1, UC004" | SYS | UC004 |
| INSP-216 | "BRD - إدارة البنود والأنظمة MIM-V0.2, UC001–UC003" | ITM | UC001, UC002, UC003 (range) |
| INSP-217 | "BRD - المؤشرات والتقارير MIM-V0.1; operational Dashboard/Operations requirements" | KPI | none (doc-level only) |
| INSP-218 | "BRD - المؤشرات والتقارير MIM-V0.1, UC002, BC001–BC003" | KPI | UC002 |
| INSP-219 | "BRD - المؤشرات والتقارير MIM-V0.1, UC001, BC001–BC003" | KPI | UC001 |
| INSP-228 | "BRD - خدمة إدارة الزيارات MIM-V0.1" | VIS | none (doc-level only) |
| INSP-240 | "BRD - خدمة إدارة الزيارات MIM-V0.1" | VIS | none (doc-level only) |
| INSP-241 | "BRD - إدارة النظام MIM-V0.1, UC005" | SYS | UC005 |
| INSP-242 | "BRD - خدمة التفتيش MIM-V0.1, UC001" | INS | UC001 (INS-UC-001) |
| INSP-243 | "BRD - خدمة التفتيش MIM-V0.1, UC001" | INS | UC001 (INS-UC-001) |
| INSP-247 | "BRD - خدمة التفتيش MIM-V0.1, UC002" | INS | UC002 (INS2-UC-001) |
| INSP-248 | "BRD - المستخدم الخارجي MIM-V0.2, UC001 (Service Request)" | EXT | UC001 |
| INSP-249 | "BRD - المستخدم الخارجي MIM-V0.2, UC001 (Service Request)" | EXT | UC001 |
| INSP-250 | "BRD - المستخدم الخارجي MIM-V0.2, UC001 (Service Request)" | EXT | UC001 |
| INSP-251 | "BRD - المستخدم الخارجي MIM-V0.2, UC001 (Service Request)" | EXT | UC001 |
| INSP-252 | "BRD - المستخدم الخارجي MIM-V0.2, UC002 (Branch Manager Decision)" | EXT | UC002 |
| INSP-253 | "BRD - المستخدم الخارجي MIM-V0.2, UC003 (Compliance Manager Decision)" | EXT | UC003 |
| INSP-254 | "BRD - المستخدم الخارجي MIM-V0.2, UC003 (Compliance Manager Decision)" | EXT | UC003 |
| INSP-255 | "BRD - المستخدم الخارجي MIM-V0.2, UC004 (Committee Decision)" | EXT | UC004 |
| INSP-490 | "BRD - خدمة التفتيش MIM-V0.1, UC002, BC001–BC003" | INS | UC002 (INS2-UC-001) |
| INSP-491 | "BRD - خدمة التفتيش MIM-V0.1, UC003, BC001–BC003" | INS | UC003 (INS2-UC-002) |
| INSP-492 | "السجل الصناعي ... V1, UC001, BR001–BR004" | IR | UC001 |
| INSP-493 | "BRD - إدارة المستخدمين MIM-V0.1" | USR | none (doc-level only) |
| INSP-494 | "BRD - المؤشرات والتقارير MIM-V0.1" | KPI | none (doc-level only) |
| INSP-495 | "BRD - إدارة النظام MIM-V0.1" | SYS | none (doc-level only) |

**Note on the INS document's UC numbering:** the BRD's own English/Arabic UC labels are UC001/UC002/UC003 (section 5.1/5.2/5.3 in the source), which `INS.md` maps to the corrected real-structure names INS-UC-001 (Inspection), INS2-UC-001 (Inspection Visit Review), and INS2-UC-002 (Approval of Data Update) respectively — INS2-UC-002 is the one `INS.md` flags as mislabeled "UC001" in the document's own English heading even though it is Arabic UC003; the citing stories (INSP-491) use the Arabic "UC003" number, which `INS.md` already resolved to INS2-UC-002. This index defers to `INS.md`'s resolution rather than re-litigating it.

**Note on range citations:** INSP-213/214/216 all cite the identical range "UC001–UC003" without differentiating which specific one of ITM's three use cases (Add / Approve / Modify) each individual story's acceptance criteria actually covers — the story bodies talk about "packages," "versioning," and "trigger configuration" in language that does not map cleanly one-to-one onto the BRD's own Add/Approve/Modify framing (see flag below). Counted here as: all three ITM UCs are *named* by at least one story, but not as three independently-verified one-to-one matches.

**Flag — citation/content mismatch not resolved here:** INSP-215's functional-source line cites SYS-UC-004 ("Questionnaire Management" — view questionnaire questions, modify weight/percentage per SYS.md), but the story's user journey and acceptance criteria describe configuring "inspection-item response, conditional, and scoring rules" — content that reads like ITM territory (inspection items/scoring), not SYS's questionnaire-weight UC. Reported as a finding, not resolved; this is exactly the kind of AR/EN or cross-document mapping question this pass is instructed not to adjudicate.

## Document-level coverage — rebuilt against the REAL (corrected) use-case lists

| Doc | Real UCs (per 00_MASTER_INDEX.md) | Stories citing this doc | UCs named in a citation | UCs with zero citing story |
|---|---|---|---|---|
| ORD (Request/Order Mgmt) | 2 (UC001 Work Activity Monitoring, UC002 Task Viewing) | **0** | none | **UC001, UC002 — entire document uncited** (unchanged from prior report) |
| USR (User Mgmt) | 3 (UC001 User Account Mgmt, UC002 Branch User Mgmt, UC003 Role–Permission Mapping) | 1 (INSP-493, doc-level only) | none named | UC001, UC002, UC003 — no story names any of them (unchanged) |
| SYS (System Admin) | 6 (UC001 Task Mgmt, UC002 Notification Mgmt, UC003 List Mgmt, UC004 Questionnaire Mgmt, UC005 SLA Mgmt, UC006 Risk Engine Mgmt) | 3 (INSP-215, 241, 495) | UC004, UC005 (subject to the INSP-215 content-mismatch flag above) | UC001 (Task Mgmt), UC002 (Notification Mgmt), UC003 (List Mgmt), UC006 (Risk Engine Mgmt) — unchanged from prior report; SYS's real structure was already accurate before this rebuild |
| **ITM (Items & Regulations)** | **3** (UC001 Add, UC002 Approve, UC003 Modify) — was reported as 16 | 3 (INSP-213, 214, 216 — all cite the same "UC001–UC003" range) | **UC001, UC002, UC003 — all 3 real UCs named** | **none** — **MATERIALLY CHANGED**: old report said 13 of 16 UCs (the entire Approve/Edit flow) were uncited; ITM's real UC space is only 3, and the citing range covers all 3 of them |
| **EXT (External User)** | **4** (UC001 Service Request, UC002 Branch Manager Decision, UC003 Compliance Manager Decision, UC004 Committee Decision) — was reported as 16 | 8 (INSP-248–255) | **UC001, UC002, UC003, UC004 — all 4 real UCs named**, one story per decision path (UC002→252, UC003→253+254, UC004→255) plus 4 stories on UC001 (248–251, one per service type) | **none** — **MATERIALLY CHANGED**: old report said 12 of 16 UCs uncited, "including every decision use case"; the real decision use cases (Branch Manager/Compliance/Committee) are exactly the ones the 8 stories cite |
| **KPI (Indicators & Reports)** | **2** (UC001 Leadership Performance Dashboard, UC002 Regulatory & Operational Reports) — was reported as 19 | 4 (INSP-217, 218, 219, 494) | **UC001 (INSP-219), UC002 (INSP-218) — both real UCs named**; INSP-217/494 are doc-level only | **none** — **MATERIALLY CHANGED**: old report said 17 of 19 UCs uncited; KPI's real UC space is only 2 and both are individually named |
| **INS (Inspection Service)** | **3** (INS-UC-001 Inspection, INS2-UC-001 Inspection Visit Review, INS2-UC-002 Approval of Data Update) — was reported as 7 | 5 (INSP-242, 243, 247, 490, 491) | **INS-UC-001 (242, 243), INS2-UC-001 (247, 490), INS2-UC-002 (491) — all 3 real UCs named** | **none** — **MATERIALLY CHANGED**: old report said the entire supervisor/compliance/committee review chain (INS2-UC-001/002) had no citing story; it turns out INSP-247/490 (review chain) and INSP-491 (data-update approval) already cited exactly that chain under its Arabic UC002/UC003 numbers, which INS.md has now resolved to the real names |
| VIS (Visit Mgmt) | 2 (UC001 Visits Management, UC002 Target Establishments Selection) — was reported as 13 | 2 (INSP-228, 240 — doc-level only) | none named | UC001, UC002 — both uncited at the UC level. **Unchanged in substance** from the prior report (which also found "all uncited at UC level"), though the denominator shrank from 13 to 2 |
| IR (Industrial Registry) | 1 (UC001) | 1 (INSP-492, UC001, BR001–004) | UC001 | none — fully cited (unchanged) |

## What materially changed vs. the prior (stale) report

The prior report's headline finding — "the correction/review/decision chain is the weakest-cited part of the two largest documents… ITM's Approve/Edit flows (13 of 16 UCs) and INS's supervisor/compliance/committee review chain… have no BRD-cited story" — **no longer holds**, once the real UC structures are used instead of the invented ones:

1. **ITM**: was "13 of 16 UCs uncited (the whole Approve/Edit flow)" → is now **3 of 3 UCs named** (Add, Approve, Modify all appear in the "UC001–UC003" citation used by INSP-213/214/216). The apparent gap was an artifact of the old document having invented 13 extra UCs that don't exist in the source.
2. **EXT**: was "12 of 16 UCs uncited, including every decision use case" → is now **4 of 4 UCs named**, and specifically the decision use cases (Branch Manager/Compliance/Committee — exactly what the old report flagged as missing) are the ones with direct one-to-one story citations (252, 253+254, 255).
3. **KPI**: was "17 of 19 UCs uncited" → is now **2 of 2 UCs named** individually (INSP-219→UC001, INSP-218→UC002).
4. **INS**: was "4 of 7 UCs uncited, including the entire supervisor/compliance/committee review chain" → is now **3 of 3 UCs named**, with the review chain (INS2-UC-001, INS2-UC-002) specifically covered by INSP-247/490/491.
5. **VIS**: structurally unchanged in substance (still 0 UCs named at UC level — both citing stories are doc-level only), but the denominator corrected from 13 (mostly-invented sub-screens) down to 2 real UCs.
6. **ORD, USR, SYS, IR**: unaffected by the structural corrections (their UC structures were already accurate) — coverage picture unchanged.

**Caveat on what "named" means here.** Several of the newly-"fully covered" documents (ITM, EXT, KPI, INS) reach 100% UC-citation coverage partly because their real UC counts are now so small (2–4 UCs each) that a modest handful of stories can name all of them — this is a change in the denominator, not proof that each story's acceptance criteria actually implement the full business-rule content of the UC it names. See the business-rule caveat below and the INSP-215 content-mismatch flag above.

## What this does NOT tell you — stated plainly, not estimated

- **Business-rule-level coverage is not calculated.** Of the 1354 individual business rules across all nine documents, this pass did not check which ones a story's acceptance criteria actually satisfies. A story's Functional-source line naming a UC (or a UC range) says nothing about how many of that UC's underlying BRs (which can number from a handful to 173, per ITM) are covered by that story's acceptance criteria. This is a distinct, much larger pass not attempted here, beyond the specific BR citations already visible in a few stories' Functional-source lines (e.g. INSP-248's "EXT-BR-038," INSP-492's "BR001–BR004") — and even those are only the BRs the story names, not a check of whether the story's actual acceptance criteria implement them correctly.
- **The 30 DRIVE_CITED stories are not checked against anything** — their source is a Drive spreadsheet outside this task's nine-document scope.
- **Coverage the other direction — which of the 1354 indexed business rules has no story at all, even indirectly** — is not calculable from doc/UC-level citation alone, for the same reason as before: a REPO_EVIDENCE_ONLY or DESIGN_ONLY story might describe real, requirement-matching behavior without citing it.
- **Whether the story's acceptance criteria genuinely reflect the cited UC's real content is only spot-checked, not exhaustively verified** — the one mismatch found (INSP-215 citing SYS-UC-004 while describing ITM-shaped content) was found by reading the story bodies during this pass; the remaining 26 were checked for citation-text-to-UC-name plausibility, not full BR-by-BR content verification.

## Immediate, calculable findings

1. **ORD (Request/Order Management) still has zero traceable stories.** Nothing in the 118 active INSP stories cites it, under either the old or the corrected structure.
2. **VIS (Visit Management) is still cited twice, at the document level only — no use case is named**, even after the UC list shrank from 13 (mostly invented) down to the 2 real ones.
3. **The "uncited review/decision chain" finding from the prior report is retracted.** ITM's Approve/Modify flow and INS's review-and-decide chain were reported as the weakest-covered parts of the backlog; under the corrected, real UC structures they are both fully named at the UC level. The actual open question is no longer "is this UC named," it's "does the story's acceptance-criteria content match what the named UC's business rules require" — a question this pass explicitly did not attempt to answer (see caveats above), and where at least one live mismatch (INSP-215) was found in passing.
4. **28 stories say outright they were written from the code, plus 7 more that say "expert judgement"/"legacy reference" — 35 of 118 active stories (30%) explicitly admit they are not sourced from a requirement.** Unchanged from the prior report; this finding does not depend on the UC-structure corrections.

Full per-document requirement tables (all 1380 rows across ORD.md, USR.md, SYS.md, ITM.md, EXT.md, KPI.md, INS.md, VIS.md, IR.md) are in this same directory. The raw story classification (129 rows: key, category, summary) remains in `02_jira_insp_story_classification.tsv`, but its summaries are stale labels — this rebuild used each of the 27 ARABIC_BRD_CITED stories' current Jira description, fetched live.

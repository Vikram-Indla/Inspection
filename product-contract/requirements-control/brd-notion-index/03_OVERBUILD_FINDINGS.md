# Over-build findings — capabilities with no requirement behind them

Two independent methods are used to find the same thing: capabilities the platform
built that no requirement document asked for. Sections are labeled by method. Do not
merge the two into one number — they overlap in places and were produced by
different reasoning paths (Jira-story text vs. direct product-route inspection).

---

## Found via product route review

**Method.** Started from `product-contract/governance/TRACEABILITY-MATRIX-20260805.md`
(126 platform routes; 51 "built with no design," 13 "designed but never built," plus
the routes discussed in Groups A/B/C). For each route or logical route-group, searched
all nine BRD-Notion index documents (ORD, USR, SYS, ITM, EXT, KPI, INS, VIS, IR) for any
use case or business rule that could plausibly ground it. This is a check against the
requirement documents directly, independent of whatever a Jira story claims.

**What was checked exhaustively:** the 22 "Group A" administration routes named in the
traceability matrix as built-with-no-design (the same set INSP-753 found unreachable
from navigation), plus 7 of the "Group C" routes the matrix calls "real screens
genuinely needing design" (`/operations/live`, `/profile`, `/ai/suggestions`,
`/evidence-ocr`, `/incident-reports`, `/operations/exceptions`, `/tasks`). That is
29 of the matrix's 126 routes checked one-by-one against full-text search of all nine
documents.

**What was sampled, not exhaustively checked:** the remaining ~97 routes (the bulk of
`/field/*`, `/virtual/*`, `/planning/*`, `/execution/*`, `/reviews/*`, `/compliance/*`,
`/factories/*`, `/analytics/*`, and most of `/admin/*` beyond the 22 Group-A routes) —
these were not individually run against all nine documents in this pass. Their design
coverage is separately addressed by the traceability matrix's Group B/Group C analysis
(duplication and dead-route questions), which is a different question from "does a
requirement exist." No conclusion is drawn about them here.

**What was skipped as out of scope for this exercise:** the 13 "designed but never
built" routes (they are a design-to-platform gap, not a platform-capability-with-no-
requirement question) and anything clearly infrastructure/auth/generic CRUD.

### Findings, grouped by subject

**Task management — GROUNDED.**
`/tasks` (manager-facing board over `workflow_task_assignments`) matches SYS-UC-001
"Task Management" (SYS.md) — reassigning tasks to users, activating/deactivating tasks —
directly, including the RACI actors (Branch Manager, System Administrator Business,
Sector Manager per the Arabic text). `/field/my-tasks` likewise matches the "My Tasks"
screens documented identically across EXT.md (EXT-BR-053/054/055, investor-side) and
INS.md (INS2-BR-041..044, internal-reviewer side).

**Audit / activity logging — GROUNDED (inferred).**
`/admin/audit` is not named as a screen anywhere, but the underlying capability —
"every modification must be recorded in the Audit Log" — is stated repeatedly and
explicitly as its own business rule: SYS-BR-048 (List Management), SYS-BR-079 (Risk
Engine Management), and generally as INS2-BR-031 ("every action taken is logged with
username, date, and comments if any"). A screen surfacing that log is a reasonable
reading of these rules, though no document specifies a dedicated "Audit" screen by
name — flagged as inferred, not a direct textual match.

**Security & access (roles/permissions) — GROUNDED.**
`/admin/security-access` matches USR-UC-003 "Role–Permission Mapping" (admin adds/
removes permissions per role via transfer buttons, USR-BR-067/068/074) and the SYS.md
§4.1.4 permission-matrix rules (SYS-BR-008 through SYS-BR-013) directly.

**Risk engine configuration — GROUNDED.**
`/admin/risk/models` matches SYS-UC-006 "Risk Engine Management" (SYS.md) directly —
viewing risk variables, weights and grades; modifying weight values; the 100%-total
weight-save gate (SYS-BR-082); audit logging on every change (SYS-BR-079).

**Compliance requests / compliance approvals — GROUNDED.**
`/admin/compliance-requests`, `/admin/compliance-requests/[id]`,
`/admin/compliance-requests/new`, and `/admin/compliance-approvals` match EXT-UC-003
"Compliance Manager Decision" and EXT-UC-004 "Committee Decision" (EXT.md) directly —
reviewing Correction Requests, Self-Assessment Requests, and Objection Requests, with
Approve/Reject/Return/Escalate actions and the underlying RACI (EXT-BR-018..020).

**Lists / lookups management — GROUNDED.**
`/admin/planning/lookups` matches SYS-UC-003 "List Management" (SYS.md) directly —
viewing registered menus/lists and editing their options, with the stated exception
that the roles/permissions lists themselves cannot be edited this way (SYS-BR-042).

**Planning — expiry — GROUNDED (inferred).**
`/admin/planning/expiry` has no named admin screen in the documents, but the
underlying business concept — grace-period expiry auto-triggering a Follow-up visit,
with the expiry date auto-calculated by the system (VIS-BR-009, VIS-BR-023, VIS-BR-038)
— is real and central to VIS.md's visit-priority and auto-assignment rules. Flagged as
an inferred match to a genuine BR cluster, not a directly named screen.

**Planning — status — not conclusively grounded either way.** No use case or business
rule was found that names a dedicated "planning status" administration screen as
distinct from ordinary visit/case status fields already covered elsewhere (SYS-BR-006/
007 case statuses, VIS visit-status rules). Time did not permit a deeper pass; treat as
unresolved rather than either GROUNDED or UNGROUNDED.

**Incident reporting — GROUNDED.**
`/incident-reports` matches "Report an Incident" (رصد حادث), a named action button on
the Establishment Dossier (VIS-BR-103), with detailed incident fields in INS.md
(INS2-BR-048 resulting-damages list, INS2-BR-049 conditional Count field) and the
"Incident Evidence Report" minute type (INS-BR-035, INS-BR-063, INS2-BR-061).

---

### Genuinely UNGROUNDED — no rule found anywhere in the nine documents

**Bulk violation issuance.** `/admin/bulk-violations` — the documents describe
violations exclusively as being created through an individual inspection visit
(recorded against a specific facility, specific inspector, specific visit, gated by
facility production status per INS-BR-045/BC021) or auto-generated by specific system
triggers (INS-BR-047/BC023: expired license, status/license-phase mismatch). No rule
anywhere describes an administrator issuing violations in bulk, outside a visit, across
multiple facilities at once. This is a real capability — B3's own release notes confirm
it can now issue real violations end-to-end — with nothing behind it in the requirement
set.

**Device management.** `/admin/devices` — no use case or business rule mentions
managing devices, device registration, or device-level access anywhere in SYS.md,
USR.md, or any other document searched.

**Templates management.** `/admin/templates` — no use case or business rule describes
a template-management capability (form templates, report templates, or otherwise). The
only adjacent hit is a single fixed notification-text format string (SYS-BR-033), which
is a copy requirement, not a templating capability.

**Item runtime preview.** `/admin/items/[id]/runtime-preview` — nothing in ITM.md (173
business rules, fully re-extracted and confirmed) describes previewing how a checklist
item would render or behave at runtime before use. Distinct from the already-known
"inspection-package preview / pre-approval impact review" gap — this is a narrower,
separate over-build on the items/regulations side.

**GIS / spatial administration.** `/admin/gis/spatial` — the documents reference
"Location on Map" only as a single retrieved display field inside the Establishment
Dossier (VIS-BR-104) and city/region classification as a Technical System
Administrator responsibility (VIS-BR-027), but no rule describes a dedicated
spatial/GIS configuration screen.

**AI suggestions.** `/ai/suggestions` — no use case or business rule anywhere in the
nine documents describes an AI/ML-driven suggestion or recommendation engine. The only
adjacent hit is a plain autocomplete dropdown on a search filter (KPI-BR-136), which is
ordinary UI affordance, not the capability this route implies.

**Evidence OCR.** `/evidence-ocr` — no use case or business rule anywhere describes
optical character recognition or automated document/text extraction from evidence. The
document evidence-capture rules that do exist (e.g. INS-BR-016/SF-R02, WebRTC frame
capture from live video with auto-binding to a checklist item) describe manual capture
and manual binding, not OCR.

**Delegation.** `/admin/delegation` — confirms the already-known gap (see below):
no rule in SYS.md, USR.md, VIS.md, or INS.md describes temporary delegation of
execution authority to a substitute without changing ownership.

**Integrations (factory-data, senai-data).** `/admin/integrations/factory-data` and
`/admin/integrations/senai-data` — confirms the already-known gap (see below): no
document describes an integration/endpoint/event/export registry or configuration
screen. The only related content is data being *pulled from* Sanayi by license number
(a runtime data dependency, e.g. INS-BR-040, VIS-BR-042), never a configurable
integration-management surface.

**Operations center / live operations, operations exceptions, execution dashboard.**
`/operations/live`, `/operations/exceptions`, `/admin/operations`, `/admin/execution`
— no use case or business rule describes a live/real-time operations monitoring
dashboard, an "exceptions" management screen, or a distinct execution-management admin
surface, despite a broad search for "operations center," "real-time," "live tracking,"
and "execution management" across SYS.md, VIS.md, KPI.md, and INS.md.

### OUT OF SCOPE / NOT APPLICABLE (skipped, not classified)

`/profile` — a generic self-service account/profile page; no business rule was
expected to or did name this as a distinct capability. Treated as infrastructure
scaffolding, not a business capability, and not pursued further.

### Would be ORD-grounded, but ORD is out of scope

No route among the 29 checked in this pass had its only plausible grounding sitting
exclusively in ORD.md. (ORD.md's content — request/order lifecycle — did not surface as
the sole candidate rule for any of the routes above; where a request/decision workflow
mattered, EXT.md's investor-request use cases were the operative source instead.) If a
later, fuller pass finds a route whose only textual match lives in ORD.md, per
CC-ORD-OUT-OF-SCOPE-20260805 it must be recorded here as "would be ORD-grounded, but
out of scope," not counted as grounded.

---

## Found via Jira story review

**Method.** Read the current Jira description of every story in three buckets:
REPO_EVIDENCE_ONLY (28, most now rewritten with real citations or honest gaps),
DESIGN_ONLY_NO_FUNCTIONAL_SOURCE (24, unbuilt Figma-only intent, explicitly left
untouched), and the EXPERT_JUDGEMENT_ONLY / "Legacy Reference only" set (INSP-180,
181, 198, 226, 244, 245, 246, plus INSP-678 which is internal tooling, not a
capability). For every real capability a story describes, searched all nine BRD
documents for grounding — not just the document the story happens to cite.

**Governing definition:** "over-built" means actually working, shipped behavior with
zero rule anywhere across the 1,354 business rules. An unbuilt Figma-only story is not
over-building — it's unadopted future scope, and its own evidence-status field already
says so. Those are reported separately below, not counted as over-built.

### Genuinely ungrounded (confirms the product-route findings from the Jira side, plus one addition)

- **INSP-41 / INSP-43** — the localization/governed-strings console (browse/search a
  string register; create, revise, publish versioned strings). Every BRD requires
  bilingual UI as a constraint; none describe a tool for managing the strings.
- **INSP-46** — the integration/endpoint/event/export registry. The only
  integration-adjacent line anywhere (IR-BR-015, "linked to central data warehouse")
  names no endpoint, event, or export.
- **INSP-235** — the SENAEI factory-master API mirror with source-provenance display.
  Same single IR-BR-015 line is the only candidate, and it names no external system.
  **This is a fifth genuinely ungrounded capability beyond the four already known.**
- **INSP-244** — delegated execution. The only echo anywhere is a static "Substitute"
  field on a user's HR profile (USR-BR-018/033/034/060/061) — a different mechanism on
  a different record (the person, not the visit); not grounding.
- **INSP-40 (partial)** — the package "preview an inactive version without disturbing
  the active one" and "pre-approval impact review" concepts specifically. The
  surrounding audit-log/version-history behavior is genuinely grounded in ITM.md
  (ITM-BR-037, 093, 123); these two specific product concepts are not, and the story's
  own evidence field already says so.

### Citation-fix findings (not over-building — grounded elsewhere, mis-labeled or mis-cited)

Several stories carrying an "expert judgement only" or "legacy reference only" label
turned out to be grounded once checked against VIS.md and INS.md directly rather than
the document each story happened to cite:

- **INSP-180, 181, 226** (visit draft validation, publish, capacity-based assignment)
  — grounded in VIS-BR-025..030, the capacity/availability/redistribution rule block.
- **INSP-198** (bulk visit changes/cancellations) — grounded in VIS-BR-051, an explicit
  multi-select bulk-cancel rule.
- **INSP-245** (production-status gate on violation creation) — grounded in INS-BR-045
  (BC021), a live, structurally central rule. The story's own evidence field still says
  "Legacy Reference only," which is simply wrong and should be corrected.
- **INSP-246** (linked establishments and eligible services) — grounded in EXT-UC-001's
  own preconditions and eligibility-gating logic (EXT-BR-037/038/041), a close, specific
  match, not a vague echo.
- **INSP-39, 42, 47** (risk configuration, risk-model trace, notification rule
  lifecycle) — each partially grounded in SYS-UC-006 or SYS-UC-002 for the calculation/
  validation/audit-log content, but the "save/publish as a new version" lifecycle
  framing in their acceptance criteria goes beyond what SYS.md actually states. Flagged
  for citation tightening in a later pass, not full over-builds.

Of the seven stories originally flagged as claiming expert judgement or legacy
reference, five now have real grounding and two do not (INSP-244, and INSP-40's
narrow preview/impact-review slice) — that changes what the Product Owner is actually
ruling on for that set.

### Sampled, not exhaustive: the 24 design-only (unbuilt) stories

Several of these turned out to have real, specific matches once checked against INS.md
and EXT.md, despite their own "no functional source" label — INSP-538 (Customs
Exemption), 543 (Safety), 548 (Visit Statement), 558/652 (Summons Notice), 563
(Incident Report), 573 (Sample Collection), 578 (Destruction Report), 588
(establishment status/history mid-visit), 617 (factory identity profile), 628
(penalty/corrective-action history) all name matching report types or fields in
INS.md/EXT.md. **None of these are built yet, so none belong on the over-build list
regardless of grounding** — but if any are built later, their "no functional source"
label should be corrected first rather than carried forward. Two stories in this bucket
had no match found anywhere (INSP-640 voice-note capture, INSP-646 map task-card status)
— these would become genuine over-builds if built without correcting the label first.
This was a keyword-sampling pass across the 24, not a rule-by-rule check of all 1,354
business rules against each story.

---

## KPI permissions matrix — confirmed blank

KPI.md §4.1.4 "مصفوفة الصلاحيات" (Permissions Matrix) — confirmed by direct reading
(KPI-BR-008, KPI.md line 29) to define 4 user-role column headers (Branch Manager /
Sector Manager / Officer (المسؤول) / Committee) with **no permission values (P/N)
filled in for any row**. This is not a modeling gap this index introduced — the source
document's table has header rows only, exactly like the parallel blank tables for
services (KPI-BR-006) and statuses (KPI-BR-007) in the same document.

**What this means, stated plainly:** "which role may see which dashboard or report" was
never specified anywhere in the source BRD. Whatever role-gating exists on the KPI/
reports/dashboards routes today was invented downstream (in Jira stories, in code, or
in both) — it does not trace back to a governed value. This is a genuine documentation
gap, not something this exercise guesses at or fills in. No permission values are
proposed here.

## B3 baseline consolidation — no additional over-build found

`product-contract/governance/BASELINE-B3-20260805.md` and
`FIGMA-BASELINE-B3-20260805.md` were read in full. B3's own "Capabilities built with no
requirement behind them" section lists exactly the same four items already known before
this task started:

- Localization and governed strings
- The integration and endpoint registry
- Delegated execution (inspector temporarily handing execution to a substitute)
- Package preview and pre-approval impact review

B3 is a consolidation commit (lanes merged onto one verified tag), not a source of new
functionality; nothing in either B3 document names a fifth capability or contradicts
the four already known. The two route-review findings above that touch the same ground
(`/admin/delegation`, `/admin/integrations/*`) independently confirm B3's list rather
than adding to it. B3 does surface one adjacent, narrower fact worth carrying forward:
it also states that **"Sixty-seven permission rules still refuse everybody"** — write
rules with no Product Owner ruling yet — which is a distinct, already-tracked item, not
a new capability-with-no-requirement finding.

---

## Standing notes carried over from method

- No requirement was invented to fill any gap found above; absent stays absent.
- Every "GROUNDED (inferred)" label above means the match is a reasonable reading of a
  business-rule cluster, not a direct textual citation of a named screen — flagged as
  such deliberately.
- AR/EN contradictions encountered while searching (e.g. SYS.md's Task Management
  Sector-Manager omission, EXT.md's UC004 copy-paste residue) are not resolved here;
  they were already logged in each document's own header notes and in
  `00_MASTER_INDEX.md`.
- No percentage or count-based estimate of "how many of the 126 routes are ungrounded"
  is given. 29 of 126 were checked one-by-one in this pass; the other ~97 were not, and
  no rate is extrapolated from the 29.

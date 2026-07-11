# Document Control

| Field | Value |
|---|---|
| Artifact | FABLE_UNDERSTANDING_REPORT.md |
| Status | PASS_WITH_NAMED_QUESTIONS (provisional, human-graded 2026-07-11) — resubmitted for final review |
| Companions | FABLE_UNDERSTANDING_TRACEABILITY.csv (493 rows) · FABLE_ACCEPTANCE_UNDERSTANDING.csv (493 rows) · FABLE_OPEN_QUESTIONS.yaml · FABLE_CHANNEL_READINESS.md · FABLE_TECHNICAL_DESIGN_IMPACT.md |
| Binding exclusions | **Mobbin is excluded** (no Mobbin MCP, no Mobbin reference used). **Historical archives are provenance only.** **Meta-Astryx pack is design direction only, not approved design authority (G6 not passed).** **Unresolved decisions DEC-001..010 / OD-01..08 may not be invented or resolved by the agent.** |
| Design status | No Astryx artifact, token page, component or product screen has been created. |

# MIM Inspection Platform MVP1 — Fable Understanding Report

**Purpose of this document:** prove complete understanding of the project before any design begins. No screen design has been started. Mobbin was not used.
**Date:** 2026-07-11
**Authority order applied:** (1) reconciled repository `product-contract/` + `docs/` + `CLAUDE.md`; (2) historical archives in `MIM_Inspection_MVP1_Historical_Archives_v3/` for completeness/provenance only; (3) `MIM_Inspection_Meta_Astryx_Fable_Pack/` for design direction only.

---

## 1. Product purpose, business outcomes and MVP1 boundaries

**Client / program:** Ministry of Industry and Mineral Resources (MIM), KSA — factory inspection platform. *(archive: `final_pack/MIM_Inspection_MVP1_BRD_Enhanced_Final.pdf` cover + §1 "Document Control and Source Baseline")*

**Product definition:** "MVP1 is an end-to-end inspection operations platform that enables compliance administrators to configure inspection content, planners to create and manage visits, inspectors to prepare and execute physical or virtual inspections, Level 2 reviewers to decide and control resubmissions, and operational users to monitor factories, visits, inspectors, SLA, risk, alerts and exceptions." *(BRD §3)*

**Business outcomes / success criteria** *(BRD §3.1–3.2)*:
- All 478 spreadsheet baseline requirements implemented or explicitly mapped without loss of meaning.
- Every critical business transition permission-controlled, validated, auditable.
- Physical field execution usable offline with resilient synchronization.
- Submitted content, reviewer decisions and version history protected from silent overwrite.
- Same business object traceable planning → execution → review → Factory 360 → operational reporting.
- UAT traces each baseline requirement to acceptance criteria, test evidence and sign-off.

**MVP1 boundary** *(repo: `product-contract/domain/scope_boundary.yaml`)*:
- MVP1 = all 478 customer/auditor spreadsheet rows (mandatory non-regression baseline) across 9 modules M01–M09, plus **MVP1 Foundation**: identity/RBAC, audit, notifications, versioning, data integrity, offline recovery, GIS controls; risk calculation "sufficient for approved targeting and visibility — not the advanced Risk Studio"; workflow config "sufficient for MVP1 states — not the visual Workflow Studio"; package/form config "not a general-purpose no-code platform"; operational Factory 360/Operations Center "not national strategic executive intelligence".
- MVP2 (deferred): Advanced Risk Studio/simulation/AI recommendations; Advanced Workflow Studio; general no-code Form Builder; formal objection/appeal + committee decisioning; external self-service portal, correction/re-inspection programme, advanced national dashboards. Expanded to 20 MVP2 families MVP2-001..020 *(archive workbook sheet "05 MVP2 Deferred"; BRD §18)*.
- 8 of the 478 rows are classified "MVP1 Core + MVP2 AI Sub-capability" (MVP1-M01-002..006, -008, -009, -010): the parent requirement stays MVP1; only the named Phase-2 AI sub-capability (recommendations, ranking, AI summaries) defers *(repo: `domain/atomic_scope.csv`; rule restated in `CLAUDE.md` "A Phase 2 AI note defers only that AI sub-capability, never its parent requirement")*.
- 15 foundation requirements MVP1-FND-001..015 added from the strategic BRD only as implementation-safety gap fillers *(archive workbook sheet "03 MVP1 Foundations"; BRD §8)*.
- Delivery rule: "100% spreadsheet non-regression; strategic deltas are either essential MVP1 foundations or explicit MVP2 deferrals" *(BRD §1; governing rules R1–R5 in workbook sheet "06 Source Register")*.

---

## 2. Complete inspection lifecycle

Canonical, frozen at G2 *(repo: `product-contract/business/master_end_to_end_process.md`; machine form `domain/process_catalog.yaml`; diagram `business/master_end_to_end_process.mmd`)*. 13 phases; P06A/P06B are alternate branches converging at P07; P10 Return loops through P11 back to P10.

| Phase | Title | Owner | Channel | Modules | State intent |
|---|---|---|---|---|---|
| P00 | Pre-Day-0 Configuration | Compliance Admin | Admin | M09 | Draft → Validated → Approved → Published → Locked |
| P01 | Targeting & Planning Method | Planner | Web | M01 | Initiated → Criteria Built → Targets Retrieved → Targets Selected |
| P02 | Visit Design & Assignment | Planner | Web | M01 | Targets Selected → Configured → Assigned → Ready to Publish |
| P03 | Publish & Operational Management | Planner/Ops | Web | M01/M02/M08 | Ready to Publish → Published → Active / Returned / Cancelled / Expired |
| P04 | Inspector Startup Pack | Inspector | iPad | M03 | Assigned → Preparing → Ready / Returned |
| P05 | Execution Mode Gate | Inspector/System | iPad/Virtual | M03/M04/M05 | Ready → Physical / Virtual / Blocked |
| P06A | Physical Journey & Check-In | Inspector/Ops | iPad+Ops | M04/M08 | Ready → On Journey → Arrived → Checked-In → Start Allowed |
| P06B | Virtual Session & Verification | Inspector/Factory Rep | Virtual | M05 | Scheduled → Waiting → Joined → Verified → In Progress |
| P07 | Inspection Execution | Inspector | iPad/Virtual | M04/M05/M09 | Start Allowed → In Progress → Ready for Validation |
| P08 | Evidence, Findings, Violations & Actions | Inspector/System | iPad/Virtual | M04/M05/M09 | Observation → Evidence Linked → Finding → Violation/Action |
| P09 | Submission & Immutable Version | Inspector/System | iPad/Virtual | M04/M05 | Ready for Validation → Validated → Submitted → Locked |
| P10 | Level 2 Review & Decision | Reviewer | Web | M06 | Submitted → Under Review → Approved / Returned / Rejected |
| P11 | Return, Correction & Resubmission | Inspector/Reviewer | iPad+Web | M06 | Returned → Correction In Progress → Resubmitted → Under Review |
| P12 | Factory 360 & Operations Update | System/Ops/Leadership | Web+Ops | M07/M08 | Reviewed Outcome → Historical/Operational Update |

Each phase carries authoritative business events, outputs, engines and failure controls in the same file (e.g., P03 "Partial publish prohibited; Cancellation requires reason; Automatic expiry must be rule-driven; Bulk action reports per-row failures"). The BRD's business-level restatement is the 11-stage "End-to-End MVP1 Journey" *(BRD §6)* — same lifecycle, coarser granularity.

Canonical state-domain separation (never conflate): Visit Planning Status; Physical Operational State (New → Prepared → On the Way → Arrived → Executing → Submitted); Inspection Review Status; Virtual Session State; Package/Sync State *(BRD §9; repo FND rule MVP1-FND-002)*.

---

## 3. Personas, permissions, data scope

**8 human personas** *(repo: `domain/personas.yaml`)*: Compliance Admin (Admin Portal), Planner (Web), Inspector (iPad/Virtual), Factory Representative (Factory/Virtual), Level 2 Reviewer (Web), Operations Officer (Ops Center), Leadership User (Dashboards), System Services (all channels). BRD §4 adds Auditor (Web/Audit Views) and lists System explicitly — 10 rows in its persona table.

**11 configured roles** *(repo: `domain/reference_data.csv` REF-015)*: Compliance Admin; Form Admin; Workflow Admin; Risk Owner; GIS Admin; Security Admin; Planner; Inspector; Reviewer; Operations; Auditor; Leadership (list as written).

**14 RBAC contracts** *(repo: `domain/rbac_matrix.csv` RBAC-001..014)* — every row = object capability × role × channel × allowed actions × data scope × restrictions. Load-bearing rules:
- RBAC-001 Regulations: maker-checker; cannot edit published version.
- RBAC-002 Packages/Forms: Form Admin cannot publish own draft where segregation enabled.
- RBAC-003 Workflow: no direct runtime state mutation.
- RBAC-004 Risk: weights/formula blocked until approved decision (DEC-001).
- RBAC-006 Security Admin: cannot grant beyond own administrative authority.
- RBAC-007 Planner: assigned organizational scope; no execution/review decision.
- RBAC-008 Operations: region/branch scope; cannot alter submitted inspection.
- RBAC-009/010 Inspector: own assignments only; own active inspection; submitted version immutable.
- RBAC-011 Reviewer: assigned review queue; cannot edit inspector content.
- RBAC-012 Auditor: view only / export where permitted; no mutation.
- RBAC-013 Leadership: authorized geography/organization; sensitive details may be masked.
- RBAC-014 Factory Representative: own appointment/session only; no internal review/admin data; scope marked "MVP1 boundary decision" (→ DEC-005/OD-07).

Data-scope specifics: inspector live location visible only during active journey/execution and per policy (MVP1-FND-009; Web spec row MVP1-M08-004); Factory 360 sections role-controlled (MVP1-M07-019); Ops region/branch filtering (MVP1-M08-010, -018).

---

## 4. Channels

Five channel contracts *(archive workbook sheet "08 Channel Scope Contract" CH-ADM/CH-WEB/CH-IPAD/CH-VIR/CH-OPS; repo G5 doc §2 counts Operations Center as a Web surface, giving "4 channels + Ops")*:

- **Admin Portal (CH-ADM)** — M09, 30 rows. Compliance configuration control planes: regulations, items, violations, penalties, evidence rules, packages, workflow, risk, GIS, notifications/SLA, roles. "Admin engines are control planes, not simple CRUD screens" *(repo `CLAUDE.md` Design policy; `.claude/rules/admin.md`)*.
- **Web Portal (CH-WEB)** — M01+M02+M06+M07+M08 = 190 rows: planning, visit management, Level 2 review, Factory 360, Operations views *(archive `final_pack/MIM_Inspection_MVP1_Web_Portal_Functional_Specification.pdf` §1)*.
- **iPad / Inspector Workspace (CH-IPAD)** — M03+M04 = 238 rows: pre-start, offline package, journey/geofence, execution, evidence, submission, returned correction. "The iPad is a field application, not a reduced web portal" *(repo `CLAUDE.md`; `.claude/rules/ipad.md`; archive iPad spec §8)*.
- **Virtual Session (CH-VIR)** — M05, 20 rows: appointment, waiting room, join, identity/OTP, readiness, remote execution, closure/handoff. "Generic video-call mockup is prohibited" *(archive Fable Build Contract §6)*.
- **Operations Center (CH-OPS)** — M08, 19 rows: command dashboard, live map, visit/inspector monitoring, SLA, risk, alerts, overrides, tracking history, fault isolation.

---

## 5. Modules and dependencies

**9 modules, 478 rows** *(repo: `domain/atomic_scope.csv`; archive workbook "02 Module Breakdown")*:

| Module | Name | Rows | Channel |
|---|---|---|---|
| M01 | Visit Planning – Planning | 52 | Web |
| M02 | Visit Planning – Management | 46 | Web |
| M03 | Inspection Execution – Pre-Start | 15 | Inspector Workspace / Web |
| M04 | Physical Inspection Execution | 223 | Inspector Workspace / iPad |
| M05 | Virtual Inspection Execution | 20 | Web / Virtual Session |
| M06 | Level 2 Review & Resubmission | 53 | Web |
| M07 | Factory 360 | 20 | Web |
| M08 | Operations Center | 19 | Ops / Web |
| M09 | Compliance Configuration | 30 | Admin |

**Dependency spine:** M09 publishes versioned configuration consumed by everything (P00 outputs; ERR-PUB-001 blocks publish of plans without a published package). M01→M02 (plans/visits managed after publish). M01/M02→M03 (assignments feed pre-start). M03→M04 or M05 via P05 mode gate. M04/M05→M06 (immutable submission to review). M06→M04/M05 (return loop, selective unlock). M04/M05/M06→M07 (Factory 360 history) and →M08 (live operational state). Cross-cutting engines ENG-03 (workflow), ENG-10 (offline), ENG-11 (notification/SLA), ENG-12 (audit) serve all modules *(repo G5 doc §5 "Cross-cutting — build once, used everywhere")*. Factory master data flows from **Senaei** source systems into planning and Factory 360 *(archive Web spec rows MVP1-M07-002 "Data source is Senaei unless updated through approved future flow"; MVP1-FND-013)*.

---

## 6. Core domain objects and version relationships

**18 business objects** *(BRD §11)*: Visit Plan; Visit; Inspection Package; Journey Session; Arrival/Check-In Event; Virtual Session; Inspection; Inspection Report/Checklist Response; Evidence Record; Violation; Penalty; Action Form; Submission Version; Review Decision; Factory 360 Profile; Audit/Timeline Event; Notification/SLA Item; Regulation/Inspection Item/Package Version.

**60 canonical fields** across Factory, Visit Plan, Visit, Assignment, Package, Journey, Geo Event, Inspection, Checklist Response, Evidence, Finding, Violation, Penalty, Action, Submission Version, Review *(repo: `domain/field_dictionary.csv` FLD-FACT-001..FLD-REV-004)* — each with type, required/conditional, source of truth, editable-by, visibility, validation, audit/versioning, offline behavior, sensitivity.

**Version relationships:**
- Configuration: published regulation/package/workflow/risk/GIS/penalty-mapping versions are immutable once consumed; changes create new effective versions (FLD-PKG-002; FLD-PEN-001; ENG-01/02/03 versioning rules in workbook "09 Engine Register"; Admin spec §5).
- Inspection consumes one exact package version, frozen at download (FLD-INS-003; iPad spec row MVP1-M04-005 "Package version is frozen after download").
- Submission: `submission_version_id` + sequential `version_number` ≥1 unique per inspection (FLD-SUB-001/002); every resubmission = Version N+1, prior versions preserved (STM-COR-002; BRD §10 invariants).
- Review decision + reviewer comments immutable (FLD-REV-002/003; STM-REV-002..004).
- Risk score reproducible from stored inputs + formula version (ENG-04 versioning rule; EV-004).
- Factory official coordinates vs planner-adjusted vs field-observed stored with distinct provenance, never overwritten (MVP1-FND-007; Web spec MVP1-M01-038; iPad spec §5 GIS contract).

**23 canonical state transitions, 9 state machines** *(repo: `domain/state_transitions.csv` STM-PLAN-001..STM-SYNC-002)* — each with actor, guard, side effects, notification/SLA, audit. (The archive workbook's earlier 19-transition contract, sheet "11 State Transition Contract", is superseded by the repo's 23.)

---

## 7. Approved user journeys and storyboards

**Canonical journeys:** the 13-phase P00–P12 process (repo, §2 above) is *the* approved end-to-end journey; the BRD renders it as an 11-stage journey *(BRD §6)*; channel functional specs decompose it into step-tables keyed to storyboards: Admin journeys SB03/SB13/SB18/SB20 *(Admin spec §4)*; Web journeys SB04/SB05/SB10/SB11/SB12/SB17/SB19 *(Web spec §3)*; iPad journeys SB06/SB07/SB08/SB14/SB15/SB16/SB17/SB19 *(iPad spec §3)*; Virtual journey SB09.

**20 implementation storyboards** (each an implementation contract, not inspiration; each maps requirement counts and non-regression rules) *(archive: `final_pack/MIM_Inspection_MVP1_Native_Storyboard_Book_20_Pages.pdf`, all 20 pages read; index in workbook sheets "04 Storyboard Index" and "10 Screen Contract"; BRD §15)*:

SB01 Executive end-to-end (478 reqs) · SB02 Persona Atlas (81) · SB03 Compliance Config Admin (30) · SB04 Planning Methods/Targeting/Publishing (52) · SB05 Management Workspace (46) · SB06 Inspector Pre-Start (15) · SB07 Physical Start Journey (32) · SB08 Execution Workspace (191) · SB09 Virtual Execution (20) · SB10 Level 2 Review/Version Control (53) · SB11 Factory 360 (20) · SB12 Operations Center (19) · SB13 Compliance Runtime Semantics (16) · SB14 Journey Telemetry/Exception (36) · SB15 Evidence/Violations/Penalties/Actions (54) · SB16 Submission/Locking/Version (26) · SB17 Returned Correction/Comparison (16) · SB18 Admin IA (30) · SB19 Web+Inspector IA (428) · SB20 Architecture/Integrations/Security Blueprint (478).

AC-to-storyboard mapping is recorded per acceptance row (column "Storyboard", values SB04, SB05, SB06, SB07/SB14, SB08, SB08/SB15, SB09, SB10, SB10/SB17, SB11, SB12, SB16, SB03/SB13/SB18) *(archive workbook sheet "07 Acceptance Contract")*.

**Business/investor storyboard pack (secondary, presentation-only):** pages 01,02,03,05,06,07,08,09,10 exist; **page 04 was never generated**; pack requires MVP1/MVP2 reconciliation before any implementation authority (it currently shows objection/appeal and executive dashboards that are MVP2) *(archive: `06_BUSINESS_INVESTOR_STORYBOARDS/README_CURRENT_STATUS.md`)*.

---

## 8. Frontend requirements per channel

**38 canonical screens/routes** *(repo: `product-contract/screens/screen_route_catalogue.csv`, SCR-ADM/WEB/IPAD/VIR; G3 report evidence line "38 canonical screens/routes")*: Admin 14 (`/admin` … `/admin/access`), Web 13 (`/planning*`, `/visits*`, `/reviews*`, `/factories/:id/360`, `/operations`), iPad 8 (`/ipad/assignments` … `/ipad/returned/:id`), Virtual 3 (`/virtual/appointments/:id`, `/virtual/sessions/:id/verify`, `/virtual/sessions/:id`). Every row specifies personas, purpose, process link (G2-Pnn), source modules, mandatory regions, primary actions, states and permission rule.

- **Admin:** control-plane patterns — left hierarchy/tree, central editor/canvas, right inspector/validation panel, persistent draft/published state, impact warnings; never "a plain table plus edit modal"; dangerous publish actions must expose dependencies/affected runtime objects *(Admin spec §7; screen rows SCR-ADM-031 Package & Form Designer, SCR-ADM-051 Workflow Designer with simulation, guard builder, unreachable-state failures)*.
- **Web:** dense enterprise workspaces — tables, filters, saved views, bulk-action bar with per-row failure reporting, split map/list synchronization, timelines, version comparison; three planning methods visually distinct; review keeps submitted content unmistakably read-only; Factory 360 behaves as entity dossier; Ops Center survives single-widget failure and distinguishes live/stale/delayed data *(Web spec §7; SCR-WEB-200/310/320/400/500)*.
- **iPad:** field-first — large touch targets, daylight contrast, minimal navigation depth, persistent offline/autosave/GPS/network status, progressive sections, unmistakable mandatory vs optional, blockers shown before final submit, deliberate portrait+landscape *(iPad spec §8; SCR-IPAD-600..670)*.
- **Virtual:** appointment, waiting room, identity/OTP with retries and escalation, readiness, evidence capture, fallback-to-physical path — "not generic conferencing UI" *(SCR-VIR-700..720; UIUX authority §5 archetype "Virtual inspection")*.
- **Mandatory screen states (all channels):** loading, empty, populated, validation failure, unauthorized, read-only/immutable, stale data, degraded service, offline, syncing, conflict, success confirmation *(Meta-Astryx pack `00_DESIGN_SYSTEM_DECISION.md` "Non-negotiable states"; consistent with per-screen `states` column in the screen catalogue and `.claude/rules/web.md`)*.
- **Design direction (authority level 3, pre-G6):** MIM Astryx — Meta-inspired enterprise system; Inter / IBM Plex Sans Arabic; primary Astryx Cobalt `#0866FF` (token source); 4px spacing base; radii 8/12/16; desktop controls 40–44px; iPad targets ≥48px; tabular numerals for KPIs/coordinates/timers; component library (core + enterprise incl. workflow canvas, rule builder, evidence gallery, conflict resolver, offline/sync indicator, immutable banner) built before screens; six golden screens then end-to-end prototype; three-approval sequence *(Meta-Astryx pack: `00_DESIGN_SYSTEM_DECISION.md`, `01_FABLE_MASTER_EXECUTION_PROMPT.md` §3–6, `02_APPROVAL_SEQUENCE.md`)*. Figma tokens/golden screens become authoritative only after G6 approval *(repo `CLAUDE.md` Design policy; `product-contract/design/DESIGN_AUTHORITY_STATUS.md`)*.

---

## 9. Backend engines, APIs, data, workflow, audit, versioning

**12 engines ENG-01..12** *(repo: `domain/personas.yaml` system_personas; expanded operating model in archive workbook "09 Engine Register" and Admin/Web/iPad spec §"Engine and service dependencies")*:

| ID | Engine | Mandatory behavior (contract) | Forbidden shortcut |
|---|---|---|---|
| ENG-01 | Regulatory & Compliance | published rules & item semantics, versioned | hard-coded checklist detached from admin config |
| ENG-02 | Form & Package | versioned packages, sections, conditional logic, action-form triggers | static forms coded screen-by-screen |
| ENG-03 | Workflow | states, transitions, actors, guards, side effects, SLA | hard-coded status chips called a workflow engine |
| ENG-04 | Risk Foundation | reproducible score, band, drivers, version (values = DEC-001) | decorative risk gauge with no reproducible logic |
| ENG-05 | Assignment | auto/manual, availability/capacity, conflicts, override traceability | random assignment or manual dropdown only |
| ENG-06 | GIS/Geofence/Telemetry | official vs observed location, geofence, accuracy, ETA, override | map widget without governed location events |
| ENG-07 | Evidence & Media | capture rules, metadata, hashing/identity, item linkage, chain of custody | loose file upload without item linkage |
| ENG-08 | Violation & Penalty | configured mappings consumed at runtime, versioned | manual typing disconnected from configured rules |
| ENG-09 | Review & Version | immutable versions, selective unlock, comparison, immutable comments | editing original submitted version in place |
| ENG-10 | Offline Sync | encrypted package, autosave, recovery, idempotent retry, explicit conflict | offline badge without real local persistence |
| ENG-11 | Notification & SLA | events, recipients, templates, timers, escalation | hard-coded toasts without event/recipient governance |
| ENG-12 | Audit & Traceability | immutable actor/time/before-after/version trail + requirement IDs | marking complete without reproducible evidence |

**Acceptance proof per engine** = full chain: draft config → validation → publish/version → runtime resolves published version → behavior changes → audit shows exact version. "A plain CRUD list disconnected from runtime behavior is a P0 failure." *(Admin spec §5)*

**APIs:** no API/event contract exists yet. The repo has 38 *specified* routes, zero handlers; API/data contracts are explicit remaining closure work *(repo `docs/G5_ARCHITECTURE_AND_READINESS.md` §1, §14; archive `00_START_HERE/CURRENT_STATUS_AND_KNOWN_GAPS.md` gap #10)*. Do not invent one.

**Data:** 60 fields + 15 reference/master-data domains (REF-001..015: planning method, execution mode, visit/inspection status, priority, risk band, evidence type, violation level, cancellation/return/GPS-override/unable-to-execute reasons, review decision, notification events, roles) *(repo: `domain/reference_data.csv`)*. Master data centrally governed, versioned, never duplicated as per-screen lists (MVP1-FND-010).

**Workflow:** all status changes only via canonical transitions + guards (repo `CLAUDE.md` hard rule; STM-* rows; regression rule "No direct database status mutation may bypass transition guards", workbook sheet 11 row 1).

**Audit:** every create/update/assignment/publish/return/cancel/check-in/evidence/submission/review/version event records actor, timestamp, object, old/new state, context; users cannot edit or delete audit records (MVP1-FND-003; BRD §13; FLD audit columns).

**Versioning:** see §6. Additional: notification rule/template versions retained for audit (ENG-11 versioning rule); geofence/config version retained with each material geo event (ENG-06).

---

## 10. Integration requirements

All integrations are decision-gated; none is wired; provider abstraction only; "an unavailable integration may not be replaced by a permanent mock and called complete" *(repo `CLAUDE.md`; G5 doc §10)*:

| Integration | Engine | Blocking decision | Source |
|---|---|---|---|
| GIS / maps / navigation provider + licensing | ENG-06 | DEC-008, DEC-002 | `governance/decision_register.csv`; G5 §10 |
| GPS accuracy / arrival radius / geofence policy / telemetry frequency / route deviation / retention | ENG-06 | DEC-002 / OD-03 | decision register; `OPEN_DECISIONS_G2.yaml` |
| Media/evidence storage: formats, sizes, video limits, retention, malware scanning, redaction, hash | ENG-07 | DEC-006 / OD-06 | decision register; FLD-EVD-006 (`content_hash` = "MVP1 decision") |
| Video/media server for virtual sessions | ENG-07 (M05) | provider TBD; boundary DEC-005 / OD-07 | G5 §10 |
| OTP / SMS / identity verification: provider, retries, expiry, fallback | ENG-11/ENG-06 | DEC-007 / OD-05 | decision register; ERR-VIR-001 (provider-down handling: retry/reschedule/escalate, never bypass) |
| Notifications (SMS/email/push) + SLA calendar, escalation ladder | ENG-11 | DEC-003 / OD-04 | decision register; REF-014 event catalogue |
| Digital acknowledgement / signature / PKI | ENG-09 | DEC-009 | decision register; safe interim = "support acknowledgement/refusal; advanced PKI not implied"; enterprise PKI = MVP2-011 |
| Risk engine model (factors, weights, formula, thresholds) | ENG-04 | DEC-001 / OD-02 | decision register |
| External data sources: factory master / licence / CR / products (Senaei and related repositories), with source + freshness indication | Factory master service | MVP1-FND-013 | BRD §12; Web spec M07 rows |
| Offline sync backend | ENG-10 | stack, DEC-010 | G5 §3, §10 |
| Live backend environment | — | Supabase project `iiozvqntawxfwbgffzqu` LIVE (auth health 200); schema discovery BLOCKED pending secret key/PAT; connected Supabase MCP is bound to unrelated production project (Catalyst) — do not touch | `CURRENT_STATE.md`; `MANIFEST.json`; G5 §12 |

---

## 11. Offline package, autosave, outbox, retry, idempotency, conflict

*(Sources: repo `state_transitions.csv` STM-SYNC-001/002; `error_catalogue.csv` ERR-OFF-001/002, ERR-PKG-001, ERR-SUB-002; MVP1-FND-005/006; archive iPad spec §4 "Offline, recovery and sync contract"; `.claude/rules/ipad.md`)*

- **Package:** downloaded packages version-locked, checksum-validated, encrypted, cached locally; must be available locally before journey/inspection start; integrity failure → quarantine and re-download, no open (ERR-PKG-001); corrupted package cannot continue (iPad spec rule).
- **Autosave:** every field edit autosaves locally with explicit sync state; crash/restart recovers last durable local draft without data loss.
- **Outbox/queue:** offline operations queue; reconnect replays queued operations **idempotently** — retries must not duplicate evidence, findings, violations, notifications or submissions (STM-SYNC-001 guard "Idempotency and server validation — apply operations once").
- **Idempotency:** ambiguous submit retry uses idempotency key; returns existing result if already completed; no duplicate submission/version (ERR-SUB-002; MVP1-FND-006 covers publish, assignment, journey start, check-in, submission, review decision, resubmission).
- **Conflict:** server/local divergence creates an explicit conflict record and resolution path; **silent overwrite prohibited** (STM-SYNC-002; ERR-OFF-002; repo `CLAUDE.md` hard rule).
- **Visibility:** inspector must always distinguish offline / pending sync / syncing / synced / conflict / failed states; UI never claims full submission while mandatory artifacts remain unsynced (iPad spec §4).
- **Evidence offline:** offline-captured evidence retains local identity/metadata until durable server confirmation; content hash calculated after sync where enabled (FLD-EVD-006 offline column).

---

## 12. Security, RBAC, immutable records, audit, evidence

- **RBAC:** least privilege on every screen/action/data scope (MVP1-FND-001; BRD §13); 14 RBAC contracts (§3); maker-checker and segregation of duties on all publish flows (G5 §8); unauthorized action → deny with safe message, no mutation, security audit (ERR-AUTH-001).
- **Immutable records:** submitted inspection versions, published configuration, reviewer decisions/comments, audit records, geo/check-in events — never edited in place (repo `CLAUDE.md` hard rules; FLD immutability columns; BRD §10 invariants; Zero-Regression Contract "Version regression" class).
- **Audit:** cross-module immutable audit/timeline service; every critical action traceable end-to-end; audit events carry source requirement IDs and configuration versions (MVP1-FND-003; ENG-12).
- **Evidence rules:** evidence must be linked to exact item/finding/action within same inspection (FLD-EVD-003/004; P08 failure control "Loose/unlinked evidence rejected"); trusted capture timestamp immutable (FLD-EVD-005); chain of custody from capture through submitted version to reviewer decision (MVP1-FND-008; EV-007); required evidence blocks completion/submission; file type/size/permission failures rejected with policy details, no false evidence records (ERR-EVD-001/002); secure file handling: type/size limits, malware scanning where available, access checks, storage encryption, audit (MVP1-FND-014).
- **Location privacy:** live inspector location only during authorized active journey/execution; retention/visibility policy-controlled (MVP1-FND-009; DEC-002 retention values open).
- **Secrets:** no keys/tokens/customer production data in Git; `.env` ignored; a dashboard credential pasted in an earlier chat was discarded and must be rotated *(repo `docs/SECURITY_AND_SECRETS.md`; G5 §12)*.

---

## 13. Performance, availability, accessibility, Arabic/RTL, responsive, degraded service

- **NFR targets are OPEN (DEC-010/OD-08):** availability, response times, concurrency, RTO/RPO, package sizes undecided; they gate stack choice and G8 *(decision register DEC-010; G5 §11)*. Qualitative NFR domains defined in BRD §14: availability, performance, offline continuity, data integrity, auditability, security, privacy, usability/readability, accessibility, observability, recoverability, scalability.
- **Accessibility/readability:** no critical information requiring zoom; no color-only status cues; readable typography, touch-safe targets; keyboard-accessible web patterns where applicable (MVP1-FND-011; BRD §14; UIUX acceptance checklist "No tiny text, clipping…").
- **Arabic/RTL:** MVP1 scope (English-only vs bilingual vs selected surfaces) is **undecided — DEC-004/OD-01**, required by G6 design freeze; do not assume. Design direction prepares for it: IBM Plex Sans Arabic, native RTL via logical layout and mirrored directional behavior, RTL variants for representative complex screens *(Meta-Astryx pack)*. Full bilingual authoring/translation tooling = MVP2-016.
- **Responsive:** web/admin legible at standard enterprise resolutions; desktop, laptop, tablet layouts; iPad portrait+landscape deliberate; "desktop pages compressed into an iPad viewport" is a design exclusion *(MVP1-FND-011; Meta-Astryx pack; iPad spec §8)*.
- **Degraded service / fault isolation:** one failed widget/data source must not break Operations Center, Factory 360 or composite dashboards; failed widget shows local error/retry; stale data never presented as live (MVP1-FND-012; ERR-OPS-001; MVP1-M08-019; P12 failure controls).

---

## 14. Acceptance-criteria families

**a) 478-row acceptance contract (AC-0001..AC-0478, 1:1 with requirements)** *(archive workbook sheet "07 Acceptance Contract")*. Every row defines exactly the demanded anatomy:
- **Input:** Preconditions (dependencies, e.g. "User Authentication, Role & Permission Management") + User Action/Trigger.
- **Visible result:** Expected System Reaction + Source Acceptance Criteria (customer wording) + contractual GIVEN/WHEN/THEN.
- **System result:** Business Rule enforced (e.g. AC-0001 "Three planning methods… Bulk, Single and Immediate").
- **Failure result:** Regression Guard — "FAIL if requirement MVP1-Mxx-nnn is removed, weakened, hidden…".
- **Proof:** Evidence Required — runtime screenshot + requirement traceability; Test Level "UI + API + E2E; add offline/device/location tests where applicable"; workflow columns Build Status / Acceptance Status / Evidence Link / Defect / Owner / Sign-off (currently Not Started / Not Accepted / Pending).

**b) 15 foundation acceptance criteria** (one per MVP1-FND row, e.g. FND-006: "Repeated client retry after timeout never creates duplicate visits, duplicate decisions, duplicate evidence or ambiguous states") *(workbook "03 MVP1 Foundations"; BRD §8)*.

**c) 12 evidence/zero-regression contracts EV-001..012** *(workbook "12 Evidence Regression Matrix"; `final_pack/MIM_Inspection_MVP1_Zero_Regression_and_Evidence_Contract.pdf` §3)*: traceability (EV-001), admin runtime-consumption proof (EV-002), state-transition evidence (EV-003), risk reproducibility (EV-004), location evidence (EV-005), offline resilience (EV-006), evidence chain (EV-007), return/resubmission versions (EV-008), virtual identity/session (EV-009), Ops fault isolation (EV-010), visual acceptance (EV-011), regression rerun (EV-012). Rule: "No acceptance status may be set to Passed without an evidence reference. Screenshots alone are insufficient for hidden behavior."

**d) 10 acceptance dimensions** *(BRD §17)*: requirement traceability, happy path, validation path, error/retry path, permission path, state transition path, offline path, versioning path, audit path, cross-module path — each with its evidence definition (e.g. state transition: "Invalid transitions are rejected; terminal states remain terminal").

**e) 10 regression classes** *(Zero-Regression Contract §1)*: scope, behavior, rule, permission, audit, version, offline, GIS, UI/UX, evidence regression — each with machine-checkable failure condition; accepted evidence becomes protected baseline.

**f) Gate acceptance:** G4's 7 criteria all PASS *(repo `acceptance/ACCEPTANCE_STATUS.md`)*; G5 acceptance not opened. G7 status PARTIAL — "executable scenario-level acceptance suite beyond one-row-per-source-requirement" is explicitly still required *(archive CURRENT_STATUS gap #9; repo `GATE_STATUS.md` G7 "Scenario expansion and canonical data")*.

**g) 17 error/recovery contracts ERR-PLN-001..ERR-AUTH-001** define mandated failure results and state outcomes *(repo `governance/error_catalogue.csv`)*.

---

## 15. Traceability

Chain and where each link is recorded:

```
Source row (Inspection Project.xlsx, 9 tabs, 478 rows — e.g. "Visit Planning-Planning | row 2")
  → Requirement  MVP1-Mxx-nnn        atomic_scope.csv (repo) = workbook "01 MVP1 Requirements" (source sheet+row preserved)
  → Journey      P00–P12 phase       process_catalog.yaml / master_end_to_end_process.md (screen catalogue column `process` = G2-Pnn)
  → Storyboard   SB01–SB20           AC row column "Storyboard"; workbook "10 Screen Contract"; storyboard book pages (each page shows mapped requirement count)
  → Screen       SCR-ADM/WEB/IPAD/VIR screen_route_catalogue.csv (38 rows; columns: process, source_scope=module, personas, permission_rule)
  → State        STM-* transitions    state_transitions.csv (object, guard, side effects, audit) + per-screen `states` column
  → Action       screen `primary_actions` column + AC "User Action/Trigger" + engine outputs (workbook "09 Engine Register")
  → Acceptance   AC-0001..0478 (1:1 with requirement) + EV-001..012 evidence contracts + ERR-* failure contracts
```

Traceability is itself a requirement (MVP1-FND-015 "no baseline row unaccounted for at build, SIT, UAT or release sign-off") and an evidence contract (EV-001). Work protocol mandates carrying IDs into code, tests, evidence and session records *(repo `CLAUDE.md`; `.claude/rules/governance.md`)*.

**Known traceability gaps (documented, not invented):** no requirement→route/screen matrix exists yet as one artifact (it is Fable-loop Gate G3's exit evidence, workbook "13 Fable Completion Gates"); no API/event contract; scenario-level acceptance expansion pending (G7 PARTIAL).

---

## 16. Contradictions, missing values, unresolved decisions, provider-dependent matters

**Unresolved decisions (authoritative register — agent may not resolve any):**
- DEC-001 risk model (P0) · DEC-002 GIS accuracy/geofence (P0) · DEC-003 SLA calendar (P0) · DEC-004 Arabic/RTL (P0) · DEC-005 factory-facing boundary (P0) · DEC-006 evidence policy (P0) · DEC-007 OTP provider (P1) · DEC-008 maps provider (P1) · DEC-009 digital acknowledgement (P0) · DEC-010 NFR targets (P0) *(repo `governance/decision_register.csv`; mirrored OD-01..08 in `OPEN_DECISIONS_G2.yaml`; per `governance/HUMAN_APPROVALS.yaml` rules, "Open decisions DEC-001..010 / OD-01..08 may not be resolved by the agent")*.
- Stack/framework not frozen (Next.js/React + Supabase are candidates only, bound to DEC-010) *(G5 §3)*.
- Supabase live schema reconciliation blocked pending secret key/PAT *(CURRENT_STATE.md)*.

**Contradictions / inconsistencies found (flagged, not resolved):**
1. **Missing `Requirements` folder:** Meta-Astryx pack (`00_DESIGN_SYSTEM_DECISION.md` "Authority path"; `01_FABLE_MASTER_EXECUTION_PROMPT.md`) instructs reading `/Users/vikramindla/Documents/GitHub/Inspection/Requirements` — that folder does not exist. Actual requirement authority lives in `product-contract/` and the historical archive. Needs correction or confirmation.
2. **Mobbin conflict:** repo `CLAUDE.md` design policy, `GATE_STATUS.md` G6 title, archive `MIM_Inspection_MVP1_UIUX_Design_Authority_Mobbin_MCP.pdf` and Meta-Astryx execution prompt §2 all mandate Mobbin MCP pattern research; the current instruction explicitly excludes Mobbin. Treated here as the latest human instruction overriding earlier direction; the written contract should be amended via change control before G6.
3. **Two design languages:** archive UI/UX authority prescribes "deep navy" restrained enterprise direction; Meta-Astryx pack (newer, 2026-07-11) prescribes Meta-inspired MIM Astryx with Cobalt #0866FF. Astryx is authority level 3 (design direction) and supersedes the archive doc per the pack's own decision statement, but **neither is G6-approved** — no design authority is frozen yet (`design/DESIGN_AUTHORITY_STATUS.md`).
4. **Three different gate models share "G" numbering:** repo project gates G0–G12 (current authority, `GATE_STATUS.md`, archive `11_GATE_ARCHITECTURE/MVP1_GATE_MODEL_G0_G12.md`); archive Fable build-loop gates G0–G10 (workbook sheet "13", Fable Build Contract §5); BRD delivery Gates 1–9 (§16.2). Same letters, different meanings — any future reference must name the model.
5. **Transition-count drift:** archive workbook state contract = 19 transitions; repo G3 contract = 23 (STM-*). Repo supersedes (G3 PASS).
6. **Persona-set counts differ:** personas.yaml 8 human personas; BRD §4 10 personas (adds Auditor, System); REF-015 lists 11 role names (text actually enumerates 12 tokens incl. Leadership); RBAC matrix uses 14 role/capability rows (adds Form/Workflow/GIS/Security Admin, Risk Owner as distinct admin roles). Consistent in substance, different granularity — a single canonical role list should be confirmed at G6/G8.
7. **Astryx pre-empts DEC-004:** the pack mandates Arabic typography/RTL rules while Arabic scope (DEC-004) is open. Prepare-for-RTL is safe; committing bilingual scope is not.
8. **Investor storyboard pack:** page 04 missing; pages 08/09 depict objection/appeal, committee decisioning and executive dashboards that are MVP2-008/009/010/005 — pack explicitly not implementation authority until reconciled *(archive README_CURRENT_STATUS.md)*.
9. **G1 conditional:** the GitHub repository was empty at discovery; "actual architecture" = contract-specified target only *(GATE_STATUS.md; G5 §0)*.
10. **Non-blocking open item:** G4-EV-003 Obsidian desktop screenshot post-check (human-owned) *(G4_GATE_REPORT.md)*.
11. **Rotate-credential note:** a dashboard username/password pasted in an earlier session must be rotated *(G5 §12)*.
12. **Connected Supabase MCP binds to unrelated production project (Catalyst)** — must not be used for Inspection work *(G5 §12)*.

**Provider-dependent matters:** maps/navigation (DEC-008), OTP/SMS/identity (DEC-007), video session provider (TBD), e-signature/PKI (DEC-009), evidence storage/scanning (DEC-006), notification channels + SLA calendar (DEC-003), risk model owner values (DEC-001), geofence/GPS thresholds and telemetry retention (DEC-002), offline sync backend (stack/DEC-010).

---

## Closing summary

**Source files read (complete list):**

*Repository (authority 1):* `CLAUDE.md`; `HOME.md`; `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `MANIFEST.json`, `G3_GATE_REPORT.md`, `G4_GATE_REPORT.md`, `OPEN_DECISIONS_G2.yaml`; `business/master_end_to_end_process.md` + `.mmd`; `domain/process_catalog.yaml`, `personas.yaml`, `scope_boundary.yaml`, `atomic_scope.csv` (478 rows), `field_dictionary.csv`, `rbac_matrix.csv`, `state_transitions.csv`, `reference_data.csv`; `screens/screen_route_catalogue.csv`; `governance/decision_register.csv`, `OPEN_DECISIONS.yaml`, `error_catalogue.csv`, `CHANGE_CONTROL.md`, `HUMAN_APPROVALS.yaml`, `ACTIVE_CHANGE_APPROVAL.yaml`; `acceptance/ACCEPTANCE_STATUS.md`; `evidence/EVIDENCE_STATUS.md`; `design/DESIGN_AUTHORITY_STATUS.md`; `execution/CURRENT_SLICE.yaml`, `TASK_ROUTER.yaml`, `WORK_QUEUE.yaml`, `RESUME_PROTOCOL.md`, `CONTEXT_LOADING_POLICY.md`; `sessions/SESSION_LEDGER.json`, `LAST_SESSION.md`; `docs/G5_ARCHITECTURE_AND_READINESS.md`, `MEMORY_ARCHITECTURE.md`, `SECURITY_AND_SECRETS.md`, `HUMAN_IN_THE_LOOP.md`, `SOURCE_REFERENCES.md`; `.claude/rules/*` (6 files); `.claude/skills/*` (5 skills).
*Historical archive (authority 2):* `MIM_Inspection_MVP1_COMPLETE_DOCUMENTATION_DUMP_v2` — all `00_START_HERE/*` (README, CURRENT_STATUS_AND_KNOWN_GAPS, MASTER_DOCUMENTATION_INDEX, FINAL_DELIVERABLE_RECONCILIATION), `MIM_Inspection_MVP1_Breakdown_and_Acceptance_Contract.xlsx` (all 14 sheets), `MIM_Inspection_MVP1_BRD_Enhanced_Final.pdf` (structure + §1–19 core, pp.112–131; pp.1–110 are the 20 storyboard narratives, cross-verified against the book), Admin/Web/iPad functional specification PDFs (fully read), `MIM_Inspection_MVP1_Native_Storyboard_Book_20_Pages.pdf` (all 20 pages), `MIM_Inspection_MVP1_Claude_Fable_Master_Build_Contract.pdf`, `MIM_Inspection_MVP1_Zero_Regression_and_Evidence_Contract.pdf`, `MIM_Inspection_MVP1_UIUX_Design_Authority_Mobbin_MCP.pdf`, `MIM_Inspection_MVP2_Handoff_and_Continuation_Contract.pdf`, `06_BUSINESS_INVESTOR_STORYBOARDS/README_CURRENT_STATUS.md`, `10_REPOSITORY_REFERENCE/GITHUB_REPOSITORY_GATE_INPUT.md`, `11_GATE_ARCHITECTURE/MVP1_GATE_MODEL_G0_G12.md`; `Inspection_Project_Customer_Auditor_Baseline.xlsx` (tab inventory verified: 9 tabs); Final_Documentation_Pack `README_FIRST.txt`; archive `README.md`. Not deep-read (provenance-only per authority order): 734-page strategic BRD source PDF, 61-sheet strategic workbook, 46MB storyboard reference PDF, superseded pre-enhanced BRD/breakdown, storyboard PNG duplicates.
*Meta-Astryx pack (authority 3):* `00_DESIGN_SYSTEM_DECISION.md`, `01_FABLE_MASTER_EXECUTION_PROMPT.md`, `02_APPROVAL_SEQUENCE.md`, `PACK_MANIFEST.json`.

**Counts:**
- **Requirements:** 478 atomic baseline rows (MVP1-M01-001 … MVP1-M09-030; 470 fully mandatory + 8 with deferred AI sub-capability) + 15 foundation requirements (MVP1-FND-001..015) = **493 governed requirement records**. 20 MVP2 deferred families (MVP2-001..020).
- **Journeys:** **13 canonical process phases** (P00–P12 incl. P06A/P06B branches) — the approved end-to-end journey; restated as an 11-stage BRD journey; decomposed into **20 storyboard-keyed channel journeys** (4 Admin, 7 Web, 8 iPad, 1 Virtual, with SB17/SB19 shared).
- **Storyboards:** **20 implementation storyboards** (SB01–SB20, native book + 20 PNGs) — the binding set; plus 9 of 10 business/investor pages (page 04 missing; pack not implementation authority).
- **Screens:** **38 canonical screens/routes** (14 Admin, 13 Web incl. Operations Center, 8 iPad, 3 Virtual).
- **Acceptance:** **478 acceptance-contract rows** (AC-0001..AC-0478) + 15 foundation acceptance criteria + 12 evidence contracts (EV-001..012) + 10 BRD acceptance dimensions + 17 error/recovery contracts + 7 G4 gate criteria (PASS). Scenario-level expansion beyond 1-row-per-requirement is pending (G7 PARTIAL).
- **Other determinism counts (G3 evidence):** 60 fields, 15 reference domains, 14 RBAC contracts, 23 state transitions, 12 engines, 10 open decisions.

**Unresolved questions requiring human decision before affected work:**
1. DEC-001..010 / OD-01..08 (values listed in §16).
2. Supabase secret key or PAT for live-schema reconciliation.
3. Stack confirmation (Next.js/React + Supabase candidates; iPad offline architecture choice).
4. Correct/confirm the Meta-Astryx pack's `Requirements` folder path.
5. Formal change-control amendment removing Mobbin from G6 wording (current instruction excludes it; frozen docs still mandate it).
6. Confirm MIM Astryx as the G6 design authority via Approval 1 (foundation) before any screen work.
7. Canonical role list reconciliation (8 personas vs 11 REF-015 roles vs 14 RBAC rows).
8. Business/investor storyboard page 04 regeneration + MVP1/MVP2 reconciliation of that pack.
9. Non-blocking: Obsidian desktop screenshot (G4-EV-003 post-check); rotate the previously pasted dashboard credential.

**Confidence by domain:**
- Process lifecycle (P00–P12), scope boundary, modules: **High** (G2 PASS, frozen).
- Screens, fields, RBAC, states, reference data, errors: **High** (G3 PASS, frozen, counts verified against files).
- Personas/permissions: **High** on substance, **Medium** on single canonical role list (granularity drift, §16.6).
- Channel functional behavior (Admin/Web/iPad/Virtual): **Medium-High** (archive channel specs are detailed and consistent with the repo contract, but they are authority level 2; repo has no per-channel spec of its own yet).
- Backend engines/workflow/audit/versioning: **High** for contracts; **Low** for implementation reality (zero code exists; G5 discovery confirmed greenfield).
- APIs/data schema: **Low** — no API/event contract; live Supabase schema unverifiable without secret key.
- Integrations: **Medium** for required behavior, **Low** for providers/values (all decision-gated).
- Offline/sync/idempotency/conflict: **High** (multiply-specified and mutually consistent across repo and archive).
- Security/RBAC/immutability/audit/evidence: **High**.
- NFR/performance/availability: **Low** (DEC-010 open by design).
- Arabic/RTL: **Low** (DEC-004 open); RTL preparation direction understood.
- Acceptance/traceability model: **High** for structure; **Medium** for executability (scenario expansion pending, G7 PARTIAL).
- Design authority: **Medium** — Astryx direction fully absorbed, but G6 NOT STARTED and no design artifact is approved; Mobbin exclusion noted.

**Build/design position acknowledged:** broad implementation blocked until G8 PASS; G5 awaiting decisions; G6 not started; this report is understanding-proof only. No screens designed. No Mobbin used. No provider, threshold, SLA, legal rule, workflow, field or permission invented.

**Declaration:** `READY_FOR_REVIEW`

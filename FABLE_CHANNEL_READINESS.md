# FABLE_CHANNEL_READINESS — Separate Understanding per Channel

Status: understanding evidence for PASS_WITH_NAMED_QUESTIONS follow-up. No design created. Mobbin excluded. Historical archives = provenance only; Meta-Astryx = design direction only; open decisions not invented.

Sources per channel: repo `product-contract/screens/screen_route_catalogue.csv` (screens/states/actions), `domain/*` (RBAC, fields, transitions), `business/master_end_to_end_process.md` (phases); archive channel functional specifications (provenance level 2) for behavior depth; workbook "08 Channel Scope Contract" for boundaries.

---

## 1. Admin Portal (CH-ADM)

- **Scope:** M09 — 30 requirements (MVP1-M09-001..030) · AC-0449..AC-0478 · phase P00 · storyboards SB03/SB13/SB18.
- **Personas:** Compliance Admin (owner), Business Admin, Technical Admin, Reviewer/Approver *(Admin spec §2)*; RBAC-001..006 govern regulations, packages/forms, workflow, risk, GIS, roles.
- **Screens (14):** SCR-ADM-001 home; -010/-011 regulations; -020 items; -030/-031 packages + designer; -040 violations; -041 penalties; -050/-051 workflows + designer; -060 risk; -070 GIS; -080 notifications/SLA; -090 roles.
- **What Admin IS:** governed control plane. Publish chain mandatory: draft → validate → dependency/impact check → maker-checker approval → publish → immutable version → **proof runtime consumes exact version** (Admin spec §5: "A plain CRUD list disconnected from runtime behavior is a P0 failure").
- **Distinctive rules:** regulation is parent of items (M09-001/002); violation auto-generated, inspector cannot override (M09-003, -026); one violation = one penalty (M09-004); missing mandatory evidence blocks submission (M09-005); required items cannot be unselected at runtime (M09-018); publish blocked on missing dependencies (M09-012, -029); published config locked for active inspections (M09-030); deactivation preserves history with mandatory reason (M09-014).
- **States on screens:** locked-published, dependency-conflict, publish-blocked, validation errors, unauthorized (catalogue `states` column).
- **Failure contracts:** ERR-PUB-001, ERR-AUTH-001.
- **Open decisions touching Admin:** DEC-001 (risk config values), DEC-002 (GIS thresholds), DEC-003 (SLA), DEC-006 (evidence policy).
- **Readiness verdict:** contract-complete; buildable understanding HIGH; blocked values are DEC-gated, not ambiguous.

## 2. Web Portal (CH-WEB) — Planning, Management, Review, Factory 360

- **Scope:** M01 (52) + M02 (46) + M06 (53) + M07 (20) = 171 requirements · phases P01–P03, P10–P12 · storyboards SB04, SB05, SB10/SB17, SB11.
- **Personas:** Planner, Operations User/Branch Manager, Level 2 Reviewer, Auditor, Leadership (RBAC-007, -008, -011, -012, -013).
- **Screens (12 of 13 web routes; /operations counted under Operations below):** SCR-WEB-100..150 planning; -200/-210 visit management; -300/-310/-320 review; -400 Factory 360.
- **Planning:** three visually distinct methods sharing canonical fields (Bulk criteria AND/OR unlimited, M01-003/-022; Single via CR/Industrial License only, M01-035; Immediate may proceed unregistered with mandatory location, M01-045/-046; inspector-created Immediate starts immediately, M01-047/-051). One Bulk plan → many Visits, each unique Visit ID sharing Visit Plan ID; inspectors receive Visits, never Plans (M01-031). Publish blocked until validations pass (M01-030).
- **Management:** KPIs reflect planning statuses only (M02-002); edit only before inspection starts (M02-006); Returned always managed as Single (M02-008); cancellation reason mandatory + final (M02-010); Expired final/view-only (M02-016); duplicate active visits prevented (M02-012); every action audited, audit immutable (M02-014).
- **Review:** queue scoped to assigned reviewer (M06-013); read-only submitted version always latest (M06-015, -032); approve irreversible (M06-002/-004); return requires reason + exact sections, unlocks only those (M06-005/-006, -043); reject final, no Compliance Management trigger (M06-007/-008); every resubmission = immutable Version N+1 with diff (M06-045/-047); reviewer comments immutable (M06-052).
- **Factory 360:** full-page dossier, not card (M07-001, -018); source = Senaei, read-only in Phase 1 (M07-002, -034 in M06 catalogue); official vs planner vs observed location provenance preserved (M07-005); role-controlled sections (M07-019); partial-failure isolation (M07-020).
- **Failure contracts:** ERR-PLN-001/002, ERR-ASG-001, ERR-PUB-001 (planning); ERR-REV-001, ERR-AUTH-001 (review); ERR-OPS-001 pattern for Factory 360 widgets.
- **Open decisions touching Web:** DEC-001 (risk display), DEC-003 (SLA badges), DEC-008 (maps).
- **Readiness verdict:** HIGH; densest review/versioning semantics fully understood.

## 3. Operations Center (CH-OPS)

- **Scope:** M08 — 19 requirements · phase P12 (+ live posture for P03/P06A) · storyboard SB12 · screen SCR-WEB-500 `/operations`.
- **Personas:** Operations Center Analyst, Supervisor, Executive (RBAC-008 for override/exception actions; monitoring-only unless supervisor permission, M08-001).
- **Behavior:** command dashboard; live map+list synchronized (M08-002); visit monitoring by *operational* state — New, Prepared, On the Way, Arrived, Executing, Submitted — separate from workflow status (M08-003; FND-002); inspector location visible only during active journey/execution per policy (M08-004; FND-009); SLA on server timestamps (M08-005); risk read-only in Ops (M08-006); configurable alert rules — GPS override, missed visit, cancelled visit, offline inspector, stuck execution, overdue review (M08-007); region/branch scoping (M08-010, -018); cancellation + GPS-override monitoring with approval trail (M08-012/-013); tracking history immutable (M08-014); export permission-controlled + audited (M08-017); one failed widget never breaks the center (M08-019; ERR-OPS-001; EV-010).
- **Open decisions:** DEC-002 (telemetry/retention), DEC-003 (SLA), DEC-008 (maps), DEC-010 (refresh/latency targets).
- **Readiness verdict:** HIGH on behavior; MEDIUM on certification (threshold values open).

## 4. iPad / Inspector Workspace (CH-IPAD)

- **Scope:** M03 (15) + M04 (223) = 238 requirements — the largest channel · phases P04–P09 + P11 · storyboards SB06, SB07/SB14, SB08/SB15, SB16, SB17.
- **Personas:** Inspector (RBAC-009/-010: own assignments only; submitted immutable), Factory Representative (physical acknowledgement), Operations (monitor without silently overriding field evidence), System *(iPad spec §2)*.
- **Screens (8):** SCR-IPAD-600 assignments; -610 prestart; -620 journey/check-in; -630 workspace; -640 evidence; -650 findings/violations/actions; -660 submit; -670 returned correction.
- **Pre-start:** only assigned work visible (M03-002); schedule drag within planning window (M03-005); return assignment needs valid reason (M03-006); execution-mode eligibility explicit (M03-011); package resolution locks after save (M03-012).
- **Journey/geofence:** start validates assignment + status + window + destination (M04-001..004); package downloaded + integrity-verified BEFORE journey; version frozen at download (M04-005/-006); telemetry: ETA, remaining distance, route deviation; arrival detection; official-vs-observed comparison; geofence check-in or governed override with permission+reason+evidence (P06A failure controls; STM-JRN-001..003; ERR-GEO-001/002).
- **Execution:** dynamic package-defined report/checklist, required/optional/conditional, autosave, blockers surfaced before final submit (P07; iPad spec §8 "do not surprise the inspector after a long field visit").
- **Evidence/violations/actions:** capture linked to exact item/finding with metadata + content identity; violations auto-trigger from published rules; penalties resolved from mapping; mandatory action forms block submission (P08; SB15).
- **Offline contract (verbatim obligations, iPad spec §4):** package locally present before dependent states; every edit autosaves with explicit sync state; crash recovery without loss; reconnect replays queue idempotently; conflict = explicit record + resolution path, silent overwrite prohibited; offline evidence keeps local identity until durable server confirmation; UI always distinguishes offline/pending/syncing/synced/conflict/failed.
- **Submission:** pre-submit validation → acknowledgement/signature only where approved (DEC-009) → immutable version + report IDs → audit → Level 2 handoff; ambiguous retry protected by idempotency key (ERR-SUB-002).
- **Returned correction:** only returned sections unlock; reviewer comments immutable; resubmission = Version N+1 (SCR-IPAD-670; STM-COR-001/002).
- **Open decisions:** DEC-002 (thresholds), DEC-006 (evidence policy), DEC-009 (signature), DEC-010 (package sizes) + offline stack choice.
- **Readiness verdict:** HIGH on behavior contracts (most heavily specified channel); build blocked on stack/DEC values.

## 5. Virtual Session (CH-VIR)

- **Scope:** M05 — 20 requirements · phases P06B, P07–P09 · storyboard SB09 · screens SCR-VIR-700 appointment/waiting room, -710 identity/OTP, -720 session.
- **Personas:** Inspector (host), Factory Representative (RBAC-014: own appointment/session only; no internal data), Reviewer (downstream), System.
- **Behavior:** only confirmed virtual visits displayed; session start constrained by planned window + assignment; participant identity + OTP mandatory where configured, failures block progression and remain auditable (STM-VIR-002); readiness (camera/audio/network/permissions) gates start; remote evidence/notes captured with same chain-of-custody; closure/handoff produces same controlled inspection outputs and review path as physical *(BRD §7.5 non-negotiable rules; process P06B failure controls: identity/OTP failure, participant absent, poor connection, physical follow-up when evidence insufficient)*.
- **Failure contracts:** ERR-VIR-001 (OTP provider down → retry/reschedule/escalate, never bypass), ERR-EVD-*, ERR-SUB-*.
- **Open decisions:** DEC-007 (OTP provider), DEC-005 (factory-facing boundary), video session provider TBD.
- **Readiness verdict:** MEDIUM-HIGH — behavior clear; two provider decisions + boundary decision pending.

---

## Cross-channel handoffs (understood, one line each)

Admin publishes versions → all runtimes consume exact version. Planner publishes → Visits appear only in assigned inspector's queue. Inspector submits → immutable version enters reviewer queue. Reviewer returns → only named sections unlock on iPad. Approval/rejection → Factory 360 history + Operations state update. All transitions notify via ENG-11 and audit via ENG-12 (channel contract "Cross-Channel Handoffs" column, workbook sheet 08; SB19 "Cross-Channel Deep Links: preserve object, version and context across channels").

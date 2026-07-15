# Claude Design Prompt V5 — CD-027 / SCR-WEB-210 Visit Detail

## Where this prompt goes

Paste this entire document into **Claude Design** in a new project or fresh account. This is a design-only task, not a Claude Code implementation prompt.

Required pipeline:

1. Claude Design researches and generates the complete high-fidelity CD-027 package.
2. Claude Design includes a future, sponsor-gated Claude Code handoff as a deliverable.
3. Sponsor and Codex independently review the package and its wiring.
4. Only after explicit sponsor design approval and independent Codex wiring audit may that handoff be executed.

`implementation_authorized: false`

Every Claude Code-facing deliverable must begin with:

> DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard, or overwrite the existing dirty worktree.

---

## 1. Task identity and boundary

- Product: Saqeel MVP1 industrial inspection platform (`صقيل | صناعي`).
- Design ID/task: `CD-027` / `TASK-DESIGN-CD027`.
- Screen: `SCR-WEB-210` — Visit Detail.
- Route: `/visits/:id`.
- Process: `P03`; read context across execution/review only where the actual detail query exposes it.
- Personas: Planner and Operations may see permitted detail/actions; Inspector has read context only for own RLS-scoped visit. UI visibility never grants authority.
- Engines: `ENG-03`, `ENG-05`, `ENG-06`, `ENG-11`, `ENG-12`.
- Acceptance: `DSG-022`, `DSG-A11Y-001`.
- Goal: let a user reconstruct a visit’s identity, state domains, assignment, schedule, package, immutable history, exceptions and currently allowed actions in under 30 seconds—without turning the page into an editable CRM record.

This is a controlled redesign of a working route. It must preserve actual behavior, identify unsafe or incomplete legs, and never convert design approval into implementation approval.

---

## 2. Mandatory reading order and baseline record

Before composition, read these in order and record the actual branch, commit, dirty-worktree status, and each unavailable source:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `design/claude-design-mvp1/00_START_HERE.md`
9. `design/claude-design-mvp1/MANIFEST.yaml`
10. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
11. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`
12. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
13. `design/claude-design-mvp1/authority/UX_BLIND_SPOT_REGISTER.csv`
14. `design/claude-design-mvp1/prompts/systems/ARABIC_RTL_ACCESSIBILITY_AND_RESPONSIVE.md`
15. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
16. `outputs/claude-design-approval-pack/Saqeel_43_Screen_Claude_Design_Matrix.csv` (CD-027 row and linked reference library entries `R01`, `R02`, `R11`, `R12`)
17. `product-contract/screens/screen_route_catalogue.csv`
18. `product-contract/domain/atomic_scope.csv` (`MVP1-M02-001..046`)
19. `product-contract/domain/state_transitions.csv`
20. `product-contract/domain/rbac_matrix.csv`
21. `product-contract/governance/error_catalogue.csv`
22. `product-contract/evidence/AC_LEDGER.csv`, filtered for P03 / Visit Management / Visit Detail where mapped
23. `design/claude-design-mvp1/FABLE_UNDERSTANDING_TRACEABILITY.csv` and `FABLE_ACCEPTANCE_UNDERSTANDING.csv`, filtered by `SCR-WEB-210` and P03
24. `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv` and `SCREEN_STATE_MATRIX.csv`
25. `apps/web/src/components/Shell.tsx`, `ShellClient.tsx`, `apps/web/src/lib/shell-navigation.ts`, `apps/web/src/app/astryx.css`, `apps/web/src/app/tokens.css`
26. `apps/web/src/app/visits/[id]/page.tsx`, `ActionBar.tsx`, `Attachments.tsx`, `NotesEditor.tsx`, `actions.ts`, `loading.tsx`
27. `apps/web/src/app/visits/page.tsx`, `VisitsBoard.tsx`, `actions.ts`, `calendar/CalendarBoard.tsx`, `calendar/page.tsx`, `workload/page.tsx`
28. `apps/web/src/lib/notify.ts`, `apps/web/src/lib/offline.ts`, `apps/web/src/components/GeoMap.tsx` and the actual field journey files that own operational transitions
29. `supabase/migrations/0001_foundation.sql`, `0002_rbac_audit.sql`, `0015_w1_journey_state.sql`, `0020_fix_plans_attachments.sql`, `0024_fix2_ops_planning_visits.sql`, `0025_scheduled_visit_expiry.sql`, `0030_cd023_inspector_immediate_expiry.sql`, `0031_cd023_assignment_overlap_guard.sql`

If any path, action, table, RLS policy, audit trigger, storage policy, transition, notification provider or route cannot be inspected, label the related deliverable row `HANDOFF_BLOCKED` with the missing evidence. Do not infer equivalence from screenshots or a similarly named file.

---

## 3. Verified runtime dossier — binding facts

Use this dossier as a starting hypothesis; reconcile it against the baseline you can actually inspect. If the baseline differs, report the difference rather than silently changing the contract.

### Route, component and query ownership

`apps/web/src/app/visits/[id]/page.tsx` is a server-rendered dynamic page inside the accepted `Shell`. It queries the RLS-scoped `visits` row and joins: linked `visit_plans`; `factories`; `package_versions` and `packages`; `assignments` / assigned profile; `journey_sessions` / `geo_events`; `inspections` / immutable `submission_versions` / `reviews`; and the per-visit `audit_events` feed. It separately reads active `visit_attachments` and mints caller-session signed download URLs from the private `attachments` bucket.

The present page already shows a header, planning/operational lozenges, factory, assignment, schedule, package, inspection/version/review summary, linked plan, returned/cancellation reason, actions, notes, attachment list, journey events and audit timeline. Its weak point is a flat sequence of surfaces: it does not help users distinguish five separate state domains or understand which action is authoritative, mutable, locked, complete, unavailable, or only queued.

Exact current candidates to verify before proposing a file change:

| Path | Current responsibility | Default disposition |
| --- | --- | --- |
| `apps/web/src/app/visits/[id]/page.tsx` | RLS-scoped detail composition and reads | UPDATE only if all reads remain intact |
| `apps/web/src/app/visits/[id]/ActionBar.tsx` | state-conditioned management action forms | UPDATE only; preserve action bindings |
| `apps/web/src/app/visits/[id]/Attachments.tsx` | upload/list/download/soft-remove UI | UPDATE only; preserve private-storage truth |
| `apps/web/src/app/visits/[id]/NotesEditor.tsx` | notes form | UPDATE only; preserve server action |
| `apps/web/src/app/visits/[id]/actions.ts` | server actions and current guards | PRESERVE unless a separate approved remediation closes a blocked leg |
| `apps/web/src/app/visits/[id]/loading.tsx` | route loading behavior | verify then PRESERVE/UPDATE |
| `apps/web/src/components/Shell.tsx`, `ShellClient.tsx`, `lib/shell-navigation.ts`, `app/astryx.css` | frozen shared shell | PRESERVE — do not redesign |

No guessed new route, map panel, provider, server action, storage bucket, RLS policy, status transition or notification delivery mechanism may appear in the manifest as implemented.

### Five separate state domains — never collapse these into one status chip

1. **Planning status:** `draft`, `validated`, `published`, `returned`, `cancelled`, `expired`. The Visit Detail may encounter the live visit-relevant values. `cancelled` and `expired` are final planning outcomes; history remains visible.
2. **Operational state:** `new`, `prepared`, `on_the_way`, `arrived`, `executing`, `submitted`. Field/journey logic owns canonical operational changes; do not render an editable operational-state control here.
3. **Assignment state:** `assigned`, `preparing`, `ready`, `returned` (verify exact stored text and ownership). Assignment return is not planning-status return.
4. **Inspection state:** e.g. `not_started`, `in_progress`, `submitted`; submission versions are immutable.
5. **Review state/decision:** `pending_review`, `under_review`, `approved`, `returned`, `rejected` where a review exists. Review is not a planning-status rewrite.

The selected page-specific signature interaction is a **Dual-State Ribbon**: a keyboard-operable, non-editing provenance ribbon that preserves all five domains as individually labelled tracks, shows their latest verified event/time/source, and reveals the allowed-action boundary and immutable-history anchor for the currently selected domain. It must work as a structured list/table when narrow or reduced motion is active, never only as color or animation.

### Canonical state and security contract

- `STM-VIS-001`: Published → Returned by authorized Planner/Ops with mandatory reason, reopen allowed fields, notification/audit.
- `STM-VIS-002`: Published/Returned → Cancelled by authorized role with mandatory reason, stop execution/release assignment where required, notification/audit. The current page must not claim release if it cannot prove it.
- `STM-VIS-003`: eligible active → Expired only through canonical system expiry trigger and configured threshold; never an on-page manual status mutation.
- Operational/journey transitions are owned by field guards/RPCs, including `set_operational_state`; they are not a Visit Detail action.
- Inspector may view own assignment only; Planner/Ops writes are enforced by RLS. RLS, canonical guards and immutable audit remain the authority even if controls are hidden.
- `audit_events` is append-only; do not offer edit/delete/reorder or imply a complete audit list beyond the actual query limit.
- `visit_attachments` is private storage plus row registration; remove is a soft delete (`removed_at`/`removed_by`), not physical erasure. Signed links may fail or expire.
- Notifications are rows/queued side effects. A queued row never proves delivery, receipt, reading, acceptance or provider success.

### Current action truth and required blocked remediation flags

Current server actions are `returnVisit`, `republishVisit`, `cancelVisit`, `rescheduleVisit`, `reassignVisit`, `updateVisitType`, `updateVisitNotes`, `uploadVisitAttachment`, and `removeVisitAttachment`.

- `cancel`, `reschedule`, and visit-type change check `planning_status=published` and `operational_state=new`; visit-type and reassign also use a pre-start inspection guard. Those client conditions are only affordance; the server/RLS guard is authoritative.
- Return requires a reason; republish maintains the same visit ID; cancellation requires a final reason; reschedule validates end after start; reassignment changes the existing assignment. Verify every precise claim in code.
- Several primary updates commit before notification insertion. The current implementation therefore can truthfully say **“visit change saved; notification could not be queued”** only if the action result proves it. It must never say “inspector notified” on notification error.
- Upload writes object storage before `visit_attachments` registration. A registration failure may leave an orphaned private object; no existing remediation/retry/cleanup contract is proven. Treat recovery as `HANDOFF_BLOCKED`, not as successful attachment completion.
- Existing actions and attachment URL/error states surface raw Supabase/provider error text. Safe neutral error mapping is not yet verified. Mark a sanitized error-mapping remediation leg `HANDOFF_BLOCKED` unless an inspected baseline proves it.
- Reassign notification currently targets the new inspector; the “both parties notified” outcome is not proven by the shown write. Never claim the previous inspector is notified without a verified leg.
- Current management writes are separate non-transactional actions, not an atomic Visit Detail transaction. Never claim a cross-write rollback.

### Explicitly unavailable / do-not-invent

- no approved map interaction/data path for this detail route; coordinates alone are not permission to claim a live map, distance, route, geofence state or GPS tracking;
- no provider-backed notification-delivery proof;
- no SLA threshold, risk formula, capacity score, suitability recommendation, travel time or geofence value may be invented;
- no raw Supabase/database/storage/provider message in user copy;
- no direct mutation of planning, operational, journey, inspection or review status;
- no deletion or alteration of submitted versions, audit history, official factory coordinates, or offline/server conflicts;
- no support contact, escalation policy or recovery promise not present in the source.

---

## 4. Requirement and acceptance mapping

Treat all `MVP1-M02-001..046` as mandatory scope. Build a traceability appendix that identifies which are directly represented at Visit Detail, inherited from Visit Management, or linked but not owned by this route. At minimum map: detail/view (`005`, `024`); permitted edit (`006`, `025`); return/republish/cancel (`008–010`, `028–030`); assignment/reassign/reschedule (`018`, `026–027`, `037`); state/expiry (`015–016`, `046`); timeline/audit (`013–014`, `044–045`); notifications (`041`); attachments (`042`); notes (`043`); and all relevant foundation/RBAC/audit/accessibility requirements.

`DSG-022` requires a Visit Detail integrating state, factory, assignment, schedule, package, map-or-truthful-unavailability, timeline, notes and actions across detail-state variants. `DSG-A11Y-001` requires semantic operation, full Arabic RTL and responsive proof—not a translated screenshot.

---

## 5. Current-screen critique and equal-fidelity hypotheses

Before selecting a direction, document these current costs:

1. State domains are rendered as isolated labels and sections, obscuring what changed, what is editable and what is final.
2. Actions, their guards and their partial-side-effect risk are far from the relevant state/history evidence.
3. Raw/error-prone linked surfaces (attachments, notifications, signed URLs) provide no coherent safe recovery model.

Create three genuinely different, equally high-fidelity information architectures. They must all preserve the accepted shell and the same runtime data, with the same density and complete Arabic/dark/light/narrow treatments:

| Hypothesis | Decision architecture | Required test |
| --- | --- | --- |
| A — Provenance dossier | identity header, Dual-State Ribbon as the governing decision zone, then evidence-led detail chapters | Can a planner explain why an action is available without opening an edit form? |
| B — Action boundary first | allowed-action boundary and guard explanation lead, with state/history evidence as a persistent adjacent rail | Does this over-prioritise rare actions over reconstruction of the record? |
| C — Chronological case file | immutable history is primary and current facts/action boundary are derived summary rails | Can a user identify the present allowed action within 30 seconds without scan burden? |

Compare them against decision time, irreversible-error prevention, evidence visibility, Arabic/RTL density, keyboard burden, narrow behavior, and implementation truth. Select one with evidence; do not self-score. Select **A** only if inspection confirms the Dual-State Ribbon communicates all five domains without inventing state facts.

### Counterfactual

Show the chosen populated state once with the Dual-State Ribbon and once without it. Explain concretely why removal forces the user to infer state relationships from disconnected lozenges/timelines, increases accidental action risk, and hides whether an event is planning, operational, assignment, inspection or review history. Do not claim measured usability data you did not collect.

No second page-specific signature interaction is permitted.

---

## 6. Design contract

### Required component map

Use inspection objects, not generic CRM cards:

1. existing shared Shell unchanged;
2. identity header: immutable mixed-direction visit ID, factory link, visit type, execution mode, actual visibility scope;
3. Dual-State Ribbon with five labelled state tracks, source/time, status text/icon/pattern, history link and allowed-action boundary;
4. clear allowed-actions area: available, disabled-with-why, and unavailable/HANDOFF_BLOCKED controls separated; confirmation/reason fields only for verified actions;
5. factory and schedule/assignment evidence, including assignment method/status and a no-recommendation posture;
6. package/version and inspection/submission/review provenance, with immutable versions visually distinct;
7. returned/cancelled/expired exception record, preserving final reasons and history;
8. notes with role/read-only state;
9. attachment register with private/soft-delete/signed-link/degraded states;
10. journey/location event list. A map is only a `HANDOFF_BLOCKED` placeholder/reconciliation annotation unless this route’s real map leg is verified; the list remains complete without it;
11. append-only audit timeline, using non-color source/domain markers and disclosure of the actual rendered limit;
12. neutral recovery/status region for success, input-preserved failure, stale/concurrent failure and queued-not-delivered truth.

### State inventory

Design every state below as selectable in the `.dc.html`, reflected in the state matrix, and evidenced where visual:

- populated published/new with permitted Planner/Ops action;
- returned with mandatory reason and same immutable ID; republish available only if current guard proves it;
- cancelled final with reason/history still present;
- expired system state (no manual-expire affordance);
- operational `prepared`, `on_the_way`, `arrived`, `executing`, `submitted` read-only contexts;
- assignment returned/reassigned; no inspector/assignment record; pre-start lock;
- inspection absent, in progress, submitted with immutable v1/v2 versions; review pending/under review/returned/approved/rejected only where queried;
- attachment empty, signed URL unavailable, upload failure before/after storage registration ambiguity, soft removed;
- notes success/failure with typed input preserved;
- notification queued, notification queue failure after a committed primary update, and no-notification-recipient;
- stale/concurrent update/RLS denial; unauthorized/read-only Inspector view; not found/out of scope; page query failure; linked-data degradation;
- loading/skeleton and reduced-data/narrow list alternative.

### Arabic, theme, responsive and accessibility contract

- Arabic is default document-level `lang=ar dir=rtl`, not translated LTR. Use realistic long Arabic labels and factory names; show mixed-direction UUID/plan/package IDs, dates and telemetry with correct isolate/mono treatment.
- Preserve Space Grotesk (English), IBM Plex Sans Arabic (Arabic) and JetBrains Mono for IDs/operational values; use only Saqeel semantic tokens. Preserve dark launch-film and field-usable light themes without semantic/color reversal.
- Provide 1440 desktop, 1024px constrained layout, and 390–430px narrow/mobile frames. At narrow width, the ribbon becomes an ordered accessible state ledger, not a clipped horizontal strip. No hover, drag, map or color-only dependency.
- Minimum 48px targets, 16px inputs, WCAG AA, logical CSS properties, visible focus and semantic headings/landmarks. Specify exact keyboard order: skip link → page heading/identity → ribbon track/list → allowed actions → detail chapters → notes/attachments → journey → audit. Focus moves into validation summary/first invalid field on failed submission, and returns to the invoking action after a dismissed confirmation or safe failure.
- Give exact spoken wording for: selected state track; action unavailable/why; planning change committed but notification not queued; signed attachment link unavailable; attachment registration unknown; out-of-scope/not found; final cancelled/expired status. Use `role=status` for non-interruptive completion and `role=alert` only for blocking failure. Never expose raw backend/provider messages.
- Motion may only preserve state-track continuity; use no motion in `prefers-reduced-motion` and provide the same information statically.

---

## 7. Primary-source research requirement

Research at least three primary sources before finalising: one authoritative enterprise/inspection-operational pattern source, one Saudi government/public-service source relevant to Arabic public-service clarity, and one authoritative accessibility/RTL standard source (for example W3C). Record URL, observed principle, adopted treatment, rejected treatment and Saqeel-specific rationale. Do not copy screenshots, brand grammar or unverified policy. Pattern inspiration from the reference library must remain original.

---

## 8. Mandatory 14-leg wiring-map expectations

Return `WIRING_MAP_CD-027.csv`, one row per leg below, with columns: `leg_id, UI trigger/state, client component, route/server action, validation/guard, canonical transition, table/RPC/storage/provider, RLS/grant/role, audit event, notification/side effect, success result, neutral negative/partial result, automated test, runtime evidence, status`.

1. Visit detail read and RLS-scoped not-found/out-of-scope distinction.
2. Factory/plan/package/assignment/inspection/review linked-read degradation without collapsing the base detail.
3. Per-visit append-only audit read, ordering/limit and no-audit-read state.
4. Return visit: mandatory reason, permitted role/state, `STM-VIS-001`, audit, queued-not-delivered truth.
5. Republish returned visit: same visit ID, canonical guard, audit and notification truth.
6. Cancel visit: final reason, `STM-VIS-002`, no unproven assignment-release claim, partial notification result.
7. Reschedule: server date validation, published/new guard, pre-start behavior, audit and notification result.
8. Change visit type: reference values, pre-start/published/new guards, audit.
9. Reassign inspector: current assignment guard, overlap/concurrency evidence, old/new recipient truth, audit.
10. System expiry: `STM-VIS-003`, no manual control, expiry job/RPC and notification/audit evidence.
11. Notes update: role/RLS, audit, stale/RLS failure with input preserved.
12. Attachment upload: private object upload then row registration, RLS/audit, orphan/partial recovery `HANDOFF_BLOCKED` unless proven.
13. Attachment signed download and soft removal: signed URL expiry/failure, soft-delete/audit, no physical-delete claim.
14. Operational/journey/inspection/review read context: canonical owner/state source, immutable submission/review history, and no direct status mutation from Visit Detail.

Every unsupported, non-atomic, raw-error, missing-recipient, missing-map, ambiguous notification, conflict-recovery or policy leg is `HANDOFF_BLOCKED`; show the missing source/evidence and the smallest safe remediation boundary. Never label it “complete,” hide it, or fabricate a workaround.

---

## 9. Required package and evidence

Create a clean `outputs/cd-027-r1/` package containing:

1. `CD-027 Visit Detail.dc.html` — all state families selectable;
2. `CD-027 Visit Detail.standalone.html` — synchronized review export;
3. `IMPLEMENTATION_MANIFEST_CD-027.yaml`;
4. `COMPONENT_MAP_CD-027.csv`;
5. `WIRING_MAP_CD-027.csv`;
6. `STATE_MATRIX_CD-027.csv`;
7. `ACCEPTANCE_CHECKLIST_CD-027.md`;
8. `RESEARCH_PROVENANCE_CD-027.md`;
9. `CLAUDE_CODE_HANDOFF_CD-027.md`;
10. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-027.md` — future-only, execution prohibition first line;
11. `PACKAGE_INVENTORY_CD-027.csv` with path, revision, baseline, design/screen ID, implementation-facing flag and synchronization result;
12. all required evidence PNGs.

Manifest requirements: baseline branch/commit/dirty-worktree record; frame IDs; PNGs; exact file-level before/after responsibility; PRESERVE/UPDATE/CREATE/REMOVE disposition; code target/export/selector/token/design node; protected behavior; dependencies; RTL/theme impact; tests; rollback; and `implementation_authorized: false`. `REMOVE` requires explicit human approval.

Required PNGs (each filename includes `CD-027`, `SCR-WEB-210`, state, theme, language, width and `R1`):

- populated published/new dark English 1440;
- populated published/new light English 1440;
- populated published/new dark Arabic RTL 1440;
- populated published/new light Arabic RTL 1440;
- returned/recovery and cancelled-final states;
- notification failure after committed primary change, with neutral wording;
- attachment signed-link unavailable and upload-registration-unknown;
- stale/concurrent or RLS-denied failure with preserved input;
- no-map/linked-service-degraded truth;
- 1024 constrained shell/content state;
- 412 English and Arabic RTL narrow ledger/action states;
- keyboard focus / invalid-form / confirmation return annotation;
- signature counterfactual without the Dual-State Ribbon;
- route/RLS/canonical-owner/HANDOFF_BLOCKED annotation.

### Sponsor review and final return condition

Do not self-approve, self-score, or claim implementation completion. Return `READY_FOR_DESIGN_REVIEW` only when every required file is present and internally consistent; all states are selectable; all theme/RTL/narrow/a11y proof is present; the shared shell is unchanged; every current side effect is accurately qualified; and every unproved leg is explicitly `HANDOFF_BLOCKED`.

Finish with a sponsor-review summary listing: the chosen hypothesis and counterfactual, preserved runtime behavior, blocked remediation items, exact future implementation file scope, test/evidence obligations, and the statement:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

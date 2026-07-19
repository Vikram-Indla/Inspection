# Claude Design — Six-Package Premium Inspection Prompt Pack

**Use:** start one Claude Design project/conversation per package. Attach or make available the canonical repository and the package’s current screenshots. Do not paste a package into generic chat without its source files.

## Common control preamble — include before every package

You are working on the Saudi Inspection Platform, an integrated MVP1/MVP2/MVP3 regulatory product. This is a code-ready design task, not a product rediscovery exercise and not an application implementation task.

### Canonical authority

Read, in order:

1. `/Users/vikramindla/Developer/Inspection/AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/governance/OPEN_DECISIONS.yaml`
7. `design/claude-design-mvp1/00_START_HERE.md`
8. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
9. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`
10. `design/claude-design-mvp1/authority/DESIGN_DECISIONS.md`
11. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
12. `design/claude-design-mvp1/operationalization/premium-redesign-20260719/MASTER_UIUX_OPERATIONALIZATION_PLAN.md`
13. The package-specific journeys, system prompts, acceptance rows, source code and screenshots.

The canonical repository is `/Users/vikramindla/Developer/Inspection`. Do not use `/Users/vikramindla/Documents/GitHub/Inspection` as authority.

### Product rules that cannot be weakened

- Preserve all 478 mandatory MVP1 requirements and all accepted MVP2/MVP3 behaviour.
- Preserve URLs unless a change-control item explicitly authorizes a route change.
- Preserve RBAC/RLS, data scope, workflow transitions and guards.
- Preserve submitted-version immutability and selective returned-scope editing.
- Preserve offline conflict truth; never imply silent overwrite.
- Preserve audit lineage and provider truth.
- Never invent a policy, provider, threshold, SLA, retention period, risk weight, legal rule, KPI formula, data value or Arabic scope.
- `Projected route` is not live GPS.
- Virtual OTP/state/audit may be real while the production video provider remains unavailable.
- AI is assistive, cited and human-controlled; it never makes the final regulatory decision.
- `Minister` is initially an audience/persona label mapped to the existing governed Leadership boundary, not a new runtime role.
- A persona learning selector is not a role switcher.
- Cinematic Atlas may enrich public/login/onboarding presentation but must not leak into authenticated operational styling.
- Do not edit application code, database, product contract or acceptance status.
- Return `READY_FOR_SPONSOR_REVIEW`; never self-approve.

### Premium design definition

Premium means authoritative hierarchy, calm composition, excellent Arabic, purposeful visuals, precise state language, visible evidence and provenance, responsive performance, accessibility and clear next actions. It does not mean glassmorphism, decorative gradients, excessive cards, neon, generic chat bubbles, theatrical motion or stock imagery unrelated to Saudi industrial inspection.

Use real people only through an explicit media-production direction with release, licensing, cultural, PPE, caption, transcript, poster and reduced-motion requirements. Until approved assets exist, label the frame `APPROVED MEDIA REQUIRED`.

### Mandatory response contract

Return all of the following:

1. source/authority inventory with exact paths and IDs;
2. current-state summary based on code and screenshots;
3. requirement/persona/journey/screen/route/state mapping;
4. list of preserved, refined, consolidated, replaced and design-only components;
5. at least two equal-fidelity alternatives for the primary decision zone;
6. decision rationale and rejected counterfactual;
7. code-ready component hierarchy, variants, states and responsive rules;
8. EN/LTR and AR/RTL, light/dark, primary and constrained viewport frames;
9. loading, empty, unauthorized, validation, stale, degraded, offline/conflict and recovery states where relevant;
10. action → guard → data → audit → provider annotations;
11. accessibility, keyboard, focus, target-size, contrast and reduced-motion specification;
12. no-invention and dependency register;
13. stable evidence manifest linking every frame to route, persona, state, locale, direction, theme, viewport, source commit and acceptance IDs;
14. acceptance checklist with pass/fail/not-evidenced values;
15. final status `READY_FOR_SPONSOR_REVIEW`, `RETURNED_WITH_FINDINGS` or `BLOCKED_BY_NAMED_AUTHORITY`.

Stop only the affected frame when authority is missing. Continue all independent work.

---

## CD-PREM-01 — Premium foundation, navigation, persona identity and Admin chassis

### Mission

Turn the implemented Government Foundation V1 into the shared premium composition system for all 59 route pages and consolidated modes. Preserve tokens and shell behaviour; improve hierarchy, navigation clarity, persona relevance, density, context and failure-state consistency. Produce the sponsor’s Admin Control Plane approval screen as proof of application.

### Read additionally

- `apps/web/src/app/tokens.css`
- `apps/web/src/components/Shell.tsx`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/lib/shell-navigation.ts`
- `product-contract/acceptance/DSF_FOUNDATION_SHELL_RESET_001.csv`
- `product-contract/evidence/TASK-DESIGN-FOUNDATION-SHELL-RESET-001.md`
- `product-contract/domain/rbac_matrix.csv`
- `product-contract/domain/personas.yaml`
- `product-contract/screens/screen_route_catalogue.csv`
- `design/claude-design-mvp1/prompts/02_SAQEEL_FOUNDATIONS_AND_COMPONENTS.md`
- every `P00` journey and relevant Admin special-component contract;
- current shell/Admin screenshots and design-system baseline audit.

### Required design work

1. Inventory existing tokens, type, spacing, radii, elevation, icons, tables, forms, filters, tabs, badges, alerts, dialogs, drawers, maps, charts, evidence, review, offline and error components.
2. Reconcile the stale dark-violet narrative against the accepted light-first government foundation without rewriting historical evidence.
3. Design the expanded and collapsed left rail, mobile drawer, top command strip, breadcrumb, navigation search, page decision header and 360px Context/Evidence/Audit/Help panel.
4. Group destinations by user job and journey stage while preserving role visibility and URLs.
5. Add a persona identity capsule containing governed name/account, canonical role and scope; it must not switch roles.
6. Define a `Learn the platform` destination that opens Persona Academy without changing authorization.
7. Define one state grammar covering draft, published, ready, in progress, submitted, returned, approved, rejected, cancelled, expired, queued, syncing, failed, conflicted, stale and unavailable.
8. Define standard and dense operational tables, filter bars, selection, pagination, sticky actions and constrained-width behaviour.
9. Define sectional error, empty, partial, loading, unauthorized-with-no-content and recovery states.
10. Apply the chassis to `/admin` as a decision-oriented control plane: Needs decision, Publish blockers, Published and stable, Dependencies and Audit.

### Approval frames

- Shell expanded EN/LTR light desktop.
- Shell collapsed AR/RTL dark desktop.
- Mobile/tablet drawer with focus behaviour.
- Admin control plane populated.
- Admin loading, degraded, approval-blocked and unauthorized-with-no-content.

### Acceptance

- No raw parallel design system is created.
- Existing input geometry is unchanged.
- Every visible destination is real and role-scoped.
- Page title, state, user job, scope/freshness, blocker and one primary action are evident within five seconds.
- Persona context is visible without impersonation.
- Arabic composition is intentional, not mechanically mirrored.
- All later packages can consume named components and states without inventing local variants.

---

## CD-PREM-02 — Onboarding, Persona Academy and real-media learning system

### Mission

Create a premium, visual, low-text explanation of how the platform works—from secure entry through planning, physical/virtual inspection, evidence, review, enforcement and executive learning. Use the same shell/top-navigation language for in-product learning while allowing Cinematic Atlas realism on public/login surfaces.

### Read additionally

- `/login`, landing, launch and profile source components;
- `apps/web/src/app/astryx.css` only to understand the isolated public Atlas exception;
- `product-contract/business/master_end_to_end_process.md`;
- `design/claude-design-mvp1/authority/JOURNEY_SCREEN_MAP.csv`;
- all P00–P12 journey prompts;
- 20-page storyboard reference;
- strategic workbook persona, longest-path, visual-journey and UI/UX sheets;
- approved terminology and Arabic sources.

### Required design work

1. Design the sponsor approval screen for public onboarding and secure access.
2. Create the Persona Academy information architecture inside the authenticated shell.
3. Represent each governed persona by name, job outcome, allowed scope, common tasks, handoffs and boundaries—not by a role-switch control.
4. Cover Compliance Admin, Form Admin, Workflow Admin, Risk Owner, GIS Admin, Security Admin, Planner, Operations, Inspector, Reviewer, Auditor, Leadership and Factory Representative; route other strategic personas through an explicit reconciliation register.
5. Build the platform story `Plan → Prepare → Inspect → Prove → Decide → Improve`.
6. Build physical, virtual, unable-to-execute, return/correction and review storylines.
7. Create a four-hour demo/training navigation with short chapters and progress.
8. Specify 20–45 second real-character films, poster alternatives, captions, transcript, audio-description plan, reduced motion and no audible autoplay.
9. Write a production brief covering Saudi industrial locations, real PPE, authentic male/female representation, releases, music/voice rights, privacy and mock-data discipline.
10. Link each learning chapter to the exact current route/state and platform version.
11. Design contextual first-use guides that can be dismissed and reopened without blocking operational work.

### Approval frames

- Public onboarding/login EN/LTR and AR/RTL.
- Real-media film poster, playing, unavailable and reduced-motion states.
- Persona Academy index in the side panel.
- Inspector and Planner persona chapters.
- Full journey map with chapter progress.

### Acceptance

- A new user can explain the platform, their role, their starting point and their next handoff after the relevant chapter.
- No training control changes RBAC.
- No film claims a provider or product behaviour that is not live.
- Every media asset has an accessibility and rights disposition.
- Training material is versioned and traceable to current routes/screens.

---

## CD-PREM-03 — Minister/Leadership national command, map intelligence and governed AI

### Mission

Create the country-level decision experience requested by the sponsor using the existing Leadership authorization boundary. Make every displayed fact explainable. Combine national KPIs, Saudi map, ranked list, source context and a conversational composer without inventing data, thresholds, predictions or provider capability.

### Read additionally

- `/dashboard`, dashboard queries and business requirement contract;
- Factory 360 and Operations source;
- MVP3 executive analytics and assistive-AI registers;
- strategic workbook executive dashboard, KPI, practical AI and map opportunity sheets;
- `product-contract/domain/rbac_matrix.csv`;
- `design/claude-design-mvp1/prompts/systems/AUTHENTICATED_LIVE_OPERATIONS_MAP.md`;
- current dashboard/Operations/Factory 360 screenshots.

### Required design work

1. Map the audience label `Minister` to the existing Leadership role for design; flag any request for a separate role as change control.
2. Define the executive questions and decision cadence: national status, yearly movement, regional comparison, sector/risk/compliance breakdown, inspection pipeline, overdue remediation and source drilldown.
3. Design a national command header with time period, region, scope, freshness and partial-source state.
4. Design four primary measures using only governed formulas. Show definitions, numerator/denominator, owner, refresh, access scope and drilldown.
5. Synchronize Saudi map, ranked region/factory list and context panel. Every selection must remain consistent across views.
6. Use neutral/ranked regional treatment until approved thresholds exist. Distinguish inspection density from violation density.
7. Define map → region → city/zone → factory → visit/report drilldown using authorized routes.
8. Add a conversational composer with governed preset questions. Show interpreted query, active filters, answer, citations, freshness, uncertainty and source drilldown.
9. Produce two truthful states: `AI briefing not enabled` and `adapter-ready design specification`. Never fabricate a runtime answer.
10. Separate factual briefing from human follow-up/action and record the human action independently.
11. Include no-data, partial data, stale, unauthorized, provider/map unavailable, cannot-answer and conflicting-source states.

### Approval frames

- National command EN/LTR light and AR/RTL dark.
- Map view and list view with synchronized selection.
- Region/factory drilldown and provenance panel.
- AI-not-enabled and cited adapter-ready answer states.
- Partial-source and cannot-answer states.

### Acceptance

- An executive can understand national position and the main exception within 60 seconds.
- Every KPI and AI statement traces to governed source records.
- No unapproved Minister role, annual target, risk threshold, live-presence signal, prediction or recommendation appears.
- Map and list are equivalent and accessible.
- AI cannot create a regulatory decision.

---

## CD-PREM-04 — Planning, visits, Factory 360 and Operations journey

### Mission

Redesign the complete business journey from target selection through plan publication, visit management, operational monitoring and Factory 360. Make the sequence obvious, use maps meaningfully, reduce table fatigue and expose why each decision or exception exists.

### Read additionally

- P01, P02, P03 and P12 journey prompts;
- planning, visits, factories and operations source routes/components;
- planning/management source workbook sheets;
- map, workflow, risk and notification special-component prompts;
- current screenshots and all mapped acceptance rows.

### Required design work

1. Cover bulk, single and immediate planning as separate methods without calling them inspection types.
2. Design a visible planning stepper: method, criteria/factory, visit configuration, assignment, validation and publish.
3. Explain target selection with criteria, source, model version and manual override reason.
4. Synchronize factory table/cards and map; preserve an accessible list alternative.
5. Design visit configuration and assignment with date/window, execution mode, package, team, conflict and dependency truth.
6. Do not claim skill/capacity/proximity optimization where current assignment is deterministic round-robin.
7. Design published-plan and visit-management workspaces with map/calendar/list/workload views, saved filters, bulk eligibility and partial-failure handling.
8. Isolate irreversible publish/cancel/reassign/override actions and show exact consequence.
9. Design Factory 360 as a spatial decision timeline: identity, authoritative/verified location, history, risk drivers, findings, actions, documents, visits and degraded services.
10. Design Operations around exceptions, workload, projected routes, freshness and allowed next actions. Never label projection as live telemetry.
11. Include loading, empty, duplicate, stale, conflict, partial bulk failure, unavailable map, route-provider unavailable and unauthorized states.

### Required route coverage

At minimum: `/planning`, `/planning/bulk`, `/planning/single`, `/planning/immediate`, `/planning/bulk/review`, `/planning/plans`, `/planning/plans/:id`, `/visits`, `/visits/:id`, `/visits/calendar`, `/visits/map`, `/visits/workload`, `/factories`, `/factories/:id`, `/operations`, `/operations/live`, `/operations/exceptions`.

### Acceptance

- A Planner can see where a plan starts, what remains and what publication creates.
- Every selected factory is explainable.
- Maps are synchronized with lists and degrade honestly.
- Factory 360 remains useful when one source fails.
- Operations shows owner, freshness, evidence and next action for each exception.
- No provider, algorithmic suitability or live-GPS claim is invented.

---

## CD-PREM-05 — Inspector physical field journey, evidence, offline and immutable submission

### Mission

Create the best field inspection experience in the programme: iPad-first, Arabic-first, interruption-safe, evidence-led and usable under unreliable connectivity. Cover the complete physical journey from assignment through preparation, travel, check-in, inspection, evidence/findings, submission, return and correction.

### Read additionally

- P04, P05, P06A, P07, P08, P09 and P11 journey prompts;
- `/field`, `/field/:visitId`, `/field/inspection/:id` source;
- offline, GIS/geofence, evidence/media and review/version system prompts;
- inspection execution source workbook sheets and longest physical path;
- current field acceptance, tests and provider truth.

### Required design work

1. Design assigned work as Today, Upcoming, Returned and Needs attention with calendar/list/map alternatives.
2. Design the startup pack: visit/factory identity, package version/hash, documents, Factory 360 snapshot, route, safety/readiness, storage, device, GPS and offline package.
3. Design journey/check-in with route, destination source, accuracy, geofence, timestamp and governed exception evidence.
4. Design the inspection workspace in portrait and landscape with section navigation, active question, help/context, progress, blockers and safe next/previous actions.
5. Design conditional, repeatable, calculated, validation and mandatory-question states without exposing implementation complexity.
6. Design evidence capture for photo, video, document, scan, voice/note where governed; show linkage, time, device, location where permitted, hash and quality.
7. Design findings/violations/actions with question, evidence and clause linkage; do not let AI finalize severity, penalty or legal outcome.
8. Make local/server truth persistent: Saved locally, Queued, Syncing, Synced, Failed and Conflict.
9. Design recovery from restart, low storage, denied permissions, corrupt package, upload failure, stale server version and conflict.
10. Design pre-submit proof with exact fix links, acknowledgement/signature truth and immutable-version consequence.
11. Design returned correction so only authorized sections are editable and previous content/comments remain immutable.

### Approval frames

- Assigned visits and startup pack.
- Journey/geofence normal and exception.
- Primary inspection workspace EN/LTR light and AR/RTL dark.
- Evidence/finding capture.
- Offline/conflict and pre-submit blocked.
- Returned correction and version truth.

### Acceptance

- Inspector always knows current state, next safe action and blocker.
- The journey is operable in Arabic, sunlight-friendly light mode, portrait and landscape.
- No answer or evidence is silently lost or overwritten.
- Evidence chain of custody is visible without overwhelming task execution.
- Submission and returned-scope immutability are unmistakable.

---

## CD-PREM-06 — Virtual inspection, review, compliance, committee and audit decision surfaces

### Mission

Design the complete remote and back-office decision chain: virtual appointment/verification/session, immutable Level-2 review, comparison/return, compliance/enforcement, committee decision and audit replay. Make provider boundaries and evidence sufficiency explicit.

### Read additionally

- P06B, P07, P08, P10, P11 and P12 journey prompts;
- virtual, reviews, enforcement, cases, committee, reports and admin/audit source;
- virtual-video, review/version, evidence, notification and accessibility prompts;
- virtual and Level-2 source workbook sheets;
- relevant MVP2/MVP3 decision/audit registers.

### Required design work

1. Design virtual appointment and waiting: purpose, time, participants, instructions, readiness and reschedule/fallback.
2. Design identity and OTP with attempts, cooldown, expiry, lockout, mismatch, provider-transmission truth and escalation.
3. Design a provider-neutral session shell with participant verification, video stage, checklist, evidence, notes, timeline and one valid next transition.
4. Produce provider-pending and provider-integrated specifications; the pending frame must not render fake participant video or call controls.
5. Design low-bandwidth, permissions denied, no device, reconnecting, stale/concurrent, participant absent, evidence insufficient, closed/immutable and physical-fallback states.
6. Design the review queue around priority, SLA only where governed, risk context, assignee, version and workload.
7. Design immutable review with report/checklist/evidence/findings/timeline and separated approve/return/reject consequences.
8. Design version comparison around changed sections, fields, evidence and comments; distinguish prior locked content from returned editable scope.
9. Design compliance/enforcement/case and committee surfaces as decision-grade evidence packages, not raw tables.
10. Design audit replay across plan, assignment, field/virtual events, evidence, submission, review, enforcement and outcome with actor/time/source/version/correlation.
11. Include unauthorized-with-no-content, missing evidence, stale version, provider unavailable, quorum/segregation hold, partial source and export/print states.

### Required route coverage

At minimum: `/virtual`, `/virtual/:id`, `/reviews`, `/reviews/:id`, `/reviews/:id/started` redirect evidence, `/reports/inspection/:id`, `/enforcement`, `/cases`, `/committee`, `/admin/audit`, `/tasks`, `/portal`.

### Acceptance

- Virtual work remains truthful and useful with no video provider.
- Reviewer can identify changes and evidence gaps without editing submitted content.
- Committee receives a readable summary with drilldown to source evidence.
- Audit can reconstruct the inspection decision chain without chat memory.
- Every final decision remains human, authorized and traceable.

---

## Lead reconciliation prompt after all packages

Read the six package outputs together. Reconcile only shared tokens/components, shell/navigation, persona identity, map/list behaviour, context-panel behaviour, terminology, Arabic/RTL, accessibility, evidence truth and duplicated signature patterns. Do not average incompatible designs. Select the strongest source-supported decision and record the rejected alternative and reason.

Build a single coverage table over all 59 routes, 38 governed logical screens, consolidated modes, personas, states and inspection journeys. Return zero orphan routes and zero unsupported design frames. Run the internal audit checklist from the master plan. Return `READY_FOR_SPONSOR_REVIEW` only when every P0/P1 design finding is either closed, explicitly assigned or blocked by named authority. Do not approve implementation.


# SAQEEL Operating System

Version: 3.0 — consolidated operating standard
Supersedes: V2.0 (2026-07-25) and the V3 Addendum
Owner: Codex (acceptance authority), ChatGPT (planning orchestrator)
Authority: the canonical product contract and all 478 source requirements
Sponsor acceptance: 2026-07-25
Source fingerprint: `7a8823fdace8e90d698ebd88a2e289268ef0932845bdfee603b8f9128368585d`

This is the mandatory end-to-end operating system for SAQEEL design,
engineering, integration, testing, evidence, status and delivery. Codex,
Claude Code, Claude Design, Kimi, ChatGPT, every independent Codex delivery
task and any replacement worker must load this file at the beginning of every
session and after every session change before accepting work.

V3.0 changes nothing about what V2 demanded. It supplies the mechanism, owner,
timer, schema or automated check that each V2 gate assumed but did not define,
and rearranges the workforce so delivery is not capped by a single actor. No
V2 gate is relaxed.

## 1. Mission

Deliver the complete SAQEEL Web/Admin product and its real integrations as
quickly as safely possible without weakening, deleting, inventing or silently
deferring any of the 478 canonical requirements.

The whole workforce must continuously find cleaner and faster ways to deliver.
Speed is measured by accepted business capability, not messages, tool calls,
screenshots or partially finished work. No module, pull request or release
candidate advances with an unresolved P0 or P1 defect.

The target outcome for every module is:

`accepted design + complete behavior + real wiring + zero P0/P1 + current tests + real-browser proof`

## 2. Mandatory session bootstrap

Every new or resumed session begins with this exact command:

> Load and obey the SAQEEL Operating System before doing any work. Verify the
> canonical repository, current product contract, active task, ownership,
> dependencies, requirement and acceptance IDs, design revision, test and
> browser evidence, and the next queued task. Do not rely on chat memory. Do not
> wait passively. Do not overlap another worker. Deliver quickly, preserve all
> required behavior, and stop completion claims whenever a P0 or P1 remains.

Every session begins by reading, in order:

1. `<REPO_ROOT>/AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`
9. `product-contract/operationalization/coordination/TWO_HOUR_CONTROL_CYCLE.yaml`
10. `product-contract/state/CONTROL_BOARD.md`
11. The task packet and task-specific authority files.

`REPO_ROOT` is resolved from `git rev-parse --show-toplevel`. No
machine-specific absolute path may appear in the contract; finding one raises
`OS-DEFECT`.

The worker then reports:

- actor, lane (`w1` or `r1`) and session ID;
- canonical repository and worktree;
- branch, HEAD and dirty paths;
- packet ID and exact requirement IDs;
- screen, engine and acceptance IDs;
- allowed and prohibited files;
- held leases;
- dependencies and open decisions;
- expected evidence and stop conditions.

No implementation begins from chat memory, a screenshot, a design filename or
an implied approval.

If the session changes, loses context, moves worktree, changes branch, changes
actor or resumes after interruption, the complete bootstrap is repeated.

## 3. Roles

### ChatGPT — planning orchestrator

- Owns sequencing and scope: what is built next and what is in each packet.
- Authors packets, directs Claude Design and sequences the queue.
- Provides adversarial requirement, information-architecture, UX and research
  critique and produces source-marked Claude Design prompts.
- Marks unsourced claims `UNVERIFIED` and never self-approves.
- May not accept work, break leases, set severity, merge or write product code.

### Codex — acceptance authority

- Owns safety and done-ness: leases, conflicts, severity, acceptance and merge
  gating.
- Runs the real implementation in the browser before calling anything
  delivered.
- Reviews every handoff and returns `ACK`, `RETURNED` or `BLOCKED`.
- Maintains the requirement score, status board, dirty laundry and PR queue.
- Arbitrates and force-breaks leases, resolves conflicts and escalates to the
  sponsor.
- May refuse an unsafe packet but may not rewrite the queue.
- Holds no write lease on product code.

### Claude Code

- Owns bounded design-to-code mapping, design correction handoffs and leased
  implementation work.
- When no implementation lease exists, immediately prepares the next
  requirement-backed Claude Design or ChatGPT packet, repository map, test gap
  review or evidence package.
- May not remain idle while a READY packet exists.
- May not self-approve.
- Must challenge unsafe, invented or incomplete design and implementation
  assumptions before they enter code.

### Kimi

- Runs two independent engineering lanes: Kimi A on module `n` service layer,
  API, RLS/RBAC and audit events; Kimi B on module `n-1` hardening and
  integration.
- Receives a new non-conflicting engineering, QA, security or evidence packet
  within five minutes of completing or blocking its current packet.
- Consumes design through committed, revision-stamped design specs and performs
  repository engineering,
  service/RLS/RBAC mapping, independent QA, negative-path analysis, test-gap
  discovery, security review and evidence review.
- Connector troubleshooting is dirty laundry, not primary delivery work.
- May not claim a design revision it cannot read.

### Claude Design

- Owns design revisions and generates presentation-layer code directly through
  MCP, making it a leased write lane rather than a supplier of pictures.
- Scaffolds module `n+1`; its read lane runs drift detection and delta
  production, consistency and accessibility review.
- Changes design only from a reviewed packet with exact authority and preserved
  capabilities.
- May never invent provider availability, live data, metrics, thresholds,
  routes, policies or backend capability. Generation is limited to the
  presentation layer and enforced by CI.

## 4. Sponsor delivery measures

The sponsor receives three separate figures:

1. `built requirement rows / 478`;
2. `independently verified requirement rows / 478`;
3. `fully accepted requirement rows / 478`.

Only the third figure is completion. A row counts as fully accepted only when
all applicable gates are satisfied:

1. Canonical requirement and acceptance IDs are unchanged and traced.
2. The accepted Claude Design revision is recorded, or design is proven not
   applicable.
3. The implementation commit and exact files are recorded.
4. Real service, API, database, RLS/RBAC, audit and provider wiring is proven.
5. Required positive, negative, unauthorized, empty, error, degraded, offline
   and conflict paths pass where applicable.
6. Evidence matches the current commit, design revision, persona, locale,
   theme and viewport.
7. The real system is reviewed in the browser.
8. Required independent and sponsor acceptance is recorded.
9. No P0/P1 blocker remains.

Traceability, code existence, a passing happy-path test, a design mockup or a
stale screenshot does not count as completion.

The score source is
`product-contract/operationalization/SAQEEL_REQUIREMENT_SCORECARD.yaml`.

Every two-hour report also states:

- business functions made usable;
- screens added or materially corrected;
- P0 and P1 count;
- work returned for correction;
- real-browser demonstrations ready for sponsor review;
- dependency and release position;
- flow metrics and decisions at risk.

## 5. Two-hour control cycle

The two-hour cycle is the planning and reconciliation horizon, not the idle
tolerance. No actor may remain passively idle for more than five minutes while
a safe READY packet exists. Waiting for a sponsor decision, connector, lease or
another actor is recorded as a dependency; the actor then switches to a
non-conflicting fallback packet.

Idle is not self-reported. Every actor writes a heartbeat on state change and
at least every five minutes; liveness is proven by artifacts. A missing
heartbeat for ten minutes is an `ORCH-DEFECT` against the orchestrator.

### Command discipline

1. Every workstream has one named owner, one active task and one queued task.
2. Every application session, design surface, source path, branch and shared
   data set has only one controller at a time.
3. A completed handoff is accepted, returned or blocked within the live
   heartbeat; it is never left waiting without review.
4. Incomplete, unsafe or unsupported work is returned with exact corrections,
   not accepted to preserve pace.
5. Every independent delivery task is monitored like every external actor;
   creating it does not transfer final acceptance authority.
6. Codex personally owns conflict resolution, final technical review,
   real-browser acceptance and sponsor escalation.
7. Every worker must propose at least one safe acceleration when a repeated,
   manual or slow step is identified.
8. Activity without a measurable delivery outcome is not progress.
9. P0/P1 prevention and early rejection are faster than late rework.

Every two hours Codex must:

1. Read context health for every actor against the mandatory bands.
2. Read current gate, slice, decisions, worktrees, branches and dirty paths.
3. Inspect every lane as running, ready, completed, blocked, suspect or stalled.
4. Review finished handoffs and issue `ACK`, `RETURNED` or `BLOCKED`.
5. Reconcile completion against all 478 requirement rows.
6. Inspect the real application in the browser for newly delivered work.
7. Capture current route, persona, commit, locale, theme, viewport, console and
   network result.
8. Commit and push work that passed its bounded review and update its PR.
9. Never merge or deploy without the required explicit authority.
10. Refresh the status board from evidence only.
11. Update dirty laundry without stopping unrelated READY work.
12. Publish flow metrics and decisions at risk.

ChatGPT issues the next two-hour queue. Codex accepts or refuses individual
packets but does not rewrite it.

At cycle close:

- every lane
  each have active work, a handoff under review or a recorded dependency plus
  active fallback work;
- at least one worker session must be `RUNNING`, unless every READY task is
  contract-blocked;
- every active worker has one bounded `READY` packet behind its current work;
- each packet has exact requirement, screen, engine and acceptance IDs;
- no two write packets overlap;
- status includes tasks completed this cycle, the three requirement figures,
  the current P0/P1 count and flow metrics.

## 6. Browser delivery gate

“Delivered” means the real implementation, not Claude Design.

For every newly claimed screen or capability, Codex opens the real route and
checks:

- authenticated persona and permission boundary;
- approved visual hierarchy and responsive behavior;
- real or approved seeded data;
- real navigation, actions and handoffs;
- loading, empty, error, unauthorized and degraded states;
- console and network health;
- English/Arabic, LTR/RTL and light/dark where applicable;
- named desktop, tablet and mobile viewports;
- no regression to existing capability.

Claude Design and implementation screenshots are paired only as comparison
evidence.

Every second completed module triggers a whole-product consistency review of
the shared shell, navigation, typography, spacing, interaction patterns,
English/Arabic, responsive behavior and accessibility.

## 7. Seeder and data policy

The approved Supabase seeder is the controlled way to create demonstration and
test data when the scenario lacks safe records.

- Seed data must be deterministic, labelled, isolated and reversible through a
  proven removal path; if removal is not possible, that limitation is declared
  before writing.
- It must respect schema, RLS/RBAC, workflow, audit, immutability and ownership.
- It may illustrate a governed formula; it may not invent the formula, policy,
  SLA, threshold, risk weight or provider response.
- Seeded evidence must be distinguishable from production-like source data.
- Shared seed mutation requires an exclusive data lease and collision check.
- Any collision with an existing record stops the seed operation; records are
  never silently reused or overwritten.
- A seeded happy path never substitutes for empty, failure, unauthorized and
  degraded-path evidence.

## 8. Git and PR delivery

When a bounded implementation or control-plane packet passes review:

1. Reconfirm allowed paths and dirty ownership.
2. Run required tests and evidence checks.
3. Stage only owned files.
4. Commit with the packet and requirement IDs.
5. Push the worker branch.
6. Create or update the PR with requirements, screens, wiring, tests, evidence,
   blockers and rollback.
7. Leave the PR unmerged until the required review and sponsor gate pass.

No general approval authorizes `main`, merge, deployment, DDL, provider changes
or deletion.

The control board maintains a visible dependency order for stacked branches and
shared components. A module cannot be called independently mergeable while it
depends on an unaccepted branch.

## 9. Design truth gate

Before any screen build and before any generation run:

1. Confirm the design maps to the real business function.
2. Confirm the current design revision or export fingerprint.
3. Compare design behavior with existing functionality.
4. Preserve every required function missing from the design.
5. Reject invented metrics, providers, routes, live states, data or policies.
6. Confirm desktop, tablet, narrow, English/Arabic, light/dark, accessibility,
   loading, empty, error, unauthorized and degraded states as applicable.
7. Record the exact design-to-code difference and expected browser proof.

## 10. Status board

Each module independently reports:

- Design;
- Frontend;
- Service Wiring;
- QA;
- Sponsor.

Allowed states are `GREY`, `AMBER`, `GREEN` and `RED`. Every state includes the
status word, owner, date, current revision or commit, evidence or blocker ID and
next action. No overall green may conceal an amber or red lane. Entry and exit
criteria are binding under section 27.

## 11. Defect and dirty-laundry discipline

Non-blocking defects and missing conveniences enter the dirty-laundry register
with:

- issue ID;
- affected requirements/screens;
- severity;
- owner;
- evidence;
- workaround if safe;
- revisit trigger;
- target packet.

P0/P1 failures, requirement loss, permission failure, data corruption,
conflicting ownership or missing contracts are blockers, not dirty laundry.

No P0 or P1 may be deferred merely to preserve pace. P2/P3 items may enter
dirty laundry only with a named owner, safe workaround, due trigger and proof
that they do not weaken a canonical requirement. Severity is defined once in
section 18.

## 12. Integration and pre-production

- Local browser proof is necessary but does not equal release proof.
- Every accepted module must be demonstrated in the shared pre-production
  environment before release acceptance.
- Integration order follows declared branch and shared-component dependencies.
- Cross-module navigation, permissions, data handoffs and regression tests run
  before a module is promoted.
- No permanent mock may substitute for an unavailable provider. Contract mocks
  carry an expiry; a mock outliving its module is a P1.

## 13. End-of-session handoff

Every session ends with the canonical actor handoff containing exact branch,
HEAD, dirty paths, owned files, held leases, results, evidence, blockers,
decisions and next safe task. A new session must reload this operating system,
independently verify the handoff and pass the cold-start check before
continuing.

The handoff must also state:

- business functionality completed;
- business functionality still incomplete;
- current P0/P1 count;
- next active and queued task;
- whether the real implementation is ready to show in the browser;
- what, if anything, requires sponsor authority.

## 14. Final completion rule

A module is complete only when design, implementation, wiring, permissions,
audit, positive and negative behavior, test evidence, real-browser evidence,
integration and required sponsor acceptance are current and no P0/P1 remains.

The programme is complete only when all 478 requirements have a final accepted
disposition and the full Web/Admin product passes the same standard in
pre-production. Anything less is progress, not completion.

## 15. Machine-readable state

All control state lives under `product-contract/state/`. If it is not in state,
it did not happen. Status reports are generated from these files.

### Heartbeats

`heartbeat/<actor>.yaml` records:

- actor, lane and session ID;
- state: `RUNNING`, `READY`, `BLOCKED`, `REVIEW` or `IDLE`;
- packet, branch, HEAD and dirty paths;
- dependency ID when blocked and mandatory fallback packet;
- update timestamp and context health.

### Packets

`packets/PKT-XXXX.yaml` records requirement, screen, engine and acceptance IDs,
allowed and prohibited paths, expected evidence, stop conditions, definition of
done and estimated size.

### Decisions

`decisions/OPEN_DECISIONS.yaml` records `raised_at`, `sla_hours`,
`default_if_unanswered` and `escalation_target` for every open decision.

## 16. Lease protocol

Every write resource has an expiring lease with resource, holder, packet,
acquisition time, 90-minute TTL, renewal count, maximum two renewals and Codex
as breaker.

- Lease acquisition is atomic and fails if a conflicting lease exists.
- Overlapping globs are a conflict and must be resolved before either write.
- Expiry automatically releases the lease. The worker stops, verifies HEAD and
  reacquires before any further write.
- Only Codex may force-break a lease, with a recorded reason.
- Total concurrent write leases are capped at three and at one per module.

## 17. Context-health thresholds

| Band | Remaining context | Required action |
|---|---:|---|
| GREEN | greater than 0.50 | Continue |
| AMBER | 0.25 to 0.50 | Finish the current packet, start no new packet, prepare handoff |
| RED | less than 0.25 | Stop, write canonical handoff, end session |

An AMBER worker may not start an L-sized packet. Continuing to code in RED is
an `OS-DEFECT`.

## 18. Severity ladder

- **P0:** data loss or corruption; permission/RLS/RBAC bypass; auth failure;
  secret exposure; production-path breakage; canonical requirement silently
  lost; build or deploy broken.
- **P1:** required canonical behavior absent or wrong; a required negative,
  unauthorized, empty, error or degraded path missing; regression to accepted
  capability; evidence not matching current commit; missing audit trail.
- **P2:** usability, consistency, performance or accessibility defect that does
  not remove a required capability.
- **P3:** cosmetic, convenience or refactor debt.

The finder proposes severity and the reviewer confirms it. Disputes default to
the higher severity until Codex rules.

## 19. Decision SLA and anti-stall

- Internal decisions default to eight working hours; sponsor decisions default
  to 24 hours.
- Every decision has a default if unanswered and an escalation target.
- A decision blocking five or more requirement rows escalates immediately.
- Two consecutive fallback cycles convert the blocking dependency into a P1
  orchestration item.
- Breached decisions appear in the two-hour report with the requirement rows
  they hold.

## 20. Automated gates in CI

Every push to a worker branch runs:

1. lint, typecheck, unit tests and build;
2. integration tests against a disposable RLS/RBAC-enabled database;
3. Playwright on named desktop, tablet and mobile viewports across English,
   Arabic and required themes, capturing screenshots, console and network logs;
4. WCAG 2.1 AA axe scan with zero criticals;
5. traceability validation of commit/PR requirement IDs against the scorecard;
6. evidence freshness validation against current HEAD;
7. secret and dependency-vulnerability scans.

A PR failing any gate cannot enter review. Unit tests cover logic, integration
tests cover wiring and permissions, and end-to-end tests cover the canonical
journey. A flaky test is P1, quarantined with an owner and a 72-hour trigger;
it is never rerun repeatedly until green.

## 21. Evidence specification

Evidence is stored as:

`evidence/<requirement_id>/<commit_sha>/<persona>_<locale>_<theme>_<viewport>_<state>.png`

A sibling `manifest.yaml` records requirement and acceptance ID, commit, design
revision, route, persona, locale, theme, viewport, states, console cleanliness,
network errors, timestamp and capturer. Evidence whose commit differs from
HEAD is stale and drops the row from verified to built. Accepted evidence is
retained through release plus one year; superseded evidence moves to
`evidence/_superseded/` and is never deleted.

## 22. Requirement change control

Any change to the 478 requirements needs a signed Requirement Change Note with
ID, current text, proposed disposition, business justification, affected
acceptance IDs, score impact and sponsor signature. The denominator changes
only through that note; historical reports retain their original denominator.

## 23. Flow metrics

Each cycle publishes:

- rows moved built to verified to accepted;
- return rate, with target below 20%;
- median and 90th percentile packet cycle time;
- blocked actor-hours as a share of total actor-hours;
- post-acceptance P0/P1 escape rate;
- rework ratio on accepted files;
- projected completion as a date range from the trailing five-cycle acceptance
  rate.

Escalate when return rate exceeds 30%, blocked time exceeds 25%, or projected
completion slips for two consecutive cycles.

## 24. Incident and rollback

1. Any actor may call `STOP THE LINE` for suspected P0 without permission.
2. All write leases freeze; read-only analysis continues.
3. Codex names an incident owner and opens `incidents/INC-XXXX.yaml`.
4. Contain by reverting the offending commit or disabling its feature flag,
   verify in pre-production, then resume.
5. Within 24 hours, publish a blameless mechanism-focused note and add a new CI
   check or explicit accepted-risk entry.

## 25. Security, secrets and data protection

- No real customer or personal data exists outside production.
- Pre-production uses deterministic seed data or irreversible masking.
- Secrets live only in the secret manager and never in Git, packets, evidence,
  screenshots or chat. Exposure is P0.
- Every endpoint packet declares authentication, authorization, rate limit,
  audit event and PII classification before build.
- Every RLS/RBAC boundary has negative tests per role.

## 26. Environments

The environment ladder is `local -> preview -> preprod -> prod`. Each
environment defines who may deploy, permitted data and the promotion gate.
Local browser proof does not substitute for preview or pre-production proof.

## 27. Status-board entry and exit criteria

| Lane | GREEN requires |
|---|---|
| Design | Accepted revision, required states/locales, no invented data |
| Frontend | Code on worker branch, CI gates 1-7 pass, evidence current with HEAD |
| Service Wiring | Real service/API/database/RLS/audit proven, negative tests pass, no mocks |
| QA | Positive, negative, unauthorized, empty, error and degraded pass; zero P0/P1 |
| Sponsor | Acceptance recorded against the acceptance ID with name and date |

AMBER means in progress with owner and date. RED means blocked or failing with
blocker ID. GREY means not started. Aggregate status is always the worst lane.
No lane remains GREEN with stale evidence.

## 28. Worker onboarding and replacement

Before the first write, every replacement or resumed worker:

1. reads the OS and packet;
2. restates requirement IDs and stop conditions in its own words;
3. verifies branch, HEAD and dirty paths against the handoff;
4. passes three Codex cold-start questions answerable only from the contract.

Failure returns the handoff to its author. Account, CLI, actor, worktree,
branch, context-loss and resumed-session changes all trigger this process.

## 29. Lane architecture

### 29.1 Module stagger

| Lane | Work |
|---|---|
| ChatGPT | packets and contract for module `n+2` |
| Claude Design | module `n+1` scaffold |
| Claude Code | module `n` wiring, states and hardening |
| Kimi A | module `n` service, API, RLS/RBAC and audit |
| Kimi B | module `n-1` hardening and integration |
| Codex | review and browser acceptance for module `n` |

### 29.2 Compiled design specs

Every accepted Claude Design revision produces
`design-specs/<module>/<revision>.yaml` with fingerprint, mapped components,
required states, locales, RTL rules, viewports, themes, accessibility,
preserved capability IDs and an empty `invented_elements` list. This committed
artifact is build authority for actors that cannot read Claude Design directly.
The live revision remains acceptance authority.

### 29.3 Contract-first decoupling

The API/service contract is frozen before a module starts. Frontend and backend
build independently to it. Contract mocks carry an expiry and become P1 if they
outlive the module.

### 29.4 Vertical slices only

Every packet completes a real journey for a real persona: one screen, its
service, permissions, tests and browser demonstration. Horizontal packets such
as "build all tables" or "style all forms" are prohibited.

## 30. Two-session lanes and liveness

### 30.1 Lane split

Every builder has one leased write lane and one unleased read lane:

- `cd-w1` / `cd-r1`;
- `cc-w1` / `cc-r1`;
- `kimi-a-w1` / `kimi-a-r1`;
- `kimi-b-w1` / `kimi-b-r1`.

Control lanes are `gpt-w1`, `gpt-r1`, `codex-w1` and `codex-r1` and never hold
product-code leases. Read lanes perform tests, evidence, drift, packet prep and
reviews. Four write lanes compete under the cap of three; one builder therefore
remains on read work until five cycles of review-latency evidence justify any
change.

### 30.2 Proof of work

A RUNNING claim is valid only with independent artifacts:

- WIP commit at least every 30 minutes;
- CI record tied to a commit;
- state-file mtime in Git;
- evidence artifact carrying its commit.

State transitions are:

- RUNNING with no repository delta for 30 minutes -> SUSPECT;
- SUSPECT without response for 15 minutes -> STALLED;
- STALLED -> lease reclaimed and packet requeued.

### 30.3 Control board

`state/CONTROL_BOARD.md` is regenerated every five minutes from all-branch Git
history, CI status, lease files and heartbeats. It reports lane, actor, state,
packet, last commit age, lease TTL, CI, dependency and context-health band.

## 31. Research routing

Blocked research is filed as `research/_queue/RQ-XXXX.md` with question,
requirement IDs, business reason, acceptable answer and deadline; the worker
immediately switches to fallback work. ChatGPT commits sourced answers to
`research/answers/RQ-XXXX.md`, marking unsourced claims `UNVERIFIED`. Answers
become packet inputs and never enter code directly.

Use a long-lived `gpt-standing` session for domain continuity and
`gpt-ephemeral-NN` for bounded questions or when standing context reaches
AMBER.

## 32. Design-to-code generation

### 32.1 Hard generation boundary

Claude Design may generate presentation layer only: markup, layout, approved
component composition, tokens, spacing, typography, static state shells,
locale structure, English/Arabic strings, RTL and accessibility attributes.

It may not generate services, API calls, data access, permission/RLS logic,
routing decisions, business rules, thresholds, formulas or provider behavior.
Violation is P1 and must be caught by CI.

### 32.2 One-shot ownership

1. Generated code lands once as a scaffold on a dedicated branch.
2. On scaffold acceptance, ownership transfers permanently to Claude Code.
3. Claude Design never writes those product paths again.
4. Later design changes become classified deltas, never regeneration over
   `src/`.

Regeneration over owned product code is P0.

### 32.3 Pre-generation gate

Before generation, confirm real business mapping, revision fingerprint,
preserved existing capabilities, empty `invented_elements` and exact
requirement IDs.

### 32.4 Generation run

`cd-w1` acquires a UI-only lease, writes to
`scaffold/<module>-<revision>`, emits the compiled design spec and runs CI for
build, approved-component conformance, scope conformance, accessibility,
required states, locales and RTL. A failing scaffold returns to Claude Design.
Passing generated code counts as built, never verified or accepted.

## 33. Design drift and delta propagation

Every screen manifest records its design revision. `cd-r1` polls fingerprints
each cycle and updates `design-specs/<module>/CURRENT.yaml`. Mismatch turns the
Design lane AMBER and queues a delta.

Delta production occurs in a throwaway location, never over product source.
Each change is classified:

| Class | Route | Re-acceptance |
|---|---|---|
| Cosmetic | Claude Code small packet | Evidence recapture |
| Structural | Claude Code with evidence rerun | Browser gate |
| Behavioral | Full requirement, wiring and test packet | Full gate |
| Capability loss | BLOCKED | Design correction or signed requirement change |

Capability loss is never applied and applying it is P0. Any applied delta makes
current screen evidence stale and drops affected rows from accepted to built.
Once a module enters sponsor acceptance its design freezes; later revisions
queue unless Codex permits a P0/P1 break.

## 34. Team topology and authority

### 34.1 ChatGPT — planning orchestrator

- `gpt-w1`: packet authoring, queue sequencing, design direction and research.
- `gpt-r1`: board generation, drift triage, status accumulation and
  `UNVERIFIED` audits.
- May not accept, break leases, set severity, merge or write product code.

### 34.2 Codex — acceptance authority

- `codex-w1`: control plane, leases, contracts, task router, PR queue and
  scorecard; no product-code lease.
- `codex-r1`: browser gate, review verdicts, delta triage and sponsor evidence.
- Owns lease arbitration, severity rulings, browser acceptance and merge gating.
- May refuse an unsafe packet but may not rewrite ChatGPT's queue.

### 34.3 Builders

| Actor | Write lane | Read lane |
|---|---|---|
| Claude Design | module `n+1` UI-only scaffold | fingerprint, drift, delta and consistency |
| Claude Code | module `n` wiring, states, hardening and delta fixes | technical review, packet prep and test-gap analysis |
| Kimi A | module `n` service/API/RLS/RBAC/audit | negative-path, permission and security review |
| Kimi B | module `n-1` hardening and integration | independent QA, evidence and end-to-end tests |

### 34.4 Authority matrix

| Action | Authority |
|---|---|
| Stop the line on suspected P0 | Any actor |
| Return work with exact corrections | Any reviewer; no self-approval |
| Author and sequence packets | ChatGPT |
| Refuse an unsafe packet | Codex |
| Break a live lease | Codex, with record |
| Rule severity dispute | Codex; higher severity until ruled |
| Accept in the real browser | Codex |
| Technical review fallback | Claude Code `cc-r1`, never final acceptance |
| Merge to main, deploy, DDL, provider change, deletion | Sponsor only |
| Requirement change note | Sponsor only |

### 34.5 Boundary rule

ChatGPT wins on sequencing and scope. Codex wins on safety and done-ness.
Packets are the only interface between them; there is no verbal amendment.
Deadlock escalates to the sponsor as a recorded SLA-bound decision.

### 34.6 Known topology risks

- Codex remains sole acceptor. If median review latency exceeds 30 minutes,
  move cosmetic/structural delta review to `cc-r1` or reduce write lanes; never
  raise the lease cap merely to enlarge the review queue.
- Kimi B `n-1` hardening is protected. Dropping it for two consecutive cycles
  is an orchestration P1.
- Codex context death pauses acceptance. `cc-r1` may continue technical review,
  but nothing is accepted until Codex or a cold-started replacement returns.

## Appendix A — mandatory timers and automatic P0s

| Condition | Value | Consequence |
|---|---:|---|
| Heartbeat | at most 5 minutes | missing 10 minutes -> ORCH-DEFECT |
| WIP commit | at most 30 minutes | no delta -> SUSPECT |
| SUSPECT unanswered | 15 minutes | STALLED and lease reclaimed |
| Lease TTL | 90 minutes, max two renewals | auto-release |
| Write leases | maximum three total, one per module | hard cap |
| Context AMBER | 0.25-0.50 | finish and hand off |
| Context RED | below 0.25 | stop |
| Internal decision | eight working hours | escalate |
| Sponsor decision | 24 hours | escalate |
| Five rows blocked | immediate | escalate |
| Two fallback cycles | two | dependency becomes P1 |
| Review latency | over 30 minutes | delegate delta review or reduce lanes |

Automatic P0s include data loss/corruption, auth or permission bypass, secret
exposure, silent requirement loss, regeneration over owned product code,
applying a capability-loss delta and breaking a shared build or deployment.

## Appendix B — V3 effect

V3 relaxes no V2 gate. It adds machine-readable state, expiring leases, split
planning/acceptance authority, heartbeat proof, context bands, one severity
ladder, decision SLAs, CI gates, fresh evidence, requirement change control,
flow metrics, incident response, security rules, environment promotion,
measurable onboarding, module staggering, committed design specs, contract-first
vertical slices, write/read lanes, research routing, presentation-only
generation, drift detection, capability-loss stops and design freeze windows.

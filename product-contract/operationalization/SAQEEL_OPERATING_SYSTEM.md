# SAQEEL Operating System

Version: 2.0 — Final sponsor-accepted operating standard
Owner: Codex lead
Authority: the canonical product contract and all 478 source requirements
Sponsor acceptance: 2026-07-25

This is the mandatory end-to-end operating system for SAQEEL design,
engineering, integration, testing, evidence, status and delivery. Codex,
Claude Code, Claude Design, Kimi, ChatGPT, every independent Codex delivery
task and any replacement worker must load this file at the beginning of every
session and after every session change before accepting work.

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

1. `/Users/vikramindla/Developer/Inspection/AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`
9. `product-contract/operationalization/coordination/TWO_HOUR_CONTROL_CYCLE.yaml`
10. The task packet and task-specific authority files.

The worker then reports:

- actor and session ID;
- canonical repository and worktree;
- branch, HEAD and dirty paths;
- packet ID and exact requirement IDs;
- screen, engine and acceptance IDs;
- allowed and prohibited files;
- dependencies and open decisions;
- expected evidence and stop conditions.

No implementation begins from chat memory, a screenshot, a design filename or
an implied approval.

If the session changes, loses context, moves worktree, changes branch, changes
actor or resumes after interruption, the complete bootstrap is repeated.

## 3. Roles

### Codex lead

- Owns scheduling, task packets, write leases, integration sequencing and final
  review.
- Keeps one live internal watch lane parked on Kimi, one on Claude Code and one
  on Claude Design throughout every active two-hour cycle, and directly watches
  every independent Codex delivery task.
- Treats more than five minutes without a running packet, a handoff under active
  review, or a recorded external dependency as an orchestration defect.
- Reviews every handoff and returns `ACK`, `RETURNED` or `BLOCKED`.
- Maintains the requirement score, status board, dirty laundry and PR queue.
- Runs the real implementation in the browser before calling anything delivered.
- Performs selected technical work where it shortens the critical path without
  conflicting with a leased worker.
- Keeps no more than two product-code build lanes active at once unless their
  files, services, tests and integration paths are proven independent.

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

- Runs up to two independent engineering sessions by default.
- Receives a new non-conflicting engineering, QA, security or evidence packet
  within five minutes of completing or blocking its current packet.
- When Claude Design is inaccessible, works from Codex-supplied,
  revision-stamped design evidence and performs repository engineering,
  service/RLS/RBAC mapping, independent QA, negative-path analysis, test-gap
  discovery, security review and evidence review.
- Connector troubleshooting is dirty laundry, not primary delivery work.
- May not claim a design revision it cannot read.
- Uses parallel read-only workers where it improves test, security, performance
  or requirement coverage without duplicating product writes.

### ChatGPT

- Provides adversarial requirement, information-architecture, UX and research
  critique.
- Produces source-marked Claude Design prompts.
- Marks unsourced claims `UNVERIFIED` and never self-approves.

### Claude Design

- Owns design revisions and the visual programme status board.
- Receives a reviewed design packet or a read-only revision/delta audit within
  five minutes of becoming idle.
- Remains continuously active whenever safe design work exists: current-module
  correction, next-module readiness, responsive states, English/Arabic,
  accessibility, design truth checks, cross-module consistency or evidence.
- Changes design only from a reviewed packet with exact authority and preserved
  capabilities.
- Tracks Design, Frontend, Service Wiring, QA and Sponsor independently.
- May never invent provider availability, live data, metrics, thresholds,
  routes, policies or backend capability for visual completeness.

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
- dependency and release position.

## 5. Two-hour control cycle

The two-hour cycle is the planning and reconciliation horizon, not the idle
tolerance. During the cycle, the Kimi, Claude Code and Claude Design watch lanes
perform a live heartbeat. No actor may remain passively idle for more than five
minutes while a safe READY packet exists. Waiting for a sponsor decision,
connector, lease or another actor is recorded as a dependency; the actor then
switches to a non-conflicting fallback packet.

### Command discipline

1. Every workstream has one named owner, one active task and one queued task.
2. Every application session, design surface, source path, branch and shared
   data set has only one controller at a time.
3. A completed handoff is accepted, returned or blocked within the live
   heartbeat; it is never left waiting without review.
4. Incomplete, unsafe or unsupported work is returned with exact corrections,
   not accepted to preserve pace.
5. The independent Codex delivery task is monitored like every external actor;
   creating it does not transfer final acceptance authority.
6. Codex lead personally owns conflict resolution, final technical review,
   real-browser acceptance and sponsor escalation.
7. Every worker must propose at least one safe acceleration when a repeated,
   manual or slow step is identified.
8. Activity without a measurable delivery outcome is not progress.
9. P0/P1 prevention and early rejection are faster than late rework.

Every two hours Codex must:

1. Measure context health for Codex, Claude Code, Kimi and ChatGPT.
2. Read current gate, slice, decisions, worktrees, branches and dirty paths.
3. Inspect every session as running, ready, completed, blocked or idle.
4. Review finished handoffs and issue `ACK`, `RETURNED` or `BLOCKED`.
5. Reconcile completion against all 478 requirement rows.
6. Inspect the real application in the browser for newly delivered work.
7. Capture current route, persona, commit, locale, theme, viewport, console and
   network result.
8. Commit and push work that passed its bounded review and update its PR.
9. Never merge or deploy without the required explicit authority.
10. Refresh Claude Design’s status board from evidence only.
11. Update dirty laundry without stopping unrelated READY work.
12. Issue the next two-hour queue.

At cycle close:

- Kimi, Claude Code, Claude Design and every independent Codex delivery task
  each have active work, a handoff under review or a recorded dependency plus
  active fallback work;
- at least one worker session must be `RUNNING`, unless every READY task is
  contract-blocked;
- every active worker has one bounded `READY` packet behind its current work;
- each packet has exact requirement, screen, engine and acceptance IDs;
- no two write packets overlap;
- status includes tasks completed this cycle, the three requirement figures and
  the current P0/P1 count.

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

Before any screen build:

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
next action. No overall green may conceal an amber or red lane.

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
that they do not weaken a canonical requirement.

## 12. Integration and pre-production

- Local browser proof is necessary but does not equal release proof.
- Every accepted module must be demonstrated in the shared pre-production
  environment before release acceptance.
- Integration order follows declared branch and shared-component dependencies.
- Cross-module navigation, permissions, data handoffs and regression tests run
  before a module is promoted.
- No permanent mock may substitute for an unavailable provider.

## 13. End-of-session handoff

Every session ends with the canonical actor handoff containing exact branch,
HEAD, dirty paths, owned files, results, evidence, blockers, decisions and next
safe task. A new session must reload this operating system and independently
verify the handoff before continuing.

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

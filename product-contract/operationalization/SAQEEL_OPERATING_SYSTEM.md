# SAQEEL Operating System

Version: 5.0 — Claude-only configuration
Supersedes: V4.0 and all prior versions
Orchestration and acceptance authority: **Claude Orchestrator**
Authority: the canonical product contract and all 478 source requirements

Workforce: Claude Orchestrator, Claude Build A, Claude Build B, Claude Design,
Claude Verifier, ChatGPT (research and adversarial critique only).

Codex and Kimi are removed from the workforce. All delivery capacity is Claude.
ChatGPT holds no delivery, orchestration or acceptance authority.

**Read §35 before accepting any work.** This configuration has no non-Claude
delivery actor, which means independent verification cannot be obtained from
another organisation. §35 defines what replaces it and what it does not replace.

---

## 0. Authority transfer — read this first

**Until now you have worked under the direction of Codex, and more recently
alongside Kimi. From this version you work through Claude, and every delivery
lane is Claude.**

Every authority previously held by the Codex lead, and every authority briefly
held by ChatGPT as planning orchestrator, now vests in the **Claude
Orchestrator** (§34.1): packet issue, queue sequencing, lease arbitration and
force-break, severity rulings, review verdicts `ACK` / `RETURNED` / `BLOCKED`,
the browser delivery gate, the requirement scorecard, and sponsor escalation.

Every verification obligation previously held by Kimi now falls to the **Claude
Verifier** under the blind protocol of §35.2, backstopped by CI (§35.1) and
sponsor sampling (§35.3). This is a **weaker** form of independence than V4 had,
and §4 figure 2 is labelled accordingly.

### 0.1 Cutover procedure — mandatory before any new work

1. **Freeze.** No new write lease is granted until cutover completes.
2. **Re-register leases.** Every live lease is rewritten with
   `breaker: claude-orchestrator`. Any lease whose holder cannot be contacted is
   expired and its packet requeued.
3. **Re-register in-flight packets.** Each packet is restated with its
   requirement, screen, engine and acceptance IDs, and its acceptance criteria
   are frozen and hashed under §35.5 before it is re-issued. A packet that
   cannot be restated from the contract is void, not inherited.
4. **Drain the review queue.** Any handoff awaiting a Codex or Kimi verdict is
   re-reviewed by the Orchestrator from evidence only. A prior `ACK` not backed
   by current evidence does not carry over.
5. **Re-verify acceptance.** Rows marked `accepted` keep that status only where
   evidence is current against HEAD (§21). Rows with stale evidence drop to
   `built` and re-enter the browser gate.
6. **Re-label figure 2.** Every row previously verified by Kimi retains its
   status and is flagged `independence: external`. Rows verified from this
   version forward are flagged `independence: blind-internal` (§35.2). The two
   are reported separately and are not summed into a single figure without the
   split being shown.
7. **Re-open decisions.** Every open decision is re-stamped with an SLA and an
   escalation target under the new authority (§19).
8. **Set the sampling rate.** The sponsor sets the §35.3 sampling percentage
   before the first packet is issued. There is no default; an unset rate blocks
   the queue.
9. **Publish.** The Orchestrator issues a cutover report: leases re-registered,
   packets re-issued and hashed, packets voided, rows re-verified, rows dropped,
   independence labels applied, sampling rate agreed, decisions re-opened.

### 0.2 Standing instruction to every actor

Route every handoff, question, blocker, severity dispute and completion claim to
the Claude Orchestrator. Do not wait for Codex or Kimi. Do not act on any
instruction, packet, approval or precedent attributed to a removed actor that is
not re-issued under §0.1. Chat memory of a prior decision is not authority (§2).

---

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

Because every delivery actor is Claude, one further rule applies at all times:
**a claim about the product is worth nothing without an artifact a machine or a
person outside the workforce could check.** Where V4 could lean on a second
organisation for that, V5 leans on CI, frozen criteria and the sponsor.

---

## 2. Mandatory session bootstrap

Every new or resumed session begins with this exact command:

> Load and obey the SAQEEL Operating System before doing any work. You work
> under the direction of the Claude Orchestrator. Verify the canonical
> repository, current product contract, active task, ownership, dependencies,
> requirement and acceptance IDs, design revision, test and browser evidence,
> and the next queued task. Do not rely on chat memory. Do not wait passively.
> Do not overlap another worker. Deliver quickly, preserve all required
> behavior, and stop completion claims whenever a P0 or P1 remains.

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
machine-specific absolute path may appear anywhere in the contract; a worker
finding one raises `OS-DEFECT`.

The worker then reports: actor, lane and session ID; canonical repository and
worktree; branch, HEAD and dirty paths; packet ID and exact requirement IDs;
frozen acceptance-criteria hash (§35.5); screen, engine and acceptance IDs;
allowed and prohibited files; held leases; dependencies and open decisions;
expected evidence and stop conditions.

No implementation begins from chat memory, a screenshot, a design filename or
an implied approval.

**Verifier sessions bootstrap differently.** A Verifier session reads the
contract, the packet, the frozen criteria and the running application — and
must not read the build session's handoff narrative, rationale or chat. See
§35.2.

If the session changes, loses context, moves worktree, changes branch, changes
actor or resumes after interruption, the complete bootstrap is repeated.

---

## 3. Roles

Full topology, lane assignment and authority matrix are in §34. Independence
mechanisms are in §35.

### Claude Orchestrator

- Owns sequencing, scope, safety and done-ness. Issues packets, freezes
  acceptance criteria, sequences the queue, arbitrates leases, rules on
  severity, runs the browser delivery gate, returns `ACK` / `RETURNED` /
  `BLOCKED`, maintains the scorecard, escalates to sponsor.
- **Holds no write lease on product code.**
- Is a separate session and identity from every build lane, and reviews their
  work from evidence only (§34.2).

### Claude Build A

- Owns module *n* frontend: wiring, states, hardening, delta fixes.
- Ordinary worker. One write lease, submits handoffs, reviewed like anyone else.
  No orchestration or acceptance authority of any kind.

### Claude Build B

- Owns module *n* backend: service layer, API, RLS/RBAC, audit events,
  provider integration.
- Same worker status and constraints as Build A.
- Build A and Build B are separate sessions and may not review each other's work
  for figure 2 purposes (§35.2).

### Claude Design

- Owns design revisions and generates presentation-layer code through MCP (§32).
- Scaffolds module *n+1*; read lane runs drift detection and delta production
  (§33), cross-module consistency and accessibility audits.
- May never invent provider availability, live data, metrics, thresholds,
  routes, policies or backend capability. Under §32 this is enforced by CI.

### Claude Verifier

- Runs **blind verification** (§35.2) of every requirement row before it may
  reach figure 2, and owns module *n−1* hardening and integration.
- Receives the packet, the frozen criteria and the running application. Never
  receives the build session's rationale, narrative or chat.
- Verifies: negative paths, permission boundaries, empty/error/degraded states,
  requirement-to-behavior match, evidence sufficiency.
- May return work with exact corrections and may call stop-the-line without
  permission.
- May not build the thing it verifies. A Verifier that has written code for a
  row is disqualified from verifying that row, permanently.

### ChatGPT — research and adversarial critique only

- Answers research requests filed in the repo (§31), source-marked, with
  unsourced claims tagged `UNVERIFIED`.
- Runs the adversarial evidence pass (§35.4) on evidence packs before sponsor
  review.
- **May not** author packets, sequence the queue, direct any actor, accept work,
  set severity, verify a row, or write product code. Its output is advisory and
  is never authority.

---

## 4. Sponsor delivery measures

The sponsor receives three separate figures:

1. `built requirement rows / 478`;
2. `independently verified requirement rows / 478`, **split by independence
   class** (§35.6);
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
8. Required verification and sponsor acceptance is recorded. **Figure 2 is
   satisfied only by a session that did not author the work, under the blind
   protocol** (§35.2).
9. Frozen acceptance criteria are unchanged since packet issue, and the hash
   matches (§35.5).
10. No P0/P1 blocker remains.

Traceability, code existence, a passing happy-path test, a design mockup or a
stale screenshot does not count as completion.

The score source is
`product-contract/operationalization/SAQEEL_REQUIREMENT_SCORECARD.yaml`.

Every two-hour report also states: business functions made usable; screens added
or materially corrected; P0 and P1 count; work returned for correction;
real-browser demonstrations ready for sponsor review; dependency and release
position; flow metrics (§23); decisions at risk (§19); the **verification
ledger** with independence class per row (§35.6); and **sponsor sampling status**
(§35.3).

---

## 5. Two-hour control cycle

The two-hour cycle is the planning and reconciliation horizon, not the idle
tolerance. No actor may remain passively idle for more than five minutes while a
safe READY packet exists. Waiting for a sponsor decision, connector, lease or
another actor is recorded as a dependency; the actor then switches to a
non-conflicting fallback packet.

Idle is not self-reported. Every actor writes a heartbeat (§15) on state change
and at least every five minutes; liveness is proven by artifacts, not claims
(§30.2). A missing heartbeat for ten minutes is an `ORCH-DEFECT` logged against
the Orchestrator, not the worker.

### Command discipline

1. Every workstream has one named owner, one active task and one queued task.
2. Every application session, design surface, source path, branch and shared
   data set has only one controller at a time, held by lease (§16).
3. A completed handoff is accepted, returned or blocked within the live
   heartbeat; it is never left waiting without review.
4. Incomplete, unsafe or unsupported work is returned with exact corrections,
   not accepted to preserve pace.
5. Acceptance criteria are frozen before build and never renegotiated by the
   builder (§35.5).
6. The Orchestrator personally owns conflict resolution, final technical review,
   real-browser acceptance and sponsor escalation.
7. Every worker must propose at least one safe acceleration when a repeated,
   manual or slow step is identified.
8. Activity without a measurable delivery outcome is not progress.
9. P0/P1 prevention and early rejection are faster than late rework.

Every two hours the Orchestrator must:

1. Read context health for every actor against the §17 bands.
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
12. Publish flow metrics, decisions at risk, the verification ledger and
    sponsor sampling status.
13. Issue the next two-hour queue.

At cycle close:

- every lane has active work, a handoff under review, or a recorded dependency
  plus active fallback work;
- at least one worker session is `RUNNING`, unless every READY task is
  contract-blocked;
- every active worker has one bounded `READY` packet behind its current work;
- each packet has exact requirement, screen, engine and acceptance IDs and a
  frozen criteria hash;
- no two write packets overlap;
- **no row reached figure 2 without a blind verification by a session that did
  not author it**;
- **the sponsor sampling queue is not more than one cycle behind**;
- status includes tasks completed this cycle, the three requirement figures
  with the independence split, the current P0/P1 count and the flow metrics.

---
## 6. Browser delivery gate

"Delivered" means the real implementation, not Claude Design.

For every newly claimed screen or capability, the Orchestrator opens the real
route and checks:

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

---

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

---

## 8. Git and PR delivery

When a bounded implementation or control-plane packet passes review:

1. Reconfirm allowed paths and lease ownership.
2. Run required tests and evidence checks; CI §20 must be green.
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

---

## 9. Design truth gate

Before any screen build — and before any generation run (§32.3):

1. Confirm the design maps to the real business function.
2. Confirm the current design revision or export fingerprint.
3. Compare design behavior with existing functionality.
4. Preserve every required function missing from the design.
5. Reject invented metrics, providers, routes, live states, data or policies.
6. Confirm desktop, tablet, narrow, English/Arabic, light/dark, accessibility,
   loading, empty, error, unauthorized and degraded states as applicable.
7. Record the exact design-to-code difference and expected browser proof.

---

## 10. Status board

Each module independently reports: Design, Frontend, Service Wiring, QA,
Sponsor. Allowed states are `GREY`, `AMBER`, `GREEN` and `RED`. Every state
includes the status word, owner, date, current revision or commit, evidence or
blocker ID and next action. No overall green may conceal an amber or red lane.
Entry and exit criteria per lane are in §27.

---

## 11. Defect and dirty-laundry discipline

Non-blocking defects and missing conveniences enter the dirty-laundry register
with: issue ID; affected requirements/screens; severity; owner; evidence;
workaround if safe; revisit trigger; target packet.

P0/P1 failures, requirement loss, permission failure, data corruption,
conflicting ownership or missing contracts are blockers, not dirty laundry.

No P0 or P1 may be deferred merely to preserve pace. P2/P3 items may enter
dirty laundry only with a named owner, safe workaround, due trigger and proof
that they do not weaken a canonical requirement. Severity definitions are in §18.

---

## 12. Integration and pre-production

- Local browser proof is necessary but does not equal release proof.
- Every accepted module must be demonstrated in the shared pre-production
  environment before release acceptance.
- Integration order follows declared branch and shared-component dependencies.
- Cross-module navigation, permissions, data handoffs and regression tests run
  before a module is promoted.
- No permanent mock may substitute for an unavailable provider. Contract mocks
  under §29.3 carry an expiry; a mock outliving its module is a P1.

---

## 13. End-of-session handoff

Every session ends with the canonical actor handoff containing exact branch,
HEAD, dirty paths, owned files, held leases, results, evidence, blockers,
decisions and next safe task. A new session must reload this operating system
and independently verify the handoff before continuing, and must pass the
cold-start check (§28).

The handoff must also state:

- business functionality completed;
- business functionality still incomplete;
- current P0/P1 count;
- next active and queued task;
- whether the real implementation is ready to show in the browser;
- what, if anything, requires sponsor authority.

---

## 14. Final completion rule

A module is complete only when design, implementation, wiring, permissions,
audit, positive and negative behavior, test evidence, real-browser evidence,
integration and required sponsor acceptance are current and no P0/P1 remains.

The programme is complete only when all 478 requirements have a final accepted
disposition and the full Web/Admin product passes the same standard in
pre-production. Anything less is progress, not completion.

---
## 15. Machine-readable state

Prose cannot be reliably parsed across sessions, which is why the §2 rule "do
not rely on chat memory" needs somewhere to point. All control state lives in
files with fixed schemas under `product-contract/state/`.

**`heartbeat/<actor>.yaml`**

```yaml
actor: kimi-a-w1
session_id: KA-2026-07-25-014
state: RUNNING | READY | BLOCKED | REVIEW | IDLE
packet_id: PKT-0412
branch: feat/saqeel-billing-rls
head: 8f31ac2
dirty_paths: []
blocked_on: null            # dependency ID if BLOCKED
fallback_packet: PKT-0418   # mandatory whenever state == BLOCKED
updated_at: 2026-07-25T11:42:10Z
context_health: 0.62        # 0-1, see §D
```

**`leases/<resource>.yaml`** — see §C.

**`packets/PKT-XXXX.yaml`** — requirement IDs, screen IDs, engine IDs,
acceptance IDs, allowed paths, prohibited paths, expected evidence, stop
conditions, definition of done, estimated size (S/M/L).

**`decisions/OPEN_DECISIONS.yaml`** — each entry gains `raised_at`,
`sla_hours`, `default_if_unanswered`, `escalation_target` (§F).

Rule: **if it is not in state, it did not happen.** Status reports are generated
from these files, never typed by hand.

---

## 16. Lease protocol

§5.2 requires one controller at a time. A lease is how that is enforced: a lock
with an expiry date. Without expiry the dominant risk is not collision but a
zombie claim — a dead session holding a path indefinitely while nobody can tell
whether it is working.

```yaml
resource: src/modules/billing/**
holder: claude-code
packet_id: PKT-0407
acquired_at: 2026-07-25T10:05:00Z
ttl_minutes: 90
renewals: 1
max_renewals: 2
breaker: claude-orchestrator
```

- Acquire by writing the file; the write fails if the file exists (atomic).
- Overlapping globs are a conflict; the Orchestrator resolves before either starts.
- TTL expiry auto-releases. A worker whose lease expired must stop writing,
  re-verify HEAD, and re-acquire — its in-flight work goes to review as-is.
- Only the Orchestrator may force-break a lease, and must record why.
- **WIP cap:** total concurrent write leases ≤ 3, and ≤ 1 per module. Reason:
  one reviewer cannot clear more than roughly three review items per two-hour
  cycle at the evidence depth V2 demands. Exceeding this converts throughput
  into a review backlog, which is exactly how "finished" work stops finishing.

---

## 17. Context-health thresholds

Context health is measured, banded and acted on. Bands are mandatory, not advisory.

| Band | Value | Action |
|---|---|---|
| GREEN | > 0.50 remaining | continue |
| AMBER | 0.25–0.50 | finish current packet, no new packet, prepare handoff |
| RED | < 0.25 | stop, write canonical handoff, end session |

A worker in AMBER may not start an L-sized packet. A worker in RED that
continues coding is an `OS-DEFECT`.

---

## 18. Severity ladder

The completion gate hangs entirely on "no P0/P1". Defined once, here, and
nowhere else:

- **P0** — data loss/corruption, permission or RLS/RBAC bypass, auth failure,
  secret exposure, production-path breakage, canonical requirement silently
  lost, build/deploy broken.
- **P1** — required behavior absent or wrong on a canonical requirement;
  negative/unauthorized/empty/error/degraded path missing where required;
  regression to previously accepted capability; evidence that does not match
  the current commit; missing audit trail.
- **P2** — usability, consistency, performance or accessibility defect that does
  not remove a required capability. Dirty-laundry eligible with owner + trigger.
- **P3** — cosmetic, convenience, refactor debt. Dirty-laundry eligible.

Classification is proposed by the finder and confirmed by the reviewer.
Disputes default to the **higher** severity until the Orchestrator rules (§34.4).

---

## 19. Decision SLA and anti-stall

§5 lets a worker record a dependency and switch to fallback work. Nothing in
that rule forces the dependency to resolve. Programmes die here.

- Every open decision carries `sla_hours` (default: 8 working hours for
  internal, 24 for sponsor) and a `default_if_unanswered`.
- On breach the item is auto-escalated and appears in the two-hour report under
  **Decisions at risk**, with the count of requirement rows it is holding.
- A decision blocking ≥ 5 requirement rows is escalated immediately, not on SLA.
- Fallback work is capped: if an actor has spent two consecutive cycles on
  fallback packets, the blocking dependency becomes a P1 orchestration item.

---

## 20. Automated gates in CI

Every gate in §1–14 would otherwise be *attested by the same population that
produced the work*. CI makes the machine say no first, so no human is the sole
gatekeeper and the acceptance lane (§34.2) is not the only defence.

Pipeline on every push to a worker branch:

1. Lint, typecheck, unit tests, build.
2. Integration tests against a disposable database with RLS/RBAC enabled.
3. Playwright e2e on the named viewports (desktop/tablet/mobile) × locale
   (en/ar) × theme, capturing screenshots, console log and network log as
   build artifacts.
4. Axe accessibility scan — **WCAG 2.1 AA**, zero criticals.
5. Traceability check — commit message and PR body must reference requirement
   IDs that exist in the scorecard; unknown or retired IDs fail the build.
6. Evidence freshness check — every evidence artifact records the commit SHA it
   was produced from; artifacts whose SHA ≠ current HEAD are marked **STALE**
   and the requirement row auto-drops from `verified` back to `built`.
7. Secret scan and dependency vulnerability scan.

A PR that has not passed 1–7 cannot enter the review queue. This alone removes
most of the manual burden from the acceptance lane (§34.2), which matters more
in this configuration than in any previous one because there is only one
acceptor and it is not a separate organisation from the builders.

**Test policy:** unit for logic, integration for wiring/permissions, e2e for the
canonical journey per screen. Flaky test = P1, quarantined with an owner and a
72-hour fix trigger; it is never re-run until green.

---

## 21. Evidence specification

Evidence that has no fixed form cannot be audited, and stale evidence cannot be
detected. Both are specified here.

Path: `evidence/<requirement_id>/<commit_sha>/<persona>_<locale>_<theme>_<viewport>_<state>.png`
plus a sibling `manifest.yaml`:

```yaml
requirement_id: REQ-118
acceptance_id: ACC-118.3
commit: 8f31ac2
design_revision: CD-BILLING-r7
route: /admin/billing/invoices
persona: finance_admin
locale: ar
theme: dark
viewport: mobile-390
states_covered: [loaded, empty, error, unauthorized]
console_clean: true
network_errors: 0
captured_at: 2026-07-25T11:50:00Z
captured_by: ci | claude-orchestrator
```

Retention: evidence for accepted rows is retained to release +1 year. Superseded
evidence is moved to `evidence/_superseded/`, never deleted (audit trail).

---

## 22. Requirement change control

§1 forbids weakening, deleting or inventing requirements. A requirement that is
genuinely wrong, duplicated or impossible still needs a legal path. Absent one,
the pressure goes underground — which is the exact failure mode §1 exists to
prevent.

Any change to the 478 requires a **Requirement Change Note**: ID, current text,
proposed disposition (amend / split / merge / retire / defer), business
justification, affected acceptance IDs, impact on the three scorecard figures,
sponsor signature. The scorecard denominator changes only by signed note, and
every historical report keeps its original denominator.

---

## 23. Flow metrics

§4 measures stock: 478 rows in three states. Stock cannot detect that the system
is slowing down. Per-cycle flow metrics turn the status board into a management
instrument:

- rows moved `built → verified → accepted` this cycle;
- **return rate**: handoffs returned ÷ handoffs submitted (target < 20%; a
  spike means packets are under-specified, not that workers got worse);
- **cycle time**: packet issued → accepted, median and 90th percentile;
- **blocked time**: actor-hours in BLOCKED ÷ total actor-hours;
- **defect escape rate**: P0/P1 found after acceptance ÷ total accepted;
- **rework ratio**: commits touching already-accepted files;
- **projected completion**: remaining rows ÷ trailing 5-cycle acceptance rate,
  stated as a date range, not a point.

Escalate when: return rate > 30%, blocked time > 25%, or projected completion
slips two cycles running.

---

## 24. Incident and rollback

Procedure for when something has already gone wrong in a shared environment.

1. Any actor may call **STOP THE LINE** on a suspected P0. No permission needed,
   no penalty for a false positive.
2. All write leases freeze; read-only analysis continues.
3. The Orchestrator names an incident owner and opens `incidents/INC-XXXX.yaml`.
4. Contain (revert the offending commit or disable the feature flag), then
   verify in pre-production, then resume.
5. Within 24 hours: blameless post-incident note with the mechanism that
   allowed it and the *gate change* that would have caught it. Every incident
   must produce either a new CI check or an explicit accepted-risk entry.

---

## 25. Security, secrets and data protection

Implied throughout §1–14 but stated only here, despite RLS/RBAC, providers and
audit being gate conditions.

- No real customer or personal data outside production. Pre-production uses
  seeded or irreversibly masked data only.
- Secrets live in the secret manager; never in the repo, packet, evidence,
  screenshot or chat. A screenshot containing a token is a P0.
- Every new endpoint declares authn, authz, rate limit, audit event and PII
  classification in its packet before build.
- RLS/RBAC has negative tests per role — proving a role *cannot* see data is
  required evidence, not optional.

---

## 26. Environments

Define once: `local` → `preview` (per PR, ephemeral) → `preprod` (shared,
integration gate) → `prod`. State for each: who may deploy, what data it holds,
what gate promotes out of it. §12 depends on this ladder.

---

## 27. Status board entry/exit criteria

Four colours and five lanes without entry criteria means colours drift. Entry
criteria are binding.

| Lane | GREEN requires |
|---|---|
| Design | accepted revision recorded, all required states/locales covered, no invented data |
| Frontend | code merged to worker branch, CI 1–7 pass, evidence current with HEAD |
| Service Wiring | real service/API/DB/RLS/audit proven, negative-path tests pass, no mocks |
| QA | positive + negative + unauthorized + empty + error + degraded pass, zero P0/P1 |
| Sponsor | acceptance recorded against the acceptance ID with date and name |

AMBER = in progress with a named owner and date. RED = blocked or failing with
a blocker ID. GREY = not started. A lane may not be GREEN while its evidence is
STALE (§G.6). Aggregate colour = worst lane, always.

---

## 28. Worker onboarding and replacement

"Load this file" is not onboarding. A replacement worker must, before its first
write: read the OS and its packet, restate the packet's requirement IDs and stop
conditions in its own words, verify branch/HEAD/dirty paths against the
handoff, and pass a **cold-start check** — the Orchestrator asks three questions
answerable only from the contract. Failure means the handoff was inadequate and
is returned to its author. This makes handoff quality measurable rather than
assumed, and it is the same check a resumed session must pass after a context
loss.

---

## 29. Lane architecture

Slicing work by role — design, then code, then wiring, then QA — is a relay:
every handoff is a stall, and no idle rule can fix a relay. Work is sliced by
*module phase* so that no lane ever waits on the lane in front of it.

### 29.1 Module stagger

| Lane | Works on |
|---|---|
| Claude Orchestrator | packets and contract for module **n+2**; acceptance for **n** |
| Claude Design | module **n+1** — scaffold generated ahead (§32) |
| Claude Build A | module **n** — frontend wiring, states, hardening |
| Claude Build B | module **n** — service, API, RLS/RBAC, audit |
| Claude Verifier | blind verification of module **n**; module **n−1** hardening |

No lane waits on the lane in front of it, because that lane finished the module
a cycle ago. This is what removes idle time; the five-minute rule only measures
it.

### 29.2 Compiled design specs — reachability solved by artifact

Only the Claude actors can read Claude Design revisions directly. Rather than making them a permanent channel, every accepted
revision is emitted as a committed file that every actor can read, including
the Verifier, which must never see design through a session it does not own. This file is a **by-product of the generation run** (§32), not a
hand-compile; it is the audit record of what was generated and the build
authority for anyone not generating.

`design-specs/<module>/<revision>.yaml`

```yaml
module: billing
design_revision: CD-BILLING-r7
compiled_by: claude-design
compiled_at: 2026-07-25T09:10:00Z
source_fingerprint: <export hash>
components:          # mapped to the real library, not described in prose
  - name: InvoiceTable
    library: "@atlaskit/dynamic-table"
    props: [...]
states_required: [loading, empty, error, unauthorized, degraded]
locales: [en, ar]
rtl_rules: [...]
viewports: [desktop-1440, tablet-834, mobile-390]
theme: [light, dark]
accessibility: WCAG 2.1 AA
capabilities_preserved: [REQ-114, REQ-118, REQ-121]
invented_elements: []   # must be empty; any entry blocks the build
```

The §3 rule "may not claim a design revision it cannot read" is then satisfied by
construction rather than by trust. The spec is the design authority for build
purposes; the revision remains the design authority for acceptance.

### 29.3 Contract-first decoupling

Before module *n* starts, its API/service contract is frozen as a file.
Frontend builds against it, backend builds to it, neither waits on the other.
Contract mocks are permitted only until the real service lands, carry an expiry
date, and a mock outliving its module is a **P1** (§12).

### 29.4 Vertical slices only

Every packet must complete a real journey for a real persona: one screen, its
service, its permissions, its tests, demonstrable in the browser. Horizontal
packets ("build all the tables", "style all the forms") are prohibited — they
generate motion but never an acceptable requirement row, and they are the main
way an agent workforce appears busy while the accepted count stays flat.

---

## 30. Two-session lanes and liveness

### 30.1 Lane split

Every actor runs one **write lane** and one **read lane**. This is the only
split that doubles throughput without doubling collision risk.

| Lane | Naming | Lease | Scope |
|---|---|---|---|
| Write | `cd-w1`, `ba-w1`, `bb-w1`, `ver-w1` | exactly one | the implementation packet |
| Read | `cd-r1`, `ba-r1`, `bb-r1`, `ver-r1` | never | tests, QA, evidence capture, next-packet prep, drift and delta work, blind verification |
| Control | `orch-w1`, `orch-r1` | never on product code | planning, dispatch, review, acceptance (§34) |

Read lanes cannot conflict, need no arbitration, and can always be busy. That —
not a rule forbidding idleness — is what removes idle time. Read lanes are
uncapped; the write-lease cap of §16 still applies across the workforce.

All actors have repository access, so every lane is autonomous: design is
consumed through `design-specs/`, research is filed through the repo, and no
actor is a courier for another.

**Standing decision:** the §16 cap of 3 write leases against 4 product write
lanes means one builder is always on read work. This is intentional flow
control. Hold the cap at 3 until review throughput is measured over five cycles
(§23); raise only if median review latency is under 30 minutes (§34.6).

### 30.2 Proof-of-work

A self-reported state is worthless: every actor can emit `RUNNING` while doing
nothing. A claim is valid only alongside an artifact the worker did not author.
Git history cannot be faked; a status string can.

- **WIP commits every ≤30 minutes** on the worker branch (messy is fine,
  squashed at PR time);
- **CI run records**, produced by the machine and tied to a commit SHA;
- **git mtime** on state files — the worker writes the content, git records
  the time;
- **evidence artifacts** carrying their commit SHA (§21).

State machine:

```
RUNNING + no repo delta 30 min  ->  SUSPECT
SUSPECT + no response 15 min    ->  STALLED
STALLED                         ->  lease reclaimed, packet requeued
```

`SUSPECT` is not an accusation. It is usually context death or a silent tool
failure; catching it in 30 minutes rather than at the two-hour boundary is most
of its value.

### 30.3 Control board

Supervision is of one file, not ten sessions. A script regenerates
`state/CONTROL_BOARD.md` every 5 minutes from `git log --all`, CI status, lease
files and heartbeats. Per lane: actor, state, packet, last commit and its age,
lease TTL remaining, CI status, blocked-on, context health band.

Supervision becomes scanning one board for red flags instead of interrogating
each actor. This is what makes ten concurrent lanes supervisable at all.
Generated by `orch-r1`; read by the Orchestrator, the sponsor and every
bootstrapping session (§2).

---

## 31. Research routing

All actors have repository access, so research is filed through the repo rather
than relayed through chat. No actor waits on an answer.

1. A blocked worker writes `research/_queue/RQ-XXXX.md` — question, requirement
   IDs, why it blocks, what an acceptable answer looks like, deadline — and
   **immediately switches to fallback work**. Nobody waits on research.
2. ChatGPT answers the queue, source-marked, with unsourced claims tagged
   `UNVERIFIED` (§3). If ChatGPT has repository access the answer is committed
   to `research/answers/RQ-XXXX.md` directly. If it is chat-only, the
   **requesting worker** transcribes the answer verbatim into that file with a
   provenance block: session ID, date, prompt used, and an explicit
   `TRANSCRIBED: true` flag. A transcribed answer carries lower weight than a
   committed one and may never be the sole basis for a behavioral decision.

ChatGPT additionally runs the **adversarial evidence pass** of §35.4. That pass
is filed the same way and is likewise advisory.
3. The answer landing as a commit is the unblock signal. No handoff, no message.

**Session selection:**

- `gpt-standing` — one long-lived session holding domain and programme context
  across the slice. Use for anything touching requirements, IA or prior
  decisions, where continuity is the value.
- `gpt-ephemeral-NN` — spawned for bounded, self-contained questions, for a
  different module, or when the standing session reaches AMBER context health
  (§17). Terminated once its answer commits.

A research answer never enters code directly. It becomes input to a packet,
which still passes the design truth gate (§9) and CI (§20). Without this,
ChatGPT's research role silently becomes an unreviewed authoring role — the
precise reason it holds no orchestration authority in this configuration (§3).

---

## 32. Design-to-code generation

Claude Design generates code directly through MCP. This makes it a **write
lane**, not a supplier of pictures, and it removes the slowest, most
error-prone handoff in V2 — human translation of a design into markup.

### 32.1 Generation scope — hard boundary

Generation may produce **presentation layer only**:

- markup, layout, component composition against the approved library;
- design tokens, spacing, typography;
- static states (loading, empty, error, unauthorized, degraded) as UI shells;
- locale structure, en/ar strings, RTL layout;
- accessibility attributes.

Generation may **never** produce: services, API calls, data access, permission
or RLS logic, routing decisions, business rules, thresholds, formulas or
provider behavior. §3 forbids Claude Design from inventing provider
availability, live data, metrics, thresholds, routes, policies or backend
capability. Without this boundary that prohibition becomes unenforceable,
because invention would arrive as executable code rather than as a mockup a
reviewer can spot.

Violation of the scope boundary is a **P1**, detected by CI (§32.4).

### 32.2 Ownership model — one-shot scaffold

Regeneration overwriting hand-written wiring is the classic codegen failure and
constitutes requirement loss (**P0**, §18). Policy:

1. Generated code lands **once**, as a scaffold, on a dedicated branch.
2. On acceptance of the scaffold, ownership transfers **permanently** to Claude
   Build A. The files become ordinary product code.
3. Claude Design never writes to those paths again.
4. All subsequent design change reaches code as a **classified delta** (§33),
   applied by hand — never as a regeneration over `src/`.

### 32.3 Pre-generation gate

The design truth gate (§9) runs **before** generation, not after. Once
output is code, review cost rises sharply and invented elements are far harder
to see. Before `cd-w1` generates:

1. design maps to a real business function;
2. revision fingerprint recorded;
3. capabilities present in existing code are enumerated and preserved;
4. `invented_elements` is empty;
5. requirement IDs the scaffold serves are named.

### 32.4 Generation run procedure

1. `cd-w1` acquires a lease on `src/modules/<n+1>/ui/**` (§16). Generation is a
   write; it is leased like any other.
2. Output goes to branch `scaffold/<module>-<revision>`.
3. The run emits `design-specs/<module>/<revision>.yaml` (§29.2) as its audit
   record, alongside the code.
4. CI runs immediately on the scaffold branch:
   - lint, typecheck, build;
   - **library conformance** — every interactive element maps to an approved
     component; raw or ad-hoc elements fail;
   - **scope conformance** — no network calls, no data access, no auth logic in
     generated paths;
   - axe WCAG 2.1 AA, zero criticals;
   - all required states present per the spec;
   - en/ar and RTL render without layout break.
5. A scaffold failing any check **never reaches Claude Code**. It returns to
   `cd-w1` with exact corrections.
6. On pass, the Orchestrator accepts the scaffold and ownership transfers to
   Claude Build A.

### 32.5 Score position

Generated code is `built`. It is never `verified` and never `accepted`.
Wiring, permissions, negative paths, tests and the real-browser gate are
unchanged and unaffected by the origin of the markup.

---

## 33. Design drift and delta propagation

One-shot handoff without a change path means code and design diverge silently.
Propagation is therefore **mandatory** — but propagation means diff, classify
and fix, never regenerate.

### 33.1 Detection — the orchestrator notices without being told

- Every screen manifest carries its bound revision (`design_revision:`).
- `cd-r1` polls Claude Design each cycle and commits the current fingerprint to
  `design-specs/<module>/CURRENT.yaml`.
- Fingerprint ≠ bound revision ⇒ the module's Design lane flips automatically to
  **AMBER — drift detected** (§27), and a drift item enters the queue.
- The same check runs in CI: a PR touching a screen whose design has moved
  cannot pass silently.

### 33.2 Delta production

Regenerate into a **throwaway** location — never over `src/`. Diff against the
current scaffold to produce:

```yaml
delta_id: DLT-0044
module: billing
from_revision: CD-BILLING-r7
to_revision: CD-BILLING-r9
produced_by: cd-r1
changes:
  - id: C1
    type: cosmetic          # token, spacing, copy
  - id: C2
    type: structural        # component added, removed, reordered
  - id: C3
    type: behavioral        # new state, action or field
  - id: C4
    type: capability_loss   # code does something r9 dropped
    affected_requirements: [REQ-121]
```

### 33.3 Classification and routing

| Class | Route | Re-acceptance |
|---|---|---|
| Cosmetic | Claude Build A, small packet | evidence re-capture only |
| Structural | Claude Build A, packet with re-run evidence | browser gate |
| Behavioral | full packet: requirement check, wiring, tests | full gate |
| **Capability loss** | **BLOCKED — never applied** | see §33.4 |

### 33.4 Capability loss is a stop, not an instruction

§9.4 requires preserving every required function missing from the design. A
delta that removes something the code legitimately does is therefore **not a fix
instruction** — it is either a design defect or a requirement change.

- It is never applied.
- It routes to Claude Design as a correction packet, or to requirement change
  control (§22) with a signed note.
- Applying a capability-loss delta is a **P0**.

Without this rule, automatic propagation becomes the fastest available
mechanism for silently deleting the 478 requirements.

### 33.5 Score consequence

An applied delta invalidates the screen's evidence: it is now stale against a
new revision, so per §20.6 the requirement row drops from `accepted` back to
`built` and must re-pass the browser gate.

This is the honest behavior and it is also the brake on churn — repeated
revision of accepted modules shows up as a stalled acceptance count and a rising
rework ratio (§23) rather than hiding inside "design improvements".

### 33.6 Freeze windows

Once a module enters sponsor acceptance, its design **freezes**. Later revisions
queue as deltas against the next slice unless the Orchestrator approves a break for a
P0/P1. Absent this, a module can be revised indefinitely and never finish.

---

## 34. Team topology and authority

Six actors, all Claude except an advisory researcher. This is the fastest
configuration in this document's history and the least independent. §34.2 and
§35 exist to contain that; they are not optional and they are not adjustable by
the workforce.

### 34.1 Claude Orchestrator — planning and acceptance

- `orch-w1` — control plane: packet authoring, **criteria freezing (§35.5)**,
  queue sequencing, contracts, lease arbitration and force-break, task router,
  PR queue, scorecard, dirty-laundry register, sponsor escalation.
- `orch-r1` — acceptance: browser delivery gate (§6), review verdicts, severity
  rulings, drift and delta triage, sponsor evidence packs, control board
  generation (§30.3), sponsor sampling administration (§35.3).

May not: hold a write lease on product code; verify a row for figure 2 purposes;
merge, deploy, run DDL, change providers or delete without sponsor authority.

**The Orchestrator does not verify.** Acceptance (figure 3) and independent
verification (figure 2) are separate acts held by separate sessions. Collapsing
them is the single fastest way to make the scorecard meaningless.

### 34.2 Session separation — the concentration control

Every functional split that V3 achieved across organisations is now internal, so
it is enforced structurally rather than by intention:

1. **Distinct sessions and identities.** Orchestrator, Build A, Build B, Design
   and Verifier are five separate sessions with no shared context. They are
   never one session wearing several hats. A single session performing two of
   these roles is a **P1**.
2. **Evidence-only review.** The Orchestrator reviews strictly from committed
   artifacts — code, tests, CI results, evidence manifests. If review requires
   knowledge not present in the artifacts, the handoff is **RETURNED as
   inadequate**, never accepted from recollection.
3. **Blind verification.** The Verifier never receives build rationale or
   narrative (§35.2).
4. **No self-verification, ever.** A session that wrote any part of a row is
   permanently disqualified from verifying that row.
5. **Build lanes are ordinary workers.** They receive packets, hold one lease,
   submit handoffs and get returned. They hold no fragment of orchestration or
   acceptance authority.
6. **Queue pressure rule.** If the review queue exceeds two items, the
   Orchestrator stops issuing new build packets until it clears. Acceptance
   throughput is the constraint, not build throughput.

### 34.3 Builders and Verifier

| Actor | Write lane `w1` | Read lane `r1` |
|---|---|---|
| **Claude Design** | module **n+1** scaffold generation, UI only (§32) | fingerprint polling, drift detection, delta production, consistency and accessibility audits |
| **Claude Build A** | module **n** — frontend wiring, states, hardening, delta fixes | packet prep, repo map, test-gap analysis |
| **Claude Build B** | module **n** — service, API, RLS/RBAC, audit, providers | contract authoring, negative-path test design, security review |
| **Claude Verifier** | module **n−1** — hardening and integration | **blind verification of module n** (§35.2), independent QA, evidence capture, e2e authoring |

Four product write lanes against a concurrent lease cap of 3 (§16). The lane
left on read work is normally the Verifier, and that is the intended default:
verification is the scarce resource in this configuration, not build capacity.

### 34.4 ChatGPT — research and adversarial critique

- Answers filed research requests (§31); runs the adversarial evidence pass
  (§35.4).
- Holds no lane, issues nothing, directs no one, verifies nothing. Its output is
  advisory input to a packet, never authority.
- If chat-only rather than repo-connected, answers are transcribed under §31
  with a provenance block and carry reduced weight.

### 34.5 Authority matrix

| Action | Authority |
|---|---|
| Call STOP THE LINE on a suspected P0 | any actor, including build lanes |
| Return work with exact corrections | any reviewer; nobody self-approves |
| Author and sequence packets | Claude Orchestrator |
| Freeze acceptance criteria | Claude Orchestrator, before build (§35.5) |
| Amend frozen criteria | sponsor only, as a change note (§22, §35.5) |
| Break a live lease | Claude Orchestrator only, recorded |
| Rule on severity dispute | Claude Orchestrator; defaults to higher severity meanwhile |
| Blind verification (figure 2) | Claude Verifier — never the authoring session |
| Accept in the browser (figure 3) | Claude Orchestrator only |
| Sample-accept a row independently | sponsor (§35.3) |
| Merge to `main`, deploy, DDL, provider change, deletion | sponsor only |
| Requirement change note | sponsor only (§22) |
| Research answer, adversarial critique | ChatGPT — advisory, never authority |

### 34.6 Known risks in this topology

1. **No non-Claude delivery actor exists.** Every builder, the verifier and the
   acceptor share an origin, and therefore share blind spots. A misreading of a
   requirement that Claude finds natural will be reproduced by the session
   checking it. This is the defining risk of V5 and it is **not fully
   containable** at this workforce size. §35 reduces it; nothing eliminates it.
2. **Figure 2 is weaker than in V4** and must never be reported as if it were
   equivalent. Hence the independence split in §35.6.
3. **The Verifier will be raided.** Verification capacity is the first thing
   sacrificed when module n slips, and in V5 it is also the only thing standing
   between "built" and "verified". Verification dropped for two consecutive
   cycles is an orchestration **P1**.
4. **Role collapse under time pressure.** The likely failure is one session
   quietly doing two jobs — the Orchestrator "just checking" a row itself, or a
   build lane verifying its own fix. Each instance is a **P1** because it
   removes the only separation the configuration has.
5. **Sole acceptor and sole planner.** Watch median review latency from cycle
   one (§23). Above 30 minutes, retire a write lane or delegate cosmetic and
   structural delta review. **Do not raise the lease cap.**
6. **ChatGPT scope creep.** Research or critique reaching code without passing
   §9 and §20 converts an advisory actor into an unreviewed author. P1.

---

## 35. Independence substitutes — mandatory in this configuration

V4 obtained independent verification from a different organisation. V5 has no
such actor. Independence is therefore reconstructed from four sources, none of
which is as strong alone, and all four are required.

### 35.1 Machine independence — CI is now load-bearing

CI (§20) is the only check in this configuration that is genuinely not Claude.
Its status changes from supporting control to primary control:

- No handoff enters the review queue without CI 1–7 green. No exceptions, no
  "obviously fine" overrides, no lead discretion.
- Any acceptance criterion that **can** be expressed as an automated check
  **must** be, before the packet is issued. A criterion left manual when it
  could be automated is a packet defect, returned to the Orchestrator.
- Every P0/P1 escaping to acceptance produces a new automated check within one
  cycle (§24), permanently. The suite's job is to accumulate the workforce's
  blind spots as executable memory.
- CI configuration is sponsor-gated: the workforce may add checks freely and may
  **never** weaken, skip or delete one.

### 35.2 Blind verification protocol

The Verifier session is given: the canonical requirement text, the acceptance
IDs, the frozen criteria (§35.5), the running application, and the evidence
manifest. It is **not** given: the build session's handoff narrative, its
rationale, its chat, its commit messages beyond IDs, or any explanation of why
a choice was made.

- The Verifier works from the requirement to the product, never from the code to
  the requirement. It asks "does the product do what the contract says", not
  "does the code do what the author intended".
- It records verdicts against each frozen criterion individually: `PASS`,
  `FAIL`, `NOT-EVIDENCED`. `NOT-EVIDENCED` is a failure of the evidence, not of
  the build, and returns to the author.
- Disagreement between Verifier and author is ruled by the Orchestrator on the
  contract text alone, never on intent.
- A Verifier that has written any part of the row is disqualified permanently
  from verifying it (§34.2.4).

This is weaker than external verification because both sessions share an origin.
It is meaningfully stronger than self-review because the Verifier cannot inherit
the author's reading of an ambiguous requirement — it never sees it.

### 35.3 Sponsor sampling — the only true independence

A percentage of accepted rows is accepted a second time by the sponsor, in the
browser, against the frozen criteria.

- The rate is set by the sponsor at cutover (§0.1.8). There is no default; an
  unset rate blocks the queue.
- **100% sampling is mandatory**, regardless of rate, for rows touching:
  authentication, authorization or RLS/RBAC; money or billing; data deletion or
  retention; audit trails; provider integrations; anything previously the
  subject of a P0.
- Rows are selected by the sponsor or at random — **never chosen by the
  workforce**.
- A sampled row that fails re-acceptance invalidates the verification of every
  row verified by the same session in that cycle; all revert to `built`. This is
  deliberately expensive, because it is the only feedback loop that can detect a
  systematically over-permissive verifier.
- The sampling queue may not fall more than one cycle behind (§5).

### 35.4 Adversarial evidence pass — the non-Claude eye

Before an evidence pack reaches the sponsor, ChatGPT reviews it adversarially:
what does this pack claim, what does it actually show, what is absent, what
would a hostile reviewer ask. Findings are filed as research answers (§31),
`UNVERIFIED` where unsourced.

This is advisory and cannot block acceptance — ChatGPT cannot drive the
application and cannot be an acceptor. Its value is that it is the only reading
of the evidence not produced by Claude, and it is cheap. Findings that identify
a real gap become dirty laundry or a returned handoff at the Orchestrator's
ruling.

### 35.5 Frozen acceptance criteria

The strongest available control against self-serving acceptance is to make the
target immovable before the work starts.

- Every packet carries explicit, testable acceptance criteria, written by the
  Orchestrator **before** the packet is issued and **before** any build session
  sees it.
- The criteria block is hashed; the hash is recorded in the packet, the commit
  message and the evidence manifest.
- Criteria may not be amended by any workforce actor. Amendment requires a
  sponsor change note (§22) and produces a new hash and a new packet.
- Verification and acceptance are performed against the frozen text, never
  against what was built. A criterion that turned out to be inconvenient is
  still a criterion.
- A hash mismatch at acceptance is a **P0**: it means the target moved.

### 35.6 Independence classing and honest reporting

Figure 2 is reported split, never merged:

| Class | Meaning |
|---|---|
| `external` | verified by a non-Claude actor (historic rows only, pre-V5) |
| `blind-internal` | verified by a Claude session under §35.2 that did not author the row |
| `sponsor-sampled` | additionally re-accepted by the sponsor under §35.3 |
| `machine-only` | passing CI but not yet blind-verified — **counts toward figure 1 only** |

The sponsor is told plainly, at cutover and in every report, that
`blind-internal` is a weaker assurance than `external`, and that
`sponsor-sampled` is the only class carrying full independence. Reporting a
single merged figure 2 without the split is a **P1**, because it presents the
workforce's opinion of its own work as third-party verification.

---
## Appendix A — Quick reference

### A.1 Lane map

| Lane | Actor | Scope | Lease |
|---|---|---|---|
| `orch-w1` | Claude Orchestrator | packets, criteria freezing, queue, contracts, leases, scorecard | no product code |
| `orch-r1` | Claude Orchestrator | browser gate, review verdicts, severity, delta triage, control board, sampling admin | none |
| `cd-w1` | Claude Design | module **n+1** scaffold generation, UI only | one |
| `cd-r1` | Claude Design | fingerprint polling, drift detection, delta production, consistency | none |
| `ba-w1` | Claude Build A | module **n** frontend wiring, states, hardening, delta fixes | one |
| `ba-r1` | Claude Build A | packet prep, repo map, test-gap analysis | none |
| `bb-w1` | Claude Build B | module **n** service, API, RLS/RBAC, audit, providers | one |
| `bb-r1` | Claude Build B | contract authoring, negative-path test design, security review | none |
| `ver-w1` | Claude Verifier | module **n−1** hardening and integration | one |
| `ver-r1` | Claude Verifier | **blind verification of module n**, QA, evidence capture, e2e | none |
| — | ChatGPT | research answers, adversarial evidence pass — advisory only | none |

Four product write lanes; concurrent write-lease cap of 3 (§16).

### A.2 Thresholds and timers

| Condition | Value | Consequence |
|---|---|---|
| Heartbeat interval | ≤ 5 min | missing 10 min ⇒ `ORCH-DEFECT` |
| WIP commit interval | ≤ 30 min | no repo delta ⇒ `SUSPECT` |
| `SUSPECT` unanswered | 15 min | ⇒ `STALLED`, lease reclaimed, packet requeued |
| Lease TTL | 90 min, max 2 renewals | auto-release on expiry |
| Concurrent write leases | ≤ 3 total, ≤ 1 per module | hard cap |
| Review queue depth | > 2 items | stop issuing build packets (§34.2.6) |
| Context health AMBER | 0.25–0.50 | finish packet, no new packet, prepare handoff |
| Context health RED | < 0.25 | stop, write handoff, end session |
| Internal decision SLA | 8 working hours | auto-escalate |
| Sponsor decision SLA | 24 hours | auto-escalate |
| Decision blocking ≥ 5 rows | immediate | escalate without waiting for SLA |
| Consecutive fallback cycles | 2 | blocking dependency becomes P1 |
| Return rate | > 30% | escalate — packets under-specified |
| Blocked time | > 25% | escalate |
| Median review latency | > 30 min | retire a write lane or delegate delta review |
| Sponsor sampling backlog | > 1 cycle | queue blocked |
| Sampled row fails | any | all rows verified by that session this cycle revert to `built` |
| Verification dropped | 2 cycles | orchestration P1 |
| Flaky test | any | P1, quarantined, 72-hour fix trigger |

### A.3 Automatic P0 list

- Data loss or corruption; permission or RLS/RBAC bypass; auth failure.
- Secret exposed in repo, packet, evidence, screenshot or chat.
- Canonical requirement silently lost.
- **Frozen criteria hash mismatch at acceptance** (§35.5) — the target moved.
- Regeneration over owned product code (§32.2).
- Applying a capability-loss delta (§33.4).
- Build or deploy broken on a shared branch.

### A.4 Automatic P1 list specific to this configuration

- One session performing two roles (§34.2.1).
- A row verified by a session that authored any part of it (§34.2.4).
- The Orchestrator verifying a row for figure 2 purposes (§34.1).
- Figure 2 reported without the independence split (§35.6).
- A CI check weakened, skipped or deleted by the workforce (§35.1).
- An acceptance criterion left manual that could have been automated (§35.1).
- Verification capacity dropped for two consecutive cycles.
- A research answer or critique reaching code without passing §9 and §20.
- Generation producing services, API calls, permission logic or routing (§32.1).
- A contract mock outliving its module (§12).

### A.5 Control summary

| § | Control |
|---|---|
| 0 | Authority vests in the Claude Orchestrator; cutover mandatory; figure 2 re-labelled |
| 15 | State lives in files, not prose |
| 16 | Leases with TTL; zombie claims expire; cap of 3 |
| 17 | Context health banded; RED means stop |
| 18 | P0–P3 defined once; disputes default higher |
| 19 | Every dependency has an SLA and a default |
| 20 | CI says no before a human does |
| 21 | Evidence carries its commit SHA and goes stale automatically |
| 22 | The only legal way to change a requirement |
| 23 | Flow metrics detect slowdown that stock metrics hide |
| 24 | Anyone may stop the line; every incident produces a new gate |
| 25 | Secrets, PII, negative RBAC proof |
| 26 | local → preview → preprod → prod |
| 27 | Board colours have entry criteria; aggregate = worst lane |
| 28 | Cold-start check makes handoff quality measurable |
| 29 | Module stagger, compiled specs, contract-first, vertical slices only |
| 30 | Write lane + read lane; liveness proven by artifacts |
| 31 | Research filed in the repo; ChatGPT is advisory |
| 32 | Generation is presentation-layer only, one-shot, CI-gated |
| 33 | Drift detected automatically; capability loss is a stop |
| 34 | Five separated Claude sessions; orchestrator plans and accepts but never verifies |
| 35 | Independence rebuilt from CI, blind verification, sponsor sampling and frozen criteria |

---

## Appendix B — What V5.0 changed from V4.0

| V4.0 | V5.0 |
|---|---|
| Kimi A and Kimi B were delivery actors | Removed. Replaced by Claude Build B and Claude Verifier |
| Kimi was the sole independent verifier | Replaced by §35: CI, blind verification, sponsor sampling, frozen criteria |
| Figure 2 was externally independent | Figure 2 is now split by independence class (§35.6) and honestly labelled weaker |
| Acceptance criteria implicit in the packet | Criteria frozen and hashed before build; hash mismatch is a P0 (§35.5) |
| CI was a supporting control | CI is primary and sponsor-gated; the workforce may add checks but never weaken one (§35.1) |
| ChatGPT: research only | Research plus the adversarial evidence pass (§35.4) |
| Sponsor accepted at the end | Sponsor samples continuously, 100% on auth, money, deletion, audit, providers (§35.3) |

Unchanged from V4.0: every gate in §1–14 and every mechanism in §15–33.

### Open items requiring a decision

1. **Sponsor sampling rate.** No default is supplied and the queue is blocked
   until it is set (§0.1.8). This is the only genuinely independent check in the
   configuration; setting it low is a real reduction in assurance, not a
   scheduling convenience.
2. **Shared-origin blind spot.** Every delivery actor is Claude, so a
   requirement Claude misreads naturally will be misread again by the session
   checking it. §35 reduces this; nothing removes it. If the sponsor needs a
   guarantee here, the only remedies are re-introducing a non-Claude actor or
   raising the sampling rate substantially.
3. **Verifier capacity is the binding constraint.** Build throughput is no
   longer the limit; verification and acceptance are. Adding build lanes will
   increase `built` and leave `accepted` flat.
4. **Generation scope boundary (§32.1)** remains the entire safety case for MCP
   codegen. A single exception makes the §3 prohibition unenforceable.

# SAQEEL Collaboration Operating Agreement

## Purpose

This is the durable working agreement for user-led SAQEEL product reviews. It
helps a new session continue the same way of working without treating chat
history as product authority. The governing requirements remain the approved
Drive sources and the repository product contract.

## Working posture

- Treat SAQEEL as one platform, not a collection of independent screens.
  Before changing Planning, assess data ownership, RBAC/RLS, audit, lifecycle,
  notifications, Factory 360, Execution, integrations, and operational impact.
- Prefer the smallest coherent platform change. A screen-only repair is not
  complete if it leaves an upstream source, downstream handoff, policy guard,
  or audit trail inconsistent.
- Never invent a provider value, policy threshold, workflow rule, or external
  data claim. Show the truthful state: configured, unavailable, stale,
  contract-not-supplied, fixture, or local canonical copy.

## Evidence and decision loop

1. Keep the relevant live screen visible while reviewing it.
2. Capture the current state before diagnosing or changing it.
3. Record the user observation, repository evidence, data/source ownership,
   affected roles, technical impact, severity, complexity, blocker and owner in
   the Planning Intelligence Tracker.
4. Use the **Claude design-critique protocol** for every reviewed screen and
   for every meaningful visual, information-architecture or interaction gap:
   capture a credential-free screenshot first; open a fresh, traceable Claude
   chat named `Codex — <current SAQEEL review>`; invoke Claude's actual
   Design Critique skill through its picker; attach the screenshot and demand
   at least 20 concrete, severity-ranked findings. Record that Claude review
   as a tracker action, including its link/reference and disposition.
5. Treat Claude as an advisory reviewer, never the design authority. Sakeel
   must actively challenge each material suggestion: what user decision does
   it improve, what business requirement/repository evidence supports it, what
   accessibility or data-truth risk does it create, and is it better than the
   current experience for a real inspection-planning user? Reject generic,
   cosmetic or unsupported recommendations.
6. Add Sakeel's independent design, architecture and data assessment alongside
   Claude's findings; the two views must remain distinguishable in the
   tracker.
7. For material changes, state the impact and a definitive recommended fix in
   business language before implementation. If a business choice genuinely
   changes the contract, ask one concise clarification rather than guessing.
8. Implement approved repo-controlled work, run relevant tests and live checks,
   record the commit/PR/evidence, then mark the tracker Fixed, Decided,
   Deferred, or Blocked. Never call an item closed merely because it was
   discussed.

## Conversation and visibility

- Apply a **ten-second rule**. If a factual answer, repository trace or
  technical investigation cannot be established within ten seconds, delegate
  the investigation, state exactly what is being checked, and keep the live
  review moving. Return with evidence; do not make the user wait in silence or
  pretend that an unverified answer is known.
- Keep the user informed during work. Do not leave long silent gaps; give brief
  factual updates at each meaningful transition.
- Keep Chrome on the active context: the live SAQEEL screen when validating,
  the tracker when planning, the PR when publishing, and the design-review
  workspace when gathering critique. Do not claim a background action is
  visible when it is not.
- Be an active thought partner: question unclear labels, mismatched states,
  provenance claims, accessibility problems and business-rule drift instead of
  waiting for the user to spot every issue.
- Phrase clarifications in business language and state consequences first.
  Do not bury a material impact behind technical detail.

## Tracker contract

The shared Planning Intelligence Tracker contains:

- **Observations** — screen and platform issues, source evidence, owner,
  severity, complexity, blocker, Sakeel next action and commit.
- **Action Register** — every user instruction, delegated investigation,
  decision, outcome and status from the review day.
- **Requirements Alignment** — the authoritative Planning business rule,
  repository evidence, alignment verdict, canonical fix and delivery status.

Use visible status semantics: Green for aligned/verified or fixed; Amber for
partial/open; Red for mismatch/blocked; Blue for in progress. Every external
dependency has an explicit owner and next proof required.

## Planning-specific non-negotiables

- The Planner owns the permissible visit window; the Inspector owns the exact
  execution date during preparation.
- Packages are zero-or-more at Planning; selected package versions are
  immutable snapshots; no package remains a valid Planning publish outcome.
- Planning status, operational state and inspection state remain separate.
- Factory/CR/licence/plant data is source-provenanced master data; Planning
  owns only visit-specific corrections and history.
- Server/RPC/RLS and audit are authoritative. UI visibility is never
  authorization.
- Notification queued is not notification delivered.

## End-of-day handoff

Before ending a review day, provide a short replay of:

1. decisions made and their evidence;
2. fixes implemented, commit and verification;
3. requirements aligned, partial, mismatched or blocked;
4. external dependencies and exact next proof;
5. the next screen/journey to review.

Update this agreement only when the user explicitly changes the working model.

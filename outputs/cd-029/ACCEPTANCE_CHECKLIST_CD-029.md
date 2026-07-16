# ACCEPTANCE_CHECKLIST_CD-029.md — R1
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
implementation_authorized: false
acceptance_refs: DSG-024, DSG-A11Y-001

## Signature — Finding Trace Chain
- [x] Binds question → response → evidence → clause → violation → corrective action → decision comment for each finding.
- [x] Keyboard-operable: native disclosure buttons; Enter/Space toggles; visible focus; list DOM order = read order.
- [x] List-equivalent: definition-list link rows, not an SVG node graph; reduced-motion static equivalent.
- [x] Source- and version-labelled every link (package section, snapshot answer, sha256, mapping version, action form, review reason).
- [x] Unavailable never fabricated: missing evidence (F2), linked-source failure, undecided comment all render explicit 'unavailable'/'pending'.

## Three zones
- [x] Zone 1 section navigation (sticky strip with counts).
- [x] Zone 2 immutable content/evidence (checklist, violations/actions/evidence, factory verification, acknowledgement, version comparison, audit timeline) — read-only; edits DB-rejected.
- [x] Zone 3 persistent governed decision rail (approve / return-with-exact-scope / reject; mandatory reason; immutable result).

## Hard states
- [x] under review (populated), pending (page-load mutation), decided locked, return missing scope, reject missing reason, partial decision side-effect, stale/concurrent, unauthorized, missing evidence, provider-degraded media, multiple critical findings, linked-source failure, loading, counterfactual.
- [x] Three complete equal-fidelity hypotheses (A trace-chain-first selected, B evidence-viewer-first, C decision-rail-first) on identical data/hard state.

## Action-rail truth ladder
- [x] Action may be offered.
- [x] Server + RLS re-check at submit (an offered action can still be denied).
- [x] Primary decision recorded (immutable once written).
- [x] Inspection transition is a SEPARATE write that can fail after the decision — surfaced as the partial state, HANDOFF_BLOCKED_ATOMIC.
- [x] Notification queued vs delivered distinguished (a row is not a delivery).
- [x] No invented support/escalation path; neutral error copy only (HANDOFF_BLOCKED_ERRORMAP).

## HANDOFF_BLOCKED (design surfaces, does not resolve)
- [x] HANDOFF_BLOCKED_PAGELOAD_MUTATION — open creates review + under_review transition on load.
- [x] HANDOFF_BLOCKED_ATOMIC — non-transactional decision write.
- [x] HANDOFF_BLOCKED_MEDIA — no provider-backed viewer.
- [x] HANDOFF_BLOCKED_CLAIM — no claim/reassign path.
- [x] HANDOFF_BLOCKED_LINKED — clause/violation & factory-verification linked sources can fail.
- [x] HANDOFF_BLOCKED_ERRORMAP — 'contact support' has no governed destination.
- [x] HANDOFF_BLOCKED_BASELINE — main sources read; no exact-baseline equivalence; deferred to Codex.

## Accessibility / theme / RTL (DSG-A11Y-001)
- [x] Arabic-first full-document RTL; realistic long Arabic strings; mixed-direction IDs/dates via bdi isolation.
- [x] Dark/light semantic parity; 1440/1024/412 layouts; disclosure buttons; visible focus; defined keyboard order.
- [x] Focus moves to invalid return-scope/reason; role=status (loading) + one blocking role=alert; reduced-motion static trace equivalent.

## Preserved truth
- [x] Read-only immutable version; content edits DB-rejected; corrections only via Return with exact scope.
- [x] Return requires exact sections + reason; reject requires reason.
- [x] Diff computed from stored answers; append-only audit; decided reviews DB-locked.
- [x] Factory verification never modifies the Senaei source; 0020 pending shown verbatim, not 'no changes'.
- [x] Notifications queued-not-delivered.
- [x] Grouped role-scoped shell consumed unchanged.

## Governance
- [x] implementation_authorized: false; every Claude Code-facing file begins with the execution prohibition.
- [x] No self-scoring; no sponsor-approval claim; CD-028 queue not redesigned.

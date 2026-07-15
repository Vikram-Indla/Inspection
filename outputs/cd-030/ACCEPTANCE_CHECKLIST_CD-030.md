# ACCEPTANCE_CHECKLIST_CD-030.md — R1
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
implementation_authorized: false
acceptance_refs: DSG-025, DSG-A11Y-001

## Signature — Tamper-evident Scope Rail
- [x] Classifies every changed answer into expected (in returned scope) / unexpected (locked-section change) / unchanged locked content / comparison-unavailable.
- [x] Authority is the review's STORED returned scope (reviews.returned_sections), never inferred from the diff itself.
- [x] Never labels a missing semantic comparison 'unchanged' — unknown categories render 'unavailable'.
- [x] Keyboard-operable disclosure buttons; list-equivalent; non-color glyphs (✔ ▲ = ○); source/version-labelled.
- [x] Navigation-only: selecting a row scrolls to the answer; no accept/merge action.

## Runtime truth (not exceeded)
- [x] Diff = stored answer snapshots, union of keys, latest vs prior (matches reviews/[id]/page.tsx).
- [x] /reviews/:id/compare consolidated into /reviews/:id — route-neutral compare mode; no separate route claimed.
- [x] Submission versions + audit immutable; diff never written back.
- [x] Opening the review is read-only; CD-029 startReview sequence non-atomic (HANDOFF_BLOCKED_START_REVIEW_ATOMIC) + non-transactional decision writes (HANDOFF_BLOCKED_ATOMIC) neither hidden nor resolved.

## Hard states (12 + 3 hypotheses)
- [x] returned-scope-only, unexpected locked change, no prior, empty diff, evidence/media unavailable, package semantics unavailable, source degraded, stale, unauthorized, auditor read-only, loading, counterfactual.
- [x] Three complete equal-fidelity hypotheses (A scope-rail-first selected, B side-by-side, C chronological) on identical versions/scope.

## HANDOFF_BLOCKED
- [x] HANDOFF_BLOCKED_MEDIADIFF, _PKGSEMANTIC, _METADIFF (non-answer comparisons not derived — shown unavailable).
- [x] HANDOFF_BLOCKED_ACCEPT (no accept/merge action or authorization path — navigation-only).
- [x] HANDOFF_BLOCKED_LINKED (source degradation shown unavailable, not empty).
- [x] HANDOFF_BLOCKED_START_REVIEW_ATOMIC + HANDOFF_BLOCKED_ATOMIC (CD-029 start-review sequence + decision-write gaps unresolved).
- [x] HANDOFF_BLOCKED_BASELINE (main sources read; no exact-baseline equivalence; deferred to Codex).

## Accessibility / theme / RTL (DSG-A11Y-001)
- [x] Arabic-first full-document RTL; mixed-direction IDs/versions/dates via bdi isolation.
- [x] Dark/light parity; 1440/1024/412 layouts; visible focus; semantic comparison table; defined keyboard order + version-selector focus.
- [x] role=status (loading/empty/scope-clean) + one blocking role=alert (tamper/stale); reduced-motion static scope-rail equivalent.
- [x] No red/green-only, hover-only, drag or code-diff-aesthetic dependency.

## Governance
- [x] implementation_authorized: false; every Claude Code-facing file begins with the execution prohibition.
- [x] No self-scoring; no sponsor-approval claim; CD-028/029 not redesigned.

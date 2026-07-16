# CD-028 Design Review R1 — Level 2 Review Queue

- Review date: 2026-07-14
- Package: `CD-028 / SCR-WEB-300 / P10 — Level 2 Review Queue R1`
- Outcome: **BLOCK — four P1 truth/package corrections required.**

## P1-01 — Evidence-readiness fingerprint claims facts the queue does not read

`reviews/page.tsx` selects review/version timestamp, inspection/visit/factory/assignment and violation data. Its `badgesFor` function derives only SLA state, factory risk band, L1 critical count and priority. It does **not** query or derive checklist completeness, evidence readiness, acknowledgement, or factory-verification readiness.

The manifest’s fingerprint instead presents `checklist`, `evidence`, `acknowledgement` and `factory-verify` as queue facts, and wiring leg 3 marks the evidence-readiness display as `PASS` against `badgesFor`. That is not supported by the current route.

**Correction:** mark those fields `HANDOFF_BLOCKED_QUEUE_READINESS` and render explicit unavailable/not-readable treatment, or separately authorize and prove a safe RLS-scoped query/derivation. Do not present absent values as ready, missing, zero or verified.

## P1-02 — Scan-only queue opening is not current runtime truth

The package claims opening `/reviews/:id` from the queue does not claim/start review. Current `apps/web/src/app/reviews/[id]/page.tsx` inserts a review and changes the inspection to `under_review` whenever the latest submission is submitted and has no open review. Thus opening a queue row currently mutates state.

**Correction:** mark the scan-only opening behavior `HANDOFF_BLOCKED_QUEUE_OPEN_MUTATION` until a separately approved CD-029/workflow decision changes it. Do not mark wiring legs 5 or 10 PASS or claim no queue write merely because the queue link itself is a navigation link.

## P1-03 — Hypotheses are not equal-fidelity visual evidence

The hypothesis exports have different hashes, but HYP-A is an annotation-text frame while HYP-B/C are partial UI frames. They are not three complete, comparable full compositions using the same queue data, selected state, hard state and action boundary.

**Correction:** export three complete same-viewport high-fidelity compositions: fingerprint-first, evidence-rail, and workload-context-first. Each must show the full queue, truthfully unavailable readiness data, scan-only/mutation-blocked truth, and a representative hard state. Keep one selected signature interaction and a visual counterfactual.

## P1-04 — The ZIP is a mixed archive

The ZIP contains CD-025, CD-026, CD-027 and CD-028 packages, root duplicates and an uploads folder. It includes stale historical Claude Code prompts. Submit a clean archive containing only the current CD-028 package and its inventory-listed files.

## Preserved truths

Keep the frozen shell, RLS/audit/immutable-submission contract, config-derived SLA treatment, queued-not-delivered notification language, no claim/reassign action, no invented capacity/SLA/risk policy, and `implementation_authorized: false`.

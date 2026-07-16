# Claude Design Correction Prompt — CD-028 R1 → R2

Paste this into the existing **CD-028 Level 2 Review Queue** Claude Design project. This is a design-package correction only. Do not implement code.

Keep `implementation_authorized: false` and preserve the required first line in every Claude Code-facing file:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

## Correct four P1 defects

1. **Queue readiness facts.** Current `/reviews` only derives SLA, risk band, L1 critical count and priority. It does not query/derive checklist completeness, evidence readiness, acknowledgement or factory-verification readiness. Mark each of those as `HANDOFF_BLOCKED_QUEUE_READINESS` with a labelled unavailable/not-readable state. Do not show an invented readiness result. A later RLS-scoped data-query/derivation task may resolve this separately.

2. **Queue-open mutation.** Current `/reviews/:id` creates a review and transitions an inspection to `under_review` when opened. Mark scan-only opening as `HANDOFF_BLOCKED_QUEUE_OPEN_MUTATION`; do not claim the current queue is scan-only/no-write. Claim/reassign stay blocked. Do not redesign CD-029 or change workflow code.

3. **Three complete hypotheses.** Replace the annotation/partial-frame exports with three complete, same-size, high-fidelity desktop queue compositions using identical data and hard states:
   - A: factual SLA/risk/critical fingerprint-first, with readiness unavailable truth;
   - B: evidence rail, with unavailable readiness truth and no fake claim;
   - C: workload-context-first, with relative load only and no capacity target.
   Each must show query controls, queue records, open-workspace mutation warning, selected state, unavailable actions, non-colour semantics, and keyboard/narrow/Arabic feasibility. Add a visual counterfactual of selected A without the fingerprint.

4. **Clean R2 archive.** Submit only `outputs/cd-028-r2/`, containing its editable source, standalone, companions, manifest, maps/matrices/checklist/research/handoffs, inventory and R2 evidence. Exclude every CD-025/CD-026/CD-027 item, root duplicate and `uploads/` folder.

Update every manifest/wiring/state/acceptance/handoff artifact to R2 and scan for false `PASS` assertions on queue readiness and scan-only opening. Preserve all existing blocked-leg truth, the frozen shell, RLS, audit, immutable versions, configuration-derived SLA, and queued-not-delivered language. Return `READY_FOR_DESIGN_REVIEW_R2`; do not sponsor-approve or implement.

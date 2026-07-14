# Revision Notes V4 — Quality Ratchet and CD-024 Reconciliation

- Added a permanent design-quality ratchet so later screens cannot trade decision quality for checklist coverage.
- Replaced self-scoring with reviewer evidence and explicit rejection gates.
- Added equal-fidelity decision-zone hypotheses, counterfactual proof, family inheritance and one-pattern novelty limit.
- Added a three-screen drift-audit cadence and stronger Arabic, responsive, accessibility and hard-case proof.
- Reconciled CD-024 with the current repository: `/planning/plans/:id` is read-only; `/planning/bulk/review` now owns an implemented pre-publish P02 step; the catalogue route `/planning/:id/configure` remains unresolved.
- Recorded the current screen-ID collision: the implemented bulk review is labelled `SCR-WEB-120`, while the governed catalogue assigns `SCR-WEB-120` to Single Visit Planning.
- Recorded P1 wiring risks: auto round-robin does not prove overlap avoidance; package status/effective-date and visit-type validation are not proven server-side at submit; execution mode is hard-coded physical; attempted-conflict audit, provider delivery and override policy are unproven.
- CD-024 is ready for design exploration under the V4 prompt, but its implementation manifest must remain `HANDOFF_BLOCKED` until route/ownership and backend guard gaps are resolved.
- No application code, commit, push, merge, deployment or main-branch change is authorized by this revision.


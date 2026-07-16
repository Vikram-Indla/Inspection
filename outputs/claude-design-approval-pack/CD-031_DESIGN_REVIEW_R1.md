# CD-031 Design Review — R1

**Verdict: NOT READY FOR SPONSOR DESIGN REVIEW.** The Factory 360 direction is mature: its three hypotheses are distinct, its required state coverage is unusually complete, and it does not fabricate a map or risk-driver breakdown. Four P1 defects still block acceptance.

## What passed

- Provenance-first, timeline-first and decision-context-first are visibly different full compositions.
- The package truthfully marks map, boundary, coordinate-conflict, document-viewer, risk-driver and exact-role gaps `HANDOFF_BLOCKED`.
- The state matrix provides a corresponding PNG for each listed state, including partial-service failure, role masking, high risk, loading and not-found/RLS ambiguity.
- `support.js`, the implementation prohibition and `implementation_authorized: false` are present.

## P1 corrections required

1. **The archive preflight is false.** `Plan Review and Publish (6).zip` contains 377 files, including CD-025–030 packages, root-level duplicates, `screens/` and `uploads/`. It is not an archive rooted only at `outputs/cd-031-r1/`, despite the preflight claiming that. Deliver a newly built archive with only `outputs/cd-031-r2/`.
2. **The Spatial Case Timeline overclaims two source links.** `factories/[id]/page.tsx` loads the current `risk_version` only; it does not query historical risk observations. It also does not query inspection evidence; it reads factory-document metadata, whose `storage_path` is created as `null` on this surface. Remove evidence and risk-version-history links from the live timeline, or mark them `HANDOFF_BLOCKED_EVIDENCE_TIMELINE` and `HANDOFF_BLOCKED_RISK_HISTORY`. Do not render them as sourced events or causal links.
3. **Rendered section navigation fails readability.** HYP-A visibly collapses all labels into `SectionsIdentityCase timelineHistoryDocuments…`. Repair it as individually separated, recognisable navigation controls with label, count where applicable, 48px target, visible focus and equivalent Arabic/412px behavior.
4. **Preflight evidence is asserted, not recorded.** It claims distinct A/B/C hashes but does not include the actual hashes, archive listing or local-asset resolution. Record those facts, plus every state-to-PNG path, in the R2 preflight; only then declare PASS.

## Do not regress

- Keep the strong state set, three hypotheses, counterfactual, per-section service isolation, source/freshness labelling, unavailable-map posture and role-masked treatment.
- Preserve immutable registry facts, RLS ambiguity, frozen shared shell and all existing `HANDOFF_BLOCKED` classifications.
- Do not implement application code or invent a provider, risk history, evidence query, role permission or support route.

# RESEARCH_PROVENANCE_CD-029.md — R1
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT

Non-product. Three primary sources; observed / adopted / rejected. Informs information architecture and safety treatments only — no runtime behaviour is inferred from these.

## 1. Enterprise inspection / regulated QA case-management workspace
- Observed: a persistent decision rail sits beside immutable evidence; the decision surface cannot also edit the evidence; irreversible actions carry inline consequence warnings.
- Adopted: separate governed decision rail (zone 3); read-only content zone (zone 2); inline approve/reject consequence warnings; guard ladder distinguishing offered vs recorded vs transitioned.
- Rejected: bulk-approve and inline evidence editing — unsafe for an irreversible regulatory decision and unproven in the runtime.

## 2. Saudi public-service bilingual transaction pattern
- Observed: full-document RTL, mixed-direction identifiers/dates handled with bidi isolation, decision + mandatory reason + an immutable receipt of the outcome.
- Adopted: bdi isolation for factory/visit codes, sha256 and dates; mandatory reason recorded immutably; explicit immutable prior-decision receipt in the decided state.
- Rejected: colour-only status semantics; English-only codes embedded in an Arabic layout.

## 3. Accessibility / RTL authoring guidance (disclosure + validation focus)
- Observed: native disclosure buttons, list-equivalent structure, focus moved to the first invalid control, a single blocking alert, reduced-motion equivalents.
- Adopted: the Finding Trace Chain as native button disclosures; focus to invalid return-scope/reason; role=status for loading and one role=alert for blocking states; reduced-motion static chain.
- Rejected: an SVG node-graph trace with no list fallback; toast-only validation that steals focus without landing on the invalid field.

## Baseline
BASELINE_REVERIFY_REQUIRED — the /reviews/:id sources (page.tsx, DecisionPanel.tsx, actions.ts, factory-verification, notify) were read at main this session. No exact-baseline equivalence is claimed; exact code/wiring verification is deferred to independent Codex audit.

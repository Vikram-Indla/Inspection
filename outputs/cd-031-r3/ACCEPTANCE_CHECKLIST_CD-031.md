# ACCEPTANCE_CHECKLIST_CD-031.md — R3
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
implementation_authorized: false
acceptance_refs: DSG-026, DSG-A11Y-001

## R3 micro-correction (two R2 failures resolved)
- [x] Section-navigation pills ≥48×48px in desktop (min 48×83), Arabic RTL (min 48×64) and 412px narrow (min 48×64) — measured live via getBoundingClientRect. Separated labels, boundaries, selected state and visible keyboard focus preserved.
- [x] PACKAGE_PREFLIGHT_CD-031.md records literal SHA-256 for each A/B/C hypothesis PNG; all three differ (verified, not "distinct bytes").
- [x] Preserved: single-root archive, all R2 timeline truth blocks, all states, routes/roles/blocked classifications, frozen shared shell.

## Signature — Spatial Case Timeline
- [x] Source-labelled narrative linking registered location context, inspections, evidence/documents, findings/actions, review decisions and risk-version observations.
- [x] List-equivalent (ordered event cards + decorative spine); keyboard-operable; non-color glyphs (◉ ▤ ▲ ◆ ◈); reduced-motion static ordered list.
- [x] Never draws a fabricated spatial path, boundary, risk event or causal link; unavailable spatial/risk-driver elements shown explicitly.
- [x] Connective not causal: co-occurring facts (high-risk band + open critical finding + latest under-review visit), no invented causation.

## Provenance-led dossier
- [x] Persistent identity + source/freshness + risk version aside; read-only source-owned identity.
- [x] Risk source-labelled summary (score/band/version); drivers unavailable (HANDOFF_BLOCKED_RISK_DRIVERS).
- [x] Location/boundary differentiates registered coordinates from unavailable map/boundary (HANDOFF_BLOCKED_MAP/BOUNDARY/COORDINATE_CONFLICT).
- [x] Per-section service failure isolated — never a whole-record failure.

## Hard states (13 + 3 hypotheses)
- [x] populated, no-history, stale-source, map-unavailable, boundary/coordinate conflict, one-service-failure, role-masked, high-risk, document-preview-unavailable, risk-drivers-unavailable, loading, not-found, counterfactual.
- [x] Three complete equal-fidelity hypotheses (A provenance-first selected, B case-timeline-first, C decision-context-first) on identical data.

## Factual-label discipline
- [x] source, last synced, risk version, record scope and unavailable shown as exact facts.
- [x] Never "no history" when a history query failed; never "no changes" when a risk/map/linked service failed; no invented staleness threshold.

## HANDOFF_BLOCKED
- [x] HANDOFF_BLOCKED_RISK_DRIVERS, _RISK_HISTORY (only current risk version read), _EVIDENCE_TIMELINE (no evidence query on route), _MAP, _BOUNDARY, _COORDINATE_CONFLICT, _DOCUMENT_VIEWER, _ROLE (leadership aggregation/contact privacy/custody/visibility), _BASELINE.
- [x] R2 timeline-truth correction: the Spatial Case Timeline is built only from route-read facts (identity, current risk version, visits/inspections, findings/actions, review status); evidence events and risk-version history are explicit unavailable rows, never live-sourced facts.

## Accessibility / theme / RTL (DSG-A11Y-001)
- [x] Arabic-first full-document RTL; realistic long Arabic strings; mixed-direction IDs/coords/dates via bdi isolation.
- [x] Dark/light semantic parity; status never colour-only; 1440/1024/412 layouts; visible focus; skip link; semantic headings/regions/tables/lists.
- [x] Keyboard order: identity/provenance → section nav → timeline → history/findings/documents → permitted controls; section failure focuses recovery; reduced-motion static timeline.

## Preserved truth
- [x] Read-only source-owned identity/workforce; per-section query isolation; RLS boundary; add controls per 0017; grouped shell unchanged.

## Governance
- [x] implementation_authorized: false; every Claude Code-facing file begins with the execution prohibition.
- [x] No self-scoring; no sponsor-approval claim; no CRM card wall / decorative gauge / live-map theatre.

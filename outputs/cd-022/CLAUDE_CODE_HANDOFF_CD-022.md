# CLAUDE_CODE_HANDOFF_CD-022

Design-only package for SCR-WEB-120 (/planning/single). Do NOT implement until sponsor approval and the independent Codex wiring audit are both recorded.

## Read first
- Canvas section CD-022 (frames 2a-2h) in "CD-021 Bulk Targeting.dc.html" + 5 PNGs in outputs/cd-022/
- IMPLEMENTATION_MANIFEST_CD-022.yaml · WIRING_MAP_CD-022.csv · ACCEPTANCE_CHECKLIST_CD-022.md

## Design thesis (selected: identity dossier + progressive configuration)
Factory selection is an identity-confidence decision. The lens establishes confidence through explicit identifier comparison (graded by rule, never scored), provenance + freshness, official location, risk context and the duplicate/overlap guard — all BEFORE configuration unlocks. Configuration reuses every existing gate unchanged.

## Hard truths this design encodes
1. publishSingleVisit is NOT atomic (6 sequential writes, no rollback; raw e.message reaches the UI). 2e shows the truthful step ledger: what exists, what failed, retry safety, duplication risk, next action. Atomic leg = HANDOFF_BLOCKED (Postgres RPC recommended; backend decision).
2. Current search omits NAME and runs client-side over the full factories table. Adding name search + server-side querying is an UPDATE with capacity implications — flagged for review.
3. Duplicate check currently fires only at publish. The design adds the same read at selection time (parity required — one query, two call sites).
4. EXACT match = governed identifier equality only. SIMILAR NAME always displays the differing identifier. No confidence percentages, no silent preference, no name-based merging, no factory creation (unregistered → Immediate Visit M01-045).
5. Official location is GIS-Admin-owned registry truth; planner pin is per-visit only (existing planner_lat/lng columns). Never conflated.
6. Notifications are inserted rows — the UI says "queued", never "delivered", until delivery truth exists (ENG-11 providers are a known gap).
7. R16/R19/R21/R24 are cited by the approval-pack matrix but not defined in the mounted repo (library stops at R15) — HANDOFF_BLOCKED; category requirements satisfied directly.

## Locked baselines (do not touch)
Shared shell (frozen), RBAC/RLS, canonical transitions, append-only audit, M01-036/038/040, M02-012, M03-011, work-preservation pattern, Saqeel tokens, Arabic-first RTL, dark/light parity. No Dashboard topbar controls.

## A11y/RTL contract (DSG-A11Y-001)
Results as listbox with graded announcement; dossier as labelled regions; focus transfer to first blocking error; assertive duplicate/overlap/failure announcements; >=48px targets, 16px inputs; glyph+text status; bdi-isolated identifiers; Arabic-primary names with LTR secondary line; map always paired with text equivalent; reduced motion = no scroll/fly animation on selection continuity.

## Self-criticism (5 passes)
1 Coverage: 30 states mapped (2a/2d/2e/2f/2g/2h frames + board; each labelled). 2 Domain: legal-entity language (CR vs trading entity, license gate, geofence, dispatch-blocking coordinates) — not contact selection. 3 Differentiation: the graded comparison rail + identifier-equality rule is the signature; strip branding and it still reads as regulatory identity verification, failing the CRM test deliberately. 4 Family: same tokens, chip grammar, ledger/stepper objects as CD-021 (stepper reused). 5 Fit: every element maps to an existing gate or a named CREATE with tests; no invented thresholds, tolerances or providers.

READY_FOR_DESIGN_REVIEW

# ACCEPTANCE_CHECKLIST_CD-025 (ratchet V4, DSG-020 / DSG-A11Y-001 / DSG-CODE-001) - R1
Design file: "CD-025 Plan Review and Publish.dc.html" (dedicated; frames 5route, 5a-5n, S1-S28).
Status: READY_FOR_DESIGN_REVIEW_R1. Reviewer checks the boxes against the cited frame/node evidence; nothing is self-marked.

## Ratchet gates
- [ ] ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION states all 10 facts incl. stale reconciliation row and immediate-flow exclusion (#5route)
- [ ] Route-neutral workspace; no invented URL, persisted draft ID, handoff mechanism or approval queue; SR-0142 clearly temporary (5a context strip + annotation)
- [ ] Three hypotheses differ in decision flow/IA at equal fidelity (5a vs 5b vs 5c); selection argued against named criteria (comparison panel); no scores
- [ ] Publish Consequence Ledger is the ONE new pattern; counterfactual shows measurable loss (5d); CD-024 ledger not duplicated (inheritance panel)
- [ ] Every displayed fact maps to a verified read OR renders as Not evaluated / Unavailable / blocking dependency (truth matrix panel; 5a)

## DSG-020 and truth
- [ ] Complete plan, child visits, package version, window, per-visit assignee and counts visible in one scan (5a)
- [ ] Verified / stale / unknown / warning / blocked separated; warnings never block silently, blockers never soften (5a readiness; 5f S3)
- [ ] Bulk all-or-nothing language present AND separately disclosed that pre-checks are re-run before submission but not transaction-safe (5a readiness + ledger; research panel PostgreSQL row)
- [ ] Single variant never claims atomicity; step truth + resumable retry mirrored (5e, 5h right, S25)
- [ ] Immediate flow excluded in annotations only (method boundary panel)
- [ ] Scope integrity: removed factories named with codes and verified reason; counts recalculated; no preselected destruction; restore not invented (5a scope; S9/S10)
- [ ] Notification copy: queued/recorded only; never notified/delivered/received/acknowledged (5a ledger; 5i)
- [ ] Success states show committed counts + truthful destination; no receipt, timing or support invention (5i, S26)
- [ ] Failure states: bulk "nothing was published" with staging preserved; single "did not complete" never "nothing created"; no raw provider text (5h, S24/S25)
- [ ] No partial write sequence shown green/complete (5h right)
- [ ] Double submit prevented; no optimistic Published (5g, S23)

## Authorization
- [ ] Unauthorized/not-in-scope distinct from expired review and from source failure (S21 vs S22 vs S13-S16)
- [ ] Direct Planner publish per RBAC-007 (S20); approval flow NOT designed, blocked with reasons (S19)

## Hard states
- [ ] All 28 required states designed as visual frames/panels with stable ids S1-S28 (5f + 5g/5h/5i/5j)
- [ ] Per-source failures fail closed and are distinct from legitimate zero/empty states (S13-S16 vs S5/S7/S22)

## A11y / RTL / responsive
- [ ] Arabic fresh-session default; full RTL dark frame with long Arabic names + bdi isolation (5k); RTL light evidence (5k+)
- [ ] Light desktop full frame with shell, same state (5l); dark/light equivalence
- [ ] 1024 tablet (5m) and operable 390-430 narrow (5n) in mandated order; no horizontal overflow; >=44-48px targets; in-flow action
- [ ] Keyboard/focus/live-region/reduced-motion spec panel; linked summary -> focused row -> restoration (5j, S28); status vs alert separation; disabled-reason exposed
- [ ] No color-only, hover-only or drag-only information (glyph+text throughout)

## Handoff
- [ ] WIRING_MAP rows carry all 14 legs; 17 blocked legs recorded; implementation_authorized: false (manifest)
- [ ] plans/[id] listed as protected read-only; no publish/edit controls placed there (5i; component map)

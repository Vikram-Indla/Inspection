# ACCEPTANCE_CHECKLIST_CD-022 (DSG-017, DSG-A11Y-001)

## DSG-017 — search + Factory 360 + map + configuration + duplicate guard
- [ ] Search accepts CR, factory code, license number and name; progress + result count announced
- [ ] EXACT badge appears only on governed identifier equality; rule text shown
- [ ] Similar-name results always display the differing identifier; none pre-selected
- [ ] Ambiguous results renderable as side-by-side comparison (2d)
- [ ] Registry source + sync freshness visible at search and in dossier
- [ ] Dossier links to Factory 360 without losing entered work
- [ ] Official vs planner location visually and semantically separate; official read-only
- [ ] Map has a text/list equivalent (coordinates, geofence, address)
- [ ] Missing/invalid coordinates follow M01-038/M03-011 gates verbatim
- [ ] Duplicate warning at selection AND publish, with cause (visit ID, status, rule)
- [ ] Overlap = labelled warning, not block; no invented tolerances
- [ ] Risk shows ENG-04 v1, labelled advisory; never drives selection
- [ ] Configuration locked until identity + license + location confirmed
- [ ] Inspector availability/conflict result inline (M01-040)
- [ ] Readiness chips gate publish; blockers attached to the button
- [ ] Partial failure: step ledger, work preserved, safe retry, duplication answer (2e)
- [ ] Success = redirect to visit record; notification described as queued only

## DSG-A11Y-001
- [ ] Document-level RTL; Arabic-primary entity names; bdi-isolated identifiers (2f)
- [ ] Keyboard-only end-to-end flow (state 29); focus transfer to first blocker
- [ ] aria-live: polite search/selection/availability; assertive warnings/failures
- [ ] WCAG AA both themes; glyph+text status everywhere
- [ ] >=48px targets; 16px inputs; no horizontal overflow at 420px (2h)
- [ ] Reduced motion: selection continuity without animation

## Codex audit legs
- [ ] Name-search + server-side query capacity review
- [ ] Duplicate-at-selection uses the identical query as publish
- [ ] Structured step results + neutral copy in actions.ts
- [ ] HANDOFF_BLOCKED resolved or accepted: atomicity RPC; commit/worktree recording; R16-R24 library; CD-020/021 baselines

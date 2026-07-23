# Web/Admin Design Conflict Decisions

## Binding resolutions

| Conflict | Resolution | Effect |
|---|---|---|
| Current Astryx/shared-shell styling versus the newly approved HTML | `Saqeel Web(3).html` is the represented Phase 1 Web/Admin shell/dashboard visual and interaction authority. | Current shell is migration/regression evidence, not visual authority. No current code is deleted before certified cutover. |
| Existing SAQEEL module designs versus shell structure | The HTML controls shell, dashboard, Operations Center primary views, and Factory 360 represented structure; module designs control deeper content and required states. | Module screens fit within the fixed shell hierarchy and may not rename/reorder its options. |
| HTML fixture values versus customer/business rules | Customer requirements and governed formulas/data win. | Preserve card/formula/example presentation, but use real values or an honest unavailable state; never copy fixtures to production paths. |
| HTML compliance formula wording versus accepted runtime | The canonical governed compliance formula remains authoritative pending DEC-028. | Record the visible delta; do not silently change business semantics to match the fixture. |
| HTML risk weights, review cycle, AI prediction, dates, people, and factory data | They are visual fixtures, not approved policy or live data. | Fail closed or source from approved configuration and evidence. DEC-001/003/006/027/028 remain open as applicable. |
| Prototype `setView` navigation versus production routing | Use real Next.js routes and stable query/tab state. | Route manifest replaces in-memory prototype navigation without changing the represented hierarchy. |
| Planning and current `/visits/**` ownership | Planning owns Visits. | Add `/planning/visits` and `/planning/visits/:id`; retain `/visits/**` as compatibility redirects only after certified cutover. |
| Execution label versus Inspector Field implementation | Phase 1 Execution is Web/Admin oversight only. | No `/field/**`, Field PWA, offline field execution, iPad screen, estimate, test, or ownership is authorized. |
| Many existing Admin pages versus six HTML Admin options | The six options are stable hubs. | Detailed routes remain children/subtabs; no accepted capability is lost. |
| Operations command/live/exception pages versus two primary HTML views | Operations Map and National Performance are the fixed primary views. | Existing live/exception/command capabilities remain secondary views or child routes. |
| HTML Factory 360 examples versus canonical cross-provider dossier | Preserve the three-column design and represented information architecture; reuse canonical projection and provenance. | Provider gaps remain visible and fail closed; no fabricated integration result. |
| Direct replacement preference versus uncertain parity | Direct replacement is allowed only after complete certification and cutover approval. | Use preview/feature flag whenever parity, permissions, policy, provider, tests, or rollback remain uncertain. |
| Earlier M2 batch implementation versus this amendment | The batch and subsequent visual-correction WIP are suspended. | WIP is preserved in stash `405708dc8f30fe46577dfbad05efd779d1424909`; it must be reconciled after amendment approval, not committed here. |

## Rework register before implementation resumes

1. Reconcile F0 tokens, brand, sidebar, top bar, responsive behavior, RTL, themes, and focus treatment to the source authority.
2. Re-evaluate `WA-P1-M2-BATCH-001` against Planning-owned Visits routes and the fixed shell hierarchy; do not claim its previous visual checkpoint as approval.
3. Reconcile Dashboard against every row `WA-SP-010..028`, preserving governed metrics and explicit unavailable states.
4. Reconcile Operations Center against `WA-SP-029..034`, including the two primary views, map failure behavior, drawers, and real handoffs.
5. Reconcile Factory 360 against `WA-SP-035..046` while preserving the canonical dossier/provenance contracts.
6. Rebuild the next screen-batch proposal after authority approval; no implementation batch is active during this governance step.

## Unresolved Product Owner or policy conflicts

- DEC-028 still controls dashboard formula, eligibility, cycle, risk/health, AI, and source semantics.
- DEC-001, DEC-003, DEC-004, DEC-006, DEC-007, DEC-009, DEC-010, DEC-027, DEC-030, DEC-031, and DEC-032 retain their existing status and safe interim rules.
- Exact runtime asset provenance and final Arabic linguistic certification remain acceptance gates.
- Canonical route cutover and legacy removal require separate explicit approvals.

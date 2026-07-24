# Web/Admin Shell and Dashboard Authority

## Control record

- Change control: `CC-WEB-ADMIN-PHASE1-001`
- Amendment task: `TASK-WEB-ADMIN-PHASE1-AUTHORITY-001`
- Authority source: `Saqeel Web(3).html`
- Supplied local alias: `/Users/vikramindla/Developer/Business - Inspection/saqeel web.html`
- Size: `104507` bytes
- SHA-256: `b870e06820feb5784687dcb62289aa24a0070635cbc7b606157ec2128bab9bc2`
- Accepted by: Vikram Indla / Product Owner on 2026-07-23
- Scope: Phase 1 Web/Admin only
- Raw-source storage: external pointer only under `docs/DOCUMENTATION_STORAGE_POLICY.md`

### Approved brand-asset correction

`SAQEEL Design System (7).zip` is the binding Web/Admin favicon and wordmark
asset source following Product Owner approval on 2026-07-23. Archive SHA-256:
`0b78a174e622e3e81e215f159ae27c1fee8111535fe6be1761fced2569d6b270`.
Its green shield/check favicon replaces the magenta prism in active Web/Admin
metadata and collapsed navigation. Its bilingual dark-surface wordmark replaces
generated shell lettering in the expanded graphite navigation. The supplied
light-surface wordmark is retained as the approved counterpart. Exact source
and runtime hashes are in `WEB_ADMIN_BRAND_ASSET_SOURCE_MANIFEST.csv`.

Legacy prism assets remain tracked solely for rollback and the separately
deferred PWA channel. Phase 1 does not alter `manifest.json`, `sw.js`, Field PWA,
offline execution, or Inspector iPad assets.

This source is binding visual and interaction authority for the authenticated
Web/Admin shell, brand treatment, sidebar hierarchy/options/order, top bar,
Dashboard Strategic and Operational views, Operations Center primary views,
Factory 360 structure, and every card, panel, metric, drawer, control, formula,
example, state, and action represented in those surfaces. It is not inspiration
and may not be selectively adopted.

## Authority hierarchy

1. The 478 customer requirement rows and canonical product contract control behavior, scope, security, data, workflow, and acceptance.
2. `Saqeel Web(3).html` controls the represented shell/dashboard visual and interaction contract.
3. The 46 supplied module designs control module-specific content and states outside conflicts resolved here.
4. Proven application services, RLS/RBAC, audit, immutable versions, governed transitions, integrations, and fail-closed behavior must be reused.
5. The current frontend is migration and regression evidence only; it is not design authority.

No example value, risk weight, AI statement, target, date, person, factory,
provider result, or other fixture in the HTML is production data authority.
Runtime values must be sourced from permitted application data or shown as
unavailable/degraded. Open policy and provider decisions remain fail-closed.

## Required shell contract

The sidebar labels and order are fixed:

1. Overview: Dashboard; Operations Center; Factory 360.
2. Operations: Planning; Inspection containing Execution and Review & Approval.
3. Compliance: Compliance Library; Approval Queue; Enforcement Library.
4. Insights: Analytics.
5. Administration, pinned at the bottom: Users & Roles; Lookup Management; Risk Configuration; Survey Configuration; Notification Configuration; Integration Management.

Additional destinations are subtabs, secondary navigation, or governed children
of these entries. They may not replace, rename, reorder, or crowd out the fixed
options. Persona and permission filtering may hide unauthorized entries but may
not expose unauthorized routes.

The top bar preserves global search, date range, region, theme, notifications,
AI assistant, and account/avatar controls. Their real services, permission
boundaries, unavailable states, keyboard behavior, responsive behavior, and
English/Arabic directionality must be wired before certification.

One Web/Admin token profile must reproduce the source's visual language in
light and dark modes. Prototype defects—including inaccessible controls,
hard-coded navigation, duplicated closing markup, fixture-only actions,
non-responsive overflow, and unsupported policy values—must be corrected while
preserving the represented design outcome.

## Dashboard contract

`/dashboard` preserves both `Strategic View` and `Operational View`, their order,
grouping, formulas, examples, drill-down affordances, AI briefs, trend
interpretations, and destination actions. Every source element is enumerated in
`WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv`. Fixtures demonstrate format only.
Canonical governed formulas and real RLS-scoped values supersede conflicting
examples; unsupported values render honestly and DEC-028 remains open.

## Operations Center contract

`/operations` owns the two primary views in this order: `Operations Map` and
`National Performance`. Operational summary, live highlights, region/factory/
inspector interactions, detail drawers, and route handoffs are preserved.
Command, exceptions, live monitoring, workload, and alerts are secondary views
or child routes; they do not displace the two primary views.

## Factory 360 contract

The Factory 360 destination resolves through `/factories` and
`/factories/:id`. The detail surface preserves the three-column structure:
license portfolio/navigation; selected-factory dossier; and sticky AI/provenance
rail. It preserves licence switching, open context, snapshot, compliance,
profile, industrial and government information, documents, timeline, AI
explanations, data-source trust, and governed actions. Existing canonical
Factory 360 projections and provider/fail-closed contracts remain behavioral
authority.

## Route and migration decisions

- Production navigation uses real Next.js routes and query/tab state, never prototype `setView` calls.
- Planning owns Visits. New target routes are `/planning/visits` and `/planning/visits/:id`.
- `/visits` and `/visits/:id` remain accepted compatibility paths and redirect to the Planning-owned destinations after certified cutover.
- Execution means Web/Admin oversight in Phase 1 and resolves within Planning/Visits oversight. It does not authorize `/field/**`, Field PWA, offline field execution, or iPad work.
- The six Administration options are hubs. Existing detailed Admin routes remain governed children.
- Existing screens remain available behind the recorded rollback mechanism until certification, explicit cutover approval, stabilization, and Product Owner removal approval.

Exact mappings are in `WEB_ADMIN_SHELL_ROUTE_MANIFEST.json` and
`WEB_ADMIN_CURRENT_TO_TARGET_ROUTE_MAP.csv`.

## Human approval gate

Implementation resumes only after this amendment is explicitly approved.
Thereafter work remains limited to coherent batches of two to four related
screens, with a single screen only for justified complexity. Each batch must
declare migration rows first, wire real behavior, run functional/security/
negative/visual/RTL/accessibility/responsive/regression tests, demonstrate the
live runtime in visible Chrome, commit, and stop for a Product Owner decision.

No current screen, route, component, or rollback implementation may be deleted;
no canonical cutover occurs without `APPROVED FOR CUTOVER`.

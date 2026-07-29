# PLN-002 — Planning CSV export evidence

Date: 2026-07-29
Environment: disposable non-production Supabase and exact-build runtime
`codex/observation-ai-closure` on `http://127.0.0.1:3222`
Disposition: **Completed**; positive and negative role paths, filter-to-row
fidelity, and out-of-scope exclusion all pass.

## Contract trace

- `ExportButton.tsx` sends the current server-parsed Planning URL parameters to
  the server action.
- `export-actions.ts` requires a verified user and
  `has_planning_capability('planning.export')`.
- Export and the visible list use the same `queryPlanningVisits` read contract.
- `20260729045000_planning_lifecycle_read_access_grant.sql` gives authenticated
  callers SELECT-only access to lifecycle timestamps while retaining the
  existing `visit_lifecycle_events_read` RLS policy.
- The export cap is 5,000 authorized matching rows.
- Unknown/unbacked CR Name and Plant Number values remain empty; they are not
  fabricated.
- Output uses UTF-8 BOM, quoted cells, escaped quotes, and Excel-compatible
  CRLF row separators.

## Positive browser proof

Persona: `obs-planner-3222@example.invalid` (Planner)

1. `/planning` rendered the RLS-scoped workspace and `Export (CSV)`.
2. Clicking the control produced `planning-visits-2026-07-29.csv`.
3. The file was 389 bytes, began with UTF-8 BOM bytes `EF BB BF`, and contained
   the 25 governed header columns.
4. It contained zero data rows, matching the live page's zero authorized
   visits. No error or capped-result message appeared.

The completion run then added three clearly labelled, additive records to the
fresh disposable environment:

- `PLN002-RUH-PUBLISHED` — Riyadh, published;
- `PLN002-RUH-DRAFT` — Riyadh, draft;
- `PLN002-EAST-OUT-OF-SCOPE` — Eastern, published control.

The non-production Planner profile was completed with `region=Riyadh` and
`org_scope=regional`; no existing non-null scope was replaced.

On `/planning`, the exact-build browser rendered:

- `All · 2`, with both Riyadh references and neither the Eastern reference nor
  its factory;
- `Published · 1`, with only `PLN002-RUH-PUBLISHED`;
- `Showing 2 of 2` before filtering and `Showing 1 of 1` after filtering.

The unfiltered download contained exactly the two Riyadh references and three
physical lines (one header plus two rows), SHA-256
`00c17db5503a40b6a87037860093e5daa42cf9510ee3b323ad6fe06c166e2089`.
The published download contained exactly one row,
`PLN002-RUH-PUBLISHED`, retained the UTF-8 BOM, and had SHA-256
`039ada60e53442273edd3becbebeddf787921745365c843d2a40f4e41734a308`.
Neither download contained `PLN002-EAST-OUT-OF-SCOPE`.

## Negative browser and role proof

Persona: `obs-inspector-3222@example.invalid` (Inspector)

- The authenticated Planning access classifier returned `inspector` with HTTP
  200.
- Direct navigation to `/planning` rendered `Authorized role required`.
- No export control, Planning data table, or creation control was rendered.

The Supervisor persona was not used as the negative case because the current
approved compatibility matrix explicitly gives Supervisor `planning.export`;
its successful Planning access is therefore not evidence of an authorization
failure.

## Preservation

The Inspector persona was added as a clearly named non-production account and
assigned the existing `inspector` role. No existing account, assignment,
fixture, application row, or audit row was deleted, reset, deactivated,
relabelled, or overwritten.

## Database and regression proof

The same authenticated Planner identity returned two `observation_evidence`
visits through `visits_read_explicit_scope`: one published, one draft, and zero
Eastern controls. The service-role ground truth contained all three records.

`supabase/tests/0050_planning_export_scope_contract.sql` repeats this contract
transactionally with isolated probe identities and records. It proves:

1. two in-region visits are visible;
2. the published predicate returns exactly one;
3. the out-of-region control is invisible;
4. rollback leaves no user or visit residue.

`supabase/tests/0051_planning_lifecycle_read_access_grant.sql` proves the
lifecycle relation is authenticated SELECT-only, anonymous access and direct
mutation remain denied, and the RLS policy remains present. This repairs the
live trace's prior `permission denied for table visit_lifecycle_events` rather
than accepting fabricated or silently empty Last Update values.

The CSV implementation and page still share `queryPlanningVisits`; therefore
the browser row reconciliation plus the RLS probe proves the export is neither
broader nor differently filtered than the visible Planning result.

## Closure

PLN-002 is complete. The export is needed as the governed, capability-gated
operational extract defined by `PLN-REQ-017`; its implementation, live output,
filter fidelity, role denial, and regional RLS boundary are now evidenced.

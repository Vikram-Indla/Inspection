# PLN-002 — Planning CSV export evidence

Date: 2026-07-29
Environment: disposable non-production Supabase and exact-build runtime
`codex/observation-ai-closure` on `http://127.0.0.1:3222`
Disposition: **In progress**; positive and negative role paths pass, but the
current authorized scope has zero visits and cannot prove filter-to-row fidelity.

## Contract trace

- `ExportButton.tsx` sends the current server-parsed Planning URL parameters to
  the server action.
- `export-actions.ts` requires a verified user and
  `has_planning_capability('planning.export')`.
- Export and the visible list use the same `queryPlanningVisits` read contract.
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

## Exact remaining proof

PLN-002 must remain open until a preserved representative non-production visit
set is available in the Planner's RLS scope. Required completion proof:

1. export an unfiltered set with at least two distinguishable visits;
2. apply one status or identity filter and export again;
3. prove the filtered CSV includes every and only the rows visible to the same
   Planner scope;
4. prove an out-of-scope visit is absent;
5. retain the Inspector denial above as the negative role path.

# F0 technical foundation evidence

Status: `TECHNICAL_FOUNDATION_COMPLETE_BASELINE_REGRESSIONS_RECORDED`

## Scope and preservation

- Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-F0`
- Designs: `WA-DES-022` and `WA-DES-041`
- Acceptance: `WA-F0-AC-001..006`
- Runtime: server-gated `/reference/web-admin/f0`; it returns 404 unless
  `SAQEEL_F0_REFERENCE_RENDERER=enabled` is set on the server.
- The renderer makes no backend request and grants no authorization bypass.
- Existing shell, navigation, search API, tokens, application screens, backend
  contracts, canonical routes, and rollback implementations were not replaced or
  deleted.
- `/field/**`, Field PWA, offline field execution, and iPad screens are excluded.

## Verification on 2026-07-23

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- Focused F0 Playwright: 6/6 PASS, including the server gate, no data bypass,
  neutral negative states, EN/LTR, AR/RTL, light/dark, 1024/412/390/320 overflow,
  keyboard operation, and automated accessibility.
- Visual evidence Playwright: 2/2 PASS. Two supplied references and six
  implementation matrices were captured externally; hashes are in
  `F0_VISUAL_EVIDENCE_MANIFEST.csv`.
- Planning validator: PASS — 478 uniquely dispositioned requirements, 71 Phase 1
  pages, five isolated Phase 2 pages, 46 files/45 unique designs, 12 packages,
  71 migration rows, and 72 acceptance rows.
- Visible Chrome walkthrough: PASS for the server-gated runtime. Light/dark,
  EN/LTR, AR/RTL, safe provider-unavailable/conflict states, live control input,
  and 390x844 responsive layout were exercised. Horizontal overflow was 0 px and
  Chrome reported no application console errors.

## Unresolved gates — not downgraded

The protected regression aggregate is 26/38 PASS and 12 FAIL. The failures exist
in source or fixtures outside this additive F0 change: two stale navigation
expectations, two G11 dashboard-performance expectations, two existing design
system CSS/source debts, two existing terminology guards, and four runtime shell
tests missing `playwright/.auth/planner.json` under the isolated no-dependency run.
No unrelated route, dashboard, login, terminology, performance, or authentication
fixture was changed to make this batch appear green.

The Product Owner clarified on 2026-07-23 that foundations are internal technical
work and must not be presented as project-screen approval batches. The F0 runtime
is therefore a focused component/state verification harness, not a product screen
or a pixel-identical copy of the complete multi-section design-system
documentation page. The 12 protected failures are the unchanged branch baseline;
F0 introduces no new protected regression. Product-screen approval starts with
M1-M11 only.

## Rollback

Revert the additive F0 implementation commit. Because no canonical route,
existing component, backend contract, migration, or shared data was replaced,
the prior product behavior remains the active rollback path.

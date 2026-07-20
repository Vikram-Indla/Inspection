# Five Golden Screen Input Pack

## Readiness

**BLOCKED_NOT_READY_FOR_CLAUDE_DESIGN.** Two golden inputs are fully evidence-backed, Planning/Visit and Operations/Factory 360 are partial, and Inspector iPad is blocked. The field routes have page-load mutation risk without an isolated fixture; the only Factory 360 record is an automated test fixture; and the Admin GIS map is visually blank despite a 1000/1000 count. These are P0 evidence ambiguities, so `READY_FOR_CLAUDE_DESIGN` is not returned.

## 1. Shared shell and persona-aware navigation — evidence-backed with P1 defects

- Screenshots: `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__admin__populated__ar-RTL__dark__1440x1024__20260719T003610Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__planning-bulk__populated__ar-RTL__dark__1440x1024__20260719T003940Z.png`
- Routes/modes: `/admin` EN/LTR/light and AR/RTL/dark; `/planning/bulk` EN/LTR/light and AR/RTL/dark.
- Preserve: authorization boundaries, persona identity, locale/theme persistence, notification truth.
- Resolve: mixed English fragments, clipped account context, duplicate theme-control naming, job-based navigation and unique accessible names.
- Acceptance: shell retains role/scope/action clarity in EN/AR, light/dark, desktop/tablet/412 px without implying role switching.

## 2. Admin Control Plane — evidence-backed with P1 map/scale defects

- Screenshots: `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__admin__populated__ar-RTL__dark__1440x1024__20260719T003610Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__admin-regulations__populated_or_honest_empty__en-LTR__light__1425x1024__20260719T003500Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__admin-gis__populated__en-LTR__light__1440x1024__20260719T003520Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__admin-audit__populated_or_honest_empty__en-LTR__light__1425x1024__20260719T003438Z.png`
- Source screens: SCR-ADM-001/010/011/020/030/040/050/060/070/080/090.
- Preserve: maker-checker, version, audit and provider fail-closed semantics.
- Resolve: control-plane hierarchy; lifecycle/version visibility; blank-map truth; audit scale; separated irreversible publish actions.
- Acceptance: every engine shows health, version, dependencies, owner, blockers, evidence and one safe next action; published versions remain immutable.

## 3. Planning / Visit workspace — planning evidenced; visit state remains blocked

- Screenshots: `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__planning-bulk__populated__ar-RTL__dark__1440x1024__20260719T003940Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__planning-bulk-review__populated_or_honest_empty__en-LTR__light__1440x1024__20260719T003754Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__planning-plans__populated_or_honest_empty__en-LTR__light__1425x1024__20260719T003757Z.png`
- Screens: SCR-WEB-100/110/120/130/140/150/200/210.
- Preserve: criteria semantics, assignment conflicts, package version, pre-publish versus post-publish route ownership.
- Resolve: Arabic operator/action translation; plan-list scale; criteria/result/selection clarity; validation and conflict evidence.
- Blocker: `/visits`, `/visits/:id`, calendar and workload need deterministic isolated fixtures; no mutation was performed.
- Acceptance: planning-to-visit lifecycle is explicit, bulk selection semantics are testable, and post-publish plan detail stays read-only.

## 4. Inspector iPad workspace — P0 blocked

- Screenshot: **none accepted for current commit**.
- Screens: SCR-IPAD-600..670; implemented aliases `/field`, `/field/:visitId`, `/field/inspection/:id`.
- Reason: inspector sign-in redirects to a page-load-risk route and no isolated deterministic fixture was provided. Capturing shared state would violate WP-01 safety.
- Required fixture: assigned visit plus package, startup, journey/check-in, offline, evidence, findings, submit, returned-correction and conflict states; no real PII; resettable; no shared-server side effects.
- Acceptance before design input: hashed current-commit iPad portrait and landscape captures for every consolidated mode, with offline/sync/immutable behavior provenance.

## 5. Operations / Factory 360 map and dashboard — partial, P0 golden blocker

- Screenshots: `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__dashboard__ops_leadership_view__en-LTR__light__1440x1024__20260719T004240Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__operations-live__populated_or_honest_empty__en-LTR__light__1440x1024__20260719T003805Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__factories__populated__en-LTR__light__1440x1024__20260719T003850Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__factory360-detail__test_fixture_record__en-LTR__light__1425x1024__20260719T003908Z.png`, `design/claude-design-mvp1/operationalization/wp01-design-system-input/20260719T003221Z/screenshots/WP01__visits-map__populated_or_honest_empty__en-LTR__light__1425x1024__20260719T003807Z.png`
- Screens: SCR-WEB-400 and SCR-WEB-500.
- Preserve: projected-route label, role scope, risk/evidence/audit truth and provider-failure states.
- Resolve: dashboard target/source configuration; blank GIS canvas; data-scale composition; live/projected/last-known distinctions.
- Blocker: the 1000 factory rows and selected Factory 360 record are automated test fixtures. A privacy-safe production-like representative record is required.
- Acceptance: map, dashboard and dossier share scope/freshness; operational telemetry truth is explicit; a non-test representative factory supports sponsor review.

## Claude Design handoff rules

Use `PAGE_UI_FINDINGS.csv`, `PAGE_UX_FINDINGS.csv`, `COMPONENT_DISPOSITION_REGISTER.csv` and `DESIGN_SYSTEM_ACCEPTANCE_MATRIX.csv` by ID. Do not invent thresholds, policy, roles, providers, SLAs, Arabic translations or data. Return a design response only for evidence-backed screens; hold Screens 4 and 5 until the P0 fixtures are supplied and recaptured.

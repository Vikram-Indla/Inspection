# Claude Design Prompt — CD-031 / SCR-WEB-400 Factory 360

Paste this entire prompt into a fresh Claude Design account. This is a design-only task; do not implement application code.

## 1. Identity and hard boundary

- Product: Saqeel MVP1 (`صقيل | صناعي`)
- Task/design: `TASK-DESIGN-CD031` / `CD-031`
- Screen: `SCR-WEB-400` — Factory 360
- Route: `/factories/:id`
- Journey: P12
- Roles: Planner, Inspector, Reviewer, Operations and Leadership
- Engines: `ENG-04`, `ENG-06`, `ENG-07`, `ENG-08`, `ENG-09`, `ENG-12`
- Acceptance: `DSG-026`, `DSG-A11Y-001`
- Requirements: relevant `MVP1-M07` requirements plus foundation, RBAC, audit, data-provenance and accessibility contracts.

This is a controlled redesign of an implemented product, not a greenfield concept and not a Claude Code implementation task.

`implementation_authorized: false`

Every Claude Code-facing file must start exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard or overwrite the dirty worktree.

## 2. Mandatory discovery order

Read, in this order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `execution/CURRENT_SLICE.yaml`, `execution/TASK_ROUTER.yaml`, `governance/OPEN_DECISIONS.yaml`
3. `design/claude-design-mvp1/00_START_HERE.md`, `MANIFEST.yaml`, `CURRENT_UI_BASELINE.md`
4. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`, `CODE_ROUTE_RECONCILIATION.csv`, `SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`, `UX_BLIND_SPOT_REGISTER.csv`
5. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md` and the CD-031 row in `Saqeel_43_Screen_Claude_Design_Matrix.csv`
6. `product-contract/screens/screen_route_catalogue.csv`, `domain/atomic_scope.csv`, `domain/state_transitions.csv`, `domain/rbac_matrix.csv`, `governance/error_catalogue.csv`, `evidence/AC_LEDGER.csv`
7. Filtered `FABLE_UNDERSTANDING_TRACEABILITY.csv`, `FABLE_ACCEPTANCE_UNDERSTANDING.csv`, design acceptance/state/evidence matrices
8. Frozen shell: `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `astryx.css`, `tokens.css`
9. `apps/web/src/app/factories/[id]/page.tsx`, `Controls.tsx`, `actions.ts`, `loading.tsx`, plus the factory list route and relevant migrations
10. Factory/read data, storage, RLS, audit, risk, map and localization sources used by the route.

Record branch, commit and dirty-worktree status. If a route, action, data field, RLS policy, audit event, provider, risk derivation, map/boundary, transition or side effect cannot be verified, mark that design and wiring row `HANDOFF_BLOCKED`. Never infer it from screenshots.

## 3. Binding runtime truth

- The implemented route reads one factory with identity and registry provenance: factory code, name, CR number, licence number, region, city, activity class, official coordinates, source and source-sync timestamp.
- It reads `risk_score`, `risk_band` and `risk_version`. The current route does not expose verified risk-driver inputs or a risk-recalculation action. Do not fabricate either; show a source/version-labelled risk summary and mark unproven driver detail or recalculation `HANDOFF_BLOCKED_RISK_DRIVERS`.
- It reads visits, inspections, submission versions, violations, corrective actions and review decision/status as joined history. Preserve their immutable/audited truth; do not invent an aggregate lifecycle or causality relation beyond the queried records.
- Current factory tabs are `overview`, `documents`, `representatives`, `products`, `materials`, `workforce` and `history`. The route reads documents, representatives, products and materials through separate queries. A single service failure must isolate the affected area; never collapse the entire dossier into a false failure.
- Documents carry metadata and `storage_path`; a provider-backed document viewer, signed URL, custody retrieval or preview is not proven by the route. Show metadata and an explicit unavailable state where preview is not verified: `HANDOFF_BLOCKED_DOCUMENT_VIEWER`.
- Add-document, representative, product, material and representative-activation controls exist. Do not redesign an offered mutation as universally allowed: exact role/RLS/audit outcomes must be verified. Any unproven control or action is `HANDOFF_BLOCKED`.
- Coordinates and geofence facts are registry/GIS-owned fields. A live map, authoritative boundary polygon, coordinate-conflict resolution and map provider are not proven merely by latitude/longitude. Mark them `HANDOFF_BLOCKED_MAP`, `HANDOFF_BLOCKED_BOUNDARY` or `HANDOFF_BLOCKED_COORDINATE_CONFLICT` as applicable.
- The shell is accepted and frozen for CD-020–031. Reuse it exactly; do not redesign the global sidebar, top bar, account, theme, language, notifications, sign-out, collapse or mobile drawer.
- Never show raw backend/provider errors. Do not invent a support destination, data freshness threshold, privacy policy, risk weighting, legal status, map authority or provider delivery result.

## 4. Design objective

Help a permitted user establish a trustworthy factory narrative before planning, inspecting or deciding:

`registry identity → provenance/freshness → risk version → operational history → finding/action → document/evidence → audit context`

The page-specific signature interaction is the **Spatial Case Timeline**: a list-equivalent, source-labelled timeline that connects the factory's registered location context, inspection events, evidence/document availability, findings/actions, review decisions and risk-version observations. It must be keyboard-operable, non-color-only and reduced-motion safe. It must never draw a fabricated spatial path, boundary, risk event or causal link; unavailable map/boundary elements are clearly unavailable.

Explicitly reject a CRM 360 card wall, decorative risk gauge, live-map theatre, and a generic dashboard with unrelated factory widgets.

## 5. Hypotheses and counterfactual

Before selection, critique the current fragmented tabbed dossier for:

1. losing provenance/freshness when users move between objects;
2. implying a map/risk story more complete than the runtime proves;
3. making partial-service failure appear like a whole-record failure.

Create three complete, same-size, equal-fidelity 1440px compositions with the same realistic factory data and hard state:

| Hypothesis | Primary architecture |
| --- | --- |
| A — Provenance-first | Registry identity and source freshness lead, then the Spatial Case Timeline and role-scoped operational history. |
| B — Case-timeline-first | The timeline leads while immutable identity, provenance and unavailable spatial truth remain persistent. |
| C — Decision-context-first | Risk/version and open findings/actions lead while provenance, history and role masking stay complete and visible. |

Compare traceability, stale-data safety, partial-service isolation, Arabic/RTL density, keyboard burden, narrow behavior and implementation truth. Do not self-score. Include a populated visual counterfactual without the Spatial Case Timeline explaining the concrete decision loss without inventing research results.

## 6. Required content, state and role contract

Use a provenance-led dossier with:

1. immutable identity, licence/CR, activity, region/city and registry source/freshness;
2. risk score/band/version, with only verified source-level information;
3. location/boundary context that differentiates registered coordinates from an unavailable map/boundary;
4. the Spatial Case Timeline and inspection/review history;
5. findings, actions, versioned submissions, documents and evidence metadata;
6. role-masked data/controls and a section-level partial-service failure treatment.

Required states: populated complete; no inspection history; stale registry source (without an invented threshold); map unavailable; boundary/coordinate conflict unavailable; one service failed while other sections remain usable; unauthorized/masked section; high-risk factory; document preview unavailable; loading; not-found/RLS ambiguity; dark/light; Arabic RTL; 1024; 412px.

Show exact factual labels such as source, last synced, risk version, record scope and unavailable. Do not say “no history” when a history query failed; do not say “no changes” when a risk/map/linked service failed.

For roles, show data minimisation and masked/unavailable treatment rather than inventing role permissions. Leadership aggregation/editing, contact privacy, document custody and visibility are `HANDOFF_BLOCKED` unless exact RLS/role proof is read.

## 7. Accessibility, Arabic and responsive behavior

- Arabic-first `lang=ar dir=rtl` with realistic long Arabic strings and mixed-direction IDs/dates.
- Dark/light semantic parity; status never encoded by colour alone.
- 1440 desktop, 1024 constrained and 390–430px narrow layouts.
- WCAG AA, 48px targets, 16px inputs, semantic headings/regions/tables/lists, visible focus and skip link.
- Define keyboard order: factory identity/provenance → section navigation → timeline → history/findings/documents → permitted controls. On section failure, focus the relevant recovery/status message; on an unavailable data class, announce one concise blocking state.
- Reduced motion presents the same timeline information as a static ordered list.

## 8. Wiring-map contract

Return `WIRING_MAP_CD-031.csv` with: UI trigger/state; component; route/action; guard; canonical transition; table/RPC/provider; RLS role; audit; notification; success; negative/partial result; test; runtime evidence; status.

Cover at least 18 legs: factory identity read; registry provenance/freshness; risk summary/version; risk drivers unavailable; visits/inspection history; submission-version history; violations; corrective actions; reviews; document metadata; document preview unavailable; representative read/add/activation; product read/add; material read/add; map/boundary unavailable; coordinate conflict; section-specific service failure; role masking/RLS; not-found; Arabic/theme/responsive/keyboard/screen-reader.

Every unproven map, boundary, provider, risk-driver, custody viewer, privacy permission, action policy, audit event or notification remains `HANDOFF_BLOCKED` unless exact runtime proof exists.

## 9. Required clean deliverable package

Create only `outputs/cd-031-r1/` containing:

- `CD-031 Factory 360.dc.html`
- `CD-031 Factory 360.standalone.html`
- `cd31-stage.js`, `cd31-annot.js`, `support.js`
- `saqeel-tokens.css`, `saqeel-astryx.css`, `saqeel-prism.svg`
- manifest, component map, wiring map, state matrix, acceptance checklist, research provenance, future handoff/prompt, package inventory and all evidence PNGs.

Provide complete A/B/C hypothesis frames, counterfactual, populated EN/AR dark/light, no-history, registry-stale, map unavailable, one-service failure, role-masked/unauthorized, high-risk, document-viewer-unavailable, 1024 and narrow evidence.

Research at least three primary sources: one enterprise/inspection pattern, one Saudi public-service source and one accessibility/RTL authority. Record observed/adopted/rejected treatment; do not copy visual grammar.

## 10. Mandatory package preflight

Before returning, create `PACKAGE_PREFLIGHT_CD-031.md`. Do not submit unless every check passes:

1. Archive root contains only `outputs/cd-031-r1/`.
2. Archive contains no CD-001–030 file, root duplicate, upload folder, stale prompt or historical screenshot.
3. Every manifest/inventory path resolves inside `outputs/cd-031-r1/`; include `support.js` if referenced.
4. Every governed file says CD-031, SCR-WEB-400 and R1; no stale CD/revision/path appears.
5. A/B/C frames are complete, visibly different full compositions and have distinct hashes.
6. Counterfactual is a populated UI frame, not annotation prose.
7. Every state matrix row names an included PNG.
8. Future Claude Code files have the execution prohibition and `implementation_authorized: false`.

Only when all checks pass return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R1`. Otherwise return `PACKAGE_PREFLIGHT_FAIL` and the exact missing item. Do not implement.

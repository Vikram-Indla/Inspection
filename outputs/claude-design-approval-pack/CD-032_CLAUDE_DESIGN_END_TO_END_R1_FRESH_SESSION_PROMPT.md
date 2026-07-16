# Claude Design Prompt — CD-032 / SCR-WEB-500 Operations Center

Paste this entire prompt into a fresh Claude Design account. This is design-only; do not implement application code.

## 1. Identity and boundary

- Product: Saqeel MVP1 (`صقيل | صناعي`)
- Task/design: `TASK-DESIGN-CD032` / `CD-032`
- Screen: `SCR-WEB-500` — Operations Center and authenticated map
- Routes: `/operations` and `/operations/live`
- Journey: P12
- Roles: Operations, Supervisor and Leadership
- Engines: `ENG-03`, `ENG-04`, `ENG-06`, `ENG-08`, `ENG-09`, `ENG-11`, `ENG-12`
- Acceptance: `DSG-027`, `DSG-A11Y-001`

This is a controlled redesign of an implemented product, not a greenfield concept or a Claude Code implementation task.

`implementation_authorized: false`

Every Claude Code-facing file must start exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard or overwrite the dirty worktree.

## 2. Mandatory discovery order

Read, in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `execution/CURRENT_SLICE.yaml`, `execution/TASK_ROUTER.yaml`, `governance/OPEN_DECISIONS.yaml`
3. `design/claude-design-mvp1/00_START_HERE.md`, `MANIFEST.yaml`, `CURRENT_UI_BASELINE.md`
4. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`, `CODE_ROUTE_RECONCILIATION.csv`, `SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`, `UX_BLIND_SPOT_REGISTER.csv`
5. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md` and the CD-032 matrix row
6. Screen catalogue, atomic scope, state transitions, RBAC, error catalogue, acceptance ledger and filtered FABLE/design matrices
7. Frozen shell: `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `astryx.css`, `tokens.css`
8. `apps/web/src/app/operations/page.tsx`, `Controls.tsx`, `Monitoring.tsx`, `OpsExport.tsx`, `OpsMap.tsx`, `actions.ts`, `loading.tsx`
9. `apps/web/src/app/operations/live/page.tsx`, `LiveOps.tsx`, `LiveMapInner.tsx`, `types.ts`, plus map, notification, audit, SLA, geo-event and provider sources.

Record actual branch, commit and dirty-worktree state. If a route, action, data field, RLS policy, audit event, provider, telemetry fact, map layer, transition or side effect cannot be verified, mark its design/wiring row `HANDOFF_BLOCKED`. Never infer runtime truth from screenshots.

## 3. Binding runtime truth

- `/operations` reads scoped factories, visits, inspections, actions, alerts/notifications and geo events for an operational dashboard. Region/city filters affect monitoring, map and SLA content. The monitoring table is refreshed through the existing server action; it is not live field telemetry.
- The operations map uses official factory coordinates and active-visit state. Its map pins are operational context, not proof of a person’s real-time position.
- `/operations/live` constructs a national projected view from factories and active visits. Inspector route origins, movement and ETAs are deterministic projections derived from visit windows; they are explicitly **not live GPS**.
- Region zones on the live map are calculated centroid circles/aggregate posture. They are approximate visual summaries, not official geographic boundaries.
- The live map uses a tile provider. A failed tile service must leave actionable lists and a usable alternate representation; never imply the operational data itself failed.
- Genuine live telemetry is a future integration only. It must be shown as unavailable/future: `HANDOFF_BLOCKED_GENUINE_TELEMETRY`.
- Notification rows can be queued, but no delivery provider is configured. Never say delivered, received or escalated: `HANDOFF_BLOCKED_NOTIFICATION_DELIVERY`.
- No unproven alert acknowledgement/resolution, incident ownership, corrective-action mutation, export audit, privacy policy or supervisor override may be claimed. Mark such legs `HANDOFF_BLOCKED` unless exact source proves them.
- The shared shell is accepted and frozen for CD-020–031. Reuse it exactly; do not redesign the global sidebar, top bar, account, theme, language, notifications, sign-out, collapse or mobile drawer.

## 4. Design objective

Enable an operations user to answer in under 30 seconds:

`What requires attention now, why, at what scope/freshness, and what verified action is available?`

The page-specific signature interaction is the **Truth-Layer Switch**. It separates:

1. Published plan / scheduled operational facts;
2. Projected routes and approximate region posture;
3. Genuine telemetry — unavailable/future.

It must be keyboard-operable, list-equivalent, non-colour-only, source/freshness-labelled and reduced-motion safe. A layer switch changes the explanatory lens, not the truth. Never animate or label projections as live tracking.

Explicitly reject a NASA-style wall, invented live GPS, surveillance-like inspector tracking, a decorative map that dominates the action queue, and generic dashboard cards with no source/action relationship.

## 5. Hypotheses and counterfactual

Before selection, critique the current surfaces for: map-first theatre, unclear projection truth, scattered SLA/action signals and partial provider failure that can be mistaken for whole-system failure.

Create three complete, same-size, equal-fidelity 1440px compositions using the same realistic data and hard state:

| Hypothesis | Primary architecture |
| --- | --- |
| A — Attention-queue-first | SLA/action/alert priorities lead; Truth-Layer Switch and map coordinate to the selected operational record. |
| B — Truth-layer-first | Layer truth and geography lead; actionable queue stays persistent and complete. |
| C — Visit-workload-first | Monitored visit/workload context leads; map, alert and SLA views remain connected and truthful. |

Compare 30-second attention routing, truth clarity, privacy safety, keyboard burden, Arabic/RTL density, narrow behaviour and implementation truth. Do not self-score. Include a populated counterfactual without the Truth-Layer Switch explaining the concrete safety loss without inventing research results.

## 6. Required content and states

Use a coordinated operations workspace with:

1. source/freshness/scope strip and Truth-Layer Switch;
2. actionable SLA watch, alerts, monitored visits, workload and corrective actions;
3. map/layer/legend that filters with the selected queue record, plus list/table alternative;
4. selected-visit/factory context drawer only where a real route/object link is verified;
5. provider/tile and notification truth that distinguishes queue state, projection and unavailable future telemetry.

Required states: normal; published-plan view; projected-route view; genuine-live telemetry unavailable/future; stale freshness; widget-specific failure; tile-provider failure; no visits; privacy-limited scope; alert resolved only if action is proven; alert-resolution unavailable otherwise; notification queued-not-delivered; loading; RLS/unauthorized; dark/light; Arabic RTL; 1024; 412px.

Use exact labels: `Published plan`, `Projected from visit window — not live GPS`, `Approximate region posture`, `Genuine telemetry unavailable`, `Notification queued — delivery not confirmed`, source and refreshed-at timestamp. Do not invent a stale threshold, alert owner, delivery provider, boundary authority or telemetry precision.

## 7. Arabic, accessibility and responsive contract

- Arabic-first `lang=ar dir=rtl`, realistic long Arabic data and mixed-direction IDs/dates.
- Dark/light semantic parity; status has label/icon/pattern beyond colour.
- 1440 desktop, 1024 constrained and 390–430px narrow layouts.
- WCAG AA; 48px interactive targets; 16px inputs; semantic headings/regions/tables/lists; visible focus and skip link.
- Define keyboard order: truth layer → scope/freshness → priority queue → map/list alternative → selected record/drawer → permitted actions/exports. Map markers must have list-equivalent keyboard access; tile failure must not remove the alternative list.
- Reduced motion freezes projected-route movement and exposes a static origin/projection/destination explanation.

## 8. Wiring-map contract

Return `WIRING_MAP_CD-032.csv` with: UI trigger/state; component; route/action; guard; canonical transition; table/RPC/provider; RLS role; audit; notification; success; negative/partial result; test; runtime evidence; status.

Cover at least 20 legs: dashboard RLS read; region/city scope; operational KPI derivation; factory/visit map pin; monitored-row refresh; SLA watch; actions; high-risk view; geo-event read; notification read; notification delivery unavailable; export; selected visit/factory navigation; published-plan lens; projected route calculation; approximate region posture; genuine telemetry unavailable; map tile failure; widget failure; no visits; privacy/RLS; alert resolve/acknowledge; Arabic/theme/responsive/keyboard/screen-reader/reduced motion.

Every unproven telemetry, provider delivery, alert state change, ownership, export audit, privacy rule, boundary, map precision or operational action remains `HANDOFF_BLOCKED` unless exact runtime proof exists.

## 9. Required clean deliverable package

Create only `outputs/cd-032-r1/` containing:

- `CD-032 Operations Center.dc.html`
- `CD-032 Operations Center.standalone.html`
- `cd32-stage.js`, `cd32-annot.js`, `support.js`
- `saqeel-tokens.css`, `saqeel-astryx.css`, `saqeel-prism.svg`
- manifest, component map, wiring map, state matrix, acceptance checklist, research provenance, future handoff/prompt, package inventory and all evidence PNGs.

Provide complete A/B/C frames, counterfactual, EN/AR dark/light, published-plan, projected-route, genuine-telemetry-unavailable, tile failure, widget failure, no visits, privacy limit, queued-not-delivered, 1024 and narrow evidence.

Research at least three primary sources: one enterprise/operations pattern, one Saudi public-service source and one accessibility/RTL authority. Record observed/adopted/rejected treatment; do not copy visual grammar.

## 10. Mandatory package preflight

Before returning, create `PACKAGE_PREFLIGHT_CD-032.md`. Do not submit unless every check passes:

1. Archive root contains only `outputs/cd-032-r1/`.
2. Archive contains no CD-001–031 file, root duplicate, upload folder, stale prompt or historical screenshot.
3. Every manifest/inventory path resolves inside `outputs/cd-032-r1/`; include `support.js` if referenced.
4. Every governed file says CD-032, SCR-WEB-500 and R1; no stale CD/revision/path appears.
5. A/B/C frames are complete, visibly different full compositions and have actual, recorded SHA-256 hashes that differ.
6. Counterfactual is a populated UI frame, not annotation prose.
7. Every state-matrix row names an included PNG.
8. Future Claude Code files have the execution prohibition and `implementation_authorized: false`.
9. All interactive targets are at least 48×48px in desktop, RTL and 412px evidence.

Only when all checks pass return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R1`. Otherwise return `PACKAGE_PREFLIGHT_FAIL` and the exact missing item. Do not implement.

# Kimi — Implement Minister/Leadership Command Module

You are the implementation owner for the Minister/Leadership Command module in the existing MIM Inspection Platform. You must build the working module in the canonical repository; you are not being asked to produce a design handoff or a static concept.

## Mandatory access and authority gate

The sole canonical repository is `/Users/vikramindla/Developer/Inspection`. Never use `/Users/vikramindla/Documents/GitHub/Inspection`.

Before any code, verify direct access to the canonical Git worktree and open:

1. `/Users/vikramindla/Developer/Inspection/AGENTS.md`
2. `/Users/vikramindla/Developer/Inspection/product-contract/00_START_HERE.md`
3. `/Users/vikramindla/Developer/Inspection/product-contract/CURRENT_STATE.md`
4. `/Users/vikramindla/Developer/Inspection/product-contract/GATE_STATUS.md`
5. `/Users/vikramindla/Developer/Inspection/product-contract/execution/CURRENT_SLICE.yaml`
6. `/Users/vikramindla/Developer/Inspection/product-contract/execution/TASK_ROUTER.yaml`
7. `/Users/vikramindla/Developer/Inspection/product-contract/governance/OPEN_DECISIONS.yaml`
8. `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/00_START_HERE.md`

Also read the source baseline under:

`/Users/vikramindla/InspectionOps/MIM_Inspection_MVP1_Historical_Archives_v3/MIM_Inspection_MVP1_COMPLETE_DOCUMENTATION_DUMP_v2/01_SOURCE_BASELINE`

and the current code/contract for authentication, roles, Dashboard, Operations, Factory 360, maps, reporting, assistive AI, audit, evidence, i18n and shared Shell.

If canonical access fails, return only `CANONICAL_PATH_ACCESS_GATE: FAIL`, the exact error, `NO_WORK_PERFORMED: true` and the action required.

If the current slice/change-control does not authorize this implementation, return `IMPLEMENTATION_AUTHORITY_REQUIRED` with the exact missing approval. Do not create a parallel implementation outside the product contract.

## Objective

Implement a separate Minister login and a working Minister/Leadership Command module, using the existing governed application design system, Shell, navigation, authentication patterns, routes, components, tokens and provider contracts.

This is an implementation task. Build real routes, components, authorization checks, data adapters, state handling, tests and evidence. Do not produce a disconnected visual mock-up or hand the work to Claude Design.

The experience must be premium, calm, Saudi institutional and evidence-led. Use the existing login map only as restrained inspiration for geographic realism. Follow the existing authenticated design system; do not introduce a separate visual language, novelty animation or generic dashboard-card clutter.

## Separate Minister login — strict authorization rule

First inspect the existing RBAC/authentication model and determine whether an approved Leadership/Minister authorization boundary already exists.

- If an existing Leadership boundary exists, implement a distinct Minister login entry/account experience mapped to that existing authorization boundary. Reuse canonical authentication, session, audit and authorization guards.
- Do not invent a new `minister` role, RLS policy, database table, seed user, password, provider, claim or permission model.
- If the requested separate login requires a new role, new credentials, new claims, RLS changes, database migration or provider configuration not already authorized, stop and return `MINISTER_LOGIN_AUTHORITY_REQUIRED` with the exact product/RBAC decision required.
- Never expose credentials in source, screenshots, logs or handoff material.
- Verify cross-persona isolation: a Minister session cannot perform Administrator, Operations, Planner, Inspector, Reviewer or Auditor actions merely because it can view executive information.

## Implemented module scope

Implement these connected, functional views under the existing design system:

1. **Minister Command landing** — authorized executive situation view: planned, active, completed, returned and overdue inspection positions only where governed data lineage exists; active scope, freshness, source coverage and exception priorities.
2. **Saudi geographic command** — use only the repository's existing approved map stack/provider. Build national → region/zone → city/industrial area → sector → factory → inspection drilldown. A 3D geographic/industrial view is progressive enhancement only: it must have clear operational purpose, selection, comparison and drilldown, plus an equivalent accessible ranked list. If approved 3D provider capability is unavailable, fail honestly to the existing 2D/list view; do not fake a 3D digital twin.
3. **Performance, compliance and remediation** — governed inspection history, trends, coverage, violations, remediation and action plans with source drilldown. Do not invent metric formulas, values or thresholds.
4. **Factory and inspection evidence drilldown** — provenance, freshness, audit trail, status and authorized evidence links.
5. **AI executive composer** — approved preset and free-form questions only through the existing assistive-AI/provider boundary. Show interpreted filters, citations, source records, freshness, uncertainty, partial/conflicting sources, cannot-answer, unauthorized and provider-unavailable states. AI must not make decisions, mutate workflow or invent facts.
6. **Briefing mode** — privacy-safe executive presentation using authorized aggregates, Arabic/RTL and constrained-screen behaviour.

## Required states and quality

Implement normal, loading, empty, stale, partial-data, conflicting-data, unauthorized, no-results, map-unavailable, incomplete-coordinates, AI-unavailable, AI-timeout, missing citation, inaccessible evidence, mobile/constrained and Arabic/RTL states as applicable.

Use existing shared Shell, side navigation, top command area, typography, tokens, theme behaviour and form geometry. Preserve light/dark, EN/AR, keyboard, focus, screen-reader, target-size and reduced-motion behaviour. The Minister experience must not weaken existing routes, input behaviour, workflow, RLS, audit, offline/conflict or immutable-version semantics.

## Implementation method

1. Reconcile every new route/component/adapter with requirement, screen, engine and acceptance IDs.
2. Create the smallest coherent Minister vertical slice first: authorization → landing → map/list → source drilldown → negative state.
3. Add performance/remediation and AI composer only after their governed data/provider boundaries are proven.
4. Use existing APIs/RPCs/adapters. Do not create permanent mocks and call them complete.
5. Keep a file-ownership map so this work does not collide with Codex screen-upgrade work or onboarding implementation.
6. Make every unavailable integration fail closed and visibly degraded.

## Required verification and evidence

For every slice provide:

- requirement/design/code/test/evidence traceability;
- separate-login/Leadership authorization proof and cross-persona negative tests;
- EN/AR, RTL, light/dark, responsive, keyboard, focus and accessibility evidence;
- map/list equivalence and provider-unavailable proof;
- AI citations, uncertainty, cannot-answer, authorization and provider-unavailable proof;
- data provenance/freshness/partial-source proof;
- typecheck, production build, focused tests and protected regression;
- before/after screenshots with route, persona, state, commit and acceptance IDs;
- session and machine-readable handoff record.

Do not push, merge, deploy, change `main`, mutate shared data, apply database migrations, alter providers, alter policies or update the programme ledger without explicit authority.

## First response

Before implementation, respond with exactly:

`CANONICAL_PATH_ACCESS_GATE`

`IMPLEMENTATION_AUTHORITY`

`EXISTING_LEADERSHIP_AUTH_BOUNDARY`

`MINISTER_LOGIN_FEASIBILITY`

`CURRENT_ROUTES_AND_COMPONENTS`

`DATA_AND_PROVIDER_TRUTH`

`IMPLEMENTATION_SLICES`

`FILE_OWNERSHIP_AND_COLLISION_RISK`

`TEST_AND_EVIDENCE_PLAN`

`DO_NOT_TOUCH`

`READY_TO_IMPLEMENT` or `IMPLEMENTATION_AUTHORITY_REQUIRED` or `MINISTER_LOGIN_AUTHORITY_REQUIRED`

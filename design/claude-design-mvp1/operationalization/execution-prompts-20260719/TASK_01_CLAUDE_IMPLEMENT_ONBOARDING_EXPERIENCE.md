# Claude — Implement Premium Onboarding and Persona Academy

You are the implementation owner for the premium Inspection Platform onboarding experience. Build it in the canonical MIM Inspection repository; do not produce a design handoff or a static concept.

## Mandatory access and authority gate

The only repository is `/Users/vikramindla/Developer/Inspection`. Never use `/Users/vikramindla/Documents/GitHub/Inspection`.

Before any work, directly access the canonical Git worktree and read:

1. `/Users/vikramindla/Developer/Inspection/AGENTS.md`
2. `/Users/vikramindla/Developer/Inspection/product-contract/00_START_HERE.md`
3. `/Users/vikramindla/Developer/Inspection/product-contract/CURRENT_STATE.md`
4. `/Users/vikramindla/Developer/Inspection/product-contract/GATE_STATUS.md`
5. `/Users/vikramindla/Developer/Inspection/product-contract/execution/CURRENT_SLICE.yaml`
6. `/Users/vikramindla/Developer/Inspection/product-contract/execution/TASK_ROUTER.yaml`
7. `/Users/vikramindla/Developer/Inspection/product-contract/governance/OPEN_DECISIONS.yaml`
8. `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/00_START_HERE.md`

Read the source baseline under `/Users/vikramindla/InspectionOps/MIM_Inspection_MVP1_Historical_Archives_v3/MIM_Inspection_MVP1_COMPLETE_DOCUMENTATION_DUMP_v2/01_SOURCE_BASELINE`, the existing login experience, shared Shell, side navigation, i18n, authentication, roles, routes, media/storage/provider adapters, audit and current onboarding research already on disk.

If canonical access fails, return only `CANONICAL_PATH_ACCESS_GATE: FAIL`, exact failed paths, `NO_WORK_PERFORMED: true` and the action required. If current slice/change-control does not authorize this build, return `IMPLEMENTATION_AUTHORITY_REQUIRED`; do not build around the product contract.

## Objective

Implement a high-definition onboarding experience that lets a new visitor understand the platform and lets an authenticated user learn their governed role.

Build two connected layers:

1. **Login-page onboarding entry** — a clearly visible but secondary public link from the existing login page, such as `Explore the Inspection Platform` or its approved Arabic equivalent. It opens a public-safe introduction with no protected data, no role switching and no claims that unavailable integrations are live.
2. **Authenticated Persona Academy** — a first-class learning destination in the existing shared Shell and side navigation. Selecting a persona opens learning material for that persona; it never changes the signed-in user's authorization, role, data scope or operational identity.

Use the realism, geography and Saudi industrial confidence of the existing login map as visual inspiration. Follow the existing authenticated design system for the product itself. Do not create a separate marketing site, childish animation, fictional characters or a generic video gallery.

## High-definition real-character media

Implement a production-quality media experience for approved high-definition onboarding material:

- Real Saudi industrial/government locations and real people only where approved media exists.
- Correct PPE and credible operational behaviour.
- Arabic and English video/audio tracks where assets exist.
- Poster image before playback.
- Captions, transcript, audio-description reference, playback speed, keyboard controls and focus management.
- Reduced-motion behaviour and no audible autoplay.
- Network/loading, unavailable-media, restricted-media, transcript-only and provider-unavailable states.
- Content version, route linkage, release linkage, rights/expiry metadata and audit-visible content status.
- Privacy-safe demonstration data; never expose real sensitive inspection/evidence data in public material.

Do not invent a video provider, CDN, streaming service, licensed footage, talent release or storage policy. Reuse an approved existing media/storage boundary. If the required HD assets or provider configuration are absent, implement the complete media container, accessibility states, asset manifest and fail-closed unavailable state; return `MEDIA_ASSET_OR_PROVIDER_REQUIRED` with the exact missing asset/provider decision. Do not label placeholders as high-definition completed video.

## Platform scope to implement

1. Public login-page onboarding link and safe intro route.
2. Introductory platform storyline: `Plan → Prepare → Inspect → Prove → Decide → Improve`.
3. Persona Academy in the existing side panel and top navigation context.
4. Persona landing pages for all roles already governed by the repository: Administrator, Operations, Planner, Inspector, Reviewer, Auditor, Factory Representative, Committee/Compliance where authorized and Leadership/Minister where authorized.
5. Inspector learning flow: assignment, preparation, route/geofence truth, physical and virtual inspection, evidence, offline/sync/conflict, submit, review return and correction.
6. Minister/Leadership learning flow: national command, map/list, metrics, provenance/freshness, governed AI boundaries, uncertainty and unavailable states.
7. Learning chapters, short task videos, long demonstration chapters, posters, transcripts, downloadable guides and contextual help.
8. Route-aware contextual help that points to approved material without changing workflow state.
9. Versioned content registry and controlled fallback states.

## Authorization and security rules

- The public introduction never exposes authenticated data, factory details, evidence, inspection totals, role permissions or executive analytics.
- Persona selection is content navigation only; it is never an authorization switch.
- Authenticated content respects the existing role and data boundary.
- Do not create roles, passwords, seed users, RLS policies, migrations, provider configuration or permanent mocks.
- Do not mutate inspection state to demonstrate workflows.

## Implementation method

1. Inspect existing routes, components, auth guards, media patterns and i18n keys before adding anything.
2. Build the smallest coherent vertical slice first: login-page link → public-safe intro → authenticated Academy entry → one governed persona chapter → video/transcript/unavailable state.
3. Expand to remaining governed personas and learning flows only with requirement/route traceability.
4. Use existing Shell, navigation, typography, tokens, themes and input geometry. Do not fork the design system.
5. Keep exact file ownership and avoid collisions with Minister implementation and existing screen-upgrade work.
6. Make missing media/provider conditions visible, accessible and fail closed.

## Required verification and evidence

For each implemented slice provide:

- requirement/design/code/test/evidence traceability;
- public-versus-authenticated authorization proof;
- proof that persona selection cannot switch roles;
- EN/AR, RTL, light/dark, desktop/tablet/iPad, keyboard, focus, reduced-motion and accessibility proof;
- captions/transcript/poster/unavailable-media/provider-unavailable tests;
- route-aware help and content-version evidence;
- typecheck, production build, focused tests and protected regression;
- before/after screenshots with route, persona, state, commit and acceptance IDs;
- machine-readable session handoff.

Do not push, merge, deploy, change `main`, alter database/provider/policy/release state, expose credentials or update the programme ledger without explicit authority.

## First response

Before implementation, respond with exactly:

`CANONICAL_PATH_ACCESS_GATE`

`IMPLEMENTATION_AUTHORITY`

`CURRENT_LOGIN_AND_AUTH_TRUTH`

`CURRENT_SHELL_AND_NAVIGATION_TRUTH`

`MEDIA_AND_PROVIDER_TRUTH`

`PUBLIC_AND_AUTHENTICATED_ROUTE_PLAN`

`PERSONA_SCOPE`

`IMPLEMENTATION_SLICES`

`FILE_OWNERSHIP_AND_COLLISION_RISK`

`TEST_AND_EVIDENCE_PLAN`

`DO_NOT_TOUCH`

`READY_TO_IMPLEMENT` or `IMPLEMENTATION_AUTHORITY_REQUIRED` or `MEDIA_ASSET_OR_PROVIDER_REQUIRED`

# SAQEEL Web/Admin Screen Execution Drill

Date: 2026-07-24  
Owner: Codex orchestrator  
Status: F0 design correction active; product code unchanged

## Control room

| Quadrant | Owner | Permanent purpose |
|---|---|---|
| Top left | Claude Design | Design authority, revisions and named visual evidence |
| Top right | Real SAQEEL runtime | Implementation truth and sponsor-visible proof |
| Bottom left | ChatGPT | Independent challenge, RCA and prompt refinement |
| Bottom right | Claude Code | Read-only repository mapping until a lease is approved |

## Invariant execution loop

Every screen passes the same sequence:

1. Load the source ID/hash, route manifest, preservation matrix, acceptance
   status and applicable `CR-001..CR-478` rows.
2. Inventory the real route, component, service, permission, state, tests and
   current Chrome behavior.
3. Compare the stable design revision against the authority and runtime.
4. Exercise named viewport, theme, language, state and keyboard variants.
5. Return defects to Claude Design; never correct design gaps in product code.
6. Produce a bounded consent packet.
7. After sponsor consent, record one implementation lease and one reviewer.
8. Wire without backend or capability regression.
9. Run authority-derived positive, negative, permission, responsive, RTL,
   accessibility and provider-failure tests.
10. Show the real implementation in Chrome and obtain a sponsor decision before
    starting the next module.

## F0 — Shared Web/Admin shell

| Item | Contract |
|---|---|
| Authority | `WA-SHELL-SRC-001`, route manifest, shell preservation matrix and shell acceptance ledger |
| Preserve | authenticated shell, RLS-safe search, date/region scope, notifications, AI fail-closed entry, theme, language, account, route guards, responsive drawer, focus behavior |
| Design proof | exact fixed rail; bilingual asset; 1440, 1024, 768–899 drawer, 412, 390, 320; EN/AR; light/dark; default/loading/empty/error/unauthorized/degraded/provider-unavailable |
| Wiring proof | exact labels/order/parents/targets; `/field/**` excluded; every current extra route retained beneath a governed hub |
| Negative proof | unauthorized direct routes, field-only persona, unavailable search/scope/provider, empty results, keyboard traversal, stale manifest mutation tests |
| Chrome proof | expand/collapse, every group and child, mobile drawer/actions, EN/AR, themes, target navigation and permission negatives |
| Stop condition | any missing, renamed, reordered, clipped, inaccessible or cross-channel destination; any control shown as functional without a service contract |

Current design revision under correction: `WA-SHELL-r4`.

## M1 — Dashboard

| Item | Contract |
|---|---|
| Authority | `dashboard.xlsx`, `WA-SHELL-SRC-001`, Dashboard requirement/design rows |
| Preserve | Strategic/Operational views, RLS scope, real intervention/violation links, approved versus pending compliance grains, live refresh, truthful `not configured`, deterministic filters and fail-closed AI |
| Design proof | all Strategic and Operational workbook sections/options; full drill-downs; traceable AI summary/nudges; no invented values; shared shell inherited once |
| Wiring proof | real queries/services and exact route/query state; Analytics entry at `/dashboard?view=analytics`; no duplicated top bar |
| Negative proof | empty scope, missing policy, unavailable provider, unauthorized metric/drill-down, stale data, no-result search, AI unavailable |
| Chrome proof | Strategic, Operational and Analytics; filter, drill-down and return; real record links; EN/AR; light/dark; responsive layouts |
| Stop condition | invented KPI/threshold, AI acting instead of advising, approved/pending grains mixed, workbook option lost or extra feature displacing the two primary views |

Known wiring delta: the manifest fixes `/dashboard?view=analytics`, but current
`page.tsx` recognizes only `strategic` and `operational` and otherwise falls
back to Strategic. M1 design must define a visible Analytics landing/focus
inside the governed Dashboard experience without displacing Strategic and
Operational as the two primary perspectives. A silent alias to Strategic is
not sufficient evidence.

## M3 — Operations Center

| Item | Contract |
|---|---|
| Authority | `Opearation Center.xlsx`, `WA-SHELL-SRC-001`, Operations Center requirement/design rows |
| Preserve | real operations records, filters, maps/tables, deep links, permission boundaries and provider truth |
| Design proof | Live Operations Map, Regional Performance Map and Operational Highlights as the three primary capabilities |
| Wiring proof | latest GPS/factory/active visit grain; selected metric retained through national→region→factory; rule/event-backed highlights |
| Negative proof | inactive inspectors excluded, stale/missing GPS, no selected metric, unauthorized region/factory, provider unavailable, empty highlights |
| Chrome proof | filter a permitted operational scope, open Visit and Factory 360, drill the same metric, open a traceable highlight and return without lost context |
| Stop condition | fabricated live pins/ETA, automatic recommendations/decisions, inconsistent metric grain, invented thresholds or secondary views displacing the three primary capabilities |

## M4 — Factories and Factory 360

| Item | Contract |
|---|---|
| Authority | `Factory 360.docx`, `WA-SHELL-SRC-001`, Factory requirement/design rows |
| Preserve | current Factory routes, search, CR/license data, visits, evidence, permissions, providers and deep links |
| Design proof | CR Overview, License Selector/Overview, Factory Profile, Compliance, Industrial/Government Information, Documents, Timeline and evidence-linked AI Insights |
| Wiring proof | one CR to many licenses; one license to one plant; latest approved inspection compliance; latest completed Risk Engine score; immutable versions; provider provenance |
| Negative proof | multiple licenses, no license, missing/expired provider data, returned/rejected inspection exclusion, unauthorized export/Create Inspection, AI/provider unavailable |
| Chrome proof | search permitted factory, open Factory 360, switch license, inspect compliance/documents/timeline, demonstrate provider-unavailable and AI fail-closed states |
| Stop condition | inferred data, hidden provider absence, merged official/inspection evidence, invented risk explanation or responsive loss of information |

## Drift alarms

Stop immediately if anyone:

1. uses current source or its tests as the authority;
2. promotes an extra capability into fixed first-level navigation;
3. starts the next module before the parent shell is verified;
4. introduces `/field/**` into Web/Admin navigation;
5. marks any lane green without current revision, commit, runtime, negative tests
   and sponsor-visible evidence.

## Current sponsor decision point

No implementation decision is requested yet. Finish and independently verify
`WA-SHELL-r4`, reconcile Claude Code's exact F0/M1 lease, and then issue one
bounded F0 consent packet.

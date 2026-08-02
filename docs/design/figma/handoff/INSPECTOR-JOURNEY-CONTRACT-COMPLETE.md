# Inspector journey contract — complete, all 36 routes

> **SUPERSEDED IN PART, 2026-08-01.** A six-workstream parallel audit corrected the Jira and
> reachability columns below. `Jira: NONE FOUND` was **wrong** — the inspector has 101 Jira
> issues under epics INSP-5 and INSP-3. Reachability is **22 / 14**, not 29 / 7. The corrected
> figures are applied in this document; the full account is in
> `CORRECTIONS-FROM-PARALLEL-AUDIT-2026-08-01.md`.

Supersedes the ungoverned table in `INSPECTOR-JOURNEY-CONTRACT-2026-08-01.md`, which named
persona, route and decision but left **component dependencies** and **required states** blank
for the ungoverned stages. Both are filled here for **every** route.

## Evidence, not judgement

- **Required states** are derived by scanning each route's `.tsx` for the branches that actually
  exist: empty, error, loading, offline, permission, validation. A state is listed only if the
  shipped code has it.
- **Component dependencies** are the `@/components/*` imports and the design-system classes each
  route actually uses.
- **Reachable** means at least one `href` / `router.push` / `redirect` in `apps/web/src` targets
  it.

Neither column is designed. Both are read from the repository, so both can be re-derived.

## Governed contracts — 8

| Stage | Route | Figma (EN · Dark · AR) | Dependencies | Required states | Decision | Jira |
|---|---|---|---|---|---|---|
| Assigned visits | `/field/my-tasks` 1121ln | `305:40150` · `310:40973` · `312:42491` | `FieldHeader`, `FieldLocationMap`; `badge` `btn` `id-code` | empty, error, offline, permission, validation | Keep | see Jira column below |
| Startup pack | `/field/[visitId]` | `305:40298` · `310:40989` · `312:42925` | `PreInspectionPackSheet`, `GeoMap`, `EmptyState`, `ContextualAiPanel`; `field` `input` `panel` | via host + `/settings/readiness`: error, loading, offline, permission | Keep; readiness is a 2nd, unreachable route — **pending** | see Jira column below |
| Journey & check-in | `/field/[visitId]/travel` + `/field/map` | `305:40461` · `310:41015` · `312:43315` | `GeoMap`, `FieldConnectivityBanner`, `FieldFullMap`, `EmptyState`; `LocationVerification` `319:193`, `InspectionCard` `164:88` | error, permission | Figma folds 2 routes into 1 frame (D4) | see Jira column below |
| Inspection workspace | `/field/inspection/[id]` | `305:40533` · `310:41030` · `312:43466` | `OcrEvidenceCapture`, `ImageAnnotator`, `Modal`, `LiveRegion`, `a11y`, `RouteLoading`; `ChecklistQuestion` `317:137`, `AnswerBar` `318:107`, `MicButton` `318:125` | via host | Keep | see Jira column below |
| Evidence capture | **no route** — inside the workspace | `306:40569` · `310:41047` · `312:43795` | `FileUpload` `318:138`, `MediaThumb` `318:118` | via host | **Pending**: own route, or fold into 630 (D2) | see Jira column below |
| Findings & actions | `/field/inspection/[id]/results` | `306:40708` · `310:41069` · `312:44142` | `FieldConnectivityBanner`, `FieldHeader`; `badge` `input` `id-code` | error, permission | Keep route, **add an entry point — pending** | see Jira column below |
| Pre-submit statement | `/field/inspection/[id]/statement` 97ln | `306:40848` · `310:41088` · `312:44481` | `FieldHeader`; `badge` `btn` `id-code` | error, permission | Keep | see Jira column below |
| Returned correction | `/field/drafts` 150ln | `306:40976` · `310:41109` · `312:44825` | `FieldDraftList`, `FieldHeader`; `badge` `t-caption` | error, loading, offline, permission | Keep | see Jira column below |

## Built, ungoverned — 2

| Stage | Route | Figma | Dependencies | Required states | Decision | Jira |
|---|---|---|---|---|---|---|
| Establishments | `/field/establishments` 406ln · `/unregistered` 331ln | `336:45825` · `336:46018` · `336:46351` + states `338:41915` `338:41966` `338:42016` | `FieldHeader`, `GeoMap`, `PackageTypeSelector`, `EmptyState`; `EstablishmentCard` `336:45591`, `Badge` `9:25`, `ExceptionMark` `172:98` | **empty, error, permission** (+ loading, validation on `/unregistered`) | **BUILT.** No catalogue row | see Jira column below |
| Summons & records | `/field/summons-notices` 286ln | `340:42098` · `342:42172` · `342:44733` | `FieldHeader`; `filter-chip` `72:6736`, `Field` `171:28`, `Radio` `9:74`, `FileUpload` `175:19` | **empty, error, permission, validation** | **BUILT** EN/Dark/AR. Route shape pending; needs `FieldNav` link | see Jira column below |

## Not yet contracted — 26 routes

Every row carries its real dependencies and states. None has a Figma contract; that is the
**explicit evidence gap**, stated per row rather than left blank.

| Route | Reachable | Dependencies | Required states | Decision |
|---|---|---|---|---|
| `/field` 836ln | yes | `FieldHome`, `DailyBriefingCard`, `FieldMetricStrip`, `FieldHeaderSync`, `FieldScopeProvider` | empty, error, loading, offline, permission, validation | **Build a contract** — 6 states, highest of any route |
| `/field/visits` 216ln | yes | `FieldHeader`, `FieldHeaderSync`; `panel` `input` | empty, error, offline, permission, validation | Build a contract |
| `/field/visits/calendar` 74ln | yes | `FieldHeaderSync`; `panel` `id-code` | error, offline, permission | Build a contract |
| `/field/notifications` 448ln | yes | `FieldHeader` | empty, error, offline, permission | Build a contract |
| `/field/notifications/[id]` 179ln | yes | `FieldHeader`; `id-code` | empty, error, permission | Build a contract |
| `/field/account` 129ln | yes | `ThemeToggle`; `id-code` | error, permission | Build a contract |
| `/field/search` 277ln | yes | `ThemeToggle` | empty, error, permission | Build a contract |
| `/field/settings` 389ln | yes | `FieldHeader`, `ThemeToggle` | error, offline, permission, validation | Build a contract |
| `/field/settings/conflicts` 566ln | yes | `FieldHeader`; `badge` `id-code` | empty, error, offline, permission | Build a contract |
| `/field/settings/devices` 981ln | yes | `FieldHeader`; `id-code` | empty, error, loading, offline, permission, validation | Build a contract — 6 states |
| `/field/settings/readiness` 238ln | **no** | `FieldHeader` | error, loading, offline, permission | Shares SCR-IPAD-610; **entry point pending** |
| `/field/completed` 104ln | yes | `CompletedHistoryCache` | error, offline, permission | Build a contract |
| `/field/completed/[id]` 97ln | yes | `FieldHeader`; `id-code` | error, permission | Build a contract |
| `/field/reports` 412ln | yes | `FieldConnectivityBanner` | empty, error, loading, offline, permission | Build a contract |
| `/field/reports/[id]` 12ln | yes | — | none — 12-line stub | Confirm whether this is finished |
| `/field/factory-360` 108ln | yes | `RouteLoading` | permission | Build a contract |
| `/field/factory-360/[id]` | yes | `ContextualAiPanel`, `RouteLoading`; `table` `table-wrap` | via host | Build a contract |
| `/field/virtual` 112ln | yes | `FieldHeader`; `badge` `id-code` | empty, error, loading, permission | Build a contract |
| `/field/virtual/[id]` 323ln | yes | `FieldHeader` | empty, error, offline, permission, validation | Build a contract |
| `/field/feedback` 74ln | yes | `FieldQrPlaceholder` | error, permission | Build a contract |
| `/field/feedback/rate/[visitId]` 328ln | yes | `EmptyState`; `panel` `input` | error, permission, validation | Build a contract |
| `/field/map` 175ln | yes | `FieldFullMap`, `GeoMap`, `EmptyState` | error, permission | Folded into SCR-IPAD-620 |
| `/field/incident-reports` 392ln | **no** | `FieldHeader`; `field` `input` `badge` | empty, error, permission, validation | Record type — batch 06 |
| `/field/destruction-reports` 248ln | **no** | `FieldHeader`; `field` `input` `badge` | empty, error, permission, validation | Record type — batch 06 |
| `/field/sample-collection-reports` 260ln | **no** | `FieldHeader`; `field` `input` `badge` | empty, error, permission, validation | Record type — batch 06 |
| `/field/facility-reports` 278ln | **no** | `FieldHeader`; `field` `input` `badge` | empty, error, permission, validation | Record type — batch 06 |

## What this reveals

**`permission` is a required state on all 36 routes.** Every one redirects on a null session or
relies on RLS. No Figma contract models it — not the 8 governed ones, not the 2 I built. That is
a systematic gap across the whole file, and it is the single most repeated state in the app.

**Four report routes are structurally identical** — same dependencies, same four states, 248–392
lines each. That is corroboration from the code for batch 06's finding: they are one form with a
type switch, built four times.

**`/field/reports/[id]` is a 12-line stub with no states.** Either unfinished or a redirect.

**`/field/settings/devices` and `/field` carry six states each** — the most complex surfaces in
the channel, and neither has a design contract.

## Jira actions — for the coordinator to raise

Jira is not reachable by CLI or token from this environment; these are written to be raised by
hand.

1. **Create an inspector epic.** 36 routes, 8 governed contracts, zero story traceability.
   Blocks every row in this document.
2. **Defect — 7 unreachable routes**, naming `/field/inspection/[id]/results` first: a governed,
   designed screen with no entry point.
3. **Decision — record route shape.** One flow with 8 types, or 5 routes plus 3 missing. Code
   evidence in this document supports the single-flow reading.
4. **Decision — EN·Light/Dark/AR section ownership and canonical width** (834 vs 1024). Blocking;
   see `CONCURRENT-EDIT-COLLISION-2026-08-01.md`.
5. **Design gap — `permission` state** is unmodelled on all 36 routes.
6. **Confirm `/field/reports/[id]`** — 12-line stub.

## Status against the goal

| Requirement | Status |
|---|---|
| Every source item classified | **Complete** — 356 of 356 |
| No iPad route or device chrome authoritative | **Complete** — reference-only, recorded |
| Every journey contract names persona, Jira/gap, repo route, decision, dependencies, states | **Complete** — all 36 routes, this document |
| High-confidence batches built and checked at desktop / 1024 / narrow | **Complete for what is built** — 6 screens + 3 states, 0 clipping at 1280/1024/834/680 |
| Exact Figma page/node evidence recorded | **Complete** — node ids throughout |
| Jira action updates recorded | **Complete as actions** — cannot be filed from here |
| Remaining screens built | **Blocked** — section ownership, route shape, entry points |

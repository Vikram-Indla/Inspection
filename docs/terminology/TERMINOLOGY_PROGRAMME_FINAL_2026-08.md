# Terminology programme — final reconciliation ledger (2026-08)

Baseline: `origin/main` @ `16e27b63`
Branch: `fix/terminology-programme-final`
Figma file: `ML2PNwfShlQM2k44MvSEw5` ("Inspection - Web", team Senaei 2.0, project "Saqeel design system")
Figma page audited: `6:9` — "— SCREENS —" (32 sections: 4 canonical EN/AR × Light/Dark ×
29 routes, plus STATES/OVERLAYS/1024/EXTERNAL/INSPECTOR/BUILD sub-sections)

## Scope actually covered vs. the full request

The requested scope (every completed journey × Admin/Planner/Supervisor/Inspector ×
EN/AR × light/dark × 1280/1024/720, Figma-first then code) is real, multi-week design-
governance work. This pass did a grounded, evidence-backed sweep for two concrete
violation classes across the entire populated Figma SCREENS page and the entire code
tree, rather than a shallow first-page-only pass. It is not a claim that every string in
every screen has been read by a human eye — it is a claim that every text node
matching the target patterns was mechanically found and either fixed or explicitly
triaged. See "Known gaps" at the end for what a follow-up pass should do next.

## Key finding: nav rail names are canonical, not violations

The Figma canon's own nav labels ("Compliance Library", "Approval Queue", "Enforcement
Library", "Lookup Management", "Risk/Survey/Notification/Integration Configuration")
confirmed these ARE the approved business names — not banned jargon. This validates
the shell-nav revert already shipped in PR #157 (`702bbee`). No further nav-rail change
was made or needed.

## Dictionary — before → after (with evidence)

| Term | Before | After | Source | Confidence |
|---|---|---|---|---|
| workspace (page title) | "Inspection Workspace" | "Inspection Execution" | Figma node `345:42291` + 4 duplicates; code `field/inspection/[id]/loading.tsx` | High — matches nav's own "Execution" label |
| workspace (page title) | "Visit Management Workspace" | "Visit Management" | Figma nodes `227:30101/30240/30380` | High |
| workspace (page title) | "Level 2 Review Workspace" | "Level 2 Review" | Figma nodes `227:31362/31503/31644` | High |
| workspace (badge) | "Read-only workspace" | "Read-only" | Figma nodes `I190:18020;11:41` + 6 duplicates | High |
| workspace (body copy) | "The governed AI policy for this workspace has not been enabled, so no brief is generated." | "The AI policy has not been enabled here, so no brief is generated." | Figma nodes `I167:9132…`, `I167:10718…`, `I443:49763…` | High — also dropped "governed" jargon |
| workspace (body copy) | "This workspace shows the real package, item, template, impact and locked-version data already used by execution." | "This screen shows the real…" | `apps/web/src/app/(app)/admin/packages/page.tsx:348` (EN+AR) | High |
| workspace (body copy) | "Return to your assigned workspace or ask an administrator for the required role." | "Return to your assigned area or…" | `admin/localization/page.tsx:52` (EN+AR) | High |
| workspace (body copy) | "The field workspace can cold-start offline once the shell is cached." | "The field app can start offline once the shell is cached." | `field/settings/readiness/DeviceReadinessClient.tsx:127` (EN+AR) | High |
| workspace (body copy) | "This visit is cancelled and the workspace is now read-only." | "…and this screen is now read-only." | `field/inspection/[id]/page.tsx:589` | High |
| workspace (body copy) | "Loading inspection workspace…" | "Loading inspection…" | `field/inspection/[id]/loading.tsx:7` (EN+AR) | High |
| workspace (body copy) | "Open the owning workspace to inspect and decide the source record." | "Open the source record to inspect and decide." | `operations/exceptions/page.tsx:68` | High |
| workspace (body copy) | "Begin remote inspection → same workspace & submission flow" | "…same screen & submission flow" | `virtual/[id]/page.tsx:57` | High |
| workspace (body copy) | "This workspace requires an authorized admin, planning, supervisor or assigned-inspector role…" | "This review requires an authorized Admin, Planner, Supervisor or assigned Inspector role…" | `reviews/[id]/page.tsx:76` | High — also fixed to canonical persona names |
| workspace (heading) | "Preparing your workspace…" | "Getting things ready…" | `launch/loading.tsx:17` | Medium — neutral rewrite, no exact business term to reuse |
| workspace (heading) | "Draft workspace" | "Drafts" | `admin/dashboard-config/page.tsx:144` | High |
| workspace (heading) | "No workspace is assigned to your account yet" | "No role is assigned to your account yet" | `launch/no-workspace/page.tsx:27` | High — matches the body copy on the same page, which already said "no role" |
| immutable | "Latest immutable version" | "Latest final version" | Figma nodes `I191:18215…`, `I199:20920…`, `I236:33840…`, `I239:36681…` | High — matches code precedent shipped in earlier waves |
| immutable | "A published version is immutable. Create a change request to alter it…" | "A published version is final and cannot be edited. Create a change request to change it…" | Figma node `I225:25072;11:42` | High |
| immutable | "A published plan is immutable. Changes are made by superseding it…" | "A published plan is final. Changes are made by superseding it…" | Figma node `I227:29820;11:42` | High |
| immutable | "The note becomes part of the immutable record." | "The note becomes a permanent part of the record." | Figma node `I227:31645;11:26` | High |
| immutable | "Immutable" (standalone badge) | "Final" | Figma node `I241:40289;70:13` | Medium — one-word badge, context-dependent |
| RLS-scoped / (RLS) | "Current RLS-scoped records" | "Records filtered to your access" | `operations/RevampOperationsCenter.tsx:164` | High |
| RLS-scoped | "RLS-scoped operational exceptions…" | "Operational exceptions filtered to your access…" | `operations/exceptions/page.tsx:42` | High |
| RLS-scoped | "Available RLS-scoped groups remain visible…" | "Available groups filtered to your access remain visible…" | `operations/exceptions/page.tsx:54` | High |
| RLS-scoped | "…none are in your scope (RLS)." | "…none are in your scope." | `operations/exceptions/page.tsx:61` | High |
| RLS-scoped | "…RLS-scoped · maker-checker" (context badge) | "…filtered to your access · maker-checker" | `admin/dashboard-config/page.tsx:71` | High |
| read model | "Unavailable in this Web read model; open the assigned Field workspace." | "Not available in this web view; open the assigned Inspector responsive web app." | `execution/RevampExecutionWorkspace.tsx:368` (EN+AR) | High — also applies the "Inspector responsive web" naming rule and drops the second "workspace" |
| role-name casing | "admin, planning, supervisor or assigned-inspector" | "Admin, Planner, Supervisor or assigned Inspector" | `reviews/[id]/page.tsx:76` | High — verified against the literal RBAC check `["supervisor","admin","planner","inspector"]` |
| role-name casing | "review, planning, operations, or assigned inspector" | "Admin, Planner, Supervisor, or assigned Inspector" | `reviews/page.tsx:98` | High — verified against `authorized = ["supervisor","admin","planner","inspector"].some(...)` in the same file |

## Explicitly NOT changed (and why)

- **"iPad" as a local-device reference** ("Saved on this iPad", "Enroll this iPad") —
  these describe the physical hardware the inspector is holding, a true statement about
  local storage, not a channel/product-scope claim. Left as-is. Distinct from the banned
  usage (calling the *product/channel* "the iPad app").
- **`SCR-IPAD-*`, `data-factory360-layout="ipad-field"`, `.ipad-preview`/`.ipad-q` CSS
  classes** — internal requirement codes and CSS class names, never rendered as text.
- **`dossier` as an internal symbol** — `loadFactory360Dossier`, `dossier.ts`,
  `dossierStrings`, `styles.dossier`, `dossierHref`, and all `dossier.<field>` property
  access remain untouched per the original project's explicit internal-architecture
  exception. `apps/web/src/app/(app)/factories/FactoryList.tsx` still contains
  `strings.dossier` — verified this component is not imported anywhere (dead code), so
  it has zero live user-visible impact; left alone rather than editing dead code.
- **`SCREENS — INSPECTOR UNGOVERNED (migrated from source · no catalogue row)`** — this
  Figma section is explicitly labeled by the design team as not yet governed/catalogued.
  It contains real "Dossier sections" / "RLS scoped" / "Immutable submission history"
  text that would need the same fixes, but editing text on a screen whose own existence
  is unresolved seemed premature. **Decision-needed**: is this screen in the active
  scope? If yes, it needs the same terminology pass as the rest.

## Coverage gaps found (not introduced by this pass)

- The `SCREENS — STATES`, `OVERLAYS`, `1024`, `EXTERNAL`, and most `BUILD *` Figma
  sections exist only as **EN · Light**. There is no AR/RTL or Dark duplication of these
  state/overlay/breakpoint variants yet — so several of the fixes above (e.g. "Latest
  immutable version" → "Latest final version") could not be mirrored into Arabic or dark
  theme because no such frame exists to edit. **Decision-needed**: build the missing
  AR/Dark duplicates (a design-build task, not a wording fix) or accept EN·Light as the
  temporary source of truth for these states.
- `apps/web` has no lint script and no automated i18n-coverage checker (confirmed in
  earlier waves' `VALIDATION_REPORT.md`) — still true.
- Three routes discovered in earlier follow-up work (`/compliance`, `/enforcement-library`,
  and the `field/*` PWA report-form routes) still have known terminology gaps tracked in
  a separate spawned task; this pass did not re-touch them.

## Validation

- `npx tsc --noEmit` (apps/web): 0 errors.
- `npx next build`: PASS, 0 errors/warnings.
- Static Playwright suite (`playwright.static.config.ts`, per instruction the broader
  acceptance programme was explicitly NOT run this pass): 55 failed / 356 passed on
  this branch vs. 58 failed / 353 passed on a clean `origin/main` baseline taken the
  same session — diffed by exact test ID, the 3-test delta is entirely the
  `terminology-regression.spec.ts` suite's own tests going from failing to passing
  (the earlier-shipped regression guard had drifted behind new code paths since PR #156;
  its internal-symbol allowlist was extended with 8 new entries, each with an inline
  comment justifying why the matched pattern is genuinely internal, not a real
  violation). Zero net-new failures.
- Figma: all 31 text-node edits confirmed via the `use_figma` tool's returned node IDs
  (listed in the dictionary above); no `get_screenshot` visual pass was run this
  session — text-only edits within existing auto-layout containers, low clipping risk,
  but not visually re-verified.

## Rollback

All code changes are on `fix/terminology-programme-final`, not merged. Figma edits are
live on the file (Figma has no branch/PR concept — edits are immediate) but are
recorded above with exact node IDs and original text for manual revert if needed. No
Supabase schema, RLS, route, or business-logic change was made anywhere in this pass.

# SAQEEL Inspection — IA Reconstruction · Claude Code Handoff

**Revision:** H4 · supersedes H1–H3 · 26 Jul 2026
**Design artefact:** `Saqeel Revamp.dc.html` (single Design Component, opens in any browser)
**Offline copy:** `export/Saqeel Revamp (standalone).html` · **Frames:** `designs/` (45 PNGs, `designs/INDEX.md`)
**Repo binding:** `github.md` (repo, branch, last sync, screen→source map)
**Authoritative inputs:** `uploads/saqeel (4).html` · local repo `Inspection/` (`github.com/Vikram-Indla/Inspection`) · repo tokens `apps/web/src/app/tokens.css`

**Status:** all 15 destinations designed at fidelity. **Nothing is an unresolved shell any more** — Review & Approval and Analytics are both built (see §6.7 and §6.11). Twelve sponsor questions remain open (§12); none of them block Phase 1–4 of the build.

---

## 0. How to use this package

1. Open `Saqeel Revamp.dc.html`. Use the topbar to switch **role** (Planner / Inspector / Administrator), **state** (14 states), **language** (EN / ع), **theme**, and **Annotated view**.
2. Annotated view prints, per screen: route · source HTML section · repository source · components reused · new components required · data/service dependencies · role visibility · permission behaviour · responsive behaviour · state matrix · implementation impact. **Read the annotation for a screen before implementing it.**
3. This document is the contract. Where the artefact and this document disagree, the artefact is the presentation authority and the repository is the behavioural authority.

---

## 1. Sponsor decisions (binding)

| # | Decision | Consequence |
|---|---|---|
| D1 | **Three canonical roles**: Planner, Inspector, Administrator. Full navigation visible to all. | Repo change required — §5, §11 |
| D2 | **HTML/prompt labels win**: Compliance Library · Approval Queue · Enforcement Library | Terminology regression test must be updated |
| D3 | Extra repo routes **fold in** as tabs/sub-views | Nothing deleted — §4 |
| D4 | **Repo tokens win absolutely**; HTML contributes structure only | HTML's dark emerald/Sora skin not carried forward |
| D5 | Review & Approval originally unresolved | **Superseded** — built from repo evidence, §6.7 |
| D6 | Breadth before depth — all 15 destinations | Delivered |
| D7 | Every state designed | 14-state matrix, §8 |
| D8 | EN + AR/RTL | Live toggle, ~620-entry dictionary + pattern layer, §7.3 |
| D9 | Mapbox token available | Live Mapbox GL, §9 |
| D10 | Realistic values + separate unverified list | §13 |
| D11 | One artefact, clean/annotated toggle | Topbar "Annotated view" |
| D12 | Nav badges are real | Review & Approval 9 · Approval Queue 3 |
| D13 | **Migrate the artefact to repo-native tokens** (this session) | §2.3 — `ax-` prefix retired |

---

## 2. Discovery ledger

### 2.1 Repository facts established by reading source

| Area | File read | What it establishes |
|---|---|---|
| Shell navigation | `apps/web/src/lib/shell-navigation.ts` | `buildShellNavigation()` **removes** unauthorised destinations — a least-privilege projection, not a catalogue. `isFieldOnlyPersona()` strips the web shell for Inspectors. `ADMIN_HUBS`: People & access · Rules & content · Risk & intelligence · Planning & execution · Connections & geography |
| Roles | same | Eleven keys: `compliance_admin`, `form_admin`, `workflow_admin`, `security_admin`, `gis_admin`, `risk_owner`, `planner`, `inspector`, `reviewer`, `ops`, `leadership` |
| Shell chrome | `apps/web/src/components/ShellClient.tsx` | 248px rail / 68px collapsed, sticky topbar, portal overlays |
| Tokens | `apps/web/src/app/tokens.css` | "SAQEEL Inspection Design System v1.0 — owner-approved 2026-07-20. Supersedes the legacy token sheet." `--surface-*`, `--text-*`, `--action-*`, `--status-*`, `--space-*`, `--radius-*`. `--sq-*` is a **temporary shim, removed in PR12** |
| Components | `apps/web/src/app/saqeel-runtime.css` | `.btn/.btn-secondary/.btn-ghost/.btn-danger`, `.panel`, `.badge-*`, `.table`, `.nav-item`, `.sidebar*`, `.topbar`, `.seg/.seg-opt`, `.tabs/.tab`, `.filter-chip`, `.id-code`, `.kpi`, `.drawer`, `.alert*`, `.skeleton` |
| Map renderer | `apps/web/src/app/(app)/operations/live/LiveMapInner.tsx` | `mapbox://styles/mapbox/standard`, centre `[45.0, 23.9]`, zoom 6 clamp 5–11, `lightPreset` day/night, `ops-live-*` layer ids, 12s failure timeout, **WA-DES-034-C3: markers are projected, read-only — never live GPS** |
| Map palette | `apps/web/src/lib/map-palette.ts` | Fixed renderer hexes (Mapbox cannot resolve CSS variables): high `#B42318`/`#7A271A`, medium `#8A5A00`/`#5F3D00`, low `#18794E`/`#0F5132`, neutral `#175CD3`/`#1849A9` |
| Region geometry | `apps/web/public/geo/sau-regions.geo.json` | Canonical 13-region polygons — copied to `geo/sau-regions.geo.json` |
| Analytics route | `apps/web/src/app/(app)/analytics/page.tsx` | Route **exists**; currently renders `UnresolvedDestination` and cites this design file in its header |

### 2.2 Conflicts recorded

| ID | Conflict | Higher authority | Resolution | Impact |
|---|---|---|---|---|
| C1 | 11 repo role keys vs 3 mandated roles | Prompt (D1) | Three roles; repo keys become a mapping table | **High** — migration + guard rewrite |
| C2 | Nav hides unauthorised items vs "always visible" | Prompt (D1) | Stop filtering; guards refuse on entry | **High** — one function, all routes |
| C3 | `isFieldOnlyPersona()` removes the web shell for Inspectors | Prompt (D1) | Inspector keeps the shell; refused per route | **High** |
| C4 | Repo labels vs HTML labels | Prompt (D2) | HTML labels adopted | **Medium** — terminology test |
| C5 | HTML static SVG map vs repo Mapbox | Prompt + repo | Mapbox only | None |
| C6 | HTML dark emerald skin vs repo tokens | Prompt (D4) | Repo tokens | None |
| C7 | `/analytics` route exists, module does not | Repo | Destination designed (AN-R2); route reconciliation raised | **Medium** — §12 Q8–Q10 |
| C8 | Review & Approval placeholder in HTML | Repo | Recovered from `cd-028`/`cd-029`/`cd-030` + ENG-12 | **Medium** — §12 Q1–Q7 |
| C9 | Astryx `ax-` prefix vs repo-native tokens | Repo (D13) | Artefact migrated; `ax-` retired | Closed |

### 2.3 Token and class migration (D13)

The artefact no longer uses the Astryx `ax-` vocabulary. It loads the repo's own sheets, copied verbatim into `repo-css/`:

| Astryx (was) | Repo-native (now) |
|---|---|
| `--ax-color-surface` / `-field` / `-sunken` | `--surface-primary` / `--surface-secondary` / `--surface-sunken` |
| `--ax-color-text` / `-secondary` | `--text-primary` / `--text-secondary` / `--text-muted` |
| `--ax-color-primary` / `-strong` / `-tint` | `--action-primary` / `--action-primary-hover` / `--accent-soft` |
| `--ax-color-critical` / `-warning` / `-success` | `--status-critical` / `--status-warning` / `--status-compliant` |
| `--ax-color-border` / `-strong` / `-control` | `--border-subtle` / `--border-strong` / `--border-input` |
| `.ax-btn`, `.ax-surface`, `.ax-lozenge`, `.ax-table`, `.ax-nav-item`, `.ax-segmented` | `.btn`, `.panel`, `.badge`, `.table`, `.nav-item`, `.seg` |

Only two layout hooks retain the old names (`.ax-shell`, `.ax-shell__main`) because they are the artefact's own grid, not design-system classes. **No hex is authored in the artefact**; every tint derives via `color-mix()`.

---

## 3. Navigation and route map

Inspection is a **chevron group**; Administration is **pinned at the foot, collapsed by default**.

```
Overview
  Dashboard                    /dashboard
  Operations Center            /operations
  Factory 360                  /factories
Operations
  Planning                     /planning
  Inspection            ▸ (collapsible group)
    Execution                  /execution          ← web channel (/field = iPad)
    Review & Approval  ⑨       /reviews
Compliance
  Compliance Library           /compliance
  Approval Queue     ③         /compliance/approvals
  Enforcement Library          /enforcement-library
Insights
  Analytics                    /analytics
─────────────────────────────── (pinned footer)
Administration       ▸ (collapsed by default)
  Users & Roles                /admin/access
  Lookup Management            /admin/localization
  Risk Configuration           /admin/risk
  Survey Configuration         /admin/packages
  Notification Configuration   /admin/notifications
  Integration Management       /admin/integrations
```

Rail 248px / 68px collapsed. The collapse control lives in the brand row when expanded and moves to a dedicated **Expand** row in the pinned footer when collapsed — it cannot fit beside the 36px mark at 68px. Nav rows are 34px; `.nav-item` carries `margin-inline: 8px`, so child rows compute at `calc(100% - 24px)` to avoid overrunning the rail.

**Query-state contract** (tabs and drawers are query state, never subroutes): `?tab&period&compare&region&sector&type&status&q&layer&drill`.

---

## 4. Folded repo destinations (D3)

| Repo route | Folds into | As |
|---|---|---|
| `/visits`, `/tasks` | Execution | Sub-views of the visit list |
| `/virtual` | Execution | Visit mode = virtual |
| `/field` | Execution | iPad channel — retained, not merged |
| `/cases`, `/committee` | Enforcement Library | Detail sub-views |
| `/admin/bulk-violations` | Enforcement Library | Bulk action |
| `/admin/enforcement-recommendations` | Enforcement Library | AI recommendations |
| `/portal` | Out of scope | Documented, route untouched |
| 24 admin routes | 6 Administration destinations | Grouped by `ADMIN_HUBS`, surfaced as sub-tabs |

Fold by **adding redirects**, never by deleting routes.

---

## 5. Three-role visibility and access matrix

**Every role sees every destination.** Access is refused on entry with a deliberate unauthorised state that names the enforcing contract.

| Destination | Planner | Inspector | Administrator |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ⛔ |
| Operations Center | ✅ | ✅ | ⛔ |
| Factory 360 | ✅ | ✅ | ⛔ |
| Planning | ✅ | ⛔ | ⛔ |
| Execution | ✅ read + reassign | ✅ full (own visits) | ⛔ |
| Review & Approval | ⛔ | ⛔ | ✅ decide |
| Compliance Library | ✅ read | ⛔ | ✅ full |
| Approval Queue | ✅ read | ⛔ | ✅ decide |
| Enforcement Library | ✅ read | ⛔ | ✅ full |
| Analytics | ✅ | ✅ | ✅ (scope differs) |
| Administration ×6 | ⛔ | ⛔ | ✅ full |

Refusal copy cites the source: Planner refusal names the admin role family in `shell-navigation.ts`; Inspector refusal names `isFieldOnlyPersona()` (RBAC-009/010); Administrator refusal names `isAdminOnlyPersona()`.

**Role mapping required at build time:**

| Repo key | Canonical role |
|---|---|
| `planner` | Planner |
| `inspector` | Inspector |
| `reviewer` | Administrator *(provisional — §12 Q2)* |
| `ops`, `leadership` | Planner (read) — confirm |
| `compliance_admin`, `form_admin`, `workflow_admin`, `security_admin`, `gis_admin`, `risk_owner` | Administrator |

---

## 6. Page-by-page information architecture

### 6.1 Dashboard `/dashboard`
Segmented **Strategic / Operational**.

*Strategic* — National performance (Inspection coverage against annual target · National compliance rate · Inspection approval rate); Compliance Performance Explorer with Region/City/Sector/Authority lenses; Strategic intervention (Top violated regulation · Critical factories requiring intervention · Factories pending annual inspection); Enforcement action trend; Executive AI brief.

*Operational* — Operational AI priorities; Today's planned visits; Today's visit completion rate; Active field inspections; Overdue planned visits; Reports awaiting approval; Returned reports; High-priority visits pending execution; Inspector capacity.

Every metric card carries: business question · value · **definition/calculation** · worked example · interpretation · drill action + destination. Not decorative tiles.

### 6.2 Operations Center `/operations`
Segmented **Operations map / National performance**. Live Mapbox (§9), map/list parity switch, breadcrumb drill Saudi Arabia → region, legend, provider label. Summary KPIs (Active visits · On the way · Executing · Submitted today · Active alerts). Live operational exceptions with related-record actions. Inspector and factory quick cards open as drawers.

### 6.3 Factory 360 `/factories`
Three columns preserved from the HTML: **portfolio rail** (CR + licence selection, portfolio stats) · **centre workspace** · **persistent AI rail**.

Centre: factory/licence header with opened-from + reason, Create inspection / View on map / Export PDF; plant number, licence type, stage, status; condition hero with reason list; snapshot (risk, compliance, latest inspection, open violations, active penalties, employees, products, machines); collapsible sections — Compliance (reports, violations, penalties, trends) · Factory profile (identity, location, contacts, official + inspection galleries) · Industrial information (products, machines, raw materials, workforce, production) · Government information · Documents (preview/download) · Timeline with **selected licence / complete CR** scope toggle.

AI rail: Factory summary · Top risks · Latest changes · Recommended actions · Predicted risk · Why high risk (weights read from Risk Configuration) · Next best action; plus provenance with last sync and named source states.

### 6.4 Planning `/planning`
Distinct workspace — never merged with Execution. Command bar (Refresh · Export · Saved views · **Create visit** menu). Four creation flows with their own contracts: **Single visit** (`cd-020`, `/planning/single`), **Bulk planning** (`cd-021`, `/planning/bulk` → `/planning/bulk/review`), **Immediate visit** (`cd-023`, `/planning/immediate`, authority bar), **Follow-up visit** (HTML-present, **no repo route — UNVERIFIED**). Assistant hero: AI insights (confidence + freshness) · AI recommendations · Quick actions. Eight buckets: Needs planning · High risk · Draft · Returned · Published · Expiring windows · Expired · AI suggested. Search + filters, multi-select, bulk bar (Publish · Assign inspector · Cancel). 14-column visit table with an "All columns" toggle. Visit detail: factory summary, planning information, risk and history, AI explanation, audit.

### 6.5 Execution `/execution`
Week calendar with month option; dragging onto a day opens Configure **with the planning window enforced** — never a silent reschedule. Segmented **My inspections / All inspections / Live map**. Filters: inspector, region, risk, visit mode, operational state. Column set differs by view. Operational states: assigned → ready → on the way → arrived → executing → submitted. Detail: planning-window banner, visit, assignment (reassignment permitted before journey start, reason required), report package, tracking, offline package with queued actions.

### 6.6 Review & Approval `/reviews`
**Built from repo evidence** (`cd-028-review-queue`, `cd-029-review-workspace`, `cd-030-version-comparison`, immutability ENG-12 / MVP1-FND-003). Distinct from Approval Queue: this decides **submitted inspection reports**.

Queue segmented **Submitted · In review · Returned · Approved · Rejected**, ten records. Workspace panels are **per record and lifecycle-derived** — never a shared body:

| Lifecycle | Compliance panel | Violations panel | Decision rail |
|---|---|---|---|
| Submitted / in review | "Provisional compliance result", rate provisional | "Penalty proposed" | Decision available |
| Returned | **"Not published"** — answered-item count retained as audit history only | No penalty language | "Held by the inspector" |
| Rejected | **"Not published"** | No enforcement outcome | "Decided and closed" |
| Approved | "Final compliance result", rate **final** | "Penalty final" / "Enforcement active" | Immutable (§11.4) |

Every displayed rate is computed from that record's numerator/denominator pair, so the queue chip and the workspace cannot disagree. Queue chips derive from the same `life` field as the workspace.

### 6.7 Compliance Library `/compliance`
Hierarchy preserved: Regulation → Inspection item → Violation → Penalty → Action form. Library search, All regulations + authority nav with counts, recently opened, catalogue table (record list below 1280), regulation workspace with six tabs (Overview · Inspection items · Violations · Penalties · Versions · Audit history), immutable read-only banner, Create opens a configuration request.

### 6.8 Approval Queue `/compliance/approvals`
Three-column configuration review: request list · object-by-object workspace · progress/decision/supporting rail. Six-step sequence Overview → Regulation → Inspection items → Violations → Penalties → Summary. Per object: change type (Created/Modified/Deleted/No change), current-vs-proposed diff with changed rows highlighted, dependencies, impact analysis, validation, object-level Approve/Return/Reject with mandatory comment. Deciding an object routes to the next pending one. **Package decision stays disabled until every object is decided — enforce in the database, not only in the UI.**

### 6.9 Enforcement Library `/enforcement-library`
Search, status/date/region filters, export, nine-column table (record list below 1280). Detail: factory, inspection, violation, penalty, evidence with chain of custody, enforcement timeline, audit, Factory 360 navigation.

### 6.10 Analytics `/analytics` — revision AN-R2
**Replaces `designs/17-analytics-unresolved.png`; the unresolved shell is withdrawn.**

Compact header: title, subtitle, date range, compare, region, sector, **inspection type**, **status**, last-refreshed, source-status indicator, export, filter reset. No hero.

- **Executive KPI band** — governed metrics with value, directional comparison, numerator/denominator access, freshness, source status, drill-through.
- **Planning-to-execution** conversion: planned → published → completed → reviews pending → approved → returned/rejected, chronology preserved in RTL.
- **Regional ranked list** and factory investigation table with Factory 360 drill-through.
- **Operational bottlenecks** — seven ranked rows (unpublished plans · published-not-started · over-duration executions · reports awaiting decision · configuration requests · ageing corrective actions · enforcement awaiting outcome), each with count, ageing and destination. Rows navigate; **no row transitions a workflow**.
- **Two AI surfaces, off by default** — Strategic inspection brief and Operational attention queue both render **Not configured**, stating why, what appears once enabled, and what they will never do (approve, publish, assign, penalise, enforce). Enabled state is behind the `aiPolicy` prop.
- **Drill-through drawer** — one reusable panel for any metric or bottleneck: applied filters as chips, what the metric counts in business language, source status, freshness, numerator/denominator, supporting records, and an explicit RLS note where scope limits the list. No table or field names on the canvas.

**Route reconciliation required**: `/analytics` and the Dashboard analytics-view contract overlap in the repository. That is a behavioural conflict for engineering; this design does not resolve it visually and creates no second Analytics destination.

### 6.11 Administration ×6
Each surface: breadcrumb `Administration › <hub>`, metric strip (3 governance figures), sub-tabs per hub, filter toolbar, record table, governance rail, reconstruction note, and a maker-checker/immutability banner where the repo enforces one (risk publish weights totalling 100%, author cannot approve own change; package immutability once used by a published visit; self-elevation rule). Rows open a drawer with Record / Governance / Audit and an *Edit through request · View activity log* action bar.

---

## 7. Responsive, accessibility and bilingual behaviour

### 7.1 Breakpoints (computed in the logic class; the design system owns the CSS)

| Range | Behaviour |
|---|---|
| ≥1440 | Factory 360 and Approval Queue three-column; full tables; AI rail sticky |
| 1280–1439 | Two-column; AI rail full width; full tables |
| 1024–1279 | iPad landscape; secondary table columns drop; week board 4-up |
| 834–1023 | iPad portrait; nav becomes an overlay drawer; record lists replace tables |
| <834 | Phone; everything stacked; agenda calendar |

**No horizontal scrolling at any width.** Tables are `table-layout: fixed` at 12/16 with wrapping cells (the repo's `.table th { white-space: nowrap }` must be overridden per table, not globally). Below 1280 secondary columns leave the table and the record list carries every field, so nothing becomes unreachable. Verified zero overflowing elements at 390 / 834 / 1024 / 1280 / 1600 in both languages.

### 7.2 Accessibility
Keyboard operation throughout; visible 2px focus ring; semantic table markup with scope; status is text + glyph, never colour alone; map has a first-class list equivalent; reduced-motion honoured; truncation with ellipsis only where the full value is available in the record drawer.

### 7.3 Arabic and RTL
Translation is a **rendering pass**, not a per-screen rewrite: the template stays English (matching the repo and this handoff), and a ~620-entry dictionary plus a pattern layer for generated text (dates, relative times, counts, `ID · authority · date` composites) swaps the rendered tree and restores the English original on toggle back. Residual English is limited to the SAQEEL wordmark, Mapbox attribution, and contract identifiers, which are **never translated** by design.

RTL is achieved with logical properties only — no hardcoded left/right. Chronological charts and numeric sequences keep semantic order rather than being mechanically mirrored. Both light and dark themes are available in both directions.

**Implementation note:** in the repo, do this with i18n resources, not a DOM pass. The DOM pass exists because the artefact is a single file; the dictionary in it is a ready-made AR resource bundle.

---

## 8. State matrix

Fourteen states, switchable per screen from the topbar (and via the `screenState` prop).

**Blocking** (replace the workspace): loading · skeleton · empty · filtered empty · error (with correlation ID) · unauthorised (names the enforcing contract) · session expired · Mapbox unavailable.
**Non-blocking banners** (workspace stays usable): stale data · offline (outbox) · conflict · validation · AI provider unavailable.

Rules encoded: empty is never shown while a request is in flight; filtered-empty preserves filters; error states assert no mutation occurred; the map's list fallback is a first-class equivalent, not a degraded view; AI failure withholds assistant output but never authoritative records; **a failed query is never rendered as a truthful zero**.

---

## 9. Mapbox specification

Mirrors `LiveMapInner.tsx` exactly.

- Style `mapbox://styles/mapbox/standard`; `lightPreset` day/night follows theme; `show3dObjects: false`.
- Centre `[45.0, 23.9]`, zoom 6, `minZoom` 5, `maxZoom` 11. Language follows the EN/AR toggle.
- Sources/layers: `ops-live-regions` (fill + line), `ops-live-region-labels-src` (symbol), `ops-live-factories` (circle), `ops-live-inspectors` (circle; selected widens radius and stroke).
- Region fill is a `match` on region id driven by compliance rate: ≥85 low/green · 75–84 medium/amber · <75 high/red; 0.28 opacity in National performance, 0.06 in Operations map.
- Colours from `map-palette.ts` verbatim — Mapbox cannot resolve CSS custom properties.
- Interactions: inspector → quick-card drawer; factory → popup; region (national mode) → drill + `easeTo` zoom 7.4; pointer cursor on hover.
- **12-second load timeout → Mapbox-unavailable state → list fallback.**
- Markers are projected from visit windows and labelled as such. Never presented as live GPS (WA-DES-034-C3).
- Token from `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; overridable via the `mapboxToken` prop.

---

## 10. AI specification

**Factory 360 rail** — Factory summary · Top risks · Latest changes · Recommended actions · Predicted risk · Why high risk · Next best action, plus last synchronisation and named data sources with freshness states.

**Analytics** — two advisory surfaces, **Not configured by default**: Strategic inspection brief and Operational attention queue. Each states its purpose, why it is dark, what appears when enabled, and what it will never do. When enabled: evidence-linked statements with counts, freshness, permission scope and confidence, or an explicit abstention. CTAs navigate to filtered module views and **never approve, reject, publish, assign, penalise or trigger enforcement**.

**No risk formula, weight, recommendation, legal value, compliance value or deadline is authored in the UI.** "Why high risk" reads weights from Risk Configuration, so the two surfaces agree by construction. Provider failure withholds AI output and leaves every authoritative record intact.

---

## 11. Impact and regression map

| Change | Files | Blast radius |
|---|---|---|
| Stop filtering navigation | `lib/shell-navigation.ts` | Every route — nav becomes a catalogue; guards must refuse correctly |
| Collapse 11 role keys → 3 | role constants, guards, RLS policies, seeds | **Highest risk** — needs the §5 mapping and a data migration |
| Inspector keeps the web shell | `isFieldOnlyPersona()` | Inspector sessions across all routes |
| Terminology change | i18n EN/AR + terminology regression test | Test asserts repo wording today |
| Route rebinding | `/execution`, `/compliance`, `/compliance/approvals`, `/enforcement-library` | Add redirects from old paths |
| `/analytics` module | new module behind the existing route | Route exists; module does not |
| `/reviews` build-out | review queue + workspace | §12 Q1–Q7 shape the decision semantics |
| Table wrapping | per-table override of `.table th` nowrap | Any screen with a data table |

Preserved deliberately: route URLs (with redirects), service contracts, `ops-live-*` layer ids, test selectors, and the global CSS layer — all new composition is inline against tokens, with no global rewrite.

---

## 12. Unresolved questions — sponsor answer required

**Review & Approval** (the workspace is designed; these change decision semantics, not layout)
1. Single-step decision, or does a second level exist?
2. Which repo role decides today (`reviewer`?), and to which canonical role does it map?
3. Does returning a report reset the operational state or hold it at submitted?
4. Does a return re-open the inspection for the same inspector, or create a new visit?
5. Are penalties generated on approval, or by a separate enforcement action?
6. May reviewers edit findings, or only decide?
7. What does publication trigger — enforcement, factory notification, Factory 360 history?

**Analytics**
8. Is Analytics distinct from the strategic dashboard, and how?
9. Is there an existing report catalogue it must reproduce?
10. Who owns a metric definition when it appears in both places?

**Roles**
11. Confirm `reviewer`, `ops`, `leadership` → canonical mapping.
12. Confirm that removing navigation filtering passes security review.

**Planning**
13. Is Follow-up visit a real contract, or HTML-only? (Retained, flagged UNVERIFIED — no repo route.)

---

## 13. Unverified values on screen (D10)

Values shown are **design preview data**, not governed values. Nothing here may be treated as a legal, risk, SLA, fine or permission value.

Dashboard: coverage 85%, compliance 92%, approval 98%, 420 fire-safety violations, 18 critical factories, 1,250 pending annual, 168 Q2 enforcement actions, lens percentages, inspector capacity.
Operations: inspector positions, ETAs, alert counts, all 13 regional compliance rates.
Factory 360: risk 81, compliance 85%, weight contributions (40/20/15/15/10), penalty amounts, employee/product/machine counts, document names.
Planning: AI scores, confidence, bucket counts, window dates.
Execution: ETAs, tracking timestamps, package item counts.
Review: numerator/denominator pairs and the rates computed from them.
Analytics: every KPI, funnel figure, regional rate, bottleneck count and ageing figure.
Library/Queue: authority counts, version numbers, request references, affected-factory counts.
Enforcement: fine amounts, action form names.
Administration: metric-strip figures, sync times, rule contents.

---

## 14. Security note

`apps/web/.env.local` and `.env` contain a plaintext `MAPBOX_PASSWORD` alongside the public token. **Rotate it and move it out of the committed env files.** The public `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is fine in the browser; the password is not.

---

## 15. Acceptance checklist

- [ ] Every navigation item is visible for all three roles and reaches a real screen
- [ ] Inspection renders as a chevron group; Administration pinned and collapsed by default
- [ ] Planning retains Single, Bulk and Immediate as distinct flows with distinct contracts
- [ ] Planning and Execution remain separate workspaces
- [ ] Operations Center and Execution maps use Mapbox with the repo style, zoom clamps and layer ids
- [ ] Factory 360 retains portfolio / workspace / AI three-part hierarchy
- [ ] Review & Approval decides inspection reports; Approval Queue decides configuration requests; they never share a component
- [ ] Review panels are per record and lifecycle-derived; an approved report reads "final" everywhere, a returned one reads "Not published" everywhere
- [ ] Compliance hierarchy intact; approved content read-only; changes route through configuration requests
- [ ] Approval Queue package decision disabled until every object is decided, enforced in the database
- [ ] Analytics bottleneck rows navigate and never transition a workflow
- [ ] AI surfaces default to Not configured and never execute a workflow action
- [ ] Access refused on entry, never by hiding navigation; refusal names the enforcing contract
- [ ] No fourth role introduced
- [ ] Repo tokens only; no `ax-` classes; no authored hex; tints via `color-mix()`
- [ ] EN/AR with full RTL mirroring via logical properties; contract IDs untranslated
- [ ] No horizontal scrolling at any breakpoint; no field unreachable at any width
- [ ] All 14 states reachable and correct per screen; a failed query never renders as zero
- [ ] No invented legal, risk, SLA, fine, penalty or permission value

---

## 16. Claude Code implementation prompt

Paste the block below with the repo open.

````text
You are implementing an information-architecture reconstruction in the SAQEEL
Inspection platform (Next.js app router, repo: Vikram-Indla/Inspection).

AUTHORITATIVE DESIGN: `Saqeel Revamp.dc.html` — a single self-contained Design
Component rendering the complete target IA for all 15 destinations, with a live
role switcher, a 14-state switcher, an EN/AR toggle, a theme toggle and an
"Annotated view" toggle that prints, per screen: route, source HTML section,
repository source, components reused, new components required, data/service
dependencies, role visibility, responsive behaviour, state matrix and
implementation impact. Open it and read the annotation for a screen BEFORE
implementing that screen. Companion documents: `HANDOFF.md`, `github.md`.

NON-NEGOTIABLE RULES
1. Do NOT invent legal, risk, SLA, fine, penalty or permission values. Every
   such value comes from a repository contract or stays a labelled placeholder.
2. Do NOT merge Planning and Execution. Planning creates and publishes visit
   intent; Execution prepares, tracks and performs the visit.
3. Do NOT confuse Review & Approval (submitted inspection report decisions,
   /reviews) with Approval Queue (compliance configuration request decisions,
   /compliance/approvals). Separate concepts, separate routes, no shared
   component.
4. Do NOT introduce a fourth role. Exactly three: Planner, Inspector,
   Administrator.
5. Do NOT hide navigation for authorisation. Every authenticated user sees
   every destination including all six Administration items. Access is refused
   on route entry and on action invocation, with an unauthorised state that
   names the enforcing contract.
6. Do NOT create a parallel design system. Use apps/web/src/app/tokens.css and
   the repo component classes. No new hex; derive tints with color-mix(). Do
   NOT reintroduce the Astryx `ax-` prefix and do NOT add new `--sq-*`.
7. Do NOT rewrite global CSS. New page composition only.
8. Preserve service contracts, ops-live-* layer ids and existing test
   selectors. Rebound routes get redirects, never deletions.

WORK ORDER

Phase 1 — shell and access (highest blast radius, do first)
  a. lib/shell-navigation.ts: stop filtering destinations. buildShellNavigation()
     returns the full catalogue for every role. Remove the navigation-level
     effects of isFieldOnlyPersona() and isAdminOnlyPersona(); keep the persona
     predicates for guard logic.
  b. Introduce the canonical role mapping (HANDOFF.md §5). `reviewer`, `ops`
     and `leadership` are UNRESOLVED — do not guess; stub behind a feature flag
     and raise them.
  c. Route guards refuse on entry and render the unauthorised state, naming the
     enforcing contract (route guard + row-level security) — never a generic
     "access denied".
  d. Nav structure exactly as HANDOFF.md §3. Inspection is a collapsible
     chevron group; Administration is pinned at the foot, collapsed by default.
     Badges from real queue counts.
  e. Rail 248px / 68px. When collapsed, hide the brand-row collapse control and
     show a dedicated Expand row in the pinned footer. Child rows are
     calc(100% - 24px) because .nav-item carries margin-inline: 8px.

Phase 2 — terminology and routes
  Rename to Compliance Library, Approval Queue, Enforcement Library in EN and
  AR; update the terminology regression test (approved change, D2). Rebind
  /execution, /compliance, /compliance/approvals, /enforcement-library with
  redirects from the old paths. Keep /field as the iPad channel.

Phase 3 — destinations, in this order
  Dashboard → Operations Center → Factory 360 → Planning → Execution →
  Review & Approval → Compliance Library → Approval Queue →
  Enforcement Library → Analytics → Administration ×6.
  Notable contracts:
  - Dashboard metric cards carry question, value, definition/calculation,
    worked example, interpretation and a drill action. Not decorative tiles.
  - Factory 360 keeps the three-column portfolio / workspace / AI hierarchy.
  - Planning keeps Single, Bulk and Immediate as three distinct flows against
    cd-020, cd-021 and cd-023. Follow-up visit is UNVERIFIED — flag it.
  - Execution: dragging a visit onto a calendar day opens the configuration
    drawer with the planning window enforced. Never a silent reschedule.
  - Review & Approval: derive every panel from the selected record AND its
    lifecycle. An approved report reads "final" in the queue and the workspace;
    a returned or rejected report publishes no result and shows no penalty
    outcome. Compute rates from the record's own numerator/denominator.
  - Approval Queue: package decision disabled until every object is decided.
    Enforce in the database, not only in the UI.
  - Compliance Library: approved content read-only; create and modify open a
    configuration request.
  - Analytics: revision AN-R2. Bottleneck rows navigate only. AI surfaces
    default to Not configured. One drill-through drawer serves every metric.
    Raise the /analytics vs Dashboard analytics-view route conflict; do not
    solve it by creating a second destination.

Phase 4 — Mapbox
  Reuse the renderer contract from
  apps/web/src/app/(app)/operations/live/LiveMapInner.tsx: style
  mapbox://styles/mapbox/standard, centre [45.0, 23.9], zoom 6 clamped 5–11,
  lightPreset day/night, layer ids ops-live-regions / -factories / -inspectors
  / -region-labels, colours from lib/map-palette.ts, polygons from
  public/geo/sau-regions.geo.json, 12-second failure timeout falling back to
  the list equivalent. Markers stay projected and read-only (WA-DES-034-C3).

Phase 5 — states, responsive, bilingual
  All 14 states per screen (HANDOFF.md §8); a failed query is never rendered as
  a truthful zero. Breakpoints per §7.1 — no horizontal scrolling at any width;
  below 1280 secondary table columns move into the record list. Override the
  global `.table th { white-space: nowrap }` per table, not globally. Arabic
  via i18n resources (the artefact's dictionary is a ready-made AR bundle), RTL
  via logical properties only. Contract IDs are never translated.

BLOCKED ON SPONSOR ANSWERS (HANDOFF.md §12)
  Review decision semantics (Q1–Q7) and the Analytics/Dashboard metric
  ownership question (Q8–Q10). Build the layouts; leave the semantics behind a
  flag rather than inventing a legal approval workflow.

DEFINITION OF DONE
  Work through the acceptance checklist in HANDOFF.md §15. Every box must pass.
  Report any conflict between this prompt and the repository rather than
  silently resolving it.
````

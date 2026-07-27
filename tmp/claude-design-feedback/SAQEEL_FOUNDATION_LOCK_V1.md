# SAQEEL_FOUNDATION_LOCK_V1
Programme: Saqeel MVP1 UI/UX revamp · 43 screens (CD-001…CD-043)
Source commit: `144aea902d5ea778fecc432e54e99634ea96e057` (main) · worktree treated as DIRTY · design phase READ-ONLY against `apps/web`
Authority: GATE_STATUS.md + DEC-011 override all older documents. Constitution: `prompts/00_MASTER_DESIGN_CONSTITUTION.md`.
Discovery input: accepted REPOSITORY_DISCOVERY_REPORT.md (this project). Prompt-01 verification deltas only — no rediscovery performed.
Status at end of document: **READY_FOR_FOUNDATION_REVIEW** (not self-approved).

---

## Prompt-01 verification deltas (missing checks only)

- Login stack read in full (`page.tsx`, `LoginClient`, `login.css`, `StoryPanel`, `StoryMapInner`, `SaqeelHero`, `SaqeelMark`, `DemoAccess`): v4 "inspection story" is token-pure, RTL-safe (logical props, LTR-forced email field), reduced-motion aware. **Preserve; refinement only.**
- `icons.tsx` read: 16 stroke icons, currentColor-only, public surfaces. This is the seed of the unified icon system (§F).
- `GeoMap.tsx` read: tone→token mapping, divIcon markers (no bare colors), geodesic fence editing. **Preserve.**
- `NotificationBell.tsx` read: RLS-scoped polling, read receipts, per-channel "provider pending". **Preserve behavior.**
- `offline.ts` read: IndexedDB drafts + idempotent outbox, explicit conflict records, sha256 evidence hashing. **Preserve; never redesign semantics.**
- Runtime build audit (fresh `next build` on 144aea9): **cannot be executed from this design environment** — recorded as P1-scoped-out condition; any screenshot-based visual audit in CD-001+ requires the operator to supply a fresh production build first (UX-BS-002). This does not block foundation design (foundation is code-derived, not screenshot-derived).

---

## A. PRODUCT EXPERIENCE PRINCIPLES (govern every screen)

1. **Inspection-domain credibility** — screens read like regulatory operations tooling: dense but calm, IDs and timestamps in mono, precise state verbs (never "Done!", never marketing tone).
2. **Government-grade trust** — no dark patterns, no unexplained state changes; every destructive or publishing action states its consequence and audit event before confirmation.
3. **Configuration and audit truth** — published vs draft is always visible at panel level; every governed record shows its version chip and effective date.
4. **Evidence traceability** — every evidence item carries capture time, hash state, sync state, and annotation state; chain-of-custody is a visible property, not metadata.
5. **Field usability** — the iPad is a field instrument: one primary action per moment, ≥48px targets, ≥16px input text (17px field scale), interruption-safe, glove/sunlight tolerant (light theme first-class).
6. **Offline transparency** — locally saved work is never presented as synced; sync state is persistent, textual + symbolic, and actionable (retry/resolve).
7. **Regulatory immutability** — submitted versions render read-only with an immutable banner; returned scope unlocks only named sections; comparison shows what changed, never edits history.
8. **Controlled visual differentiation** — one language, four accents of context: Admin (governed/control-plane framing), Web ops (workflow density), Field (touch-first calm), Virtual (session/verification focus). Differentiation via density, layout and iconography — never via different palettes or type.
9. **Accessibility & bilingual parity** — Arabic is a peer, not a translation afterthought: mirrored layouts via logical properties, Arabic type metrics respected, AA contrast in both themes, keyboard + screen-reader complete, reduced-motion honored globally.
10. **Truthful integrations** — projected ≠ live, pending ≠ connected, queued ≠ synced, sample ≠ operational (§H is binding).

## B. VISUAL FOUNDATION (confirm/refine — no rebrand)

All values already resolve through `apps/web/src/app/tokens.css`. **Confirmed as-is:** both palettes (dark default, light peer), resolution order (data-theme → OS → dark), derived color-mix tint system, type scale (display 34 → title 26 → heading 20 → subheading 17 → body 16 → field 17 → caption 14 → micro 12 mono), tabular numerals for all operational figures, 4px spacing rhythm (050–600), radii 8/12/16/full, elevation (black-based shadows), border system (border / border-strong), focus ring (2px canvas + 4px primary), motion (120/200ms, decisive easing), grids (1440 max, 248 nav, 360 context panel), z-ladder.

**Proposed semantic ADDITIONS to tokens.css (names only — values derive from existing bases; UPDATE disposition, human-approved before code):**
- `--legacy-color-selection` = primary-tint (unify row/card selection).
- `--legacy-shadow-focus-within` for composite controls (rule builder, OTP cells).
- `--legacy-shell-nav-width-collapsed: 64px` (web shell collapse, §C).
- `--legacy-size-touch-min: 48px` alias of control-height-prominent for auditability.
- Status glyph set is defined in §F (not a token).

**Non-color status law:** every status pairing = tint background + strong text + icon glyph + text label. Confirmed pattern already exists in `legacy-lozenge`/`legacy-sync`; extended to all new states in §H.

**Motion & reduced motion:** decorative animation limited to sync spinner, skeleton shimmer, map halo; all disabled/slowed under `prefers-reduced-motion` (global rule in retired-predecessor.css — confirmed). No parallax, no entrance choreography.

**Map styling:** theme-aware CARTO basemap; vector overlays from base tokens only (StoryMapInner precedent); one brand hue for sites, opacity for intensity; geofences as dashed primary rings; official pin = text-color dot, observed = info dot (existing `legacy-pin` grammar). §G extends.

**Industrial photography direction (public/login storytelling only):** documentary, wide, human-scale industrial interiors across the KSA inspection spectrum — chemical/process, heavy manufacturing, pharma/clean rooms, food & packaging, fabrication. Cool-neutral grade compatible with the indigo canvas; no logos, no identifiable operational data, no stock-clip glamour. **Provenance rule:** every asset registered with source, license, and usage scope in `VISUAL_EVIDENCE_REGISTER.csv`; ministry-supplied photography preferred; no unlicensed imagery. Authenticated screens use data visualizations and maps, not photography.

## C. WEB SHELL (admins, planners, reviewers, operations)

Evidence: specimens 1a (dark), 1b (light), 1c (Arabic RTL) in `Foundation Evidence.dc.html`.

- **Navigation**: current 248px rail, plus a **collapsible 64px icon rail** (new, `--legacy-shell-nav-width-collapsed`); collapse state persisted like theme. Tooltips + accessible labels when collapsed.
- **Role-aware visibility (PROPOSAL — separate approval decision, no routing change):** nav renders only sections the session's roles can enter (from existing `user_roles`); `/launch` behavior untouched. Until approved, shell keeps the flat 9-item list.
- **Active route**: `aria-current="page"`, primary-tint fill + primary start-edge bar (logical, mirrors in RTL).
- **Page header**: one grammar everywhere — breadcrumb row (mono micro), title + context chips (version/status/freshness), command bar (search, filters, primary action at inline-end), NotificationBell.
- **Search**: page-scoped search in the command bar (existing `legacy-search`); no global omnibox invented in MVP1.
- **Notifications / theme / language / account**: preserved behaviors (NotificationBell polling + provider-pending truth; ThemeToggle; `/locale` switch shows the other language; `/signout`). Account block gains persona label + role chips (read from session — display only).
- **System states**: loading = pagehead + skeleton region (existing `legacy-skeleton`); unauthorized = `legacy-permission` full-page state with role explanation and audit note; no-workspace = state page from `/launch` fallback semantics with "contact administrator" guidance; partial-service = per-widget `legacy-widget` fallback + stale `legacy-freshness` chip, never whole-page failure.
- **Responsive**: ≥1200 full rail; 960–1200 collapsed rail; <960 (web only) overlay drawer nav. The web shell is never served as the iPad experience.

## D. IPAD FIELD SHELL (separate shell — preserved concept)

Evidence: specimens 1d (portrait 834pt) and 1e (landscape 1194pt).

- **FieldTabs preserved**: fixed bottom bar — Today, Visits, Virtual, Sync — with the raised center FAB = next-action affordance (jumps to next actionable visit startup). Sync becomes a first-class tab surfacing the outbox (counts, retry, conflicts) — UI over existing `offline.ts` states only.
- **Persistent status strip** above the tab bar when non-nominal: offline (neutral-weak, ⛔ + text), queued count, syncing, conflict (critical-tint, links to Sync). Storage/readiness warning appears in startup checklist and as a strip when below threshold.
- **Returned work**: dedicated "Returned" lane on Today with critical-tint lozenge and locked/unlocked section summary.
- **Portrait**: single column, cards full-width, section navigator as horizontal chip rail. **Landscape**: two panes (navigator/list start-side 320px + workspace), tab bar unchanged.
- **Keyboard-safe**: forms scroll within pane; submit bars never hidden behind the keyboard (sticky above keyboard inset); signature and annotation open full-screen modally.
- **Hard minima**: 48px+ touch targets (`--legacy-control-height-field: 52px` controls), 17px input text (`--legacy-text-field`), no hover-dependent affordances, no desktop density tables — field lists are cards (`legacy-visitcard`).

## E. SHARED COMPONENT GRAMMAR

Full inventory + states in specimen 1l (contact sheet); disposition per component in §J register. Grammar rules:

- Existing `legacy-*` families are the base; nothing is rebuilt, variants are completed. Required state set for every interactive component: default / hover / focus-visible / active / selected / disabled / loading / skeleton / empty / validation-error / permission-denied / read-only / stale / degraded / offline / queued / syncing / conflicted / failed / recovered (where applicable).
- **Buttons**: 5 existing variants confirmed; add explicit loading (spinner + label persists) and destructive-confirm pattern (two-step, consequence text).
- **Inputs/password/search**: existing `legacy-field` grammar + error text made visible via `aria-invalid` hook (today `legacy-field__error` is display:none — completion, not redesign); password toggle from login pattern promoted to shared control.
- **Filters/saved views/bulk bar**: `legacy-filterchip` + command bar; bulk bar (`legacy-bulkbar`) always states count + scope; destructive bulk actions require typed/checked confirmation.
- **Tabs/segmented**: confirmed; segmented for view modes, tabs for content sections — never mixed.
- **Status badges/lozenges/version chips**: lozenge = state; badge = count/alert; `legacy-version` chip = immutable version identity (mono). Every lozenge gains a glyph (§F).
- **Banners/toasts/modals/drawers**: confirmed; `legacy-banner--immutable` is the only banner allowed on submitted content; toasts never carry state-of-record (they echo, the page states).
- **Tables**: confirmed grammar + sticky header, row selection = selection token, failed-row treatment, per-column `legacy-td-num`; empty/loading/error triplet mandatory.
- **Timelines/steppers/audit entries**: timeline = history (audit), stepper = forward process; audit entry = actor + action verb + object + mono timestamp + event id.
- **Validation summaries**: `legacy-validation` block at submit point listing every blocker as a link to its field/section; clear-state variant on pass.
- **Immutable records / conflict / compare**: `legacy-banner--immutable` + read-only field rendering (no disabled-input styling — text presentation); `legacy-conflict` two-side grid preserved as THE conflict pattern; compare mode uses `legacy-diff-ins/del` + changed-section navigator.
- **Maps/geofence/route**: §G. **Visit cards/evidence cards/sync**: existing `legacy-visitcard`, `legacy-evidence`, `legacy-sync` confirmed; evidence card face must always show lifecycle chip (§H) + hash presence.
- **Workflow nodes/rule builders/approval-publish**: `legacy-flow` and `legacy-rule` confirmed; publish controls always render draft→published consequence line + version bump + audit event name.

## F. ICON SYSTEM

**Direction:** one stroke-icon vocabulary — 24×24 grid, 1.8px stroke, round caps/joins, `currentColor`, single-path-preferred — exactly the style already established by `icons.tsx` and FieldTabs glyphs. No emoji, no filled consumer glyphs, no third-party brand set. Delivered as a shared `Icon` component with named glyphs + mandatory `aria-hidden`/label rules.

- **Retain** (already conforming): all 16 `icons.tsx` glyphs; 4 FieldTabs glyphs; GeoMap divIcon dot.
- **Replace without behavior change** (CSS `content:` unicode → real SVG spans): `legacy-sync` glyphs (✓ ⛔ ⏳ ⟳ ⚠ ✕), breadcrumb `›`, stepper `→`, table sort `↑ ↓`, signout `↩`, state glyph emoji in `legacy-state`. Rationale: screen-reader safety (content glyphs are announced or skipped unpredictably), RTL safety (directional arrows must mirror: chevron/arrow glyphs flip via logical rendering, not character choice), consistent weight.
- **New glyphs needed** (drawn in the same grammar): sync-cloud set (queued/syncing/synced/failed/conflict/offline), lock/unlock-section, version, compare, geofence, route, projected (dashed-route motif), evidence-hash, OTP/shield-key, workflow-node, publish, returned.
- **Status meaning is preserved**: each §H state keeps a fixed glyph + label pairing; glyph never changes meaning across channels.
- RTL rule: directional icons (back, next, signout, breadcrumbs) mirror; universal symbols (check, warning, lock, camera) do not.

## G. MAP & INDUSTRIAL VISUAL LANGUAGE

Evidence: specimen 1h.

- **One map grammar, five contexts**: public illustrative KSA map (login — SAMPLE-labelled, no live data), planning maps (candidate factories + zones), geofence maps (official pin + dashed ring + radius mono label), factory maps (dossier location), operations maps (coverage + movement).
- **Overlays**: sites = single brand hue dots (band shape-coded per GeoMap tone→token map); geofence = dashed primary ring + 7% fill; routes = primary stroke; **projected routes = dashed stroke + persistent `PROJECTED ROUTE` mono chip pinned to the map frame** (never dismissible, both themes, both languages).
- **Chrome**: frame = `legacy-map` (12px radius, border); controls at inline-start/top; attribution + provider at inline-end/bottom (`legacy-map__provider`), always visible, includes tile provider name.
- **Freshness**: `legacy-freshness` chip on every data-bearing map ("Updated 14:32 · polling").
- **Tile-unavailable / offline fallback**: framed fallback in-place — SaqeelHero-style static vector (login) or neutral grid + "Map tiles unavailable — showing cached positions" state block (authenticated); list view always remains usable (map is never the only access path).
- **Centroid disclosure**: aggregated zones labelled "Zone centroids — not boundaries" (mono micro chip); choropleth reserved until an approved boundary provider exists (UX-BS-007).
- **Industrial imagery**: per §B — public storytelling only, five-sector diversity, provenance + license recorded; no real operational data on public screens.

## H. TRUTHFUL STATE LANGUAGE (binding presentation contract)

Fixed triplet per state — label (EN/AR authored, AR pending linguistic approval) + glyph + tint. Never color-only. Never renamed per screen.

| State | Label | Presentation |
|---|---|---|
| Draft | "Draft" | neutral lozenge, pencil glyph; editable framing |
| Validating | "Validating…" | info lozenge, spinner; blocks submit only |
| Submitted | "Submitted vN" | info lozenge + version chip; read-only + immutable banner |
| Approved | "Approved" | success lozenge, check |
| Published | "Published · effective {date}" | success lozenge + version chip; locked framing |
| Superseded | "Superseded by vN+1" | neutral lozenge, layers glyph; link forward |
| Immutable | banner: "Submitted version — locked. Corrections happen on returned sections only." | `legacy-banner--immutable` |
| Locally saved | "Saved on this device" | neutral, device glyph — explicitly not synced |
| Queued | "Queued (n) — will sync" | warning-tint `legacy-sync--pending` |
| Syncing | "Syncing…" | primary `legacy-sync--syncing` |
| Synced | "Synced {time}" | success `legacy-sync--synced` |
| Failed | "Sync failed — retry" | critical `legacy-sync--failed`, retry action |
| Conflicted | "Conflict — review required" | critical-tint `legacy-sync--conflict` → `legacy-conflict` resolver |
| Returned | "Returned — {n} sections editable" | critical lozenge + per-section lock/unlock chips |
| Projected route | "PROJECTED ROUTE — not live GPS" | pinned mono map chip, dashed route |
| Provider pending | "Video provider pending" / "{channel} provider pending" | dashed-border neutral chip |
| Stale data | "Updated {time} — may be stale" | warning freshness chip |
| Partial service | "{Widget} unavailable — other data current" | per-widget fallback + retry |
| Unauthorized | "You don't have access to {area}" | `legacy-permission` state + role note |
| No workspace | "No workspace assigned" | state page + administrator guidance |

## I. ACCESSIBILITY & INTERNATIONALIZATION

Evidence: specimens 1c (RTL shell), 1g (form recovery), 1k (states).

- **RTL**: logical properties only (already law); mirrored nav, breadcrumbs, steppers, table alignment, map chrome; LTR-forced islands for emails, URLs, coordinates, IDs (login email precedent generalized).
- **Long Arabic labels**: min-width chips with wrapping, two-line nav items allowed at collapsed widths; no truncation of state labels ever.
- **Keyboard**: complete tab order per pane; focus ring token everywhere; bulk bar, modals, drawers focus-trapped; skip-to-content in shell.
- **Screen readers**: status = text (glyphs aria-hidden with adjacent labels); live regions for sync-state changes and toast echoes; tables with proper th/scope; icon-only buttons always labelled.
- **Reduced motion**: global rule preserved; spinners slow, shimmer/halo stop.
- **Contrast**: AA verified against both palettes (light theme's darkened RAG hues exist for this reason — confirmed).
- **Touch**: 48px minimum everywhere on field surfaces; 44px desktop controls confirmed.
- **Error summaries & form recovery**: validation summary linking to fields; drafts persist (field surfaces via offline engine; web via existing draft semantics); "resume draft" entry points preserved (SCR-WEB-100).
- **Map alternatives**: every map has a list/table equivalent; geofence data readable as text (center, radius, distance).

## J. CODE DISPOSITION REGISTER

REMOVE requires explicit human approval. All rows: **theme impact = both themes; RTL impact = mirrored via logical properties; rollback = revert the single file/commit on the controlled implementation branch (design phase writes nothing).**

| # | File (repo-relative) | Current responsibility | Disposition | Post-redesign responsibility | Exact target | Protected behaviors | Design mapping | Tests |
|---|---|---|---|---|---|---|---|---|
| 1 | apps/web/src/app/tokens.css | Single raw-value source | **UPDATE (additive)** | Same + §B semantic additions | `--legacy-color-selection`, `--legacy-shadow-focus-within`, `--legacy-shell-nav-width-collapsed`, `--legacy-size-touch-min` | No base color changes; MVP1-FND-010 | §B | visual regression both themes |
| 2 | apps/web/src/app/retired-predecessor.css | legacy-* component layer | **UPDATE** | Same + completed variants; glyph `content:` rules removed in favor of Icon component | `.legacy-sync--*::before`, `.legacy-state__glyph`, `.legacy-breadcrumb ::after`, `.legacy-stepper ::after`, `.legacy-table th[aria-sort]::after`, `.legacy-field__error`, `.legacy-nav-item`, new `.legacy-shell--collapsed` | All existing selectors keep names; no removals | §E, §F | Playwright persona tours; axe pass |
| 3 | apps/web/src/components/Shell.tsx | Web shell + nav + pagehead | **UPDATE** | Same + collapse, role-aware nav (behind separate approval), account block | `Shell` default export; nav array; `legacy-shell__nav` | Nav hrefs, bell strings, locale/theme/signout links, server-component purity | §C | shell E2E per persona, RTL screenshot |
| 4 | apps/web/src/components/FieldTabs.tsx | iPad bottom bar + FAB | **UPDATE** | Same + Sync tab + status strip slot | `FieldTabs` export, `GLYPHS`, labels type | FAB next-action semantics; 64px bar; tokens-only | §D | field persona tour, portrait/landscape |
| 5 | apps/web/src/components/NotificationBell.tsx | RLS-scoped notifications | **PRESERVE** (visual polish only) | Same | `NotificationBell` | Polling, read receipts, provider-pending truth | §C | existing |
| 6 | apps/web/src/components/GeoMap.tsx | Reusable geofence map | **PRESERVE** | Same + shared map-chrome wrapper | `GeoMap` default export | Tone→token map, divIcon, fence editing | §G | geofence E2E |
| 7 | apps/web/src/app/login/page.tsx | Sign-in server half | **PRESERVE** | Same | `Login` | force-dynamic, strings via t() | CD-001 | negative-auth suite |
| 8 | apps/web/src/app/login/LoginClient.tsx | Sign-in client half | **PRESERVE** (hi-fi refinement allowed) | Same | `LoginClient` | Supabase auth, ERR-AUTH-001, anti-enumeration, FND-003 audit, no persona selector | CD-001 | negative-auth suite |
| 9 | apps/web/src/app/login/login.css | Login/reset styles | **UPDATE (refinement)** | Same, tokens-only | `.lg-*` | Shared-with-/reset class contract | CD-001/CD-002 | visual both themes |
| 10 | apps/web/src/app/login/StoryPanel.tsx | Story panel + fallback swap | **PRESERVE** | Same | `StoryPanel` | SAMPLE labelling, SaqeelHero fallback | CD-001 | existing |
| 11 | apps/web/src/app/login/StoryMapInner.tsx | Login story map | **PRESERVE** | Same | `StoryMapInner` | Bundled boundary, onFail swap, tokens-only vectors | CD-001/§G | existing |
| 12 | apps/web/src/app/login/SaqeelHero.tsx | Static KSA illustration | **PRESERVE** | Same (shared offline-map fallback candidate) | `SaqeelHero` | No live data | §G | — |
| 13 | apps/web/src/app/login/SaqeelMark.tsx | Logomark | **PRESERVE** | Same, promoted to shared brand asset | `SaqeelMark` | currentColor | §B | — |
| 14 | apps/web/src/app/login/DemoAccess.tsx | Demo credential helper | **UPDATE** | Env-gated demo variant; production build renders nothing | `DemoAccess` + render condition in LoginClient | Never render real credentials | UX-BS-009 | prod-build assertion |
| 15 | apps/web/src/app/launch/page.tsx | Role→home routing | **PRESERVE** | Same (+ no-workspace state page referenced, not changed) | `ROLE_HOME`, `Launch` | RBAC-001..014 order | §C states | persona tours |
| 16 | apps/web/src/app/layout.tsx | Root html/fonts/dir | **PRESERVE** | Same | `RootLayout`, font variables | lang/dir from locale; ThemeScript no-flash | §B | — |
| 17 | apps/web/src/lib/offline.ts | Outbox/conflict engine | **PRESERVE** | Same; UI consumes states only | `local`, `processOutbox`, `sha256b64`, `SyncState` | Idempotent replay, explicit conflicts, hashing | §D/§H | offline drill |
| 18 | apps/web/src/app/icons.tsx | Public stroke icons | **UPDATE (grow)** | Seed of shared Icon system | all `Icon*` exports | currentColor law | §F | — |
| 19 | src/components/Icon.tsx *(new)* | — | **CREATE** | Shared icon component (§F vocabulary) | new export `Icon` | aria rules baked in | §F | axe pass |
| 20 | apps/web/src/app/reviews/DecisionPanel.tsx | Duplicate of [id]/DecisionPanel | **REMOVE (pending human approval + divergence diff)** | Consolidated into one component | file | Decision semantics identical before removal | §E | review E2E |
| 21 | apps/web/src/components/ThemeToggle.tsx, ThemeScript.tsx | Theme switch/no-flash | **PRESERVE** | Same | exports | persisted preference | §B | — |
| 22 | apps/web/src/app/admin (SCR-ADM-080 surface) | Not implemented as distinct surface | **CREATE (design-only in this phase)** | Notification & SLA rules surface within /admin | new route segment (declared, not built) | No provider/SLA invention | CD-016 | — |

## PROTECTED BEHAVIOR REGISTER

Authentication (safe deny ERR-AUTH-001, anti-enumeration reset, FND-003 audit events, no persona selector) · middleware session guard · `/launch` role resolution order · RBAC/RLS contracts · server actions and Supabase data contracts · canonical workflow transitions and guards · append-only audit · maker-checker/publish semantics · offline outbox idempotent replay + explicit conflicts + evidence hashing · submitted-version immutability + returned-scope-only editing · OTP engine (server-side, no bypass) · provider-pending truth (video, notification channels) · projected-route truth on /operations/live · sample-only login map · locale cookie + dir switching · theme persistence + no-flash init · 478 source requirements / 493 ledger rows.

## FINDINGS

**P0 — none blocking foundation.**
**P1 (recorded, scoped-out with conditions):**
- P1-1: Fresh production-build visual audit not executable in this environment; CD screens requiring runtime screenshots need operator-supplied fresh build on 144aea9 (UX-BS-002).
- P1-2: `legacy-field__error` is `display:none` with no shown-state rule — validation errors may be invisible today; foundation defines the visible pattern; implementation fix goes through acceptance.
- P1-3: reviews/DecisionPanel duplication — divergence must be diffed before the REMOVE row is approved.

**P2 (recorded, continue):** unicode-in-CSS glyphs (screen-reader/RTL risk) — §F replacement plan; flat nav for all roles — §C proposal pending separate approval; bulk-bar secondary button relies on inherited inverse context; `legacy-tooltip` has no touch alternative (field surfaces must not rely on tooltips); login demo panel styling implies production permanence — §J row 14; icon sizes vary 16/18/20/22 without a scale rule — Icon component fixes at 16/20/24.

## RECOMMENDED APPROVAL DECISION

Approve SAQEEL_FOUNDATION_LOCK_V1 with:
1. §B token additions (additive only),
2. §C collapsible rail; **role-aware nav visibility as a separate decision (DEC candidate)**,
3. §D Sync tab + status strip,
4. §F icon unification (behavior-neutral),
5. §J register incl. row-20 REMOVE **held** until divergence diff,
6. §H state language as binding copy contract (AR pending linguistic approval).

## EXACT INPUTS REQUIRED FOR CD-001 (Unified sign-in — the inspection story)

1. This lock (approved) + `Foundation Evidence.dc.html` specimens 1a–1c, 1g, 1k, 1l.
2. Source files: login stack rows 7–14 of §J (all read; commit 144aea9).
3. Approval-pack CD-001 prompt row (sheet "Claude Prompts") + Scoring Rubric.
4. Decision needed from sponsor: demo-access gating variant to design (demo-gated vs production-removed — UX-BS-009).
5. Confirmation whether login photography (industrial image direction, §B/§G) is in scope for CD-001 or the map-story remains the only visual; if photography: supply licensed assets + provenance.
6. AR copy review status for login strings (may remain "pending linguistic approval" labels).

---

**STATUS: READY_FOR_FOUNDATION_REVIEW** — foundation is not self-approved; human signoff required on the six decision points above before CD-001 begins.

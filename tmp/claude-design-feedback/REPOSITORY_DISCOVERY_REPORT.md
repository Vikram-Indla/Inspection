# REPOSITORY_DISCOVERY_REPORT — Saqeel MVP1 UI/UX Revamp
Date: 2026-07-12 · Phase: read-only design discovery (no screen designs produced)

## 1. Repository, branch, commit

- Repository: `Vikram-Indla/Inspection` (mounted locally as `Inspection/`).
- Checked-out branch: `main` (`.git/HEAD → refs/heads/main`).
- HEAD commit: `144aea902d5ea778fecc432e54e99634ea96e057` — "fix: Region/City filters missing from Visit Management (M02-004 gap)".
- Note: G10 PASS is recorded against commit `8de82b4`; main has since advanced by 7 post-G10 fix commits (pg_cron expiry, execution-mode eligibility, planning Notes, Visit Management gaps, per-visit planning history, Region/City filters). **G10 evidence is therefore stale relative to HEAD** — a G10 rerun on 144aea9 is a follow-up already flagged in DEC-011.
- Other refs: local branch `fix/landing-f4`; remotes `origin/fix/*`, `origin/setup/*`; a **stash ref exists** (`.git/refs/stash`) plus `ORIG_HEAD` — consistent with UX-BS-016 (dirty/active worktree).
- `CURRENT_STATE.md` still names working branch `setup/g4-memory-continuity`; git log shows that branch was **renamed to `main`** — the doc line is stale wording, not a divergence.

## 2. Working-tree state

- Cannot execute `git status` from this environment (read-only file mount). Definitive dirty-state cannot be computed here.
- Evidence pointing to uncommitted work: UX-BS-016 ("current source has uncommitted sponsor-directed changes"), CURRENT_UI_BASELINE risk #1, existing stash ref, and untracked build/runtime artifacts (`tsconfig.tsbuildinfo`, `playwright-report/`, `test-results/`, `.env.local`).
- **Treat the worktree as dirty.** Design phase must remain read-only against `apps/web`; implementation later happens on a controlled branch (DSG-GIT-001).

## 3. Framework and structure

- Next.js **15** App Router + React **19**, TypeScript 5.7, single app `apps/web` (name `mim-inspection-web`).
- Data: live Supabase (`@supabase/ssr` + `supabase-js`), server components + server actions per route (`page.tsx` + `actions.ts` + client feature components).
- Maps: Leaflet + react-leaflet 5; KSA boundary bundled at `public/geo/sau.geo.json`; CARTO tiles (external dependency).
- PWA: `public/sw.js`, `manifest.json`, `PwaRegister`; offline outbox engine in `src/lib/offline.ts` (IndexedDB).
- E2E: Playwright suite (golden journey, offline drill, persona tours, negative auth) — the regression guard any design change must keep green.
- No Tailwind / no component library: hand-rolled design system in two files.

## 4. Design-system structure

- **`src/app/tokens.css`** — single source of raw values (`--ax-*`): Theme v2 dark (canvas #0A0A14, surface #14141F, primary violet #7C6CFF, success #2DE08E, warning #E8B84B, critical #F0625D, info #5AA7FA) + first-class light palette + `prefers-color-scheme` fallback; derived tints via `color-mix` only; semantic type scale (display 34 → body 16 → field 17 → micro 12 mono); 4px spacing rhythm; radii 8/12/16; control heights 44/48/52 (field ≥52); focus ring, motion, z-ladder, shell widths (nav 248px, panel 360px).
- **`src/app/astryx.css`** — the component layer (~590 lines, all `ax-*`, logical properties throughout): buttons (5 variants incl. `--field`), fields/inputs/search, choice/switch/segmented/tabs, lozenge/badge/version chip, menu/popover/banner (incl. `--immutable`)/toast/modal/drawer, skeleton/empty-state/freshness, shell + pagehead + breadcrumb, commandbar/filterchip, KPI row, table (+sort, +bulkbar), stepper, timeline, permission/validation/conflict (side-by-side diff), map chrome (pins, geofence, provider attribution), visit card, evidence grid + `ax-sync` (synced/offline/pending/syncing/conflict/failed — text+glyph, not color-only), rule builder, workflow flow-canvas, layout utilities.
- Fonts loaded via `next/font`: Space Grotesk (EN), IBM Plex Sans Arabic (AR), JetBrains Mono (data labels) — exposed as `--font-*` variables consumed by tokens.

## 5. Navigation and role model

- Auth: Supabase session middleware guards **every route** (redirect to `/login` when unauthenticated); `"/"` → `/login`; `/launch` resolves role → home: inspector→`/field`, reviewer→`/reviews`, planner→`/planning`, ops/leadership→`/operations`, admin family fallback→`/admin`. Role routing is server-side; persona selector removed (DEC-011 v4 login).
- 13 DB roles, RBAC + RLS live in Supabase; role model must not be altered by design work.
- Web shell nav (Shell.tsx): Overview, Planning, Visits, Reviews, Factory 360, Virtual, Field, Operations, Admin + theme toggle, language switch, sign out. Nav is **flat and identical for all roles** — no role-scoped trimming in the shell itself (an information-hierarchy refinement candidate, not a behavior change).

## 6. Themes, tokens, fonts, RTL

- Dark default / light first-class; resolution: explicit `[data-theme]` → OS preference → dark; `ThemeScript` gives no-flash init; `ThemeToggle` persists preference.
- RTL: `layout.tsx` sets `lang`/`dir` from locale cookie (`/locale?set=ar|en`); astryx.css uses logical properties exclusively, so RTL is structural, not patched; `:lang(ar)` switches font family.
- i18n: server `useT()` with key+fallback, 1516 keys EN/AR, trigger-versioned `ui_strings` in DB, `/admin/localization` Lokalise-style studio, coverage loop scripts. Arabic content is authored but **draft status pending human review**.

## 7. Web and iPad shells

- **Web shell** — `components/Shell.tsx`: 248px side nav (Arabic wordmark صقيل | صناعي), pagehead (title + context + NotificationBell), `ax-content` column capped at 1440px. Server component; used by all desktop surfaces.
- **iPad/field shell** — deliberately separate: `/field` routes do NOT use Shell. `components/FieldTabs.tsx` renders a fixed 64px bottom tab bar (dashboard / visits / virtual / sign-out) with a raised center FAB → next actionable visit startup (legacy Senaei DNA); inline stroke glyphs, tokens only, field-height touch targets. Also `components/field/`, field charts, and field-specific control metrics (`--ax-control-height-field: 52px`, `--ax-text-field: 17px`).
- The catalogue's `/ipad/*` routes are **route aliases** onto `/field/*` (reconciliation matrix) — logical screens live as modes inside consolidated routes.

## 8. Components to PRESERVE (behavior + identity)

- `tokens.css` palette/type/spacing law and the "raw values only in tokens" rule (MVP1-FND-010).
- Shell nav semantics, role routing (`/launch`), middleware auth, `/signout`, `/locale`.
- `offline.ts` outbox engine and `ax-sync` state language (queued/syncing/synced/failed/conflicted).
- `GeoMap.tsx` (reusable Leaflet geofence map), `sau.geo.json`, theme-aware CARTO tiles, `SaqeelHero` offline fallback.
- `Startup.tsx` geolocation/journey logic; `Workspace.tsx` autosave/section/blocker engine; `ImageAnnotator.tsx` compression+annotation; `SignaturePad`, `FactoryVerification`.
- `Room.tsx` OTP/state/audit orchestration (video adapter pending — keep truthful).
- Reviews immutable decision controls, `ax-banner--immutable`, `ax-conflict` resolution pattern, `ax-version` chips.
- Login v4 "inspection story" (accepted 2026-07-12, G10-verified 19/19) — do not redesign.
- FieldTabs bottom bar + FAB pattern; NotificationBell with per-channel "provider pending" truthfulness.

## 9. Components to REFINE (design-phase targets)

- **Shell/pagehead consistency**: page header, breadcrumbs, commandbar/filter placement, and action placement vary per route; no role-aware nav trimming.
- **Consolidated-route legibility** (UX-BS-005/012): explicit in-route modes for regulation detail (ADM-011), package designer (ADM-031), penalty mapping (ADM-041), workflow designer (ADM-051), plan configure/review (WEB-140/150), review compare (WEB-320), evidence/findings/submit/returned modes (IPAD-640–670), virtual appointment/verify/session (VIR-700–720).
- **State coverage**: empty/loading/unauthorized/partial-service/offline/stale/conflict/retry states exist unevenly (`ax-state`, `ax-widget__fallback`, `ax-freshness` are present but not systematically applied — UX-BS-013).
- **Truthfulness surfaces**: persistent "Projected route" labeling on `/operations/live` (UX-BS-003), centroid-circle disclosure on GIS zones (UX-BS-007), map tile unavailable/attribution states (UX-BS-006).
- **Evidence chain-of-custody** presentation (UX-BS-010); review density and returned-scope comprehension (UX-BS-012).
- **Accessibility/RTL audit breadth** (UX-BS-008) and light-theme contrast passes.
- Icons: mixed vocabulary — inline stroke SVGs (FieldTabs), `icons.tsx`, and unicode glyphs in CSS content (`✓ ⛔ ⏳ ⟳ ⚠ ✕`, `↩`, `›`, arrows). Candidate for a consolidated icon set (design decision, no behavior change).

## 10. Consolidation / replacement candidates

- Duplicate `DecisionPanel.tsx` at `reviews/` and `reviews/[id]/` — verify divergence, consolidate.
- Two map presentation systems: stylized SVG map chrome (`ax-map__scene` m-* classes) vs real Leaflet maps — unify the visual chrome contract.
- Glyph-in-CSS-content status indicators → proper icon elements (screen-reader + RTL safety).
- `SCR-ADM-080` Notifications/SLA rules: **requires_design_reconciliation** — catalogue route has no dedicated implementation (folded into `/admin`); design must define the surface without inventing a provider.
- `DemoAccess.tsx` on login (UX-BS-009): needs demo-gated vs production-removed variants.
- Field dashboard charts (`components/charts`) ported from legacy Senaei — style reconciliation with Theme v2.

## 11. Contract ↔ implementation conflicts

1. **G10 evidence vs HEAD**: G10 passed on `8de82b4`; HEAD is `144aea9` (+7 commits). Rerun required before design screenshots are used as baseline evidence (UX-BS-002 discipline).
2. **Stale authority files**: `DESIGN_AUTHORITY_STATUS.md` and `CURRENT_SLICE.yaml` contradict `GATE_STATUS.md`/DEC-011 — GATE_STATUS + DEC-011 are current (UX-BS-001).
3. **CURRENT_STATE branch line** ("setup/g4-memory-continuity") vs actual `main` after rename — doc drift only.
4. **SCR-ADM-080** catalogue route unimplemented as a distinct surface — the only `requires_design_reconciliation` row of 39.
5. **43-screen approval pack vs 38 governed screens**: pack adds 5 supplemental screens (AUTH-01/02/03, ADM-LOCALIZATION, ADM-AUDIT) — all exist in code (`/login`, `/reset`, launch/unauthorized, `/admin/localization`, `/admin/audit`); traceability must mark them Supplemental, not governed.
6. **Truth labels**: `/operations/live` = projected movement, not GPS; virtual room video provider pending; notification channels "provider pending" — designs must carry these labels verbatim.
7. **Uncommitted worktree** (UX-BS-016): design tooling must not write into `apps/web`.

## 12. Blockers to safe design-to-code traceability

- **B1 (process)**: dirty worktree + stash — implementation branch cannot be cut cleanly until the sponsor's uncommitted work is committed or stashed intentionally. Design phase unaffected (read-only).
- **B2 (evidence)**: G10 stale vs HEAD — any "current UI" screenshot baseline must record commit `144aea9` and a fresh production build (chunk-load error precedent, UX-BS-002).
- **B3 (authority)**: stale `DESIGN_AUTHORITY_STATUS.md`/`CURRENT_SLICE.yaml` — every design run needs the source-authority banner (GATE_STATUS + DEC-011 win).
- **B4 (scope)**: SCR-ADM-080 has no code anchor — its design must declare "new surface within /admin" explicitly in the reconciliation matrix.
- **B5 (content)**: Arabic strings are draft-pending-review — AR screens designed now may show copy that changes after human review.
- No blocker prevents starting CD-001…CD-043 design work itself; all 43 screens have code anchors or declared gaps.

## 13. Approval-pack alignment

Pack `Saqeel_43_Screen_Claude_Design_Approval_Pack.xlsx` read (8 sheets): 43-screen matrix (CD-001…CD-043; 38 governed + 5 supplemental), Claude Prompts, Reference Library, Blind Spots (mirrors UX-BS register), Submission Guide, Code Handoff Contract, Scoring Rubric. Sequence starts at AUTH (CD-001–003), then Admin (CD-004–019), Planning (CD-020–025), Visits (026–027), Review (028–030), Factory 360 (031), Operations (032), iPad (033–040), Virtual (041–043).

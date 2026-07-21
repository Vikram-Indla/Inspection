# CLAUDE CODE — SAQEEL INSPECTION IMPLEMENTATION PROMPT (v1.0, exhaustive)

Paste everything below this line into Claude Code, opened on `Vikram-Indla/Inspection`, branch `feat/saqeel-design-system`, with the design package unpacked at `design/saqeel/` (from SAQEEL-Inspection-Design-System-v1.0.zip) or synced via /design-sync.

---

You are executing a complete visual-system replacement on this repository: **Astryx → SAQEEL Inspection Design System v1.0**. This is a styling and component-layer migration, NOT a product redesign. Every visual decision has already been made and shipped to you in `design/saqeel/`. You implement; you do not invent. If any visual decision appears to be missing, STOP that thread, list it under "ESCALATE TO CLAUDE DESIGN" in your PR description, and continue with the next mapped item.

# 0. AUTHORITY AND PRECEDENCE

Order of authority when anything conflicts:
1. `design/saqeel/tokens/` — tokens.css (compiled), tokens.json + 12 concern-split JSONs. The only source of colour, type, spacing, radius, elevation, motion, density, z-index values.
2. `design/saqeel/component-source/<family>/<Name>.jsx + <Name>.d.ts + <Name>.prompt.md` — canonical component anatomy, prop contracts, variants and states. This is implementation REFERENCE, not drop-in production code: re-implement in this repo's stack (Next.js App Router + existing conventions) keeping names, props, variants, and states EXACTLY.
3. `design/saqeel/{foundations,patterns,ipad,components}/` — binding specifications (typography, colour, RTL, dark mode, responsive, accessibility, shell, data grid, forms, map, evidence, offline/sync, status semantics, iPad suite, state matrix, usage/misuse guides).
4. `design/saqeel/screens/html/*` — canonical acceptance references (open them in a browser next to your implementation); `screens/png/*` — pixel reference.
5. `design/saqeel/handoff/ASTRYX_MIGRATION_TEMPLATE.md` — the populated Astryx→SAQEEL migration map with owner-resolved decisions.

Owner-resolved decisions (already decided — do not re-litigate, do not "preserve" the old values):
- Brand is **SAQEEL (صقيل)**. Any "SAKIL" string is stale — use SAQEEL.
- The SAQEEL type scale (14px body desktop, 13px tables, 15px at field density) **supersedes** the former 16px/17px body-minimum sponsor decision.
- SAQEEL control metrics (28/32/40 comfortable, 24/28/36 compact, 40/44/52 field density) **supersede** the blanket 44–52px Astryx heights. Field/iPad surfaces get `data-density="field"`.
- The frozen input contract (Space Grotesk, 12px input radius) is **retired**: inputs are IBM Plex Sans at 3px radius.
- JetBrains Mono is **retired**: IBM Plex Mono, identifiers only.
- Dark-mode primary changes from steel-blue #78AEDA to emerald #2e9e77 — intentional, approved.
- Log each supersession in the product decision register (`state_transitions.csv` sibling docs / wherever ADRs live) as "superseded by SAQEEL DS v1.0, owner-approved 2026-07-20".
- **Zero trace of Astryx may survive** the final PR (see §9 gate).

# 1. FUNCTIONAL GUARDRAILS — MUST NOT CHANGE

You may not alter: business workflows; routes and URL params; data fields and their meanings; RBAC roles/permissions and RLS scoping; validation logic and triggers; the map ENGINE (rendering, zone-hover lift animation, geofence logic, clustering thresholds, live data subscriptions); search behaviour; filter query semantics; saved-view persistence; submission/draft/save behaviour incl. offline queue logic; API contracts; database structures; audit logic; notification events; the login Cinematic Atlas experience (approved standalone exception — its `--ax-color-atlas-*` / prism tokens and login.css stay untouched); print-report content.

You restyle the CHROME of these things; you never change what they do. When a component migration touches behaviour-adjacent code (e.g. `Shell.tsx` role-scoped nav builder, `buildShellNavigation`), refactor around the logic, never through it.

# 2. FIRST ACTION — INVENTORY (no code changes)

Before writing any code, produce `design/saqeel/handoff/ASTRYX_INVENTORY_REPORT.md`:
1. `grep -rn "var(--ax-" apps/ | …` — every `--ax-*` token consumer: file, line count per token.
2. `grep -rn "ax-" apps/web/src --include="*.tsx" --include="*.ts" --include="*.css"` — every `.ax-*` class usage by file.
3. Every import from `components/` that renders visual chrome (Shell, Toast, Skeleton, EmptyState, Accordion, Pagination, NotificationBell, ThemeToggle, charts, maps, AuthorityBar, DualStateRibbon, VersionCompare, CriteriaBuilder, WfDeck, FieldHome, Repeater, GatedRepeaterSection, ImageAnnotator, SignaturePad, Attachments, FindingTraceChain, PrintReport…).
4. Font loads: Space Grotesk, JetBrains Mono, IBM Plex Sans Arabic (currently applied to English too), Barlow (if any).
5. The four design-contract Playwright specs and every assertion they make against astryx.css/tokens.css.
6. Cross-check EVERY item against the mapping table in `ASTRYX_MIGRATION_TEMPLATE.md`. Output three lists: **mapped** (with target SAQEEL component), **out-of-scope** (login atlas, historical packs), **UNMAPPED** — anything unmapped goes in the report and to "ESCALATE TO CLAUDE DESIGN"; do not improvise a mapping.
Commit this report alone as the first commit.

# 3. IMPLEMENTATION SEQUENCE — one PR per step, in order

Never mix Astryx and SAQEEL styling within one view beyond a single release window. Each PR: implementation + tests + the verification checklist from §8 for the surfaces it touches.

## PR 1 — Tokens + fonts + contract specs (atomic; CI blocks if split)
a. Replace the contents of `apps/web/src/app/tokens.css` with the SAQEEL token sheet (`design/saqeel/tokens/tokens.css`). Preserve the existing mechanisms: `:root[data-theme="dark"]` selector shape used by ThemeScript, `:lang(ar)` / `[dir="rtl"]` hooks. Keep the atlas/login token block intact (append it, clearly fenced `/* login atlas — approved exception */`).
b. Add a compatibility shim ONLY if consumer count makes a single-PR rename impractical: `--ax-color-primary: var(--action-primary);` etc. per the token table in the migration map. If you shim, file the shim's removal as part of PR 12 and track every shimmed name.
c. Fonts: load IBM Plex Sans (400/500/600/700), IBM Plex Sans Arabic (400/500/600/700), IBM Plex Mono (400/500) — self-hosted with `font-display: swap` preferred, Google Fonts acceptable interim. Remove Space Grotesk and JetBrains Mono loads. English text must resolve to IBM Plex Sans (not Plex Arabic); Arabic (`:lang(ar)` / `[dir=rtl]`) resolves Arabic-first with raised leading per `foundations/TYPOGRAPHY_SPEC.md`.
d. Rewrite the four Playwright design-contract specs (`design-foundation-contract`, `platform-design-system-contract`, `ui-compliance-contract`, `inspector-shell-uplift`) to assert SAQEEL tokens: computed `--action-primary` = #115c44 light / #2e9e77 dark, body font-family starts "IBM Plex Sans", nav bg = graphite tokens, focus outline = 2px var(--focus-ring), radii ≤6px on controls, the 12 mandatory UI states still present. These specs are the new contract — keep them strict.
e. Acceptance: app boots in all four modes with no visual regression BEYOND colour/type/radius shifts; no console errors; specs green.

## PR 2 — Shared primitives
Implement in the repo's component directory, one module per component, prop-compatible with `component-source/`:
Button (primary/secondary/tertiary/ghost/danger × sm/md/lg × loading/disabled/iconOnly/block; one primary per view), ButtonGroup, SplitButton; Field + Input (incl. `mono` LTR-embedded), TextArea, Select, Checkbox (indeterminate), RadioGroup, Switch, SegmentedControl, FileUpload; StatusBadge (the 10 fixed roles — build the role union type from `tokens.status.json`, no 11th), Tag, ExceptionMark + RailCell, SeverityIndicator, panel/stack/row utilities, Skeleton, Progress, Avatar/UserChip.
Map every `.ax-btn*`, `.ax-field/.ax-input/.ax-select/.ax-textarea/.ax-search`, `.ax-choice/.ax-check/.ax-switch/.ax-segmented`, `.ax-lozenge/.ax-badge` consumer to these per the migration map. Delete the replaced `.ax-*` rules from astryx.css as consumers migrate (shrinking file = progress metric).

## PR 3 — Application shell
Sidebar (graphite, groups, counts, 60px collapse at ≤1024, tooltips when collapsed), TopBar (menu/search/EN-AR seg/theme/notifications/UserMenu), PageHeader, Breadcrumb, Tabs, Steps, Pagination, layout regions per `patterns/APPLICATION_SHELL.md`. PRESERVE: `buildShellNavigation` role logic, RLS scope controls (region/date — restyle into TopBar slots), skip-link, i18n strings, flash-free ThemeScript. Verify every role's nav tree renders, EN+AR.

## PR 4 — Feedback layer
Alert (critical/warning/info/success/**immutable**), Toast (+region), Modal, Drawer, Tooltip, Menu/popover, EmptyState (empty/no-results/error/permission-denied/offline via copy+icon), SyncIndicator (synced/pending/syncing/offline/conflict/failed), DiffView (version compare + conflict resolution with onKeep). Wire the product's 12 mandatory states to the mapping in `patterns/OFFLINE_AND_SYNC.md`. VersionCompare.tsx re-chromes onto DiffView; `.ax-sync/.ax-freshness/.ax-conflict/.ax-banner--immutable` consumers migrate here.

## PR 5 — Forms
Field system across all forms; validation summary Alert linking to fields (aria-describedby + role=alert preserved); ChecklistQuestion for inspection checklists; Accordion for repeatable/grouped sections; conditional-question rendering unchanged in logic, restyled; drafts/save-status header treatment ("✓ Saved HH:MM", Draft badge, unsaved-change Modal); Combobox/multi-select/StatusSelector/DateRangePicker replacing ad-hoc pickers. `Repeater`/`GatedRepeaterSection` keep their gating logic, get SAQEEL chrome. Reference: `screens/html/form.html`, `patterns/FORM_SYSTEM_SPECIFICATION.md`.

## PR 6 — Data grid
Implement DataGrid per `patterns/DATA_GRID_SPECIFICATION.md` and migrate the **inspection register first**, then visits, factories, reviews, admin/items. Port existing column definitions, sort/filter/pagination API calls and saved views UNCHANGED in behaviour. Add: sticky header, pinned ID column (mono id-code cells), multi-sort shift-click with aria-sort, FilterBar (chips dashed→set) + FilterRule advanced builder in a Drawer, ColumnManager, bulk bar, row expansion, ⋯ Menu inline actions, comfortable/compact densities, RailCell severity edge where rows carry severity, skeleton/empty/error states, footer totals. Virtualisation: window the rows you pass; do not re-architect data fetching. Acceptance: full CRUD + export on the register in four modes; `screens/html/register*.html` as reference.

## PR 7 — Map chrome
Re-skin ONLY the chrome per `patterns/MAP_SYSTEM_SPECIFICATION.md`: GeoWorkspace composition around the existing engine (GeoMap/OpsMap/LiveMapInner/VisitMap/FactorySpatialMap/GisStudio untouched internally), MapToolbar + MapZoom, MapPanel + MapLegend + MapLayerControl, selected-zone/inspection panels, marker re-skin (status-toned keyline circles; official vs observed = distinct marker KINDS/glyphs, never colour-only — they are provenance, not severity), clusters, `--map-zone-fill/stroke` for geofences. Dark mode = the engine's dark basemap style, never an overlay tint. Zone-hover lift animation preserved verbatim. Acceptance: operations/live with realtime data; visits/map; `screens/html/map-command*.html`.

## PR 8 — Inspection + signature components
InspectionCard (summary/assignment/queue), FindingCard (finding/violation/corrective, 3px severity edge — the only left accent besides RailCell), ComplianceScore, DueDate, EvidenceCard + EvidenceStack (list/detailed/grid/compact — surface provenance fields: device, time, coords, inspector, linked finding, verification; verify data availability, escalate gaps as DATA-GAP not design-gap), ReviewPanel (approve/reject-gated-on-reason/escalate, terminal state), AuditTrail/Timeline, StatusSpine (13 stages, 6 states, vertical/horizontal/compact — replaces `.ax-stepper` on lifecycle surfaces and DualStateRibbon becomes compact horizontal spine keeping BOTH official/observed values visible), CommandPalette (⌘K, wire to existing global search endpoints). ImageAnnotator/SignaturePad/Attachments keep logic, get SAQEEL chrome.

## PR 9 — Field/iPad surfaces
Apply `data-density="field"` on inspector surfaces (FieldHome, field/[visitId] flow); field taskbar with primary action + SyncIndicator + queued-count pill; offline Alert; card lists replacing wide tables portrait; bottom-drawer map context ≤1024 portrait; all per `design/saqeel/ipad/*`. Acceptance: complete field inspection flow at 1024×768 and 768×1024, offline→sync→conflict path, EN+AR.

## PR 10 — Representative pages
Bring dashboard, register, map command, inspection detail, form, supervisor review, evidence review, corrective actions to match `screens/html/` (content real, layout matching). KPICard/MetricStrip/charts re-tokened to `--chart-*` (Donut >6 categories: collapse to "Other" — 6 series max).

## PR 11 — Long tail
Remaining pages module-by-module (admin, workflows — WfDeck canvas keeps its own layout, re-tokened only; reports — PrintReport onto SAQEEL tokens with fixed print values; planning/bulk — CriteriaBuilder onto FilterRule grammar; AuthorityBar onto ReviewPanel+StatusBadge).

## PR 12 — Astryx removal
Delete: `apps/web/src/app/astryx.css`, all `--ax-*` definitions (and any PR-1 shim), `design/astryx/`, `saqeel-astryx.css` historical packs, `outputs/cd-*` styling packs, `MIM_Inspection_Meta_Astryx_Fable_Pack`, Space Grotesk/JetBrains font files+loads, dead exports. Zero-trace grep gate (§9) must pass in CI.

## PR 13 — Final verification
Run the full matrices: `handoff/VISUAL_QA_MATRIX.md`, `handoff/RESPONSIVE_QA_MATRIX.md`, `handoff/ACCESSIBILITY_QA_MATRIX.md`, `ipad/IPAD_VISUAL_QA_MATRIX.md` across EN/AR × light/dark × 1440/1280/1024/768. Produce `MIGRATION_VERIFICATION_REPORT.md` with per-screen pass/fail and screenshots.

# 4. NON-NEGOTIABLE VISUAL RULES (enforce in review of your own diffs)
- Semantic tokens only. No hex, rgb(), hsl(), named colours, or numeric px for anything a token carries, anywhere in product code. Add a lint rule (stylelint/eslint) in PR 1 enforcing this on changed files.
- No component-level dark-mode overrides: if a component needs a `[data-theme=dark]` rule, the token design is being violated — use the right semantic token instead.
- Typography: IBM Plex Sans EN / IBM Plex Sans Arabic AR / IBM Plex Mono identifiers only (INS-/PRM-/VIO-/CAP-/FND- codes, coordinates, asset numbers). Weights 400/500/600, 700 only on hero metrics. No letter-spacing on Arabic; no uppercase transforms on Arabic; identifiers `direction:ltr; unicode-bidi:embed` inside RTL.
- One emerald primary action per view. Status = the 10 canonical roles, always colour+label (badges) or shape+colour+label (ExceptionMark). Severity shapes fixed: ▲ critical ◆ major ■ warning ○ pending ▨ onhold ● compliant.
- Radii: 2/3/4/6px + full only for avatar/switch/marker/sync-pill. Borders 1px do structure; shadows only on floating layers.
- Logical properties ONLY (margin-inline-start, inset-inline-end, border-start-start-radius…). Zero `left:`/`right:`/`margin-left:` etc. in new code; RTL must work with `dir="rtl"` alone.
- `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }` on every interactive element. Never remove outlines.
- Motion: 120/180/260ms, cubic-bezier(0.2,0,0,1), functional only; `prefers-reduced-motion` collapse preserved.
- Touch: ≥44px targets on field surfaces (field density guarantees it), ≥24px minimum elsewhere.

# 5. ACCESSIBILITY (WCAG 2.2 AA — per design ACCESSIBILITY_SPECIFICATION.md)
Preserve/implement: dialogs trap+restore focus, aria-modal, Esc closes layers; menus/comboboxes/palette full arrow-key models; th scope=col + aria-sort; form errors aria-describedby + role=alert + summary links; status pills role=status; skip-link first; lang/dir per document; VoiceOver-sane identifier announcement; contrast per token design (don't "adjust" tokens to fix contrast — if a real failure appears, escalate).

# 6. i18n / RTL
All user-facing strings through the existing i18n layer — the design system's English labels are defaults, not hardcodes. Arabic screens: `screens/html/*-ar*.html` are the reference for composition (leading, mixed-direction lines, LTR identifiers, mirrored chrome). Dates 20 Jul 2026 / 20 يوليو 2026; Latin digits, tabular-nums on data. Gregorian default; Hijri support is an OPEN decision — do not build it, leave the existing behaviour.

# 7. TESTING REQUIREMENTS per PR
- Unit: new components (variants, states, keyboard) with the repo's test runner.
- The four rewritten contract specs stay green from PR 1 onward.
- E2E: the flows each PR touches (register CRUD+export, form submit+draft+offline, review approve/reject, map select/assign, field flow) in EN+AR × light+dark.
- Visual: screenshot the touched surfaces at 1440 and 1024 and compare against `screens/png/` (structural match: layout, hierarchy, tones — not pixel-identical, content differs).
- Use Claude in Chrome / Playwright for browser verification of every PR before requesting review; paste console output and screenshots in the PR description.

# 8. PER-PR CHECKLIST (include, ticked, in every PR description)
[ ] Only mapped items touched; unmapped → ESCALATE list
[ ] No new hex/font/px literals (lint green)
[ ] No `.ax-*` / `--ax-*` additions; net `.ax-*` usage decreased (count before/after)
[ ] Four modes verified (EN/AR × light/dark) with screenshots
[ ] 1440 + 1024 verified; field surfaces at 768 portrait
[ ] Keyboard + focus pass on touched surfaces
[ ] Behaviour-diff statement: "this PR changes zero behaviour" or an explicit, justified list
[ ] Contract specs green; E2E for touched flows green
[ ] Decision-register entries added for any supersession surfaced

# 9. FINAL ZERO-TRACE GATE (PR 12, CI-enforced)
`grep -rEni "ax-|astryx|space grotesk|jetbrains|barlow|sakil" apps/ packages/ --include="*.{ts,tsx,css,scss,json,html}"` returns ZERO hits in product code (allowed: the decision register, migration docs, git history). Fonts directory contains only IBM Plex families. Bundle analysis shows no Astryx CSS. All four contract specs + full E2E suite green. Then and only then squash-merge the removal PR.

# 10. REPORTING
After PR 1 and after every subsequent PR, append to `design/saqeel/handoff/IMPLEMENTATION_LOG.md`: date, PR, step, surfaces migrated, `.ax-*` count remaining, escalations raised, decisions logged. If at ANY point a needed visual decision is not in the design package — a component, a state, a token, an Arabic treatment — do not invent it: record it under ESCALATE TO CLAUDE DESIGN and continue with mapped work.

Begin with §2 (inventory). Report the inventory before your first implementation commit.

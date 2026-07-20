# Saqeel (صقيل) Design System

**Saqeel — the Saudi national industrial inspection platform** built for the Ministry of Industry & Mineral Resources (MIM). One platform: planning, field execution (offline-first iPad), virtual inspection sessions, Level-2 review, operations monitoring, and a governed admin control plane — "with security, immutability and audit enforced in the database, not promised in the UI."

The internal design system is called **Astryx** (prefix `ax-`). **This package is Saqeel Design System V4.1 — the canonical V2 system.** It originated from the production app and has since been evolved under stakeholder approval; the repository is DOWNSTREAM of this package (see `v2/SAQEEL-V2-MIGRATION-GUIDE.md`). Read `v2/SAQEEL-DESIGN-SYSTEM-V2-OVERVIEW.md` before designing.

## Sources
- GitHub: [Vikram-Indla/Inspection](https://github.com/Vikram-Indla/Inspection) (branch `setup/Inspection`) — explore it for deeper context:
  - `apps/web/src/app/tokens.css` — production tokens (copied here as `tokens/tokens.css`)
  - `apps/web/src/app/astryx.css` — current production V1 component library; V2 is delivered here as layered `styles/*.css`
  - `apps/web/src/components/` + `apps/web/src/app/*/page.tsx` — real screens (Dashboard, Visits, Field, Operations, Reviews, Admin)
  - `design/astryx/D1-0*.html` — the original coded design-authority frames
- Readers with repo access should study the real screens before designing new ones.

## Products / surfaces (four channels, one contract)
1. **Compliance Portal (Admin)** — regulation library, package & form designer, violation registry, risk studio; maker-checker on every publish.
2. **Planning & Review (Web)** — bulk/single/immediate visit planning; Level-2 review with immutable decisions; Factory 360 dossiers; operations monitoring.
3. **Inspector (iPad)** — offline-first field app: checklists, evidence, geofenced check-in, sync outbox. Touch targets ≥52px (`--ax-control-height-field`).
4. **Virtual Agent** — remote inspections with OTP-verified participants and session timelines.

## CONTENT FUNDAMENTALS
- **Tone**: institutional, declarative, confident. Short verb-led sentences: *"Plan visits. Decide reviews. Nothing slips."*, *"Industrial inspection, governed end to end."*
- **Governance is the brand voice** — copy cites enforcement, not promises: *"Self-approval is impossible — the constraint lives in Postgres (RBAC-002)."* Contract IDs (RBAC-002, ENG-12, M06-009, STM-SYNC-001) appear verbatim in UI copy and are **never translated**.
- **Casing**: sentence case everywhere (headings, buttons, labels). Micro-labels/overlines are set in `--ax-text-micro` and rely on size, not uppercase transforms, though table headers read as small caps-style micro type.
- **Person**: second person for the user ("Open your workspace", "Your visits, online or offline."); the platform speaks as an institution, never "we think/feel".
- **Bilingual EN/AR**: every string has an Arabic counterpart; the brand wordmark itself is Arabic (صقيل, sub-brand صناعي). RTL is native via CSS logical properties — never hardcode left/right.
- **Numbers are evidence**: stats are precise (478 requirements, 58 RLS policies, 48 triggers), always with tabular numerals (`--ax-numeric-features`).
- **No emoji in copy.** A small set of unicode glyphs is used *as system iconography* (see ICONOGRAPHY).
- **Status is text + glyph, never color alone** (MVP1-FND-011).

## VISUAL FOUNDATIONS
- **Color (V2)**: light-first institutional UI. Primary is Saqeel mineral green — #176B52 light, **#64C2A1 dark** (brand stays green in both themes; **blue #175CD3/#78AEDA is information and links only**, never principal action). Semantic set: success #18794E, warning #8A5A00, critical #B42318. Control boundaries use `--ax-color-border-control` (#7A8894 / #6B7680, ≥3:1); #D6DDE2 borders are decorative rules only. **All tints derive by `color-mix()` — never invent hex.** The Atlas login scene keeps its fixed dark palette as the sole expressive exception.
- **Type**: IBM Plex Sans Arabic is the single bilingual product voice (400/500/600/700). IBM Plex Sans Arabic is also used for input text (`--ax-font-input`) to keep one bilingual product voice. JetBrains Mono only for identifiers/machine telemetry and the version badge. Semantic scale (`--ax-text-*`): display 32/40 · title 24/32 · heading 19/28 · subheading 16/24 · body 16/24 · field 17/26 (iPad minimum) · caption 14/20 · micro 12/16. Headings are weight 500, not bold.
- **Spacing**: 4px base; rhythm 8/12/16/24/32/48 (`--ax-space-050…600`).
- **Radii (V2)**: 4 small / **6 standard & inputs** / 8 large / 999 full — pills reserved for filters and status chips only. The former 12px input radius is removed.
- **Elevation**: nearly flat. `--ax-shadow-raised: none`; hierarchy is carried by 1px borders (#D6DDE2) and tonal sunken/raised surfaces. Only overlays (menu, modal, drawer, toast) get a shadow (0 12px 28px, black-based).
- **Backgrounds (V2)**: three surface levels only — canvas · borderless tonal field (`--ax-color-surface-field`) · bounded panel (semantic reason required). No gradients, no glassmorphism. **Approved exception:** `.ax-texture-chrome`, a 1.5% measurement-tick motif, in low-information chrome only (command bar, brand band, nav, empty canvas) — never behind information, never in print. The workflow canvas uses a 20px radial dot grid; the map panel a warm tinted ground. Photography (industrial plants, ministry HQ) appears only on public/login surfaces.
- **Motion**: direct and functional only — 120ms/200ms `cubic-bezier(.2,0,0,1)`. Spinners, shimmer skeletons, a pulsing live dot, animated route dashes. Full `prefers-reduced-motion` kill switch. No bounces, no decorative animation.
- **Hover**: darker fill for primary buttons; neutral tint wash for secondary/rows/menu items; border darkens on inputs. **Press**: even stronger fill (`*-strong` / `neutral-weak`). **Focus**: universal 2px ring `--ax-focus-ring` (canvas gap + primary ring).
- **Cards/panels**: `.ax-surface` = white surface, 1px border, radius 6 (`.ax-panel` = 8), no shadow.
- **Tables**: sticky micro-type headers on sunken background, row hover tint, selected rows primary-tint, failed rows critical-tint.
- **Transparency/blur**: none in the product shell; overlay scrim is a color-mix of the shadow base at 60%.
- **Layout**: desktop grid max 1440px, 12-col, 24px gutters; shell nav 248px (68px collapsed); context panel 360px. Sticky topbar + sticky sidebar.
- **Controls (V2 density ladder)**: 36 compact utility · 40 admin/web standard · 44 principal · 48 prominent · 52 field/iPad — set via `.ax-density-compact` / `.ax-density-field` roots, never mixed on one surface. Buttons/tabs/labels use 14/20 (`--ax-text-action`/`--ax-text-label`); KPIs use 28/32 (`--ax-text-metric`, display 32/40 ≤1×/page). Status lozenges pair five domain glyphs with text; chips (`.ax-chip`) carry outcome/urgency/custody.
- **Imagery vibe**: functional, cool-neutral industrial photography; night-scene art direction on the Atlas login (fixed dark, never re-lit for light mode).

## ICONOGRAPHY
- **Stroke SVG icons only**: 24×24 viewBox, `stroke-width: 1.8`, round caps/joins, `currentColor`, `fill="none"`. Drawn inline in code (no icon font, no CDN). The full production set is recreated in `components/icons/Icon.jsx` (~25 glyphs: dashboard, radar, factory, calendar, visits, inspect, virtual, review, admin, library, forms, enforcement, workflow, risk, map, access, notify, insights, search, lock, close, chevron-down, check, target, shield, eye, video, map-pin, fingerprint, link, menu).
- **Unicode symbols as status carriers** (always paired with a text label): status domains ▣ ● ◆ ▲ ⟳; sync states ✓ ⛔ ⏳ ⟳ ⚠ ✕; version/immutable ⎘. Emoji are prohibited.
- **Logo**: the Saqeel prism — a magenta-violet faceted diamond (`assets/saqeel-prism.svg`, PNG sizes 32/512). An abstract Möbius-ribbon `BrandMark` exists in code for neutral contexts. Brand lockup = prism + Arabic wordmark صقيل over صناعي.
- No emoji in product copy or navigation.

## Components (React, `window.<Namespace>` from `_ds_bundle.js`)
All styling enters through `styles.css`, which composes the layered V2 source; wrappers are thin and implementation-oriented.
- `components/icons/` — Icon
- `components/core/` — Button, SplitButton, Field, Input, Select, Textarea, SearchInput, Checkbox, Radio, Switch, Segmented, Tabs, Accordion, Pagination, TypeCards
- `components/status/` — Lozenge, Badge, VersionBadge, Avatar, SyncChip, Freshness, Banner, Toast, Skeleton, StateCard
- `components/overlays/` — Tooltip, Menu, Modal, Drawer
- `components/data/` — KpiCard, DataTable, CommandBar, FilterChip, BulkBar
- `components/process/` — Stepper, Timeline, Breadcrumb, ValidationSummary, ConflictResolver, DiffText
- `components/patterns2/` — V2 pattern APIs: PageHeader, CommandHeader, StatusRail, MetricStrip, StatusChip, TonalField, RecordRow, ControlGroup, DateTime, DateRange, Signature, ReportHeader, ReportFooter, FieldActionBar, AdminFilterToolbar
- `components/domain/` — VisitCard, EvidenceCard, MapPanel, RuleRow, WidgetFrame

**Intentional additions**: `Icon` (wraps the app's inline-SVG set so consumers don't hand-roll paths); `MapPanel` renders a simplified static ground (production generates a full SVG scene via `astryx.js`).

## UI kits
- `ui_kits/web/` — authenticated web app: shell + dashboard, visits board, review detail (interactive click-through).

## Index
- `styles.css` — global entry: fonts + tokens + **layered source** (`styles/foundations|components-*|utilities|legacy-features|print.css`) + `tokens/v2-components.css`
- `tokens/` — `tokens.css` (canonical V2 tokens, light+dark), `fonts.css`, `v2-components.css`
- `styles/` — layered component CSS (split from the former astryx.css; `legacy-features.css` is compatibility-only)
- `patterns/` — 19 V2 reference screens (web/iPad/admin) + `gallery.html` regression specimens · `v2/` — specs, migration, changelog
- `assets/` — `saqeel-prism.svg/.png`, `icon.svg`, `brand/` photography, `fonts/` (IBM Plex Sans Arabic, Space Grotesk, JetBrains Mono woff2)
- `guidelines/` — foundation specimen cards (Design System tab)
- `components/` — see above · `ui_kits/web/` — screens · `SKILL.md` — agent skill entry

## Caveats
- V1 material (original pilot, approval package) is provenance only, under `explorations/premium-pilot/` — follow `v2/` specs, not pilot files.
- Fonts self-hosted from the repo (no substitutions needed). Space Grotesk input voice is retained under the frozen contract pending a documented removal decision (see deprecation map).
- The login "Saudi Industrial Atlas" cinematic scene (27KB of bespoke SVG/motion) is documented but not recreated.
- Dark theme is available by setting `data-theme="dark"` on `<html>`.

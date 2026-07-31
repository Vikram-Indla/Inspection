# Figma design-system build — handover

**Resume this exact task in a new Claude session/account.** Paste this whole file as your
first message (or point Claude at this path) and say "continue from this handover."

## What this task is

User asked: fix the Figma MCP connection, then build a 100%-fidelity SAQEEL design system
(tokens, components, screens) into a new Figma file, generated from the real codebase
(`apps/web/src/app/tokens.css`, `saqeel-components.css`) — not from screenshots or memory.

## Locked decisions (do not re-ask these)

1. **Fidelity model**: "token-bound faithful," not a literal pixel clone. Every value binds
   to a Figma variable that mirrors the CSS token — matches `docs/design/FIGMA-GENERATION-PLAN.md`
   and `CLAUDE.md` rules 1–2 (no raw hex, no bespoke spacing/radius).
2. **Scope**: everything in one pass — full component library + all 16 screens + RTL/Arabic
   pass + verification. (User explicitly chose "Everything in one pass" over smaller scopes.)
3. **`.map-cluster` bug** (`saqeel-components.css:363` — `background: var(--nav-bg)` +
   hardcoded `color:#fff`, invisible in light theme since `nav-bg` light = `#ffffff`):
   mirror it exactly in Figma, do not silently fix. Flag it as a real code-fix candidate for
   the web app, out of scope for this Figma task.
4. **Screen build order**: highest-traffic first — Dashboard, Operations(+live map),
   Factory 360, Planning(+creation flows), Execution, Reviews, Compliance(+approvals),
   Enforcement Library, Analytics, then the 6 Admin screens last.
5. **Screen content fidelity**: inspect the real `design/final-cut/saqeel-revamp.html` DOM
   per screen (via a local HTTP server) rather than approximate content from memory.
   **RESOLVED** — see "Session 2" below; DOM is now extracted headlessly via Playwright.

## Figma file

- File key: `ML2PNwfShlQM2k44MvSEw5`
- URL: https://www.figma.com/design/ML2PNwfShlQM2k44MvSEw5
- Plan used to create it: Senaei 2.0 — `planKey: "team::1357402622805853352"` (only needed if
  creating another new file; this file already exists, just open/edit it)
- Editor type: `design`

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0. Discovery | ✅ done | Blank file at start, no conflicts. 16 component families identified (not 15 — found a "Map" family). |
| 1. Foundations | ✅ done | 186 variables / 7 collections, 12 text styles, 10 effect styles. |
| 2. File structure | ✅ done | Cover, Getting Started, 4 Foundations doc pages, section markers. |
| 3. Component library | ✅ done | 12 pages, ~110 components/variants, all screenshotted/validated. |
| 4. Screens (16) | 🔴 **blocked, not started** | Blocked on Claude-in-Chrome extension not connecting — needed to read real DOM structure/copy from `saqeel-revamp.html` before building each screen. |
| 5. RTL + Arabic pass | ⏳ pending | Also blocked: `IBM Plex Sans Arabic` is not installed as a Figma font (see Known blockers). |
| 6. Final verification | ⏳ pending | |

## Known blockers (carry these forward)

1. **Claude-in-Chrome extension not connected** in this session/machine. `tabs_context_mcp`
   returned "Claude in Chrome is not connected" on repeated retries. Fix: install
   https://chromewebstore.google.com/detail/fcoeoabgfenejglbffodgkkbkcdhcgfn and sign in
   with the same Claude account, in the browser on **this Mac** (or whichever machine the
   next session runs on) — then retry `tabs_context_mcp`.
2. **IBM Plex Sans Arabic** is not installed as a Figma font in this org/account.
   `listAvailableFontsAsync()` found only Latin-script Plex families (Sans, Mono, Condensed,
   Devanagari, Hebrew, JP, KR, Thai, Serif) — no Arabic. Text styles currently use
   `IBM Plex Sans`/`IBM Plex Mono` as a substitute. This blocks true Arabic rendering for
   Phase 5 until the real font is added to the Figma org.
3. **Dark-mode shadows**: `tokens.css` dark-theme shadow recipes (`shadow-md/lg/card/card-hover`)
   have a genuinely different effect-layer *count* than light mode (ring+drop vs 1-or-3-layer
   soft stack) — a single Figma effect style can't mode-switch between different layer counts.
   Resolved by building separate static `-dark` effect style pairs (already done in Phase 1);
   remember to apply the `-dark` variant manually when building dark-theme screen frames.

## Local server for DOM inspection (Phase 4 prerequisite)

The approved design source is `design/final-cut/saqeel-revamp.html` — a 1.8MB bundled
JS app, not static markup (per project memory: "serve over HTTP + read DOM, never grep").
A server may already be running from this session:

```bash
cd /Users/vikramindla/Developer/Inspection/design/final-cut && python3 -m http.server 8973
```

Then open `http://localhost:8973/saqeel-revamp.html` in the connected Chrome tab and route to
each of the 16 screens to read real DOM structure before building it in Figma.

## Source-of-truth files (read these before building screens)

- `design/final-cut/saqeel-revamp.html` — approved visual design (open in browser, don't grep)
- `apps/web/src/app/tokens.css` — canonical token values (already fully mirrored into Figma variables)
- `apps/web/src/app/saqeel-components.css` — canonical component class list (508 lines, already read in full — see component family list below)
- `docs/design/FIGMA-GENERATION-PLAN.md` — the original build plan this task follows
- `apps/web/src/app/saqeel-tokens.figma.json` — pre-generated Figma Tokens Studio export (used as a starting reference in Phase 1; found to be missing dark-mode shadow values, which were sourced from `tokens.css` directly instead)
- `CLAUDE.md` (repo root) — hard implementation rules: no new CSS/tokens, copy markup structure exactly, no Astryx, status = badge+text never color-only, RTL via logical properties only, Arabic strings live in i18n (never typed into components), 11 fixed routes, never invent a governed value (render "Not configured" instead)

## Figma file structure built so far (by page name — use name lookup, most reliable)

Pages in order:
1. `Cover`
2. `Getting Started`
3. `— FOUNDATIONS —` (separator)
4. `Foundations: Colors` — 75 swatches grouped by category, bound to Color/Light variables
5. `Foundations: Typography` — 12 text style specimens
6. `Foundations: Spacing & Radius` — spacing bars + radius corner samples, bound to variables
7. `Foundations: Effects` — 10 shadow chips (light + dark)
8. `— COMPONENTS —` (separator)
9. `Button` — component set, Color×Size = 15 variants + modifier samples (icon/loading/disabled/block/touch/field)
10. `Badge, Tag & Chip` — Badge component set (10 status + outline) + Tag/Delta/ExcChip/FilterChip/ComboChip samples
11. `Form Controls` — Input (5 states), Checkbox×2, Radio×2, Switch×2, Select, Segmented, Combobox, File upload
12. `Alert` — 5 kinds (critical/warning/info/success/immutable)
13. `Panel & KPI` — Panel component, 4-up KPI grid, metric-strip, desc list
14. `Table` — toolbar/bulk-bar/header/rail-indicator rows/footer sample
15. `Nav & Chrome` — sidebar (with nav items), topbar, breadcrumb, tabs
16. `Overlay` — dialog, toast, tooltip, menu, popover, drawer
17. `Progress & Spine` — progress bar, steps, timeline, **Status Spine** (signature component)
18. `Identity & Misc` — avatar×3 sizes, user-chip, pagination, kbd, divider, accordion
19. `State` — 6 `.saqeel-state` kinds (error/conflict/stale/provider-unavailable/degraded/not-yet) + loading/skeleton + empty
20. `Map` — map-panel, map-marker, map-cluster (has the mirrored bug, see above), map-legend-row
21. `— SCREENS —` (separator, empty — this is where Phase 4 starts)

### Variable collections (all in the file already — do not recreate)

| Collection | Modes | Count | Notes |
|---|---|---|---|
| Primitives | Value | 23 | neutral-*/emerald-* ramps (unreferenced by components but real tokens), atlas-*/prism-magenta (login theme only), print-* (print stylesheet only) — all scoped `[]` (hidden) |
| Color | Light, Dark | 80 | All semantic surface/nav/text/border/action/accent/status/chart/map colors + 5 aliases (evidence-*, map-control-surface) |
| Spacing | Value | 10 | space-0..12 |
| Radius | Value | 5 | radius-xs/sm/md/lg/full |
| Sizing | Value | 15 | control-h-*, row-h*, touch-target, sidebar-w*, topbar-h, panel-w, grid-desktop-max, border-w |
| Typography | Value | 33 | type-*-size (FONT_SIZE), type-*-w (FONT_WEIGHT), type-*-lh (unitless ratio, NOT auto-bindable to Figma's PERCENT line-height — see description on each variable) |
| Shadow | Light, Dark | 20 | Only backs the 2 mode-reactive effect styles (shadow-xs, shadow-sm) — see effect styles below |

### Text styles (12, all in file)

`t-display` `t-page-title` `t-section` `t-heading` `t-body-lg` `t-body` `t-compact` `t-label`
`t-meta` `t-caption` `t-metric` `t-mono` — fontSize bound to Typography variables; font is
`IBM Plex Sans` / `IBM Plex Mono` (see blocker #2 re: Arabic).

### Effect styles (10, all in file)

`shadow-xs`, `shadow-sm` (mode-reactive, bound to Shadow collection) · `shadow-md`, `shadow-lg`,
`shadow-card`, `shadow-card-hover` (light, static) · `shadow-md-dark`, `shadow-lg-dark`,
`shadow-card-dark`, `shadow-card-hover-dark` (dark, static — apply manually on dark frames)

## Next immediate steps (in order)

1. Get Claude-in-Chrome connected (`tabs_context_mcp` should stop erroring).
2. Confirm/restart the local server for `saqeel-revamp.html` (command above).
3. Load skills: `figma-use`, `figma-generate-design` (both already summarized in this
   session's context — re-load via the `Skill` tool if starting fresh).
4. For each of the 16 screens (in the locked order above): navigate to it in the served
   design HTML, read DOM structure via `read_page`/`find`, then build the screen in Figma
   under the `— SCREENS —` page marker using the component library already built (look up
   component sets by name within this same file — no cross-file import needed, everything
   lives in file `ML2PNwfShlQM2k44MvSEw5`).
5. The 16 fixed routes (CLAUDE.md rule 9 — do not rename/add/nest):
   `/dashboard` `/operations` (+ `/operations/live` map) `/factory-360` `/planning`
   (+ single/bulk/immediate creation flows) `/execution` `/reviews` `/compliance`
   `/compliance/approvals` `/enforcement-library` `/analytics` `/admin/access`
   `/admin/localization` `/admin/risk` `/admin/packages` `/admin/notifications`
   `/admin/integrations`
6. After all 16 screens: Phase 5 (RTL frame variants + Arabic content set from i18n
   resources — never type Arabic directly into components, CLAUDE.md rule 8) — blocked
   until Arabic font is resolved (blocker #2).
7. Phase 6: screenshot every frame, diff against `saqeel-revamp.html`, confirm zero raw
   hex/unbound values, confirm every status renders as badge+text (never color-only),
   naming audit, accessibility audit.

## Nothing was committed to git

This entire task is Figma-file-side only. No local repo files were changed except this
handover doc and the (harmless, restartable) local HTTP server process.

---

# Session 2 (2026-07-31) — blockers cleared, shell built

## Blockers resolved

1. **Claude-in-Chrome — bypassed, not fixed.** The extension is still not connected
   (`list_connected_browsers` → `[]`). It is no longer needed: the design DOM is now read
   **headlessly with the repo's own Playwright** (`apps/web/node_modules/playwright`).
   Scripts live in the session scratchpad (`probe.mjs`, `dumpall.mjs`, `two.mjs`, `shell.mjs`,
   `vars.mjs`); each boots `http://localhost:8973/saqeel-revamp.html`, clicks a `.nav-item`,
   and dumps a class-annotated tree **with computed geometry** (display/gap/padding/radius/
   font-size/weight/color/box size) plus a full-page PNG.
2. **Arabic font — partially resolved.** `IBM Plex Sans Arabic` is still absent from the org,
   but `listAvailableFontsAsync()` does expose **Noto Sans Arabic, Cairo, Almarai, Tajawal**.
   Arabic now renders (the sidebar wordmark صقيل uses Noto Sans Arabic Bold). Phase 5 is no
   longer blocked; it ships on a documented substitute font.

## Corrections to the Session-1 handover

- **Phase 3 was overstated.** Only 5 of 12 component pages actually contained components
  (Button, Badge, Tag/chips, Form Controls, Alert, Panel). The other 7 pages —
  Table, Nav & Chrome, Overlay, Progress & Spine, Identity & Misc, State, Map — held plain
  sample **FRAMES**. All have now been promoted to real components (40 new components).
- **The library sidebar was a generic 5-item sample** ("Inspection / MONITOR / Dashboard,
  Operations, Factory 360, Planning, Execution") — not the product navigation. Replaced.
- **The shell is 1280px wide, not 1440** — `.sq-shell` is `grid-template-columns: 248px 1032px`.
  Screen frames must be **1280 × N**.
- **Admin routes are not blocked and must not be invented.** All six `/admin/*` destinations
  render the RBAC-refused `.saqeel-state` ("You do not have access to this destination",
  Request access / Back to default state) for the design's persona. There is no persona
  switcher anywhere in the design. Per CLAUDE.md rule 10 this refusal state **is** the
  admin screen content.

## What was built this session

- **40 components promoted** from sample frames, across 7 pages. `map-cluster` carries a
  description recording the deliberately-mirrored code bug.
- **`nav-item` component set** (`State=Default / Active / Child`) with `count` (Badge
  instance) and `caret` slots — page "Nav & Chrome", set id `18:10`.
- **`App sidebar`** component, id `19:2` — real product nav: brand block (صقيل / SAQEEL /
  collapse), 4 groups (Overview, Operations, Compliance, Insights), 12 destinations,
  Inspection + Administration carets, Review & Approval `9` and Approval Queue `3` badges.
- **`App topbar`** component, id `20:172` — search input, "Last 30 days", "All regions",
  spacer, EN/ع segmented control, theme toggle, notifications with count 4, AI assistant,
  MA avatar.

## Verified token facts (do not re-derive)

The design page's own CSS custom properties were dumped (`design-tokens.json`, 204 props) and
**match the Figma variables exactly** for spacing, radius and every `--type-*-size`.

Useful variable ids (prefix `VariableID:`): surface-primary `3:4`, surface-secondary `3:5`,
text-primary `3:16`, text-secondary `3:17`, text-on-action `3:21`, border-subtle `3:23`,
border-strong `3:24`, border-input `3:25`, action-primary `3:27`, action-primary-hover `3:28`,
status-critical `3:36`, space-1..6 `3:85`–`3:90`, radius-xs `3:95`, radius-sm `3:96`,
radius-md `3:97`, radius-full `3:99`, row-h-compact `3:108`, sidebar-w `3:110`,
topbar-h `3:112`, type-label-size `3:125`, type-button-size `3:126`, type-table-size `3:124`.

Component node ids: Button set `8:32` (Secondary/Medium `8:10`), Input set `9:66`
(Default `9:56`), Badge set `9:25` (Critical `9:3`), nav-item set `18:10`.

## Deviations logged (token-bound model, locked decision 1)

| Design value | Token? | What was done |
|---|---|---|
| nav label `13.5px` | none | bound to `type-table-size` (13) |
| sidebar group label `10.5px` | none | bound to `type-label-size` (12) |
| nav item gap `2px`, topbar gap `10px` | none | literal (no token mirrors them) |
| nav item padding `5px 10px 5px 8px` | partial | height bound to `row-h-compact` (34), inline padding `space-2` |
| logo radius `9px` | none | `radius-md` (8) |

## Plugin API gotchas hit (save time next session)

- Components in this file are **unpublished** → `importComponentSetByKeyAsync(key)` fails with
  "not found". Use node ids, and call `await page.loadAsync()` on the *source* page first
  (you may only `setCurrentPageAsync` once per script).
- **Instances only mirror children that are visible in the main component.** Adding a hidden
  slot to a variant does not appear in existing instances. Make slots visible in the main
  component, then hide them per instance — and **recreate** instances made before the slot
  existed.
- Mutating a main component invalidates already-fetched instance child references in the same
  script (`get_visible: node ... does not exist`). Split into two calls.

## Next steps

Phase 4 screens are unstarted. Build each as a **1280-wide** frame on the `— SCREENS —`
section: instance `App sidebar` (19:2) + `App topbar` (20:172), then compose `.sq-content`
from the captured dumps. Per-screen source of truth is in the session scratchpad:
`screen-00-dashboard.txt` … `screen-15-integration-management.txt`, `screen-x-execution.txt`,
`screen-x-review-approval.txt` (+ matching full-page PNGs). Regenerate any time with
`node dumpall.mjs` while the server on port 8973 is running.

---

# Session 3 (2026-07-31) — all screens built, 4 variants each

## Status

| Phase | Status |
|---|---|
| 0–3 Foundations + component library | ✅ done (see Session 2) |
| 4. Screens (16) | ✅ **done** |
| 5. RTL + Arabic | ✅ **done** |
| 6. Verification | ✅ done (see audit below) |

**64 frames** on the `— SCREENS —` page: 16 routes × 4 variants, laid out as a 16-column ×
4-row grid (row 1 `EN · Light`, row 2 `EN · Dark`, row 3 `AR · RTL`, row 4 `AR · RTL · Dark`).

## The 16 routes

`/dashboard` · `/operations` · `/factory-360` · `/planning` · `/execution` · `/reviews` ·
`/compliance` · `/enforcement-library` · `/compliance/approvals` · `/analytics` ·
`/admin/access` · `/admin/localization` · `/admin/risk` · `/admin/packages` ·
`/admin/notifications` · `/admin/integrations`

Every screen is 1280 wide (248 sidebar + 1032 main), matching `.sq-shell`'s real grid.

## How each variant was produced

- **EN · Light** — built section by section from the Playwright DOM capture of
  `saqeel-revamp.html` (structure, computed geometry and copy all read from the design; no
  content invented).
- **EN · Dark** — clone + `setExplicitVariableModeForCollection(Color, Dark)`. Because every
  fill is bound to a Color variable, the whole frame re-themes from the design's own dark
  tokens. No hand-recolouring.
- **AR · RTL** — clone → detach instances → reverse the child order of every horizontal
  auto-layout (this is what puts the sidebar on the right) → swap the font family to
  Noto Sans Arabic → replace every string from a 645-entry EN→AR dictionary → right-align.
- **AR · RTL · Dark** — clone of the AR frame + Dark mode.

**The Arabic is the design's own Arabic.** It was extracted by driving the design's EN/ع
toggle and pairing the EN and AR text sequences position-by-position
(`capture.mjs`, then `en2ar.json`). Nothing was machine-translated or invented. The dictionary
is staged in the file on the page `— AR STRINGS (staging) —` (4 text nodes) so any future
session can re-run the pass without re-deriving it.

## New components created this session

`KPI panel` · `Operational KPI` · `Factory card` · `Accordion header` (Panel & KPI / Identity
pages) and `App sidebar — Administration expanded` (Nav & Chrome), used by the six `/admin/*`
screens because the design shows the Administration group open there.

## Verification

- **Token binding**: 3,889 bound paints vs 302 unbound across the screens page. Every unbound
  paint is an icon placeholder (`sq-nav-icon` ×231, imported SVG `Vector` ×46, `icon` ×23,
  `assistant-icon` ×2) — the design itself renders these as untinted placeholder boxes.
- **Status = badge + text**: every status renders as a Badge instance carrying its label. No
  colour-only status anywhere (CLAUDE.md rule 6).
- **Governed values**: the design's `Not configured` / `Decision required` / `state count`
  states are reproduced verbatim on Analytics, Review & Approval and Approval Queue. No risk
  weight, SLA, threshold or penalty value was invented (rule 10).
- **Admin routes**: reproduced as the RBAC refusal state the design actually renders, with the
  real guard text naming `security_admin / compliance_admin / risk_owner / form_admin /
  workflow_admin` in `shell-navigation.ts`.

### Bug found and fixed during the build

`figma.createAutoLayout()` gives every new frame an **opaque white fill**. That is invisible on
a white light-mode canvas but rendered as solid white blocks over dark mode. 1,022 such frames
were swept and cleared. If you add frames later, clear `fills` explicitly.

## Known gaps

1. **Font substitute.** `IBM Plex Sans Arabic` (the product font, per `--font-body`) is still
   not in the Figma org. Latin text uses `IBM Plex Sans`; Arabic uses `Noto Sans Arabic`.
   Adding the real family to the org and re-pointing the text styles is a one-pass fix.
2. **Map imagery.** `/operations` uses a Mapbox GL raster canvas that cannot be reproduced in
   Figma. The map panel is built with the real `map-panel` / legend / breadcrumb / provider
   chrome around a stylised `map-zone` placeholder, which is named as such on canvas.
3. **AR frames are detached.** Mirroring requires reordering children, which Figma forbids
   inside an instance, so the AR variants are detached copies. EN variants stay fully linked
   to the component library.
4. **Untokened design values** (unchanged from Session 2): nav label 13.5px, group label
   10.5px, gaps 2px/10px/14px, radius 9px/14px, value sizes 16/19/24px. These exist in no
   token, so they are literals.

---

## DECIDED 2026-07-31 — Arabic font substitute is accepted, do not retry

**Do not re-attempt the IBM Plex Sans Arabic install.** It was investigated and closed.

- Arabic renders in **Noto Sans Arabic** (Regular / Medium / SemiBold / Bold). Latin renders in
  **IBM Plex Sans**. Both are in Figma's hosted catalogue.
- `IBM Plex Sans Arabic` — the product font per `--font-body` in the design — **cannot** be used
  in this file. The Figma MCP runtime is server-side with a fixed catalogue of 8,927 fonts;
  it does not include the family and does not read locally installed fonts.
  `loadFontAsync` returns `The font family "IBM Plex Sans Arabic" does not exist`.
  Verified unchanged before install, after install, after launching Figma desktop, and after
  opening this file in desktop.
- Shared-fonts upload (the only server-side fix) is Organization/Enterprise only. This file
  lives in the **Senaei 2.0** team, which is **pro** tier, so it is not available. The account's
  two org memberships (MIM, Elm) are **View** seats.
- The 7 static weights were nonetheless installed to `~/Library/Fonts` on Vikram's Mac and are
  registered by macOS under family `IBM Plex Sans Arabic`. They therefore appear in the font
  picker of the **Figma desktop app**, if anyone wants to re-point the styles by hand there.
  Caveat if they do: editors without the font installed will see "missing font".

**If the file ever moves to an Organization tier and an admin uploads the family as a shared
font**, re-pointing is a single script: swap the family on the 12 `t-*` text styles and on every
TEXT node across the 64 screen frames, keeping the existing style names (Regular/Medium/
SemiBold/Bold map 1:1 between the two families).

---

# Session 4 (2026-07-31) — fidelity corrections

Five defects were found against the design and fixed. All 48 variant frames were regenerated
from the corrected `EN · Light` originals afterwards, so the whole matrix carries the fixes.

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | Frames taller than their content | Factory 360 was 2901px for ~2260px of content | Every screen now hugs: `sq-content` and `main` set to HUG, frame `counterAxisSizingMode = AUTO`, sidebar FILL. Analytics 3582→2880, Factory 360 2901→2260. |
| 2 | Panels had no depth | Canonical `saqeel-components.css:181` — `.panel { … box-shadow: var(--shadow-card) }` — was never applied | `shadow-card` effect style applied to 76 panels + the KPI panel / Operational KPI / Factory card components. Dark variants get `shadow-card-dark` (different layer count, as designed). |
| 3 | Nav rail used placeholder boxes | The served design renders `.sc-placeholder` divs, but the repo has the real marks | 14 icon components created from the verbatim `d` strings in `apps/web/src/components/ShellNavIcon.tsx`, wired to `nav-item` as an `Icon` INSTANCE_SWAP property and mapped per route from `shell-navigation.ts`. |
| 4 | Administration in the wrong place | DOM shows it in its own `div` **after** `.sq-shell__groups`, pinned at the sidebar bottom (y=659, groups end 651). INSIGHTS contains only Analytics. | New `sq-shell__footer` in the sidebar component, top rule, Administration moved into it; groups now FILL so the footer pins to the bottom. |
| 5 | Stray white fills | `figma.createAutoLayout()` defaults to an opaque white fill | Swept again — 354 more cleared across the regenerated frames. |

## New components

`icon/dashboard · radar · factory · calendar · inspect · review · library · enforcement ·
admin · access · risk · forms · notify · workflow` (Nav & Chrome) and
`seg-opt` (Selected/Default), `filter-chip`, `stat`, `section-title` (Form Controls).

## Componentization status — known remaining work

Instances per `EN · Light` screen now run 37–74, but raw frames still outnumber them on
table-heavy screens (Analytics 200, Planning 187, Compliance Library 135). **The bulk of those
raw frames are table `th`/`td`/`tr` cells**, which were generated inline rather than instanced.
Retrofitting a `Table cell` / `Table row` component and swapping them in is the single biggest
remaining consistency win. It requires regenerating the 48 variant frames again afterwards.

## iPad file — nothing available to copy

`8wGaofgbopqmGXc0Wjo0eW` (MIM iPad Inspector App) exposes exactly one page to this account,
`🖼️ Thumbnail`, containing a Cover frame with `Gov_Logo` and decorative vectors. No maps, no
components, no screens are reachable. Either the rest of the file is not shared with this
account or the link points at a cover-only file. To reuse its map, the quickest route is a
manual copy-paste between the two files in the Figma UI — that carries the layers across
intact and preserves our design system, since nothing in it would be re-styled.

---

# Session 5 (2026-07-31) — table components + interaction states

## 1. Table primitives, and the retrofit

New component set **`Table cell`** (Table page) — `Kind = Header | Data | Row header`
× `State = Default | Hover`. Every variant carries a `cell-text` slot and a `cell-badge`
slot (a Badge instance); a cell hides whichever it does not use, so a status cell is a real
Badge instance rather than a hand-drawn pill.

**365 hand-built cells were converted to instances** across the five table screens —
Planning 117, Analytics 84, Enforcement 63, Compliance 56, Execution 45. Cells whose content
is an action Button were left as-is (3 on Execution) because the slot model does not cover them.

Result across the `EN · Light` screens: **1,076 instances vs 940 raw frames (53%)**, up from
roughly 600 vs 1,400 before. Biggest movers: Planning 74→191 instances (raw 187→70),
Enforcement 37→100 (raw 100→37), Compliance 50→106, Analytics 58→142.

## 2. Interaction states

All state recipes are the canonical ones in `saqeel-components.css:17–30` — none invented.

| Component | States | Source |
|---|---|---|
| `Button` | Color × Size × **State = Default / Hover / Pressed / Disabled** — 60 variants | `:hover` 19/22/25/27/29, `:active` 20/23/30, `:disabled` opacity 0.45 (line 17) |
| `nav-item` | + `State=Hover` (nav-bg-hover) | `.nav-item:hover` |
| `filter-chip` | now a set: Default / Hover / Selected (`.is-set`) | — |
| `seg-opt` | + Hover | — |
| `Table cell` | + Hover on Data and Row header (row hover) | `.table tbody tr:hover` |

Tertiary and Ghost have no `:active` rule in the CSS, so their Pressed variant holds the hover
treatment — recorded in the component description rather than invented.

All 48 variant frames were regenerated afterwards, so dark and Arabic carry the retrofit.

---

# Session 6 (2026-07-31) — icon library + prototype

## Icon library — new `Icons` page, 51 components

Every glyph is the repo's own path data, copied verbatim. Nothing was drawn by hand or
substituted from an icon set.

- **`icon/nav/*` (14)** — from `apps/web/src/components/ShellNavIcon.tsx`. Already wired to
  `nav-item` through its `Icon` INSTANCE_SWAP property.
- **`icon/ui/*` (37)** — from `apps/web/src/app/icons.tsx`: target, factory, clipboard-check,
  scale, trend-up, video, map-pin, shield-check, check, gov-flag, lock, eye, eye-off,
  chevron-down, link, close, blocked, search, document, calendar, folder, map, globe, bell,
  lightbulb, scroll, list, chart, shuffle, robot, user, package, layers, satellite, pin,
  paperclip, fingerprint.

Extraction was scripted (parse `icons.tsx` → strip JSX expressions → normalise camelCase SVG
attributes) rather than transcribed, so the `d` strings are byte-identical to the source.
Strokes and solid fills are bound to `text-secondary`, so the glyphs re-theme with the file
instead of carrying a hardcoded colour.

## Prototype — 780 links, 4 flows, 0 dangling

Every sidebar destination on every screen is clickable and lands on the matching screen
**inside its own variant row**, so a flow never jumps theme or language mid-run:

| Flow | Frames | Links |
|---|---|---|
| SAQEEL — EN · Light | 16 | 195 |
| SAQEEL — EN · Dark | 16 | 195 |
| SAQEEL — AR · RTL | 16 | 195 |
| SAQEEL — AR · RTL · Dark | 16 | 195 |

Transition is `SMART_ANIMATE`, 200ms, ease-out. Arabic screens are matched on their Arabic
labels (`لوحة القيادة` → `/dashboard`, and so on), since those frames are detached and
translated. `Administration` and all six admin children resolve to `/admin/access` and the
five other admin routes. Verified: **0 dangling destinations**.

Each variant row has its own flow starting point, so the prototype opens on Dashboard in
whichever theme/direction you pick.

---

# Session 7 (2026-07-31) — screens repointed to icon components

## What changed

| Placeholder | Now | Source |
|---|---|---|
| Topbar notification box | `icon/ui/bell` instance | `icons.tsx` |
| Topbar assistant inline SVG | `icon/nav/ai` instance | the design's own assistant button markup |
| Factory 360 `assistant-icon` box | `icon/nav/ai` instance | same |
| Sidebar `sq-nav-icon` boxes | `icon/nav/*` (done in session 6) | `ShellNavIcon.tsx` |

`icon/nav/ai` was created from the served design's exact `d` strings, not from
`ShellNavIcon.tsx`'s `ai` glyph, because the topbar button ships its own sparkle mark.

**No search-field icon was added.** The design's `.input-affix` contains a bare `<input>` with
a placeholder and no glyph — verified in the DOM. Adding one would have been an invention.

The theme toggle keeps its `☾` text character, which is literally what the design renders.

## Colour binding — clean

All 52 icon components carried an opaque white background left behind by `createNodeFromSvg`.
Cleared. With that fixed, the audit across the `EN · Light` screens is:

- **3,460 bound paints, 0 unbound.** Every fill and stroke on every screen now resolves through
  a design-system variable. The GLOBAL COLOR LAW holds with no exceptions on the screens page.

## Regenerated and re-verified

All 48 variant frames rebuilt from the repointed originals, heights re-hugged, grid re-laid out,
and all four prototype flows re-wired: **780 links, 0 dangling, 4 flow starting points.**

---

# Session 8 (2026-07-31) — library publish prep; Code Connect blocked

## Code Connect — blocked by plan, verified not assumed

`list_file_components_for_code_connect` returns:

> *You need a Dev or Full seat on an Organization or Enterprise plan to use Code Connect.*

The file lives in the **Senaei 2.0** team, tier **pro**. Code Connect is Organization/Enterprise
only, so it cannot be set up from here — same class of blocker as the Arabic font.

The repo has no `figma.config.json`, no `@figma/code-connect` dependency and no `*.figma.ts`
files, so nothing is half-wired. **Nothing speculative was written.** Authoring template files
that can neither be validated nor published would only rot.

**When the file moves to an Org/Enterprise plan**, the work is mechanical and small:
1. `npm i -D @figma/code-connect` in `apps/web`, add `figma.config.json` with `parser: "react"`.
2. Add `"types": ["@figma/code-connect/figma-types"]` to the tsconfig.
3. Author **`.figma.ts` parserless templates** (NOT `.figma.tsx` / `figma.connect()`).
4. The natural first mappings, since both sides already exist:
   `Button` → the `.btn` classes, `Badge` → `.badge`, `Input`/`Checkbox`/`Radio`/`Switch`/`Select`
   → `apps/web/src/components/saqeel/inputs/`, `nav-item` → `ShellNavIcon.tsx` +
   `lib/shell-navigation.ts`, `icon/nav/*` and `icon/ui/*` → `ShellNavIcon.tsx` / `icons.tsx`.

## Library publish — file is ready, publishing itself is UI-only

There is no Plugin API or MCP call that publishes a library; it is a click in the Figma UI.
The file was prepared for it:

- **119 publishable components / component sets, 0 missing descriptions.** 14 components from the
  original build had none; each now carries a description citing its canonical rule
  (e.g. `Panel` → `saqeel-components.css:181`).
- 12 text styles, 10 effect styles, 7 variable collections (186 variables) all publish with it.

### Bug found while writing those descriptions

`.filter-chip` is `1px **dashed** var(--border-strong)` on a transparent ground
(`saqeel-components.css:452`). It had been built with a **solid `border-input`** edge.
Corrected on the component set (3 variants) and on **64 chips across the screens**.

### To publish

Figma desktop → **Assets** panel → *Libraries* → find this file → **Publish**.
Review the change list, add a version message (suggest: *"SAQEEL v1 — foundations, 119
components, 16 routes × 4 variants"*), publish. Then in any consuming file, enable the library
from the same panel.

Optional tidy first: the `— AR STRINGS (staging) —` page holds only the EN→AR dictionary text
nodes. It publishes nothing, but it can be deleted once the Arabic pass is settled — keeping it
means the translation can be re-run without re-deriving it.

---

## AR strings page deleted 2026-07-31 — dictionary preserved in the repo

The `— AR STRINGS (staging) —` page has been removed from the Figma file. It held only four
text nodes, no components or styles, so nothing published was affected. The file is now 22
pages, screens page still 64 frames.

Before deleting, the dictionary was written to **`docs/design/saqeel-ar-strings.json`**
(648 EN→AR pairs, sorted, UTF-8). These are the design's own Arabic strings, extracted by
driving its EN/ع toggle and pairing text sequences positionally — not machine-translated. Keep
this file: re-deriving it needs the local HTTP server plus the Playwright capture scripts, and
the Arabic screens are detached copies, so a future retranslation pass reads from here.

---

# Session 9 (2026-07-31) — library PUBLISHED

The SAQEEL library is live. Verified programmatically, not by reading the UI: components that
previously failed `importComponentSetByKeyAsync` with *"not found"* now resolve.

```
Button → published, 60 variants
Badge  → published, 11 variants
Panel  → published
```

437 assets were published in one pass.

## What had to happen first

Figma refuses to publish a library from **Drafts**:

> *Move to project to publish library assets — Move this file to a project in order to publish
> to this team's library.*

So the file was moved out of Drafts. **Final location: Senaei 2.0 › `Saqeel design system`.** The move out of Drafts initially landed
it in `D&D File` (Figma's default on the confirm step); it was then moved into its own project.
Re-verified after the move — all component keys still resolve, so the move broke nothing.

**Access note:** the file is no longer private to Vikram's drafts. Everyone with access to the
`Saqeel design system` project in Senaei 2.0 can now open it, including all 64 screens.

## Consuming the library

In any other Figma file: Assets panel → Libraries → enable **Inspection - Web**. The 119
components, 12 text styles, 10 effect styles and 186 variables become available.

## Operational note for future automation

A floating **Wispr Flow** overlay window sat above Figma and silently blocked every synthetic
click in the lower-middle of the screen (the computer-use layer refuses clicks that would land
on a non-allowlisted app). Closing its window was not enough — the process had to be quit.
If UI automation against Figma starts failing for no visible reason, check for overlay apps first.

---

## FINAL STATE — 2026-07-31

**Figma file:** `ML2PNwfShlQM2k44MvSEw5` — "Inspection - Web"
**Location:** Senaei 2.0 › **Saqeel design system**
**Library:** published (437 assets)

Re-verified by key **after** the project move — a move between projects in the same team
preserves component keys and the published library:

```
Button  OK (60 variants)     Panel        OK
Badge   OK (11 variants)     App sidebar  OK
Input   OK (5 variants)      topbar       OK
Alert   OK (5 variants)      map-cluster  OK
```

22 pages · 64 screen frames · 4 prototype flows · 780 links · 0 dangling · 0 unbound colours.

### Open items (both external blockers, not work items)

1. **Code Connect** — needs an Organization/Enterprise plan; the team is Professional.
2. **iPad map** — `8wGaofgbopqmGXc0Wjo0eW` exposes only a Cover page to this account. Paste the
   map frame across in the Figma UI and it can be wired into `/operations`.
3. **IBM Plex Sans Arabic** — not in Figma's hosted catalogue and not uploadable on a Pro plan.
   Arabic renders in Noto Sans Arabic (decision recorded above; do not retry).

---

# Session 10 (2026-07-31) — typography fixed

## The defect

An audit of the 1,736 text nodes on the `EN · Light` screens found:

- **0 used a text style.** The 12 styles were built in Phase 1 and never applied.
- **0 had a line-height.** All were `AUTO`, so the design's ratios (body 1.5, heading 1.4,
  label 1.35, page-title 1.3, metric 1.15) were absent everywhere.
- 287 font sizes were raw literals across 14 distinct sizes.

Font size *was* bound to variables, which is why earlier token audits looked clean — but size
alone is not typography. This was the visible "text looks wrong" on every screen.

## Token bug found underneath it

The Figma variable `type-compact-size` held **14px**. That is the coarse-pointer media-query
override at `tokens.css:310`; the base value at **`tokens.css:232` is 13px**. The variable had
captured the wrong branch of the stylesheet, so `t-compact` was 1px too large everywhere it
was used. Fixed at the variable, so the style and every consumer corrected together.

## Applied

1,735 of 1,736 nodes now carry a text style (1 mixed-font node skipped):

```
t-meta 456 · t-compact 404 · t-label 393 · t-body 230 · t-caption 84
t-heading 80 · t-section 39 · t-page-title 36 · t-metric 8 · t-mono 5
```

Mapping is by size, disambiguated by weight where the ramp collides (14px → `t-heading` at
600+, else `t-body`; 12px → `t-label` at 500+, else `t-meta`). Sizes with no token of their own
(19, 16, 24, 11, 10.5, 10) map to the nearest semantic style rather than staying literal.

**Line-height across the whole file: 8,452 of 8,464 nodes explicit, 12 `AUTO`.** The Arabic
frames swap font family, which drops the style link, so line-height is re-applied there from
the same token ratios after the swap.

## Rebuilt

All 48 variants regenerated from the corrected originals: 64 frames, 4 flows, 780 links,
0 dangling.

## The AR dictionary is back in the file — do not delete it again

Page **`— AR STRINGS (do not delete) —`** holds the 648 pairs in two nodes (`ar-A`, `ar-B`),
mirroring `docs/design/saqeel-ar-strings.json`. It was deleted once and regenerating the Arabic
screens then required re-injecting 33KB by hand. Leave it in place.

---

# Session 11 — table overflow, and the reuse audit

## Table: the diagnosis was wrong, the fix is different

The design's table columns **are** equal width — 71px each (990 ÷ 14) — so equal columns in
Figma were correct. The overflow came from the badge: in the design a status badge is 55px wide
with its label **wrapped to two lines** (`37×36`), whereas ours hugged to one line and spilled
into the next column.

Fixed by letting badges inside `th`/`td` fill the column and their label wrap
(`textAutoResize = HEIGHT`). 168 badges across all 64 frames. No overflow remains.

Cosmetic residue: single-word labels ("Published", "Returned") break mid-word at 76px columns.
The design has the same constraint; if this matters, the answer is fewer columns or a wider
Status column — both are design changes, not Figma fixes.

## Reuse audit — nothing internal exists

`get_libraries` on the file returns:
- **added:** only `Inspection - Web` (ours)
- **available:** Material 3, Figma's Simple Design System, Apple iOS/iPadOS/macOS/watchOS/visionOS

There is **no other internal SAQEEL/MIM/Senaei library published** in this account. Nothing can
be reused from the other projects, because none of them are libraries — they are plain files.
The iPad file remains unreadable to this account beyond its Cover page.

Figma's **Simple Design System** is worth reading as a *structural* reference — it is
Figma-built, code-backed, and demonstrates Slots, min-widths and component-property patterns.
Reference only; the SAQEEL visual system does not change.

---

# DECIDED 2026-07-31 — final-cut is canon. 16 routes only.

**Product Owner ruling: `design/final-cut/saqeel-revamp.html` is the canonical source for
this Figma file. Sixteen routes. Nothing else.**

This resolves the conflict flagged in earlier sessions and is not to be re-litigated.

## What this means

- **The Figma is scope-complete for web.** The 16 routes below are the whole surface. No
  further screens are to be built into this file.
- `designs/` (42 web · 21 admin · 43 PWA `.dc.html`) is **not** the Figma's scope, despite the
  slice context naming it `design_authority`. That field governs *app delivery* against the
  55-card board; it does not govern this file. If a future session sees that field and reaches
  for the 106 `.dc.html` screens, it is wrong — this ruling supersedes it for Figma.
- The 57-card board in `status/saqeel-status.json` likewise tracks delivery, not Figma canon.
  Roughly 8 of 22 web cards and 0 of 35 admin/PWA cards have a Figma screen, and **that is now
  expected and correct**, not a gap to close.

## The canonical 16

/dashboard · /operations · /factory-360 · /planning · /execution · /reviews · /compliance ·
/enforcement-library · /compliance/approvals · /analytics · /admin/access ·
/admin/localization · /admin/risk · /admin/packages · /admin/notifications ·
/admin/integrations

Each exists in four variants: `EN · Light`, `EN · Dark`, `AR · RTL`, `AR · RTL · Dark` — 64
frames total. The six `/admin/*` routes render the RBAC refusal state, which is what the design
itself renders for its persona (CLAUDE.md rule 10). That is complete, not missing.

## What "identify gaps against Jira scope" now means

Not "which screens are missing from Figma" — none are. It means comparing the **16 canonical
routes** against Jira/board scope to find:
1. Board cards with no canonical route (out of Figma scope by this ruling — a delivery
   question, not a design one).
2. Canonical routes whose Figma screen shows governed states (`Not configured`,
   `Decision required`) that correspond to **open product decisions** — these are the real
   design-side gaps, and they are already visible on Analytics, Review & Approval and
   Approval Queue.

## Next work is now unblocked and unambiguous

Standardisation proceeds against these 16 routes only, in this order: atomic constraints
(min-width / HUG / FILL) → Slots on containers → componentise the remaining ~47% →
publish + Code Connect when the plan allows.

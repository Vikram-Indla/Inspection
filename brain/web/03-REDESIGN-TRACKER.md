# 03 — Redesign Tracker

The work board for `apps/web`. **One task at a time.** Take the top unblocked
item in NOW. Do not start a second task until the current one clears the full
Definition of Done in `rules/WEB-006-definition-of-done.md`.

Statuses: `todo` · `in-progress` · `blocked` · `done`

---

## NOW

### T-000 · Guardrails: gate scripts, lint, verify pipeline
`status: todo` · `rules: WEB-000, WEB-006` · `est: 3h`

Nothing else starts until the rules are machine-enforced, because a rule that is
only in a document is a suggestion.

- `apps/web/scripts/gates/` — one script per gate in WEB-006 §3
- ESLint flat config: `@next/eslint-plugin-next`, `eslint-plugin-jsx-a11y`
  (all rules error), `@typescript-eslint` strict, `no-restricted-syntax` for
  `let` in `.tsx`, `no-console`
- `npm run gates`, `npm run verify`
- Wire both into `.github/workflows/`
- Baseline report: current violation count per gate, recorded in the session
  neuron, so progress is measurable

Acceptance: `npm run gates` runs, reports, and fails on a deliberately planted
violation of each rule.

---

### T-001 · Icon layer: lucide-react, registry, `Icon` primitive
`status: todo` · `rules: WEB-002 §5` · `est: 2h` · `blocked-by: T-000`

- Add `lucide-react`
- `components/saqeel/media/icon-registry.ts` — semantic name → Lucide component
- `components/saqeel/media/Icon.tsx` + `Icon.module.css` (token-driven sizes,
  `currentColor`, `aria-hidden` by default, `label` for standalone use)
- Map every glyph currently in `app/icons.tsx` to a semantic registry name
- Mark `app/icons.tsx` with the `@retiring` banner; add its ledger row
- Enable `gate:no-svg` and `gate:icon-registry`

Acceptance: `<Icon name="riskCritical" />` renders; zero new `<svg>` possible.

---

### T-002 · SAQEEL design system — one stylesheet
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-005, WEB-007` · `est: 5h`
`record:` [2026-08-07-T-002-design-system](sessions/2026-08/2026-08-07-T-002-design-system.md)

**Redefined by the owner on 2026-08-07.** The original T-002 ("core primitives",
CSS Modules, React components) was replaced before it started. The design system
is now **one stylesheet**, not a component library plus per-component modules.

Delivered: `apps/web/src/app/saqeel.css` — 2,050 lines, one file, three cascade
layers (`sqx.tokens`, `sqx.base`, `sqx.components`). 339 custom
properties, 59 classes, 3 keyframes. Prefix is `--sqx-` / `.sqx-` — `--sq-` and
`.sq-` belong to the legacy sheets, and `sqx` collides with nothing. Variants are data
attributes, not modifier classes. Imported once from `app/layout.tsx`.
`tokens.css` untouched. WEB-002 §6 replaced; WEB-001 §9 gained the direction
exception.

The React primitives that consume these classes are **not** part of T-002 and are
now T-004.

---

### T-003 · Install and self-host Readex Pro
`status: todo` · `rules: WEB-005 §5` · `est: 2h`

`saqeel.css` declares `--sqx-font-sans: "Readex Pro", "IBM Plex Sans Arabic",
system-ui, sans-serif` but ships no font files, so the fallback currently carries
the app. This task self-hosts the family.

- `next/font/local`, variable 160–700, one file per script (Latin, Arabic)
- Only the weights the twelve type roles use: 400, 500, 600, 700
- `display: swap`, preloaded, subset where the character set allows
- Record the byte cost per weight and drop any weight that cannot justify itself

Acceptance: no external font request, no FOIT, first-load JS unchanged, byte cost
recorded.

---

### T-004 · App shell — header, sidebar, content frame
`status: done` · `rules: WEB-000…005, WEB-007` · `est: 6h`
`record:` [2026-08-07-T-004-app-shell](sessions/2026-08/2026-08-07-T-004-app-shell.md)

**Redefined by the owner on 2026-08-07** — the board's T-004 was "React
primitives over `saqeel.css`"; that work is now **T-006**.

Delivered: `components/app-shell/**` (15 files, 897 lines), `features/shell/**`
(4 files, 307 lines), `components/saqeel/icon/**` (2 files, 89 lines), plus 638
lines of `.sqx-shell*` CSS in `app/saqeel.css`. `(app)/layout.tsx` is 6 lines.
`ShellClient.tsx` (46 KB) is off every `(app)` route. Icon layer is
`lucide-react` behind one registry — zero hand-authored `<svg>` in the shell.

**Not verified in a browser.** The SWC blocker below meant none of the brief's
13 runtime checks could run. Static verification only.

---

### T-005a · Kill the native dropdown and date picker
`status: done` · `rules: WEB-002 §2 (suspended), WEB-008, WEB-009` · `est: 3h`
`record:` [2026-08-07-T-005a-native-controls](sessions/2026-08/2026-08-07-T-005a-native-controls.md)

`menu-surface`, `select` and `date-range-picker` built; the topbar scope controls
rebuilt on them. Both Definition-of-Done greps pass. The ink and green ramps were
re-saturated at hue 152 — `--sqx-surface-canvas` is now `#000A05` and all 20
claimed contrast ratios were re-measured and confirmed.

`--sqx-rim-light` changed from a colour to a shadow, which required rewriting
`--sqx-elevation-1…4`; without it every dark elevation would have silently
dropped. `--sqx-gradient-chrome` was restated as instructed but is **not
consumed** — the chrome stays flat per the owner's earlier decision.

---

### T-005 · Header controls — the reusable control family
`status: blocked` · `rules: WEB-002 §2, WEB-008, WEB-009` · `est: 8h`
`record:` [2026-08-07-T-005-header-controls](sessions/2026-08/2026-08-07-T-005-header-controls.md)

**Blocked on 13 missing tokens.** WEB-002 §2 and WEB-008 §2 forbid adding a token
inline; a gap is reported and stopped on. Two of the ten components need no new
token and are delivered: `icon-button`, `kbd`. The other eight are blocked, and
`menu-surface` blocks five of them on its own.

Delivered: `components/saqeel/icon-button/**`, `components/saqeel/kbd/**`,
barrel exports, and the topbar's hand-built icon buttons replaced.

**Unblocking is one change request**: add the 13 tokens in the record's gap block
to `saqeel.css`, then T-005 completes in one pass.

---

### T-006 · React primitives over `saqeel.css`
`status: todo` · `rules: WEB-002, WEB-003` · `est: 5h`

The typed component layer that applies the classes T-002 built. Components ship
**no CSS** — they map props onto `.sqx-*` classes and data attributes.

- `surface/` — `Card`, `Panel`, `Section`, `SectionHeader`, `Divider`
- `surface/` layout — `Stack`, `Cluster`, `Grid` (the only sources of spacing)
- `data/StatusPill` — the ten canonical roles, text plus shape
- `inputs/Switch` (Toggle) — full APG keyboard and labelling contract
- `actions/Button`, `actions/IconButton` — rebuilt to the primitive contract
- `data/KpiTile`, `feedback/EmptyState`, `feedback/Skeleton` — rebuilt

Acceptance: each primitive under 200 lines, zero colocated CSS, axe-clean,
correct in dark and RTL, ledger rows written.

---

### T-007 · Adopt `ShellPageFrame` across the 55 route files
`status: todo` · `rules: WEB-001 §2, WEB-005` · `est: 6h` · `blocked-by: T-004`

T-004 built `shell-page-frame` but was forbidden from touching pages, so the
default `Shell` export from `components/Shell.tsx` is still imported by 55 files
under `app/(app)/**`. Each one swaps `<Shell title>` for `<ShellPageFrame>`.
Only when all 55 are migrated — plus T-008 — can `Shell.tsx` be deleted.

---

### T-008 · Migrate the two out-of-group admin layouts
`status: todo` · `rules: WEB-001 §7` · `est: 2h` · `blocked-by: T-004`

`app/admin/execution/layout.tsx` and `app/admin/dashboard-config/layout.tsx` sit
**outside** the `(app)` route group and still import the named `AppShell` from
`components/Shell.tsx`, so `ShellClient.tsx` (46 KB) still ships on those two
routes. Point them at `components/app-shell/app-shell` and `ShellClient` reaches
zero imports.

---

### T-005 · Reference route — the showcase
`status: todo` · `rules: WEB-002 §9` · `est: 2h` · `blocked-by: T-004`

A single internal route rendering every primitive in every variant, in light,
dark, English and Arabic. This is what gets opened in the manager meeting and it
is also the fastest way to spot a broken variant.

Acceptance: one page, every primitive, every state, zero axe violations.

---

## NEXT

### T-010 · Application shell
`status: todo` · `rules: WEB-001, WEB-004, WEB-005` · `est: 6h`

`ShellClient.tsx` is 45 KB of client JavaScript loaded on every route — the
single largest tax in the app.

- Rebuild `Sidebar`, `TopBar`, `PageHeader`, `Breadcrumb` as server components
- Isolate genuinely interactive pieces (menu, theme toggle, notification bell,
  command palette) as small client islands
- Navigation config becomes typed data, not JSX
- Skip link, landmarks, focus-on-route-change
- Mark `Shell.tsx`, `ShellClient.tsx`, `ShellNavIcon.tsx` for retirement

Acceptance: shared chunk drops measurably; shell fully keyboard operable; every
route inherits the improvement.

---

### T-011 · `/dashboard`
`status: todo` · `est: 5h` · `blocked-by: T-010`

`DashboardView.tsx` is 45 KB. KPI tiles, charts, and activity become server
components; charts get accessible data tables; `<Suspense>` per widget.

---

### T-012 · `/operations`
`status: todo` · `est: 6h` · `blocked-by: T-010`

`page.tsx` is 79 KB of route file — the clearest violation of WEB-001 §2 in the
repository. Becomes a ≤ 40-line page composing a server-rendered board, with
filters and tabs moved to `searchParams`.

---

## LATER

| Task | Target | Why |
| --- | --- | --- |
| T-020 | `/factories` list + `/factories/[id]` + `/factories/cr/[id]` | 45–49 KB each |
| T-021 | `/planning` + `/planning/bulk` + `/planning/single` | 41 KB + 53 KB `ReviewClient` + 34 KB `Wizard` |
| T-022 | `/reviews/[id]`, `/visits`, `/visits/[id]` | 40–46 KB each |
| T-023 | `/field` home, `/field/my-tasks`, `/field/[visitId]` | `Startup.tsx` 85 KB; strictest perf budget |
| T-024 | `/field/inspection/[id]` | `Workspace.tsx` **136 KB** — the largest single file; split last, after every primitive exists |
| T-025 | `/admin/*` | packages 46 KB, regulations 36 KB, violations 34 KB, access 27 KB |
| T-026 | `/compliance`, `/execution`, `/analytics` — `/enforcement-library` done 2026-08-08 (page 410 → 25 lines, `features/enforcement/` + `components/enforcement/`) | |
| T-030 | Dynamic-import `mapbox-gl`, `leaflet`, `three`, `twilio-video` | remove from shared chunk |
| T-031 | Font weight audit — drop unused Arabic weights | ~45 KB each |
| T-032 | Legacy CSS sweep — delete orphaned rules from `saqeel-runtime.css` (170 KB) and `saqeel-components.css` (50 KB) | runs continuously, closed out here |
| T-033 | Cache posture pass — declare and tag every query | WEB-001 §5 |
| T-034 | Delete every file that has cleared its retirement gate | WEB-006 §4 |

---

## PARKED

Ideas discovered mid-task go here and are left alone until their proper turn.
Pull one in only if it is genuinely part of doing the active task well.

- **`gate:one-stylesheet`** — fail CI on any new `.module.css` under
  `apps/web/src`, on any `--sqx-*` or `.sqx-*` declaration outside
  `saqeel.css`, and on any `dir()` / `[dir]` rule outside the two direction rules
  in `saqeel.css`. Belongs with T-000.
- **`gate:one-prefix`** — the legacy sheets own 804 `.sq-*` class hits and seven
  live `--sq-nav-*` / `--sq-map-*` custom properties. Once T-032 clears them, a
  gate should stop `--sq-` coming back so a future rename to the shorter prefix
  stays possible.
- **`@layer` the legacy sheets.** `saqeel-runtime.css`, `saqeel-components.css`
  and `v2-components.css` are unlayered, so they outrank everything in
  `saqeel.css` regardless of order. Wrapping them in a `legacy` layer declared
  *before* `saqeel.*` would invert that and let migrated screens win without
  specificity games. Cheap, high leverage, but it changes cascade behaviour app
  wide — it needs its own task and its own visual regression pass.
- **Base-layer reset scope.** `sqx.base` resets margins on `h5 h6 figure
  blockquote dl dd ol ul` and sets `img/svg/video { display: block }` globally.
  Legacy screens zero those per class rather than globally, so the reset is new
  behaviour for any element the legacy sheets miss. Verified against the built
  app; if a screen is ever found to depend on a UA default, the fix is that
  screen, not the reset.
- **Chart series 7 and 8** are `--sqx-neon-steel-deep` / `--sqx-neon-sky`,
  primitives added to satisfy the eight-series chart scale. They are the only
  primitives in `saqeel.css` not named in the T-002 brief.
- **`--sqx-ease-linear`** exists solely so seamless looping gradients do not
  have to write the `linear` keyword inline. Delete it if a future motion pass
  removes the looping gradients.
- **`ThemeScript` cannot see `prefers-color-scheme`.** WEB-002/T-004 asked for
  resolution order stored → `prefers-color-scheme` → dark, but `ThemeScript.tsx`
  was outside T-004's editable file list. The toggle works around it by writing
  a resolved value to the `saqeel-theme` key that `ThemeScript` already reads, so
  first paint never flashes. A proper fix edits `ThemeScript` to read the media
  query itself, and must keep `ThemeChannelSync` and the toggle in agreement —
  all three encode the same fallback today.
- **Three preserved topbar controls have no home in the shell brief.** Locale
  toggle, date/region scope and the ⌘K admin palette exist in `ShellClient` and
  would have been deleted by building only the files T-004 listed. They were
  rebuilt as islands under `shell-topbar/`. If the product wants them gone, that
  is a product decision and its own task — not a side effect of a refactor.
- **Shell island count is 8, not the brief's 5.** See the T-004 record. Getting
  to 5 means deleting the three controls above.
- **`e2e/ui-compliance-runtime.spec.ts` pins `main#main-content`.** T-004's brief
  asked for `<main id="main">`; the id was kept as `main-content` so three
  existing assertions stay green. Renaming it is a cross-cutting change that
  needs the e2e file in scope.
- **`a { color: var(--text-link) }` in `saqeel-components.css:15` is unlayered
  and beats every cascade layer.** It repainted every anchor in the new shell
  legacy-blue. `.sqx-shell*` had to be moved **out** of `@layer sqx.components`
  to compete on specificity. This is the first time the "legacy outranks
  `saqeel.css`" property caused a defect rather than preventing one, and it will
  recur on every migrated screen that renders a link. Two clean fixes, both
  already parked: delete that one declaration from the frozen sheet, or wrap the
  legacy sheets in a `legacy` layer declared before `sqx.*`. Either lets the
  shell move back inside the layer. **Until then, check any new `.sqx-*` rule
  that sets `color` on an anchor.**
- **`--sqx-surface-accent` is invisible on `--sqx-gradient-chrome`.** In dark it
  is `#0A2416` and the chrome's top stop is `#0A2A18` — 1.02:1. T-004's first
  cut used it for the active nav fill and the indicator effectively did not
  exist. Anything placed on the chrome gradient must have its separation
  measured against **all three** stops, not against `--sqx-surface-default`.
  Fixed by `--sqx-nav-active-bg` / `--sqx-nav-group-bg`; the same trap is waiting
  for any future chrome element.
- **`.sq-pagehead` is `position: sticky` inside the scrolling `main`.** The new
  shell had to reproduce that scroll model exactly (`.sqx-shell__main` owns
  `overflow-y`, topbar is a flex sibling above it, not sticky) or every one of
  the 55 pages still using the legacy `Shell` frame would have had two elements
  stuck to the viewport top. Keep this in mind for T-007.

---

## BLOCKED

- **The app will not run on this workstation.** Windows Application Control
  blocks Next.js's native compiler:

  ```
  ⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred:
    An Application Control policy has blocked this file.
    apps\web\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
  ```

  `next dev` starts, then serves nothing. `next build` hangs. Consequences: no
  browser verification, no e2e, no axe, no Lighthouse, no bundle numbers. Every
  task is limited to static verification, and WEB-006 §3's "exercised by hand in
  the running dev server" and WEB-003 §10's manual checklist cannot be satisfied
  by anyone working on this machine. Not a code problem — it needs the binary
  allowlisted, or a WASM-compiler fallback accepted for local work. **This blocks
  the Definition of Done for every task from T-000 onward.**

---

## The 48-hour demonstration path

If the objective is to show the manager what this becomes, the shortest
credible story is **T-000 → T-001 → T-002 → T-003 → T-010 → T-012**:

> a rulebook enforced by CI · a design system you can browse · a shell that
> ships a fraction of the JavaScript · and one flagship screen rebuilt on it,
> with before-and-after numbers and an accessibility report.

That is a system with evidence, not a repainted page.

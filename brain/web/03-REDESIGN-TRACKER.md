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

### T-002 · Core primitives: surface, layout, status
`status: todo` · `rules: WEB-002, WEB-003` · `est: 5h` · `blocked-by: T-001`

The reusable vocabulary every later screen is built from. CSS Modules, tokens
only, server components, closed variant APIs, no `className` escape hatch.

- `surface/` — `Card`, `Panel`, `Section`, `SectionHeader`, `Divider`
- `surface/` layout — `Stack`, `Cluster`, `Grid` (the only sources of spacing)
- `data/StatusPill` — the ten canonical roles, text plus shape
- `inputs/Switch` (Toggle) — full APG keyboard and labelling contract
- `actions/Button`, `actions/IconButton` — rebuilt to the primitive contract
- `data/KpiTile`, `feedback/EmptyState`, `feedback/Skeleton` — rebuilt

Acceptance: each primitive under 200 lines, axe-clean, correct in dark and RTL,
ledger rows written.

---

### T-003 · Reference route — the showcase
`status: todo` · `rules: WEB-002 §9` · `est: 2h` · `blocked-by: T-002`

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
| T-026 | `/compliance`, `/execution`, `/analytics`, `/enforcement-library` | |
| T-030 | Dynamic-import `mapbox-gl`, `leaflet`, `three`, `twilio-video` | remove from shared chunk |
| T-031 | Font weight audit — drop unused Arabic weights | ~45 KB each |
| T-032 | Legacy CSS sweep — delete orphaned rules from `saqeel-runtime.css` (170 KB) and `saqeel-components.css` (50 KB) | runs continuously, closed out here |
| T-033 | Cache posture pass — declare and tag every query | WEB-001 §5 |
| T-034 | Delete every file that has cleared its retirement gate | WEB-006 §4 |

---

## PARKED

Ideas discovered mid-task go here and are left alone until their proper turn.
Pull one in only if it is genuinely part of doing the active task well.

- _(empty)_

---

## BLOCKED

- _(empty)_

---

## The 48-hour demonstration path

If the objective is to show the manager what this becomes, the shortest
credible story is **T-000 → T-001 → T-002 → T-003 → T-010 → T-012**:

> a rulebook enforced by CI · a design system you can browse · a shell that
> ships a fraction of the JavaScript · and one flagship screen rebuilt on it,
> with before-and-after numbers and an accessibility report.

That is a system with evidence, not a repainted page.

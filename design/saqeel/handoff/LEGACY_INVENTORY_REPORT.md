# RETIRED PREDECESSOR → SAQEEL Inventory Report (§2)

Generated 2026-07-20 on branch `feat/saqeel-design-system` (base `setup/Inspection`).
No code changed for this report. Cross-checked against `RETIRED PREDECESSOR_MIGRATION_TEMPLATE.md`.

## 1. `--legacy-*` token consumers

Total `var(--legacy-*)` references in `apps/web/src`: **1996**.

Top files:

| Refs | File |
|---|---|
| 697 | src/app/retired-predecessor.css |
| 233 | src/app/login/login.css *(OUT OF SCOPE — Cinematic Atlas exception)* |
| 68 | src/app/planning/bulk/review/review.css |
| 55 | src/app/dashboard/dashboard.module.css |
| 38 | src/app/field/[visitId]/Startup.tsx |
| 38 | src/app/admin/packages/packages.module.css |
| 33 | src/app/tokens.css |
| 32 | src/app/planning/bulk/review/ReviewClient.tsx |
| 31 | src/app/field/inspection/[id]/Workspace.tsx |
| 25 | src/components/field/FieldHome.tsx |
| 25 | src/app/admin/regulations/Controls.tsx |
| 24 | src/app/planning/single/Wizard.tsx |
| 24 | src/app/field/factory-360/[id]/field-factory360.module.css |
| 23 | src/app/reports/report.css |
| 23 | src/app/factories/cr/[id]/factory360.module.css |

Token families to rename per migration map §"Token mapping": colour/surface/text/border,
status (4→10 roles), focus-ring (box-shadow→outline), fonts, type scale, spacing
(`--legacy-space-*`→`--space-*`), radius (4/6/8→2/3/4/6), shadow, motion, shell widths, z-index.
`--legacy-color-atlas-*` / `prism-*` **retained** (login exception).

## 2. `.legacy-*` class consumers

Total `.legacy-*` class-ish references in `.tsx`/`.ts`: **3537**.
CSS files carrying `.legacy-*` rule definitions: **3** (retired-predecessor.css, login.css [out-of-scope], plus module scoped).
Distinct files consuming `legacy-` (token or class): **193**.

Top classes: legacy-caption(692), legacy-field(533), legacy-lozenge(407), legacy-numeric(369),
legacy-surface(330), legacy-btn(297), legacy-row(249), legacy-space-150(218), legacy-space-300(213),
legacy-input(213), legacy-banner(201), legacy-space-200(156), legacy-stack(153),
legacy-lozenge--success(143)/--warning(132)/--info(132)/--critical(83),
legacy-link(91), legacy-btn--secondary(86)/--prominent(77)/--subtle(67), legacy-select(68), legacy-state(64).

## 3. Fonts (layout.tsx, next/font/local, self-hosted)

- **retired input font** 400/500/600/700 — `--font-grotesk` → **RETIRE** (PR12).
- **IBM Plex Sans Arabic** 400/500/600/700 (+arabic subset) — currently applied to English too → **SPLIT**: Arabic-only.
- **retired mono font** — `--font-mono` → **RETIRE**, replace with **IBM Plex Mono** (identifiers only).
- **ADD**: IBM Plex Sans (Latin) 400/500/600/700 for English body; IBM Plex Mono 400/500.

## 4. Design-contract Playwright specs (must be rewritten in PR1)

Present in `apps/web/e2e/`:
- `design-foundation-contract.spec.ts`
- `platform-design-system-contract.spec.ts`
- `ui-compliance-contract.spec.ts` (+ `ui-compliance-runtime.spec.ts`)
- `inspector-shell-visual.spec.ts` (repo equivalent of the prompt's `inspector-shell-uplift`)
- adjacent: `shell-visual-evidence.spec.ts`, `shell-navigation.spec.ts`, `a11y-table-scope-contract.spec.ts`, `a11y-form-label-contract.spec.ts`.

These read `retired-predecessor.css`/`tokens.css` directly and MUST assert SAQEEL tokens from PR1 or CI blocks.

## 5. Mapped / Out-of-scope / UNMAPPED

**MAPPED** — every `.legacy-*` family + React component has a target SAQEEL component
(see `RETIRED PREDECESSOR_MIGRATION_TEMPLATE.md` Component mapping table, all 40 rows resolved).
All four previously-open gaps (SyncIndicator, Alert `immutable`, DiffView/ConflictResolver,
field-density profile) are **DONE** in the design package.

**OUT OF SCOPE** (do not migrate, retain as-is):
- `src/app/login/*` — Cinematic Atlas / SaqeelHero / login.css (approved standalone exception; `--legacy-color-atlas-*`/`prism-*` tokens fixed).
- Legacy packs: `design/retired-predecessor/`, `saqeel-retired-predecessor.css`, `outputs/cd-*` styling packs, `MIM_Inspection_Meta_retired predecessor_Fable_Pack` — die with retired predecessor at PR12, not migrated.

**UNMAPPED / ESCALATE TO CLAUDE DESIGN:** none identified in this pass. Any token,
state, component, or Arabic treatment discovered mid-migration without a package
decision will be recorded here and escalated, not invented.

## 6. Scale summary

~193 files, ~1996 token refs + ~3537 class refs. Executed as the §3 13-PR sequence,
one PR per step, tokens-only, zero behaviour change, zero-trace gate at PR12.

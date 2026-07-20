# ASTRYX → SAQEEL Inventory Report (§2)

Generated 2026-07-20 on branch `feat/saqeel-design-system` (base `setup/Inspection`).
No code changed for this report. Cross-checked against `ASTRYX_MIGRATION_TEMPLATE.md`.

## 1. `--ax-*` token consumers

Total `var(--ax-*)` references in `apps/web/src`: **1996**.

Top files:

| Refs | File |
|---|---|
| 697 | src/app/astryx.css |
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
(`--ax-space-*`→`--space-*`), radius (4/6/8→2/3/4/6), shadow, motion, shell widths, z-index.
`--ax-color-atlas-*` / `prism-*` **retained** (login exception).

## 2. `.ax-*` class consumers

Total `.ax-*` class-ish references in `.tsx`/`.ts`: **3537**.
CSS files carrying `.ax-*` rule definitions: **3** (astryx.css, login.css [out-of-scope], plus module scoped).
Distinct files consuming `ax-` (token or class): **193**.

Top classes: ax-caption(692), ax-field(533), ax-lozenge(407), ax-numeric(369),
ax-surface(330), ax-btn(297), ax-row(249), ax-space-150(218), ax-space-300(213),
ax-input(213), ax-banner(201), ax-space-200(156), ax-stack(153),
ax-lozenge--success(143)/--warning(132)/--info(132)/--critical(83),
ax-link(91), ax-btn--secondary(86)/--prominent(77)/--subtle(67), ax-select(68), ax-state(64).

## 3. Fonts (layout.tsx, next/font/local, self-hosted)

- **Space Grotesk** 400/500/600/700 — `--font-grotesk` → **RETIRE** (PR12).
- **IBM Plex Sans Arabic** 400/500/600/700 (+arabic subset) — currently applied to English too → **SPLIT**: Arabic-only.
- **JetBrains Mono** — `--font-mono` → **RETIRE**, replace with **IBM Plex Mono** (identifiers only).
- **ADD**: IBM Plex Sans (Latin) 400/500/600/700 for English body; IBM Plex Mono 400/500.

## 4. Design-contract Playwright specs (must be rewritten in PR1)

Present in `apps/web/e2e/`:
- `design-foundation-contract.spec.ts`
- `platform-design-system-contract.spec.ts`
- `ui-compliance-contract.spec.ts` (+ `ui-compliance-runtime.spec.ts`)
- `inspector-shell-visual.spec.ts` (repo equivalent of the prompt's `inspector-shell-uplift`)
- adjacent: `shell-visual-evidence.spec.ts`, `shell-navigation.spec.ts`, `a11y-table-scope-contract.spec.ts`, `a11y-form-label-contract.spec.ts`.

These read `astryx.css`/`tokens.css` directly and MUST assert SAQEEL tokens from PR1 or CI blocks.

## 5. Mapped / Out-of-scope / UNMAPPED

**MAPPED** — every `.ax-*` family + React component has a target SAQEEL component
(see `ASTRYX_MIGRATION_TEMPLATE.md` Component mapping table, all 40 rows resolved).
All four previously-open gaps (SyncIndicator, Alert `immutable`, DiffView/ConflictResolver,
field-density profile) are **DONE** in the design package.

**OUT OF SCOPE** (do not migrate, retain as-is):
- `src/app/login/*` — Cinematic Atlas / SaqeelHero / login.css (approved standalone exception; `--ax-color-atlas-*`/`prism-*` tokens fixed).
- Legacy packs: `design/astryx/`, `saqeel-astryx.css`, `outputs/cd-*` styling packs, `MIM_Inspection_Meta_Astryx_Fable_Pack` — die with Astryx at PR12, not migrated.

**UNMAPPED / ESCALATE TO CLAUDE DESIGN:** none identified in this pass. Any token,
state, component, or Arabic treatment discovered mid-migration without a package
decision will be recorded here and escalated, not invented.

## 6. Scale summary

~193 files, ~1996 token refs + ~3537 class refs. Executed as the §3 13-PR sequence,
one PR per step, tokens-only, zero behaviour change, zero-trace gate at PR12.

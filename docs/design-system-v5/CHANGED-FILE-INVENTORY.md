# Changed File Inventory — Saqeel V5.1 (this branch so far)

18 files, +605/-75, across commits `ac3609d`, `41c338b`, `cb0cdf0`, `200892a`.

## New files
- `apps/web/scripts/check-design-system-v5.mjs` — V1-regression guardrail (Wave 1 §5.3).
- `apps/web/scripts/verify-dates.mjs` — boundary-condition checks for the date service.
- `apps/web/src/lib/dates.ts` — governed Riyadh/Gregorian date formatting (Wave 3).
- `apps/web/src/components/Modal.tsx` — accessible modal primitive (Wave 2).
- `apps/web/src/components/Tabs.tsx` — accessible WAI-ARIA tabs primitive (Wave 2).

## Modified — tokens/CSS (Wave 1)
- `apps/web/src/app/tokens.css` — full swap to the V5.1 token set (dark primary green not blue, `--ax-color-border-control`, `--ax-color-link`, `--ax-text-label`/`--ax-text-action`/`--ax-text-metric`, `--ax-radius-input` 12px→6px, density ladder, sticky offsets, tonal field surface).
- `apps/web/src/app/astryx.css` — field label / button / segmented / tabs / pagination / ribbon typography moved off 16px body-strong onto the new 14/20 label/action tokens; loading buttons keep their label visible instead of `color:transparent`; `.ax-search` renders one canonical SVG-masked glyph instead of a generated `⌕` character; new opt-in `.ax-density-admin`/`.ax-density-compact` wrapper classes.
- `apps/web/src/app/icons.tsx` — added `IconClose` (used by `Modal.tsx`).
- `apps/web/package.json` — added `check:design-system-v5` and `verify:dates` scripts.

## Modified — date-service adoption (Wave 3)
- `apps/web/src/app/reports/inspection/[id]/page.tsx` — official report `dt()`/`d10()`.
- `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/DashboardView.tsx` — refresh timestamp, GPS-override and audit-timeline columns.
- `apps/web/src/app/factories/cr/[id]/page.tsx`, `apps/web/src/app/field/factory-360/[id]/page.tsx` — dossier `dt()` (also fixed a real Hijri-calendar-default bug on the Arabic locale path).
- `apps/web/src/app/factories/[id]/page.tsx` — 14 display sites (legacy factory dossier); left the two `today`/`soon` ISO-string comparison values untouched (not display text).
- `apps/web/src/app/visits/[id]/page.tsx` — 7 sites, consolidated onto the existing local `fmt()` helper.
- `apps/web/src/app/operations/page.tsx` — 5 sites; left `nowIso` untouched (seeds a client component's live counter, not directly rendered).
- `apps/web/src/app/reviews/[id]/page.tsx` — 4 sites.

## Explicitly NOT changed (and why)
- Any `*/actions.ts` server action file flagged by the guardrail — these write ISO date strings to Postgres date columns; that's the correct format for a DB write, not a display bug. Each needs individual triage before touching (tracked, not fixed blind).
- `SignaturePad.tsx`, `Workspace.tsx`, `FactoryVerification.tsx`, `ImageAnnotator.tsx` raw `.ax-modal` markup — not migrated to the new `Modal.tsx` primitive yet. `SignaturePad.tsx` in particular is a governed signature-capture flow; deferred rather than risked under time pressure.
- `EmptyState.tsx`'s `glyph` prop and its ~86 emoji call sites — a deliberate per-context illustration slot, not touched. Migrating it to named SVG icons is real, valuable, but sizable work (needs an icon per distinct glyph plus 86 call-site updates); tracked as a follow-up rather than rushed.
- Wave 4 (shell/navigation), and the remainder of Waves 5–8 (iPad, admin, report/print structural rebuild) — not started this session.

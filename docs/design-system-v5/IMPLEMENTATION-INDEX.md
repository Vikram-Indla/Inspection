# Saqeel V5.1 Implementation Index

Governed by `product-contract/governance/CC-SAQEEL-V5-IMPLEMENTATION-001.yaml` and
`product-contract/execution/CURRENT_SLICE.SAQEEL-V5-IMPLEMENTATION.yaml`.
Branch: `feature/saqeel-v5-implementation`, base `setup/Inspection@594fd87`.
Design source: `design/saqeel-v5-final/` (`v2/CLAUDE-CODE-IMPLEMENTATION-PROMPT.md`).

| Wave | Scope | Status | Commits |
|---|---|---|---|
| 0 | Discovery / baseline audit | Done (folded into Wave 1 commit + this index; no separate screenshot set — see [BASELINE-AUDIT.md](BASELINE-AUDIT.md)) | ac3609d |
| 1 | Canonical tokens + core component fixes + guardrail script | Done | ac3609d |
| 2 | Shared accessible Modal + Tabs primitives | Done (partial adoption — see [COMPONENT-MIGRATION-MATRIX.md](COMPONENT-MIGRATION-MATRIX.md)) | 41c338b |
| 3 | Governed Riyadh date service + hot-spot sweep | Partial — service built, 8 files / ~34 display sites converted, ~64 remaining tracked | cb0cdf0, 200892a |
| 4 | Premium shell / navigation | Not started | — |
| 5 | Web operations pages (full sweep) | Not started beyond the Wave 3 date fixes already landed on factories/[id], visits/[id], operations, reviews/[id], dashboard, factories/cr/[id], field/factory-360/[id], reports/inspection/[id] | — |
| 6 | iPad/field experience | Not started | — |
| 7 | Administration surfaces | Not started | — |
| 8 | Official report and print | Not started beyond the Wave 3 dt()/d10() date fix on reports/inspection/[id]/page.tsx | — |

## Files changed so far
See `git log --stat adc5854..HEAD` on this branch, or [CHANGED-FILE-INVENTORY.md](CHANGED-FILE-INVENTORY.md).

## Verification performed at each checkpoint
- `npm run typecheck` (tsc --noEmit) — clean after every commit.
- `npm run build` (production Next.js build, all ~80 routes) — clean, run after the Wave 3 checkpoint to confirm the token/component changes don't regress any route app-wide.
- `node scripts/check-design-system-v5.mjs` — guardrail script tracking V1 regressions; baseline went 305 → 180 → 150 findings across the three code commits (not zero — remaining findings are real, tracked work, not hidden).
- `node scripts/verify-dates.mjs` — 16/16 boundary-condition checks for the new date service (Riyadh midnight rollover, DST-safe day-diff, day-month-year ordering, overdue/due-today wording).
- Dev server smoke check (`npm run dev`, port 3001) — `/login`, `/dashboard`, `/factories/1`, `/visits/1`, `/operations`, `/reviews/1` all return 200/307 (auth redirect), no server errors in the log, and the served CSS was fetched and grepped to confirm the new tokens (`#64C2A1` dark primary, `--ax-text-action`/`--ax-text-label`) are actually in the bundle the browser receives — not just present in source.

## Honest status
`SAQEEL V5 IMPLEMENTATION CONDITIONALLY COMPLETE — LISTED BLOCKERS REMAIN`.
See [FINAL-IMPLEMENTATION-REPORT.md](FINAL-IMPLEMENTATION-REPORT.md) for the full account and what's left.

# CD-012 → CD-019 R2 — Frontend design-to-live wiring record

Branch `feat/cd-012-019-admin-frontend` · base commit `0c9c897`
(worktree `Inspection-cd-012-019`). Frontend only — no `actions.ts`, migrations,
or shared backend contracts touched (Codex's lane, per coordination note).

Verification level: `tsc --noEmit` clean on every slice + GLOBAL COLOR LAW grep
clean (design-system tokens only). **Runtime not driven** — this worktree has no
Supabase env / test DB, so live behavior against `/admin/*` is unverified. Each
row below is DESIGN-TO-LIVE INTENT, not runtime evidence; an independent runtime
wiring audit (DEC-012) is still required before acceptance.

| Screen | Route | Change | Server action / read (unchanged) | Truth class | Verified |
|---|---|---|---|---|---|
| CD-012 | `/admin/workflows` | Separation-of-duties guard: maker of a draft sees an explanation instead of an Approve button | `approvePublishWorkflow` (DB rejects self-approval, RBAC-002) | STATED_BY_CORRECTION → wired to existing | tsc only |
| CD-013 | `/admin/workflows` | Quarantined designer lane as honest `NotYetBoundary`; payload editor kept as the real editor | `saveWorkflowDraft` | designer lane = NEEDS_APPROVED_CONTRACT | tsc only |
| CD-014 | `/admin/risk` | Client `RiskForm`: live weights-sum + Save-disable, per-factor bars, band strip, **save result surfaced** (was discarded), empty state | `saveRiskSettings` (wrapped for `useActionState`, signature unchanged) | STATED_BY_CORRECTION → wired | tsc only |
| CD-014 | `/admin/risk` | Per-factory "why this score" trace = `NotYetBoundary` (this screen reads the model, not factory scoring inputs) | — | NEEDS_FACTORY_SCORING_INPUTS | n/a |
| CD-015 | `/admin/gis` | **No change** — existing `GisStudio` already realizes the present-truth (GIS-owned official coords FND-007, `updateGeofenceRadius` + RLS, real map, defaults read-only). Design's 25–500 m range NOT added (un-sourced geofence value — no-invent) | `updateGeofenceRadius` | already conformant | prior |
| CD-016 | (none) | **No route by design** — "no approved route exists" is the honest state. No fake screen built; CD-004 admin home left untouched | — | HANDOFF_BLOCKED_ROUTE | n/a |
| CD-017 | `/admin/access` | RLS-scope note + two `NotYetBoundary` (effective-access explainer; role-change workflow). Read-only holdings kept | `profiles` + `roles` read | explainer/change = NEEDS_APPROVED_CONTRACT | tsc only |
| CD-018 | `/admin/localization` | Table → `lz-row` source/AR/status split; live placeholder-integrity (Save disabled on `{{token}}` mismatch); AR-length risk; orphan note; history/restore restyled | `saveTranslation` / `markReviewed` / `addKey` / `syncFromCode` / `getHistory` / `restoreRevision` | STATED_BY_CORRECTION → wired (priority slice) | tsc only |
| CD-019 | `/admin/audit` | RLS-scope note + two `NotYetBoundary` (correlation view; sensitive reveal/export). Reader kept (already exceeds fixture — exact count retained) | `audit_events` read | reader wired; corr/export = NEEDS_APPROVED_CONTRACT / BLOCKED_BY_DECISION | tsc only |

## Integrity decisions (what was deliberately NOT done)

- **Design-harness chrome dropped**: fixture watermark, truth-tier legend, and the
  screen/theme/lang/width switcher are design-review scaffolding, not product.
- **No fabricated signals**: CD-018 "source-drift" banner (schema carries no
  signal distinguishing EN-drift from an ordinary draft) and CD-019 "totals not
  computed" caveat (the real reader computes an exact count — omitting it would
  weaken accepted behavior) were both refused.
- **No invented policy values**: CD-015 radius range 25–500 m left out.
- **No fake routes / no fake controls**: CD-016 has no route; every blocked
  capability is an honest "Not available yet" boundary, never a disabled feature.

## Shared additions

- `apps/web/src/components/NotYetBoundary.tsx` — reusable honest-boundary component (CD-013/014/016/017/019).
- `apps/web/src/app/retired-predecessor.css` — `.lz-*` (CD-018), `.nya` (boundary), `.rk-*` (CD-014); design-system tokens only.

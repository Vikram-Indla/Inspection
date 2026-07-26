# Design Delta Consent — SAQEEL Profile (pilot)

## Why this page was picked as the pilot
Selected over Field Login (explicitly not auto-picked) and over other
CLOSE MATCH candidates (Cases, Committee, Portal, Tasks — all similarly
bounded) because it produced the **cleanest possible proof of the full
workflow**: single route, single file, backend already real
(`delta_class: CURRENT_BACKEND_PRESERVED_NEW_FRONTEND`), zero overlap with
the two other active lanes in this repository right now (Codex's
`SAQEEL-DSYNC-001` web/admin convergence discovery, and the Product-Owner
`WA-P1-M2-BATCH-002` Planning/Visits batch), and a delta small enough to
review end-to-end in one pass rather than needing to trust a summary.

## Identity
- Design page: `SAQEEL Profile.dc.html`, project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`
- Governed design ID: `WA-DES-038`
- Observed revision (etag): `1784806070831883`
- Accepted baseline: **none exists** — this would be the first acceptance event for this page under a design-sync workflow (the `DESIGN_ROUTE_MAP.csv` row records it as planning evidence, not a consent/acceptance record)
- Mapped route/files: `/profile` → `apps/web/src/app/(app)/profile/page.tsx`

## Exact delta (full detail in `deltas/WA-DES-038/1784806070831883/delta.md`)
One finding: the design page's RTL row layout for Latin-script values (name,
email, dates, role keys) does not show the `<bdi dir="ltr">` wrapping the
shipped code uses to fix a known value/label-reordering bug in
Arabic/RTL rendering. Every other difference between design and code is
**NO ACTION** — code is already correct, and in the notification/push area,
more complete than the static mockup can represent (real permission states:
enabling/enabled/unsupported/denied).

## Proposed action for each delta item
| Item | Proposed action |
|---|---|
| RTL `bdi/dir=ltr` convention not shown in design | **DESIGN MUST CHANGE** — update `SAQEEL Profile.dc.html` in Claude Design to wrap Latin-script row values consistently, so the design stops depicting the pre-fix layout as canonical |
| All other items (fixture data, theme/language toggles, notification wiring, push states, session claims, sign-out element) | **NO ACTION** — code already correct |

## Design changes proposed
One: align the RTL value-wrapping pattern in the Claude Design page to match shipped code. **Not applied this session** — would be a write to the live Claude Design project, outside this session's read-only mandate; requires your explicit go-ahead below.

## Code changes proposed
**None.**

## Wiring changes proposed
**None.**

## Unsupported requirements
None found for this page.

## Risks
- The design edit, if approved, is cosmetic-only to the Claude Design project and touches no application code, no backend, no RLS — lowest possible risk tier.
- Not runtime-verified (no Playwright run this pass) — the delta above is a static source comparison. If you want a "prove the complete workflow" result with runtime evidence, that would need a follow-up pass with browser verification, still without touching app code.

## Test plan (if a future pass adds runtime verification)
- `pnpm -C apps/web typecheck` / existing build (page already ships, no code change proposed so no new test surface)
- Manual/Playwright render of `/profile` in EN/LTR and AR/RTL to visually confirm the `bdi` pattern the code already uses

## Rollback approach
N/A for code (no code change proposed). For the design edit: Claude Design retains edit history in-app; revert is a normal design-tool undo, not a Git operation.

## Decision
- [x] APPROVED the design-only correction (update `SAQEEL Profile.dc.html` RTL pattern)
- [ ] REJECT — leave design as-is, log the known variance and move on
- [ ] Decide later

Approver: Vikram Indla (via explicit chat approval, 2026-07-24)
Timestamp: 2026-07-24
Decision record: Applied via `mcp__claude-design__write_files` (project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`, path `SAQEEL Profile.dc.html`), `if_match` on prior etag `1784806070831883` — confirmed unchanged at write time via `finalize_plan`'s `base_etags`, so no concurrent-edit conflict occurred. New etag after write: `1784896277489148`. Change: all six Latin-script/numeric row values (Name, Email, Region, Roles, Session started, Session expires) changed from `<span dir="ltr">`/`<span class="id-code" dir="ltr">` to `<bdi dir="ltr">`/`<bdi class="id-code" dir="ltr">`, matching the shipped code's isolation pattern. No other content, layout, or structure changed. No `/consent` skill exists in this install (confirmed in `reports/claude-capability-audit.md`); this file plus the state record below is the consent/decision record for now.

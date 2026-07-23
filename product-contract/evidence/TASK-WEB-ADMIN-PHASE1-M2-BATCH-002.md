# WA-P1-M2-BATCH-002 correction and approval evidence

- Task: `TASK-WEB-ADMIN-PHASE1-M2-BATCH-002`
- Change control: `CC-WEB-ADMIN-PHASE1-001`
- Screens: Planning landing, Planning Visits list, Planning Visit details
- Review routes: `/planning?wa_preview=1`, `/planning/visits?wa_preview=1`, `/planning/visits/:id?wa_preview=1`
- Designs: `WA-DES-036`, `WA-DES-045`, and shell authority `WA-SHELL-SRC-001`
- Requirements: `CR-001..CR-098`; acceptance: `WA-M2-AC-001..006`, `WA-SHELL-AC-002`, `WA-SHELL-AC-013`
- Implementation commit: `8343c62c`

## Rework delivered

The rejected review was corrected without deleting or replacing current routes.
Placeholder method glyphs were replaced with coherent SVG icons; the shell AI
entry now uses the approved sparkle treatment; Planning method spacing is compact;
input focus no longer renders an offset double border; replacement links do not
use underlined directional-arrow styling; the desktop navigation rail remains
fixed; and Visit details use a main scroll column with a sticky, height-bounded
management-action form.

The replacement remains doubly gated by `SAQEEL_M2_PREVIEW=enabled` and
`wa_preview=1`. Canonical `/visits/**` implementations remain active and retained.
Rollback is to disable the preview routes or revert `8343c62c`.

## Verification and live review — 2026-07-23

- Typecheck: PASS.
- Production build: PASS.
- Pinned preview-enabled focused plus protected M2 Playwright: 19/19 PASS.
- Final focused post-link correction: 8/8 PASS.
- Covered route/permission negatives, governed actions, RLS scope, immutable
  versions, append-only audit, Arabic RTL, 390px reflow, keyboard semantics and
  axe accessibility with zero violations.
- Web/Admin validator: PASS — 478/478 uniquely dispositioned requirements,
  71 Phase 1 routes, five deferred Field routes, and 46/45 design identity.
- Visible Codex browser walkthrough: PASS for all three review routes using the
  planner persona and safe RLS-scoped data. No mutation was performed.
- Live geometry at the review viewport: fixed navigation; Planning cards
  `330x132`; Visit detail workspace `622px + 380px`; action rail sticky at `84px`
  with bounded internal overflow; zero underlined replacement links and zero
  directional-arrow buttons.

## Boundaries and approval state

No Field/iPad/PWA/offline work, remote DDL, deployment, provider activation,
shared-data mutation, canonical cutover, legacy deletion, push, or merge occurred.
No visual difference is self-approved. Status is
`SCREEN_BATCH_AWAITING_PRODUCT_OWNER_APPROVAL`.

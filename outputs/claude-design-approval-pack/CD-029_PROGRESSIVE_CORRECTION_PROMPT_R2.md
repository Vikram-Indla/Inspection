# Claude Design — CD-029 R2 Correction Prompt

Paste this complete prompt into Claude Design. Correct the existing CD-029 design package only. Do not implement application code.

## Hard boundary

`implementation_authorized: false`

Every Claude Code-facing file starts exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, data, tests, product contracts, Git history, branches or the dirty worktree.

## Read before changing the design

Read the CD-029 consolidated prompt, `CD-029_DESIGN_REVIEW_R2.md`, and the current runtime sources:

- `apps/web/src/app/reviews/[id]/page.tsx`
- `apps/web/src/app/reviews/[id]/StartReview.tsx`
- `apps/web/src/app/reviews/[id]/actions.ts`
- `apps/web/src/app/reviews/[id]/DecisionPanel.tsx`

The current truth replaces the old R1 premise:

- Opening `/reviews/:id` is read-only.
- For a submitted inspection with no open review, the reviewer explicitly chooses **Start review**.
- `startReview` inserts the review and then separately transitions the inspection to `under_review`. That sequence is non-atomic; it can leave a review created while the inspection transition fails. Mark and design this as `HANDOFF_BLOCKED_START_REVIEW_ATOMIC`.
- The decision sequence remains a separate review write, inspection transition and notification queue. It stays `HANDOFF_BLOCKED_ATOMIC`.
- Never present a row in notifications as delivered/received. Never invent a rollback, a provider-backed media viewer, claim/reassign path or support destination.

## Apply these corrections

1. Remove `HANDOFF_BLOCKED_PAGELOAD_MUTATION` and every assertion that merely opening the route creates a review or changes state.
2. Add a truthful explicit-start state and wiring leg:
   `offered Start review → server/RLS recheck → review recorded → inspection transition → partial failure or ready-to-decide`.
   Show that opening does not change anything and that an action can still fail after the review record exists.
3. Keep the decision partial-failure ladder distinct from the start-review partial-failure ladder.
4. Keep HYP-A Trace-chain-first, HYP-B Evidence-viewer-first and HYP-C Decision-rail-first as complete, visibly different, equal-fidelity 1440px compositions. Do not replace them with variations of the same layout.
5. Repair the section navigation. Each section must be an individually recognisable 48px-target control with separated label, count, selected state and visible keyboard focus; no concatenated labels/counts.
6. Supply populated evidence PNGs for all state-matrix rows, including reject-no-reason, stale/concurrent, unauthorized, missing-evidence, multi-critical and loading. Include complete Arabic/light and English/dark evidence across desktop, 1024 and 412px.
7. Preserve immutable versions, exact return scope + reason, reject reason, decided lock, audit trail, version diff, factory verification, degraded media, linked-source failure and the Finding Trace Chain list-equivalent/reduced-motion alternative.

## Deliver exactly one clean package

Create only `outputs/cd-029-r2/` with all R2 files and evidence. Include:

- both CD-029 HTML files;
- `cd29-stage.js`, `cd29-annot.js`, **`support.js`**;
- tokens, Astryx CSS and prism asset;
- manifest, component map, corrected wiring map, corrected state matrix, acceptance checklist, research provenance, future handoff/prompt, package inventory and every PNG;
- `PACKAGE_PREFLIGHT_CD-029.md`.

Every inventory/manifest/handoff path must point only to `outputs/cd-029-r2/`. No R1 path, stale revision, unrelated CD file, root duplicate or uploads folder is allowed.

Build a new archive with exactly one root directory: `outputs/cd-029-r2/`. It must contain no CD-001–028 artifacts.

## Mandatory preflight — do this before responding

In `PACKAGE_PREFLIGHT_CD-029.md`, record:

1. Archive listing proves only `outputs/cd-029-r2/` exists.
2. All local HTML/CSS/JS/SVG references resolve inside that folder, including `support.js`.
3. All governed files identify `CD-029`, `SCR-WEB-310`, and `R2` only.
4. A/B/C full-frame hashes are recorded and different.
5. Every state matrix row names an included PNG.
6. Arabic/light and English/dark desktop/1024/412 evidence is listed.
7. Future Claude Code files include the exact execution prohibition and `implementation_authorized: false`.
8. Page-load mutation is absent; explicit start-review atomicity and decision atomicity are accurately marked `HANDOFF_BLOCKED`.

Return only `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R2` when every check actually passes. Otherwise return `PACKAGE_PREFLIGHT_FAIL` with the exact failing path or state. Do not implement.

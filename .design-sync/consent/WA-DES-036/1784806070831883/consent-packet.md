# Design Delta Consent — SAQEEL Planning (WA-DES-036), bounded to Planning landing only

Orchestrated task: `TASK-WEB-ADMIN-PHASE1-M2-BATCH-002` / `CC-WEB-ADMIN-PHASE1-001`.
Full delta: `deltas/WA-DES-036/1784806070831883/delta.md`.

## Identity
- Design page: `SAQEEL Planning.dc.html`, project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`
- Observed revision (etag): `1784806070831883`
- Accepted baseline: none exists yet — this would be the first acceptance event for this page
- Mapped route: `/planning` (canonical, list-first) and `/planning?wa_preview=1` (design-comparable preview)
- Files: `apps/web/src/app/(app)/planning/page.tsx`, `apps/web/src/app/(app)/planning/PlanningPreview.tsx`

## Can the current implementation simply be accepted with no code change?

**Yes, for everything this delta actually examined.** Every code-side behavior
traced (RBAC gating, `expire_lapsed_visits`, `has_planning_capability`,
route guards, real data binding on the package/drafts banner, real
EmptyStates, real bilingual support) is already correct, already wired, and
in several places more complete than the design. **No wiring-required item
exists in this delta.** The only proposed changes are to the Claude Design
page, not application code.

## Proposed action per delta item

7 substantive `DESIGN CORRECTION` items (see full delta for all 16):
1. Remove the in-page tabbed-SPA depiction (Methods/Bulk/Single/Immediate/Plans as one switchable screen) — the real navigation is multi-route, settled, and the design should stop implying otherwise.
2. Add an artifact depicting the canonical list-first `/planning` surface (KPI tabs, filters, 22-column table) — currently has zero design representation despite being the default production route.
4. Depict the disabled/unauthorized state of the method cards.
6. Add a drafts-preview table to the Home/Methods screen (design currently shows only a count).
8. Add an Arabic/RTL variant for this page's content — currently English-only, inconsistent with other pages in the same project.
10. Depict unauthorized, data-unavailable, and empty-list states — currently the design has no non-happy-path states at all.
12. Correct or remove the Home-screen search placeholder — real search lives only on the canonical list route, not the Methods/Preview surface this placeholder implies.

2 optional/low-priority: banner's no-package warning state (3), loading state (9).

**None of these were applied to Claude Design this session** — they require your explicit go-ahead, same as every prior design edit in this project.

## Design changes proposed
7 items above, to `SAQEEL Planning.dc.html` only. No other design page affected.

## Application/code changes proposed
**None.**

## Files that would require a future lease (if scope ever expands beyond design correction)
Not proposed by this consent packet, but named for completeness since none exist yet: nothing — this packet contains zero application-side proposals. If a future decision separately authorizes deeper Planning work, the natural candidates (unexamined this pass) would be `apps/web/src/app/(app)/planning/{bulk,single,immediate,plans}/page.tsx` and their supporting components — explicitly out of this task's bounded scope (item 7 in the delta, `BLOCKED BY CONTRACT`).

## Exact tests (if design corrections are later mirrored into a runtime-verification pass — not proposed here)
- None required for a design-only correction (Claude Design has no test surface).
- If item 2 or 7 ever becomes a code-side task: `apps/web/e2e/cd-020-planning-home.spec.ts` and related existing specs already referenced in `product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv` for WA-DES-036 would be the natural extension point — not created or modified here.

## Rollback approach
Design-only changes: Claude Design retains in-app edit history; revert is a normal design-tool undo, not a Git operation. No application rollback needed since no application code is touched.

## Repository-state note carried forward
`CURRENT_SLICE.yaml` references a `revamp` worktree that does not exist in this session's `git worktree list`; canonical HEAD is `3323a8ef`. Documented, not repaired (product-contract files are out of this task's scope) — see delta.md.

## Decision
- [x] APPROVED all 7 substantive design corrections
- [ ] APPROVE a subset (specify which)
- [ ] REJECT — leave design as-is, log the known variance
- [ ] Decide later

Approver: sponsor/orchestrator (explicit chat approval, 2026-07-24)
Timestamp: 2026-07-24
Decision record: Applied via `mcp__claude-design__write_files` (project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`, path `SAQEEL Planning.dc.html`), `if_match` on prior etag `1784806070831883` — confirmed unchanged at write time via `finalize_plan`'s `base_etags`. New etag: `1784901048581707`.

**What was applied, item by item:**
1. Added a route annotation caption under the segmented tab control: "Each tab above is a separate application route... not an in-page switch." Tab content itself (Bulk/Single/Immediate/Plans screens) left untouched to limit risk.
2. Added a callout panel on the Home screen explaining the canonical (non-preview) `/planning` route's real list-first scope (KPI tabs, filter bar, 22-column table, export/refresh) and that it isn't depicted on this screen.
4. Added a caption under the method cards: "Cards above are disabled and unreachable when the signed-in user lacks the planning.create capability."
6. Added a drafts-preview table on Home (Plan/Method/Status/Created/Planner/Continue, 2 rows) between the package banner and the method cards.
8. Added full bilingual (EN/AR) support to the Home/Methods screen: language toggle button, `lang`/`dir` state, translated title/tagline/tabs/banner/cards/new content. Bulk/Single/Immediate/Plans screens remain English-only — documented limitation, not silently claimed complete.
10. Added a compact "non-happy-path states" reference row with three chips (Authorized role required / Planning data unavailable / No visits match), copy matching the real `EmptyState` text in code.
12. Added a caption below the header search box clarifying it's a Home-screen placeholder and that full search/filtering lives on the canonical list route.

No application code was touched. No other Claude Design page was modified.

## CORRECTION — 2026-07-24, Codex QA regression finding

The 7 design corrections above remain valid and applied. Separately,
independent re-verification found real **code-side** defects unrelated to
the design corrections: `PlanningPreview.tsx` (the file this delta was
compared against) is still on deprecated `.legacy-*`/retired-predecessor classes while its
sibling `page.tsx` has migrated to native `.sq-*`; `web-admin-m2-batch-002.spec.ts`
has 2 confirmed-failing assertions against current `retired-predecessor.css`. See the
"CORRECTION" section in `deltas/WA-DES-036/1784806070831883/delta.md` for
full evidence. This does not change the "no application code was touched"
fact above — it's a finding about pre-existing code state, not a change I
made — but it does mean a bounded code-side lease is warranted before this
page's overall readiness is called complete.

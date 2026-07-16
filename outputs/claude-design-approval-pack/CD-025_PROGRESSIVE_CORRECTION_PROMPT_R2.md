# Claude Design Progressive Correction Prompt — CD-025 R2 → R3

Paste this entire prompt into **Claude Design**, in the project containing the submitted CD-025 R2 design.

## Task identity and boundary

Revise the existing design as **CD-025 / SCR-WEB-150 / P03 Plan Review & Publish R3**.

This is a focused design and handoff correction. It is not application implementation and not a new visual exploration.

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not implement, commit, push, merge, deploy or modify `main`.

Keep `implementation_authorized: false` and label the Claude Code handoff:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`

## Preserve the successful R2 design

Do not redesign these accepted elements:

- blocker-first pre-flight workspace;
- Publish Consequence Ledger as the one page-specific signature pattern;
- 12 selected → 2 named duplicate exclusions → 10 retained;
- 10 visits, 10 assignments and 10 queued notification rows after successful publication;
- 3 manual plus 7 automatic assignments;
- named duplicate and overlap evidence;
- first eligible available Inspector selected by the server at publish, with no name promised beforehand;
- direct Planner publication;
- full rollback and no partial-success language;
- neutral failures with no raw provider/database errors;
- queued never meaning delivered, received, opened or accepted;
- immediate success continuity of 10 published, 0 draft and 0 complete;
- read-only plan detail;
- Arabic RTL, dark/light and desktop/1024/412 content layouts;
- native table semantics, alerts/status and disabled-action explanation;
- all 28 states;
- unresolved route/lifecycle/CD-024→025 handoff remaining `HANDOFF_BLOCKED`.

Do not add a second signature pattern or reopen the page composition for P2 preferences.

## Mandatory baseline reset

The R2 package used the obsolete `setup/Inspection` ref. That ref is not an acceptable source for this correction.

Open and inspect the supplied repository's **current `main` at commit `9360fc9`**. Read the following exact files before changing the design:

1. `product-contract/00_START_HERE.md`
2. `product-contract/CURRENT_STATE.md`
3. `product-contract/GATE_STATUS.md`
4. `product-contract/execution/CURRENT_SLICE.yaml`
5. `product-contract/execution/TASK_ROUTER.yaml`
6. `product-contract/governance/OPEN_DECISIONS.yaml`
7. `design/claude-design-mvp1/00_START_HERE.md`
8. `design/claude-design-mvp1/MANIFEST.yaml`
9. `apps/web/src/components/Shell.tsx`
10. `apps/web/src/components/ShellClient.tsx`
11. `apps/web/src/lib/shell-navigation.ts`
12. `apps/web/src/app/astryx.css`
13. `apps/web/src/app/planning/bulk/review/page.tsx`
14. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
15. `apps/web/src/app/planning/bulk/actions.ts`
16. `apps/web/src/app/planning/single/actions.ts`
17. `apps/web/src/app/planning/plans/[id]/page.tsx`
18. `supabase/migrations/0031_cd023_assignment_overlap_guard.sql`
19. `supabase/migrations/20260714091726_plan_validated_state.sql`
20. `supabase/migrations/20260714091727_planning_publish_guards.sql`
21. `outputs/cd-021/WIRING_MAP_CD-021.csv`
22. `outputs/cd-022/WIRING_MAP_CD-022.csv`
23. `outputs/claude-design-approval-pack/CD-025_DESIGN_REVIEW_R2.md`

Record the exact ref and commit actually inspected in the R3 provenance and manifest.

If you cannot access `main @ 9360fc9` and the files above, stop and return exactly:

`BASELINE_UNAVAILABLE — CD-025 R3 NOT GENERATED`

Do not fall back to `setup/Inspection`, cached files, an older branch or assumptions.

## Binding current runtime truth

Every R3 frame, annotation, manifest row, state row, wiring row, checklist item, provenance statement and Claude Code handoff must agree with these verified facts:

- `publish_bulk_plan` and `publish_single_visit` already exist as guarded atomic database publishers.
- They preserve caller RLS through `SECURITY INVOKER` behavior.
- Mutable role, target, package, visit-type, duplicate, identity/location and assignment conditions are rechecked authoritatively inside the relevant transaction.
- Factory-scoped advisory locks and the canonical assignment-overlap guard protect the known concurrent duplicate/overlap races.
- Bulk automatic assignment ignores any caller-supplied pool and chooses the first eligible Inspector available in the window.
- Automatic assignment is not round-robin, AI, optimization, capacity scoring, suitability ranking, territory scoring or risk scoring.
- Both publishers persist `Draft → Validated → Published` in the transaction.
- Notification rows are inserted as queued rows in the transaction.
- Existing append-only table triggers record successful mutations.
- Any publisher failure rolls back the full publisher write set.
- Bulk success continues to `/visits`.
- Single success continues to `/visits/:visitId`.
- `/planning/plans/:id` is read-only.
- Direct Planner publication is supported.

Do not mark the atomic publishers, Validated persistence or first-available assignment as `HANDOFF_BLOCKED`, proposed, absent or optional. They are protected current behavior.

Keep only genuinely unresolved legs blocked, including the final CD-025 route, persisted pre-publication review ownership, CD-024→CD-025 context handoff, return-to-edit context restoration, planning maker-checker, attempted/blocked-publish business event, provider delivery, durable receipt, freshness policy and support destination.

## P1 correction 1 — inherit the exact current shell

Delete the R2 flat shell and delete the proposed `NarrowAppBar` component.

Use the accepted shared shell exactly as implemented by `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts` and `astryx.css`.

For the Planner role, the frames must show the current role-scoped grouped navigation, including:

- Command group with Factory 360;
- Inspection group with Planning and Visit Management;
- active Planning destination;
- current icons and group grammar;
- navigation search in the topbar;
- theme control;
- notification control;
- own-account trigger with identity/role presentation;
- language and sign-out inside the account menu;
- desktop collapse control and collapsed behavior;
- skip-to-content relationship;
- real responsive drawer behavior.

Do not show destinations that the current Planner shell does not expose. Do not place theme, language or sign-out in an obsolete sidebar footer. Do not invent a second mobile shell.

## P1 correction 2 — use the real drawer focus model

The R2 412px drawer incorrectly sets Planning as the first focus target even though Overview is rendered before it. Shift+Tab from Planning jumps to Sign out and skips Overview.

Remove the custom `cd-drawerfirst`/`cd-drawerlast` logic and inherit the current `ShellClient` behavior:

- discover all enabled focusable links/buttons/inputs in DOM order;
- move focus to the first actual focusable control on open;
- contain forward and reverse Tab order across the complete drawer;
- close on Escape;
- return focus to the menu trigger after close;
- preserve the same behavior in Arabic RTL;
- do not hide a visible navigation item from keyboard order.

Provide closed-drawer and open-drawer evidence at 412px in English and Arabic. Include a short keyboard evidence note outside product UI documenting the observed first focus, reverse-wrap, forward-wrap, Escape and focus return.

## P1 correction 3 — synchronize every handoff asset

Remove all statements that claim:

- the baseline is `setup/Inspection`;
- migrations stop at 0025;
- atomic publishers are absent;
- bulk publication is sequential;
- single publication is sequential;
- automatic assignment is round-robin;
- Validated persistence is absent;
- the current shell is flat;
- the current shell lacks responsive behavior;
- grouped navigation, search, account menu or collapse must not be added.

Replace them with the binding current-runtime truth above.

Update every affected state and mapping, especially S02, S12, S18, S20, S24, S25 and S26.

The Claude Code prompt generated by Claude Design must tell the implementer to preserve the existing guarded publishers and shared shell. It must not ask Claude Code to recreate, weaken or conditionally replace them.

## Required R3 package

Regenerate and synchronize all of the following:

1. `CD-025 Plan Review and Publish.dc.html`
2. standalone HTML export
3. required PNG exports, including desktop dark/light, Arabic RTL and 412px closed/open drawer evidence
4. `IMPLEMENTATION_MANIFEST_CD-025.yaml`
5. `COMPONENT_MAP_CD-025.csv`
6. `WIRING_MAP_CD-025.csv`
7. `STATE_MATRIX_CD-025.csv`
8. `ACCEPTANCE_CHECKLIST_CD-025.md`
9. `RESEARCH_PROVENANCE_CD-025.md`
10. `CLAUDE_CODE_HANDOFF_CD-025.md`
11. the complete Claude Code implementation prompt, still blocked from execution until sponsor approval

All files must identify the same current baseline and the same remaining unresolved decisions. Do not deliver a newer standalone file with stale manifest/handoff assets.

## R3 acceptance test

Do not return R3 until all are true:

- page-specific CD-025 content remains visually unchanged except where needed to fit the exact current shell;
- no asset cites `setup/Inspection` as the baseline;
- atomic bulk/single publishers, Validated persistence and first-available assignment are mapped as existing protected behavior;
- no round-robin or sequential-publication claim remains;
- desktop, 1024 and 412 frames inherit the exact shared shell;
- Planner navigation is role-scoped and grouped correctly;
- search, collapse, account, language, sign-out, theme and notification controls match current shell ownership;
- all visible drawer items are reachable in forward and reverse keyboard order;
- Escape closes the drawer and focus returns to its trigger;
- Arabic RTL and both themes preserve the same states and shell behavior;
- all 28 states remain present;
- the 12→10→10 count model remains consistent;
- failures remain neutral and atomic;
- no raw errors or invented policies appear;
- final route/lifecycle/CD-024→025 ownership remains `HANDOFF_BLOCKED`;
- `implementation_authorized: false` remains explicit;
- the Claude Code handoff says `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`;
- final status is `READY_FOR_DESIGN_REVIEW_R3`, never approved or implementation-ready.

Return the complete synchronized R3 design package for one focused sponsor/Codex review. Do not implement it.


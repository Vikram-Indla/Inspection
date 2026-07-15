# Claude Design Progressive Correction Prompt — CD-025 R1 → R2

Paste this prompt into **Claude Design**, in the existing CD-025 project that contains `CD-025 Plan Review and Publish.dc.html`.

## Task identity and boundary

Revise the existing design as **CD-025 / SCR-WEB-150 / P03 Plan Review & Publish R2**.

This is a progressive correction of the existing R1 design, not a new screen and not a Claude Code implementation task.

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not implement, commit, push, merge, deploy or modify `main`.

Preserve the accepted R1 direction:

- blocker-first pre-flight;
- route-neutral staged review workspace;
- Publish Consequence Ledger as the one page-specific signature pattern;
- named scope reduction and no silent skipping;
- direct Planner publish;
- protected read-only `/planning/plans/:id`;
- neutral errors;
- queued-not-delivered notification truth;
- dark/light parity;
- Arabic-first full-document RTL;
- 28 hard states;
- `implementation_authorized: false`.

Do not restart visual exploration and do not add a second signature pattern.

## Read the current repository again

Before revising, re-read the required CD-025 authority sources and inspect the current versions of:

1. `apps/web/src/components/Shell.tsx`
2. `apps/web/src/components/ShellClient.tsx`
3. `apps/web/src/lib/shell-navigation.ts`
4. `apps/web/src/app/astryx.css`
5. `apps/web/src/app/planning/bulk/review/page.tsx`
6. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
7. `apps/web/src/app/planning/bulk/actions.ts`
8. `apps/web/src/app/planning/single/actions.ts`
9. `apps/web/src/app/planning/plans/[id]/page.tsx`
10. `supabase/migrations/0031_cd023_assignment_overlap_guard.sql`
11. `supabase/migrations/20260714091726_plan_validated_state.sql`
12. `supabase/migrations/20260714091727_planning_publish_guards.sql`
13. `product-contract/CURRENT_STATE.md`
14. `product-contract/sessions/LAST_SESSION.md`
15. `outputs/cd-021/WIRING_MAP_CD-021.csv`
16. `outputs/cd-022/WIRING_MAP_CD-022.csv`
17. `outputs/claude-design-approval-pack/CD-025_DESIGN_REVIEW_R1.md`

Record the exact branch, commit and dirty-worktree state observed during this correction. At the start of this review the baseline was `main @ 9360fc9`, with migrations `20260714091726` and `20260714091727` live and a no-exclusion Playwright result of `99/99`. Re-verify rather than blindly copying that snapshot.

## Do not regress to the stale R1 brief

The original R1 prompt contained runtime facts that were valid before the baseline wiring closure but are false now. The R2 design and every handoff asset must use the current verified truth:

- `publish_bulk_plan` and `publish_single_visit` are both guarded atomic database publishers.
- Both are `SECURITY INVOKER`; caller RLS remains active.
- Mutable role, target, package, visit-type, duplicate, identity/location and assignment conditions are authoritatively rechecked inside the relevant transaction.
- Factory-scoped advisory locks and the canonical assignment-overlap guard prevent the known concurrent duplicate/overlap race.
- Bulk automatic assignment ignores any caller-supplied pool and selects the first eligible inspector available in the window; it is not round-robin, AI, optimization, capacity scoring or suitability ranking.
- Both publishers persist `Draft → Validated → Published` inside the transaction.
- Notifications are inserted as queued rows in the transaction; queued never means delivered, received, opened or accepted.
- Existing append-only table triggers record the successful mutations. Do not invent a separate attempted-publication business event.
- Any publisher failure rolls back the complete publisher write set.
- Bulk success currently continues to `/visits`; single success continues to `/visits/:visitId`.

The final route, persisted pre-publication review ownership, CD-024→CD-025 handoff, return-to-edit context restoration, planning maker-checker and durable success receipt remain unresolved. Keep only those legs `HANDOFF_BLOCKED`.

## Mandatory P1 corrections

### 1. Use the exact frozen shared shell

Replace every simplified full-page shell with the actual accepted shell behavior from `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts` and `astryx.css`.

Desktop/full-frame evidence must show:

- role-scoped grouped navigation with the real group/item hierarchy and real icon grammar;
- active Planning destination;
- working collapse affordance and collapsed-state evidence where applicable;
- navigation search as an actual input/control;
- theme control;
- notification control;
- own-account trigger in the topbar with identity/roles;
- language and sign-out inside the account menu, matching runtime;
- page title/context in the accepted page-header structure;
- skip-to-content relationship.

Do not relocate the account control to the sidebar. Do not reduce grouped navigation to three placeholder rows. Do not replace accepted icons with colored squares.

For 390–430px evidence, add both closed and open drawer states. Prove focus containment, Escape close and focus return to the menu trigger. Preserve Arabic physical mirroring.

Any close-up that intentionally omits the shell must be labelled `CONTENT_CROP` outside the product UI.

### 2. Establish one authoritative count model

Use the following single R2 sample state everywhere in English, Arabic, dark, light, tablet, narrow, the contact sheet and every handoff file:

**Before duplicate decision and assignment correction**

- 12 factories selected/in scope.
- 2 have active periodic visits and are duplicate-blocked.
- Those 2 have no proposed assignment and must not be counted as assignments or queued notifications.
- 10 proposed retained visits remain if the two duplicates are explicitly removed.
- Assignment split across those 10: 3 manual, of which 2 are verified and 1 is blocked; 7 automatic, chosen at publish.
- Publish remains disabled.

**After the explicit 12→10 removal decision**

- 10 retained factories.
- 10 proposed visits.
- 10 proposed assignments.
- 3 manual plus 7 automatic.
- 10 assignment notification rows will be queued only after successful publication.
- The one manual-overlap blocker still disables publish.

**After the manual assignment is corrected**

- all 10 retained visits are assignable;
- readiness may become ready if every other authoritative source remains verified;
- the final action says `Publish plan and create 10 visits`;
- the success state says 10 visits and 10 assignments were created and 10 notifications were queued.

The Publish Consequence Ledger must derive every number from the current retained scope. Never show `7 automatic` in readiness and `9 automatic` in the ledger for the same state. Never promise 12 assignments/notifications while two targets are unassigned and duplicate-blocked.

### 3. Remove invented freshness policy

Correct S17.

Do not use “40 minutes ago” or any other elapsed age as a stale threshold. No freshness duration is configured.

You may show an exact `Last checked` timestamp as provenance only. A blocking stale/revalidation state must be triggered by a proven event or evidence, for example:

- a target/package/assignment changed after review loaded;
- the authoritative source reports a newer revision;
- the verification source became unavailable;
- the user explicitly requests recheck before committing.

Do not invent a revalidation interval, token or SLA.

### 4. Correct neutral failure and recovery truth

Correct S24 and every repeated failure frame.

Remove `contact support` and any implied support path. No support contact or escalation destination is approved.

Use safe copy such as:

`Publishing failed — nothing was published. The plan and visits were not created. Review the flagged items and try again.`

Only promise that staged values are preserved if the selected governed route/handoff model proves it. Until then, annotate preservation and return-to-edit wiring as `HANDOFF_BLOCKED`; do not turn it into an unconditional product promise.

Never expose raw database, provider, schema, SQLSTATE, function or policy text.

### 5. Restore lifecycle continuity after success

Correct S26 and S27.

The immediate success continuation for this 10-visit sample must show 10 persisted published child visits, zero completed and zero draft at the moment publication returns.

If you want to demonstrate later historical progress such as completed, returned, cancelled or expired children, place it in a separately labelled later-history example. Do not present `7 published · 1 completed · 2 draft` as the immediate destination of a transaction that just created and published all 10.

Bulk success currently goes to `/visits`. Keep `Go to visits` as the primary truthful action.

The optional `Open the published plan (read-only)` action may remain only if the handoff explicitly adds the implementation leg that captures the returned plan ID and routes to `/planning/plans/:id`. Otherwise remove it from product UI. The destination itself remains strictly read-only.

### 6. Make accessibility evidence real, not prose-only

Replace `sc-raw-table`, `sc-raw-thead`, `sc-raw-tr`, `sc-raw-th` and `sc-raw-td` with native semantic table elements. Use `th scope="col"`; do not invent an ARIA grid.

For the blocked publish action:

- keep the native `disabled` state;
- give the visible reason text a stable ID;
- connect the button with `aria-describedby`;
- keep correction links keyboard reachable;
- ensure focus rings remain visible in both themes.

For failure and success:

- failed submit moves focus to one `role="alert"` summary rendered once;
- summary links move focus to the exact row using a legitimate programmatic focus target;
- publishing progress uses `role="status"` and prevents double submit;
- success moves focus to a real heading or labelled summary target, not generic strong text;
- reduced-motion behavior preserves focus and content continuity.

Use native buttons, links and inputs for the real shared-shell controls in the design artifact/handoff.

### 7. Remove internal design language from product UI

Remove `SIGNATURE — one per screen` from the consequence rail and any other user-facing design-process, ratchet, requirement, migration, route-blocker or implementation commentary.

Keep hypothesis labels, novelty declarations, source provenance, requirement IDs, migration names and `HANDOFF_BLOCKED` annotations outside product frames.

## Regenerate the complete package — mandatory

The current downloaded standalone HTML is newer than the repository handoff. R2 is incomplete unless every deliverable describes the same design and runtime.

Regenerate and synchronize:

1. `CD-025 Plan Review and Publish.dc.html`
2. the standalone HTML export
3. all required PNG exports
4. `IMPLEMENTATION_MANIFEST_CD-025.yaml`
5. `COMPONENT_MAP_CD-025.csv`
6. `WIRING_MAP_CD-025.csv`
7. `STATE_MATRIX_CD-025.csv`
8. `ACCEPTANCE_CHECKLIST_CD-025.md`
9. `RESEARCH_PROVENANCE_CD-025.md`
10. `CLAUDE_CODE_HANDOFF_CD-025.md`

The Claude Code handoff must remain labelled:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`

It must also instruct Claude Code to stop if route/lifecycle/CD-024→025 ownership has not been governed. Do not include stale migration-0026-only claims, round-robin allocation, pre-RPC-only guards or sequential single-publication steps.

Every state-matrix row and wiring-map row must map to current files, current guarded RPCs, exact negative behavior, exact success destination and exact remaining blocker.

## R2 acceptance test

Do not mark R2 ready for review until all are true:

- selected dark and light desktop frames use the exact frozen shared shell;
- Arabic RTL dark and light preserve the same hard state and physical mirroring;
- tablet and narrow frames preserve the corrected counts and real shell behavior;
- open and closed mobile drawer behavior is evidenced;
- all 28 states remain present;
- S17 contains no invented age threshold;
- S24 contains no invented support path or unproven preservation guarantee;
- S26/S27 preserve immediate post-publish lifecycle truth;
- native table and disabled-reason semantics are present;
- no internal design-process copy appears inside product UI;
- all HTML, PNG, manifest, mapping, checklist, provenance and Claude Code handoff assets agree;
- route/lifecycle/handoff ownership stays `HANDOFF_BLOCKED`;
- `implementation_authorized: false` remains explicit;
- final status is `READY_FOR_DESIGN_REVIEW_R2`, never approved or implementation-ready.

Return the corrected R2 design and the complete synchronized handoff package for one focused sponsor/Codex re-review. Do not implement it.

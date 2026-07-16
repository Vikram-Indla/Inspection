# CD-025 Design Review R2 — P0/P1 Only

- Review date: 2026-07-14
- Submission: `/Users/vikramindla/Downloads/Plan Review and Publish.zip`
- Task: `TASK-DESIGN-CD025-REVIEW`
- Process/screen: `P03 / SCR-WEB-150`
- Runtime baseline verified: `main @ 9360fc9`
- Design scope: review only; implementation is not authorized
- P0 findings: none
- Sponsor recommendation: **BLOCK THIS R2 PACKAGE PENDING THE SPECIFIED P1 CORRECTIONS**

## Executive decision

The page-specific CD-025 design has improved materially and should be preserved. The blocker-first review, Publish Consequence Ledger, 12→10 scope truth, 3-manual/7-automatic split, neutral failures, native table semantics, immediate 10-published success continuity, Arabic RTL, themes and 28-state coverage are strong.

The package cannot be approved or passed to Claude Code because Claude Design inspected the obsolete `setup/Inspection` ref instead of the supplied current `main @ 9360fc9`. As a result, the manifest, wiring map, component map, acceptance checklist, provenance and Claude Code handoff all contradict protected live behavior and the accepted shell. Executing that handoff creates a credible regression risk to atomic publication, assignment selection, the Validated lifecycle and the shared application shell.

This is a focused R3 correction, not a visual restart. Preserve the accepted CD-025 content design and correct the baseline, shell, mappings and mobile focus order.

## P1 findings

### P1-01 — The complete handoff is based on the wrong repository ref

The package declares `setup/Inspection` as its observed baseline and says migrations stop at 0025, atomic publishers do not exist, bulk automatic assignment is round-robin and `Validated` persistence is absent. Those statements are false for the supplied repository.

Verified current truth:

- `publish_bulk_plan` and `publish_single_visit` are guarded atomic publishers in `supabase/migrations/20260714091727_planning_publish_guards.sql`.
- Both preserve caller RLS through `SECURITY INVOKER` behavior.
- Factory advisory locks and the canonical overlap guard protect concurrent duplicate/assignment writes.
- Automatic assignment is server-derived as the first eligible Inspector available in the window; it is not round-robin.
- `Draft → Validated → Published` is persisted in the same transaction.
- Notification rows and append-only audit mutations share the publisher transaction.
- Failure rolls back the complete publisher write set.

The false baseline appears in `IMPLEMENTATION_MANIFEST_CD-025.yaml`, `WIRING_MAP_CD-025.csv`, `COMPONENT_MAP_CD-025.csv`, `ACCEPTANCE_CHECKLIST_CD-025.md`, `RESEARCH_PROVENANCE_CD-025.md`, `CLAUDE_CODE_HANDOFF_CD-025.md`, `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-025.md` and the design annotations. This makes the delivered Claude Code prompt unsafe to execute.

### P1-02 — The accepted shared shell is replaced with an obsolete flat shell

The R2 frames render a flat list containing Overview, Planning, Visits, Reviews, Factory 360, Virtual, Field, Operations and Admin. They omit the current grouped, role-scoped shell; navigation search; collapse control; topbar own-account trigger; and the account-menu placement of language and sign-out.

The current shell already implements these behaviors in:

- `apps/web/src/components/Shell.tsx`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/lib/shell-navigation.ts`
- `apps/web/src/app/astryx.css`

For a Planner, the accepted family grammar includes the role-scoped Command group with Factory 360 and the Inspection group with Planning and Visit Management. CD-025 must inherit that shell exactly. The package must delete the proposed `NarrowAppBar`; the real `ShellClient` already owns the responsive drawer and focus containment.

### P1-03 — The proposed mobile drawer skips the first navigation item by keyboard

Rendered verification at the 412px state proved the defect:

1. Opening the drawer moves focus to Planning.
2. Overview is visibly before Planning but is not the configured first focus target.
3. Pressing Shift+Tab from Planning jumps to Sign out.

Therefore Overview cannot be reached in the expected reverse keyboard order from the initial focus. The artifact hard-codes `cd-drawerfirst` on Planning rather than using the first actual focusable element. Reuse the existing `ShellClient` drawer behavior, which discovers all focusable controls, contains focus, closes on Escape and returns focus to the trigger.

## State-by-state Pass / Correct / Block matrix

`Pass` means the state-specific product design can be preserved. `Correct` means a P1 mapping or shell correction is required. `Block` means the delivered state/handoff must not be approved until the protected runtime contradiction is removed.

| State | Decision | P0/P1 review and repository mapping |
|---|---|---|
| S01 Initial validation/loading | Pass | Context-preserving, fail-closed loading is sound. Map to `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`, `review/page.tsx` and `bulk/actions.ts`. |
| S02 Ready, 10 retained | Correct | Visual/count model passes; replace sequential/round-robin handoff claims with `publish_bulk_plan` and persisted Validated behavior. Map to `bulk/actions.ts` and `20260714091727_planning_publish_guards.sql`. |
| S03 Multiple blockers | Pass | Linked blocker summary, named duplicates and disabled action are strong. Map to `ReviewClient.tsx` and authoritative publisher guards. |
| S04 Missing configuration | Pass | Keep distinct correction link and preserved entered values. Map to CD-024 handoff plus `bulk/actions.ts`; route ownership remains unresolved. |
| S05 No published package | Pass | Correctly distinct from a failed package read. Map to package-version reads in `bulk/actions.ts`. |
| S06 Package invalidated | Pass | Correct submit-time failure model. Map to the package recheck in `publish_bulk_plan`. |
| S07 No Inspector role pool | Pass | Correctly distinct from an Inspector-source failure. Map to `user_roles` reads and publisher eligibility checks. |
| S08 Partial assignment coverage | Pass | Named unresolved scope and blocked publication are correct. Map to `ReviewClient.tsx` and `publish_bulk_plan`. |
| S09 Duplicate active visit | Pass | Named duplicate targets and no silent exclusion are correct. Map to factory locks and duplicate rechecks in the guarded bulk publisher. |
| S10 Explicit 12→10 reduction | Pass | Counts now reconcile: 10 visits, 10 assignments, 3 manual, 7 automatic, 10 queued notifications. Map to `ReviewClient.tsx` and guarded bulk publication. |
| S11 Manual Inspector overlap | Pass | Exact visit/window evidence and correction path are truthful. Map to `0031_cd023_assignment_overlap_guard.sql` and the guarded publisher. |
| S12 Automatic assignment explanation | Correct | Product copy says first eligible available, but package mappings say round-robin. Remove every round-robin/current-runtime claim. Map to `20260714091727_planning_publish_guards.sql`. |
| S13 Factory-source failure | Pass | Fail-closed unavailable state is correct. Map to `bulk/actions.ts` and review data loading. |
| S14 Package-source failure | Pass | Correctly not represented as an empty package list. Map to `bulk/actions.ts`. |
| S15 Inspector-source failure | Pass | Correctly not represented as an empty role pool. Map to `bulk/actions.ts`. |
| S16 Duplicate/overlap query failure | Pass | Correctly never represented as zero conflicts. Map to review loading and guarded submit-time rechecks. |
| S17 Revalidation required | Pass | The R1 invented elapsed-time threshold has been removed; use only proven change/source evidence. Map to `MVP1-FND-013` without inventing a freshness policy. |
| S18 Concurrent change/rollback | Block | The visual state correctly promises atomic rollback, but the delivered manifest/handoff marks the atomic publisher absent. Correct every asset to the live guarded RPC and overlap guard before approval. |
| S19 Approval-required annotation | Pass | Correctly remains annotation-only and unproven; do not add maker-checker behavior. Map to the RBAC contract/open decision. |
| S20 Direct Planner publication | Correct | Direct Planner publication is supported, but the handoff must map the current role recheck and atomic publisher instead of obsolete sequential behavior. |
| S21 Unauthorized/not in scope | Correct | State behavior is sound; render it inside the real role-scoped shell and preserve the existing route role guard and RLS. Map to `review/page.tsx`, `Shell.tsx` and policies. |
| S22 Lost/expired staged review | Pass | Correctly marked unresolved rather than inventing durable recovery. Keep route/lifecycle/CD-024→025 handoff `HANDOFF_BLOCKED`. |
| S23 Publishing/double-submit | Pass | Native disabled progress and status treatment are sound. Map to `ReviewClient.tsx`, `bulk/actions.ts` and the atomic publisher. |
| S24 Bulk failure | Block | Product copy is now neutral and truthful, but the handoff wrongly describes the current publisher as sequential/atomicity absent. Map to `publish_bulk_plan` and full rollback. |
| S25 Single atomic failure | Block | Product copy correctly promises single-publication rollback, but the package marks `publish_single_visit` atomicity absent. Map to `single/actions.ts` and the guarded single RPC. |
| S26 Bulk success | Correct | Immediate 10-published/0-draft/0-complete truth passes. Correct the publisher/wiring baseline; keep `/visits` as the proven primary continuation. |
| S27 Read-only plan detail | Pass | Read-only responsibility and lifecycle continuity pass. Map to `apps/web/src/app/planning/plans/[id]/page.tsx`; do not make it an editor. |
| S28 Return-to-edit/focus landing | Pass | Interaction is sound as a design, but actual route/context restoration remains `HANDOFF_BLOCKED` until CD-024→025 ownership is governed. |
| Dark theme | Correct | Page content passes; exact current shell must replace the flat shell. |
| Light theme | Correct | Page content passes; exact current shell must replace the flat shell. |
| Arabic RTL | Correct | Arabic translation and physical RTL pass; render the current grouped shell and account menu in RTL as well. |
| 1024/narrow | Block | Content reflow passes, but the invented shell/drawer and keyboard focus defect must be removed. |
| Keyboard/focus/status | Block | Native table, column headers, alert/status and disabled reason pass; drawer first-focus/reverse-tab order fails. |

## Protected behaviors and regression risks

Preserve without reinterpretation:

- guarded atomic `publish_bulk_plan` and `publish_single_visit`;
- caller RLS and authoritative server-side role/target/package/visit-type/assignment rechecks;
- factory advisory locks and overlap serialization;
- server-derived first eligible Inspector available in the window;
- canonical `Draft → Validated → Published` transitions;
- one plan containing one visit per retained factory;
- all-or-nothing rollback and no partial success;
- append-only audit mutation records;
- queued-not-delivered notification truth;
- direct Planner publication;
- neutral errors with no raw provider/database text;
- read-only `/planning/plans/:id`;
- failed reads never becoming valid empty or zero states;
- no optimistic Published state and no double submission.

Do not invent maker-checker, assignment scoring, suitability ranking, capacity logic, delivery/receipt/acceptance, freshness thresholds, support contacts, a final review route or recoverable staged ownership.

The highest regression risk is not the visible CD-025 page: it is the delivered Claude Code prompt. **Do not execute the R2 Claude Code prompt.** It could cause an implementer to rebuild or weaken behavior that is already live and verified.

## Arabic, RTL, theme, responsive, accessibility and security findings

- **Arabic/RTL:** Pass at the page-content level. The rendered narrow Arabic frame is translated and the stage applies `lang="ar"` and `dir="rtl"`. Correct the inherited shell only.
- **Themes:** Dark and light page-content states are complete. Correct the shared shell rather than redesigning the content.
- **Responsive:** Tables, cards and consequence content remain available at narrow width. The invented responsive shell is a P1 regression and must be replaced by the current shell.
- **Accessibility:** Native table semantics and column headers are present; readiness is exposed as an alert; publishing uses status treatment; the disabled action has a visible reason. The mobile focus order is a demonstrated P1 keyboard failure.
- **Security/runtime truth:** Product copy is conservative and does not expose raw errors. The manifest/handoff contradicts protected server behavior and is therefore unsafe even though the visible copy is good.

## Sponsor recommendation

**Block the current R2 package and run one focused R3 correction.** Do not restart the page design. Preserve all passing CD-025 content states; correct the repository baseline, inherited shell, mobile focus order and every generated handoff asset. Re-review the synchronized R3 package before design approval or Claude Code implementation.

## P2 register for the final consolidated Big Bang critique

- Test whether the persistent consequence rail is too dense at 1024–1280px.
- Reduce repeated operational prose only after comprehension testing; do not remove consequence truth.
- Test whether `staged / not yet persisted` reassures Planners or creates avoidable loss anxiety.
- Test whether `first eligible available in the window` belongs in secondary disclosure while `assigned at publish` remains primary.
- Validate long Arabic factory names, role labels and account identities with production-length localization data.


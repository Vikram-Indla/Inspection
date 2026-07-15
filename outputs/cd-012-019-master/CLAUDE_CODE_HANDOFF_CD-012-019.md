# CLAUDE CODE HANDOFF — CD-012 → CD-019 (master)

**Design approval is not build completion.** Status: READY_FOR_DESIGN_REVIEW for all eight screens.
Codex must independently audit `WIRING_MAP_CD-012-019.csv` before any implementation authorization;
Claude Code implements only human-approved manifests on a safe non-main branch/worktree, one
vertical slice at a time, and reports the diff path by path. `VERTICAL_SLICE_PASS` only after live
evidence (real record, transition, audit event, negative paths, AR/RTL/themes/responsive, keyboard/
screen-reader, regression suite).

## Blocking pre-condition (all screens)
`HANDOFF_BLOCKED_REPOSITORY_DISCOVERY` — perform the mandated discovery first; record branch/
commit/dirty-worktree; confirm each candidate file inventory against imports and runtime
composition; reconcile every seam in runtime-truth-ledger.md. Never mark a symbol PROVEN without
opening it.

## Controlled application order (per screen, in series order 012→019)
1. **Semantic tokens** — none added anywhere; consume `saqeel-tokens.css` verbatim (DEC-011).
2. **Approved assets** — inline brand mark only; no rasters.
3. **Shared components first** — TruthTier tags/legend, BlockedSeams panel, ApprovalGrammar
   banners/guards (built once, reused by all eight screens; see COMPONENT_MAP rows screen=ALL).
4. **Route composition** — per-screen candidate files (Part B inventories). CD-016 has NO route:
   do not create one without a governed contract; CD-013 shares /admin/workflows with CD-012 —
   preserve honest list/designer mode separation.
5. **Localization** — EN/AR keys for all new labels; Arabic first-class; keys via ui_strings.
6. **Tests/evidence** — per-screen tests named in WIRING_MAP; SoD, immutability, validation
   blockers, provider-absence and redaction paths are mandatory negative tests.

## Do not (series-wide)
- Mutate published config in place; bypass maker-checker; approve your own draft.
- Render blocked inputs (tests, runtime counts, graph analysis, delivery, staleness, masking)
  as live numbers, guards or successes.
- Redesign the frozen shell; unhide unsupported destinations; substitute nav visibility for RLS.
- Invent tables/RPCs/policies/audit-event/notification names — every TBD-cite in the wiring map
  must be resolved from source before the row is buildable.
- Write to the repository during design phase.

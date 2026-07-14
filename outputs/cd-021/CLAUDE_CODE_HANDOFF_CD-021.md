# CLAUDE_CODE_HANDOFF_CD-021

Design-only package for SCR-WEB-110 (/planning/bulk). Do NOT implement until sponsor approval of the design frames and Codex wiring review are both recorded.

## Read first
- Design canvas: "CD-021 Bulk Targeting.dc.html" (frames 1a-1h) + 4 PNGs in outputs/cd-021/
- IMPLEMENTATION_MANIFEST_CD-021.yaml (file_changes, protected behavior, rollback)
- WIRING_MAP_CD-021.csv (every action/state leg with runtime evidence or HANDOFF_BLOCKED)
- ACCEPTANCE_CHECKLIST_CD-021.md (DSG-016 / DSG-A11Y-001 exit checks)

## Design thesis (selected: criteria-first Targeting Lens)
One instrument, four synchronized representations: criteria tree (reproducibility artifact), eligibility ledger (denominator + exclusions + freshness), distributions (geo/risk/activity, list-first), evidence table (selection + provenance). Focusing a condition reveals its population contribution everywhere without editing anything.

## Hard truths this design encodes
1. publishBulkPlan is NOT atomic today (6 sequential writes, no rollback). The UI never claims atomicity: it shows a per-step stepper, preserves work in draft on failure, and offers resume-at-step retry. The atomic/compensating backend leg is HANDOFF_BLOCKED (recommend Postgres RPC/transaction — sponsor/backend decision).
2. Raw Supabase error text currently reaches the UI (return {error: e.message}). Replace with catalogued neutral copy (error_catalogue.csv); log the raw error server-side.
3. page.tsx fetches every factory unpaginated. The design requires server-side pagination + aggregate counts; flag capacity implications in review.
4. Risk is recorded ENG-04 context, always labelled "advisory" with model version. Nothing auto-selects; no ranking, no AI language anywhere.
5. Nested AND/OR extends the governed contract (M01-003/012/022 "AND/OR conditions"); the flat cf/co/cv URL contract stays parseable for backward compatibility.
6. Selection persists across pagination/filtering; criteria edits that would drop selected rows require explicit confirmation (never silent).
7. CD-020 Planning Home has no sponsor-approved artifact in the repo: treat family composition as HANDOFF_BLOCKED; this screen only assumes the frozen shared shell.

## Locked baselines (do not touch)
Shared shell TASK-WEB-SHELL-001 (frozen), RBAC/RLS, state_transitions, append-only audit, notification semantics, M02-012 duplicate rule, Saqeel tokens (tokens.css only), Arabic-first document RTL, dark/light parity. No Dashboard topbar copy — all filters here are page-scoped.

## A11y/RTL contract (DSG-A11Y-001)
ARIA tree pattern for criteria; grid pattern for table; aria-live polite counts + assertive alerts; >=44px desktop controls (48px prominent), 16px inputs; visible token focus ring; glyph+color status; bdi-isolated LTR identifiers in RTL; logical properties only; reduced-motion disables map fly-to and stepper animation.

## Self-criticism (5 passes, summary)
1 Contract coverage: 26 mandatory states mapped (1a/1d/1e/1f/1g full frames; 1h board; each labelled). 2 Domain plausibility: planner language (denominator, exclusions, provenance, dispatch-blocking location) not generic CRM filters. 3 Differentiation: the ledger + contribution deltas are the signature; strip branding and the exclusion-accounting still reads as an inspection targeting instrument. 4 Family cohesion: tokens, lozenge/chip grammar, mono micro-labels, shell unchanged. 5 Implementation fit: every element maps to an existing file or a named CREATE with tests; no invented policy values (all counts are sample data labelled by source).

READY_FOR_DESIGN_REVIEW

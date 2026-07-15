# Claude Design Progressive Correction Prompt — CD-026 R1 → R2

## Where this prompt goes

Paste this entire document into **Claude Design** in the existing CD-026 Visit Management Workspace project.

This is a focused package-correction task. It is **not** a Claude Code implementation prompt and is not permission to edit application code.

## Task identity and stop conditions

- Product: Saqeel MVP1 (`صقيل | صناعي`).
- Design: `CD-026 / SCR-WEB-200 / P03 — Visit Management Workspace`.
- Revision to create: `R2`.
- Review authority: `outputs/claude-design-approval-pack/CD-026_DESIGN_REVIEW_R3.md`.

Keep:

`implementation_authorized: false`

Every Claude Code-facing artifact must begin with:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard, or overwrite the dirty worktree.

## Preserve everything already corrected

Do not weaken or redesign:

- the accepted shared Saqeel shell, tokens, typography, dark/light themes, Arabic-first document RTL, focus grammar, role-scoped navigation, desktop collapse, or mobile drawer;
- the Selected Visit Continuity Spine as the sole page-specific signature pattern;
- RLS as the authorization boundary, append-only audit, canonical expiry, planning versus operational state distinction, Sunday-first calendar, and relative—not capacity—workload language;
- the per-item bulk outcome ledger, neutral error goal, queued-not-delivered notification truth, map/list alternative, and all `HANDOFF_BLOCKED` labels;
- `BASELINE_REVERIFY_REQUIRED` with no exact-baseline equivalence claim;
- the Track 1 approved UI work versus Track 2 separate blocked-remediation split;
- the editable `.dc.html`, package inventory, state matrix, wiring map, research ledger, acceptance checklist, future handoff, and implementation prohibition.

Do not add a map route/provider, attention score, Branch Manager role, saved-view/export implementation, capacity/availability/travel/proximity/skills/territory signal, SLA threshold, or implementation claim.

## The only two remaining P1 corrections

### P1-01 — Make the hypotheses genuinely equal-fidelity and comparable

The current R1 exports now prove different entry points, but they are not equally complete:

- HYP-A shows a full list-led workspace;
- HYP-B shows only an exception queue;
- HYP-C shows only calendar header/day labels.

Regenerate all three as complete, same-size high-fidelity desktop compositions at the same viewport and visual density. Each must use the same realistic sample data and show:

1. the frozen shared shell and page identity;
2. scope/query header, RLS-scoped role context and selected visit identity;
3. the authoritative record/evidence surface;
4. the selected-visit continuity/allowed-action boundary;
5. a representative hard state and non-color semantics;
6. an explicit map-unavailable/list-equivalent treatment where map is mentioned;
7. keyboard and 412px/Arabic RTL feasibility annotations.

The information architecture—not colour, spacing, labels or mere card order—must differ:

| Hypothesis | Leading decision zone | Non-negotiable truth |
| --- | --- | --- |
| A — Coordinated lenses | List is the precision anchor; other lenses coordinate around stable selection | Selected Visit Continuity Spine persists; bulk derives from the selected set. |
| B — Exception queue first | Lifecycle facts only: returned, expired, or started/locked | No attention score, priority score, risk score, SLA or invented triage signal. The authoritative list/evidence and action boundary remain visible. |
| C — Schedule context first | Calendar/workload context starts the decision | No capacity, availability, optimisation or scheduling recommendation. The exact visit evidence/action boundary remains visible without hover, drag, or map. |

Create these complete evidence exports:

- `CD-026_SCR-WEB-200_HYP-A_dark_en_desktop_R2.png`
- `CD-026_SCR-WEB-200_HYP-B_dark_en_desktop_R2.png`
- `CD-026_SCR-WEB-200_HYP-C_dark_en_desktop_R2.png`
- `CD-026_SCR-WEB-200_HYP-A_dark_ar_desktop_R2.png`
- `CD-026_SCR-WEB-200_HYP-A_light_ar_412_R2.png`
- one counterfactual of A with the Continuity Spine removed.

In the `.dc.html`, make every full hypothesis independently selectable. Update the comparison to explain the selected A direction using decision evidence, without numeric self-scoring. Do not claim measured research data that was not collected.

### P1-02 — Submit a clean CD-026-only archive

The R1 ZIP mixes CD-026 with stale CD-025 R2/R3 folders, root CD-025 source/script copies, and unsafe historical CD-025 Claude Code prompts. That is an execution/provenance hazard.

Create one clean archive containing **only**:

`outputs/cd-026-r2/`

It must include the complete R2 package and no other root or sibling package. In particular, exclude all CD-025 folders, root CD-025 files, `uploads/`, stale PNGs, stale screenshots, and every historical CD-025 Claude Code handoff/prompt.

The R2 package must contain:

1. `CD-026 Visit Management Workspace.dc.html`
2. `CD-026 Visit Management Workspace.standalone.html`
3. `cd26-stage.js`, `cd26-annot.js`, `support.js`
4. `saqeel-tokens.css`, `saqeel-astryx.css`, `saqeel-prism.svg`
5. `IMPLEMENTATION_MANIFEST_CD-026.yaml`
6. `COMPONENT_MAP_CD-026.csv`
7. `WIRING_MAP_CD-026.csv`
8. `STATE_MATRIX_CD-026.csv`
9. `ROLE_ACTION_MATRIX_CD-026.csv`
10. `VIEW_CONTINUITY_MATRIX_CD-026.csv`
11. `RESEARCH_LEDGER_CD-026.csv`
12. `ACCEPTANCE_CHECKLIST_CD-026.md`
13. `FAMILY_DRIFT_AUDIT_CD-026.md`
14. `CLAUDE_CODE_HANDOFF_CD-026.md`
15. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-026.md`
16. `PACKAGE_INVENTORY_CD-026.csv`
17. every R2 evidence PNG, including the complete hypothesis exports above.

`PACKAGE_INVENTORY_CD-026.csv` must list every file in the archive with relative path, revision `R2`, baseline wording, design/screen ID, implementation-facing flag and a passed synchronization result. Every manifest reference must resolve inside `outputs/cd-026-r2/`.

## Baseline language scan

Before return, scan every R2 text/source artifact for `matches`, `1:1`, `equivalence`, `verified this session`, and `9360fc9`. Do not assert an exact baseline match unless it was independently inspected. Keep the truthful `BASELINE_REVERIFY_REQUIRED` position and defer exact code/wiring verification to Codex.

## R2 acceptance test

Do not return R2 until all are true:

- three distinct, full, equal-fidelity desktop hypothesis compositions exist and are independently selectable;
- HYP-A has Arabic RTL and 412px feasibility proof;
- all hypotheses preserve the same data, truth labels, shell, action boundary and hard-state integrity;
- no hypothesis invents attention scoring, map truth, capacity/availability, travel, SLA or recommendation policy;
- every R2 file is internally consistent and records `implementation_authorized: false` where applicable;
- no R2 artifact asserts an unverified exact baseline equivalence;
- the submitted archive contains only `outputs/cd-026-r2/` and its own inventory-listed files;
- no stale CD-025 artifact or execution prompt is present;
- Track 1/Track 2 and the execution prohibition remain intact;
- status is `READY_FOR_DESIGN_REVIEW_R2`, never sponsor-approved or implementation-complete.

Return the clean R2 archive for final sponsor/Codex review. Do not implement.

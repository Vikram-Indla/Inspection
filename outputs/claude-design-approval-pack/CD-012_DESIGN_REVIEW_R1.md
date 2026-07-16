# CD-012 Design Review — R1

**Submitted archive:** `Plan Review and Publish (16).zip` (valid ZIP; 824 files)
**Reviewed scope:** CD-012 / SCR-ADM-050 / Workflow library
**Verdict:** **BLOCKED — no design acceptance or implementation hand-off.**

## Receipt

This submission contains **only CD-012 R1** from the requested CD-011–CD-019 sequence. It is mixed into a broad historical archive containing unrelated CD packages, root source files, and screen captures. No standalone `CD-012_SCR-ADM-050_primary.png` or `CD-012_SCR-ADM-050_outlier.png` exists in the package, and no measured-dimension/SHA evidence was supplied.

The interactive HTML can be inspected as a working artifact, but it does not replace the mandatory standalone uncropped evidence exports.

## Blocking findings

| ID | Severity | Finding | Evidence | Required correction |
|---|---|---|---|---|
| CD12-R1-01 | P0 | Mandatory visual exports are absent. The prompt explicitly requires standalone uncropped primary/outlier PNGs, measured dimensions, SHA-256, and in-frame fixture labelling; the package contains none. | Archive listing; manifest names PNGs that are absent; checklist leaves them blocked. | Export the required primary, critical outlier, dark/light, EN/AR/RTL, and constrained-width frames. Include measured dimensions, SHA-256, capture state, and `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` in every frame. |
| CD12-R1-02 | P0 | Required repository discovery was not performed. The design says the repository was not readable although the prompt makes discovery mandatory before design. | `source-receipt.md`; manifest source branch/commit/worktree are `UNKNOWN_REPOSITORY_NOT_READABLE`. | Open the mandated authority, route, component, action, acceptance, and traceability files. Record exact branch, commit, dirty worktree, source lines/symbols, and proof classification. |
| CD12-R1-03 | P0 | The delivery is not a clean sponsor-review package. The submitted archive contains 824 unrelated files; CD-012 has no self-contained final ZIP/root or preflight. | Archive listing. | Submit one archive rooted only at `outputs/cd-012-r2/`, with a final measured inventory and contamination check. |
| CD12-R1-04 | P1 | The source receipt is internally contradictory: it claims the repository was not read but labels the workflow-library read and frozen shell as “PROVEN.” It therefore does not meet the no-invention truth standard. | `source-receipt.md`. | Classify each fact from opened source evidence. If not opened, it must be `HANDOFF_BLOCKED`, not `PROVEN` by pattern inference. |
| CD12-R1-05 | P1 | The implementation manifest uses action names that do not exist (`publishWorkflow`, `cloneWorkflow`). Current code exports `approvePublishWorkflow` and `proposeWorkflowDraft`; draft editing is `saveWorkflowDraft`. | `IMPLEMENTATION_MANIFEST_CD-012.yaml` versus `apps/web/src/app/admin/workflows/actions.ts`. | Correct every component/action/export mapping and state its actual current responsibility. |
| CD12-R1-06 | P1 | The design presents graph validation, lifecycle test health, runtime-case counts, and publish-notification behavior as visible workflow health, but current route/actions do not establish those read/write/audit seams. | `WIRING_MAP_CD-012.csv`; `page.tsx`; `actions.ts`. | Keep these as explicit hand-offs with exact missing data/analysis/audit contracts. Do not portray them as existing runtime data or enforced publish guards. |
| CD12-R1-07 | P1 | The current publish action directly changes a draft to published and relies on RLS/DB constraint. The design’s “submitted + tests pass + graph valid” publish guard is not current behavior. | `approvePublishWorkflow` in `actions.ts`; wiring map. | Make the difference explicit: either design the present guard truthfully, or define a governed future guard as blocked implementation scope. Do not claim publish is prevented by unimplemented graph/test checks. |
| CD12-R1-08 | P1 | The acceptance evidence self-identifies a blocked WCAG contrast check and missing raster proof, yet concludes `READY_FOR_DESIGN_REVIEW`. This is not eligible for review under the prompt’s first-return rule. | `ACCEPTANCE_CHECKLIST_CD-012.md`. | Do not return READY until all mandatory evidence is supplied or the package verdict is honestly BLOCKED. |
| CD12-R1-09 | P2 | Research provenance gives generic source names but no precise citations/links or captured source details. It cannot demonstrate the required primary-source research. | `RESEARCH_PROVENANCE_CD-012.md`. | Include direct source citations, access date, observed pattern, adoption, and rejection without copying external visual grammar. |

## Verified repository truth

- `/admin/workflows` reads `config_versions` filtered to `engine='workflow'`, and resolves maker/checker names from `profiles`.
- It renders versioned object rows, transition tables, draft editing, draft proposal from a published version, and approval/publish for draft rows.
- `proposeWorkflowDraft`, `saveWorkflowDraft`, and `approvePublishWorkflow` are the current server actions.
- Published immutability and maker-checker constraints are real contract boundaries, but the actual source does **not** prove graph analysis, test-run storage, in-flight case counts, publish notifications, or a separate stale-version contract.

## R2 acceptance threshold

R2 must be a clean, source-grounded CD-012-only package with all required native visual evidence. The lifecycle-signature concept can remain, but only where its computed graph/test/runtime inputs are either proven or visibly marked as blocked. The implementation hand-off must map to the real route and exported actions exactly.

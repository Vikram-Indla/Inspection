# CD-043 Design Review — R1

**Submitted archive:** `Plan Review and Publish (13).zip` (valid 22 MB ZIP)
**Reviewed scope:** CD-043 / SCR-VIR-720 / P06B / DSG-038
**Verdict:** **BLOCKED — not ready for design acceptance or frontend implementation.**

The package makes several important conceptual corrections: it uses an inspector-operated model, avoids a fake video tile, separates the provider boundary from inspection truth, and labels several provider/evidence gaps. Those strengths do not overcome the release-gate failures below.

## Evidence findings

The submitted ZIP contains CD-025 through CD-042 material, root source files, `screens/`, and other historical artefacts in addition to `outputs/cd-043-r1/`. Its preflight says the ZIP root contains only `outputs/cd-043-r1/`; that is false.

Every candidate and final-state export measures **909×540 px**, including files labelled desktop, 1024, and 412. They are not native 1440/1024/412 exports. More seriously, the exported files are not faithful state evidence: frames labelled S02, S04, and S10 visibly retain the harness selector’s default **“S01 · Verified — ready to begin”** state. The intended state content is not visible in the captured viewport. The same layout/header dominates the state files, so a reviewer cannot inspect the provider-down, validation, closure, or recovery designs from the delivered PNGs.

## Blocking findings

| ID | Severity | Finding | Evidence | Required correction |
|---|---|---|---|---|
| CD43-R1-01 | P0 | False clean-archive PASS. The final ZIP is contaminated with unrelated CD-025–CD-042 packages and root artefacts. | Archive listing for `Plan Review and Publish (13).zip`. | Submit a new ZIP whose only root is `outputs/cd-043-r2/`. Measure the final ZIP itself before declaring PASS. |
| CD43-R1-02 | P0 | Required native exports are absent. All candidate/final PNGs measure 909×540 rather than the requested 1440/1024/412 sizes. | Measured candidate and final assets. | Export full, lossless, native frames at exact viewport widths. A fit-scaled harness capture and a width label are not evidence. |
| CD43-R1-03 | P0 | Required state evidence is invalid. PNGs labelled S02/S04/S10 retain the harness’s S01 selector and crop before the state-specific content is visible. | `S02-INPROGRESS`, `S04-PROVIDERDOWN`, `S10-VALIDATION` static exports. | Capture each selected state after state selection, at a viewport that visibly includes its status, action/disabled control, recovery, provenance consequence, and engine effect. Include a reproducible capture manifest. |
| CD43-R1-04 | P0 | The package deliberately did not open any required source, despite the CD-043 prompt requiring actual source receipt. Its derived model is therefore not a code-ready hand-off. | `source-receipt.md`; `runtime-truth-ledger.md`. | Open every assigned source and cite the exact behavior. Correct classifications against the working tree; unsupported seams remain `HANDOFF_BLOCKED_*`. |
| CD43-R1-05 | P1 | It renders a **“Retry provider”** button and asserts a lost provider connection although no provider adapter exists. This is an actionable fake control and an unsupported runtime event. | `cd43r1-stage.js` provider-unavailable state; `interaction-contract.md` S04. | Replace it with a non-actionable blocked boundary or add an approved provider adapter contract with real action/result semantics. Never offer retry where no provider connection exists. |
| CD43-R1-06 | P1 | It claims a shared-engine timeline event for “opened on shared engine,” but `beginRemote` records only the begin event; no such event is established. | `implementation-handoff.md` §5 versus `apps/web/src/app/virtual/[id]/actions.ts`. | Remove the event claim or define and implement an approved, audited event seam. |
| CD43-R1-07 | P1 | Physical follow-up is shown as a governed outcome “recorded against the visit,” but no concrete action, data write, or audit seam is established. The current close action records closure reason/comments only. | `interaction-contract.md`; `cd43r1-stage.js`; `closeSession`. | Mark physical follow-up creation as `HANDOFF_BLOCKED_PHYSICAL_FOLLOW_UP_SEAM` until its canonical workflow, authority, persistence, and audit are proved. Do not represent it as recorded. |
| CD43-R1-08 | P1 | The close-path design overstates current behavior. `closeSession` can be used for any non-closed session and returns an error when inspector notification enqueue fails after closure; the current UI does not expose a trustworthy “closed succeeded / notification degraded” split. | `apps/web/src/app/virtual/[id]/actions.ts`; `Room.tsx`. | Treat distinct close-success/notification-degradation UX as a required implementation hand-off, with a verified response contract. Do not call it current runtime behavior. |
| CD43-R1-09 | P1 | The design depicts a continuity checklist/evidence rail without an established read model in this virtual screen. The current `beginRemote` redirects to `/field/inspection/:id`; the virtual room does not fetch/render P07 checklist or evidence data. | `Room.tsx`; `actions.ts`; package wiring map. | Keep the virtual page to its proven session boundary and deep-link, or specify the exact read contracts/RLS/loading/error states for an embedded shared-engine summary. Do not call a static checklist live continuity. |
| CD43-R1-10 | P1 | Accessibility/RTL claims cannot be certified from the deliverables because there are no true 412/1024 exports and the state UI is below the captured fold. | `accessibility-rtl.md` versus measured PNGs. | Re-run keyboard/focus/RTL/reflow evidence at actual native dimensions with visible relevant controls and state announcements. |
| CD43-R1-11 | P2 | The 20 thumbnails are individually exported but mostly generic coloured bar layouts. They are too abstract to demonstrate materially different information architectures or substantiate the candidate decision. | `20-thumbnails/CD-043_concept_01…20.png`. | Keep 20 individual files, but make each show legible, structural variation: session control, shared-engine context, provider boundary, evidence adequacy, and close consequence. |

## Runtime truth confirmed in the repository

- `beginRemote` is guarded by `verified`/`in_progress`, creates or reuses the inspection against the frozen package, advances the session once, appends a `begin` event, then redirects to `/field/inspection/:id`.
- `closeSession` requires a reason, writes the closed state/reason/comments, and closed sessions are immutable. Notification enqueue failure is not currently represented as a clean success-plus-degradation result.
- The current virtual room has a provider-pending placeholder only. There is no live provider connection to lose or retry, and no media/evidence-capture adapter.
- The server verification gate remains a correct hard predecessor.

## R2 acceptance threshold

R2 is reviewable only with a clean single-root archive, true native complete state exports, genuine source receipt, no fake provider action/event, and every claimed checklist, follow-up, timeline, and notification behavior either proven by a concrete runtime seam or honestly blocked. Keep the inspector-operated, provider-neutral direction and the no-fake-media rule.

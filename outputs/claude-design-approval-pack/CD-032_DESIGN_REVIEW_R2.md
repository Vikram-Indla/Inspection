# CD-032 Design Review R2 — Invasive Independent Review

**Submitted file:** `/Users/vikramindla/Downloads/Plan Review and Publish (10).zip`  
**Reviewed target:** `outputs/cd-032-r2/` / CD-032 / SCR-WEB-500 / Operations Center  
**Result:** **BLOCK — not ready for design approval or implementation handoff**

## Decision

R2 corrects important R1 runtime-truth mistakes: the source-backed corrective-action write, local CSV export, and local notification-handled write are now acknowledged; the nonexistent resolved-alert source is withdrawn. That is real progress.

It nevertheless fails on package integrity and visual proof. The submitted R2 folder has 17 files and no screenshots, no package preflight, and no inventory, even though its handoff explicitly says all of those are included. Therefore its high-quality visual, RTL, responsive, target-size, state, and three-hypothesis claims are unevidenced. The only included CD-032 images are R1 evidence; those are 909×540px despite their `1440` names and visibly keep the task-critical spine/map/action area below the first viewport.

## P0 blockers

| ID | Finding | Evidence | Required correction |
|---|---|---|---|
| CD032-R2-P0-01 | **R2 is missing all visual evidence.** | `outputs/cd-032-r2/` contains 17 non-PNG files. It has no hypothesis images, state images, desktop 1440 proof, 1024 proof, narrow proof, AR/RTL proof, focus proof, or pixel-dimension record. | Re-render every R2 state and each full-fidelity A/B/C hypothesis. Include actual pixel dimensions in the state/frame index. |
| CD032-R2-P0-02 | **The handoff package inventory is false.** | `CLAUDE_CODE_HANDOFF_CD-032.md` says the package contains `PACKAGE_INVENTORY_CD-032.csv`, `PACKAGE_PREFLIGHT_CD-032.md`, and evidence PNGs. None exists in `cd-032-r2`. | Do not claim files exist until they are in the submitted root. Make the preflight inspect the final ZIP, not a local/aspirational folder. |
| CD032-R2-P0-03 | **The submitted ZIP is contaminated.** | The final ZIP has 573 files, 16 CD revision roots, root-level source/helpers, `screens/`, and `uploads/`. It is not a single CD-032 R2 package. | Submit a separate ZIP whose sole root is `outputs/cd-032-r2/`; it must contain no other CD material or loose files. |
| CD032-R2-P0-04 | **R2 has no measurable final preflight.** | No `PACKAGE_PREFLIGHT_CD-032.md` exists in R2, despite the package’s claims of ≥1440px proof, target measurement, and single-package status. | Add final ZIP listing, all local-reference resolution results, SHA-256 values for A/B/C, per-PNG measured dimensions, state-to-PNG mapping, target-size measurements, and revision grep. End `PACKAGE_PREFLIGHT_PASS` only if all checks actually pass. |

## P1 design, evidence, and handoff failures

| ID | Finding | Evidence | Required correction |
|---|---|---|---|
| CD032-R2-P1-01 | **The only visual proof is invalid and cannot stand in for R2.** | All included R1 files named `*_1440.png`, including S01 and each A/B/C hypothesis, measure **909×540px**. R2 has no replacement images. | Capture R2 from real 1440px-or-wider viewports. Do not relabel scaled/cropped exports as 1440. |
| CD032-R2-P1-02 | **The retained R1 first viewport fails the primary-decision test.** | In the supplied normal and hypothesis images, the shell, title, scope chips, refresh line, source copy, and oversized three-way switch consume the frame. The ranked attention spine, linked map/list, record rail, and corrective action are not visible. | Make the first desktop viewport show the ranked priority, its linked evidence context, the permitted next action, and its guard. Compress header/scope/switch into one compact command band. |
| CD032-R2-P1-03 | **The claimed R1 three concepts are not demonstrated as materially different task architectures.** | The supplied HYP-A and HYP-B visible viewports share the same shell/title/scope/refresh/source/switch stack; the only visible distinction is which truth-layer option is selected. R2 supplies no A/B/C evidence. | Produce a 20-concept lab, then three full, equal-fidelity architectures that visibly differ in task hierarchy and first decision—not merely panel order or selected lens. |
| CD032-R2-P1-04 | **The wiring map uses a nonexistent runtime table name.** | `WIRING_MAP_CD-032.csv`, leg 7, names `corrective_actions`. Actual `apps/web/src/app/operations/page.tsx` queries `action_forms`; `updateActionFormStatus` updates `action_forms`. | Correct leg 7 and every dependent inventory/acceptance reference to `action_forms`; cite exact source symbols. |
| CD032-R2-P1-05 | **R2’s runtime certification remains self-declared rather than independent.** | The manifest/research say `BASELINE_REVERIFY_REQUIRED`; the handoff says sources were “reasoned about,” while the package marks 24 wiring legs as PASS. | Keep only directly verified legs as proven, clearly separate design intent from runtime evidence, and retain independent Codex audit as a real gate. |
| CD032-R2-P1-06 | **The package has not executed the new progressive quality ratchet.** | It documents only three hypotheses; there is no 20-concept lab, quality-memory acknowledgement, or measured evidence package. | Add `QUALITY_MEMORY_ACK_CD-032.md`, a 20-thumbnail concept lab, a decision log, and the complete evidence/index/preflight set. |

## Runtime findings confirmed as materially improved

- `updateActionFormStatus` exists and allows `acknowledged`/`closed` while preventing updates to closed rows; closed is terminal in this action path.
- `markNotificationHandled` updates the scoped `notifications.delivery_state` to `handled`; this is not provider delivery/receipt.
- `OpsExport` exists for local current-scope CSV export.
- `/operations` reads notifications but does not load an alerts table/resolved-alert field. No alert-resolution capability should be claimed.
- `/operations` reads `action_forms`, not `corrective_actions`.

## Non-negotiable R3 acceptance test

1. One clean R3 ZIP, one top-level `outputs/cd-032-r3/` root, and an exact final archive listing.
2. Complete package contents match the handoff claim—no missing preflight, inventory, or evidence.
3. Twenty genuinely different concept thumbnails; three visibly different, equal-fidelity, true-1440px desktop concepts; selected direction justified by the primary operations decision.
4. Every state in `STATE_MATRIX_CD-032.csv` has a true rendered R3 PNG, including EN/AR RTL, dark/light, 1024, 412, focus/keyboard and all error/recovery states.
5. The first 1440px viewport visibly contains the ranked priority, linked evidence context, record/action consequences, and current permitted action—not just context controls.
6. Correct `action_forms` source mapping and re-run an independent runtime/wiring audit.

**Status: BLOCKED. No sponsor approval or implementation authorization.**

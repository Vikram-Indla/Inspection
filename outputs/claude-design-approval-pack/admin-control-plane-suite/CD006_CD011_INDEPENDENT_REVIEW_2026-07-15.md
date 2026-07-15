# Independent review — CD-006 through CD-011

**Review date:** 2026-07-15
**Scope:** CD-006, CD-007, CD-008, CD-009, CD-010, CD-011 only. CD-004 and CD-005 were not reviewed, changed, or used as approval evidence.
**Archive reviewed:** `MVP1 UXUI refinement program (1) 2.zip`
**Archive SHA-256:** `46bc5563e38fa5018594d99652a3701838160ced6027b6adbad054509e3bb86f`

## Gate result

**Overall verdict: FAIL — do not sponsor-approve and do not implement any of CD-006 through CD-011.**

The visual direction is coherent and materially more intentional than a generic admin CRUD surface: the regulation trace rail, version-led package register, governed package studio, violation trace ribbon, and penalty conflict lens are appropriate inspection-domain ideas. CD-006 through CD-010 also have internally consistent PNG checksums. That is not enough for a code-ready design approval.

Every manifest says the repository was not freshly read and records `source_branch`, `source_commit`, and `dirty_worktree` as `unknown`. This violates the mandatory repository-discovery and deterministic handoff contract. As a result, the packs cannot prove their file inventory, runtime behavior, RLS, audit behavior, or state transitions. CD-011 additionally has no design images or evidence manifest at all despite declaring them in its manifest.

## Evidence checked

| CD | Logical screen | Delivered design evidence | Verdict |
| --- | --- | --- | --- |
| CD-006 | SCR-ADM-011 — Regulation detail & version | 6 PNGs, evidence manifest, handoff files | **FAIL** |
| CD-007 | SCR-ADM-020 — Item catalogue | 6 PNGs, evidence manifest, handoff files | **FAIL** |
| CD-008 | SCR-ADM-030 — Package library | 6 PNGs, evidence manifest, handoff files | **FAIL** |
| CD-009 | SCR-ADM-031 — Package & form designer | 6 PNGs, evidence manifest, handoff files | **FAIL** |
| CD-010 | SCR-ADM-040 — Violation catalogue | 6 PNGs, evidence manifest, handoff files | **FAIL** |
| CD-011 | SCR-ADM-041 — Penalty mapping | No PNGs; no evidence manifest; 7 text files only | **FAIL** |

For CD-006 through CD-010, all 30 delivered PNG SHA-256 values match their evidence manifests. This confirms package integrity, not behavioral correctness. The supposed iPad images are 700×520 pixels, not verifiable 1024×1366 evidence; they are named `*_1024x1366_scaled.png` and must be replaced or accompanied by native-resolution exports.

## P0 findings — block approval

### P0-01 — Mandatory repository discovery was skipped for every CD

All six implementation manifests state that the branch, commit, and dirty worktree are unknown because there was no fresh repository read. They also describe the current responsibility of affected files as unknown.

The governing prompt requires the current code and screen-specific sources to be inspected, the branch/commit/worktree state to be recorded, and an exact path-by-path replacement contract. `HANDOFF_BLOCKED` is valid only after a real inspection identifies missing runtime evidence; it cannot substitute for doing the required discovery.

**Required correction:** Re-run each CD against one recorded source snapshot. Replace every unknown current responsibility with verified source evidence, or mark only the genuinely absent behavior `HANDOFF_BLOCKED` with its missing evidence and owner.

### P0-02 — CD-011 is not a reviewable design package

CD-011 declares `CD-011_SCR-ADM-041_primary.png` and `..._outlier.png`, nine frame IDs, and RTL/theme/iPad coverage. None of those images exist in the archive. It also lacks `EVIDENCE_MANIFEST_CD-011.csv`. There is no visual artifact from which the three-column penalty workspace, conflict lens, Arabic layout, responsive behavior, or accessibility claims can be checked.

**Required correction:** Regenerate CD-011 completely before any further review: primary and critical-outlier PNGs, native-resolution responsive evidence, EN/AR dark/light evidence, an integrity manifest, component map, state coverage, and a source-derived wiring map.

### P0-03 — Multiple wiring claims conflict with the actual admin runtime

The following are not safe to hand to implementation as “current-after-modify” or protected current behavior:

| CD | Design-pack claim | Verified runtime fact | Required correction |
| --- | --- | --- | --- |
| CD-006 | W05 presents a mapped-clause validation gate and a locked published regulation as a current-after-modify path. | `publishRegulation` directly updates a draft regulation to `published`; it does not validate mapped clauses. Regulations have no published-version immutability trigger. | Mark both as blocked or obtain approved backend/transition/audit design before calling the path ready. Do not represent the UI lock as enforced. |
| CD-007 | The pack treats the item schema, actions, and RLS as unconfirmed. | The route already reads item code, title, active state, score weight, response model, evidence rule, and clause join; actions create items and toggle active state. | Replace unknowns with verified fields/actions and state precisely which package-use/impact query remains unavailable. |
| CD-010 | The manifest protects assumed audit triggers for violation-code changes. | Audit triggers cover `regulations` and `package_versions`, but not `violation_codes` or `penalty_mappings`. | Remove the unsupported audit claim; block audit visibility or create it only through approved scope. |
| CD-011 | The pack calls the `penalty_mappings` schema unconfirmed and proposes lifecycle, overlap/gap, and approver behavior. | The schema exists: one mapping per violation (`violation_code_id` is unique), `penalty_ref`, JSON range/repeat rules, legal basis, and mapping version. It has no effective-period fields or submit/approve/publish lifecycle. | Design from the actual schema. Keep conflict/lifecycle capabilities explicitly blocked unless approved as a new governed change; never imply they are current. |

## P1 findings — required before re-review

### P1-01 — State evidence is incomplete and not traceable

The packs assert that all mandatory states are addressed, but CD-006 through CD-010 contain only six PNGs each and no state matrix. The claimed nine frame IDs cannot be mapped to delivered visual artifacts. This does not prove the required loading, empty, validation, unauthorized, read-only, stale/degraded, failure, and recovery states.

**Correction:** Add a state-to-evidence table for each CD, with one row per required contract state and a named artifact/frame. Include behavior, role, data source, negative path, focus/announcement behavior, and whether it is current or `HANDOFF_BLOCKED`.

### P1-02 — Device evidence does not prove the claimed iPad requirement

All five `*_ipad_1024x1366_scaled.png` files are 700×520. They may be useful previews, but they cannot verify the specified 1024×1366 layout, target size, overflow behavior, keyboard order, or RTL density.

**Correction:** provide native 1024×1366 exports (or a documented native source and a separately scaled display preview).

### P1-03 — Full action/system-state wiring is absent

The design prompts require one wiring row for every user action and system state. The delivered maps cover selected happy-path actions and some proposed failure paths, but do not account for the complete screen-state contract. A `HANDOFF_BLOCKED` label is correctly used in several places, but its breadth shows the packs are not yet implementation-ready.

**Correction:** expand each wiring map to cover every state in the authoritative screen state matrix. A failed/unavailable dependency must render unavailable/unknown rather than zero or success.

### P1-04 — CD-008 and CD-009 need a real source pass despite sound concepts

The version-led library and governed studio are the strongest visual concepts in this group. However, their manifests still say the existing components and responsibilities are unknown. CD-008 must reconcile the live `package_version_impact` RPC and existing publish validation; CD-009 must inspect the actual draft-definition structure before it specifies section/rule/evidence editing, simulations, or circular-condition handling.

**Correction:** retain the concepts, but replace every assumption with source-derived data contracts, exact component exports, and concrete test evidence.

## Per-CD verdicts and next action

| CD | Verdict | Next allowed action |
| --- | --- | --- |
| CD-006 | **FAIL** | Reconcile the regulation lifecycle, clause validation, audit access, and immutability with current code and contract; mark unresolved changes blocked. |
| CD-007 | **FAIL** | Rebuild the manifest and wiring map from the existing item route/actions/schema; retain only genuinely unavailable use-impact behavior as blocked. |
| CD-008 | **FAIL** | Keep the visual direction, then inspect package files/RPC/publish validation and supply full state/native iPad evidence. |
| CD-009 | **FAIL** | Inspect the live package-definition and editor composition; do not offer simulation/detector behavior as ready until an approved engine exists. |
| CD-010 | **FAIL** | Correct the actual violation schema and remove unsupported audit claims; provide complete lifecycle/error-state evidence. |
| CD-011 | **FAIL** | Regenerate the entire missing visual/evidence package, then perform a source-derived wiring audit. |

## Correction sequence

1. **Freeze implementation.** None of these six manifests authorizes application, database, or contract changes.
2. **Regenerate CD-011 first.** It is incomplete and cannot enter review.
3. **Run fresh discovery for CD-006 through CD-011** against one recorded branch/commit/dirty state; update each manifest, component map, and wiring map from that evidence.
4. **Reconcile lifecycle, RLS, and audit truth** before visual correction. Do not use UI labels to imply enforcement the route/database does not provide.
5. **Produce complete state coverage and native device exports.** Map every required state to a named visual/evidence artifact.
6. **Submit the corrected packs for an independent R1 review.** Only a clean review with no P0/P1 findings can proceed to sponsor design approval; implementation still requires explicit separate authorization.

## Review disposition

This review does not self-approve a business decision and does not modify application code, database behavior, product-contract artifacts, the shared shell, or CD-004/CD-005.

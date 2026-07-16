# CD-027 Design Review R1 — Visit Detail

- Review date: 2026-07-14
- Submitted archive: `/Users/vikramindla/Downloads/Plan Review and Publish.zip`
- Package reviewed: `CD-027 / SCR-WEB-210 / P03 — Visit Detail R1`
- Scope: design source, package, visual-evidence and wiring-artifact audit only. No application code or future implementation prompt was executed.
- Outcome: **BLOCK — two P1 package/evidence corrections are required before sponsor approval.**

## What is substantively correct

- The CD-027 package records `implementation_authorized: false` and its Claude Code-facing prompt begins with the required sponsor/Codex-audit execution prohibition.
- The runtime dossier faithfully separates planning, operational, assignment, inspection and review state; preserves RLS, append-only audit, immutable submissions, system-only expiry, private soft-deleted attachments and queued-not-delivered notification truth.
- The 14-leg wiring map truthfully marks attachment orphan recovery, raw-error neutralisation, map wiring, previous-inspector notification, cancellation assignment release, and cross-write atomicity as `HANDOFF_BLOCKED`.
- The state matrix covers the key final, partial-side-effect, attachment, stale/RLS, map-unavailable, Arabic/RTL, narrow and counterfactual states. The future handoff keeps blocked remediation out of ordinary UI work.

## P1-01 — Three equal-fidelity hypothesis exports are invalid

The required hypothesis files are all byte-for-byte identical:

| File | SHA-1 |
| --- | --- |
| `CD-027_SCR-WEB-210_HYP-A-PROVENANCE_dark_en_1440.png` | `bc17bf6d6633b2a41449cc3de96f2bb622b31ee4` |
| `CD-027_SCR-WEB-210_HYP-B-ACTION_dark_en_1440.png` | `bc17bf6d6633b2a41449cc3de96f2bb622b31ee4` |
| `CD-027_SCR-WEB-210_HYP-C-CHRONO_dark_en_1440.png` | `bc17bf6d6633b2a41449cc3de96f2bb622b31ee4` |

The shared export is an annotation-text fragment rather than three complete high-fidelity Visit Detail compositions. It does not visually prove the claimed provenance-dossier, action-boundary-first, and chronological-case-file alternatives, nor supports an evidence-based selection of the Dual-State Ribbon direction.

**Required correction:** regenerate three full, same-viewport, high-fidelity desktop frames using the same visit data, state tracks, action boundary, shell and hard state. The information architecture must differ materially:

- A: identity → Dual-State Ribbon → evidence-led chapters;
- B: action/guard boundary leads, with state/history persistent adjacent evidence;
- C: immutable chronology leads, with current-fact/action summary rails.

Export each independently, verify distinct file hashes and rendered image content, and include Arabic RTL + 412px feasibility evidence for the selected A direction. The counterfactual must show the actual populated A layout with the ribbon removed, not annotation text.

## P1-02 — The submission is an unsafe multi-package archive

The ZIP contains CD-027 R1 alongside CD-026 R1/R2, CD-025 R2/R3, root copies of all three design sources/scripts and `uploads/CD-025_PROGRESSIVE_CORRECTION_PROMPT_R2.md`. It therefore includes stale CD-025 Claude Code handoffs/prompts that are explicitly unsafe to execute, as well as unresolved CD-026 material.

**Required correction:** submit one clean archive containing only `outputs/cd-027-r1/` (or a synchronized `outputs/cd-027-r2/` if revising the package) and the files listed in that package’s inventory. Exclude every CD-025/CD-026 artifact, root duplicate, upload folder and historical implementation prompt.

## Sponsor disposition

Do not sponsor-approve CD-027 and do not execute `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-027.md` until both P1 corrections pass. Preserve the strong runtime/wiring truth in the package. The correction must not invent a map/provider, notification delivery, policy threshold, direct state mutation, cross-write transaction, or recovery leg.

## Resubmission test

1. Three hypothesis PNGs are visibly and bytewise distinct complete compositions at equal fidelity.
2. The selected A direction and its ribbon-removal counterfactual are visual, populated and reviewable.
3. CD-027’s Arabic/RTL and narrow proof remains synchronized with the selected direction.
4. The ZIP contains one CD-027 package only; all inventory paths resolve and no historical CD-025/CD-026 handoff exists.
5. `implementation_authorized: false`, the sponsor/Codex execution prohibition, and all existing `HANDOFF_BLOCKED` legs remain intact.

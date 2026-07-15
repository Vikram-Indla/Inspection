# CD-042 Design Review — R1

**Submitted archive:** `Plan Review and Publish (12).zip` (19 MB, valid ZIP)  
**Reviewed scope:** CD-042 / SCR-VIR-710 / P06B / DSG-037  
**Verdict:** **BLOCKED — correction required before design acceptance or frontend implementation.**

## Receipt and evidence integrity

The archive is technically readable and includes an `outputs/cd-042-r1/` package. It also includes a large amount of unrelated CD-025–CD-041 material and root-level source assets. The submitted `PACKAGE_PREFLIGHT.md` states that the ZIP root contains *only* `outputs/cd-042-r1/`; that statement is false.

The package also claims desktop, tablet, and narrow exports. Measurement of every candidate and final PNG shows a 909 px-wide harness capture (two frames are 924 px), including files labelled `desktop`, `1024`, and `412`. These are not the required native 1440/1024/412 deliverables. The evidence visibly crops the design: the proof rail and most of the work area are outside the image.

The “20 thumbnails” are five 909×525 contact-sheet captures dominated by explanatory text, not 20 independently inspectable visual architecture explorations. The required exploration evidence is therefore absent.

## Blocking findings

| ID | Severity | Finding | Evidence | Required correction |
|---|---|---|---|---|
| CD42-R1-01 | P0 | False archive-root PASS. The ZIP contains unrelated historical packages and source files, contrary to its preflight claim. | Archive listing includes root-level CD-025–CD-032 files, CD-041 files, `screens/`, `uploads/`, and many unrelated output directories. | Submit a new ZIP with one root only: `outputs/cd-042-r2/`. Run preflight against that final ZIP, and mark PASS only if the measured archive listing proves it. |
| CD42-R1-02 | P0 | Required dimensions are not delivered. Every advertised 1440/1024/412 final and candidate PNG is a 909 px crop; the preflight explicitly admits it. | Measured assets: 909×525/540 (or 924×525). | Produce native lossless screenshots at the exact requested viewport widths. Each must show the complete viewport and the complete selected layout—no cropped harness evidence, no width labels used as substitutes. |
| CD42-R1-03 | P0 | The design assigns OTP entry to a factory representative with a session-only authenticated surface. The actual runtime contract is staff-facing: the assigned inspector or authorised staff triggers OTP actions for the representative. Factory representatives have no Supabase Auth account and do not call the RPCs directly. | `supabase/migrations/0023_fix_otp_rpc_authorization.sql`; current `Room.tsx`. | Redesign the operator model: staff/inspector operates the verified session; the representative receives/provides the code in the supervised interaction. Do not create a factory-representative authenticated OTP console without an approved new identity/auth design. |
| CD42-R1-04 | P0 | Mandatory verification-failure coverage is incomplete. The accepted virtual design authority requires identity mismatch and provider-unavailable paths; the package substitutes generic unauthorised/degraded frames and does not provide these explicit failures. | `design/astryx/d7/D7-02_verify.html`; CD-042 state matrix S13/S17. | Add identity-mismatch and OTP-provider-unavailable frames. If runtime lacks the decision/action seam, label it `HANDOFF_BLOCKED_*`, preserve no-bypass behavior, and distinguish it from permission denial or generic linked-read degradation. |
| CD42-R1-05 | P1 | The package calls cross-participant visibility “unproven” but nevertheless designs the roster as a representative’s own screen, with own counters. Actual `Room.tsx` loops over all participants and the OTP authorization contract is staff/session scoped. `vp_otp_status` is not hardened by migration 0023. | `Room.tsx`; migrations `0009_virtual_otp.sql` and `0023_fix_otp_rpc_authorization.sql`. | Build a staff-scoped information architecture. Separate what the operator can see from what requires a server authorization decision. Do not claim participant-private counters or an external-representative shell without proof. Record the `vp_otp_status` scope gap as a backend hand-off, not resolved UX. |
| CD42-R1-06 | P1 | “Audit timeline” is presented as delivered interaction, but the live `Room.tsx` does not read/render audit events. The audit events exist in migrations; the screen data seam is not implemented. | `Room.tsx`; package claim versus source. | Mark audit-display data/loading as `HANDOFF_BLOCKED_AUDIT_READ_SEAM` or specify the exact approved query/RLS/data contract before showing it as live UI. Keep audit event creation and audit display separate. |
| CD42-R1-07 | P1 | The package’s candidate, final-state, and thumbnail images do not allow visual review of the claimed layout. The visible captures are text-heavy, clipped, and structurally indistinguishable at the supplied scale. | Candidate/final/contact-sheet PNGs. | Re-run exploration visually. Render 20 discrete thumbnails, three full candidate frames, and complete selected-state frames at native dimensions. Make the proof/gate/work-area relationship visible without relying on a hidden interactive harness. |
| CD42-R1-08 | P1 | The package repeatedly says source was not opened, despite the assigned prompt requiring it. That honesty is better than invented proof, but it makes the package ineligible for a code-ready hand-off and led directly to the operator-model error. | `source-receipt.md`; `RUNTIME_TRUTH_LEDGER_CD-042.md`. | Open every required source, cite exact functions/lines/behaviors, and replace `DERIVED_NOT_PROVEN` with a correct proof classification. Unsupported capability remains explicitly blocked. |

## Confirmed strengths to retain

- It correctly avoids showing the OTP value in the visual evidence.
- It distinguishes an individual verification from the all-representatives server transition in concept.
- It does not invent a manual approval button, offline queue, biometric, document capture, or video provider.
- It identifies zero-representative and closed-session conditions as non-progressing states.

## Acceptance condition for R2

R2 may be reviewed only when it supplies a clean single-root archive, native full-frame visual evidence, a staff-operated identity/OTP flow grounded in the repository, and explicit identity-mismatch/provider-unavailable failure evidence. The server-verified all-representatives gate must remain intact; no client flag, display name, or single representative can open CD-043.

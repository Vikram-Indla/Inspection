# CD-041 / CD-042 — Sponsor Signoff Checklist (DRAFT)

These are the gates that block CD-041/042 **screen** implementation. Claude cannot
clear any of them — each needs a human action. This checklist makes each one
concrete so you can clear them in order. Nothing here is self-approved.

## 1. Make the design reachable (blocks everything)
- [ ] Grant this session/login access to claude.ai design project `20cb0dce`, **or** export `outputs/cd-041-r1/CD-041_SCR-VIR-700_r1.dc.html` and `outputs/cd-042-r2/CD-042_SCR-VIR-710_r2.dc.html` into the repo.
- Why: DesignSync `get_file` → 404 "project not found" for this login; the files are not in the repo. Cannot read the composition to implement it.

## 2. Get the designs to a genuine review PASS
- [ ] **CD-041** — resubmit a valid r1 package (R1 was **REJECTED AT RECEIPT**, no artifact) and pass review.
- [ ] **CD-042** — resolve the R1 P0/P1 findings and pass review:
  - operator model = staff/inspector-operated (reps have no auth) — *code is already correct; the package must match it*;
  - explicit **identity-mismatch** + **OTP-provider-unavailable** states (CD42-R1-04);
  - **audit-read display seam** specified against a real query/RLS contract (CD42-R1-06);
  - source-cited proof, not `DERIVED_NOT_PROVEN` (CD42-R1-08).
- Why: `application edits begin only after design acceptance rows receive human signoff` (CLAUDE.md).

## 3. Record acceptance (sponsor signs)
- [ ] Set `DSG-036` (SCR-VIR-700) and `DSG-037` (SCR-VIR-710) to `accepted` in `DESIGN_ACCEPTANCE_MATRIX.csv`, with your name as reviewer + date.
- Draft rows ready: `PROPOSED_ACCEPTANCE_ROWS_DSG-036-037.csv` (status left blank for you).

## 4. Resolve or scope the video provider
- [ ] Decide the live-video provider, **or** explicitly scope the screen to defer it as Phase-2 with **no invented** connection/recording/consent/retention/bandwidth/access-token values.
- Why: hard rule — never invent providers/policy.

## 5. Activate the build slice (sponsor signs)
- [ ] Set `PROPOSED_SLICE_CD-041-042.yaml` `sponsor_signoff.signed: true`, `status: APPROVED`, `enforce_stop_gate: false`, `broad_implementation_allowed: true`, and install it as `CURRENT_SLICE.yaml`.
- Precondition: items 1–4 all done (the slice's `prerequisites` all TRUE).

---

## What's already done (so the slice doesn't re-do it)
- **Backend is live + proven**: verified-gate (PR #17, migration `20260715170000` live), OTP request/verify/status with RBAC-014 (PR #18, migration `20260715180000` live), forward-only + closed-immutable guards, append-only audit. Screens will bind to a real, tested backend — the remaining work is genuinely UI + a few data-read seams, not new behavior.

## What Claude will NOT do
- Mark DSG-036/037 accepted, edit `GATE_STATUS.md`, or expand the active slice by itself. Those are your signatures. (Sponsor direction itself excludes "self-approval of unresolved business decisions.")

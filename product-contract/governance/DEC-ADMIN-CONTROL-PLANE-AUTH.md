# DEC-ADMIN-CP-001 — Sponsor authorization to implement Admin Control Plane (CD-004…CD-011)

- **Decision ID:** DEC-ADMIN-CP-001
- **Date:** 2026-07-15
- **Approver / sponsor:** Vikram Indla (v.babuindla.c@mim.gov.sa)
- **Context:** The consolidated brief `CLAUDE_CODE_MCP_PROMPT_CD-004_TO_CD-011_CONSOLIDATED.md`
  gates each CD behind three conditions: (1) sponsor design approval, (2) independent
  wiring audit with no open P0/P1, (3) an explicit per-CD authorization flipping
  `implementation_authorized: true`. All eight r2 manifests currently read
  `implementation_authorized: false` / `READY_FOR_MANDATORY_*_REVIEW`.

## Authorization
The sponsor directly instructed implementation of all Admin features and an autonomous
build loop ("implement all Admin features and /loop until all implementation is done").
This instruction is recorded here as the **gate-3 explicit authorization** for the
Admin Control Plane vertical (CD-004 through CD-011). The r2 design packs and the
`CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md` memo supply gates 1 and 2 materially
(design approval packs + independent wiring audit/corrections).

## Scope of authorization
- Implement the proven wiring legs for CD-004…CD-011 on a non-`main` feature branch.
- Local verification only (typecheck / lint / build / e2e).

## Explicitly NOT authorized (parked — require separate sponsor go)
- Push / merge to `main`.
- Applying Supabase migrations against the live project.
- Cloud deployment.
- Any `HANDOFF_BLOCKED` leg (missing schema/policy/guard) — rendered as visibly
  disabled/annotated contract targets, never working controls.
- Inventing any policy value, threshold, SLA, legal rule, role, or monetary value.

## Constraints carried forward
All Section 0–4 rules of the consolidated brief remain binding: truth over completion,
frozen boundary (Shell/tokens/nav), no fixtures as runtime proof, `unavailable` never `0`.

# Session handoff — CD-012→019 Admin Control Plane (R3 frontend)

```yaml
slice: CD-012-019-admin-frontend
relation_to_active_slice: SEPARATE   # active = TASK-G11-REMEDIATION-001 (Codex, CD-006-011). No scope overlap.
date: 2026-07-16
branch: feat/cd-012-019-admin-frontend
base_commit: 0c9c897
head_commit: c40b03c            # + local evidence commits after this handoff
worktrees:
  - path: Inspection-cd-012-019     # implementation
    branch: feat/cd-012-019-admin-frontend
  - path: Inspection-integrate      # integration dry-run (local, UNPUSHED)
    branch: integrate/cd012-019-on-codex
    base: a6f0989                    # Codex "harden CD-006-011"
pr: open -> setup/Inspection (created in browser by owner)
status: FRONTEND_COMPLETE_VERIFIED; MERGE_GATED
scope: frontend-only              # no server actions, migrations, or shared backend touched
screens:
  CD-012: /admin/workflows  (SoD guard)
  CD-013: /admin/workflows  (quarantined designer lane boundary)
  CD-014: /admin/risk       (client RiskForm: live Σ, surfaced result; 500 bug found+fixed)
  CD-015: /admin/gis        (no change - already conformant)
  CD-016: -                 (no route by design)
  CD-017: /admin/access     (RLS note + 2 boundaries)
  CD-018: /admin/localization (lz-row split, placeholder-diff, AR-length, orphan)
  CD-019: /admin/audit      (RLS note + 2 boundaries)
verification:
  static: tsc PASS; next build PASS; GLOBAL COLOR LAW clean
  runtime_authed: all 6 admin routes render 200 (admin seed compliance_admin)
  write_round_trips:
    CD-018_saveTranslation: PASS (persist->draft->restore)
    CD-014_saveRiskSettings: PASS (persist->restore, rlsDenied=false)
    CD-012_maker_checker_SoD: PASS (propose->self-approve blocked); test draft cleaned from DB
  integration_vs_codex_a6f0989: PASS (tsc+build+authed drive+l10n/risk round-trips)
tests: apps/web/scripts/verify-admin.mjs  (VERIFY_ROUNDTRIP=1 | VERIFY_WF_SOD=1)
evidence:
  - outputs/cd-012-019-r2/WIRING_AUDIT_CD-012-019_R2_FRONTEND.md
  - outputs/cd-012-019-r3/WIRING_AUDIT_CD-012-019_R3_FRONTEND.md
design_of_record: R3 (byte-identical to R2, MD5-verified)
frozen_records_touched: NONE   # CURRENT_STATE.md / WORK_QUEUE.yaml / GATE_STATUS / AC_LEDGER untouched
pending_before_merge:
  - Codex backend landed on a canonical base
  - main-promotion authorization (active slice forbids it)
  - multi-branch reconciliation (parent baseline task)
not_done_by_design:
  - successful workflow publish (irreversible; needs 2nd user as maker)
  - CD-014 per-factory trace, CD-013 designer, CD-016 route, CD-017 change-workflow (contract-blocked -> honest boundaries)
```

## Human summary

CD-012→019 admin control plane implemented as a frontend-only pass over existing
routes, wired to existing server actions (unchanged). Design-of-record R3
(identical to R2). All eight screens addressed; six BUILDABLE_NOW screens verified
end-to-end authenticated, including two reversible write round-trips and the
maker-checker SoD negative path. Runtime driving caught and fixed a real `/admin/risk`
500 (server→client function prop) that `tsc`/`build` missed. A local integration
dry-run confirms the frontend is compatible with Codex's CD-006-011 backend.

The branch is pushed and its PR is open, but the **actual merge is intentionally
held**: the active remediation slice forbids main promotion, Codex's backend is not
yet on a canonical base, and multi-branch reconciliation belongs to the parent
baseline task. No frozen product-contract records were modified — that is a separate
change-control step.

## Session end (2026-07-16)

- Scratch integration worktree `Inspection-integrate` and branch
  `integrate/cd012-019-on-codex` removed after the dry-run passed. No product code
  affected; the dry-run evidence is captured above.
- CD-012-019 frontend slice records are current: tests (`verify-admin.mjs`),
  evidence (`WIRING_AUDIT_*`), and this handoff are committed on
  `feat/cd-012-019-admin-frontend`.
- **Out of scope for this session:** the now-active slice
  `TASK-G11-G12-RELEASE-001` (live migration certification, main promotion,
  production deploy) is Codex's release work — it requires live DDL / prod actions
  this session is explicitly limited from and cannot mark PASS. No CD-012-019
  test/evidence delta remains; the frozen release ledger/state are Codex's to update
  under that slice's approval.

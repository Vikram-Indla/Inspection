# Task A resume checklist — unblock on Supabase token

Task: TASK-BASELINE-WIRING-AUDIT-001. **HELD 2026-07-15** pending a Supabase access
token (or interactive `supabase login` / DB password). Project linked = `iiozvqntawxfwbgffzqu`.

## Code state (all committed on feat/admin-control-plane, also on origin/setup/Inspection)
- CD-001/002/003/020/023 = PASS. CD-021/022 = PASS pending migration cert.
- CD-024 = IMPLEMENTED_PENDING_DEC012_AUDIT (commit 16a55d4).
- Admin CD-004..011 = built + landed (commit 4e24096).
- Governance: DEC-024 resolved (route-neutral /planning/bulk/review); CD-024 R2 approved.

## When the token lands — run in order
1. `export SUPABASE_ACCESS_TOKEN=<token>` (or `supabase login`); `supabase migration list` to confirm auth.
2. Apply pending migrations (forward-only):
   - CD-021/022: `20260714091726` (adds `validated`), `20260714091727` (atomic single publish).
   - Admin AR strings: `20260715100000`, `101000`, `102000`, `103000`.
   - CD-006 backend (from feat/cd-006-regulation-detail-and-version `0c9c897`, after reconciliation): `20260715173000_admin_configuration_audit.sql`.
   - Seed CD-024 AR keys (`plan.review.ev.*` / `plan.review.ec.*`) via a new `ui_strings` migration.
3. Re-run the excluded live tests: CD-021/022 publish/rollback; full Playwright regression with no exclusions.
4. DEC-012 independent Codex wiring audits: CD-024 (vs WIRING_MAP_CD-024.csv, incl. the manifest-vs-CD-025 additive reconciliation) and the CD-006 backend reconciliation.
5. Reconcile `feat/cd-006-regulation-detail-and-version` (`0c9c897`) — integrate the admin backend audit layer onto the vertical (see CD-006_BRANCH_RECONCILIATION_DISPOSITION_2026-07-15.md); update the previously-blocked admin legs to live where now proven.
6. Consolidate the validated commit graph to `main`, push, verify the remote main tip; then delete stale branches only after proving their unique work is represented.

## Parked companions
- ${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/admin-control-plane-suite/PARKED_ITEMS_ADMIN_VERTICAL.md
- product-contract/evidence/CD-006_BRANCH_RECONCILIATION_DISPOSITION_2026-07-15.md
- product-contract/evidence/CD-024_IMPLEMENTATION_EVIDENCE_2026-07-15.md

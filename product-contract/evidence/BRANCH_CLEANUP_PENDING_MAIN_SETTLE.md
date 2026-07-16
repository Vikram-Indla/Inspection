# Branch cleanup — HELD until main settles (2026-07-16)

`origin/main` exists (`ebbb173` at hold time) but is **actively moving** under the
concurrent `TASK-G11-G12-RELEASE-001` process. Branch deletion is paused so a
representation proof cannot be invalidated mid-flight.

## Already deleted (proven stable-ancestor of main)
- `feat/admin-control-plane` (remote + local) — all commits contained in `main`.

## Held — re-verify against a SETTLED main before deleting
| Branch | Why held |
|--------|----------|
| `fix/migration-live-reconciliation` | Unique files not cleanly in main: `supabase/migrations/20260715190000_cd042_audit_read_seam.sql`, `..180000_field_arrival_evidence.sql`, `..193000_..column_repair.sql`, `apps/web/e2e/cd-006-regulation-publish-provenance.spec.ts`, `cd-042-audit-read-seam.spec.ts`, `outputs/cd-042-r2/AUDIT_READ_SEAM_CONTRACT.md` |
| `feat/cd-025-plan-review-publish` | Unique `apps/web/src/app/reviews/actions.ts` (+57) absent from current main |
| `baseline/consolidated-2026-07-15` | My release candidate; content in main; keep as provenance until main confirmed final |

## Do NOT delete
- `setup/Inspection` (default line), `main` (target).
- New concurrent-release branches — unanalyzed, active work: `feat/cd-012-019-admin-frontend`, `codex/g11-g12-integration`, `codex/*`.

## Resume procedure (when main is final)
1. `git fetch origin --prune`.
2. For each held branch B: confirm `git rev-list origin/main | grep <B-tip>` (ancestor) OR
   `git diff origin/main..B --numstat | awk '$2==0 && $1>0'` filtered of `.next-stale-backup/` +
   `supabase/.temp/` shows NO real files. If unique real files remain, fold them first.
3. Delete only proven-represented branches: `git push origin --delete B` + `git branch -D B`.
4. Never delete `setup/Inspection` or `main`.

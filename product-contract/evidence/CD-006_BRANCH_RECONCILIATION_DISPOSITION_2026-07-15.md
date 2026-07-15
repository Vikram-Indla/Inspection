# CD-006 branch reconciliation disposition — 2026-07-15

Task: TASK-BASELINE-WIRING-AUDIT-001 (branch reconciliation requirement).
Recorded by: Claude Code, continuation session.

## The preservation boundary
`feat/cd-006-regulation-detail-and-version` (`0c9c897` — "feat(admin): harden
control-plane backend") carries **one unique commit not represented by
`origin/setup/Inspection`**. It is real, in-scope-authorized work, not stale noise.

### What it contains
- `apps/web/src/lib/admin-configuration.ts` (NEW): `requireConfigurationWriter()` —
  an application-level, fail-closed configuration-writer guard (defence-in-depth
  over RLS) + neutral error / read-failure helpers.
- `supabase/migrations/20260715173000_admin_configuration_audit.sql` (NEW, forward-only):
  - adds `trg_audit_*` row-audit triggers to `regulation_clauses`, `inspection_items`,
    `violation_codes`, `penalty_mappings`;
  - adds `created_by`, `approved_by`, `published_at` + `regulations_maker_checker`
    constraint to `regulations`;
  - `guard_published_regulation()` — published-record immutability at the DB boundary.
- Edits to admin `actions.ts` / `page.tsx` across regulations/items/packages/violations
  to consume the new guard and surface the new audit/maker-checker evidence.
- `apps/web/e2e/cd-006-admin-backend-foundation.spec.ts`, plus a `HUMAN_APPROVALS.yaml` row.

## Relationship to the landed Admin vertical (CD-004..011, commit `4e24096`)
This commit is the **backend half** of the same Admin Control Plane. It closes
several legs the landed UI vertical deliberately rendered as `HANDOFF_BLOCKED`
(no admin route guard; no audit trigger for clauses/items/violation_codes/
penalty_mappings; no regulation maker-checker / published lock). Integrating it
therefore *strengthens* the contract — it does not weaken accepted behaviour.

## Why it is NOT merged in this session
1. **File conflict** — both this commit and the landed vertical edit the same admin
   `actions.ts`/`page.tsx` differently; integration is a deliberate 3-way merge,
   not a fast-forward.
2. **Behaviour/contract change** — flipping blocked legs (audit, maker-checker,
   immutability) to live must be re-verified against the contract and the UI
   updated so the previously-disabled targets now reflect proven behaviour.
3. **Migration-gated** — `20260715173000` must be applied to the live project
   before the new legs can be certified; no Supabase access token / DB password
   is available in this session (same blocker as the parked admin AR migrations).
4. **DEC-012** — the merged result requires a fresh independent wiring audit; the
   guard/audit/maker-checker legs cannot be self-certified.

## RECONCILED 2026-07-15 ✅
The unique work of `0c9c897` is now represented in the baseline:
- Migration `20260715173000_admin_configuration_audit.sql` — confirmed **already
  applied live** on `iiozvqntawxfwbgffzqu` (all objects exist); added to source.
- `apps/web/src/lib/admin-configuration.ts` added to source.
- `requireConfigurationWriter()` wired into all config-writing admin actions
  (defence-in-depth over RLS); existing validation preserved.
- Now-true legs flipped to live (maker-checker, published immutability, config-table
  audit triggers); audit-timeline READ views correctly kept blocked (no
  `audit_events` SELECT grant to config roles).
- HUMAN_APPROVALS row `CD-006-011-backend-authorization` recorded.
- Commit `7862282`. tsc 0, next build 0/0, color-clean.
- Branch is now a **deletion candidate** once the baseline is consolidated + pushed
  (still gated on the release/change task + main consolidation). Do not delete yet.

## Disposition (superseded by RECONCILED above)
- **PRESERVE** `feat/cd-006-regulation-detail-and-version`. Do NOT delete; do NOT
  silently absorb.
- **Recommended follow-up (own slice, sponsor-scoped under DEC-ADMIN-CP-001):**
  1) integrate `0c9c897` onto the admin vertical, resolving the shared-file merges;
  2) apply migration `20260715173000` once a Supabase token is provided;
  3) update the vertical's `HANDOFF_BLOCKED` targets to live where now proven;
  4) obtain an independent DEC-012 audit; then
  5) the branch becomes a deletion candidate once its unique work is represented.
- Until then it remains an explicit open reconciliation item on
  TASK-BASELINE-WIRING-AUDIT-001.

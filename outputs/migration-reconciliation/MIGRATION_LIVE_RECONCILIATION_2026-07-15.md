# Migration Source ↔ Live Reconciliation — 2026-07-15

**Project:** `iiozvqntawxfwbgffzqu` (configured Inspection project)
**Goal:** eliminate all source-vs-live migration drift (the WA-06 class: a migration committed in source but never applied live). Closes the slice dependency "Migrations 0026, 0027..0031 and 20260714060935 … verified against the configured project" and the G5 note "`evidence.evidence_note` is absent from the current live schema."
**Method:** the live project has **no** `supabase_migrations.schema_migrations` table, so applied state was proven by **probing objects**, not a version list. Pulled the full live catalog (functions incl. `private` schema, tables, columns, indexes, policies incl. `storage` schema, triggers) and diffed every DDL object created by the 56 migration files against it.

## Result: zero real drift after remediation

### Real drift found + fixed
| Migration(s) | Object | Was | Action |
|---|---|---|---|
| `20260715180000_field_arrival_evidence.sql` + `20260715193000_..._column_repair.sql` | enum `evidence_link` value `arrival` **and** column `evidence.evidence_note` | **both absent live** (the repair's "enum already present" assumption did not hold for this project — neither part was applied) | Applied live via Management API: `alter type evidence_link add value if not exists 'arrival'` (standalone) + `alter table evidence add column if not exists evidence_note text`; PostgREST reloaded. Verified: `arrival_enum=1`, `evidence_note=1`. Forward-only, additive, no RLS widened (M04-045). |

This resolves the **G5** open item. The two migration files were **untracked** (on disk, never committed); this PR commits them so the recorded baseline matches live.

### Parse artifacts — verified NOT drift
| Flag | Reality |
|---|---|
| `0002` `journey_sessions.journeys_rw` | Superseded — `0021_fix_broad_rls` dropped `journeys_rw` and split it into `journeys_select` / `journeys_update` / `journeys_write` (all live). |
| `0002` `trg_audit_` | Dynamic trigger-name prefix built by `execute format('… trg_audit_%I …')` — not a literal name. |
| `0020_fix_plans_attachments` `attachments_objects_read/insert` | Live in the **`storage`** schema on `storage.objects` (confirmed); the diff mis-parsed the schema-qualified table. |
| `0027` `is_owned_inspector_immediate`, `audit_immediate_attempt` | Moved to the **`private`** schema by `0028_cd023_private_helpers` (`alter function … set schema private`); both present in `private` live, plus `create_immediate_visit` in `public` and `guard_assignment_window_overlap` (0031). CD-023 chain fully applied. |

## Slice-dependency verification (0026–0031, 20260714060935)
All objects present live: `create_immediate_visit` (public), CD-023 private helpers + overlap guard (private), CD-021 bulk-publish + CD-023 urgency/RLS objects. No drift.

## Live migrations applied this session (all now source-recorded)
- `20260715170000_cd041_verified_transition_guard` (PR #17)
- `20260715180000_cd042_otp_status_authorization` (PR #18)
- `20260715190000_cd042_audit_read_seam` (PR #21)
- `20260715180000_field_arrival_evidence` + `20260715193000_..._column_repair` (this PR)

## Recommended follow-up (needs sponsor — not self-applied)
- Update `product-contract/GATE_STATUS.md` G5 note: `evidence.evidence_note` is now present live (this reconciliation). GATE_STATUS is a frozen artifact; left for sponsor edit.
- Consider initializing `supabase_migrations.schema_migrations` on the live project so future drift is trackable by version, not object-probing.

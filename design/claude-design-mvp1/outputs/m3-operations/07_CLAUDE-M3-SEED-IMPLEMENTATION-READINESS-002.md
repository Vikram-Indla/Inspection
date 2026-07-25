# CLAUDE-M3-SEED-IMPLEMENTATION-READINESS-002 (Revision 2)

Direction: M3-SPONSOR-DIRECTION-20260725 item (1), refined by `04_CLAUDE-M3-SEED-SOURCE-MAP-001`.
Read-only packet preparation. No app, migration, Supabase data, or Claude Design write performed.

**Revision 2 corrections (per Codex RETURNED)**: (1) rollback claim was wrong — corrected with an exact DELETE-policy re-read across every seeded table; (2) `insertMissing`'s silent-skip-on-existing-ID behavior replaced with a hard-fail fingerprint check; (3) the lease is 2 files, not 1 (`package.json` is genuinely modified); (4) the `safety_security` reason-key check is now a runtime read the script performs, not an assumption from migration seed data; (5) every evidence claim below is labeled `MIGRATION-TEXT-CONFIRMED` (static SQL read this session) or `OBSERVED-PRIOR-RUN` (the existing script once succeeded — not proof of current state) — never blended.

## 1. Corrected rollback truth — full reversal is NOT available through any approved persona

Re-read every `for delete` policy in the entire migration set this session (`grep -rn "for delete" supabase/migrations/*.sql` — **MIGRATION-TEXT-CONFIRMED**, exhaustive, not sampled): exactly 2 exist in the whole codebase — `push_subscriptions` (`20260718010000_mvp2_m2_02_push_subscriptions.sql:39`) and `storage.objects` for regulation documents (`20260715200000_cd006_011_backend_completion.sql:324`). **Neither applies to any table this packet seeds.**

Re-checked, per table, whether any DELETE policy exists (`MIGRATION-TEXT-CONFIRMED`, absence of a matching `create policy ... for delete` for each):

| Table | DELETE policy for any persona role | Reversal available via seeder personas |
|---|---|---|
| `factories` | None | **No** |
| `visit_plans` | None | **No** |
| `visits` | None | **No** |
| `assignments` | None | **No** |
| `journey_sessions` | None | **No** |
| `geo_events` | None (confirmed again — matches `01_M4_INVENTORY_MATRIX.md`'s independent finding for the same table) | **No** |
| `action_forms` | None | **No** |
| `notifications` | None | **No** |
| `geo_override_requests` | None | **No** |

Postgres RLS semantics: no `DELETE` policy for a role means `DELETE` is denied by default for that role — not merely "unverified," but **actively blocked**. My prior claim ("every row is normal, real, deletable... geo_events immutable by design but deletable if the fixture must be fully retracted") was wrong for `geo_events` and every other table in this set. Corrected statement: **this seeder cannot delete any row it creates, for any table, through any of its three personas.**

**What is actually available (deterministic expiry/isolation, not deletion):**
- **Deterministic labeling/isolation** (not removal): every fixture row carries a fixed, greppable fingerprint (§2) so it is trivially identifiable and can be excluded from any real reporting/reconciliation query by filtering it out — visible-but-isolated, not gone.
- **Natural status expiry for the two time-bound rows** (changes status, does not remove the row): `visits.planning_status` moves to `expired` once `window_end` passes, via the existing scheduled sweep (`0025_scheduled_visit_expiry.sql`, `MIGRATION-TEXT-CONFIRMED`) — the visit row itself persists forever, only its status changes. `geo_override_requests.status` moves to `expired` at its 30-minute TTL via the existing decision-time guard or a future scheduled sweep (per `06_CLAUDE-M3-OVERRIDE-EXPIRY-FIX-001`) — again, status changes, the row is not removed.
- **All other rows (`factories`, `assignments`, `journey_sessions`, `geo_events`, `action_forms`, `notifications`) have no expiry mechanism at all** — they persist indefinitely with no persona-driven path to change or remove them.

**Actual row deletion, if ever required, is an operation this seeder's personas cannot perform.** It would need direct database access bypassing RLS (a Postgres role with `BYPASSRLS` or the Supabase service role) — that is explicitly **out of scope for this packet** and is not proposed here. If full removal is later required, that must be requested as its own, separately authorized administrative/migration-level task naming the exact rows — not something this seed packet claims to provide.

## 2. Corrected collision handling — hard-fail on fingerprint mismatch, never silent-skip, never reuse an unrelated row

`insertMissing()` (as used by the existing script) checks only whether an ID exists — if it does, it silently does nothing further with that row, which is unsafe if the ID were ever to collide with an unrelated real row (e.g., another team's fixture, or a future production row that happens to reuse the reserved-but-unregistered block). Corrected approach for the new script:

- **Every fixture row carries an explicit fingerprint field**, fixed and checkable:
  - `factories.notes` (new column use, or `factory_code`, whichever exists — confirmed `factory_code` is a real column from the M1 script's own insert, `seed-dashboard-kpis.mjs:74`) = `M3-OPS-FIX-<index>` — this exact string, nothing else.
  - `visit_plans.criteria` (jsonb, already used this way by the M1 script: `criteria: { fixture: "TASK-DASH-KPI-SEED-001", state }`) = `{ fixture: "TASK-M3-OPS-SEED-002", role: "<role>" }`.
  - `visits.notes` (already a plain text column, same convention as the M1 script) = `TASK-M3-OPS-SEED-002 · <role> · deterministic verification fixture`.
  - `action_forms.required_correction`, `notifications.payload.fixture`, `geo_events` has no free-text field — its fingerprint is transitively the `journey_id`/`visit_id` it's attached to, which themselves carry the fingerprint.
- **Collision procedure, per row, before any write**: `GET <table>?select=id,<fingerprint_field>&id=eq.<id>`.
  - **No row found** → proceed to insert.
  - **Row found, fingerprint field matches the exact expected fixture string** → this is this fixture's own prior run; proceed exactly as an idempotent re-run (update the fields the M1 convention already re-freshens: window/status/timestamps), never a plain silent skip.
  - **Row found, fingerprint field does NOT match** (or is null/absent on an unrelated row) → **hard-fail immediately**: throw an error naming the exact table, ID, and mismatched field, and perform **zero further writes for the entire run** (fail the whole script, not just that row) — this is a fatal precondition failure requiring human investigation (most likely cause: the reserved `f8/a8/b8/c8/d8/e8` block was not actually free), never resolved by overwriting, renaming, or proceeding past it.
- This replaces every `insertMissing()` call in the new script with a fingerprint-checked variant; the M1 script's own `insertMissing()` is not modified (out of scope, different file).

## 3. Corrected lease — exactly two files, named tests/evidence

| # | File | Change |
|---|---|---|
| 1 | `apps/web/scripts/seed-m3-operations-fixtures.mjs` (new) | The fingerprint-checked seeding script per §2/§4/§5 |
| 2 | `apps/web/package.json` | Add one script entry: `"seed:m3-ops": "node scripts/seed-m3-operations-fixtures.mjs"` — same convention as the existing `"seed:kpi"` line (confirmed real, `package.json:9`) |

No other file is touched — `seed-dashboard-kpis.mjs` itself is not modified.

**Exact tests/evidence for the eventual lease:**
- New focused Playwright spec `apps/web/e2e/m3-ops-seed-fixtures.spec.ts` (new file, not yet written — named here as the required evidence artifact) asserting: the 3 governed KPI counts increment by exactly the seeded amount; the Active Alerts card still renders `unavailable / decision required` with its 4 supporting counts each incremented by exactly 1; Submitted Today is unchanged; the 3 map-provenance tiers each render their correct label per `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001`.
- Script's own stdout validation block (mirroring the M1 script's `truth` check, `seed-dashboard-kpis.mjs:227-234`) — a read-only `select` confirming exact row counts/states per §6 below, printed as the script's pass/fail signal.
- Manual/browser evidence: screenshot or DOM read of `/operations` and `/operations/live` after seeding, captured by whichever actor holds the eventual implementation lease (not this design-only session).

## 4. Runtime governed-config check — re-verified, not assumed

Prior revision cited `safety_security` as present in `engine_settings.field.geo_override_reasons` based on the migration's own seed `UPDATE` statement (`20260716161605...sql:~123`) — that is **MIGRATION-TEXT-CONFIRMED as of that migration's original apply**, not proof the config is still in that shape on the live project today (a later admin action could have replaced the whole `field` settings blob). Corrected: the new script must, at runtime, before attempting `request_geo_override`:
```
SELECT settings FROM engine_settings WHERE engine = 'field';
```
(as an authenticated read — any persona; `engine_settings` read is not RLS-restricted beyond authentication per the pattern already used by `operations/page.tsx` itself) and verify `settings.geo_override_reasons` is a JSON array containing an entry with `key = "safety_security"`. **If absent, the script fails closed for that one fixture only**: skip the "Overrides pending" alert-source fixture, log exactly why, and do not fall back to a different reason key or invent a new one in `engine_settings` — the four-source Active Alerts breakdown would then show that one source as `0` genuinely (a true empty count from a real, current, checked config gap), never fabricated.

## 5. Canonical transition mechanism — unchanged, restated with evidence label

`0015_w1_journey_state.sql:29-55` — `set_operational_state(p_visit uuid, p_next operational_state)` — **MIGRATION-TEXT-CONFIRMED** (full function body read this session): `security definer`, requires `is_assigned_inspector(p_visit)`, enforces `new/prepared→on_the_way→arrived→executing`, idempotent replay, audit-logged via `trg_audit` comment. The new fixtures call this sequentially as the `inspector` persona rather than upserting `operational_state` directly (correcting the prior packet's note that the *existing* M1 script bypasses this RPC — that remains true and unchanged about the M1 script; the new M3 script does not repeat it).

## 6. Fixture set, IDs, RLS path — evidence labels added, otherwise unchanged from Revision 1

| Fixture | RLS/RPC path | Evidence label |
|---|---|---|
| Active Visits / On the Way / Executing | `set_operational_state()` sequence (§5) after `visits`/`assignments` insert | Function body: `MIGRATION-TEXT-CONFIRMED`. That the specific insert calls will succeed against the *current* live schema: **not verified this session — requires a dry run against the real project before the lease executes**, not assumed from the M1 script's past success. |
| SLA breach, Actions overdue, Notifications failed | Same table/policy shapes as the M1 script uses | Policy predicates: `MIGRATION-TEXT-CONFIRMED` (re-read exact text this session, not re-cited from memory). That an authenticated POST actually succeeds today: `OBSERVED-PRIOR-RUN` only for the M1 script's own fixtures — the new script's specific new rows are unverified until dry-run. |
| Overrides pending | `request_geo_override()` RPC, `safety_security` reason path | Function body and precondition chain: `MIGRATION-TEXT-CONFIRMED` (full function read this session). Reason-key presence: **runtime-check required, §4** — not assumed. |
| Map provenance tiers 1-3 | `geo_events` insert / omission / null factory coordinates | Table policy: `MIGRATION-TEXT-CONFIRMED`. Factory-insert-with-null-coordinates permitted by the `factories` insert policy shape (role check only, no column-level constraint found): `MIGRATION-TEXT-CONFIRMED`. |
| ID block `f8/a8/b8/c8/d8/e8` | Collision check per §2 | Distinctness from the M1 block (`f7/a7/b7/c7/d7/e7`, `seed-dashboard-kpis.mjs:27-32`): `MIGRATION-TEXT-CONFIRMED` (read the exact file this session). |
| Submitted Today | Not seeded | Unchanged — governed by Revision 3 of the package, no evidence claim needed. |

## 7. Disposition

Inspection and packet preparation complete, corrected per Codex RETURNED. No app, migration, Supabase data, or Claude Design write performed this session. Ready for Codex to issue the isolated two-file data/code lease, contingent on a live dry-run (not this design-only session) confirming §4's runtime config check and §6's "not verified this session" items before any real write executes.

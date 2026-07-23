# Seeder Implementation Plan

Mode: design/plan only. No seeder code was written or executed to produce this document. See `SEED_DEPENDENCY_DAG.md` for module ordering and `SEED_MANIFEST_SCHEMA.md`/`SEED_CLEANUP_AND_ROLLBACK.md` for the companion designs.

## 1. Language / runtime

Node.js scripts under `scripts/seed/*.ts`, matching the blueprint's recommended module list and the existing precedent already in this repo: `apps/web/scripts/seed-dashboard-kpis.mjs` (Node, reads `apps/web/.env.local`, authenticates as real seeded personas over PostgREST, never uses a service-role key). This plan continues that exact precedent rather than introducing a second seeding paradigm:

- Runtime: Node.js (`tsx`/`ts-node` for `.ts`, matching the rest of the monorepo's TypeScript-first tooling) invoked via a root or `apps/web` `package.json` script, e.g. `"seed": "tsx scripts/seed/index.ts"`.
- HTTP layer: plain `fetch` against the Supabase REST (`/rest/v1`), Auth (`/auth/v1`), and RPC (`/rest/v1/rpc/<fn>`) endpoints — the same approach `seed-dashboard-kpis.mjs` already uses — rather than importing `@supabase/supabase-js` if the existing script's pattern is preferred for consistency; either is acceptable but must stay consistent across all 15 modules.
- Auth: seeded personas log in for real via `/auth/v1/token?grant_type=password` (exactly as `seed-dashboard-kpis.mjs`'s `login()` helper does) so every subsequent write flows through RLS as that persona, never through a service-role bypass — this directly satisfies the blueprint's "service-role use only in the seeding runner, never browser code" and "verify RLS using real persona sessions after service-role creation" rules. The ONE exception is module `02-personas-auth`, which must use the Supabase Auth Admin API (service-role-scoped, server-side only, never shipped to a browser) purely to create the `auth.users` rows and their initial passwords — no other module may use a service-role credential.

## 2. Deterministic ID strategy

Follow the existing, already-proven convention in `apps/web/scripts/seed-dashboard-kpis.mjs`'s `IDS` object: fixed UUID prefixes per domain, zero-padded sequence suffixes, e.g. `f7000000-0000-4000-8000-000000000001` for factories. This plan extends that exact pattern with one dedicated prefix byte per domain so IDs are visually greppable and collisions across domains are structurally impossible:

| Domain | Prefix | Example |
|---|---|---|
| personas / profiles | `a1` | `a1000000-0000-4000-8000-000000000001` |
| factories | `a2` | |
| industrial_licenses | `a3` | |
| plant_production_line_items | `a4` | |
| regulations / regulation_clauses | `a5` | |
| inspection_items | `a6` | |
| packages / package_versions | `a7` | |
| violation_codes / penalty_mappings | `a8` | |
| visit_plans | `b1` | |
| visits | `b2` | |
| assignments | `b3` | |
| journey_sessions | `b4` | |
| geo_events | `b5` | |
| inspections | `c1` | |
| checklist_responses | `c2` | |
| evidence | `c3` | |
| findings | `c4` | |
| violations | `c5` | |
| action_forms | `c6` | |
| submission_versions | `d1` | |
| reviews | `d2` | |
| notifications | `e1` | |
| audit_events | `e2` (mostly trigger-generated, not directly inserted) | |
| virtual_sessions / virtual_participants | `e3` | |

Every ID is a pure function of `(seed_batch_id, domain, sequence_number)` — never `Math.random()`/`crypto.randomUUID()` at seed time — so re-running the same batch produces the identical ID set, which is what makes the upsert/skip logic in §5 possible.

## 3. Seed anchor date

A single `SEED_ANCHOR_DATE` environment variable (default: the date the seed run starts, ISO 8601, e.g. `2026-07-24`) is read once by module `00-preflight` and threaded through every later module as an explicit parameter — never re-read from `new Date()` inside a downstream module, so that the entire dataset (including the 12-month dashboard backfill in `SEED_DEPENDENCY_DAG.md` §4) is reproducible from one input. `visit_date`/`submitted_at`/`created_at` for historical scenarios are computed as `SEED_ANCHOR_DATE minus N months` per the module's own logic, never as wall-clock "now" offsets.

## 4. Transaction boundaries

Postgres transactions are not directly available to a PostgREST-fronted script (no raw `BEGIN`/`COMMIT` over REST). Boundaries are therefore enforced at the APPLICATION level, matching how `seed-dashboard-kpis.mjs` already operates:

- Each domain module (05 through 12) commits one scenario at a time (e.g. one full "published bulk plan with eligible/ineligible factories" scenario), and logs its own row-by-row upsert result before moving to the next scenario.
- Where the canonical schema exposes a single atomic RPC for a multi-table action (e.g. `publish_single_visit`, `publish_bulk_plan` — both confirmed live per `product-contract/CURRENT_STATE.md` UPDATE 38), the seeder MUST call that RPC rather than performing the equivalent multi-table insert itself, per the blueprint's "no direct insert that bypasses the canonical RPC where the business action is meant to use an RPC" rule. This preserves the same atomicity guarantee a real user action gets.
- A module that fails partway through logs exactly which scenario/row failed to the seed-run registry (see §9) and stops that module; earlier successfully-committed scenarios in the same run are NOT rolled back automatically (see §12, Partial failure recovery) because they are individually idempotent and safe to leave in place.

## 5. Dependency DAG

See `SEED_DEPENDENCY_DAG.md` (this plan's companion document) for the full module graph and hard ordering constraints.

## 6. Upsert / skip rules

- Every insert is preceded by a lookup on the deterministic ID (§2). If a row with that ID already exists, the module performs an `UPDATE ... WHERE id = $1` (upsert) rather than a blind `INSERT`, EXCEPT for tables the product contract defines as immutable once created (`submission_versions`, `audit_events`, published `package_versions`) — those are skip-only: if the ID exists, the module logs "already present, skipped" and moves on, never attempting to mutate an immutable row (this directly enforces "Never edit an immutable submitted version" from `CLAUDE.md`).
- Precedent already in the repo for the upsert branch: `product-contract/CURRENT_STATE.md` UPDATE 37 documents `seed-dashboard-kpis.mjs` being changed from `insertMissing` to `upsert` specifically for `notifications`, because a fixture that only inserts-if-missing silently ages out of a 20-row display window on a shared, high-write project — the same reasoning applies to every seed table whose freshness matters for a demo (notifications, geo_events, journey_sessions).
- No seed module ever performs a bulk `DELETE`/`TRUNCATE` as part of its forward (non-cleanup) path — this directly satisfies the blueprint's "Do not propose destructive truncate/reset as the default" instruction.

## 7. Canonical RPC usage

Any business action that has an accepted RPC (publish plan/visit, request/approve/reject outside-geofence, submit inspection, approve/reject/return review, request/verify OTP, etc.) must be invoked through that RPC by the seeder, authenticated as the appropriate persona, exactly as a real user would trigger it. This is the only way seeded `audit_events` rows are genuine rather than fabricated (see §11, Audit strategy). Before implementation, Section I execution must enumerate the exact RPC names against a live `list_tables`/functions pass — this plan intentionally does not invent RPC names beyond the two already confirmed live (`publish_single_visit`, `publish_bulk_plan`) and the OTP pair already confirmed live (`vp_request_otp`, `vp_verify_otp`).

## 8. Auth Admin API usage

Confined strictly to module `02-personas-auth`. Each of the 15–20 fictional personas (see `PERSONA_AND_ORGANISATION_SEED_PLAN.csv` from Section E, not part of this H+I+J deliverable) is created via `POST /auth/v1/admin/users` with the service-role key held only in the seed runner's own process environment (never committed, never logged, never present in any file this plan writes) — matching `CLAUDE.md`'s "never expose secrets" rule and the blueprint's "service-role use only in the seeding runner, never browser code." Passwords follow the existing convention visible in `apps/web/e2e/personas.ts` (`Mim<Role>!2026`-style, on the reserved `@mim.gov.sa`-class domain already in live use per that file's own history comment) — no new domain is invented without a decision; if the reserved test domain differs from `mim.gov.sa`, that is Section E's decision to make, not this plan's.

## 9. Service-role handling

- The service-role key is read from an environment variable never named alongside `NEXT_PUBLIC_*` (to guarantee it can never leak into a client bundle), consumed only inside `scripts/seed/02-personas-auth.ts`.
- Every module AFTER 02 authenticates as a real persona (§1) — the service-role key is not held in process memory beyond module 02's execution.
- `00-preflight` explicitly checks that no `NEXT_PUBLIC_*`-prefixed variable contains anything resembling a service-role JWT before proceeding, as a defensive guard against misconfiguration.

## 10. Seed-run registry approach

A dedicated `seed_runs` registry table (new — must be proposed as a migration in a future implementation task, not created by this plan) records one row per seed invocation: `seed_batch_id` (the deterministic-ID root, §2), `started_at`, `completed_at`, `anchor_date`, `volume_profile` (§14), `modules_completed`, `status` (`in_progress`/`completed`/`partial`/`failed`), and `git_commit_sha` of the seeder code that ran. Every row this seeder writes across every domain table additionally carries a `seed_batch_id` column (or, where no spare column exists on a canonical table, a parallel `seed_batch_members(seed_batch_id, table_name, row_id)` mapping table) so cleanup (§11) can operate by batch without a table-by-table manual list. This registry table itself is the authoritative mechanism for "traceable and cleanable" per the blueprint's acceptance gates — see `SEED_MANIFEST_SCHEMA.md` for its full column design.

## 11. Cleanup approach

See `SEED_CLEANUP_AND_ROLLBACK.md` for the full design. Summary: `scripts/seed/cleanup.ts` accepts a `--batch <seed_batch_id>` argument, looks up every row tagged with that batch via the registry/mapping table in §10, and deletes them in strict REVERSE dependency order (mirroring `SEED_DEPENDENCY_DAG.md`'s graph run backward) so no foreign-key constraint is ever violated mid-cleanup. It never operates on a batch ID it wasn't given, and it never does a bare `DELETE FROM <table>`.

## 12. Notification sink

At seed-runner bootstrap (never in application code), call `registerStagingNotificationAdapters()` from `apps/web/src/lib/providers/notification-stubs.ts` so push/sms/email report deterministic staging outcomes instead of a blanket `not_configured`, letting seeded scenarios exercise the full delivery/escalation/dedup UI. `readSink()`/`clearSink()` from that same module are the inspection point for `14-validation` (§ Notification sink checks in `SEED_VALIDATION_PLAN.md`). No seed run may reach a real recipient — `assertNonProduction()` inside that module already throws under `NODE_ENV=production`, and the seed runner's own `00-preflight` module independently re-checks this rather than trusting the library alone.

## 13. Production guard

`00-preflight` MUST, before any write:
1. Resolve `NEXT_PUBLIC_SUPABASE_URL` from `apps/web/.env.local` (same file `seed-dashboard-kpis.mjs` already reads) and extract the project ref.
2. Refuse to proceed unless that project ref matches an explicitly allow-listed non-production ref supplied via `SEED_ALLOWED_PROJECT_REF` (an env var this plan requires but does not itself set a value for — the value must come from an approved, documented source, not be inferred).
3. Refuse to proceed if `NODE_ENV=production`.
4. Refuse to proceed if any persona login in module 02 or any pre-existing persona login in module 00's connectivity check indicates a project with pre-existing NON-synthetic (i.e., not carrying a recognizable `seed_batch_id`) production-shaped data volume inconsistent with a staging/dev project (a heuristic check, logged for human review, not an automatic hard stop, since this repo currently treats `iiozvqntawxfwbgffzqu` as its one live-but-heavily-test-personas project per `product-contract/CURRENT_STATE.md` — the exact staging/production classification of that single project is itself one of the blueprint's "Blind spots requiring explicit decisions" and must be resolved by a human before Section I is executed, not inferred by this seeder).
5. On any refusal, exit with a message matching the blueprint's own required token: `SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN`.

## 14. Repeat-run behaviour

A second invocation of the full seed chain with the SAME `SEED_ANCHOR_DATE` and the same `seed_batch_id` root must be a no-op beyond timestamp refreshes on freshness-sensitive tables (§6) — every row already exists at its deterministic ID and is either skipped (immutable tables) or upserted to the identical values (mutable tables). A second invocation with a DIFFERENT anchor date or an explicit new `--batch` flag creates an independent, side-by-side batch without disturbing the first — this is what makes `demo`/`qa`/`performance` volume profiles (§16) composable rather than mutually destructive.

## 15. Partial failure recovery

If module N fails mid-run, modules 1..N-1's already-committed scenarios remain in place (each is independently idempotent per §6/§10). The seed-run registry row for this batch is marked `status: "partial"` with the failing module and the last successfully completed scenario ID recorded. Re-running the SAME batch resumes: `00-preflight` checks the registry, skips modules already marked complete for this batch, and resumes at the failed module — this requires per-scenario (not just per-module) progress tracking inside the registry, which is why `SEED_MANIFEST_SCHEMA.md` includes a `scenario_id` granularity, not just a `module` granularity.

## 16. Audit strategy

Because every business-action write goes through the real canonical RPC (§7) authenticated as a real seeded persona (§1), the existing `audit_events` append-only trigger (per `0005_audit_absolute_immutability.sql`) fires exactly as it would for a genuine user action — no seed module ever inserts directly into `audit_events`. This is the mechanism that keeps seeded audit history real rather than fabricated, satisfying the blueprint's "Seeded audit events versus audit generated by using canonical RPCs" blind spot in the only way consistent with `CLAUDE.md`'s "never mutate workflow status directly; use canonical transitions and guards."

## 17. Data-volume profiles

| Profile | Personas | Factories | Visits/plans per month | History depth | Intended use |
|---|---|---|---|---|---|
| `demo` | 15 (blueprint minimum) | 20 (blueprint minimum) | ~6–10 | 3 months | Sales/stakeholder walkthroughs, low volume, hand-picked scenario coverage |
| `qa` | 20 (blueprint maximum) | 30 (blueprint maximum) | ~20–30 | 12 months (full blueprint requirement) | Full acceptance/regression testing, every scenario in `SEED_SCENARIO_CATALOG.csv` (Section G, not part of this deliverable) represented at least once per month where applicable |
| `performance` | 20 | 30 | 200+ (synthetic bulk multiplier applied only to LOW-RISK, clearly-tagged rows — never multiplying immutable submission history in a way that could be mistaken for organic growth) | 12 months, denser | Load/index/dashboard-aggregate performance testing; every performance-multiplied row still carries the same `seed_batch_id` traceability as `demo`/`qa` rows |

The profile is selected via a `--profile demo|qa|performance` CLI argument to the seed runner, read once by `00-preflight` and threaded through every module exactly like `SEED_ANCHOR_DATE`.

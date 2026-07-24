# Seed Cleanup and Rollback Plan (design only — nothing executed)

## 1. Default behaviour: no destructive action

Per the blueprint's explicit instruction ("Do not propose destructive truncate/reset as the default") and `CLAUDE.md`'s hard rules, the DEFAULT outcome of running the seed chain is additive-only. `scripts/seed/cleanup.ts` is a SEPARATE, explicitly-invoked script — it never runs as part of `scripts/seed/index.ts`'s normal forward chain, and it never runs automatically on failure (see §4, Partial failure — no auto-rollback).

## 2. Targeted cleanup by batch

```
tsx scripts/seed/cleanup.ts --batch <seed_batch_id> [--dry-run]
```

1. Look up `seed_runs` (see `SEED_MANIFEST_SCHEMA.md`) for the given `seed_batch_id`. Refuse to proceed if the batch does not exist in the registry — this prevents an operator from accidentally targeting an unrelated ID.
2. Enumerate every row tagged with that batch, either via a direct `seed_batch_id` column (preferred, per `SEED_MANIFEST_SCHEMA.md` §2) or via `seed_batch_members`.
3. Compute the deletion order as the EXACT REVERSE of `SEED_DEPENDENCY_DAG.md`'s module graph (delete `14→13→12→…→01`, never forward), so no foreign-key constraint is ever violated mid-cleanup.
4. `--dry-run` prints the row counts and table names that WOULD be deleted, performing zero writes — this must be the default first invocation an operator runs, and tooling/documentation should always show `--dry-run` first.
5. Without `--dry-run`, delete rows table-by-table in the computed order, authenticated as a persona/service-role with sufficient delete permission (this is one of the few places a service-role credential may legitimately be needed outside module 02, since RLS may not grant a regular persona delete rights on tables like `audit_events` — but `audit_events` rows are immutable by design per `0005_audit_absolute_immutability.sql` and MUST NOT be deleted even during cleanup; cleanup explicitly EXCLUDES audit_events and any other append-only table from deletion, leaving the seeded batch's audit trail intact as a permanent, harmless record).
6. On completion, mark the `seed_runs` row `status: "cleaned"` (an additional status value beyond the four in `SEED_MANIFEST_SCHEMA.md` §1 — noted here as a design addendum) rather than deleting the registry row itself, so the batch ID can never be silently reused for a new run.

## 3. What cleanup never touches

- `audit_events` (append-only, immutable per accepted schema).
- Any row NOT tagged with the target `seed_batch_id` — cleanup never falls back to a heuristic ("looks synthetic") match; only exact registry membership qualifies a row for deletion.
- Accepted reference configuration (`engine_settings`, `roles`, published `regulations`/`packages` that predate seeding) — these are never seed-owned even if a seed run happened to read them, because module `01-reference-data` only verifies, never inserts/deletes them (per `SEEDER_IMPLEMENTATION_PLAN.md` §2/§6).
- Any table outside the domain list enumerated in `SEED_DEPENDENCY_DAG.md` §1 — cleanup has an explicit table allow-list, not a wildcard.

## 4. Partial failure — no auto-rollback

If a forward seed run fails partway (per `SEEDER_IMPLEMENTATION_PLAN.md` §15), cleanup is NOT automatically invoked. The registry row stays `status: "partial"` and an operator decides explicitly whether to (a) resume the same batch (re-running the forward chain, which skips already-completed scenarios), or (b) run `cleanup.ts --batch <id>` to remove the partial batch and start over with a new batch ID. Automatic rollback-on-failure was considered and rejected for this design because a partial batch's already-committed rows are individually valid, real, RLS-respecting rows — deleting them automatically on a transient failure (e.g. one network timeout in module 10) would be more destructive than useful, and could itself trigger unwanted cascading deletes if any downstream row created by ANOTHER process happened to reference a seed row before rollback ran.

## 5. Full-batch listing (operator visibility)

```
tsx scripts/seed/cleanup.ts --list
```

Prints every `seed_runs` row (batch id, label, profile, status, row counts from its manifest) without deleting anything — the read-only complement to targeted cleanup, so an operator can identify stale batches before deciding to clean them.

## 6. Retention

This plan does not set a retention/expiry policy for seed batches (per the blueprint's blind spot #10, "Data retention and cleanup," which is explicitly listed as requiring a human decision, not an invented default). Seed batches persist indefinitely until an operator explicitly runs cleanup for that batch.

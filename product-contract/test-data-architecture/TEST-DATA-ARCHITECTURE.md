# MIM Inspection — test data architecture

Status: **proposal for approval**. Nothing here has been executed against any
database and no application code has been changed. It is the design the
seeder, the workbook and the training demo are all meant to be built from.

Companion artefacts:

- `registers/*.csv` — the machine-readable source of truth for every table below.
- `outputs/MIM-Inspection-Test-Data-Pack-v1.xlsx` — the workbook generated from
  those registers by `scripts/test-data/build_test_data_workbook.py`.
- Prior discovery this builds on, not replaces:
  `product-contract/seeding-discovery/` (schema catalogue, scenario catalogue,
  RLS expectations, cleanup design).

---

## 1. Why the dashboard reads as dead

The screenshots show an "Executive AI brief" with nothing in it, four supervisor
tiles at `0`, and a strategic register that is mostly **Unavailable**. Read
literally that says the platform is broken. It is not. There are **five
different kinds of nothing** on that screen and the product currently renders
three of them with the same word.

| Kind | What it actually means | Should read | Example on the screenshot |
|---|---|---|---|
| **Zero** | The source is live, the query ran, the true count is 0 | `0` | Active executions, GPS overrides today |
| **Not applicable** | The source is live but the rate has no denominator | `N/A` | National compliance rate |
| **Not configured** | Computable, but blocked on an unpublished Admin policy | `Not configured` | Inspection coverage against annual target |
| **Unavailable** | The source column or table does not exist in the schema | `Unavailable` | Risk distribution, Licence exposure |
| **Decision required** | The formula is blocked by an open governance decision | `Decision required` | Violation trend by regulation and severity |

`apps/web/src/app/(app)/dashboard/dashboard-format.ts` collapses the first two
into the fourth: a metric whose `sourceStatus` is `live` but whose `value` is
`null` is rendered with `statusLabel("unavailable")`. That is why
**Risk-to-attention mismatch** — a fully implemented, live measure — sits in the
register showing `Unavailable`. It has no rows to count, which is a true `0`.

This is the single most misleading thing on the screen for a training audience,
and it is a change in one pure, unit-tested file. See §7.

### Where "33% Live source · 2 of 6 measures" comes from

`buildCoverage` in `apps/web/src/features/dashboard/strip.ts` takes the
strategic measures that are **not** already shown as a card above, looks each
one up in the KPI projection, and counts how many carry `sourceStatus === "live"`.

The six in that register are STR-KPI-002, 003, 005, 009, 010 and 011. Two are
live — 009 (Checklist items by issuing authority) and 010 (Risk-to-attention
mismatch). 2 ÷ 6 = 33%. The earlier screenshot reads 43% because it counted
seven measures, including STR-KPI-006 (Cancellation rate).

So the meter is not stale and it is not wrong. It is reporting that four of six
strategic measures cannot produce a number today — and of those four, **only
three are genuinely blocked**; STR-KPI-010 would produce a real number the
moment journeys exist.

---

## 2. The unit of test data is one Inspection Journey

Every screen in the product is a projection of the same object at a different
point in its life. Planning shows journeys before assignment. Operations shows
journeys in motion. Execution shows journeys being filled in. Reviews shows
journeys awaiting a decision. Analytics and the dashboard aggregate journeys
that finished.

So the atom of test data is not a table row. It is a **journey with a terminal
stop**: the point at which it stopped moving. The terminal stop determines, by
construction, every physical row the journey creates.

```
J00 draft ─ J01 pending ─ J02 published ─ J06 assigned ─ J07 en route
                                                             │
                    ┌────────────────────────────────────────┘
                    ▼
       J08 arrived ─ J10 executing ─ J11 under review ─ J14 approved
            │  J09 arrived by GPS override      │  J12 returned ─ J13 resubmitted
            │                                   └─ J15 rejected
            └─ J03 returned to planner · J04 cancelled · J05 expired
```

A journey that stops at **J00** writes 2 rows (`visit_plans`, `visits`).
A journey that reaches **J14** writes roughly 150 — because it drags a full
checklist through `checklist_responses` on its way.

Attributes overlay on journeys that already exist: *carries a non-compliant
answer*, *carries a finding*, *carries a violation*, *carries a penalty*.
Modifiers change how a journey was created: *immediate*, *bulk cohort*,
*unregistered establishment*, *Senaei-sourced factory*.

The demo profile is **300 journeys**: 240 individually planned plus 3 bulk
cohorts of 20. The full distribution is `registers/journey-stops.csv`.

---

## 3. Five layers, loaded low to high

| Layer | What it is | Written by the loader? | Unloaded? |
|---|---|---|---|
| **L0** Reference & governed constants | roles, capabilities, permissions, planning lookups, regulation library, violation codes, `engine_settings` v1 | **No — verified only.** The run fails if the accepted set is missing or mutated | **Never** |
| **L1** Policy & configuration | published KPI targets, inspection-cycle policy, SLA urgency policy, packages and their published versions, expiry rules | Yes, but every value must trace to a named approval | Last |
| **L2** Master data | personas and role grants, factories, locations, licences, production lines, representatives, devices | Yes | After L3 |
| **L3** Transactional spine | the journeys — plans, visits, assignments, geo events, inspections, responses, evidence, findings, violations, submissions, reviews, penalties | Yes — this is the bulk of the work | First |
| **L4** Derived & append-only | audit events, lifecycle events, notifications, analytics snapshots | **No.** Produced as a side effect of L3 going through the real RPCs | `audit_events` **never**; the rest with their parent journey |

Two consequences worth stating plainly:

1. **L1 is not optional.** Three measures on the dashboard are not waiting for
   rows, they are waiting for a *published policy version*. Loading a million
   visits will not move Inspection coverage off `Not configured`. Publishing
   `inspection_cycle_policy` will.
2. **L4 is never inserted.** If the loader wrote audit rows directly, the audit
   trail would be a fiction. Journeys are created through the same RPCs a real
   user would call, backdated — so the audit trail is genuinely real, just
   about fictitious establishments.

---

## 4. Deterministic identity — the thing that makes unload possible

Every row the loader creates gets a primary key derived as:

```
uuidv5(seed_batch_id, "<table>:<logical key>")
```

for example `uuidv5(batch, "journey:JRN-RUH-00417")`. This has three properties
that matter:

- **Re-running the loader is idempotent.** The same logical key produces the
  same UUID, so a second run upserts rather than duplicates.
- **Unload needs no new column on any canonical table.** The prior discovery
  design proposed adding `seed_batch_id` to forty tables or maintaining a
  `seed_batch_members` join table. Neither is necessary: the unloader recomputes
  the exact same UUID set and deletes by primary key.
- **Nothing is ever deleted heuristically.** There is no "looks synthetic"
  match. A row is removable only if its ID is named in the batch manifest.

One new table is required, `seed_runs`, as the ledger of what was loaded when
and by whom. Its shape is already specified in
`product-contract/seeding-discovery/SEED_MANIFEST_SCHEMA.md` §1 and is adopted
unchanged, plus a `cleaned` status.

---

## 5. Load

```
npm run testdata:preflight
npm run testdata:load  -- --profile demo --anchor 2026-08-22
npm run testdata:verify -- --batch <id>
```

`preflight` refuses to continue unless the target host is on the non-production
allowlist, `NODE_ENV` is not `production`, migrations are current, and L0 is
present and unmutated. It writes nothing.

`load` registers the batch in `seed_runs` as `in_progress` **before the first
write**, then runs the modules in dependency order (L1 → L2 → L3), and finishes
by exporting a manifest to
`product-contract/evidence/seed-runs/<batch>.json` listing the exact row IDs it
created per table. A run that cannot write its manifest fails — an unmanifested
batch would be unremovable.

`--anchor` is the date the whole cohort is generated relative to. Twelve months
of history are produced by running the journey generator across a simulated date
range ending at the anchor, not by bulk-inserting into a reporting table. About
40% of approved journeys land inside the rolling 30-day analytics window so
`/analytics` has signal, and about 25 journeys are dated *today* so the
operational tiles and the live map are not empty during a demo.

`verify` is read-only. It checks referential integrity, logs in as each persona
to confirm RLS shows them what the persona matrix says it should, and then walks
`registers/screen-data-map.csv` asserting one expectation per row. Its output is
the list of screens that are still empty **and why** — which is the artefact the
training team actually needs.

## 6. Unload

```
npm run testdata:status
npm run testdata:unload -- --batch <id> --dry-run
npm run testdata:unload -- --batch <id> --confirm
npm run testdata:unload -- --all --confirm      # the whole-data unload
```

`--dry-run` performs zero writes and prints exactly which tables and how many
rows would be deleted. It is the first invocation in every documented example.

`--confirm` deletes strictly in **reverse dependency order** — removable L4,
then L3, then L2, then L1 — by explicit row ID from the manifest. It refuses a
batch id absent from `seed_runs`; it refuses to delete any row not named in the
manifest; and it stops at the first row that is still referenced by something
outside the batch, reporting it rather than cascading.

`audit_events` and any other append-only table are excluded by an explicit
allow-list, not by a filter. The seeded batch's audit trail survives unload as a
permanent, harmless record of what happened — which is the correct behaviour for
an immutable log and is also what makes the unload itself auditable.

On completion the `seed_runs` row is marked `cleaned` and kept, so a batch id
can never be silently reused.

`--all` iterates every batch whose status is `completed` or `partial`, newest
first. That is the "unload everything" button: after it, the only rows left are
L0 reference data, real (non-seeded) content, and the audit trail.

**Partial failure does not auto-rollback.** The batch stays `partial` and the
operator chooses: resume the same batch, or unload it and start again. A partial
batch's committed rows are individually valid; deleting them automatically on a
transient failure would be more destructive than useful.

---

## 7. The empty-state change this makes necessary

Loading data fixes 67 of the 82 rows in the screen map. It does not fix the
vocabulary problem, and the vocabulary problem is what will confuse the training
team most.

Proposed change, in `apps/web/src/app/(app)/dashboard/dashboard-format.ts`
only — the pure, unit-tested presentation adapter. Where `sourceStatus` is
`live` and `value` is `null`:

- `unit === "count"` → render `0` with the sub-line *No records in this period*.
- `unit === "percent"` or `"ratio"` with a zero denominator → render `N/A` with
  the sub-line *No eligible records in scope*.

This does **not** weaken the governed-absence rule. A live count of zero *is*
the governed value; reporting it as `Unavailable` is the inaccuracy. Measures
whose source genuinely does not exist keep saying `Unavailable`, and measures
blocked on a policy keep saying `Not configured` with the route to fix them.

Not implemented in this change — it is an application edit and this document is
a proposal. Raised as a task, not applied.

---

## 8. What test data can never fix

Six measures are blocked on something no amount of seeding will supply. They are
listed in full in `registers/blocked-measures.csv`; in short:

| Measure | Needs |
|---|---|
| STR-KPI-002 Risk distribution | A migration adding a governed Health Score snapshot source. The Risk Engine's `factories.risk_score` is a different thing and must not be substituted. |
| STR-KPI-003 Violation trend | A governance ruling, then a migration: `violations` has no official issue-time column and severity is not normalised. |
| STR-KPI-005 Licence exposure | A governed definition of exposure. |
| STR-KPI-011 Repeat violation rate | A governed repeat window and repeat-identity rule. |
| OPS-KPI-005 Pending publish | A product decision — deferred by design. |
| IPAD-KPI-007 Personal trends | A product decision — deferred by design. |

These must be shown to the training team as *blocked with a named reason and a
decision reference*, not hidden and not filled with a plausible number. That
honesty is the product's strongest governance claim and the demo should lean on
it rather than apologise for it.

---

## 9. Open decisions this design does not resolve

1. **Where the demo target values come from.** `registers/screen-data-map.csv`
   carries a `demo_target_value` column — 82% compliance, 68% coverage, 5.8%
   cancellation. These are *shape* targets for a believable demo, not governed
   thresholds. They need sign-off before the loader treats them as goals.
2. **Penalty amounts.** Journeys carrying a penalty need an amount. Amounts must
   come from approved `penalty_mappings`. If those are not published, penalty
   journeys stop at the violation and the penalty stays absent.
3. **Retention.** No expiry policy is proposed for seed batches. They persist
   until an operator unloads them.
4. **The non-production allowlist.** The exact set of hosts `preflight` accepts
   needs to be named and stored outside this repository.

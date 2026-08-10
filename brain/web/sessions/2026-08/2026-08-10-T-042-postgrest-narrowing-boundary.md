# 2026-08-10 · T-042 — narrow the PostgREST boundary, delete every `as unknown as`

`task: T-042` · `status: done (static verification only)` · `duration: 3h`
`rules applied: WEB-000 §5, WEB-001 §4, WEB-008 §2`

---

## Goal

Remove all 48 `as unknown as` casts from the migrated data layer by narrowing
PostgREST responses once, at the boundary, instead of asserting their shape.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `lib/postgrest/shape.ts` | created | — → 127 |
| `lib/postgrest/read.ts` | created | — → 59 |
| `features/dashboard/sources/shapes.ts` | created | — → 141 |
| `features/operations/sources/shapes.ts` | created | — → 121 |
| `features/approvals/shapes.ts` | created | — → 63 |
| `features/enforcement/shapes.ts` | created | — → 66 |
| `features/regulations/shapes.ts` | created | — → 160 |
| `features/reviews/shapes.ts` | created | — → 74 |
| `features/dashboard/sources/paginate.ts` | rebuilt | 15 → 12 |
| `features/dashboard/sources/{audit,compliance,factories,geo,inspection-flow,settings,violations}.ts` | rebuilt | 137 → 133 |
| `features/dashboard/hydrate.ts` | rebuilt | 45 → 41 |
| `features/operations/sources/{alerts,execution,factories,geo,visits}.ts` | rebuilt | 179 → 216 |
| `features/operations/snapshot.ts` | rebuilt | 76 → 68 |
| `features/operations/queries.ts` | edited | 363 → 347 |
| `features/approvals/queries.ts` | edited | 162 → 165 |
| `features/enforcement/{catalogue,queries}.ts` | edited | 262 → 296 |
| `features/regulations/{queries,record-source,workspace-source}.ts` | edited | 350 → 354 |
| `features/reviews/queries.ts` | edited | 105 → 110 |
| `features/planning/queries.ts` | edited | 155 → 167 |
| `lib/planning/visit-list.ts` | edited | 466 → 505 |
| `lib/shell-search.ts` | edited | 110 → 132 |
| `app/(app)/dashboard/metrics.ts` | edited (row types) | — |
| `components/saqeel/feedback/Drawer.tsx` | edited | — |
| `e2e/dashboard-business.spec.ts`, `e2e/dashboard-kpi-contract.spec.ts` | edited (fixtures) | — |

## Decisions

**The root cause is an untyped Supabase client.** `supabaseServer()` calls
`createServerClient` with no `Database` generic, so `.select()` infers every
column as `any` **and infers every embedded relation as an array** — even a
to-one embed, which PostgREST returns as an object at runtime. The hand-written
row types were correct about cardinality; the inferred types were not. Every
cast existed to bridge that, which meant a renamed or dropped column produced no
type error and a runtime failure deep inside a component.

**The fix is a narrowing boundary, not a relocated cast.** `lib/postgrest/read.ts`
takes a response whose `data` is `unknown` and applies a `Shape<T>` — a function
over field accessors that reads each column with its declared type. A column of
the wrong type, or a missing one, raises `ShapeMismatch`.

**A failed narrowing fails the whole read; it never drops rows.** Silently
skipping a malformed row would under-report a governed figure, which this
platform forbids: absent data renders as a state, never as a smaller number.
`readRows` returns `{ rows: [], failed: true, reason }` and every caller already
had a "this source is unavailable" path to route it into.

**`one()` accepts an object, `null`, or a single-element array.** PostgREST's
shape for a to-one embed depends on how the relationship resolves; accepting
both is more correct than the assertion it replaces, not less.

**Logging moved to one site.** The boundary logs `[postgrest] <source>
unreadable — <reason>`, so the twelve duplicate `console.error` lines in
`features/operations/queries.ts` and the six in approvals/enforcement/regulations
were deleted. `console.*` in `features/**` went 42 → 22.

**Row types now declare what the query actually selects.** `VisitScopeRef`
(`factory_id` + the hydrated `factories`) was extracted in
`app/(app)/dashboard/metrics.ts` because the dashboard reads `factory_id` and
`hydrate.ts` fills `factories` afterwards. With both fields declared, the six
casts in `hydrate.ts` disappeared without changing behaviour.

**The real long-term fix is generated database types.** `supabase gen types
typescript` would give correct column types *and* correct cardinality from FK
metadata, deleting most of the shapes written here. It needs a live database,
which this workstation does not have. Raised as a measurement/infra request
below — not attempted.

## Inventory taken before writing code

- 48 `as unknown as` across 21 files: 22 of the form
  `… as unknown as PromiseLike<PostgrestPage<T>>` (dashboard + operations page
  loaders), 25 of the form `(read.data ?? []) as unknown as Row[]`, 1 a
  `zIndex` cast in `saqeel/feedback/Drawer.tsx`.
- 30 distinct row types across 7 domains, each now a `Shape<T>`.
- No state, effects, literals, `<svg>` or markup touched — this task is data
  layer only.

## Numbers

```
Route: all migrated routes (data layer only, no markup change)
as unknown as   48 → 0   on the migrated surface
                150 remaining, all in unmigrated legacy (field/**, admin/**,
                reviews/[id], visits/[id], reports/**, planning/bulk, ai/**)
console.* in features/**   42 → 22
first-load JS   not measured — server-only modules, no client bundle change expected
legacy CSS deleted: 0 (not a CSS task)
source lines added: ~+330 (the shapes are the narrowing that replaces the casts)
```

## Accessibility

Not applicable — no markup, no component, no string changed.

## Verification

- [x] `npm run typecheck` — **clean across the whole repository**
- [ ] `npm run lint` — no lint configuration exists (T-000)
- [ ] `npm run gates` — no gate scripts exist (T-000)
- [ ] `npm run test:e2e` — blocked, see BLOCKED in the tracker
- [ ] Definition of Done (WEB-006 §5) — cannot be fully ticked on this workstation

**Two e2e fixtures were updated**, not the assertions:
`dashboard-business.spec.ts` and `dashboard-kpi-contract.spec.ts` construct
`VisitRow` / `InspectionRow` literals and now supply the `factory_id` those
types always should have declared.

## Retirement

Nothing marked or deleted. `lib/supabase-pagination.ts` still has legacy callers
outside the migrated surface and stays.

## Caught at runtime by the new boundary

`/planning` threw on first load after this change:

```
[postgrest] planning.visit_list unreadable —
  planning.visit_list[0].factory_id expected a string, received nothing
```

That is the boundary working. `factory_id` is `uuid not null` in the schema and
`Joined` declared it `string`, but `rowSelect()` (`visit-list.ts:230`) never
projects it — so `fixtureFactoryIds.has(undefined)` has always been false and
the fixture filter in `readVisibleRows` has **never removed a row**. The counts
path (`readFixtureCount`) selects `factory_id` explicitly and subtracts fixtures
correctly, so tab badges and totals have been excluding fixture factories while
the rows beside them did not.

Fixed here **without changing behaviour**: `factory_id: string | null`, narrowed
with `optionalText`, and the filter skips rows whose factory id is unknown —
byte-identical to `has(undefined)` returning false. The `matchedIds` read path
was converted onto the boundary too; it had been left on raw `read.data` in the
first pass.

Adding `factory_id` to `rowSelect()` is the real fix and is **not** done here:
it would make rows and counts agree and remove fixture rows from `/planning` for
the first time. That is a behaviour change and belongs to the parked task, which
now carries the evidence.

## Parked

- **`features/dashboard/sources/*` imports its row types from
  `app/(app)/dashboard/metrics.ts`.** The feature layer depending on a route
  folder is backwards; the types belong in `features/dashboard/`. Left in place
  because moving them is a rename touching every dashboard consumer, and this
  task was scoped to the casts.
- **`features/operations/queries.ts` is 347 lines against WEB-000's 300-line
  hard ceiling for a `.ts` module.** It shrank by 16 here but needs its own
  split.
- **150 `as unknown as` remain in unmigrated code.** Each screen migration
  should convert its own reads onto `lib/postgrest`; the boundary is now there
  to convert them onto. The largest concentrations are
  `app/(app)/field/inspection/[id]/page.tsx` (10),
  `app/(app)/reviews/[id]/page.tsx` (13), `lib/factory360/dossier.ts` (10).
- **`readSingle` on a `.maybeSingle()` read cannot distinguish "no row" from
  "row failed to narrow"** at the call site beyond the `failed` flag — both
  return `row: null`. Every current caller treats them the same. If a screen
  ever needs to, the result type needs a third state.

## Blocked / open questions

**Measurement request for the human** (WEB-005 §8): generate Supabase database
types and type the client —

```bash
npx supabase gen types typescript --project-id <id> > apps/web/src/lib/database.types.ts
```

then `createServerClient<Database>(…)` in `lib/supabase-server.ts`. That would
make most of `features/*/shapes.ts` redundant and turn a schema change into a
compile error instead of a narrowing failure at request time. It needs database
access this workstation does not have.

## Proposed commit

```
refactor(data): narrow postgrest reads, drop 48 unsafe casts
```

## Next

**T-043 — WEB-012 violations in three migrated files**
(`planning/header-actions/export-button.tsx` creating and clicking an anchor;
`shell-mobile-nav.tsx` and `shell-admin-palette.tsx` writing
`document.body.style.overflow`).

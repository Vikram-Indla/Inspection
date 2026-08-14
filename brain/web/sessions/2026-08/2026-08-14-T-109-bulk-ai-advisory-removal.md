# 2026-08-14 · T-109 — the AI planning summary leaves `/planning/bulk`

`task: T-109` · `status: done — code complete; the contract record is owed by the sponsor` · `duration: ~0.5h`
`rules applied: WEB-000, WEB-006 §4, WEB-008, WEB-013, governance.md, product-contract.md`

---

## Goal

Owner-directed removal of the AI advisory widget from the top of `/planning/bulk`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/planning-bulk/bulk-ai-advisory/bulk-ai-advisory.tsx` | deleted | 39 → 0 |
| `components/sections/planning-bulk/bulk-screen/bulk-screen.tsx` | edited — render block and 4 imports removed | 59 → 53 |
| `features/planning-bulk/strings.ts` | edited — `buildAdvisoryStrings` removed | 100 → 96 |
| `features/planning-bulk/targeting.ts` | edited — `planningAiContext` removed | 116 → 105 |
| `i18n/locales/{en,ar}/planning.json` | edited — `bulk.ai` block removed | 8 keys each → 0 |
| `e2e/ai-user-journey.spec.ts` | planner journey block deleted | 60 → 50 |
| `e2e/ai-delta-contract.spec.ts` | first test deleted | 48 → 38 |

## Decisions

**This removed a contracted capability, and that was surfaced before acting, not
after.** `domain/atomic_scope.csv` rows 17 and 27 classify the AI Planning
Summary (`MVP1-M01-016`, `MVP1-M01-026`) as **MVP1 Mandatory — "Implement as
specified"**, accepted as `AC-0016` / `AC-0026`. Those rows sit under change
ticket `CC-AC-0016-0026-AI-PLANNING-SUMMARY-DEFERRAL-001` (`DEC-026`), whose
status is **OPEN**, whose approval is **PENDING**, and whose `scope_forbidden`
states plainly that *no code change is authorized by this ticket alone*.

The concern was put to the owner with the options laid out. **The owner
reaffirmed: remove it once and for all.** That is their call and it was executed
in full. **`AC_LEDGER.csv` still marks both rows `implemented` and now overstates
the build** — it was not edited, because `product-contract.md` forbids changing a
controlled contract without an approved change ID. The sponsor (Vikram Indla)
owns `DEC-026`.

**`components/ai/advisory-strip` survives.** `executive-brief` and
`factory-ai-advisory` still compose it. Only the bulk-specific layer was removed.

**Two spec blocks were deleted, not re-pointed** — the behaviour they assert no
longer exists, so there is nothing to point them at. This is a genuine reduction
in contract coverage for `AC-0016` / `AC-0026` and is recorded as such rather
than absorbed silently.

## Inventory taken before writing code

- `BulkAiAdvisory`: **one consumer** (`bulk-screen.tsx`), verified across `src/`,
  `e2e/` and `scripts/`.
- `buildAdvisoryStrings`, `planningAiContext`: one consumer each, the same file.
- `bulk.ai`: 8 keys per locale, read only by the deleted component.
- `BulkMessages = ReturnType<typeof bulkMessages>` derives from the JSON, so
  removing the block is type-safe once the builder is gone.

## Numbers

```
Route: /planning/bulk
source lines removed   39 (component) + 21 (support) = 60
i18n keys removed      8 × 2 locales
always-on widgets      1 → 0
typography gate        PASSED, unchanged
typecheck              0 errors
```

## Accessibility

Not applicable — the change removes a surface. No markup was added.
**No axe run**; the route needs `planning.create.bulk` and this session has no
seeded planner.

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — script does not exist
- [x] `npm run gates:typography` — PASSED
- [ ] `npm run test:e2e` — **not run**
- [x] Full grep: `planning_summary-panel`, `BulkAiAdvisory`, `planningAiContext`,
      `buildAdvisoryStrings` return **nothing** across `src/` and `e2e/`

## Retirement

`components/sections/planning-bulk/bulk-ai-advisory` deleted; ledger row added
with the full contract reasoning. Running total 11 → 12.

## Parked

**`ai-delta-contract.spec.ts` was already failing before this task.** It asserts
`ContextualAiPanel` and `AC-0016` inside `bulk/page.tsx`; those strings moved to
`bulk-screen.tsx` in an earlier refactor. **The same shape almost certainly
exists elsewhere in that spec** — it reads four other source files by path and
every one is a migration target.

## Blocked / open questions

**`DEC-026` needs a sponsor decision, and the code has now moved ahead of it.**
Option A (document the MVP2 deferral) is now the only self-consistent choice, and
`AC_LEDGER.csv` needs correcting to match what ships.

## Proposed commit

```
feat(planning): remove the AI planning summary from bulk targeting
```

## Next

Raise `DEC-026` with the sponsor so the acceptance ledger stops overstating the
build.

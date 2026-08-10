# 2026-08-10 · T-045 — single-visit search: pending state, honest no-match, registry pill tone

`task: T-045` · `status: done (not verified in a browser)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-009, WEB-011`
`commit: d1c57122`

---

## Goal

Three owner-reported defects on `/planning/single`: no visible loading state
while a CR search resolves, "No factory matches" shown beside a factory that
*was* found, and Active pills rendering grey/blue instead of green.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/planning-single/factory-results/factory-results.tsx` | modified | 120 → 133 |
| `features/planning-single/registry-status.ts` | created | — → 8 |
| `app/(app)/planning/single/Wizard.tsx` | modified | — |
| `app/(app)/planning/single/page.tsx` | modified | +1 string |

## Decisions

**The loading state existed for screen readers only.** `settled` was already
computed correctly and `aria-busy` was already set — nothing visible rendered.
Now `SkeletonRegion` + three block bones render while pending. Used the existing
primitive rather than hand-rolling: it already owns `role="status"`,
`aria-live="polite"`, `aria-busy` and the visually-hidden label, and the
retirement ledger is explicit that this system uses **skeletons, not spinners**.

**"No factory matches" was a genuine logic bug.** This screen runs **two
independent lookups** — `results` (graded legacy factory search) and
`portfolios` (canonical CR resolver). The empty state tested only
`results.length === 0`, so when the resolver found the CR and the legacy search
did not, section 1 flatly contradicted section 2. `FactoryResults` now takes
`matchedElsewhere` and requires **both** paths to be empty. Passed as a prop
rather than reaching for `portfolios` inside the component, so the component
keeps stating its own contract.

**Only `active` is mapped to a tone.** `industrial_licenses.status` and
`commercial_registrations.status` are `text` columns with **no check
constraint** — values come from the source system. `active → success`,
everything else falls back to `neutral`, following the house pattern in
`features/approvals/rows.ts`. Asserting a tone for "suspended" or "revoked"
without a governed vocabulary would be inventing meaning.

**Theme needed no work.** `tone="success"` already resolves to
`--sqx-status-compliant-soft` / `-on-soft`, which flip per theme in `saqeel.css`
with measured contrast recorded (6.79 light, 9.04 dark). No new colour, no new
token — this was a tone-mapping bug, not a palette one.

## Inventory taken before writing code

- `settled = queryInput.trim() === query && !searchPending` — correct, just
  invisible.
- Two lookups, two independent result sets, one empty state.
- Two `StatusPill`s: CR portfolio (`neutral`) and licence (`info`) — inconsistent
  with each other as well as wrong.

## Numbers

```
Route: /planning/single
visible pending state   none → SkeletonRegion (3 bones)
contradictory states    1 → 0
status tones asserted   1 (active); all others neutral by fallback
i18n keys added         1 (plan.single.searching) — English only, see below
```

## Accessibility

- The pending state is now announced *and* visible; previously only announced.
- Status is text plus tone, never colour alone (unchanged — the label was
  always present).
- axe: **not run**.

## Verification

- [x] `npm run typecheck` — clean
- [ ] axe, keyboard, Arabic, dark — owed
- [x] No orphaned CSS classes introduced (checked used-vs-defined)

## Retirement

Nothing marked.

## Parked

- **`plan.single.searching` has no Arabic.** This screen predates the JSON i18n:
  its Arabic comes from the **`ui_strings` database table**, with English as an
  inline `t(key, en)` fallback. The new key needs a row inserting or it renders
  English in Arabic. Every other `plan.single.*` key is in the same position —
  the pattern was not introduced here, but this task added to it.
- **The registry pills render raw source text** via `titleCase(l.status)`, so
  "Active" is the source system's English word in both locales. Pre-existing;
  it is the reason the pill cannot currently be localised at all.

## Blocked / open questions

Whether `/planning/single` should migrate off `ui_strings` onto the JSON
namespaces like every screen migrated since T-036. That is a task, not a note.

## Proposed commit

```
fix(planning): add search skeleton, honest no-match state, active pill tone
```

## Next

T-046 — `/planning/bulk`.

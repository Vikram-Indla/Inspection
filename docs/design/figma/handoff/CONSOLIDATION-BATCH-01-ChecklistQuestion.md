# Consolidation batch 01 — ChecklistQuestion

Quality loop run in full: source inspected, current web component inspected, classified,
consolidated at source, applied to the screen contract, tested at four widths, verified.

## Classification

| Source definition | Node | Variants | Size | Class |
|---|---|---|---|---|
| `Questions` | `98:9874` | 5 | 1586×824 | reusable domain — **superseded** |
| `Questions New` | `159:51204` | 3 | 2765×1157 | duplicate |
| `Questions New` | `523:62916` | 4 | 826×1922 | duplicate |
| `Questions New` | `1032:48465` | 3 | 826×1314 | duplicate |
| `Questions New` | `1026:47107` | 3 | 826×1230 | duplicate |
| `Questions New selection` | `239:355697` | 3 | 2765×492 | duplicate |

**Six definitions, 21 variants → one component, 4 variants.**

## What the source had that the web component did not

Read from the source before building, not assumed:

1. **Section label** above the item (`التراخيص والتصاريح` — Licences & permits)
2. **Linked clause** to the governed violation (`الجزاءات والمخالفات` — Penalties & violations)
3. **Package-defined answer options** — the source uses `ساري / منتهي / لا يوجد`, not a fixed
   compliant/violation/na triple
4. **Attach state** — evidence bound to the item
5. Progress indicator

The repo component had `readOnly` and a note affordance the source lacked. Both survive.

**Governance note:** response options are defined by the published inspection package. The
component carries a visible line saying so and does **not** hardcode a governed option set —
CLAUDE.md rule 10.

## The consolidated component

| | |
|---|---|
| Figma node | **`317:137`** on page `Domain: Inspection` |
| Variants | `State=Unanswered` · `Answered` · `Attached` · `ReadOnly` |
| Width behaviour | FILL — responsive, no fixed width |
| React dependency | `apps/web/src/components/saqeel/inspection/ChecklistQuestion.tsx` (90 lines, existed, was placed on no screen) |
| Component dependencies | `Badge` (`9:25`) for the option chips |
| Type ramp | 12 / 13 only — both on the system ramp |
| Token binding | 100% — 0 unbound fills, 0 unstyled text |

## Applied to contract

| Contract | Persona | Catalogue route | **Real shipped route** | Figma node | Jira |
|---|---|---|---|---|---|
| SCR-IPAD-630 Inspection Workspace | Inspector | `/ipad/inspections/:id` *(does not exist)* | **`/field/inspection/[id]`** (856 lines, WIRED) | EN `305:40533` · Dark `310:41030` · AR `312:43466` | **NONE FOUND** |

Three instances placed per frame — Answered, Attached, Unanswered — so the contract shows
the answer range rather than a single state. The generic field panel that stood in for the
question region was **removed**, not left beside it.

## Responsive test — SCR-IPAD-630 EN

| Width | Height | Clipped |
|---|---|---|
| 1280 | 1213 | **0** |
| 1024 | 1213 | **0** |
| 834 | 1213 | **0** |
| 680 | 1232 | **0** |

Height grows at 680 because the requirement line wraps. That is correct reflow, not overflow.

## Verification

| Check | Result |
|---|---|
| Clipping | 0 at every width |
| Placeholder text | 0 |
| Unstyled text | 0 |
| Unbound fills | 0 |
| iPad delivery reference | none — the component carries no device assumption |
| Inaccessible control state | options are text + shape badges, never colour alone |

**Defects found in my own build and fixed before commit:**

- The `Answered` variant marked **all three** options as selected. Only the chosen one now
  reads as selected; the rest are unselected.
- The clause link rendered as plain secondary text with no link affordance. Now accent
  coloured and underlined.

## Blockers carried forward

1. **Jira: NONE FOUND.** No epic covers the inspector. This contract has no story-level
   traceability and I am not substituting a frame count for one.
2. **Route contract unresolved** — the catalogue says `/ipad/inspections/:id`, the app ships
   `/field/inspection/[id]`. Recorded on both.
3. **AR instances are detached.** Figma has no RTL direction property, so mirroring requires
   flattening. Component edits will not propagate into the AR frame; it is regenerated.
4. The `Progress` region of SCR-IPAD-630 still reads *Not configured* — autosave and answered
   counts are governed values with no configured source.

## Remaining in this workstream

Six consolidations left: `AnswerBar` (3 defs), `TaskCard` (5 defs), `CheckingList` (2),
`LocationVerification` (2), `MediaMinis`, `MicButton` — plus placing `FileUpload`, which
exists in the repo and appears on no screen.

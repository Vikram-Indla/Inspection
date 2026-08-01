# Consolidation batch 02 — the remaining six

Quality loop run per concept: source inspected, current web component inspected, classified,
built or consolidated at source, verified.

## Two classifications changed once I read the source properly

**`Answer Bar` / `Answa` / `Answa 2` are not duplicates of each other.** They carry two
different governed option sets — `ساري / منتهي / لا يوجد` (licence status) and
`مخالف / غير مخالف` (compliance). One component with the option set as *content* is correct;
two components would hardcode governed values, which rule 10 forbids.

**`TaskCard` was a duplicate I nearly shipped.** I built it, then removed it. `InspectionCard`
already carries `Variant=Summary | Assignment | Queue` — that *is* the density axis the five
source Task Card definitions differ on. Creating a second card component would have been the
exact duplication this audit exists to remove. Only the map overlay was genuinely new, so it
became `Variant=MapOverlay` on the existing set.

## Components delivered

| Component | Node | Variants | Consolidates | Unstyled | Unbound | Clipped |
|---|---|---|---|---|---|---|
| `ChecklistQuestion` | `317:137` | 4 | 6 defs / 21 variants | 0 | 0 | 0 |
| `AnswerBar` | `318:107` | 4 | `125:14217`, `221:69660`, `239:357820` | 0 | 0 | 0 |
| `MediaThumb` | `318:118` | 4 | `159:47720` (8 variants → 4) | 0 | 0 | 0 |
| `MicButton` | `318:125` | 3 | `558:47312` | 0 | 0 | 0 |
| `FileUpload` | `318:138` | 3 | `159:47675` | 0 | 0 | 0 |
| `DataChecklist` | `319:164` | 5 | `239:351034` + `239:346035` | 0 | 0 | 0 |
| `DataChecklistRow` | `319:84` | 1 | row of the above | 0 | 0 | 0 |
| `LocationVerification` | `319:193` | 2 | `422:32955` | 0 | 0 | 0 |
| `InspectionCard` **extended** | `164:88` | 6 → **8** | 5 Task Card defs | 26 *(pre-existing)* | 0 | 0 |

**24 source definitions → 8 components.**

### Design decisions worth stating

- `MediaThumb` drops the source's `Hovering?` axis. Hover is an interaction, not a design
  state; keeping it doubled the set for no contract value. The interaction is documented,
  not enumerated.
- `MicButton` is modelled as a **browser capability**, not device chrome. Voice capture works
  at every width; the source treated it as tablet furniture.
- `FileUpload` finally places `components/saqeel/inputs/FileUpload.tsx`, which existed in the
  repo and appeared on **no screen** in the design.
- `DataChecklist` counts render `Not configured`. Workforce and capacity figures are governed
  values and are never defaulted.

## Verification

Every component authored in this batch: **0 unstyled text, 0 unbound fills, 0 clipping,
type sizes on the system ramp (12/13 only).**

**Defects in my own work, found and fixed before commit:**

| Defect | Cause | Fix |
|---|---|---|
| `TaskCard` duplicated `InspectionCard` | I built to my own plan without re-reading the existing set | Removed; extended the existing set instead |
| Variants overlapping in the set | I laid out by uniform row height against variable-height children | Positioned by cumulative column height |
| 10 texts silently unstyled | I reassigned `fontName` **after** `setTextStyleIdAsync`, which detaches the style. `t-mono` is already monospace, so the reassignment was never needed | Applied `t-mono`, dropped the reassignment |

## Known, not fixed — recorded deliberately

`InspectionCard` carries **26 unstyled texts and five type sizes (10, 11, 12, 13, 14)**, two of
them off the ramp. This is **pre-existing**: the component was authored before text styles
were in use. I did not restyle it, because it is instanced across the review surfaces and a
type change there would alter screens outside this batch's scope. It belongs in a separate,
deliberate change with its own regression check.

## Contracts and Jira

| Component | Persona | Real shipped route | Jira |
|---|---|---|---|
| `ChecklistQuestion` | Inspector | `/field/inspection/[id]` | **NONE FOUND** |
| `AnswerBar` | Inspector | `/field/inspection/[id]` | **NONE FOUND** |
| `MediaThumb`, `FileUpload` | Inspector | `/field/inspection/[id]` (evidence has no route of its own) | **NONE FOUND** |
| `MicButton` | Inspector | `/field/inspection/[id]` | **NONE FOUND** |
| `DataChecklist` | Inspector, Supervisor | `/field/establishments`, `/field/factory-360/[id]` | **NONE FOUND** |
| `LocationVerification` | Inspector | `/field/[visitId]/travel` | **NONE FOUND** |
| `InspectionCard` MapOverlay | Inspector | `/field/map` | **NONE FOUND** |

## Blockers

1. **Jira NONE FOUND** for every inspector contract. Unchanged, and still the reason none of
   this is story-traceable.
2. **Route contract** `/ipad/*` versus shipped `/field/*` — unresolved.
3. **`InspectionCard` type debt** — 26 unstyled, 2 off-ramp sizes, deliberately deferred.
4. These components are **built and verified but not yet applied** to every mapped contract.
   `ChecklistQuestion` is applied (batch 01); the other seven are placed in the library and
   applied to their screens in the next batch.

**Not claimed:** components exist and are clean; screen application beyond SCR-IPAD-630 is
outstanding, and no contract has Jira traceability.

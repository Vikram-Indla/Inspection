# Batch 06 — Summons Notice, and what the source actually models

## The finding that changes the classification

`Summons Notice` is **not one screen**. Reading `2312:158225` in the source shows a
**record-authoring flow with a record-type selector**. One form, eight record types:

| Source record type | Repo route |
|---|---|
| محضر إثبات واقعة — incident record | `/field/incident-reports` |
| محضر ضبط مخالفة — violation record | `/field/inspection/[id]/results` |
| محضر سحب عينة — sample collection record | `/field/sample-collection-reports` |
| محضر إتلاف منتجات مخالفة — destruction record | `/field/destruction-reports` |
| محضر حجز منتجات — product seizure record | **NO ROUTE** |
| إشعار بتبليغ برفع الحجز — seizure release notice | **NO ROUTE** |
| محضر حجز خط الإنتاج — production line seizure record | **NO ROUTE** |
| محضر المنشأة — facility record | `/field/facility-reports` |

This resolves two open items and opens one.

**Resolved — `Production Line Report` is not a missing screen.** The 16 frames classified
`DECISION PENDING` in the screen classification are the *production line seizure record*, one of
eight types in this flow. It was never a standalone route, so "16 designed frames and no route"
was the wrong reading. It has no route because none of the seizure types do.

**Resolved — why `/field/sample-collection-reports` and `/field/facility-reports` have no source
design of their own.** They are types in this form, not separate screens. The journey contract
listed both as "no design, decision pending"; they are designed, just not as standalone screens.

**Opened — the repo and the source disagree on shape.** The source models one flow with eight
types. The repo ships **five separate routes** and omits three types entirely. That is a real
architectural divergence, and it is a product decision:

- **Option A** — one `/field/records` route with a type selector, matching the source. The five
  existing report routes become type parameters.
- **Option B** — keep separate routes and add three missing ones for the seizure types.
- **Option C** — the three missing types were deliberately dropped; confirm and remove them
  from the design.

**This also answers the entry-point question.** The four unreachable report routes are
unreachable because in the source they were never entered directly — they are entered by
choosing a record type inside this flow. The missing entry point is this screen.

## Built

| | |
|---|---|
| Frame | **`340:42098`** |
| Section | **`339:42098`** — `SCREENS — INSPECTOR UNGOVERNED (migrated from source · no catalogue row) · EN · Light` |
| Name | `UNGOVERNED — Summons Notice & Records — /field/summons-notices — INSPECTOR 834 · EN · Light` |
| Persona | Inspector |
| Repo route | `/field/summons-notices` — **unreachable**, no inbound link |
| Jira | **NONE FOUND** |
| Dependencies | `filter-chip` `72:6736`, `Field` `171:28`, `Radio` `9:74`, `FileUpload` `175:19`, `Button` `8:32`, `section-title` `70:12` |

**Regions**, from the source: record type selector (8 chips) · Details — record date, subject,
region, department, required document type · Notes · Attendance and signature — a two-option
radio · Signature file dropzone · Previous / Next.

The three routeless types are named on the screen itself with the pending decision stated,
rather than quietly omitted.

## A new, uncontested section

`339:42098` was created for migrated ungoverned screens, and the Establishments EN frame
(`336:45825`) was **moved out of `305:40149`** into it. That section is being actively rebuilt by
another agent; keeping my work there invites a collision on every pass.

## Responsive

| Width | Height | Clipped |
|---|--:|--:|
| 1280 | 935 | **0** |
| 1024 | 968 | **0** |
| 834 | 968 | **0** |
| 680 | 984 | **0** |

The chip row wraps from two lines to three as width drops. 0 placeholder literals, 0 off-ramp
type sizes, 0 unbound fills.

**Fixed during the batch:** a `Notes` section title sat directly above a `Notes` field label —
the same word twice. Title removed.

## Known limitation, recorded not hidden

Field values render in the `Input` component's placeholder slot, which is **centred and muted**.
So `Riyadh` reads as a placeholder rather than an entered value. `Input` has no separate value
slot — this is the component's shape, and it affects every form screen in the file, not just
this one. It belongs with the `section-title` text-style gap as a component-library fix.

## Still outstanding

| Item | Status |
|---|---|
| Dark and AR variants of this screen | not built |
| States — validation, saved, submitted | not built |
| Destruction Reports, Incident Reports as screens | superseded — they are types in this flow, pending the Option A/B/C decision |
| Entry point for the flow | **answered** — this screen is it; it still needs a link in `FieldNav` or the visit flow |

**Not claimed:** one EN frame with verified reflow. No Dark, no AR, no states, and the
route-shape decision above is unresolved.

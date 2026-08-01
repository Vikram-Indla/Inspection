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

---

# Batch 07 — Dark and AR, and a collision-free home for ungoverned screens

## Sections

Three sibling sections now hold every migrated ungoverned screen, all clear of the contested
`305:40149`:

| Section | Node |
|---|---|
| `SCREENS — INSPECTOR UNGOVERNED (migrated from source · no catalogue row) · EN · Light` | `339:42098` |
| `… · EN · Dark` | `342:42170` |
| `… · AR · RTL` | `342:42171` |

The Establishments Dark and AR frames were moved out of the governed theme sections into these,
so all six ungoverned frames sit together and none of them depends on a section another agent
is rebuilding.

## Frames

| Screen | EN · Light | EN · Dark | AR · RTL |
|---|---|---|---|
| Establishments | `336:45825` | `336:46018` | `336:46351` |
| Summons Notice & Records | `340:42098` | **`342:42172`** | **`342:44733`** |

Dark is a mode switch, not a repaint — `setExplicitVariableModeForCollection` on the `Color`
collection. EN Light was pinned to `Light` explicitly at the same time so it cannot inherit a
mode from a parent later.

## Arabic

Every Arabic string in `342:44733` is the **source design's own copy** from frame `2312:158225`
— `مذكرة استدعاء`, `نوع المحضر`, `تاريخ المحضر`, `تأكيد الحضور والتوقيع`,
`ارفع صورة التوقيع بصيغة PNG أو JPG أو PDF.` and the eight record-type names.

Combined with batch 04, which used the repo's `page.tsx` strings, **neither ungoverned screen
carries model-authored Arabic.** That is the standard to hold: take the copy from the source
design or the shipped app, never invent it.

The one authored string is the routeless-record-types note, which describes a repository fact
that exists in no design and no app.

## Verification — all six frames

| Frame | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Establishments EN · Light | 0 | 0 | 0 | 0 |
| Establishments EN · Dark | 0 | 0 | 0 | 0 |
| Establishments AR · RTL | 0 | 0 | 0 | 0 |
| Records EN · Light | 0 | 0 | 0 | 0 |
| Records EN · Dark | 0 | 0 | 0 | 0 |
| Records AR · RTL | 0 | 0 | 0 | 0 |

Also 0 across all six: off-ramp type sizes, `Placeholder text` literals, Arabic left in a mono
slot.

## Still outstanding

- Records flow states — validation, saved, submitted.
- Establishments states in Dark and AR (EN-only is the file convention, delta D5).
- The route-shape decision from batch 06 — one flow with eight types, or separate routes.
- A `FieldNav` entry point for the records flow.
- **Jira: NONE FOUND** on both screens.

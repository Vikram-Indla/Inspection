# Batch 16 — Startup Pack, and why the card merge was refused

## Startup Pack

| | |
|---|---|
| Frame | **`360:42863`** in `339:42098` |
| Route | `/field/[visitId]` — **2,792 lines** across its directory, the largest surface in the channel |
| Reachable | yes — `field/page.tsx:252`, `my-tasks/PrepareAssignmentAction.tsx:24`, `visits/VisitsClient.tsx:64` |
| States | empty, error, loading, offline, permission, validation — **6** |
| Dependencies | `LocationVerification` `319:193`, `Alert` `11:43`, `Checkbox` `9:71`, `Badge` `9:25`, `Button` `8:32` |
| Jira | **INSP-593** (offline recovery), **INSP-599** (geofence / GPS override) |

Regions from the shipped code: visit identity · inspection package with the **authority checksum
gate** · readiness checklist · arrival and geofence · health-vs-risk · confirm.

**Three governed rules carried through rather than smoothed over:**

1. *"Cached package needs verification"* — the checksum gate is a real precondition, drawn as a
   warning with the checksum rendering `Not configured`.
2. *"Health and Risk are distinct governed concepts"* — the shipped code says so explicitly, so
   the contract shows them as separate, not one score.
3. An override needs **a governed reason code and a written explanation, both mandatory**. Neither
   is configured, so neither is invented.

`LocationVerification` is reused for arrival — the `Mismatch` variant is the interesting case,
since that is what forces the override path.

**Responsive:** 0 clipped / 0 crunched at 1280, 1024, 834, 680. 0 off-ramp, 0 unbound. Height
constant — every region is fluid.

---

## The `EstablishmentCard` ↔ `Factory card` merge — refused, with reasons

The duplicate audit listed these as Tier 2 item 10, "the same object with different status
vocabulary". Reading both structures, **they are not the same object**, and I am not merging them.

| | `Factory card` `27:491` | `EstablishmentCard` `336:45591` |
|---|---|---|
| Shape | title + **6 label/value fact rows** + 2 badges | avatar + name + status badge + licence + city + risk mark |
| Job | dense fact table in a **CR portfolio rail** | **search-result row** — find the establishment in front of me |
| Facts | Licence · Plant · Type · Stage · Compliance · Open violations | licence · city · risk band |
| Live instances | **4**, all inside `SCR-WEB-400` (`27:353`, `95:7174`) | 12, all on `/field/establishments` frames |

**The audit contradicts itself.** Its own section 3 concludes these are
*"RELATED-BUT-DISTINCT — one entity, two legitimately different working sets"*, and reaches the
right answer: the inspector needs "find the establishment in front of me", the planner needs
"rank my CR portfolio by risk". Same rows, different question. Tier 2 item 10 then lists them as
a merge candidate. Section 3 is correct.

Merging would produce a variant axis carrying **six fact rows in one branch and three in the
other** — two components wearing one name, which is the failure mode this audit exists to prevent.

**Recorded instead of merged**, and the four live instances in another workstream's `SCR-WEB-400`
frames are untouched.

What *is* worth sharing is the **status vocabulary**, not the layout: `Factory card` uses two raw
`Badge` instances both reading `Critical`, while `EstablishmentCard` uses `Badge` + `ExceptionMark`.
That is a real inconsistency and it belongs to whoever owns `SCR-WEB-400`.

---

## Contracts — 18 frames, 10 routes

`/field` · `/field/[visitId]` · `/field/establishments` (+Dark, AR, 3 states) ·
`/field/summons-notices` (+Dark, AR) · `/field/notifications` · `/field/settings/devices` ·
`/field/settings/conflicts` · `/field/factory-360/[id]` · `/field/visits` · `/field/search`

All pass **0 clipped / 0 crunched** at four widths.

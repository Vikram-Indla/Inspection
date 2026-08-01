# Consolidation batch 03 — the seven components applied to their screen contracts

Batch 02 built the components. This batch places them on the governed inspector frames in all
three locale/theme sections, and fixes what the placement exposed.

## Applied

| Component | Frames | Region added | Persona | Catalogue route | **Real shipped route** |
|---|---|---|---|---|---|
| `AnswerBar` · `MicButton` | SCR-IPAD-630 EN · Dark · AR | *Compliance response* | Inspector | `/ipad/inspections/:id` | **`/field/inspection/[id]`** |
| `DataChecklist` | SCR-IPAD-630 EN · Dark · AR | *Establishment data* | Inspector | `/ipad/inspections/:id` | **`/field/inspection/[id]`** |
| `FileUpload` · `MediaThumb` | SCR-IPAD-640 EN · Dark · AR | *Attachments*, *Captured evidence* | Inspector | `/ipad/inspections/:id/evidence` | **`/field/inspection/[id]`** (evidence has no route of its own) |
| `LocationVerification` | SCR-IPAD-620 EN · Dark · AR | *Arrival verification* | Inspector | `/ipad/visits/:id/journey` | **`/field/[visitId]/travel`** |
| `InspectionCard` `Variant=MapOverlay` | SCR-IPAD-620 EN · Dark · AR | *Map selection* | Inspector | `/ipad/visits/:id/journey` | **`/field/map`** |

**Jira: NONE FOUND on every row.** Unchanged and still the reason none of this is
story-traceable. No epic covers the inspector.

Nine frames touched — three screens × EN Light, EN Dark, AR RTL. AR instances are detached and
mirrored, because Figma has no RTL direction property; component edits do not propagate there.

### DataChecklist has no governed host

`DataChecklist` maps to `/field/establishments` and `/field/factory-360/[id]`. **Neither has a
governed screen** — both are among the 28 ungoverned `/field/*` routes in delta D3. It is
therefore applied to SCR-IPAD-630, the one governed inspector contract that hosts on-site
establishment data. The web `SCR-WEB-400 Factory 360` frame exists but is a different persona
and route, so it was not used.

## Responsive

| Screen | 1280 | 1024 | 834 | 680 |
|---|---|---|---|---|
| SCR-IPAD-620 | 0 clipped | 0 | 0 | 0 |
| SCR-IPAD-630 | 0 | 0 | 0 | 0 |
| SCR-IPAD-640 | 0 | 0 | 0 | 0 |

Heights grow at 680 on 630 and 640 — copy wraps. Correct reflow, not overflow.

## Final audit — all nine frames

| Check | Result |
|---|---|
| Clipping | **0** at every width, every frame |
| Type sizes off the system ramp | **0** |
| Danger-bound text in a non-error slot | **0** |
| Latin copy left in AR | **0** (identifiers only — `SCR-IPAD-620`, `INS-04412`, `RHOA2874`) |
| Non-Arabic fonts in AR | **0** |
| Untranslated strings | **0** of 66 |
| Dark theme | verified by render — no cached-literal leak |

## Defects the placement exposed — all fixed

| # | Defect | Where | Fix |
|---|---|---|---|
| 1 | **`DataChecklist` invented a governed value.** Every row read `200` while the header badge read *Not configured* — a contradiction, and a CLAUDE.md rule 10 breach in my own component | `319:164`, all 5 variants | Values render `Not configured` |
| 2 | **All 5 categories carried identical rows.** Workforce, RawMaterials, Products, Machinery and SpareParts each showed the same duplicated workforce label. The `Category` property changed only the header | `319:164` | One row per category, each with its own label; duplicate filler row removed |
| 3 | **`FileUpload` had no control.** Empty and Uploaded were text only — an upload component that cannot be operated | `318:126`, `318:130` | *Choose file* on Empty; *Replace* / *Remove* on Uploaded. ViewOnly stays control-free, correctly |
| 4 | **Hint copy in the danger-bound required slot.** *Recorded against the capture* rendered red and inline, reading as an error | `306:40695` + AR copy | Moved to a `t-caption` line bound to the subtle text token; `req` hidden |
| 5 | **`DataChecklist` values rendered monospace.** `t-mono` is the identifier style; the slot now carries prose | source + AR copies | `t-compact` / `t-compact-ar` |
| 6 | **AR rows hugged the wrong edge.** Map-overlay, evidence and answer rows are FILL width, so `primaryAxisAlignItems=MIN` left them flush left in an RTL frame | 19 rows across the 3 AR frames | `MAX` |
| 7 | **Nested detach ordering.** Detaching a nested instance before its parent invalidated the node reference and killed the run | AR build script | Detach outer-first, re-query each pass |

## InspectionCard type debt — closed, not deferred

Batch 02 deferred this. It is now closed, because the correct fix turned out to be inert:
`score` and `fact` were unstyled at **11**, and the system's `t-caption` is **11.5**. Applying
it across all 8 variants is a 0.5px change that removes 16 unstyled nodes and the only
remaining off-ramp size in one pass.

**Still open on that component:** the `Queue` variant's `facility` is 13 SemiBold and there is
no matching style — `t-compact` is 13 Regular. That is a genuine gap in the type system, not a
component defect, and is not being papered over here.

## Corrections to my own earlier reporting

- **My ramp constant was wrong, not the design.** The batch-02 verification called `11.5` and
  `12.5` off-ramp. They are `t-caption` and `t-mono`. The only real off-ramp sizes were `11`
  and `10`.
- **Batch 02 claimed the seven components were clean.** Two of them were not: `DataChecklist`
  carried an invented figure and duplicated rows, and `FileUpload` shipped without a control.
  Both were caught only when the components were placed on a screen and looked at — the
  structural checks passed them.

## Blockers, unchanged

1. **Jira NONE FOUND** for every inspector contract.
2. **Route contract** — catalogue `/ipad/*` versus shipped `/field/*`.
3. **28 ungoverned `/field/*` routes**, two of which are `DataChecklist`'s natural hosts.
4. **`section-title` carries no text style** anywhere in the file, EN or AR. Pre-existing and
   file-wide; fixing it touches every screen and belongs in its own change.
5. **Arabic is model-authored and unreviewed**, per the 2026-08-01 ruling. The 46 new strings
   in this batch are recorded on the same footing.

**Not claimed:** the components are now on their governed contracts and render clean in three
sections at four widths. Story-level traceability does not exist for any of them, and the
components still have no host for the ungoverned routes.

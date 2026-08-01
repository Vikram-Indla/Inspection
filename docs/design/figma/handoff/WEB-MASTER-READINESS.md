# Web master readiness — canonical English responsive delivery

## The register

`docs/design/figma/traceability/IPAD-TO-WEB-MASTER-REGISTER.csv` — **44 rows**, one per iPad
page, form, component, state group or variant family, each carrying all nine required columns:

`source_item · source_kind · classification · web_figma_node · journey · persona · repo_route ·
route_decision · jira · responsive_states`

| Classification | Rows |
|---|--:|
| MERGE | 12 |
| MIGRATE | 10 |
| REFERENCE-ONLY | 10 |
| OBSOLETE | 7 |
| REUSABLE COMPONENT | 5 |
| **Total** | **44** |

## Canonical versus reference — now explicit in the file

The goal requires Arabic, dark and 834-labelled material to be **reference only unless rebuilt as
canonical**. Two corrections were applied to the master so the file states this rather than
implying it:

1. **`336:45825` and `340:42098`** still carried `INSPECTOR 834 · EN · Light`. Both are verified
   responsive at 1280/1024/834/680, so the 834 label was stale and misleading. Renamed to
   `INSPECTOR responsive · EN · Light`.
2. **The Dark and AR sections** (`342:42170`, `342:42171`) and their four frames are now named
   `REFERENCE ONLY — not canonical delivery … (rebuild in English responsive Web to make
   canonical)`.
3. **The states section** `311:41750` is renamed to say plainly what it holds: 27 iPad-source
   state frames as reference, plus 3 canonical Establishments states.

Canonical delivery is therefore **32 English frames in `339:42098`** plus **3 state frames**.
Everything else in the inspector sections is reference.

## Factory 360 — one capability, persona variants

Recorded as a **single shared canonical capability**, not two designs:

| | |
|---|---|
| Shared data layer | `lib/factory360/dossier.ts` — both routes call `loadFactory360Dossier` with identical arguments |
| Shared design regions | `167:7816` … `167:8020` — ten `panel-content/factory-360-*` components |
| Planner / supervisor variant | `SCR-WEB-400` `27:353` (web width, three-column) |
| Inspector variant | **`356:42542`** (responsive, single column) — **reuses the same ten regions** |
| Inspector-only deltas | licence-currency advisory · offline snapshot · `geo:` action bar |

**The source's `Factory Details` `1237:93408` and `Factory Detail Table Atom` `1237:42917` were
NOT copied.** They are the same dossier drawn for a tablet; importing them would have created a
second Figma family for one capability. Classified MERGE, pointing at the existing regions.

One shared component was improved rather than duplicated: `context-badges` `27:571` in the header
region was `NO_WRAP`/`HUG` and clipped at 680. Set to `WRAP`/`FILL`, and `SCR-WEB-400`
regression-checked clean at 1280.

## Duplicate decisions — resolved or recorded

| Pair | Decision |
|---|---|
| `ChecklistQuestion` `165:110` vs `317:137` | **RESOLVED** — `165:110` deleted (0 instances); it encoded governed option values as variant names |
| `FileUpload` `175:19` vs `318:138` | **RESOLVED** — domain wrapper renamed `EvidenceAttachment`; it composes the primitive |
| `TaskCard` vs `InspectionCard` | **RESOLVED** — never shipped; `MapOverlay` added to the existing set |
| 7 scaffold stubs | **RESOLVED** — renamed `DEPRECATED —` with pointers, 0 instances each, none deleted |
| `dialog` `15:30`, `menu` `15:33` | **RECORDED** — 1 live instance each; description pointers added, migration left to the owner |
| `EstablishmentCard` vs `Factory card` | **REFUSED, recorded** — 6 fact rows vs 3; different questions, same entity. The audit's own section 3 agrees |
| `Panel` `11:45` vs `152:17` | **RECORDED** — audit called `11:45` dead; it has **9 live instances**. Not touched |
| `Badge` / `ExceptionMark` / `SeverityIndicator` / `Exc-chip` | **RECORDED** — one status vocabulary across four components; needs an owner decision |
| `EvidenceCard` `160:44` vs `MediaThumb` `318:118` | **RECORDED** — complementary axes; merging is likely right but touches review surfaces |
| `KPI panel` vs `Operational KPI` | **RECORDED** — subset relationship; belongs to the web workstream |

## Validation — every authored item

**36 frames and 15 components: 0 clipped · 0 crunched · 0 off-ramp type sizes · 0 unbound fills ·
0 placeholder literals**, at 1280, 1024, 834 and 680.

"Crunched" is measured geometrically — text exceeding its parent's box whether or not the parent
clips — because the clip-only check passed a real defect in batch 09.

## Evidence recorded, not blocking

| Item | Where |
|---|---|
| Route shape — 8 record types vs 5 repo routes | `CONSOLIDATION-BATCH-06-RECORDS.md` |
| Catalogue governs `/ipad/*`, a URL space that never existed | `CORRECTIONS-FROM-PARALLEL-AUDIT-2026-08-01.md` |
| 14 of 36 routes unreachable | `INSPECTOR-JOURNEY-CONTRACT-COMPLETE.md` |
| Governed-section ownership | `CONCURRENT-EDIT-COLLISION-2026-08-01.md` |
| Jira — 101 issues under INSP-5 / INSP-3 | register `jira` column |

**No repository, data, credential, integration or workflow change was made in this batch.**

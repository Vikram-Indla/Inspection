# Inspector frame register — 2026-08-01

Frame-by-frame, per the coordinator directive. A screen count is not traceability, so every
row below carries its own node, persona, route, module and delta. Where a column has no
evidence it says so rather than being filled in.

**Single Figma authority:** `ML2PNwfShlQM2k44MvSEw5` (Inspection — Web). Inspector, Planner,
Supervisor and Admin all live in this one file. No second authority exists and none was
created. The `8wGaofgbopqmGXc0Wjo0eW` file was **read only, as a source** — nothing was
copied from it, because the Figma plugin API cannot move nodes between files.

---

## BLOCKER 1 — the governed routes contradict "no iPad delivery"

`screen_route_catalogue.csv` defines these screens as `/ipad/assignments`,
`/ipad/visits/:id/prestart`, `/ipad/inspections/:id` and so on, with IDs `SCR-IPAD-*`.

**No `/ipad/*` route exists anywhere in the repository.** The inspector ships at `/field/*`
— 36 routes, all present and wired. So the catalogue's routes are not the delivered routes.

CLAUDE.md rule 9 fixes routes and forbids renaming them, so I have **not** renamed anything.
This needs a governance decision, and it is the single largest item in this handover:

- **Option A** — amend the catalogue: `SCR-IPAD-*` → `SCR-INS-*`, `/ipad/*` → the real
  `/field/*` routes. Truthful, and removes the "iPad" language the coordinator rejected.
- **Option B** — leave the catalogue and treat `/ipad/*` as an alias never built. Keeps the
  contract stable and leaves the design pointing at routes that do not exist.

Everything below records **both** the catalogue route and the shipped module, so the
register survives either decision.

## BLOCKER 2 — no Jira epic covers the inspector

The live Jira read on 2026-08-01 found epics `INSP-1`…`INSP-16`, `INSP-237` and `INSP-239`.
Those are web, admin and external-portal. **No epic covers the inspector channel.**

So the Jira column below reads `NONE FOUND` for all eight screens. That is a real gap, not
a lookup failure — inventing a key would be worse than recording the absence.

---

## Completed frames

All four sections are clean: **0 placeholders, 0 black text, 0 clipped nodes, 0 blank cells.**

| Screen | Persona | Catalogue route | Shipped module | Wiring | Jira | States |
|---|---|---|---|---|---|---|
| SCR-IPAD-600 Assigned Visits | Inspector | `/ipad/assignments` | `/field/my-tasks` (625 ln) | WIRED | NONE FOUND | 3 |
| SCR-IPAD-610 Startup Pack | Inspector | `/ipad/visits/:id/prestart` | `/field/[visitId]` + `/field/settings/readiness` | WIRED | NONE FOUND | 4 |
| SCR-IPAD-620 Journey & Check-In | Inspector | `/ipad/visits/:id/journey` | `/field/[visitId]/travel` (144 ln) + `/field/map` | WIRED | NONE FOUND | 4 |
| SCR-IPAD-630 Inspection Workspace | Inspector | `/ipad/inspections/:id` | `/field/inspection/[id]` (856 ln) | WIRED | NONE FOUND | 3 |
| SCR-IPAD-640 Evidence Capture | Inspector | `/ipad/inspections/:id/evidence` | **no dedicated route** — evidence handled inside `/field/inspection/[id]` | WIRED (host) | NONE FOUND | 4 |
| SCR-IPAD-650 Findings & Actions | Inspector | `/ipad/inspections/:id/findings` | `/field/inspection/[id]/results` (184 ln) | WIRED | NONE FOUND | 3 |
| SCR-IPAD-660 Pre-Submit | Inspector | `/ipad/inspections/:id/submit` | `/field/inspection/[id]/statement` (97 ln) | WIRED | NONE FOUND | 3 |
| SCR-IPAD-670 Returned Correction | Inspector | `/ipad/returned/:id` | `/field/drafts` (150 ln) | WIRED | NONE FOUND | 3 |

### Figma node ids

| Screen | EN · Light | EN · Dark | AR · RTL |
|---|---|---|---|
| SCR-IPAD-600 | `305:40150` | `310:40973` | `312:42491` |
| SCR-IPAD-610 | `305:40298` | `310:40989` | `312:42925` |
| SCR-IPAD-620 | `305:40461` | `310:41015` | `312:43315` |
| SCR-IPAD-630 | `305:40533` | `310:41030` | `312:43466` |
| SCR-IPAD-640 | `306:40569` | `310:41047` | `312:43795` |
| SCR-IPAD-650 | `306:40708` | `310:41069` | `312:44142` |
| SCR-IPAD-660 | `306:40848` | `310:41088` | `312:44481` |
| SCR-IPAD-670 | `306:40976` | `310:41109` | `312:44825` |

Sections: EN `305:40149` · Dark `310:40972` · AR `312:42490` · States `311:41750` (27 frames,
node ids `311:41751`–`311:42661`, three to four per screen matching each screen's declared
states).

---

## Figma-versus-route delta

| # | Delta | Severity |
|---|---|---|
| D1 | Catalogue routes `/ipad/*` do not exist; the shipped inspector is `/field/*` | **Blocker** |
| D2 | `SCR-IPAD-640` Evidence Capture has no route of its own — evidence is captured inside `/field/inspection/[id]`. The Figma frame implies a destination the app does not have | High |
| D3 | The repo ships **36** `/field/*` routes; the catalogue governs **8**. 28 shipped inspector routes have no governed screen — `/field/summons-notices`, `/field/incident-reports`, `/field/destruction-reports`, `/field/sample-collection-reports`, `/field/facility-reports`, `/field/establishments/unregistered`, `/field/virtual/[id]`, `/field/visits/calendar`, `/field/feedback/rate/[visitId]`, `/field/settings/{conflicts,devices,readiness}`, `/field/notifications/[id]`, `/field/factory-360/[id]`, `/field/completed/[id]`, `/field/reports/[id]` and others | High |
| D4 | `/field/[visitId]/travel` is a separate route; the Figma frame folds journey and check-in into one screen | Medium |
| D5 | No AR section exists for the 27 state frames — states are EN·Light only, matching the web convention | Medium |
| D6 | Inspector frames carry no prototype flow; the web sections have four | Low |

---

## Visual defects — all corrected at source

| Defect | Where | Fix |
|---|---|---|
| `Placeholder text` reintroduced on every new frame | `App topbar` **component** default | Fixed the component, not the copies — Phase 1 had only fixed instances |
| Placeholder copy landed in the hint slot, rendering as a red hint beside the label | `Field` helper in my build script | Hint and placeholder separated; 6 hints and 6 inputs corrected |
| Stray `Column` / `Value` cell | Readiness table asked for 2 columns against a 3-column minimum | Third column given real content — *Evidence needed* |
| Avatar overflowing the frame by 10px | Topbar content wider than 834 | Date-range and region chips hidden, matching `saqeel-runtime.css:1073` |
| Two state bodies overflowing `sq-content` | `SCR-IPAD-630`, `SCR-IPAD-670` | Container set to hug its content |

No crunched or clipped UI remains in any inspector section.

---

## Missing frames

| Missing | Why |
|---|---|
| AR · RTL · Dark inspector | Not built. The web set has four locale/theme sections; inspector has three |
| Inspector states in AR | 27 states exist in EN only |
| 28 shipped `/field/*` routes | No governed screen — see D3. Cannot be designed without a catalogue row or a Jira story |
| Planner / Supervisor persona split | The coordinator asks for one file covering Inspector, Planner, Supervisor and Admin. Inspector and Admin exist; **Planner and Supervisor are not modelled as personas anywhere** — the catalogue assigns personas per screen but there is no persona-level view |

---

## Implementation deltas

- Evidence capture is a **device capability**, not a design surface. The frame states this
  rather than drawing a fake camera, so a developer is not misled into building one.
- Every governed value that is not configured renders its state — package version, geofence
  radius, penalty mapping, acknowledgement requirement, sync counters. None is invented.
- The AR section is **detached** from components, as with the web AR sections. Figma has no
  RTL direction property, so mirroring requires flattening. Component edits do not propagate
  there; the section is regenerated, not patched.

---

## Blockers, in the order they should be resolved

1. **Route contract** — `/ipad/*` versus shipped `/field/*` (D1). Blocks calling any
   inspector frame implementation-ready.
2. **No Jira epic for the inspector.** Eight screens with no story-level traceability. The
   coordinator explicitly forbids a screen count standing in for this, and right now a
   screen count is all that exists.
3. **28 ungoverned inspector routes** (D3) — either the catalogue is short 28 rows, or those
   routes are unjustified. Both are decisions, not work.
4. **Planner and Supervisor personas** are undefined as views.
5. **Arabic is model-authored and unreviewed** across the whole file, per the 2026-08-01
   ruling. Recorded in `model-authored-ar.json`.

**Nothing in this register should be read as complete.** Four sections are visually clean
and structurally sound; none of them has story-level traceability, and two of the five
blockers are governance decisions I cannot take.

# Inspector journey contract

Every stage of the shipped inspector journey, with the columns the coordinator requires:
persona, Jira story or explicit evidence gap, current repo route, final web-route decision or
one explicit decision pending, component dependencies, and required states.

**Single Figma authority:** `ML2PNwfShlQM2k44MvSEw5` (Inspection — Web), page `— SCREENS —`
(`6:9`). No iPad route or device chrome is authoritative anywhere below.

## How the journey was derived

Not from the source prototype. The source file's 113 prototype reactions are hover and
variant-swap noise with off-page destinations — they do not describe a journey. The journey
below is derived from three pieces of evidence that can be re-checked:

1. **The shipped taskbar** — `components/field/FieldNav.tsx`: `/field`, `/field/my-tasks`,
   `/field/establishments`, `/field/notifications`, `/field/account`.
2. **Every in-app link target** under `app/(app)/field` and `components/field`.
3. **The 8 governed contracts** SCR-IPAD-600…670 in the web master.

## BLOCKER — 7 shipped routes are unreachable

These routes exist and render, and **no file in `apps/web/src` links to them**. They cannot be
entered by an inspector using the app.

| Route | Governed screen | Source design |
|---|---|---|
| `/field/summons-notices` | none | **47 frames** |
| `/field/incident-reports` | none | **4 frames** |
| `/field/destruction-reports` | none | **15 frames** |
| `/field/sample-collection-reports` | none | none |
| `/field/facility-reports` | none | none |
| `/field/inspection/[id]/results` | **SCR-IPAD-650** `306:40708` | 8 frames (Violation Report) |
| `/field/settings/readiness` | SCR-IPAD-610 (shared) | none |

`/field/inspection/[id]/results` is the serious one: it is a **governed screen with a built
Figma contract and no way to reach it**. Designing an entry point is a product decision about
where findings sit in the flow, not a design fix I can take.

**Partly answered in batch 06.** Four of these seven — summons, incident, destruction and
sample collection — are unreachable because in the source they were never entered directly.
They are record *types* chosen inside one record-authoring flow. The missing entry point is that
flow, now built as `340:42098`. It still needs a link from `FieldNav` or the visit flow, and the
repo-versus-source route shape is unresolved. `/field/inspection/[id]/results` and
`/field/settings/readiness` are **not** explained by this and remain open.

## The journey

Governed stages first, then ungoverned. `→` marks the primary path.

### Core inspection path — governed

| # | Stage | Persona | Repo route | Web-route decision | Figma node (EN · Dark · AR) | Component dependencies | Required states | Jira |
|--:|---|---|---|---|---|---|---|---|
| 1 | → Assigned visits | Inspector | `/field/my-tasks` | **Keep.** Rename `SCR-IPAD-600` → `SCR-INS-600` **pending** | `305:40150` · `310:40973` · `312:42491` | `InspectionCard` `164:88`, `filter-chip`, `App topbar` | list, empty, offline | **NONE FOUND** |
| 2 | → Startup pack | Inspector | `/field/[visitId]` + `/field/settings/readiness` | **Keep**; readiness is a second, unreachable route — **decision pending** | `305:40298` · `310:40989` · `312:42925` | `DetailRow`, `ad-state`, `table` | ready, incomplete, blocked, offline | **NONE FOUND** |
| 3 | → Journey & check-in | Inspector | `/field/[visitId]/travel` + `/field/map` | **Keep.** Figma folds two routes into one frame (D4) | `305:40461` · `310:41015` · `312:43315` | `LocationVerification` `319:193`, `InspectionCard` `MapOverlay`, `Alert` | en route, arrived, geofence mismatch, offline | **NONE FOUND** |
| 4 | → Inspection workspace | Inspector | `/field/inspection/[id]` | **Keep** | `305:40533` · `310:41030` · `312:43466` | `ChecklistQuestion` `317:137`, `AnswerBar` `318:107`, `MicButton` `318:125`, `DataChecklist` `319:164` | unanswered, answered, attached, read-only | **NONE FOUND** |
| 5 | Evidence capture | Inspector | **no route** — lives inside stage 4 | **Decision pending**: give evidence its own route, or fold the frame into SCR-IPAD-630 (D2) | `306:40569` · `310:41047` · `312:43795` | `FileUpload` `318:138`, `MediaThumb` `318:118`, `table` | empty, capturing, uploaded, sync failed | **NONE FOUND** |
| 6 | Findings & actions | Inspector | `/field/inspection/[id]/results` | **Keep the route, add an entry point — decision pending.** Currently unreachable | `306:40708` · `310:41069` · `312:44142` | `Badge`, `DetailRow`, `Alert` | none, findings raised, penalty proposed | **NONE FOUND** |
| 7 | → Pre-submit statement | Inspector | `/field/inspection/[id]/statement` | **Keep** | `306:40848` · `310:41088` · `312:44481` | `Field`, `Input`, `Alert` | draft, signed, refused | **NONE FOUND** |
| 8 | Returned correction | Inspector | `/field/drafts` | **Keep** | `306:40976` · `310:41109` · `312:44825` | `InspectionCard`, `Badge` | none returned, returned, resubmitted | **NONE FOUND** |

### Ungoverned stages — shipped, no Figma contract

| Stage | Persona | Repo route | Reachable | Source design | Decision |
|---|---|---|---|---|---|
| Sign in | Inspector | `/login/field` | yes | 5 frames — **reference only** | Web login settled under DEC-011 |
| Home / daily briefing | Inspector | `/field` | yes (taskbar) | 1 frame — **reference only** | **Build a contract** |
| Establishments | Inspector | `/field/establishments`, `/establishments/unregistered` | yes (taskbar) | **102 frames** | **MIGRATE** — highest-value ungoverned screen |
| Summons notices | Inspector | `/field/summons-notices` | **no** | **47 frames** | **MIGRATE** + entry point pending |
| Destruction reports | Inspector | `/field/destruction-reports` | **no** | **15 frames** | **MIGRATE** + entry point pending |
| Incident reports | Inspector | `/field/incident-reports` | **no** | **4 frames** | **MIGRATE** + entry point pending |
| Sample collection reports | Inspector | `/field/sample-collection-reports` | **no** | record type in the Summons flow | Entry point = the records screen |
| Facility reports | Inspector | `/field/facility-reports` | **no** | record type in the Summons flow | Entry point = the records screen |
| Production line seizure | Inspector | **no route** | — | record type in the Summons flow | Route shape decision — see batch 06 |
| Factory 360 | Inspector | `/field/factory-360/[id]` | yes | none | Build a contract |
| Virtual session | Inspector | `/field/virtual/[id]` | yes | none | Build a contract |
| Completed / history | Inspector | `/field/completed`, `/completed/[id]` | yes | none | Build a contract |
| Reports library | Inspector | `/field/reports/[id]` | yes | none | Build a contract |
| Notifications | Inspector | `/field/notifications`, `/[id]` | yes (taskbar) | 1 flow label | Build a contract |
| Visits calendar | Inspector | `/field/visits/calendar` | yes | none | Build a contract |
| Search | Inspector | `/field/search` | yes | none | Build a contract |
| Settings — conflicts, devices | Inspector | `/field/settings/*` | yes | none | Build a contract |
| Feedback | Inspector | `/field/feedback/rate/[visitId]` | yes | none | Build a contract |
| Account | Inspector | `/field/account` | yes (taskbar) | 1 flow label | Build a contract |

## Coverage, stated honestly

| | Count |
|---|--:|
| Shipped `/field/*` routes | **36** |
| Routes with a governed Figma contract | **11** (8 contracts, some spanning two routes) |
| Routes reachable from the shipped app | **29** |
| Routes both governed **and** reachable | **10** |
| Source concepts with no repo route | **1** (Production Line Report) |

**10 of 36.** That is the real number. It is not a frame count and it is not flattering.

## Personas other than Inspector

The coordinator asks for one file covering Inspector, Planner, Supervisor and Admin.
Inspector is mapped above and Admin exists as a section. **Planner and Supervisor are still
not modelled as personas anywhere** — `screen_route_catalogue.csv` assigns a persona per
screen, but there is no persona-level view for either. Unchanged from the frame register.

## Jira

Every row reads **NONE FOUND**. The live Jira read on 2026-08-01 found epics `INSP-1`…`INSP-16`,
`INSP-237`, `INSP-239` — web, admin and external portal. **No epic covers the inspector
channel.** Jira is not reachable by CLI or token from here, so no story can be created or
updated programmatically.

**Jira action required, for the coordinator to raise:**

1. Create an inspector epic. Eight governed contracts and 36 shipped routes currently have no
   story-level traceability.
2. Raise a defect for the 7 unreachable routes, calling out
   `/field/inspection/[id]/results` — a governed, designed screen with no entry point.
3. Raise a decision ticket for Production Line Report: 16 designed frames, no route.
4. Raise the route-contract decision: catalogue `/ipad/*` versus shipped `/field/*`.

## Not claimed

This is a journey map with evidence behind every row. **No new screen has been built from
it.** Stages 1–8 are built and verified; everything in the ungoverned table is a contract that
does not exist yet.

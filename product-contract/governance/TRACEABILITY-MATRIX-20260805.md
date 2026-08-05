# Traceability matrix — requirements to design to platform

Measured 5 August 2026. Every figure below is counted from the repository and
the design file, not estimated.

## Purpose

Two questions, not one checklist:

1. **Does every requirement reach a working screen?** A requirement with no
   screen is a real gap and must be fixed.
2. **Does every screen answer to a requirement?** A screen with no requirement
   behind it is possible over-build. It is questioned, not designed around.

The second question matters as much as the first. The instruction is explicit:
do not over-build. Fill a gap only where the requirements ask for something
that is missing.

## Headline

| | Count |
|---|---|
| Platform routes | **126** |
| Covered by an approved design | **75** |
| Built with no design | **51** |
| Designed but never built | **13** |

**Forty per cent of the running product has no approved design.** Thirteen
approved designs were never implemented.

## Link 1 — requirements to Jira: known broken, not merely unmeasured

Some Jira stories state on their own face:

> "Functional source: **Repository evidence only — not an approved BRD or Drive
> requirement.**"
> "Design evidence: **Design gate blocked — no approved Figma screen.**"

Their acceptance criteria are word-for-word identical to one another — generic
boilerplate. Those stories were written from the code. They describe what was
built, not what the business asked for.

Others are genuine. INSP-214 cites an Arabic BRD, its use cases, an approved
design screen, and carries specific criteria.

**Coverage is therefore not calculable yet.** The requirements lane is indexing
all nine BRDs so that every use case and business rule can be counted against
the story list. Until that completes, any percentage here would be invented.

### Confirmed already: three role vocabularies, none matching

| Source | Roles named |
|---|---|
| System administration BRD | Branch Manager · System Administrator (Technical) · System Administrator (Business) |
| Items and regulations BRD | Data Entry User · Approver |
| The database | admin · inspector · planner · supervisor |
| Checks written in code | compliance_admin · form_admin · reviewer — **none of which exist** |

Those invented names closed compliance authoring and approval to every user in
the system. Recorded as INSP-740, INSP-745 and INSP-751.

## Link 2 — design to platform: measured

### Designed but never built — 13

```
/admin/packages/[id]/designer      /field/incident-reports/[id]
/admin/penalties                   /field/incident-reports/new
/admin/workflows/[id]              /field/summons-notices/[id]
/factories/[id]/360                /planning/[id]/review
/field/[visitId]/check-in          /virtual/appointments/[id]
/field/establishments/[id]         /virtual/sessions/[id]/verify
/field/establishments/new
```

Each needs a decision: is it required, or was the design speculative? Do not
assume a design implies an obligation to build.

### Built with no design — 51

The pattern is not scattered. Most fall into three groups.

**Group A — administration screens (22).** Real, in use, and mostly the same
set recorded in INSP-753 as having no menu entry either. These need design, and
several carry work completed today.

```
/admin/audit                    /admin/operations
/admin/bulk-violations          /admin/planning/expiry
/admin/compliance-approvals     /admin/planning/lookups
/admin/compliance-requests      /admin/planning/status
/admin/compliance-requests/[id] /admin/risk/models
/admin/compliance-requests/new  /admin/security-access
/admin/dashboard-config         /admin/templates
/admin/delegation               /admin/devices
/admin/enforcement-recommendations
/admin/execution                /admin/gis/spatial
/admin/integrations/factory-data
/admin/integrations/senai-data
/admin/items/[id]/runtime-preview
```

**Group B — routes that looked like duplication.**

Originally recorded here as "the over-build already present", listing five
families. **Investigated 5 August, and that reading was substantially wrong.**
Only one family contained genuine redundancy.

*Factory 360 — two real duplicates, now removed.*
`/factory-360` and `/factory-360/[id]` were three-line files re-exporting
`/factories`. Deleted in `8416452f`. Removing them exposed that the middleware
protected-route list named the alias and not the real route; corrected in the
same change. The inspector screens are a genuine second channel and already
share the dossier loader.

*Tasks — not duplicates. Both kept.*
`/tasks` is a manager-facing board over `workflow_task_assignments` — backend
workflow items, rendered in the shared shell. `/field/my-tasks` is the
inspector's own master-detail screen over `assignments`, with the shared Factory
360 dossier in its right pane and native field chrome. Different tables,
different audiences, no data overlap. Two features that share an English word.

*Virtual inspection — a two-channel split, like Factory 360. Both kept.*
Both read `virtual_sessions`. The web route is the unfiltered management and
scheduling view; the field route is filtered to the signed-in inspector's own
confirmed sessions, read-only, native chrome. No cross-links in either
direction — each is its own entry point.

*Visit views — already the shared-core answer. No refactor needed.*
All six files are short wrappers. The three planning routes import the exact
same components as the visits routes and pass a base path used only for nav
highlighting and internal tab links. One screen, two doors, deliberately: the
planning page links to visits describing them as "bulk actions and lenses over
the same visits", and the visits page links back. Neither triplet has a
top-level menu entry; both are reached by an in-page tab bar, consistent with
the tab-reached pattern recorded under INSP-753.

*Factories — three routes, distinct purposes.* Registry, factory detail, and a
commercial-registration view. Not investigated in depth; no evidence of
duplication.

### What this correction means

The route count implied redundancy that the code does not contain. Of roughly
fifteen routes flagged as duplicate, **two were**. The rest are deliberate
architecture: shared data layers with channel-specific presentation, or one
component behind two entry points.

The lesson is the same one this matrix has now hit three times: **shape is not
intent.** Identical names, similar sizes and missing designs each looked like a
defect and each turned out, on reading the code, to be considered work.

**Group C — routes with no design.** Originally recorded here as "no evident
requirement, probably dead". **That was wrong, and the correction matters.**

Investigated 5 August. Every one has inbound links — none is orphaned — and
they fall into four kinds, only one of which needs anything doing:

*Legacy redirects, deliberate. Keep.*
`/enforcement` is named `LegacyEnforcementRoute` in its own source and forwards
to `/enforcement-library`, preserving the violation parameter. Removing it
breaks old links and bookmarks.

*Technical bridges, necessary. Keep.*
`/reviews/[id]/started` is a documented navigation bridge for Next 15, with a
comment explaining that a server action must leave the current path before
returning to the server-rendered workspace. Not redundancy — a framework
requirement.

*Feature-flagged screens that ARE requirement-traced.*
`/cases` cites MVP2-REQ-0114 to 0119. `/committee` cites MVP2-REQ-0128 to 0136.
Both are switched off by a feature flag and render an honest "not available
yet" state naming the prerequisite — for the committee screen, PKI and EBDA
verification being on hold.

**These trace to a requirement set — MVP2-REQ — that was not consulted when this
matrix was first drafted.** The claim of "no requirement" was a gap in the
measurement, not in the product. Any future coverage figure must include that
set.

*Real screens genuinely needing design.*
`/operations/live` (406 lines), `/profile`, `/ai/suggestions`, `/evidence-ocr`,
`/incident-reports`, `/operations/exceptions`, `/tasks`. These are substantial
and in use.

`/reference/web-admin/f0` and the `/page.tsx` entry are enumeration artefacts.

### A defect found while investigating Group C

The "not available yet" screens disclose their technical seam to the user —
`FEATURE_CASE_SPINE=off`, `FEATURE_DECISION_DOSSIER=off + PKI/EBDA held`. An
environment variable name is engineering vocabulary.

Graded P2, not P0, deliberately: the detail sits behind a "Why / prerequisites"
disclosure rather than on the face of the screen, so someone already thought
about this. The pattern is honest and worth keeping. Only the wording needs
replacing with something a business reader recognises.

## What this changes

Three quarters of the outstanding design work is not design work.

- **Group A** genuinely needs design — but it is 22 screens, not 51.
- **Group B** needs consolidation. Building designs for duplicate routes would
  entrench a fault.
- **Group C** needs a requirement check first. Some of these are probably dead.

## Method, and its limits

* Platform routes: every `page.tsx` under `apps/web/src/app`, across all route
  groups. First count was 115 and wrong — it missed a route group, which showed
  up as `/login` appearing "designed but not built" when it plainly exists.
  Corrected to 126.
* Design routes: route paths parsed from frame names across every section of
  the screens page in the design file. A frame whose name omits its route will
  be under-counted; the figure is a floor, not a ceiling.
* Requirements coverage: not yet calculable. Recorded as unknown rather than
  estimated.

## Next

1. Complete the BRD index so link 1 becomes measurable.
2. Rule on the 13 designed-but-unbuilt: required, or speculative.
3. Consolidate Group B rather than designing it.
4. Ask the requirement question of Group C before any work is done on it.
5. Design Group A, where the need is real and the screens are in use.

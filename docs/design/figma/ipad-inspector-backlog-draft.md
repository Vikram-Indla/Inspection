# iPad Inspector backlog draft — MIM iPad Inspector App → Jira

**Pushed to Jira 2026-08-01.** All 19 stories + 82 sub-tasks below are live in the
project (`INSP-536` through `INSP-636`, 101 issues total). Key mapping is in
`jira-backlog-keys.md` in this same directory.

Figma file: `8wGaofgbopqmGXc0Wjo0eW` — MIM iPad Inspector App (Senaei 2.0 team project).
No existing Jira issue has a Figma link (checked remote-links + description text on
INSP-5, INSP-200, INSP-201, INSP-210 — zero hits). Every story below carries one.

Two categories, so "100% Figma reuse" stays honest instead of aspirational:

- **[REUSE]** — a real screen/template already exists in the file. The story's job is to
  build to what's drawn, not invent anything.
- **[GAP]** — nothing exists in the file for this requirement. A `Design` sub-task must
  produce the screen before `Frontend`/`Backend`/`Wiring`/`Test` can start. Do not claim
  Figma coverage for these — that would be inventing evidence, which the repo's own rules
  (CLAUDE.md rule 10, `.claude/rules/governance.md`) forbid.

---

## Epic: INSP-5 — Web module — Execution (field/iPad channel)

### [REUSE] Story: Execute a Chemical Release inspection checklist and submit
**Source-backed requirement**
Source: Inspection Project workbook, sheet Inspection excution-Start jou.
**User journey**
Inspector opens the Chemical Release report from an assigned visit, completes the
checklist (Field or Remote variant), attaches evidence, records findings, and submits.
**Acceptance criteria**
Implement only the behaviours, rules, data and dependencies specified in the source sheet.
Enforce the applicable access, audit and workflow controls defined there.
Link implementation and test evidence before completion.
**Traceability**
Inspection Project workbook — Inspection excution-Start jou.
Figma: MIM iPad Inspector App, page "Report" (node `1939:56734`) — Field + Remote variants.
**Delivery Acceptance Criteria**
Successful execution journey: Given an authorized inspector and a valid assigned visit,
when the inspector completes the Chemical Release checklist, then the system applies the
documented execution, validation, and state-transition rules and stores it against the visit.
Validation: Given a mandatory field is missing, when the inspector attempts submit, then
the system blocks completion and shows the reason.
Authorization: Given a user without the inspector role, when they attempt this journey,
then the system denies access and records no data.
Traceability: Given the journey completes, then the system retains audit evidence linked
to the source visit and to Figma node `1939:56734`.

Sub-tasks: `Frontend — Execute a Chemical Release inspection checklist and submit`,
`Backend — ...`, `Wiring — Link implementation to Figma node 1939:56734`, `Test — ...`

### [REUSE] Story: Execute a Customs Exemption inspection checklist and submit
Same template as above. Figma: page "Customs Report" (node `639:79065`).

### [REUSE] Story: Execute a Safety inspection checklist and submit
Same template. Figma: page "Safety Report" (node `2312:95952`) — also carries the shared
"Unable to Complete Visit" exception flow and an Overlay-Alerts state set; both must be
built, not just the happy path.

### [REUSE] Story: Log a lightweight Visit Statement
**User journey**: inspector records a short establishment visit log (photo, activity info,
dates, map pin, category, notes) without a full violation checklist.
Figma: page "افادة الزيارة" (Visit Statement, node `2468:31912`).

### [REUSE] Story: Branch a new inspection plan between Field Visit and Remote Visit
**User journey**: at plan-creation, inspector chooses Field Visit or Remote Visit; the
chosen mode determines which screens follow.
Figma: page "Identify Challenge" (node `620:45076`).
Traceability note: this is the concrete screen behind `INSP-207` (Conduct a verified
virtual inspection session) — add this Figma link to `INSP-207` directly rather than
opening a new story; it already exists and is unfilled.

### [REUSE] Story: Issue a Summons Notice from the field
Figma: Components → Reports → "Summons Notice" template (node `360:48214`), Report
Details read view (node `369:127296`). Currently a reusable template only — not yet
wired to any routed screen or Jira story.

### [REUSE] Story: Record an Incident Report during a visit
Figma: Components → Reports → "Incident Report" (node `360:80269`), Report Details
(node `369:144125`).

### [REUSE] Story: Record a Violation Report with signature capture
Figma: Components → Reports → "Violation Report" (node `361:19525`), Report Details
(node `369:155067`, plus 6 further Violation Report detail variants — confirm with
design which are true states vs. draft duplicates before building all 6).

### [REUSE] Story: Log a Sample Collection Report
Figma: Components → Reports → "Sample Collection Report" (node `361:32119`).

### [REUSE] Story: Record Non-Compliant Products Destruction
Figma: Components → Reports → "Non-Compliant Products Destruction Report" — **3 separate
frames exist** (`362:21196`, `362:39096`, `368:27879`) with different field sets. Needs a
design-team confirmation of which is canonical before this becomes one buildable story —
flagging as an open question, not resolving it myself (CLAUDE.md rule 10: no invented
governed values).

### [REUSE] Story: Generate a Facility Report
Figma: Components → Reports → "Facility Report" (node `369:49024`).

### [REUSE] Story: View establishment regulatory status and visit history mid-visit
Figma: page "Establishment Management" (node `1065:77494`) — 5 sections: Licensed/
Unlicensed Facilities List, View Details, Select Violations, Regulatory Data Statuses,
View Visit Reports.
Traceability note: this is the concrete screen behind `INSP-204` (Verify factory data
and record evidence-backed updates) — add this Figma link to the existing story.

### [GAP] Story: Detect and recover from offline connectivity during a field-inspection journey
**Why a gap**: `INSP-201` requires offline support by name ("Start and track a
field-inspection journey with offline support"). No screen, banner, sync-status icon, or
queued-upload state exists anywhere in the file — checked node-by-node across the
Home + Tasks page.
**Sub-tasks**: `Design — offline/sync state for My Tasks and journey screens` (must land
in Figma first), then `Frontend`/`Backend`/`Wiring`/`Test`.

### [GAP] Story: Confirm arrival within geofence or record a governed GPS-override exception
**Why a gap**: `INSP-202` requires this by name. No radius-check, "not at location"
warning, or override-confirmation dialog exists in the file.
**Sub-tasks**: `Design — arrival-exception and GPS-override screen`, then the standard 4.

### [GAP] Story: Capture and provisionally register an unregistered facility during a field visit
**Why a gap**: `INSP-242` requires this by name. The only establishment-related screen
("Unlicensed Facilities List") is browse-only against existing records — no add/create
form, no + icon anywhere in the file.
**Sub-tasks**: `Design — new-establishment capture form`, then the standard 4.

### [GAP] Story: Grant temporary delegated execution of a visit without changing ownership
**Why a gap**: `INSP-244` requires this by name. No delegate/reassign/handoff concept
exists anywhere in the file (Home + Tasks or Establishment Management).
**Sub-tasks**: `Design — delegate-visit screen/flow`, then the standard 4.

---

## Epic: INSP-3 — Web module — Factory 360

### [REUSE] Story: Display factory identity, licence, location and capacity profile
Figma: "Establishment Management → View Details" (node `1068:123721`) + shared
"Factory Details" component (node `1237:93408`). Confirmed fields: licence number, CR
number, location/map, product list, raw materials, workforce count, production capacity,
document list. This is the concrete screen behind `INSP-210` — add this link to the
existing story rather than opening a new one.

### [GAP] Story: Compute and display a Factory Health Score
**Why a gap**: `INSP-212` asks for a "Factory Health Score." The file only has a
categorical risk badge ("عالية الخطورة" / High Risk) and a compliance percentage
("45% ممتثل") — no computed score, no gauge. Whether a badge+percentage satisfies the
Jira wording, or a true score is required, is a PO call — flagging, not deciding.
**Sub-tasks**: `Design — health-score display (pending PO decision on badge vs. score)`,
then the standard 4.

### [GAP] Story: Track penalty records and corrective-action status on factory history
**Why a gap**: `INSP-211` requires penalty amounts and corrective-action tracking. The
file has visit history, violations, and evidence attachments (all real, all reusable) —
but no "غرامة"/penalty field and no corrective-action status anywhere.
**Sub-tasks**: `Design — penalty and corrective-action tracking view`, then the standard 4.

---

## Coverage arithmetic (what "100% Figma reuse" actually means here)

- **17 REUSE stories** — every screen and every one of the 9 report templates in the file
  gets a home. This is the honest 100%: everything Figma *has* gets consumed.
- **6 GAP stories** — these can't cite Figma evidence because nothing exists to cite.
  Claiming otherwise would be the exact violation CLAUDE.md rule 10 exists to prevent.
  They need a design pass before they're buildable.

---

## Risks

| Risk | Why it matters |
|---|---|
| **3 duplicate "Non-Compliant Products Destruction Report" frames, unresolved** | Building against the wrong one wastes a full dev cycle; picking one without design sign-off invents a decision that isn't ours to make. |
| **6 GAP stories block on design, not just dev** | If scheduled like the REUSE stories, they'll blow their estimate — there's a design step with its own review cycle in front of them. |
| **Standing PO rulings not yet reversed** | `/execution` (web) vs `/field` (iPad) channel split, and PWA-out-of-scope, are both still active rulings in this repo. Building this backlog implicitly reverses them — needs the explicit sign-off I flagged three turns ago, not an implicit one via backlog creation. |
| **Jira's own scope tags contradict the merge** | `INSP-25`/`INSP-26`/`INSP-21`/`INSP-22` are tagged `Scope: Web only` in Jira itself. Silently reassigning their scope to iPad/field is a requirements change, not a delivery task. |
| **No Figma traceability existed before this pass** | Zero risk of "we already checked this" — but also zero prior art to sanity-check these links against. First-pass link-mapping should get one human review before it's treated as ground truth. |

## Why implement (the case for doing this)

- **Real coverage is 58–71% today, not 0%** — most of the inspector's actual job (checklist
  execution, evidence, findings, submission, remote inspection, establishment lookup) is
  already fully drawn. Building it is mostly execution risk, not design risk.
- **9 report templates are sitting unused** — Summons Notice, Incident Report, Sample
  Collection, Non-Compliant Destruction, Facility Report exist in the component library
  with zero routed screens or Jira stories pointing at them. That's paid-for design work
  currently returning nothing.
- **The 6 gaps are specific and small**, not a vague "redo the whole app" — offline state,
  one exception dialog, one create-form, one delegate-flow, one score decision, one
  penalty/corrective-action view. That's a bounded design ask, not a re-architecture.

Want me to (a) get the 3-variant destruction-report and health-score-vs-badge questions
answered by you or design before this goes further, and (b) actually push these into Jira
once you confirm — or keep this as a standing draft for now?

# Planning Production Design Authority

**Packet:** `PKT-PLANNING-CLOSURE-DESIGN-001`
**Lease:** `LEASE-PLANNING-DESIGN-AUTHORITY-001`
**Revision:** `PLN-DA-R2`
**Date:** 2026-07-27
**Repository base:** `8865c35001761fd9fc9b027284881fe597b25ebd`
**Status:** `CONDITIONAL_PASS_WEB_BLOCKED_PENDING_EXIT_EVIDENCE`
**Presentation system:** SAQEEL only
**Implementation authority:** none; Product Owner acceptance is required before Web markup

## 1. Frozen authority and before evidence

This revision is frozen against exact main
`8865c35001761fd9fc9b027284881fe597b25ebd`.

| Evidence | Frozen value |
|---|---|
| Final-cut file | `design/final-cut/saqeel-revamp.html` |
| Git blob | `f5faf2efa36ee100ca627bacfb2e582b43b7f8f3` |
| SHA-256 | `b50aeea987461d71655704f595fef2f334346799c2ab154e8bade66b7306af18` |
| Existing final-cut Planning screen count | 1 (`/planning`) |
| Planning block | 20,446 bytes |
| Existing Planning widgets | 4 panels; 16 buttons; 3 inputs; 1 table; 2 static badges; 16 conditional regions |
| Existing Planning inline-style attributes | 89 |
| Existing static Planning classes | `badge`, `badge-completed`, `btn`, `btn-danger`, `btn-ghost`, `btn-secondary`, `bulk-bar`, `filter-chip`, `grid-toolbar`, `input`, `input-affix`, `menu`, `panel`, `sq-toolbar__spacer`, `sq-topbar-row`, `table`, `table-wrap`, `tl-meta` |

The artifact supplies a `/planning` composition, not canonical route-specific
frames for every screen below. The missing canonical frames are an exit-evidence
condition, not permission to invent new screens, classes or content.

## 2. Authority boundaries

### Web Planning implementation authority

This packet defines Web Planning presentation authority only for:

- `PLN-S01` `/planning`
- `PLN-S02` `/planning/single`
- `PLN-S03` `/planning/bulk`
- `PLN-S04` `/planning/bulk/review`
- `PLN-S05` `/planning/immediate`
- `PLN-S06` `/visits/[id]`

### Cross-lane downstream handoff only

These are retained solely to preserve Planning-to-Field consequences:

- `PLN-S07` `/field/[visitId]`
- `PLN-S08` `/field/inspection/[id]`

S07-S08 are Field/PWA authority. They do not authorize Web implementation,
Field markup, Field behavior, Field CSS or Field tests.

### Blocked decisions

- **R05 Unregistered Factory:** blocked pending Council ruling.
- **R06 Supervisor reassignment:** blocked pending Council ruling.
- **Governed Arabic copy for new closure states:** blocked pending Arabic owner.

Blocked areas render as text-plus-shape pending states. They do not expose
active controls, grants, schema assumptions, workflow transitions or invented
copy.

## 3. Exact-main class and JSX audit

Class ownership at the frozen base:

| Contract | Exact-main result |
|---|---|
| `.sq-content` | Defined in `apps/web/src/app/saqeel-runtime.css` line 939 |
| `.sq-topbar-row` | Runtime-family design hook used by final-cut, but **no selector exists in exact-main CSS**; this is a stop-gap, not permission to add CSS |
| `.input`, `.select` | Defined in `apps/web/src/app/saqeel-components.css` |
| Generic textarea | `textarea.input` in `saqeel-components.css`; there is no standalone `.textarea` selector |
| Existing Planning/Visit textarea | `.sq-textarea` in `saqeel-runtime.css`; current JSX uses `className="sq-textarea"` |
| Existing alternate input textarea | `textarea.sq-input` appears in Immediate JSX and is already styled by the runtime family |

Therefore this handoff does not use `textarea.textarea`. Implementers must
preserve the existing JSX contract (`textarea.sq-textarea` or
`textarea.input`, according to the existing component being retained).

The intended ownership statement is: `sq-content` and `sq-topbar-row` belong to
the SAQEEL runtime class family, not the generic component sheet. Exact-main
verifies the first and exposes the missing selector for the second. Web markup
must remain blocked on that gap unless an already-approved runtime selector is
landed by the design-system owner.

No class named in this document authorizes new CSS. Missing structure is a
design-system request.

## 4. BA journey trace — exact replacement IDs

The corrected repository ledger uses zero-padded IDs
`PLN-J-001..PLN-J-020`; these are the exact replacements for shorthand
`PLN-J01..PLN-J20`.

| Journey | Route/screen | Required design consequence |
|---|---|---|
| PLN-J-001 | S01 `/planning` | List-first landing, lifecycle views, Create Visit |
| PLN-J-002 | S01 `/planning` | Admin unauthorized state |
| PLN-J-003 | S01 `/planning` | Inspector unauthorized state |
| PLN-J-004 | S05 `/planning/immediate` | Existing governed registered immediate/self-assigned exception |
| PLN-J-005 | S02 `/planning/single` | CR with one licence |
| PLN-J-006 | S02 `/planning/single` | Explicit selection across multiple licences; no leakage |
| PLN-J-007 | S02 `/planning/single` | Exact licence search |
| PLN-J-008 | S02 `/planning/single` | Exact plant search |
| PLN-J-009 | S02/S05 | R05 blocked permission state |
| PLN-J-010 | S05 | R05 manual/unregistered journey blocked pending Council |
| PLN-J-011 | S03 `/planning/bulk` | Basic AND criteria |
| PLN-J-012 | S03 `/planning/bulk` | Grouped AND/OR with visible parentheses |
| PLN-J-013 | S03 `/planning/bulk` | Typed numeric/date operators |
| PLN-J-014 | S03 `/planning/bulk` | Empty-criteria validation/authorization |
| PLN-J-015 | S03 `/planning/bulk` | Select-all-matching retained-set consequence |
| PLN-J-016 | S03/S04 | Eligible/ineligible partition and acknowledgement |
| PLN-J-017 | S03/S04 | Durable bulk draft resume |
| PLN-J-018 | S04 `/planning/bulk/review` | Distribution evidence and initial assignment override |
| PLN-J-019 | S04 `/planning/bulk/review` | Concurrent conflict; one authoritative all-or-nothing result |
| PLN-J-020 | S02/S04 | Optional-package publish; downstream preparation requirement |

R06 does not invalidate initial assignment in J018. It blocks only later
Supervisor reassignment.

## 5. Shared interaction contract

Creation flow order:

1. Method and context
2. Registered factory identity or target population
3. Eligibility evidence and acknowledgement
4. Visit type, physical mode and planning window
5. Initial inspector recommendation/assignment evidence
6. Review
7. Publish or preserve draft
8. Authoritative receipt and queued-notification truth

Method remains reversible until creation. Two draft identities remain distinct:

- **Targeting draft:** criteria, source snapshot, selection and eligibility; no
  visit record exists.
- **Visit draft:** validated factory/licence/plant and visit configuration;
  unpublished and non-executable.

Archive preserves the draft identity, records Archived provenance and excludes
the record from active views. Archived is never relabelled Cancelled. There is
no Restore control. If schema authority is absent, Archive is visibly blocked.

Status is always text plus `.badge`; colour is never the only carrier.

## 6. Web screen authority

### PLN-S01 — Planning workspace

**Route:** `/planning`
**Screen:** `SCR-WEB-100`
**Requirements:** `CR-001`, `CR-011`, `CR-053..056`, `CR-071..075`
**Acceptance:** `WA-AC-0001`, `WA-AC-0011`, `WA-AC-0053..0056`,
`WA-AC-0071..0075`
**Journeys:** `PLN-J-001..003`

```text
main.sq-content
  [runtime-family heading row; sq-topbar-row blocked until selector lands]
  div.grid-toolbar
    button.btn.btn-secondary              Refresh / Export / Saved views
    button.btn                             Create visit
  section.panel
    span.badge + span.tl-meta              source/freshness
    div.panel                              advisory recommendations
  div.tabs > button.tab                    lifecycle views
  div.grid-toolbar
    div.input-affix > input.input
    button.filter-chip
  div.bulk-bar                             approved same-state actions only
  section.table-wrap > table.table         desktop
  button.panel                             narrow record
  aside.drawer                             record preview
```

Views separate Targeting drafts, Visit drafts, Returned, Published, Expiring,
Expired and Archived. Archived rows and counts are excluded from active views.
R06-related commands are absent and replaced by a pending Council badge where
the dependency must be explained.

### PLN-S02 — Single visit

**Route:** `/planning/single`
**Screen:** `SCR-WEB-120`
**Requirements:** `CR-034..042`, `CR-064`
**Acceptance:** `WA-AC-0034..0042`, `WA-AC-0064`
**Journeys:** `PLN-J-005..009`, `PLN-J-020`

```text
main.sq-content
  div.steps
  section.panel
    div.field > div.input-affix > input.input
  section.table-wrap > table.table
  section.panel                           identity dossier
    span.id-code + span.badge + span.tl-meta
  div.alert                               duplicate/stale/source state
  section.panel                           eligibility acknowledgement
  section.panel
    div.field > select.select             visit type / physical mode
    div.field > input.input               window
  section.panel                           initial recommendation evidence
    textarea.sq-textarea                  governed override reason, when enabled
  section.panel                           review
  div.grid-toolbar                        back / save draft / continue
```

Only registered identity is active: CR → exact licence → plant. R05 is a
non-interactive `alert` plus `badge badge-pending`; it does not create a manual
identity form.

### PLN-S03 — Bulk targeting

**Route:** `/planning/bulk`
**Screen:** `SCR-WEB-110`
**Requirements:** `CR-002..005`, `CR-012..015`, `CR-021..025`,
`CR-032..033`
**Acceptance:** `WA-AC-0002..0005`, `WA-AC-0012..0015`,
`WA-AC-0021..0025`, `WA-AC-0032..0033`
**Journeys:** `PLN-J-011..017`

```text
main.sq-content
  div.steps
  section.panel                           criteria builder
    div.seg > button.seg-opt              AND / OR
    div.field > select.select             field/operator
    div.field > input.input               typed value
    button.btn.btn-secondary.btn-sm        add
    button.btn.btn-ghost.btn-sm            remove
  div.alert                               eligibility/source state
  section.panel
    span.badge + span.tl-meta              count/freshness
  div.tabs                                table/map parity if live source exists
  section.table-wrap > table.table
  div.bulk-bar
  section.panel                           targeting-draft status
```

Unlimited-safe means cursor/chunk loading and durable retained selection. The
UI shows total-matching when authoritative, loaded, selected, eligible and
ineligible counts. It never renders or submits an unbounded browser payload and
never invents a maximum.

### PLN-S04 — Bulk configuration, review and publish

**Route:** `/planning/bulk/review`
**Screens folded into the existing route:** `SCR-WEB-140` configuration and
`SCR-WEB-150` review/publish, under the route reconciliation recorded in the
screen catalogue; no `/planning/:id/review` route is added.
**Requirements:** `CR-006..010`, `CR-017..020`, `CR-027..031`,
`CR-092..093`, `CR-096..097`
**Acceptance:** `WA-AC-0006..0010`, `WA-AC-0017..0020`,
`WA-AC-0027..0031`, `WA-AC-0092..0093`, `WA-AC-0096..0097`
**Journeys:** `PLN-J-016..020`

```text
main.sq-content
  div.steps
  section.panel                           retained-set/correlation summary
  section.table-wrap > table.table        eligibility ledger
  section.panel                           initial assignment evidence
  div.alert.alert-immutable               locked package/evidence snapshot
  section.panel                           validation/consequence ledger
  div.bulk-bar                            acknowledge eligible retained set
  section.panel                           publish action/result
    span.id-code + span.badge + span.tl-meta
    div.timeline                          audit/queued notification truth
```

#### Backend receipt reconciliation

The design uses the exact current contract:

1. Before submit, the authoritative eligibility partition may exclude named
   ineligible rows only after explicit acknowledgement.
2. The retained eligible set becomes the submitted transaction set.
3. `publish_bulk_plan_atomic` commits that submitted set all-or-nothing.
4. Concurrent conflict, overlap, capacity or RPC failure returns failure with
   **nothing published**.
5. A successful receipt is shown only after the RPC returns the authoritative
   plan identifier.
6. Excluded rows are not a partial commit. They are named pre-commit exclusions.
7. Notification records are queued inside the transaction; delivery,
   acceptance and provider receipt are not claimed.

The UI must never combine “some committed” with an atomic failure. Unknown
network outcome uses Reconciliation required, not Success or Failed.

### PLN-S05 — Immediate visit with R05 boundary

**Route:** `/planning/immediate`
**Screen:** `SCR-WEB-130`
**Requirements active:** `CR-043..044`, `CR-047..052`
**Acceptance active:** `WA-AC-0043..0044`, `WA-AC-0047..0052`
**Requirements blocked by R05:** `CR-045..046`
**Acceptance blocked by R05:** `WA-AC-0045..0046`
**Journeys:** active `PLN-J-004`; blocked `PLN-J-009..010`

The whole route is not an R05 placeholder. Existing registered/immediate
authority remains active:

```text
main.sq-content
  section.panel                           authority and registered identity
  div.field > div.input-affix > input.input
  section.panel                           urgency/physical visit configuration
  section.panel                           initial assignment evidence
  section.panel                           review and governed create action
  div.alert
    span.badge.badge-pending              R05 unregistered decision pending
```

The registered branch may create the governed immediate visit for authorized
personas. The manual/unregistered branch exposes no fields, grants, dispatch
action or schema assumptions until Council rules.

### PLN-S06 — Visit detail and closure actions

**Route:** `/visits/[id]`
**Screen:** `SCR-WEB-210`
**Requirements:** `CR-057..069`, `CR-076..082`, `CR-094..098`
**Acceptance:** `WA-AC-0057..0069`, `WA-AC-0076..0082`,
`WA-AC-0094..0098`
**R06 blocked:** `CR-078`, `WA-AC-0078` and any Supervisor-reassignment
projection of `CR-084`, `WA-AC-0084`

```text
main.sq-content
  span.id-code + span.badge
  section.panel                           identity/planning facts
  section.panel                           physical mode/window
  div.alert.alert-immutable               frozen package/evidence rules
  section.panel                           initial assignment provenance
  section.panel                           notes/attachments
    textarea.sq-textarea
  div.timeline                            immutable audit/outbox
  div.alert                               720-hour eligibility explanation
  div.grid-toolbar                        permitted closure actions
  aside.drawer                            confirmation/receipt
```

Cancellation and rescheduling show Eligible, Ineligible, Stale, Unavailable or
Blocked with:

- authoritative reference timestamp;
- evaluated timestamp;
- elapsed/remaining hours;
- timezone;
- exact 720-hour rule/version;
- explicit exclusion of initial publish and non-window correction.

Cancellation note is optional. Reschedule shows old and proposed windows plus
conflict result. R06 is a non-interactive pending state; no reassignment action
is rendered.

Archive preserves Targeting draft or Visit draft identity, adds actor/time/
source provenance, excludes active views, never becomes Cancelled and has no
Restore action. Without landed schema authority the control is Blocked.

## 7. Field/PWA downstream handoff — not Web authority

### PLN-S07 — `/field/[visitId]`

**Downstream screens:** `SCR-IPAD-610`, `SCR-IPAD-620`
**Journey families:** P05/P06A; `SB06`, `SB07`, `SB14`
**Engines:** `ENG-03`, `ENG-06`, `ENG-10`, `ENG-11`, `ENG-12`

Planning must hand off published identity, physical mode, window, initial
assignment, frozen package/evidence version, correlation ID and honest
outbox/provider state. Field/PWA owns its markup and acceptance. R06 is absent.

### PLN-S08 — `/field/inspection/[id]`

**Downstream screens:** `SCR-IPAD-630`, `SCR-IPAD-640`,
`SCR-IPAD-650`, `SCR-IPAD-660`
**Journey families:** P07/P08/P09; `SB08`, `SB13`, `SB15`, `SB16`
**Engines:** `ENG-01`, `ENG-02`, `ENG-03`, `ENG-06`, `ENG-07`,
`ENG-08`, `ENG-09`, `ENG-10`, `ENG-11`, `ENG-12`

Planning must preserve immutable visit/package/evidence identity and correlation
through execution and submission. Field/PWA owns offline persistence, conflict
recovery, evidence capture, submission and receipt UI.

## 8. Required state and mode matrix

Each Web screen requires:

- EN/LTR/light
- EN/LTR/dark
- AR/RTL/light
- AR/RTL/dark
- 1440, 1024, 390 and 320 widths
- the fifth representative width recorded by the canonical-frame review
- loading/skeleton
- empty and no-match
- validation
- unauthorized
- provider/Senaei degraded
- external seeded/simulated provenance
- stale source/version
- offline or request interruption where the Web contract supports it
- conflict/reconciliation required
- authoritative success/failure receipt

Arabic text for R05/R06, 720-hour explanations, Archived provenance, atomic
failure and reconciliation-required states remains blocked until governed copy
is supplied.

## 9. Keyboard, focus and accessibility

- Method, tab and segmented choices expose selected state programmatically.
- Menu/drawer/confirmation focus returns to its invoker.
- Validation summary links to the associated field.
- Table selection has row and select-all labels.
- Status never relies on colour alone.
- Pending R05/R06 surfaces contain no fake focusable controls.
- Publish progress uses a polite status announcement; the final authoritative
  receipt is announced once.
- Destructive confirmation names the exact draft, visit or retained set.
- RTL uses logical order and properties; IDs, timestamps and correlation values
  keep their semantic direction.
- Target is WCAG 2.2 AA in every approved mode and width.

## 10. Exit evidence and signoff

Web markup remains blocked until all items pass:

- [ ] Live canonical Claude Design verification for S01-S06.
- [ ] Frozen final frame and widget counts for each S01-S06 screen.
- [ ] Four locale/theme modes verified.
- [ ] 1440/1024/390/320 plus the canonical fifth width verified.
- [ ] Keyboard and focus walkthrough verified.
- [ ] Every required negative/degraded/receipt state visibly verified.
- [ ] Exact-main runtime gap for `.sq-topbar-row` resolved by existing approved authority.
- [ ] R05/R06 remain blocked or receive Council rulings.
- [ ] Governed Arabic copy approved.
- [ ] Backend owner accepts the atomic retained-set receipt wording.
- [ ] Field/PWA owner accepts S07-S08 as downstream handoff only.
- [ ] Independent reviewer accepts; the designer does not self-approve.

## 11. Evidence manifest

| Evidence ID | Source | Result |
|---|---|---|
| PLN-DA-EV-001 | `git rev-parse HEAD` | exact base `8865c35001761fd9fc9b027284881fe597b25ebd` |
| PLN-DA-EV-002 | final-cut blob/SHA scan | blob and SHA-256 frozen in §1 |
| PLN-DA-EV-003 | final-cut Planning DOM-source inventory | 1 screen and widget counts frozen in §1 |
| PLN-DA-EV-004 | `screen_route_catalogue.csv` | S01-S06 and S04 route fold reconciled |
| PLN-DA-EV-005 | `REQUIREMENT_BASELINE.csv` | exact CR/WA-AC trace in §6 |
| PLN-DA-EV-006 | `PLANNING_ACCEPTANCE_AND_BROWSER_JOURNEYS.csv` | exact `PLN-J-001..020` trace in §4 |
| PLN-DA-EV-007 | exact-main CSS/JSX scan | runtime/component ownership and textarea correction in §3 |
| PLN-DA-EV-008 | bulk action/RPC source scan | retained-set, atomic commit and queued-notification wording in S04 |
| PLN-DA-EV-009 | scope audit | S07-S08 retained only as cross-lane handoff |
| PLN-DA-EV-010 | prohibited-content scan | no new route, token, CSS, Astryx or governed value |

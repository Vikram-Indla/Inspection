# Orchestrator handover — 5 August 2026

Read this first in a new session. It is the state of the programme, what is
running, what is decided, and what is still open.

`origin/main` is at **`7620b605`**. Everything described below is pushed.

## The goal

An enterprise-grade platform adhering to the BRD and Jira requirements. Measured
by four things: nothing clipped or truncated; no prose standing in for function;
one way to express each component; the same idea behaves the same everywhere.

Full statement in `PROGRAMME-BASELINE-20260805.yaml`.

## The three lanes

Cut from six to three on the Product Owner's instruction. Six was too many —
four lanes went silent for over four hours and the orchestrator missed it.

| Lane | Session | Doing |
|---|---|---|
| **Integration** | `local_f79bc3d8-08df-455c-8d3d-d33deda19d46` | Walking golden-path steps 04–12 on its own chain |
| **Front End** | `local_f4783a3a-6726-49c5-9307-d511d99a7bb6` | The Jira baseline — nine BRDs into readable stories |
| **Backend** | `local_1d7cbc5a-62f4-4881-8a5e-8e6b4e941673` | Database and permissions. Idle |

These three are **canonical** — they stay pinned whether or not they hold work.
Retired: two design-critique lanes, a requirements lane, a Figma audit lane.

The orchestrator holds the Figma correction itself.

## The four questions the Product Owner asked, answered honestly

**1. Can he work from Jira alone, without the BRDs? No.**
Three of nine documents indexed before that lane stalled. No story rewritten.
Front End has just taken this over; it is the top priority.

**2. Is Figma corrected? About a quarter.**
25 text corrections, canonical English set only. Untouched: the dark, Arabic and
Arabic-dark duplicates of all 29 routes, 73 state frames, overlays, the 1024
set, the external set, the inspector sections, fourteen build sections. Nothing
has flowed back to the platform.

**3. Golden path? Both blockers cleared, walk running.**
Steps 00–05 pass. 06, 07 and 12 were blocked and are now unblocked. Integration
is re-walking to produce its own chain rather than verifying on existing records.

**4. Everything pushed? Yes.** Seventeen commits.

## What was fixed tonight

- **Two application shells merged into one.** Administration used a completely
  separate shell. 564 lines deleted. INSP-752.
- **Every administration screen reachable.** 22 in navigation, 9 tab-reached, 1
  deliberately elsewhere. INSP-753.
- **Compliance authoring and approval repaired.** Both were closed to every user.
- **Enforcement decisions enabled** — supervisors decide, administrators excluded.
- **Arrival radius supplied** — 100 metres, global. No inspection could be
  carried out without it.
- **Inspector screens standardised** to 1200px from seven different values.
- **Two table treatments unified.** 94 usages of one, 74 of another, visibly
  different.
- **Factory 360 duplicate routes removed**, and a misconfigured route boundary
  fixed alongside.
- **Confirm-ready no longer refuses on a condition already satisfied.**

## The pattern behind most of it

**Three invented role pairs**, each of which silently locked out the whole
organisation:

| Function | Roles named | Exist? |
|---|---|---|
| `ccr_is_writer` | compliance_admin, form_admin | No |
| `ccr_is_reviewer` | compliance_admin, reviewer | No |
| `decide_enforcement_recommendation` | ops, compliance_admin | No |

All three now fixed. **A fourth is likely.** The highest-value outstanding
analysis is the list of every role name referenced in the product that does not
exist in `public.roles`. Front End owns it.

The BRDs name Branch Manager, System Administrator (Technical), System
Administrator (Business), Data Entry User, Approver. The database has admin,
inspector, planner, supervisor. Three vocabularies, none matching.

## Standing rules

- **Never invent a governed value.** Absent data renders as Not configured,
  Unavailable, or Insufficient evidence.
- **Business language always** — to the Product Owner and to the team. No
  identifiers, no commit hashes, no function names.
- **Reproduce before reporting.** Several reports this round were false.
- **Presentation or behaviour** — mark every change. Behaviour changes are
  raised separately, never bundled into a cosmetic sweep.
- **No new CSS, no new tokens.** Existing classes only.
- Lanes report before going idle. The orchestrator owns all outbound
  communication to Jira and Slack.
- Verify a migration by the objects it alters, never by its filename.
- Never run a second dev server against a working directory already serving one,
  and never build into one. Both corrupt the build and produce false defects.

## Authority

The orchestrator decides sequencing, priority, lane assignment, interface and
component decisions, whether a finding is real, and whether work lands. It may
push to main unprompted and apply BRD-aligned migrations to staging.

It escalates only: invented governed values, unsettled separation-of-duties
questions, contradictions with requirements, and deployment.

Staging deployment belongs to the Product Owner.

## Open, needing the Product Owner

- **Is the Templates step mandatory?** Silent in three BRDs checked.
- **Twelve Arabic navigation labels** pending native review. One specifically:
  `استوديو الخرائط الجغرافية` for GIS Studio uses a transliteration.
- **Dark values for the role colour tokens** — the journey diagram is light-only,
  so these must be derived and remain a proposal.

## Open, being worked

- The golden path walk, steps 04–12.
- The Jira baseline, all nine BRDs.
- The Figma correction, roughly three quarters remaining.
- **Planning may offer a visit mode the platform cannot execute** — a virtual
  visit was planned where virtual is not operable. Under investigation.

## The lesson worth carrying forward

Three times the orchestrator called a defect from shape — identical frame
heights, missing designs, duplicate-looking routes — and was wrong each time on
reading the code. The platform is in better structural condition than its
metrics suggest.

The genuine faults were found by reading and by walking, not by counting. The
end-to-end walk found the one missing number that stopped every inspection in
the country, in about an hour, after a night of metrics had not.

## Records to read

- `PROGRAMME-BASELINE-20260805.yaml` — goal, phases, authority
- `TRACEABILITY-MATRIX-20260805.md` — requirements to design to platform, with
  three corrections recorded
- `DESIGN-STANDARD-20260805.yaml` — the journey diagram as visual standard
- `ORCHESTRATION-RULES-20260805.yaml` — standing rules
- `MIGRATION-RECONCILIATION-20260805.md` — every migration, source and live
- Change controls: `CC-CCR-WRITER-ADMIN`, `CC-CCR-REVIEWER-SUPERVISOR`,
  `CC-ENFORCEMENT-DECISION-ENABLE`, `CC-GIS-ARRIVAL-RADIUS`,
  `CC-ADMIN-PACKAGE-CREATION` — all dated 20260805

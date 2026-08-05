# Consolidated defect register — 5 August 2026

Every defect from every source in one place: the testers' reports, the platform
work, the design file, the requirements review, and the map investigation.

**Why this exists.** Defects were arriving from four directions faster than they
were being consolidated, and Jira cannot answer "what is open" — every issue
raised since yesterday still sits in Backlog, including the ones fixed and
deployed. This register is the answer until Jira reflects reality.

**Deploy is held** until this register and the build agree with each other.

---

## FIXED AND ON MAIN — not yet in front of a tester

Everything in baselines B1, B2, B3 and B3.1, plus what landed after.

**Nobody could work at all**
- Creating a compliance change, and approving one — both refused every user
- Recording an enforcement decision — refused everyone
- Check-in — impossible anywhere, the arrival radius had never been supplied
- Bulk violations — refused every submission
- Administration ran on a separate shell; the menu could vanish

**The inspection journey**
- Submit, return for correction, correct, resubmit, approve, close — all now work
- A submission refusal replayed silently for ever while the screen said "queued"
- The pre-submit check was stricter than the server, blocking correct work
- The offline queue paired items with the wrong key and froze the whole queue

**Reported by Sujatha**
- Regulations list is a table with status, version and an open action
- Deactivate no longer offered on a draft
- Duplicate Create Request links removed
- The access screen has one name everywhere
- Packages list collapses by default
- The items catalogue clause reference opens the source record, not the list
- Creating a package — was already present; my "missing" claim was wrong

**Reported by Sikander**
- Arabic appearing for English readers on three screens
- The sign-in screen flashing on refresh
- Factory 360 skeleton not matching its layout
- Record tabs scrolling inline with counts badged
- Dropdown double icon — already fixed before he reported it

**Language and presentation**
- "Loading RLS-scoped data" — the default on 117 screens
- Internal reference numbers beside page titles — 33 screens, plus 3 more later
- "Deterministic" — five places
- 23 further strings: specification references, table names, an internal role name
- The Planning status rules screen rewritten
- Inspector screens standardised to one width; two table styles unified
- The global link style the design carries and the app never had — the cause of
  both "the tabs look weak" reports
- The compliance explorer rebuilt to the design's structure
- The live map section had no height, so it collapsed to one pixel

---

## OPEN — DESIGN FILE (2)

| What | Who | State |
|---|---|---|
| The stepper, INSP-767 | Orchestrator | Corrected node reference received, not actioned |
| kpi-grid card shadow | Sikander | Awaiting his steer: shared style or that screen only |

**Not counted because never examined:** the dark, Arabic and Arabic-dark
duplicates of every route frame, the state frames, overlays, the 1024 set, the
external set, the inspector sections, the build sections. Unexamined, not clean.

---

## OPEN — NEEDS A RULING FROM THE PRODUCT OWNER (7)

| What | Why it needs him |
|---|---|
| 67 write permission rules refuse everybody | Each decides who may change something — separation of duties |
| Can permissions be modified at all | Arabic says yes, English says vendor-only. Decides whether the above is configuration or a release |
| Supervisors reach administration | His instruction versus a change control that put them there deliberately |
| Error codes in field messages | An inspector quoting one to support is using it |
| Should a non-compliance create a violation record | The corrective form fires correctly either way |
| Bulk violation issuance has no requirement | It is switched on and can issue real penalties |
| 13 capabilities nobody asked for | Keep or drop, each one |

---

## OPEN — BEING WORKED (1)

**INSP-773 — violations recordable against a facility not in production.** A
governed rule that exists on paper and not in the product. Backend has it.

---

## OPEN — KNOWN, NOBODY ASSIGNED (11)

1. **INSP-774** — live map blank on direct load or refresh, works when navigated to
2. `/operations` map region also collapses to a sliver — different component
3. Administration top bar overlaps the sidebar; a control clipped behind it
4. "Primary navigation" rendered as visible body copy
5. Sidebar clips long labels mid-word
6. No collapse control on the administration sidebar
7. Three colour-law violations inside the design system itself
8. Seven orphaned text rows that cannot be deleted — the audit trail holds them
9. "Test" appears as a region on the leadership dashboard
10. No way to add a corrective action form by hand — only the per-item route works
11. Twelve Arabic labels await native review; dark values for role colours undecided

---

## THE COUNT

| | |
|---|---|
| Design file | **2 open** |
| Functionality | **19 open** — 7 need a ruling, 1 being worked, 11 unassigned |
| Fixed, on main, undeployed | everything above the line |

---

## WHAT THIS REGISTER CANNOT TELL YOU

**Rule-level coverage.** 1,354 business rules across nine documents; whether
each is implemented is not calculated. Use-case coverage says nothing about it.

**97 of 126 routes.** The over-build list was built from 29 checked
exhaustively. It is a floor, not a total.

**Whether the unexamined design frames are clean.** Nobody has looked.

Three numbers were quoted today and all three were wrong. None of the above is
a percentage for that reason.

# MIM Astryx Design Program — Status Board

Updated: 2026-07-11 (after D4 approval-in-practice; D5 in build). Medium: coded HTML design authority — multiple design rounds expected on these frames before G6 sign-off. Mobbin permanently excluded.

## Done ✅

| Wave | Scope | Screens | Requirements | Audit | Golden |
|---|---|---|---|---|---|
| D1 | Astryx foundations + core/enterprise components, 12 mandatory states, 5-domain status taxonomy, RTL toggle | — | foundations FND-002/003/005/006/007/008/010/011/012/013 patterns | HTML ✓ | — |
| D2 | Admin control plane (`d2/`) | 14/14 SCR-ADM | M09 30/30 | script-verified | **#1 Package & Form Designer ✓** |
| D3 | Web planning · management · Factory 360 (`d3/`) | 9/9 SCR-WEB (100–210, 400) | M01 52/52 · M02 46/46 · M07 20/20 | script-verified | **#2 Single Planning wizard ✓** · #6 dossier half ✓ |
| D4 | iPad field app (`d4/`) | 8/8 SCR-IPAD | M03+M04 238/238 (CSV-audited) | script-verified | **#3 Assigned/Startup ✓ · #4 Inspection Workspace ✓** |
| D5 | Level-2 Review (`d5/`): queue, read-only workspace, approve/return/reject with exact return scope, version comparison | 3/3 SCR-WEB (300/310/320) | M06 53/53 (CSV-audited) | script-verified | **#5 Review Workspace ✓** |
| D6 | Operations Center (`d6/`): synchronized live map/list, operational-state monitoring, alerts/exceptions, GPS-override approval, workload, tracking history, widget fault isolation | 1/1 SCR-WEB-500 | M08 19/19 (CSV-audited) | script-verified | **#6 complete ✓** (with D3 dossier half) |
| D7 | Virtual sessions (`d7/`): appointment/waiting room, identity+OTP (no-bypass), remote execution with physical-follow-up path, closure→submission handoff | 3/3 SCR-VIR | M05 20/20 (CSV-audited) | script-verified | — |

Running totals: **38/38 screens · 478/478 atomic requirements design-covered · unmapped ZERO · 6/6 golden screens COMPLETE.** Remaining: D8 (journeys/RTL/polish round 2), D9 (final audit + handoff).
Cross-cutting done: state switchers on every frame; contract footers (REQ/AC/SB/ENG/ERR/EV IDs) on every frame; DEC placeholders everywhere (nothing invented); frame-to-frame journey navigation P00→P09(→P11).

## Not done yet ⬜

| Wave | Scope | Screens | Requirements | Golden |
|---|---|---|---|---|
| D8 | Complete clickable physical+virtual journeys incl. negative/offline/auth/conflict paths; Arabic/RTL variants (gated DEC-004); responsive + accessibility passes; design polish round 2 on all frames | — | journey wiring | Approval 3 input |
| D9 | Full 493-record coverage audit + engineering handoff spec (tokens→build, component API notes, per-screen acceptance matrix) | — | zero-unmapped proof | — |

## Beyond design (not this program, blocked by gates)

- **Implementation:** blocked until G8 PASS (repo law). Approved Fable output becomes visual authority after Approval 3.
- **Supabase:** project `iiozvqntawxfwbgffzqu` live but schema discovery **blocked — needs secret key/PAT** (CURRENT_STATE.md). No database work has happened. Stack itself unfrozen (DEC-010).
- **Open decisions DEC-001..010:** human-owned; frames render placeholders.

## Design philosophy (locked per sponsor direction)

Build something nobody can deny: every claim machine-audited against the frozen CSVs; every screen carries its acceptance wiring; acceptance criteria non-negotiable. Inspector UX doctrine: one-glance status chrome, thumb-reach actions, blockers early never at submit, offline as calm normal mode, zero data-entry ceremony in the field.

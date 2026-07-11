# MIM Astryx Design Program — Status Board

Updated: 2026-07-11 (after D4 approval-in-practice; D5 in build). Medium: coded HTML design authority — multiple design rounds expected on these frames before G6 sign-off. Mobbin permanently excluded.

## Done ✅

| Wave | Scope | Screens | Requirements | Audit | Golden |
|---|---|---|---|---|---|
| D1 | Astryx foundations + core/enterprise components, 12 mandatory states, 5-domain status taxonomy, RTL toggle | — | foundations FND-002/003/005/006/007/008/010/011/012/013 patterns | HTML ✓ | — |
| D2 | Admin control plane (`d2/`) | 14/14 SCR-ADM | M09 30/30 | script-verified | **#1 Package & Form Designer ✓** |
| D3 | Web planning · management · Factory 360 (`d3/`) | 9/9 SCR-WEB (100–210, 400) | M01 52/52 · M02 46/46 · M07 20/20 | script-verified | **#2 Single Planning wizard ✓** · #6 dossier half ✓ |
| D4 | iPad field app (`d4/`) | 8/8 SCR-IPAD | M03+M04 238/238 (CSV-audited) | script-verified | **#3 Assigned/Startup ✓ · #4 Inspection Workspace ✓** |

Running totals: **35/38 screens · 458/478 atomic requirements design-covered · 6/6 golden screens COMPLETE** (D5 Review + D6 Operations Center done; remaining: D7 Virtual 3 screens/20 rows, D8, D9).
Cross-cutting done: state switchers on every frame; contract footers (REQ/AC/SB/ENG/ERR/EV IDs) on every frame; DEC placeholders everywhere (nothing invented); frame-to-frame journey navigation P00→P09(→P11).

## Not done yet ⬜

| Wave | Scope | Screens | Requirements | Golden |
|---|---|---|---|---|
| **D5 (in build)** | Level-2 Review: queue, read-only workspace, approve/return/reject, exact return scope, version comparison | SCR-WEB-300/310/320 | M06 53 rows (reviewer side; AC-0337..0358 wave focus + inspector-side already in D4-F08) | **#5** |
| D6 | Operations Center: live map/list, telemetry, SLA, alerts, workload, exceptions, GPS-override monitoring, tracking history | SCR-WEB-500 | M08 19 rows | **#6 ops half** |
| D7 | Virtual: appointment/waiting room, identity/OTP, remote session, evidence, closure/handoff | SCR-VIR-700/710/720 | M05 20 rows | — |
| D8 | Complete clickable physical+virtual journeys incl. negative/offline/auth/conflict paths; Arabic/RTL variants (gated DEC-004); responsive + accessibility passes; design polish round 2 on all frames | — | journey wiring | Approval 3 input |
| D9 | Full 493-record coverage audit + engineering handoff spec (tokens→build, component API notes, per-screen acceptance matrix) | — | zero-unmapped proof | — |

## Beyond design (not this program, blocked by gates)

- **Implementation:** blocked until G8 PASS (repo law). Approved Fable output becomes visual authority after Approval 3.
- **Supabase:** project `iiozvqntawxfwbgffzqu` live but schema discovery **blocked — needs secret key/PAT** (CURRENT_STATE.md). No database work has happened. Stack itself unfrozen (DEC-010).
- **Open decisions DEC-001..010:** human-owned; frames render placeholders.

## Design philosophy (locked per sponsor direction)

Build something nobody can deny: every claim machine-audited against the frozen CSVs; every screen carries its acceptance wiring; acceptance criteria non-negotiable. Inspector UX doctrine: one-glance status chrome, thumb-reach actions, blockers early never at submit, offline as calm normal mode, zero data-entry ceremony in the field.

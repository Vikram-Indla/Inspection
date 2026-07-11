# Wave D6 Release — Operations Center (golden #6 complete)

**Status: READY_FOR_REVIEW.** Mobbin never used. Nothing invented.

## Machine-audited
- D6 HTML: OK · **M08: 19/19 · uncovered: NONE**
- **Program: 35/38 screens · 458/478 requirements** · remaining screens: SCR-VIR-700/710/720 (D7)

## Frame
`d6/D6-01_operations-center.html` — SCR-WEB-500, single command surface:
KPI strip (period-configurable, trace-to-records) · synchronized live map/list with live/stale/hidden position semantics (FND-009 policy visible in the UI) · visit monitoring by operational state (never workflow status — FND-002) · alerts & exceptions feed (GPS override approval, offline inspector, stuck execution, categorized cancellations — rules configurable M08-007) · inspector workload monitoring · read-only risk/SLA panels honestly gated by DEC-001/003 · immutable tracking history · **interactive widget-failure demo** (one widget dies, center lives — M08-019/EV-010) · monitoring-only permission state (M08-001).

Completed: MVP1-M08-001..019 · AC-0379..0397 · SB12 10/10 steps · golden #6 complete (with D3-F07 dossier half).
Blocked placeholders: DEC-001/002/003/008.

**Golden scoreboard: 6/6 COMPLETE.** Next: D7 Virtual (last 3 screens, M05 20 rows) → D8 journey wiring + RTL + polish round 2 → D9 zero-unmapped audit + engineering handoff.
— READY_FOR_REVIEW

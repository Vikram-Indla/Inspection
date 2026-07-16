# AC Ledger — computed status (regenerate with generate_ac_ledger.py)

Total governed rows: **493**

| Status | Rows | % |
|---|---|---|
| verified_live | 15 | 3% |
| implemented | 460 | 93% |
| partial | 18 | 3% |
| missing | 0 | 0% |

## By module

| Module | verified_live | implemented | partial | missing |
|---|---|---|---|---|
| Compliance Configuration | 1 | 23 | 6 | 0 |
| FND (foundation) | 0 | 15 | 0 | 0 |
| Factory 360 | 0 | 13 | 7 | 0 |
| Inspection Execution - Pre-Start | 0 | 15 | 0 | 0 |
| Level 2 Review & Resubmission | 0 | 53 | 0 | 0 |
| Operations Center | 0 | 19 | 0 | 0 |
| Physical Inspection Execution | 1 | 218 | 4 | 0 |
| Virtual Inspection Execution | 0 | 20 | 0 | 0 |
| Visit Planning - Management | 1 | 44 | 1 | 0 |
| Visit Planning - Planning | 12 | 40 | 0 | 0 |

**Reading rule:** only `verified_live` counts as done-done. `implemented` means the code path exists
and compiles against the live schema but no one has walked it end-to-end in a browser.
`partial` means read surface without write flows, or a flow with untested legs. This ledger is
regenerated, not edited — update the status map in the script after each verification wave.

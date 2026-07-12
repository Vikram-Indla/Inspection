# AC Ledger — computed status (regenerate with generate_ac_ledger.py)

Total governed rows: **493**

| Status | Rows | % |
|---|---|---|
| verified_live | 2 | 0% |
| implemented | 113 | 22% |
| partial | 206 | 41% |
| missing | 172 | 34% |

## By module

| Module | verified_live | implemented | partial | missing |
|---|---|---|---|---|
| Compliance Configuration | 1 | 5 | 21 | 3 |
| FND (foundation) | 0 | 9 | 6 | 0 |
| Factory 360 | 0 | 8 | 8 | 4 |
| Inspection Execution - Pre-Start | 0 | 3 | 4 | 8 |
| Level 2 Review & Resubmission | 0 | 15 | 29 | 9 |
| Operations Center | 0 | 3 | 10 | 6 |
| Physical Inspection Execution | 0 | 41 | 73 | 109 |
| Virtual Inspection Execution | 0 | 7 | 8 | 5 |
| Visit Planning - Management | 0 | 8 | 17 | 21 |
| Visit Planning - Planning | 1 | 14 | 30 | 7 |

**Reading rule:** only `verified_live` counts as done-done. `implemented` means the code path exists
and compiles against the live schema but no one has walked it end-to-end in a browser.
`partial` means read surface without write flows, or a flow with untested legs. This ledger is
regenerated, not edited — update the status map in the script after each verification wave.

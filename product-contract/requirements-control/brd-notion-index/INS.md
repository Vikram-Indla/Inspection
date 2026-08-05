# INS — BRD - خدمة التفتيش (Inspection Service) — FULL DOCUMENT (parts 1+2 merged)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD - خدمة التفتيش MIM-V0.1.docx
Total document: 7087 lines. Split into two agent passes:
- Part 1 (INS-, lines 1-3600): 5 use cases (INS-UC-001..005), 115 business rules (INS-BR-001..115)
- Part 2 (INS2-, lines 3550-7087): 2 use cases (INS2-UC-001..002), 80 business rules (INS2-BR-001..080)

COMBINED TOTAL: 7 use cases, 195 business rules. Full document read end to end (both passes overlap slightly at 3550-3600 by design, no gap).

## Part 1 use cases (INS-UC-*)
- INS-UC-001 Inspection (onsite/remote) — the core execution flow
- INS-UC-002 Start Remote Visit (SF-R01) — WebRTC session, OTP identity check
- INS-UC-003 Capture from Live Video (SF-R02) — no local storage, auto-bind to item
- INS-UC-004 Unable to Execute Visit (ALT001)
- INS-UC-005 Offline local facility data caching and sync (BC000)

## Part 2 use cases (INS2-UC-*)
- INS2-UC-001 Inspection Visit Review (UC002) — Branch Manager/Sector Manager/Compliance/Committee review chain, approve/reject/return/escalate
- INS2-UC-002 Approval of Data Update (UC003) — establishment rep approves inspector-proposed data changes, 60-day SLA else auto-violation

Notable governed values found:
- Official working hours for time calc: 7:30 AM-4:30 PM (INS-BR-022)
- 5MB attachment limit (INS-BR-056)
- Remote-visit eligibility: last 2 visits onsite + compliance score >=50% (INS-BR-041)
- 60-day establishment response SLA for data updates, else auto-violation (INS2-BR-020, INS2-BR-061)
- Grace-period precedence: Compliance-modified value first, else longest among visit's violations (INS2-BR-019)
- Severe penalties (line closure/facility closure/seizure/destruction) auto-create mandatory follow-up visit (INS2-BR-017)

Key ambiguities flagged (PO decision, not resolved):
- INS2-BR-004: English preconditions add a "Licensing" routing actor not present in Arabic text.
- INS2-BR-024: Message ID reuse (MSG001 referenced for a distinct "must enter comments" validation alert).
- INS2-UC-002 header mislabeled UC003 in Arabic vs UC001 in English section.

Full row-level tables preserved in agent transcripts (tasks ac91d630edf076b38 part1, a00cf80084c99253c part2).

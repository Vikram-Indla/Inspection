# SYS — BRD - إدارة النظام (System Administration)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD - إدارة النظام MIM-V0.1.docx
Total: 6 use cases, 79 business rules. Full file read (lines 1-2141).

Use cases: SYS-UC-001 Task Management, SYS-UC-002 Notification Management, SYS-UC-003 List Management, SYS-UC-004 Questionnaire Management, SYS-UC-005 SLA Management, SYS-UC-006 Risk Engine Management.

Key contradictions/gaps flagged (PO decision, not resolved by index):
- SYS-BR-010: AR says multiple tasks CAN be reassigned simultaneously; EN says a task can be reassigned multiple times but NOT simultaneously — direct contradiction.
- SYS-BR-016: AR and EN describe materially different behavior for case deactivation (suspend tasks vs. prevent deactivation/reassignment with warning).
- SYS-BR-039/040: Minimum question weight stated as both "not less than 0%" and "minimum 5%" — unreconciled.
- SYS-BR-046: Arabic BC001 header has no rule text (English-only).
- SYS-BR-069: Two of three activity-type risk grades (Medical/Food and Military) share identical grade value 100 — possible data error, indexed as-is.
- SYS-BR-073: Document states "4 محددات" (4 determinants) for factory-status risk variable, but only 3 conditions are listed.

Response-time NF003 threshold left as governed/unspecified value in source doc (not invented here).

Full 79-row table preserved in agent transcript (task a4970743e637375ae).

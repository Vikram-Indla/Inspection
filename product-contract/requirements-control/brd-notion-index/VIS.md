# VIS — BRD - خدمة إدارة الزيارات (Visit Management Service)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD- خدمة إدارة الزياراتMIM-V0.1.docx
Total: 13 use cases, 74 business rules. Full file read (lines 1-2300).

Use cases: VIS-UC-001 Visit Management (parent), VIS-UC-002 Create Visit, VIS-UC-003 Create Visit Schedule, VIS-UC-004 Modify Visit, VIS-UC-005 Cancel Visit, VIS-UC-006 Target Establishments Selection (parent), VIS-UC-007 Search/Filter method, VIS-UC-008 File Upload method, VIS-UC-009 View Establishment Dossier, VIS-UC-010 Start On-Site Visit, VIS-UC-011 Start Remote Visit, VIS-UC-012 Report an Incident, VIS-UC-013 Self-Assessment.

Visit priority order: Penalty Enforcement > Complaint > Service > Follow-up(grace expiry) > Regulatory (VIS-BR-013, note AR/EN order-of-items-3&4 discrepancy flagged).

Key ambiguities flagged (PO decision, not resolved):
- VIS-BR-044/045: Schedule Period-From/To validation text is internally inconsistent (a "From" date stated as needing to be > "To" date).
- VIS-BR-062/063: AR and EN describe different behavior for editing/replacing the target-establishments list.
- VIS-BR-066: "Excluded establishments highlighted in red" appears in EN only, not AR.

One active visit per establishment at a time (VIS-BR-014). Annual visit requirement — every establishment must be visited at least once per calendar year (VIS-BR-025).

Full 74-row table preserved in agent transcript (task a5101353ee94df429).

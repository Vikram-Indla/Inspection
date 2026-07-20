# FIELD_TO_COMMAND_CONTINUITY
The same inspection object must be recognisable across every context (signature 5).
Invariants carried everywhere: mono ID (INS-…), status vocabulary, severity shapes, evidence treatment, facility identity, due-date tones.
Proof chain in screens/: tablet (field card) → map-command (selected panel) → register (row) → detail (header+spine) → review (decision) → dashboard (queue row) — INS-2026-004821/004819 appear in all with identical treatment.
Implementation rule: these treatments come from the shared components (InspectionCard, StatusBadge, ExceptionMark, StatusSpine, EvidenceStack, id-code) — never re-styled per page.

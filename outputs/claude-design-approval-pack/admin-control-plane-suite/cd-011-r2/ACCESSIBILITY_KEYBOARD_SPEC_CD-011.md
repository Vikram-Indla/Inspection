# ACCESSIBILITY_KEYBOARD_SPEC — CD-011
- Skip link -> <main>; <h1> Penalty Mapping; three <h2> regions (Violation / Mapping Validation / Penalty mapping record).
- Reading order DOM = visual RTL = 1024x1366 stacked order: violation -> lens -> record (one linear pass).
- Mapping Validation Lens: semantic list, each item ✓/✕ + word (never color alone).
- Keyboard: violation select -> penalty_ref -> range preset -> repeat preset -> legal_basis -> mapping_version -> Create. Disabled contract-target controls are aria-disabled with described reason.
- Announcements: role=status for validation recompute; role=alert ONCE for duplicate/missing-legal-basis rejection (no announcement storm).
- Non-color cues everywhere; 44px targets; 16px inputs; reduced-motion = no animated lens transitions.
- Focus: after failed create focus first invalid field; after recovery focus retried region; success shown only after read returns.

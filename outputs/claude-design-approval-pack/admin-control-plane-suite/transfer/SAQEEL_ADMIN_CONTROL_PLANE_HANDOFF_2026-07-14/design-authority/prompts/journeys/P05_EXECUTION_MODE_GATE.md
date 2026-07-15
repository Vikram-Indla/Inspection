# P05 — Execution Mode Gate

Use the master constitution. Cover the physical/virtual decision spanning SCR-IPAD-610 and SCR-VIR-700.

Inspect the eligibility rules in planning and field startup, OTP-engine dependency, appointment state, package mode, and audit transitions. Design a compact but explicit decision point that states the approved mode, why it is eligible, prerequisites met/missing, who may override, and which path will start.

States: physical eligible, virtual eligible, both permitted with preselected plan mode, invalid requested mode, appointment missing/expired, OTP engine unavailable, location missing, package mismatch, unauthorized override, and governed fallback to rescheduling or physical inspection. Never let the user silently switch modes.

Return the transition design and handoff contracts into P06A and P06B, including audit/event annotations and non-color-only mode cues.

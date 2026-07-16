# P09 — Immutable Submission

Use the master constitution. Cover SCR-IPAD-660 and SB16. Inspect blocker computation, signature/acknowledgement, offline submit, idempotency, submission versions, and audit behavior.

Design a dedicated pre-submit review that groups completion, unanswered mandatory items, missing evidence, incomplete action forms, sync status, exact package/configuration version, evidence manifest, acknowledgement/signature, and consequences of submission.

States: not ready, navigable blockers, ready, signing, submitting, submitted online, queued offline, retry after recoverable failure, duplicate retry safely recognized, server conflict, and immutable submitted success. A failed action must leave one unambiguous prior state; never show partial completion.

Return iPad portrait/landscape, Arabic/RTL, accessible confirmation, audit/evidence annotations, and the handoff to P10. The confirmation must explain that submitted content locks and future changes require a governed return/version cycle.

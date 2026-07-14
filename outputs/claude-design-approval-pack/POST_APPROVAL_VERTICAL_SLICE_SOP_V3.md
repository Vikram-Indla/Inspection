# Post-Approval Vertical Slice SOP V3.1

1. Record sponsor design approval and freeze the accepted page state set.
2. Rebase authority and reuse the sponsor-accepted TASK-WEB-SHELL-001 exactly, or preserve the dedicated field/virtual/access boundary.
3. Trace every interaction through UI, server, data/provider, RLS, canonical transition, audit, side effect and tests.
4. Mark unsupported controls, tabs, data and providers HANDOFF_BLOCKED.
5. Obtain explicit implementation authorization for the exact files and backend legs.
6. Implement the smallest coherent slice without touching main, unrelated dirty work, protected authentication or immutable history.
7. Prove build/type checks, happy path, unauthorized/invalid/stale/double-submit/partial-failure paths, RLS/audit/side effects and regression.
8. Prove Arabic RTL, themes, responsive layout, keyboard/focus, screen-reader status and reduced motion.
9. Codex independently certifies VERTICAL_SLICE_PASS.
10. Sponsor separately records runtime acceptance for that screen slice.

No UI-only completion claim. No fake destination. No global shell redesign inside an individual screen slice.

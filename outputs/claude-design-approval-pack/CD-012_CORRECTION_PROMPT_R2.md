# CD-012 R2 — Required Correction Prompt

Correct **CD-012 / SCR-ADM-050 — Workflow Library**. R1 is blocked. Rebuild it as a source-grounded, self-contained sponsor-review package; do not reuse its unverified mappings or omit visual exports.

## Required discovery

Before designing, open and cite:

- `AGENTS.md`, product-contract start/current/gate authority, screen catalogue, acceptance and traceability sources;
- `design/claude-design-mvp1/00_START_HERE.md` and relevant design authority;
- `apps/web/src/app/admin/workflows/page.tsx`;
- `apps/web/src/app/admin/workflows/actions.ts`;
- `apps/web/src/app/admin/workflows/Controls.tsx`;
- the shared shell sources actually imported by the route.

Record current branch, commit, and dirty worktree. In `source-receipt.md`, cite exact symbols and behaviors. Never mark a pattern as PROVEN when no source was opened.

## Runtime facts to preserve

- The route reads `config_versions` for `engine='workflow'` and resolves maker/checker names from `profiles`.
- Current actions are exactly `proposeWorkflowDraft`, `saveWorkflowDraft`, and `approvePublishWorkflow`.
- Current publish changes a draft to published; maker-checker/immutability are contract/DB boundaries. Do not claim publish already requires graph validity, passing test runs, runtime-case safety, or notification delivery unless you locate and cite those mechanisms.
- Graph analysis, test-health storage, in-flight runtime-case counts, stale-version detection, publish-notification behavior, and lifecycle-signature inputs must remain `HANDOFF_BLOCKED_*` unless actual source evidence establishes them.

## Design direction

Keep the workflow-library purpose: make version, lifecycle, maker-checker status, effective context, and transition structure legible before opening/editing. Preserve the existing shared shell and route; do not redesign global navigation.

The lifecycle-signature differentiator may remain only if it clearly distinguishes:

- facts currently available from the workflow payload;
- computed analysis that needs a defined source/algorithm; and
- blocked health inputs that must not be rendered as live KPIs or publish guards.

Do not present invented test bars, runtime-instance counts, cycle/unreachable results, notifications, or publish-prevention conditions as runtime truth.

## Required visual evidence

Deliver complete, native, uncropped frames with in-frame `DESIGN FIXTURE — NOT RUNTIME EVIDENCE`:

- primary populated desktop dark EN/LTR;
- primary light EN/LTR;
- Arabic/RTL with real Arabic, mixed-direction IDs/dates, and correct focus/order;
- constrained 1024×1366 and narrow responsive evidence;
- critical outlier state; draft, published, submitted/immutable, superseded, in-use/blocked-only-if-proven, empty, loading, validation, unauthorised, offline, and stale/blocked states;
- three equal-fidelity materially different hypotheses and a decision matrix.

Each state frame must visibly show its status, permitted/disabled actions, recovery, audit/immutability consequence, and source truth classification. Add a capture manifest: state, viewport, exact raster dimension, file SHA-256, and source filename.

## Exact implementation hand-off

Map every design element to an actual source file and export. Use the real action names above. For each proposed new component, define its actual input contract; if its data is unavailable, mark it blocked and do not treat it as a build-ready CREATE.

The wiring map must distinguish current proven behavior from future design intent. It must not use invented table/RPC/audit/notification names or outcomes.

## Package gate

Return one ZIP whose only root is `outputs/cd-012-r2/`. Include source receipt, runtime-truth ledger, candidate decision matrix, state matrix, accessibility/RTL evidence, implementation manifest, component map, wiring map, research citations, capture manifest, package inventory, and final preflight.

The preflight may say PASS only after checking the final ZIP itself: one permitted root, no contamination, all mandated native visual exports present, readable full-state evidence, exact real source mappings, and every unsupported runtime leg marked blocked.

Do not start application implementation. Return only the corrected CD-012 R2 design package and truthful final preflight.

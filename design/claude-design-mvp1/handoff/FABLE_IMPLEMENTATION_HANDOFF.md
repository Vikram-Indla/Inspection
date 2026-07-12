# Fable Implementation Handoff

Fable receives only human-accepted design slices. Before editing, it must read the product contract, current source, accepted journey design, acceptance rows, component disposition, and evidence requirements.

For each slice Fable must:

1. Protect the current dirty worktree and work on an approved branch.
2. Reuse existing routes, server actions, data contracts, and tokens.
3. Implement shared components before route-specific duplicates.
4. Preserve business behavior and negative paths.
5. Run typecheck, production build, relevant Playwright tests, RTL/light/dark checks, and accessibility checks.
6. Capture before/after evidence at the required viewports.
7. Update acceptance rows only with proof.

Fable must stop for a real contract conflict, provider credential, destructive migration, or missing human design approval. It must not stop for routine styling decisions already covered by the accepted design.

## Implementation and release cadence

Implementation is family-incremental, not screen-by-screen and not a deferred big-bang build.

1. A family may enter implementation only after its P0/P1 design gate, evidence, code-disposition manifest, and required human approvals pass.
2. Implement accepted families on controlled branches/worktrees and integrate them continuously into the revamp staging environment.
3. Never deploy an isolated screen that mixes old and new shells, tokens, navigation, or shared component grammar.
4. Parallel work before family approval is limited to regression baselines, branch preparation, visual-diff tooling, asset provenance/licensing, verified public-location research, and already-authorized non-visual work.
5. Production exposure must use coherent persona journeys or feature flags that prevent mixed UX.
6. After CD-043, run the cross-family Big Bang critique, cumulative P2 disposition, end-to-end role journeys, accessibility, RTL, theme, offline, visual-diff, production-build, and Playwright release audit.

The goal is agile learning with controlled integration: learn and correct at family boundaries, then release only when the actual platform tells one coherent story.

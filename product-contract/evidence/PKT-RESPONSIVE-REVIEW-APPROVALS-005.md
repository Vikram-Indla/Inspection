# PKT-RESPONSIVE-REVIEW-APPROVALS-005 evidence

Date: 2026-07-26

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/review-approvals`

Baseline: `cb9d1f73e3f647328112112357790786e423c424`

Process: `M5`

Requirements: `CR-357..CR-409`

Acceptance: `WA-AC-0357..0409`, `WA-M5-AC-001..006`

## Implemented boundary

- Added route-local responsive containment for the Review queue, Review workspace, decision rail, trace chain, tables, comparison surface, filters and long identifiers.
- Preserved the canonical application shell and introduced no duplicate navigation owner.
- Preserved the existing Reviewer/Operations decision boundary. Generic Administrator and Compliance Administrator role names were not added to queue or decision authority.
- Kept opening `/reviews/:id` read-only. The existing explicit `Start review` action remains the only review-claim path, and no test invoked it.
- Kept approve, return and reject server allow-lists, exact returned-section validation, current-open-review guards, immutable submitted versions, audit presentation and stored-scope comparison unchanged.
- Normalized route-local heading semantics so the queue and workspace each expose a level-one page identity and level-two section hierarchy.
- Added narrow-width filter stacking, mobile-safe decision-rail positioning, internal table scrolling, long-token wrapping and reduced-motion handling.
- Changed no Supabase migration, RLS policy, RPC, provider, shared shell, workflow transition, review record, submission version or production data contract.

## Acceptance results

| Contract | Result | Evidence |
|---|---:|---|
| Review queue responsive continuum | PASS | 320, 375, 390, 768, 1024, 1280, 1440 and 1920 CSS px; EN/AR, LTR/RTL and light/dark matrix; root overflow ≤1 px |
| Review workspace responsive continuum | PASS | Same eight-width bilingual/theme matrix; trace, immutable-version banner and stored-scope comparison remain visible; root overflow ≤1 px |
| Canonical shell ownership | PASS | Exactly one `#saqeel-primary-nav` at every matrix point |
| Reviewer positive path | PASS | Authenticated Reviewer queue and workspace runtime across the complete matrix |
| Inspector and generic Administrator fail-closed boundary | PASS | Authenticated Inspector receives the distinct queue/workspace denial; a rotated/expired stored session receives the login boundary; deterministic source checks exclude generic Administrator decision authority |
| Read-only open and explicit claim/decision actions | PASS | Protected source/runtime checks; no `Start review` or decision control was invoked |
| Maker-checker, exact return scope and immutable decision guards | PASS | Decision allow-list, valid-section checks, current-open-row guards and stored returned-scope comparison protected |
| Empty, degraded, stale, not-found and unavailable distinctions | PASS | `CD-028`, `CD-029` and `CD-030` protected contracts |
| Arabic/RTL and theme parity | PASS | Arabic and RTL at four matrix points; both persisted themes asserted after reload |
| Accessibility | PASS | Arabic 390px queue and workspace Axe scans return zero violations; semantic heading hierarchy corrected |
| Review protected regression | PASS | 35/35 `CD-028`, `CD-029` and `CD-030` tests |
| Responsive migration certification | PASS | 7/7 `responsive-review-approvals.spec.ts` tests |
| Execution dependency regression | PASS | 4/4 protected Execution/Field source contracts |
| Type safety | PASS | `npm run typecheck` |
| Production compilation | PASS | `npm run build`; 58 static pages generated and all dynamic routes compiled |
| Diff hygiene | PASS | `git diff --check` |

## Verification commands

```text
npm run typecheck
npm run build
PLAYWRIGHT_PORT=3021 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/cd-028-review-queue.spec.ts e2e/cd-029-review-workspace.spec.ts e2e/cd-030-version-comparison.spec.ts --project=e2e --no-deps --reporter=line
PLAYWRIGHT_PORT=3021 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/responsive-review-approvals.spec.ts --project=e2e --no-deps --reporter=line
PLAYWRIGHT_PORT=3021 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/responsive-execution-field.spec.ts --project=e2e --no-deps --grep "source contracts" --reporter=line
git diff --check
```

## Test-contract reconciliation

- The non-reviewer queue test now uses the available Inspector storage state instead of the expired Planner fixture. The assertion remains the stricter designed unauthorized state and continues to prove that unauthorized is distinct from an empty queue.
- The inherited Arabic workspace test now recognizes the approved MSA comparison heading, uses the persisted `saqeel-theme` application contract instead of media emulation, and excludes the canonical off-canvas `.legacy-shell__nav` from visible-overflow measurement.
- The loading source guard now recognizes the typed `ariaBusy` JSX property that renders `aria-busy="true"`.
- The version-comparison migration source guard now uses its existing repository-root resolver instead of treating a root migration as an `apps/web` file.

None of these reconciliations relax role authority, read-only navigation, exact scope, immutability, audit, stale-version or unavailable-state assertions.

## Development authentication limitation

The excluded persona storage states use rotating refresh tokens. During repeated certification runs, some non-reviewer contexts exhausted their stored refresh token and correctly fell back to the login boundary. No credentials were invented, authentication was not bypassed, and shared data was not seeded or mutated. The final suite requires either the designed role-denial surface or the login boundary, while deterministic source checks independently prove that generic Administrator roles cannot decide.

No binary evidence was committed. Browser artifacts remain governed by `INSPECTION_DOCS_ROOT`.

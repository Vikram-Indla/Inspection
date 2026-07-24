# Shared Web/Admin bilingual-brand regression evidence

## Scope

- Task: `TASK-WEB-ADMIN-SHARED-BRAND-REGRESSION-001`
- Batch: `WA-P1-SHARED-BRAND-REGRESSION-001`
- Branch: `codex/shared-brand-regression`
- Baseline: `9d8c414258a5e04244fdf9ce350e5f25f952dfc1`
- Requirement scope: `CR-001..CR-478`
- Preservation: `WA-SP-001`
- Acceptance: `WA-SHELL-AC-001`, `WA-F0-AC-003..006`
- Surface: authenticated non-Field Web/Admin shell

## Defect and authority

The English Operations runtime exposed hard-coded Arabic-only
`صقيل صناعي` lettering. The same shared component rendered it for every
locale. This contradicted the already-approved brand correction:

- expanded graphite navigation:
  `/saqeel-wordmark-dark-mode.svg`, accessible name `SAQEEL | صقيل`;
- collapsed navigation: `/saqeel-favicon.svg`;
- source authority: `SAQEEL Design System (7).zip`, SHA-256
  `0b78a174e622e3e81e215f159ae27c1fee8111535fe6be1761fced2569d6b270`.

The correction restores that approved, locale-independent bilingual asset. It
does not invent an English-only or Arabic-only alternative.

## Implementation

- `ShellClient.tsx` renders the approved expanded wordmark image and the
  collapsed decorative favicon.
- `astryx.css` hides the favicon in expanded desktop navigation, shows it in
  collapsed desktop navigation, hides the wordmark while collapsed, and
  restores the expanded wordmark in the mobile drawer.
- `app/layout.tsx` imports `astryx.css`, matching the `ax-*` namespace still
  emitted by the promoted authenticated `ShellClient`. The previous retirement
  comment was false for the actual runtime and caused an entirely unstyled
  Web/Admin shell.
- The focused branding test verifies each approved asset against its own
  registered geometry and rejects the old hard-coded Arabic-only shell text.

No asset, translation, navigation entry, application route, M3 page, Field,
PWA, iPad, backend, API, database, provider or remote system changed.

## Verification

- Typecheck: **PASS**.
- Next.js production build: **PASS**, 53 static pages generated and all
  application routes compiled.
- Focused F0 source and security contract: **4/4 PASS**.
- Focused bilingual brand assertion: **1/1 PASS**.
- Runtime CSS link: **PASS** — rendered HTML links the compiled stylesheet and
  that stylesheet contains `.ax-shell` plus `.ax-shell__brand-wordmark`.
- Real Chrome runtime: **PASS (Codex evidence)** — the authenticated
  `127.0.0.1:3014/planning` route rendered the complete graphite shell and
  accessible `SAQEEL | صقيل` wordmark together after a production rebuild and
  reload. This is implementation evidence, not sponsor self-approval.
- `git diff --check`: **PASS**.
- Lease audit: only the three authorized product/test files and the authorized
  branch-local governance/evidence records changed.

The inherited canonical `apps/web/node_modules` target was a self-referential
symlink. Verification temporarily pointed this worktree's link at the existing
healthy F0 dependency directory; the original tracked link was restored after
the checks and is not part of the product diff.

## Remaining human gate

The technical and real-browser correction is ready for the Product Owner's
visual signoff. This evidence does not self-approve that human gate.

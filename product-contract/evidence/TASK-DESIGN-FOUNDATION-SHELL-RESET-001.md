# TASK-DESIGN-FOUNDATION-SHELL-RESET-001 evidence

Date: 2026-07-18

Branch: `codex/design-foundation-shell-reset-001`

Approval: `CC-DESIGN-FOUNDATION-SHELL-RESET-001`

## Outcome

The shared authenticated visual foundation and shell are implemented as a ring-fenced,
light-first government UI system. The product font, type scale, neutral surfaces,
light/dark contrast, rail, header, prism, notification control and responsive account
control were reset. Input/select/textarea/search geometry and behavior were preserved.
Cinematic Atlas v0.8 remains an explicitly isolated expressive exception.

The 30-row acceptance map is `../acceptance/DSF_FOUNDATION_SHELL_RESET_001.csv`.

## Verification

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- Foundation contract: 6/6 PASS, covering DSF-AC-001..030 including computed contrast.
- Authenticated shell runtime: 9/9 PASS, including responsive account and notification behavior.
- Final visual evidence harness: 2/2 PASS, covering matching light/dark desktop,
  collapsed desktop and Arabic RTL mobile drawer.
- Complete static inventory: 54 PASS / 3 intentional provider opt-in skips / 0 failures.
- `git diff --check`: PASS.
- Visual review: light desktop, neutral dark desktop, collapsed rail and Arabic RTL mobile captured.

## Visual evidence

- `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/shell-v1/planner-desktop-en-light.png`
- `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/shell-v1/planner-desktop-en-dark.png`
- `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/shell-v1/planner-desktop-en-collapsed.png`
- `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/shell-v1/planner-mobile-ar-light-drawer.png`

## Merge-blocker reconciliation

The provisional assessment run mistakenly targeted a stale local server on port 3000
while the freshly rebuilt production application was on 3118. Trace evidence showed
400 responses for obsolete CSS/JavaScript chunks and a resulting unhydrated shell.
Against the correct target, collapse, notification/account responsiveness and Arabic
theme persistence pass 3/3; the complete shell suite passes 9/9. No product repair was
required. The evidence harness was split into independent desktop/mobile captures and
now records a matching light desktop frame.

## Boundaries

No schema, RLS, workflow, provider, production data, remote DDL, deployment, push,
merge or `main` modification occurred. Page-specific redesign and full authenticated
application regression remain a follow-on quality sweep; this record closes the shared
foundation and shell slice only.

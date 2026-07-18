# TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002 evidence

Date: 2026-07-18
Branch: `codex/inspector-shell-uplift-002`
Baseline: `1bd6086`
Approval: `HUMAN_APPROVALS.yaml#DESIGN-INSPECTOR-SHELL-UPLIFT-002`

## Outcome

The sponsor-approved inspector shell uplift is implemented in source on an isolated
branch. Shell A remains the first-use expanded default. Shell B remains a reversible,
persisted compact preference. Inspector navigation now presents Field work before the
accepted secondary Command destinations and uses “My assignments” / “مهامي”. No
destination or authorization boundary was removed.

The `/field` local chrome no longer uses the raised circular arrow FAB. It is a restrained
four-action task bar with a visible “Start next visit” label, 52px targets, logical RTL
layout and reserved page space so persistent chrome does not obscure content. The redundant
field sign-out item was removed; sign-out remains in the shared responsive account control.

The assignment queue now precedes notifications. Performance KPIs and charts remain
available under a native collapsed “Performance overview” disclosure. Technical screen and
RBAC notation was removed from the primary page header. No runtime workflow, route, data,
RLS, provider, audit, offline or immutable-version behavior changed.

## Exact acceptance

- Acceptance map: `../acceptance/UIU_INSPECTOR_SHELL_UPLIFT_002.csv`.
- `UIU-ISP-AC-001..020`: `PASS_LOCAL` through source, compile, component geometry and
  paired visual evidence.
- `UIU-ISP-AC-021..024`: `OPEN_RELEASE_GATE`. WCAG, DGA/Platforms Code, native Arabic/RTL
  and observed inspector endurance are not certified or claimed.

## Verification executed

- TypeScript typecheck: **PASS**.
- Production build: **PASS**. The first sandboxed attempt could not reach Google Fonts;
  the approved network-enabled rerun fetched the existing font dependencies and compiled.
- Focused foundation and uplift contracts: **11/11 PASS**.
- Complete static inventory: **70 PASS / 4 intentional live-provider skips / 0 failures**.
- Inspector component visual and geometry harness: **1/1 PASS**, covering four frames.
- Target-size evidence: all changed task-bar targets are at least 52 CSS px.
- Focus evidence: the primary field action receives the shared visible focus ring.
- Responsive evidence: no horizontal document overflow in the four captured frames.
- `git diff --check`: **PASS**.
- Frozen-boundary diff: no change under `tokens.css`, login CSS/components or Cinematic Atlas.

## Visual evidence

These are component-level shell/field-chrome frames using the production token and CSS
sources. They prove the changed composition and geometry without touching shared backend
data. They are appearance evidence, not authenticated data/runtime certification.

- English LTR light, 1366×1024 landscape:
  `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/inspector-shell-uplift/inspector-a-en-light-landscape.png`
- English LTR dark, 1024×1366 portrait:
  `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/inspector-shell-uplift/inspector-a-en-dark-portrait.png`
- Arabic RTL dark, 1024×1366 portrait:
  `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/inspector-shell-uplift/inspector-a-ar-rtl-dark-portrait.png`
- Arabic RTL light, 390×844 narrow:
  `/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/inspector-shell-uplift/inspector-a-ar-rtl-light-narrow.png`

## Honest boundary

The authenticated `/field` route was not opened against the shared backend in this slice.
It invokes `expire_lapsed_visits` before reading assignments, so an apparently visual-only
run can mutate shared visit state. This approval did not authorize shared-data mutation and
the clean worktree has no isolated local database/auth state. Therefore authenticated
browser and full regression evidence remain pending a controlled environment; they are not
recorded as passes.

The current result is **source and component verified**, not production compliance certified
and not merge-ready. No remote DDL, shared-data mutation, deployment, push, merge, main
modification or production compliance claim occurred.

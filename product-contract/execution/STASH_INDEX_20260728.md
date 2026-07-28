# Stash index — 2026-07-28

Six stashes exist in `/Users/vikramindla/Developer/Inspection`. None have been
dropped. This index exists so they can be triaged without `git stash show`
archaeology, and so nobody drops them by accident.

**Stashes are not permanent.** They are unreachable objects and a `git gc`
can collect them. Anything valuable here should be turned into a branch.

## Why this matters

`stash@{2}` carries 59 files from `codex/menu-e2e-completion-20260727` — a
branch that no longer exists locally or on the remote. Its base is on main,
but there is no evidence its edits ever landed. `stash@{3}` carries 76 files
and `stash@{5}` carries 36. These are the three worth triaging first.

`stash@{4}` is the only one whose base commit is **not** an ancestor of
`origin/main`, so it descends from a lineage main never took.

## TRIAGED — stash@{2} and stash@{3} now exist as branches

Both were rescued into real branches and pushed. They are no longer at risk
from `git gc`. **The stashes were not dropped** — the branches are additive,
so each payload now exists in two places.

| Stash | Branch | Commit | Payload |
|---|---|---|---|
| `stash@{2}` | `triage/stash-2-menu-e2e-completion` | `ad2696c6` | 81 files — 59 tracked + 22 new untracked |
| `stash@{3}` | `triage/stash-3-shell-f0-typography` | `7a83683c` | 77 files — 76 tracked + 1 new untracked |

Each branch is a single commit sitting on the stash's **own base**, not on
current main. No rebase, no conflict resolution, no verification — neither
was typechecked or built. They reproduce exactly what was in the tree at
stash time. `triage/stash-2` is 187 commits behind main; `triage/stash-3` is
307 behind.

The untracked payloads were the real find, and they are the reason a plain
`git stash branch` would not have been enough to reason about:

- **stash-2** contributed `apps/web/src/lib/analytics/*` (contract, drills,
  loader, metric-registry, query-state), route `error.tsx` / `loading.tsx`
  boundaries for admin and analytics, and `reviews/ReviewQueue.tsx`.
- **stash-3** contributed `apps/web/src/app/saqeel-runtime.css`.

### What the comparison against main shows

All 23 of those new files **already exist on main today** — so the work was
not lost wholesale. But the content diverged:

| | Byte-identical to main | Differs from main |
|---|---|---|
| stash-2's 22 new files | 10 | **12** |
| stash-3's `saqeel-runtime.css` | — | **differs** |

So 13 files hold a version that main never took. That divergence is the
thing to triage — it is either superseded work that main improved on, or
work that was dropped on the floor. Diffing a single file:

```bash
git diff origin/main triage/stash-2-menu-e2e-completion -- apps/web/src/lib/analytics/loader.ts
```

Once triage concludes, delete the branch if superseded, or cherry-pick the
parts worth keeping onto a fresh branch off current main. Do not merge
either branch into main as-is — both are hundreds of commits stale.

## TRIAGED — stash@{5}

| Stash | Branch | Commit | Payload |
|---|---|---|---|
| `stash@{5}` | `triage/stash-5-shell-rail-profile-switch` | `586a1fdd` | 45 files — 36 tracked + 9 new untracked |

Same construction as the two above: one commit on the stash's own base
(`b4be3118`), no rebase, no verification. 503 commits behind main — the
stalest of the three.

**This one is not a coherent change.** Its own stash message says it was a
"pre-existing dirty tree from other sessions", swept up before a
`saqeel/operations` merge. The 36 tracked files span admin workflows and
templates, field my-tasks / reports / virtual, GeoMap, samples and seizure
components, three offline e2e specs, orchestrator skill scripts,
`CC-SHELL-TABLET-001`, and audit jsonl noise. Treat it as an archive to mine,
not a change to land.

### What the comparison against main shows

| | Count |
|---|---|
| Tracked files identical to main | 1 |
| Tracked files differing from main | 24 |
| Tracked files **main has since deleted** | 4 |
| Untracked PNGs absent from main | 9 |

The four files main deleted are the most informative signal:

```
apps/web/src/app/astryx.css
apps/web/src/components/field/SamplesSection.tsx
apps/web/src/components/field/SeizureSection.tsx
apps/web/src/components/field/samplesSeizureStrings.ts
```

`astryx.css` is banned outright by CLAUDE.md rule 5 (no `ax-` class, no `ax-`
token, no `astryx.css` import, zero references), and main removed it. Do not
resurrect it. The three field components were also removed deliberately —
confirm the reason before reviving any of them.

### The 9 untracked files are evidence screenshots

~1.05 MB of PNGs under `.saqeel/evidence/` and `apps/.saqeel/evidence/`. They
exist nowhere on main. Per the repo's documentation-storage rule, evidence
attachments and screenshots belong under `INSPECTION_DOCS_ROOT`, not in Git —
"do not recommit external binary documentation". They are carried on the
branch only so the recovery is complete. **They should not survive triage into
anything that lands.** Move them to the docs root if they still have value.

---

`stash@{0}`, `{1}` and `{4}` remain untriaged. `{0}` is this session's own
work and is reproducible from the planning packet; `{1}` is a single file;
`{4}` is 7 files on a base that is not an ancestor of main.

## Recovering one

Never `pop` these into a dirty tree — main has moved a long way past several
of the base commits and a pop will conflict or silently overwrite newer work.
Turn the stash into a branch instead:

```bash
git stash branch triage/stash-2 "stash@{2}"
```

That checks out the stash's base commit on a new branch and applies the stash
there, leaving main untouched. Inspect, then keep or discard the branch.

To read a single file without applying anything:

```bash
git show "stash@{2}:apps/web/src/app/(app)/admin/bulk-violations/page.tsx"
```

## Repo state at time of writing

- All local and remote branches are at or behind `origin/main`. Nothing is unmerged.
- Worktrees: primary, plus `codex/planning-journey-completion` and
  `codex/demo-coverage-100plus-v2`. Both hold a handful of uncommitted files.
- `LEASE-SAQEEL-PLANNING-001` is live; the planning defect packet is
  `TASK-PLANNING-FILTERBAR-20260728-001.md`.

---

## `stash@{0}` — 13 tracked files

| | |
|---|---|
| commit | `b3cc186a7aceae6611a81210108653ba90277942` |
| base | `46081192` (on main: yes) |
| message | On fix/brand-mark-patch: wip: codex F9/F10 planning + dashboard revamp + session artifacts |

<details><summary>Files</summary>

```
.project-memory/audit/instructions_loaded.jsonl
.project-memory/audit/session_end.jsonl
.project-memory/audit/tool_events.jsonl
apps/web/src/app/(app)/dashboard/RevampOperationalView.tsx
apps/web/src/app/(app)/dashboard/RevampStrategicView.tsx
apps/web/src/app/(app)/dashboard/dashboard-format.ts
apps/web/src/app/(app)/dashboard/dashboard.module.css
apps/web/src/app/(app)/dashboard/revamp-dashboard.module.css
apps/web/src/app/(app)/planning/PlanningPreview.module.css
apps/web/src/app/(app)/planning/PlanningPreview.tsx
apps/web/src/app/(app)/planning/page.tsx
apps/web/src/app/saqeel-components.css
product-contract/sessions/LAST_SESSION.md
```

</details>

## `stash@{1}` — 1 tracked files

| | |
|---|---|
| commit | `346988d54a68272dc404de21062c6bee51e69682` |
| base | `370a758d` (on main: yes) |
| message | On revamp: orchestrator preserve revamp audit before shared recovery |

<details><summary>Files</summary>

```
.project-memory/audit/tool_events.jsonl
```

</details>

## `stash@{2}` — 59 tracked files

| | |
|---|---|
| commit | `7709d4528e4c1f1f7278b0ef67f8aba2b844aceb` |
| base | `370a758d` (on main: yes) |
| message | On codex/menu-e2e-completion-20260727: WIP codex/menu-e2e-completion-20260727 before checkout main |

<details><summary>Files</summary>

```
.project-memory/audit/instructions_loaded.jsonl
.project-memory/audit/tool_events.jsonl
apps/web/src/app/(app)/admin/bulk-violations/BulkViolationForm.tsx
apps/web/src/app/(app)/admin/bulk-violations/actions.ts
apps/web/src/app/(app)/admin/bulk-violations/page.tsx
apps/web/src/app/(app)/admin/compliance-approvals/error.tsx
apps/web/src/app/(app)/admin/compliance-approvals/loading.tsx
apps/web/src/app/(app)/admin/compliance-approvals/page.tsx
apps/web/src/app/(app)/admin/enforcement-recommendations/DecideForm.tsx
apps/web/src/app/(app)/admin/enforcement-recommendations/actions.ts
apps/web/src/app/(app)/admin/enforcement-recommendations/page.tsx
apps/web/src/app/(app)/admin/mvp3-actions.ts
apps/web/src/app/(app)/admin/regulations/Controls.tsx
apps/web/src/app/(app)/admin/regulations/RegulationDetail.tsx
apps/web/src/app/(app)/admin/regulations/actions.ts
apps/web/src/app/(app)/admin/regulations/page.tsx
apps/web/src/app/(app)/admin/violations/Controls.tsx
apps/web/src/app/(app)/admin/violations/actions.ts
apps/web/src/app/(app)/admin/violations/page.tsx
apps/web/src/app/(app)/admin/workflows/sla-actions.ts
apps/web/src/app/(app)/admin/workflows/task-actions.ts
apps/web/src/app/(app)/analytics/page.tsx
apps/web/src/app/(app)/dashboard/DashboardView.tsx
apps/web/src/app/(app)/dashboard/RevampOperationalView.tsx
apps/web/src/app/(app)/dashboard/RevampStrategicView.tsx
apps/web/src/app/(app)/dashboard/dashboard-format.ts
apps/web/src/app/(app)/dashboard/metrics.ts
apps/web/src/app/(app)/dashboard/page.tsx
apps/web/src/app/(app)/dashboard/revamp-dashboard.module.css
apps/web/src/app/(app)/enforcement/EnforcementDecisionForm.tsx
apps/web/src/app/(app)/enforcement/EnforcementLibrary.tsx
apps/web/src/app/(app)/enforcement/actions.ts
apps/web/src/app/(app)/enforcement/page.tsx
apps/web/src/app/(app)/enforcement/responsive.module.css
apps/web/src/app/(app)/execution/RevampExecutionWorkspace.tsx
apps/web/src/app/(app)/execution/page.tsx
apps/web/src/app/(app)/factories/RevampFactory360Portfolio.tsx
apps/web/src/app/(app)/factories/[id]/page.tsx
apps/web/src/app/(app)/factories/cr/[id]/page.tsx
apps/web/src/app/(app)/factories/page.tsx
apps/web/src/app/(app)/operations/OpsExport.tsx
apps/web/src/app/(app)/operations/RevampOperationsCenter.tsx
apps/web/src/app/(app)/operations/actions.ts
apps/web/src/app/(app)/operations/operations.module.css
apps/web/src/app/(app)/operations/page.tsx
apps/web/src/app/(app)/planning/bulk/actions.ts
apps/web/src/app/(app)/planning/page.tsx
apps/web/src/app/(app)/planning/plans/[id]/page.tsx
apps/web/src/app/(app)/planning/plans/page.tsx
apps/web/src/app/(app)/reviews/[id]/DecisionPanel.tsx
apps/web/src/app/(app)/reviews/[id]/VersionCompare.tsx
apps/web/src/app/(app)/reviews/[id]/actions.ts
apps/web/src/app/(app)/reviews/[id]/page.tsx
apps/web/src/app/(app)/reviews/page.tsx
apps/web/src/app/(app)/visits/VisitsBoard.tsx
apps/web/src/app/(app)/visits/actions.ts
apps/web/src/app/(app)/visits/page.tsx
apps/web/src/lib/dashboard-kpi/projection.ts
apps/web/src/lib/dashboard-kpi/registry.ts
```

</details>

## `stash@{3}` — 76 tracked files

| | |
|---|---|
| commit | `47dd2ef027b9595055607f1ef9f439448dfff0fa` |
| base | `060d660a` (on main: yes) |
| message | On revamp/foundation-shell: handoff: isolate shell-f0 typography collision 2026-07-27T03:43+03:00 |

<details><summary>Files</summary>

```
apps/web/DELTAS-field.md
apps/web/SAQEEL-CORRECTION-PROGRESS.md
apps/web/e2e-manual/verify-briefing.mjs
apps/web/e2e/cd-029-review-workspace.spec.ts
apps/web/e2e/cd-031-factory-360.spec.ts
apps/web/e2e/compliance-shared-shell.spec.ts
apps/web/e2e/design-foundation-contract.spec.ts
apps/web/e2e/field-a11y-hardening.spec.ts
apps/web/e2e/golden-journey.spec.ts
apps/web/e2e/inspector-shell-uplift.spec.ts
apps/web/e2e/inspector-shell-visual.spec.ts
apps/web/e2e/perf/benchmark.mjs
apps/web/e2e/platform-design-system-contract.spec.ts
apps/web/e2e/saqeel-login-revamp.spec.ts
apps/web/e2e/shell-navigation.spec.ts
apps/web/e2e/ui-compliance-contract.spec.ts
apps/web/e2e/ui-compliance-runtime.spec.ts
apps/web/e2e/web-admin-f0-foundation.spec.ts
apps/web/e2e/web-admin-m2-batch-002.spec.ts
apps/web/public/saqeel-wordmark-dark-mode.svg
apps/web/public/saqeel-wordmark-dark.svg
apps/web/public/saqeel-wordmark-light-mode.svg
apps/web/public/saqeel-wordmark-light.svg
apps/web/src/app/(app)/admin/_components/AdminDestinationFrame.module.css
apps/web/src/app/(app)/admin/bulk-violations/page.tsx
apps/web/src/app/(app)/admin/enforcement-recommendations/page.tsx
apps/web/src/app/(app)/admin/localization/localization.module.css
apps/web/src/app/(app)/admin/violations/page.tsx
apps/web/src/app/(app)/dashboard/dashboard.module.css
apps/web/src/app/(app)/dashboard/revamp-dashboard.module.css
apps/web/src/app/(app)/enforcement/EnforcementLibrary.tsx
apps/web/src/app/(app)/enforcement/page.tsx
apps/web/src/app/(app)/field/[visitId]/startup.module.css
apps/web/src/app/(app)/field/[visitId]/travel/TravelClient.tsx
apps/web/src/app/(app)/field/establishments/page.tsx
apps/web/src/app/(app)/field/factory-360/[id]/Factory360Offline.tsx
apps/web/src/app/(app)/field/field-dashboard.module.css
apps/web/src/app/(app)/field/inspection/[id]/Workspace.tsx
apps/web/src/app/(app)/field/inspection/[id]/workspace.module.css
apps/web/src/app/(app)/operations/operations.module.css
apps/web/src/app/(app)/operations/page.tsx
apps/web/src/app/(app)/planning/PlanningPreview.module.css
apps/web/src/app/(app)/planning/PlanningPreview.tsx
apps/web/src/app/(app)/planning/bulk/review/review.css
apps/web/src/app/(app)/planning/page.tsx
apps/web/src/app/(app)/reviews/responsive.module.css
apps/web/src/app/(app)/virtual/page.tsx
apps/web/src/app/(app)/visits/[id]/VisitDetail.module.css
apps/web/src/app/(app)/visits/[id]/page.tsx
apps/web/src/app/(app)/visits/page.tsx
apps/web/src/app/BrandMark.tsx
apps/web/src/app/astryx.css
apps/web/src/app/layout.tsx
apps/web/src/app/saqeel-components-legacy.css
apps/web/src/app/saqeel-components.css
apps/web/src/app/tokens.css
apps/web/src/components/FieldTabs.tsx
apps/web/src/components/GeoMap.tsx
apps/web/src/components/NotificationBell.tsx
apps/web/src/components/ShellClient.tsx
apps/web/src/components/admin/admin-shell.module.css
apps/web/src/components/charts/BarChart.tsx
apps/web/src/components/charts/DonutChart.tsx
apps/web/src/components/charts/LineChart.tsx
apps/web/src/components/field/FieldConnectivityBanner.tsx
apps/web/src/components/field/FieldFullMap.tsx
apps/web/src/components/field/FieldHome.tsx
apps/web/src/components/field/FieldNav.tsx
apps/web/src/components/field/FieldScopeToggle.tsx
apps/web/src/fonts/jetbrains-mono/jetbrains-mono-latin-400.woff2
apps/web/src/fonts/jetbrains-mono/jetbrains-mono-latin-500.woff2
apps/web/src/fonts/jetbrains-mono/jetbrains-mono-latin-700.woff2
apps/web/src/fonts/space-grotesk/space-grotesk-latin-400.woff2
apps/web/src/fonts/space-grotesk/space-grotesk-latin-500.woff2
apps/web/src/fonts/space-grotesk/space-grotesk-latin-600.woff2
apps/web/src/fonts/space-grotesk/space-grotesk-latin-700.woff2
```

</details>

## `stash@{4}` — 7 tracked files

| | |
|---|---|
| commit | `0e490e1ad8df86e2a717207c4fb16b1c628b014b` |
| base | `5ed41408` (on main: NO) |
| message | On main: session-audit-noise |

<details><summary>Files</summary>

```
.project-memory/audit/compactions.jsonl
.project-memory/audit/config_changes.jsonl
.project-memory/audit/instructions_loaded.jsonl
.project-memory/audit/session_end.jsonl
.project-memory/audit/tool_events.jsonl
product-contract/sessions/COMPACTION_CHECKPOINT.md
product-contract/sessions/LAST_SESSION.md
```

</details>

## `stash@{5}` — 36 tracked files

| | |
|---|---|
| commit | `50bc4b104d27b44df70ba900d8d7ff38dede05d2` |
| base | `b4be3118` (on main: yes) |
| message | On feat/saqeel-shell-rail-profile-switch: pre-existing dirty tree from other sessions, stashed before saqeel/operations merge |

<details><summary>Files</summary>

```
.claude/skills/orchestrator/references/RESOURCES.md
.claude/skills/orchestrator/scripts/brief.py
.project-memory/audit/config_changes.jsonl
.project-memory/audit/instructions_loaded.jsonl
.project-memory/audit/session_end.jsonl
.project-memory/audit/tool_events.jsonl
.saqeel/drive-card.sh
apps/web/e2e/field-offline-isolation.spec.ts
apps/web/e2e/field-offline-runtime.spec.ts
apps/web/e2e/offline-drill.spec.ts
apps/web/e2e/personas.ts
apps/web/package-lock.json
apps/web/package.json
apps/web/src/app/(app)/admin/regulations/RouteContract.tsx
apps/web/src/app/(app)/admin/regulations/m6-library.module.css
apps/web/src/app/(app)/admin/templates/form-builder.module.css
apps/web/src/app/(app)/admin/workflows/WfDeck.tsx
apps/web/src/app/(app)/admin/workflows/page.tsx
apps/web/src/app/(app)/admin/workflows/workflow-builder.module.css
apps/web/src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx
apps/web/src/app/(app)/field/my-tasks/PrepareAssignmentAction.tsx
apps/web/src/app/(app)/field/my-tasks/my-tasks.module.css
apps/web/src/app/(app)/field/my-tasks/page.tsx
apps/web/src/app/(app)/field/reports/page.tsx
apps/web/src/app/(app)/field/reports/reports.module.css
apps/web/src/app/(app)/field/virtual/[id]/VirtualSessionClient.tsx
apps/web/src/app/(app)/field/virtual/virtual.module.css
apps/web/src/app/astryx.css
apps/web/src/app/reports/catalogue.ts
apps/web/src/app/reports/surfaces.css
apps/web/src/components/GeoMap.tsx
apps/web/src/components/field/SamplesSection.tsx
apps/web/src/components/field/SeizureSection.tsx
apps/web/src/components/field/samplesSeizureStrings.ts
product-contract/governance/CC-SHELL-TABLET-001.yaml
product-contract/sessions/LAST_SESSION.md
```

</details>


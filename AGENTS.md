# MIM Inspection Platform - Project Authority

## Mission
Build the MVP1 Inspection Platform exactly from the versioned product contract. Do not rediscover, reinterpret, weaken, or expand scope without documented change control.

## Source of truth
Read these files in order at every session start:
1. `product-contract/00_START_HERE.md`
2. `product-contract/CURRENT_STATE.md`
3. `product-contract/GATE_STATUS.md`
4. `product-contract/execution/CURRENT_SLICE.yaml`
5. `product-contract/execution/TASK_ROUTER.yaml`
6. `product-contract/governance/OPEN_DECISIONS.yaml`
7. `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`
8. `product-contract/operationalization/coordination/TWO_HOUR_CONTROL_CYCLE.yaml`
9. `product-contract/state/CONTROL_BOARD.md`
10. The active packet and task-specific files listed in the current slice.

## Repository location — fail fast

The authoritative repository is identified by **remote identity, not by absolute
path**. Contributors work on different machines under different home directories,
so a hardcoded path cannot be the test.

- A checkout is authoritative when `git remote get-url origin` resolves to the
  canonical remote `github.com/Vikram-Indla/Inspection` (either scheme:
  `https://github.com/Vikram-Indla/Inspection.git` or
  `git@github.com:Vikram-Indla/Inspection.git`).
- Vikram's authoritative clone is `/Users/vikramindla/Developer/Inspection`.
  Jahanara's is `/Users/jahanarakhan/inspection latest`. Both are equally
  authoritative; neither path is the rule. Use **your own** machine's clone.
- `/Users/vikramindla/Documents/GitHub/Inspection` is retired and prohibited: never read it, write it, cite it, use it as a command working directory, load skills or instructions from it, or use artifacts discovered there.
- Before the first project-related tool call, resolve and report the current working directory, the repository top level, and the origin remote. The top level must be your machine's authoritative clone, or a specifically authorized worktree of it (see below).
- If the session starts in, exposes, or supplies instructions from the retired path, stop before project work. Do not compensate by passing canonical absolute paths while leaving tool calls rooted in the retired checkout. Relaunch or re-root the session at the canonical repository.
- Browser work does not relax this rule. Runtime inspection, evidence capture, source reads, skills, scripts, and output creation must all be attributable to the canonical repository.
- Never claim the retired checkout was excluded unless no tool, skill, source, working directory, or artifact from it was accessed during the session.

### Authorized worktrees — standing authorization
Any Git worktree whose common directory resolves to the `.git` of **your own machine's
authoritative clone** is a **specifically authorized worktree**, and is a valid working directory
for a delivery session. This is machine-relative on purpose — it holds on every contributor's
laptop, not just one. Verify with:

```
git rev-parse --git-common-dir      # must resolve inside your authoritative clone's .git
git rev-parse --show-toplevel       # your worktree root
git remote get-url origin           # must be the canonical Vikram-Indla/Inspection remote
```

If the common directory resolves into a clone whose origin is the canonical remote, you are
correctly rooted — do not stop, and do not demand relaunch in the main checkout. If origin is not
the canonical remote, or the path is the retired
`/Users/vikramindla/Documents/GitHub/Inspection`, stop as the rule above requires.

The canonical checkout is a **shared** working tree: several actors read it concurrently, and a
`git checkout` there changes the branch under every one of them. A session holding a write lease
must therefore work in its own worktree, created from the canonical repository, rather than
switching branches in the shared checkout:

```
git -C <your-authoritative-clone> worktree add -b <branch> <path> main
cd <path>
```

Worktrees are cheap, and they are what makes concurrent card delivery safe. Sharing one checkout
between two write-leased sessions is the failure this authorization exists to prevent.

## Hard rules
- Broad implementation is blocked until G8 is PASS.
- The 478 source requirements remain mandatory MVP1.
- A Phase 2 AI note defers only that AI sub-capability, never its parent requirement.
- Never invent policy values, providers, thresholds, SLAs, legal rules, risk weights, geofence values, retention, or Arabic scope.
- Never mark a page or component complete without runtime behavior, data, audit, negative paths, tests, and evidence.
- Never mutate workflow status directly; use canonical transitions and guards.
- Never edit an immutable submitted version.
- Never silently overwrite offline/server conflicts.
- Never replace an unavailable integration with a permanent mock and claim completion.
- Never remove or weaken an accepted requirement, field, rule, permission, state, audit event, offline behavior, or usability outcome.
- Do not push, merge, or modify `main` without explicit human approval.
- Do not edit frozen product-contract artifacts without an approved change-control task.
- ChatGPT owns packet authoring and queue sequence. Codex owns safety, leases,
  severity, browser acceptance and merge gating. Neither may hold a
  product-code write lease.

## Work protocol
Before work:
- State the task ID, process IDs, requirement IDs, acceptance IDs, screens, engines, dependencies, open decisions, and do-not-touch areas.
- Confirm the current Git branch and working tree.
- Stop if the current task conflicts with the product contract.

During work:
- Implement the smallest coherent vertical slice.
- Keep IDs in code, tests, evidence, and session records.
- Record every approved assumption in the decision register.

Before completion:
- Run required tests and negative paths.
- Capture the evidence named in the current slice.
- Update `CURRENT_STATE.md`, `SESSION_LEDGER.json`, `WORK_QUEUE.yaml`, and acceptance/evidence records.
- Do not declare completion while any required P0/P1 criterion is failed or unevidenced.

## Board delivery — the orchestrator procedure
When the work is a card on the 55-card board in `status/saqeel-status.json`, the
delivery procedure is `.claude/skills/orchestrator/`. Read `SKILL.md` and the
three files in `references/` before starting. It is plain markdown and two Python
scripts — nothing in it is specific to the CLI that reads it.

- `scripts/brief.py <card-id>` prints the card, its design page, its route files,
  its requirement-baseline rows and the git state. Run it first.
- `scripts/board.py` is the only way to move a lane number. It refuses a raise
  without `--evidence` and refuses any card on a channel you do not own.
- `config.json` declares channel ownership: `web` → Claude Code, `admin` → Codex,
  `pwa` → a different developer. Only the Product Owner changes it.

Codex normally receives a packet for an `admin` card from Claude Code rather than
running the whole procedure — that split is what keeps the verifier independent
of the builder. Running both roles yourself removes that check; do it only when
the Product Owner asks.

The MCP tool names in the procedure (`mcp__claude-design__*`,
`mcp__claude-in-chrome__*`) are Claude Code's. Substitute your own equivalents or
hand those steps back; do not skip the gate they serve.

## Memory policy
- Git-backed files are authoritative.
- Obsidian is a human interface over the same repository, not a separate copy.
- Codex auto memory is advisory only and may never override the product contract.
- `Codex.local.md` is personal and must not contain shared scope decisions.
- Read `docs/SAQEEL_COLLABORATION_OPERATING_AGREEMENT.md` before a user-led
  product review. It records the agreed working cadence and communication
  protocol; it never overrides the product contract or governed decisions.

## Documentation storage
- Human-readable master documents and binary evidence are stored under `INSPECTION_DOCS_ROOT`; Vikram's approved local root is `/Users/vikramindla/Desktop/Inspection Documentation`.
- Read `docs/README.md` and `docs/DOCUMENTATION_STORAGE_POLICY.md` before adding documentation or evidence.
- Do not recommit external BRDs, workbooks, PDFs, storyboards, screenshots, videos, archives, or packaged handoff exports.
- Keep the live product contract, Claude continuity controls, machine-readable acceptance/wiring maps, and code-ready design authority in Git.

## Design policy
- Figma golden screens and tokens become authoritative only after G6 approval.
- Mobbin is for pattern research and provenance, never direct copying.
- The iPad is a field application, not a reduced web portal.
- Admin engines are control planes, not simple CRUD screens.
- For MVP1 UX work, begin at `design/claude-design-mvp1/00_START_HERE.md` and follow its authority, journey prompts, special-component contracts, and design acceptance matrices.
- Claude Design produces code-ready design outputs only; application edits begin only after the relevant design acceptance rows receive human signoff.

## Gate position
G0-G9 PASS (G1 conditional; G8 sponsor-authorized 2026-07-11; G9 build completion 2026-07-12). G10 verification is in progress with the Playwright headless suite as the exit criterion. G11 hardening and G12 release are open. Broad implementation is authorized. `product-contract/GATE_STATUS.md` is the authoritative gate record.

## PWA lane exception (maintainer-approved)
The PWA / field channel is an independent slice. Any agent editing ONLY
apps/web/src/app/(app)/field/**, apps/web/src/components/field/**,
apps/web/src/lib/providers/ocr-gemini.ts, status/saqeel-status.json, and
designs/** does NOT require a global lease and is
NOT bound by the CURRENT_SLICE / lease / single-slice gate. Retired paths remain
prohibited; no push or merge to main. Owner: khan.jahanara@ (partner laptop).
Approved-by: Vikram Indla <vikramataol@gmail.com>

Test-harness extension (2026-07-26): the same lane also covers `apps/web/e2e/**`, and `apps/web/playwright.config.ts` plus `apps/web/package.json` for test-script entries ONLY. This exists so the channel can be MEASURED rather than asserted: it closes BS-1 (no automated pixel diff, so design scores are judgement not measurement) and BS-7 (spec pass/fail never surfaced, so wired is not verified). It grants no new application-source access: apps/web/src/** outside the field paths above remains out of scope, and no other rule is relaxed.


---

# Saqeel design implementation rules — non-negotiable

The approved design is `design/final-cut/saqeel-revamp.html`. Open it in a browser and inspect it.
Do not work from screenshots or from prose descriptions of it.

The design is styled entirely with classes and tokens that ALREADY EXIST in
`apps/web/src/app/`. Nothing was invented. Your job is markup and wiring, **not styling**.

1. **NO NEW CSS.** Do not write a new class, a new CSS file, a styled-component, a Tailwind
   utility, or a `style={{ }}` prop. Every element must render with a class that already exists
   in `apps/web/src/app/saqeel-components.css`.

2. **NO NEW TOKENS.** Use `var(--surface-*)`, `var(--text-*)`, `var(--action-*)`,
   `var(--status-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`. Never a raw hex,
   `rgb()`, px font size, or px radius. If a value looks bespoke, it is a token you have not
   found yet.

3. **IF A CLASS IS MISSING, STOP.** Do not style the page locally to work around it. Report the
   gap. A missing class is a design-system change request, not a page-level fix.

4. **COPY THE MARKUP STRUCTURE.** Element order, nesting depth, and class names in the design are
   the contract. If the design has `div.panel > div (header) > span + span`, produce the same.

5. **NO ASTRYX.** No `ax-` class, `ax-` token, or `astryx.css` import. Zero references.

6. **STATUS IS TEXT PLUS SHAPE, NEVER COLOUR ALONE.** Every status renders as a `.badge` with a
   text label. Never replace one with a coloured dot.

7. **RTL VIA LOGICAL PROPERTIES ONLY.** `padding-inline`, `margin-inline-start`,
   `inset-inline-start`, `border-inline-end`. Never `left`/`right`. Never a `[dir="rtl"]`
   override that flips a value.

8. **ARABIC LIVES IN i18n RESOURCES.** The design carries ~725 approved Arabic strings; they move
   into the repo's i18n layer, not into components. Never translate inside a component.

9. **ROUTES ARE FIXED.** `/dashboard` `/operations` `/factory-360` `/planning` `/execution`
   `/reviews` `/compliance` `/compliance/approvals` `/enforcement-library` `/analytics`
   `/admin/*`. Do not rename, add, or nest. Tabs and filters are query state, never subroutes.

10. **NEVER INVENT A GOVERNED VALUE.** No risk weight, penalty amount, SLA, threshold, or approval
    rule. Absent data renders as a state: *Not configured* / *Unavailable* / *Insufficient
    evidence*.

## Before writing code for any screen

1. Open `design/final-cut/saqeel-revamp.html` and navigate to that screen.
2. For each region, list the elements and the CLASS each one uses.
3. Show that list and STOP for confirmation.

Only then implement, using those classes only.

## Reference

- `docs/design/HANDOFF.md` — route contracts, states, RBAC, per-screen detail
- `docs/design/FINAL-CUT-REVIEW.md` — every visual decision and its reasoning
- `docs/design/IMPLEMENTATION-RULES.md` — verification commands and implementation order

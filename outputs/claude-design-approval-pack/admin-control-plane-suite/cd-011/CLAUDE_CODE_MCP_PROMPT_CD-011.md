# CLAUDE_CODE_MCP_PROMPT_CD-011 — Penalty Mapping (SCR-ADM-041)

> **NOT EXECUTABLE — SPONSOR DESIGN APPROVAL, INDEPENDENT WIRING AUDIT, EXPLICIT IMPLEMENTATION AUTHORIZATION, AND A CLEAN DEDICATED WORKTREE ARE REQUIRED.**
> Paste this into Claude Code (MCP session) only after all four gates are satisfied. Until then it is a handoff artefact. If any precondition is unmet, STOP and report which one.

---

## 0. MCP / session setup

- Operate through the connected repository MCP server (filesystem + git tools) on the Saqeel `apps/web` project.
- Assign a **clean dedicated worktree** on a non-`main` branch: `feat/cd-011-penalty-mapping`. Never edit `main`. Never discard unrelated dirty work — record `git status` before and after.
- Read-only first: do NOT write any application file until Section 6 preconditions are all confirmed. This screen is the most schema-blocked in the Admin suite; most legs are `HANDOFF_BLOCKED` pending a fresh repository read.

## 1. Identity

- Screen: **CD-011 / SCR-ADM-041 — Penalty Mapping**
- Route/mode: `/admin/violations` (penalty mode — no new URL)
- Personas: Compliance Admin; Approver
- Journey: `P00` · Engines: `ENG-08`, `ENG-12`
- Design source of truth: `CD-011 Penalty Mapping.dc.html` (selected hypothesis A — three-column relationship workspace; signature = Conflict Lens)

## 2. Read first (in order) — via MCP, do not edit

1. `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-011/IMPLEMENTATION_MANIFEST_CD-011.yaml` — confirm `implementation_authorized: true` (flipped by sponsor). If still `false`, STOP.
2. The approved design file `CD-011 Penalty Mapping.dc.html` (frames be/bf/bg/bh/bi/bj/bt/bs/bo).
3. `DATA_TRUTH_LEDGER` intent + `WIRING_MAP_CD-011.csv` (every row is `HANDOFF_BLOCKED` except the `violation_codes` read).
4. `COMPONENT_MAP_CD-011.csv`, `ACCEPTANCE_CHECKLIST_CD-011.md`, `CLAUDE_CODE_HANDOFF_CD-011.md`, `RESEARCH_LEDGER_CD-011.csv`.
5. Repository truth: `AGENTS.md`, `apps/web/src/app/admin/violations/{page.tsx,Controls.tsx,actions.ts}`, `apps/web/src/components/Shell.tsx`, `apps/web/src/lib/shell-navigation.ts`, `apps/web/src/lib/i18n.ts` + `ui_strings`, `apps/web/src/app/{tokens.css,astryx.css}`, and the `penalty_mappings` + `violation_codes` migrations/schema.

Record branch, commit, dirty-worktree state.

## 3. Mandatory pre-work: resolve the schema (this screen cannot proceed without it)

The design was produced WITHOUT a fresh read of `penalty_mappings`. Before writing any UI, confirm from the live schema and record each in a `SCHEMA_CONFIRMATION_CD-011.md`:

- `penalty_mappings` columns: violation FK, penalty record ref, range, repeat rule, cardinality, legal-basis ref, version, effective-period start/end, status enum.
- Whether overlap / gap / cardinality / repeat-escalation detection exists server-side or must be built.
- Whether a **penalty-specific** distinct-approver (maker-checker) workflow exists (the package_versions approver rule does NOT automatically apply here).

For every field/behavior the schema does NOT confirm, keep it `HANDOFF_BLOCKED` and STOP rather than invent it.

## 4. Scope (only after Section 3 confirms the schema)

Implement penalty mode inside the existing `/admin/violations` route:

- **Three-column workspace** (`page.tsx`): violation selector (left, from `violation_codes`) · Conflict Lens (center) · penalty record (right). Columns stack top→bottom at 1024px; no horizontal scroll.
- **Conflict Lens** (signature): render overlap/gap/cardinality/repeat conflicts as labelled facts + an overlap **timeline with a text equivalent** (never a color-only cell). Examples must be **configuration-derived** — never fabricate monetary values or legal rules.
- **Legal-basis band** above the mapping controls (provenance outranks controls); missing legal basis blocks publish.
- **Validate / publish** (`Controls.tsx` → `actions.ts`): publish gated by zero conflicts + present legal basis + a distinct approver. Author cannot approve own mapping.
- Localization via `ui_strings` rows (data change), not `i18n.ts` code. Arabic-first `lang="ar" dir="rtl"`.

## 5. Hard prohibitions

- No edits to the frozen shell (`Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `astryx.css` global rules) or `tokens.css`.
- Never invent monetary values, penalty amounts, or legal rules — config-reference placeholders only.
- Never present the penalty approver workflow as working unless Section 3 confirmed it.
- No `git commit`/`push`/`merge`/deploy or `main` modification unless separately authorized; preserve the dirty worktree.
- STOP rather than invent any table, RPC, policy, provider, transition, or side effect.

## 6. Preconditions checklist (all must be TRUE before writing code)

- [ ] `implementation_authorized: true` in the manifest
- [ ] Sponsor design approval on CD-011 recorded
- [ ] Independent Codex wiring audit passed
- [ ] Clean `feat/cd-011-penalty-mapping` worktree assigned
- [ ] `penalty_mappings` schema + approver workflow confirmed (Section 3)

## 7. Required evidence before claiming VERTICAL_SLICE_PASS

Per the wiring map, each user action → client component → server action → validation/guard → canonical transition → table/RPC → RLS/role → audit event → success + negative/partial-failure result → automated test → runtime evidence. Prove: a real `penalty_mappings` record; overlap/gap/cardinality validations firing; missing-legal-basis blocking publish; author-cannot-approve negative path; published mapping immutability; Arabic RTL + dark/light + 1024 screenshots of the same state; keyboard + screen-reader operation (Conflict Lens timeline text equivalent announced); regression suite green. Report the resulting diff **path by path**. Report gaps as gaps — never as done.

## 8. Return

Finish with the diff summary, the evidence per Section 7, and the status line — `VERTICAL_SLICE_PASS` only if all evidence exists, otherwise `HANDOFF_BLOCKED` with the exact missing leg. Never self-approve.

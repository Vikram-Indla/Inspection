# Saqeel Admin Control Plane — Transfer Pack

## Current position

- **Lane:** `TASK-DESIGN-ADMIN-SUITE-001` — Admin Control Plane Suite only
- **Admin sequence:** `CD-004` through `CD-019`
- **Active item:** `CD-004 — Admin Control Plane Home` (`SCR-ADM-001`, `/admin`)
- **Current verdict:** `FAIL — CORRECTION_REQUIRED` after R2 independent review
- **Next allowed work:** the narrow R2 → R2B correction only
- **Implementation authorization:** **not granted**
- **CD-005 and later Admin CDs:** **blocked**

The selected design direction is **Configuration Evidence Spine**. Preserve it. The R2 interactive source is visually strong and should not be redesigned; the outstanding work is limited to evidence exports, exact data-truth fields, exact implementation-path handoff, and research-source ID mapping.

## Read in this order

1. `AGENTS.md`
2. `authoritative-project-contract/00_START_HERE.md`
3. `authoritative-project-contract/CURRENT_STATE.md`
4. `authoritative-project-contract/GATE_STATUS.md`
5. `authoritative-project-contract/execution/CURRENT_SLICE.yaml`
6. `authoritative-project-contract/execution/TASK_ROUTER.yaml`
7. `authoritative-project-contract/governance/OPEN_DECISIONS.yaml`
8. `admin-design-lane/PARALLEL_OWNERSHIP.yaml`
9. `admin-design-lane/ADMIN_STATUS.yaml`
10. `admin-design-lane/ADMIN_MASTER_FOUNDATION_V1.md`
11. `admin-design-lane/ADMIN_QUALITY_GATE_V1.md`
12. `admin-design-lane/CD-004_DESIGN_REVIEW_R2.md`
13. `admin-design-lane/CHAPTER_01_CD-004_CLAUDE_DESIGN_CORRECTION_PROMPT_R2.md`

## Use these assets

- `interactive-design-sources/` — the R1 and R2 interactive design sources.
- `received-design-returns/cd-004-r1/` — the original CD-004 return package.
- `received-design-returns/cd-004-r2/` — the R2 return package that was reviewed and failed.
- `runtime-snapshot/` — read-only Admin route, shell, localization, and migration evidence used for the reviews.
- `design-authority/` — project design authority and acceptance context.
- `authoritative-project-contract/` — full versioned contract snapshot; it is authoritative over this transfer pack if it conflicts with it.

## Non-negotiable boundaries

- Do not implement application code, database/RLS changes, routes, migrations, or global product-contract changes.
- Write Admin design artifacts only under `outputs/claude-design-approval-pack/admin-control-plane-suite/**` in the receiving workspace.
- Do not change the frozen shared shell, invent policy/authorization/provider values, or treat a UI guard as enforcement.
- Do not begin CD-005 until CD-004 obtains a passing independent R2B review and the required sponsor decision.
- Do not claim sponsor approval or implementation readiness.

## Exact resume prompt

```text
Continue only TASK-DESIGN-ADMIN-SUITE-001, CD-004 — Admin Control Plane Home (SCR-ADM-001, /admin).

Read START_HERE.md, AGENTS.md, the product-contract read order, PARALLEL_OWNERSHIP.yaml, ADMIN_STATUS.yaml, CD-004_DESIGN_REVIEW_R2.md, and CHAPTER_01_CD-004_CLAUDE_DESIGN_CORRECTION_PROMPT_R2.md before acting.

The selected Configuration Evidence Spine and the R2 interactive source are retained. Run only the R2 → R2B evidence-and-handoff correction. Regenerate native, standalone evidence exports; correct the data-truth ledger against the actual schema; make implementation paths/localization ownership deterministic; and repair the prescribed research-ID mapping.

Do not implement, modify global contract files, begin CD-005, claim sponsor approval, or mark implementation authorized. Return the corrected CD-004 R2B package ending exactly READY_FOR_MANDATORY_R2B_REVIEW.
```


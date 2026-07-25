# DRAFT — AGENTS.md partner-workstation path clause

**Status: DRAFT. Not applied. Must be reviewed and committed by Vikram (maintainer), not by an agent.**

Why the provenance matters: Codex has twice refused an agent-authored governance
exception, and it is right to. Its own words — *"I cannot approve my own governance
exception or treat a user-added block as documented change control. An authorized
maintainer must approve and land the exception through the project's change-control
process."* An agent writing itself permission is not change control, regardless of
whether the content is correct. This file is a proposal for a maintainer to accept
or reject.

---

## What this fixes (and what it does not)

The existing `PWA lane exception` commit (`71132fbc`, on the local-only branch) grants a
**lease** exception. That is not what blocks Codex. Codex refuses on the **repository
path** check at `AGENTS.md:20-22`:

> "`/Users/jahanarakhan/inspection latest` is not the canonical repository."

Two different gates. The lease clause does not mention the path, so it cannot unblock
Codex. The clause below targets the path gate specifically.

---

## Proposed edit — insert into the `## Repository location — fail fast` section

Insert as a new bullet, immediately after the "Before the first project-related tool
call…" bullet (currently `AGENTS.md:22`). Nothing else in the section changes.

```markdown
- Authorized partner workstation — PWA/field channel only. `/Users/jahanarakhan/inspection latest` is an authorized repository location for the Inspector iPad / field channel, granted by the repository owner on 2026-07-25. It is a separate clone (its own Git common directory), not a worktree of the canonical repository, and it is authorized only for work whose edits fall entirely within `apps/web/src/app/(app)/field/**`, `apps/web/src/components/field/**`, `apps/web/src/lib/providers/ocr-gemini.ts`, `status/saqeel-status.json`, and `designs/**`. Agents on this workstation must resolve and report their working directory and repository top level exactly as required above; both must equal that path. All other rules in this file — including the prohibition on `/Users/vikramindla/Documents/GitHub/Inspection`, the no-push/no-merge/no-`main` rule, frozen product-contract artifacts, and zero-assumption data rendering — continue to apply without relaxation. Any edit outside the paths listed here is out of scope for this workstation and requires the canonical repository.
```

---

## Grounds (why this is consistent with the contract, not a carve-out against it)

The path clause records a boundary the contract already draws elsewhere:

1. `product-contract/web-admin-phase1/PHASE2_IPAD_DEFERRED_REGISTER.md` — for `/field/**`,
   *"Phase 2 owner: Inspector iPad / field application. Phase 1 ownership: None."* The
   register forbids the Phase 1 Web/Admin lane from owning `/field/**`; it does not defer
   the channel out of existence.
2. `product-contract/state/leases/README.md` — *"the shared origin checkout was observed
   running concurrent Codex/Claude iPad worktrees … Those are NOT under V5 lease
   governance until the sponsor signs the adoption CC."*
3. `product-contract/state/CONTROL_BOARD.md` — same statement about non-V5 iPad worktrees.
4. `REQUIREMENT_BASELINE.csv` — the 238 `PHASE2_IPAD_DEFERRED` rows are this channel's
   requirement set, all with `target_routes` `/field/**`.
5. `CURRENT_SLICE.yaml` (`PKT-M3-OPS-LIVE-001`) is the Web/Admin lane's lease, held on
   `/Users/vikramindla/Developer/Inspection-codex-m3-operations`. Its
   `do_not_touch: /field/**` steers that lane away from field; it is not a freeze on the
   field channel.

## Deliberately narrow

- Path-scoped: one named directory. Does not weaken the retired-path prohibition.
- File-scoped: only field-channel paths. Web/Admin remains unreachable from here.
- Does not grant a lease, does not amend `CURRENT_SLICE`, does not touch the gate model.
- Revocable by deleting the bullet.

---

## To apply (maintainer runs this — an agent must not)

Review the wording, then:

1. Open `AGENTS.md`, paste the bullet after line 22.
2. Commit it yourself:

```
git add AGENTS.md && git commit -m "docs(agents): authorize partner workstation for the PWA/field channel

Grants /Users/jahanarakhan/inspection latest as an authorized repository
location, scoped to field-channel paths only. Consistent with
PHASE2_IPAD_DEFERRED_REGISTER (field = Phase 2 iPad-owned) and
state/leases/README.md (iPad worktrees not under V5 governance).
No other rule relaxed; retired-path prohibition unchanged.

Approved-by: Vikram Indla"
```

The superseded `PWA lane exception` block from `71132fbc` should be dropped rather than
carried forward — it targets the wrong gate and its provenance is an agent commit.

# 2026-08-08 · WEB-012 — never modify the DOM directly

`task: ad-hoc (owner-requested rulebook change)` · `status: done` · `duration: ~20m`
`rules applied: governance`

---

## Goal

Add one more hard, never-to-drift binding rule: application code never modifies
the DOM directly. Encode it as a first-class rule and thread it into every place
that enumerates the non-negotiables.

## What changed

| File | Action | Change |
| --- | --- | --- |
| `brain/web/rules/WEB-012-no-direct-dom-mutation.md` | created | The rule. §1 the ban (innerHTML / create·append·remove / setAttribute / classList / dataset / style writes / reordering), §2 what is *not* mutation (reads, `focus()`, library handoff), §3 the one systemic exception (`<html>` theme/direction/chrome flags through their owning module), §4 why it is absolute, §5 known conflicts, §6 review gate. |
| `brain/web/README.md` | modified | Rule table gains a WEB-012 row; "sixteen non-negotiables" → "seventeen" with a new #17. |
| `brain/web/rules/WEB-008-standing-task-contract.md` | modified | New bullet under §2 Architecture. |
| `CLAUDE.md` (root) | modified | New binding rule #14; the miscounted "The twelve that reject a diff on sight" softened to "The ones that…" so the count can't drift again. |

## Decisions

- **Scope defined so the rulebook stays coherent.** Taken with zero exceptions
  the rule would forbid `element.focus()` (which WEB-003 *requires* for overlays)
  and imperative library handoff (which WEB-004 §3 permits for Leaflet/Mapbox/
  etc.), contradicting other binding rules. WEB-012 therefore governs
  **mutation** — authoring UI by poking nodes — and explicitly excludes reads,
  focus management, and library handoff, each cross-referenced to the rule that
  already sanctions it. This narrows nothing the owner intended; it makes the
  rule enforceable and non-contradictory.
- **One systemic exception, tightly bounded:** `<html>`-root flags
  (`data-theme`, `dir`, `data-shell-rail`) set only through their single owning
  module, because there is no pre-paint declarative way to prevent a theme flash.
  Anything below the document root is a violation.

## Known conflicts flagged (not waived — WEB-008 §5)

- `components/saqeel/menu-surface/menu-surface.tsx` sets `--sqx-menu-*` via
  `style.setProperty` and flips `dataset.align` while positioning — the one known
  §1 violation in the tree. Recorded in WEB-012 §5 as migration debt (CSS anchor
  positioning or state-driven placement), not licence. No new code may copy it.
- The `<html>` writers (`ThemeScript`, theme toggle, rail toggle) are covered by
  §3 and are not violations while they stay within its three conditions.

## Verification

- [x] Rule authored; wired into README table + non-negotiables, WEB-008 §2, root
  CLAUDE.md. Cross-references to WEB-003/004/010 checked for consistency.
- [x] No code changed; nothing to typecheck.

## Parked

- `gate:no-dom-mutation` for T-000: fail the build on the §1 API surface
  (`innerHTML`, `appendChild`, `setAttribute`, `classList`, `dataset`/`style`
  writes, …) outside the §2/§3 allowances. Named in WEB-012 §6.
- Migrate `menu-surface` off imperative positioning, or grant it a recorded
  owner exception.

## Proposed commit

```
docs(web): add WEB-012 — never modify the DOM directly
```

## Next

Owner's choice: schedule the `menu-surface` migration, or record its exception.

# 2026-08-06 · Phase 0 — Establish the rulebook

`task: rulebook establishment` · `status: done` · `duration: 1 session`
`rules applied: n/a — this session wrote them`

---

## Goal

Define the binding rules for the `apps/web` redesign so that any agent picking
up any task follows the same law by default, and create the memory structure
that carries context between sessions.

## What changed

| File | Action |
| --- | --- |
| `brain/web/README.md` | created — onboarding, read order, the twelve non-negotiables |
| `brain/web/01-PROJECT-STATUS.md` | created — baseline measurements and decisions on record |
| `brain/web/02-SESSION-LOG.md` | created — session index |
| `brain/web/03-REDESIGN-TRACKER.md` | created — work board, T-000 … T-034, 48-hour path |
| `brain/web/04-COMPONENT-LEDGER.md` | created — Saqeel catalogue with per-component status |
| `brain/web/05-RETIREMENT-LEDGER.md` | created — retirement protocol register |
| `brain/web/rules/WEB-000-code-law.md` | created |
| `brain/web/rules/WEB-001-architecture-and-nextjs.md` | created |
| `brain/web/rules/WEB-002-design-system.md` | created |
| `brain/web/rules/WEB-003-accessibility.md` | created |
| `brain/web/rules/WEB-004-state-and-data.md` | created |
| `brain/web/rules/WEB-005-performance.md` | created |
| `brain/web/rules/WEB-006-definition-of-done.md` | created |
| `brain/web/sessions/_TEMPLATE-session.md` | created |
| `CLAUDE.md` | rewritten — merges the existing Saqeel implementation rules with the new rulebook |

No application code was touched.

## Decisions

1. **Design system stays SAQEEL.** The repository already owns an audited token
   sheet with recorded contrast ratios, a dark theme, and RTL support — the
   expensive half of a design system. Astryx was considered and rejected: the
   repository's existing law already bans it, and a token migration across ~500
   route files cannot land safely in the available time. The component layer is
   hardened on top of the existing tokens instead.
2. **Icons: `lucide-react` behind a semantic registry.** Hand-authored `<svg>`
   is banned in application code. Two layers — a registry mapping semantic
   names (`riskCritical`) to Lucide components, and a single `Icon` primitive —
   so that replacing the icon library later is a one-file change.
3. **CSS Modules for new work.** Scoped by construction, zero runtime, works in
   Server Components, ships per-route. The two legacy global sheets (220 KB
   combined) are frozen and shrink as screens migrate.
4. **Accessibility target raised to WCAG 2.2 Level AA**, a superset of 2.0.
5. **`alt=""` resolved principled, not by exception**: every `<img>` carries
   purposeful alt text, and a decorative graphic is never an `<img>` — it is CSS
   or an `aria-hidden` icon. This satisfies both the no-empty-string rule and
   WCAG's requirement that decoration is not announced.
6. **Zero comments, with two narrow machine-checkable exceptions**: TSDoc on
   design-system public API, and the `@retiring` banner, which is regex-locked
   so it cannot become narration.

## Inventory taken

Baseline recorded in `01-PROJECT-STATUS.md`: 814 source files, ≈5.9 MB, 495
route files under `app/(app)`, 60 existing Saqeel primitives, 220 KB of legacy
global CSS, no lint configuration, no CI gates. The ten largest offenders are
listed there with their principal violation.

## Numbers

Baseline only — no code changed this session.

## Accessibility

Not applicable. The verification protocol is defined in WEB-003 §10 and becomes
blocking from T-000 onward.

## Verification

- [x] Rules are internally consistent and each is machine-checkable or has a
      named manual check
- [x] Every rule the owner stated is present and hardened
- [x] Existing repository law (Saqeel authority, no-Astryx, RTL logical
      properties, fixed routes, never invent governed values) carried forward
      rather than overwritten

## Retirement

Nothing marked yet. `05-RETIREMENT-LEDGER.md` pre-loads 21 known duplicates and
oversized files against the tasks that will supersede them.

## Parked

- _(none)_

## Blocked / open questions

None. T-000 is unblocked.

## Proposed commit

```
docs(web): establish brain/web rulebook, tracker and session protocol
```

## Next

**T-000 — Guardrails: gate scripts, lint, verify pipeline.** Nothing else starts
until the rules are enforced by machine.

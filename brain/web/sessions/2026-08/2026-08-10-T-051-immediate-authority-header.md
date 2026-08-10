# 2026-08-10 · T-051 — `/planning/immediate` authority header (slice 1)

`task: T-051` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-012`

---

## Goal

Put the top of the urgent-visit wizard — the page-head context pills, the nine
dispatch protections and the R05 identity notice — on SAQEEL, without weakening
the CD-023 acceptance contract.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/planning-immediate/authority.ts` | created | — → 172 |
| `features/planning-immediate/strings.ts` | created | — → 30 |
| `components/sections/planning-immediate/authority-bar/authority-bar.tsx` | created | — → 95 |
| `components/sections/planning-immediate/authority-bar/authority-bar.module.css` | created | — → 96 |
| `i18n/locales/en/planning.json` | modified | +48 (`planning.immediate`) |
| `i18n/locales/ar/planning.json` | modified | +48 (`planning.immediate`) |
| `app/(app)/planning/immediate/page.tsx` | rebuilt (header + strings) | 252 → 222 |
| `app/(app)/planning/immediate/ImmediateForm.tsx` | rebuilt (chip block + notice) | 395 → 359 |
| `app/(app)/planning/immediate/AuthorityBar.tsx` | marked `@retiring` | 95 (0 importers) |
| `e2e/cd-023-immediate-authority-bar.spec.ts` | modified (2 locators) | 611 → 612 |

## Decisions

**The acceptance spec is the design brief, not an afterthought.** The first
design for this block was a list of anchor links — no client island at all. It
was wrong: `cd-023-immediate-authority-bar.spec.ts` pins nine chips as
`<button>`s inside a `role="group"` named *Immediate dispatch protections*, with
accessible names of the form `LABEL — state — detail`
(`REASON — blocking — justify Other in Notes`). That contract is preserved
verbatim. **Read the governed spec during inventory, beside the component.**

**Uppercase belongs in the resource here, not in CSS.** English labels are
`AUTHORIZED` / `REASON` in the JSON rather than sentence case with
`text-transform`. Two reasons, and the second is the binding one: the spec
asserts the exact strings, and `text.overline` — the only uppercase type role —
carries `0.12em` tracking, which WEB-011 forbids on Arabic. The label uses
`text.label` at both locales and each locale's resource carries its own casing.

**A derived string needs no effect.** The legacy used a `useEffect` plus a
`useRef` to announce *only* when the set of blocking chips changed. That is
what React already does: the announcement is derived from props, and the DOM
text node is only mutated when the derived string differs, which is exactly when
a live region should fire. Deleting the effect changed no behaviour. The same
argument retired the second effect (a roving-tabindex clamp) and both refs.
**Before writing an effect to "only run when X changes", check whether render
already gives you that.**

**A protection with no owning control is not a button.** AUTHORIZED, AUDIT and
NOTIFY target nothing; the legacy still rendered them as focusable buttons that
swallowed Enter. They are plain items now. The roving tabindex went with them —
it was modelling a `toolbar`, and this is a `role="group"` of buttons, which is
Tab-navigable by contract.

**Legacy classes carry test contracts, not just styles.** Two spec locators
(`.filter-chip`, `.sr-only[role=alert]`) were selecting on frozen-sheet classes.
The owner ruled no legacy on migrated UI, so both moved to hooks the new markup
owns: `[data-protection]` (an explicit id per protection, nine by construction —
`getByRole("listitem")` would have counted the blocker list too) and
`group.getByRole("alert")`. The asserted **behaviour** is unchanged.

## Inventory taken before writing code

**State and effects (all in `AuthorityBar.tsx`, all removed):**

| Found | Ladder rung it moved to |
| --- | --- |
| `useState activeIdx` (roving tabindex) | deleted — native Tab order |
| `useState announce` | derived — server/props → render |
| `useRef btnRefs[]` | deleted with the roving tabindex |
| `useRef prevBlocking` | deleted — React's own text-node diff |
| `useEffect` clamping `activeIdx` | deleted |
| `useEffect` computing the announcement | deleted |

**DOM touches:** `document.getElementById(controlId)` + `.focus()` kept — a read
plus focus management, both allowed by WEB-012 §2, and the alternative was
plumbing six refs through a 395-line form. `.scrollIntoView({behavior:"smooth"})`
**deleted** — it ignored `prefers-reduced-motion`, and focusing scrolls anyway.

**Literals → tokens:** 10 legacy classes (`panel`, `panel-body`, `stack`,
`filter-bar`, `filter-chip`, `is-set`, `t-caption`, `alert`, `alert-critical`,
`sr-only`) and 2 (`sq-lozenge--warning`, `sq-lozenge--info`) in `page.tsx` → a
colocated CSS Module consuming `--sqx-*` only. **No token was missing**; nothing
was added to `saqeel.css`.

**`<svg>`:** none in this block. **Emoji-as-icon:** 3 (`✓ ✕ ◌`) → `StatusPill`
with a text state, so no registry name was needed either.

**Accessibility failures found in the existing markup:**

1. Chip state was a glyph plus a colour class — no text state, so the
   satisfied/blocking distinction did not survive greyscale (WEB-009 §12).
2. Three chips were focusable buttons that did nothing on activation.
3. The visible blocking panel showed **one** blocker; the full set went to
   screen readers only. A planner with four blocking protections was told about
   one of them.
4. `smooth` scroll with no `prefers-reduced-motion` guard.
5. Two user-visible strings were hardcoded English inside a component
   (`"Optional — selected during preparation if needed"`,
   `"No preference — Supervisor confirms assignment"`) — they shipped
   untranslated in Arabic. Both now carry reviewed Arabic.

**Dead strings deleted:** `chipPackageBlocked` and `chipInspectorBlocked` were
declared, translated and never read — the CHECKLIST and INSPECTOR protections
are informational on every path.

## Numbers

```
Route: /planning/immediate
first-load JS   not measured — production build is the human's (WEB-005 §8)
route CSS       not measured — same
LCP / INP / CLS not measured — no seeded account on this workstation
client islands  2 → 2   (ImmediateForm; authority-bar is the leaf)
legacy CSS deleted: 0 lines — filter-chip still has 2 consumers,
                    alert-warning 40, sq-lozenge 46
source lines removed: 66 net across page.tsx + ImmediateForm.tsx
i18n: 40 keys × 2 locales, parity asserted before write
hooks in the authority block: 6 → 0
```

## Accessibility

- axe: **not run.** No seeded account — `planning_access_class` 307s the
  anonymous caller to `/login`, so no authenticated route renders here.
- Manual checklist (WEB-003 §10): **not run** for the same reason. Keyboard,
  screen reader, 200 % zoom, 320 px, Arabic/RTL, dark and reduced motion are all
  owed and are listed in the measurement request.
- Fixed by construction: state as text plus shape; no dead buttons; the complete
  blocker set in one `role="alert"`; no unguarded smooth scroll; both locales
  present for every string.

## Verification

- [x] `npx tsc --noEmit` — **zero errors** across the repository
- [x] `npm run check:design-system-v5` — **zero findings** on
      `planning/immediate` and `planning-immediate` (91 pre-existing findings
      elsewhere, all outside this task)
- [x] i18n key parity `en` ↔ `ar` asserted programmatically before write
- [ ] `npm run lint` — **no lint config exists** (T-000)
- [ ] `npm run gates` — **no gate scripts exist** (T-000)
- [ ] `npm run test:e2e` — **cannot run**, no seeded account
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**; the browser,
      axe and e2e rows are open

No dev server was started: the owner's server holds `apps/web/.next`, and the
tracker's PARKED section records what a second one did to that cache.

## Retirement

- `app/(app)/planning/immediate/AuthorityBar.tsx` marked `@retiring`, ledger row
  added. **Zero importers**, but not deletable until
  `cd-023-immediate-authority-bar.spec.ts` runs green on the replacement
  (WEB-006 §4).
- Nothing became deletable in the frozen sheets.

## Parked

- **`PlanningNotice` lives in `planning-single/` and now has three screens'
  worth of callers** (single, bulk, immediate — 18 import sites). It is a
  planning-domain notice, not a single-visit one, and belongs in
  `components/sections/planning/`. Mechanical, but it touches 18 files, so it
  wants its own task.
- **The R05 body renders twice** on this screen — once in the notice, once as a
  `role="note"` paragraph inside the identity panel (a third copy sits in the
  unreachable unregistered branch). Same shape T-047 found on the AI advisory.
- **`actorMode` is a constant.** `page.tsx` declares
  `const actorMode: "planner" | "inspector" = "planner"`, so every inspector
  branch on this screen is dead code that TypeScript cannot see is dead. The
  protections resolver still carries it. Collapsing it is a behaviour question
  for the owner, not a refactor.
- **`page.tsx` is 222 lines against a 40-line cap** and still holds five
  Supabase reads, two `as never`, one `as unknown as`, two `let`, a
  `console.error`, and `new Date().toISOString().slice(0, 10)` as "today" — the
  UTC day, which rolls over three hours early in Riyadh (`riyadhToday()` is the
  correct one). All of it is slice 2.
- **`let mapLoadingLabel` sits at module scope in `ImmediateForm.tsx`** and is
  written during render to smuggle a string into `next/dynamic`'s `loading`
  callback. It is a `let` in a `.tsx` (WEB-000 §6) and a render side effect;
  under concurrent rendering two locales could cross.
- **The identity `<label htmlFor="imm-reason">` points at a `<div>`**, not a
  control. The REASON protection's focus target works because the div carries
  `tabIndex={-1}`, but the label association is invalid.

## Blocked / open questions

- **`cd-023-immediate-authority-bar.spec.ts` cannot be run here.** Two locators
  were rewritten off the deleted legacy classes; the rewrite is unverified.
  First authenticated run should start with that spec.
- The nine protections still read from `ui_strings` nowhere — they are JSON now.
  The **rest** of this screen (~120 strings) still uses `t(key, en)` with
  hand-inlined Arabic. Slice 2 should finish the move.

## Proposed commit

```
refactor(planning): rebuild the urgent-visit authority header on saqeel
```

## Next

Slice 2 — `page.tsx` 222 → ≤ 40: reads to `features/planning-immediate/queries.ts`
behind the T-042 narrowing boundary (which removes both `as never` and the
`as unknown as`), the remaining strings to `planning.immediate`, and composition
to `components/sections/planning-immediate/immediate-screen`.

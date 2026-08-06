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

9. **ROUTES ARE FIXED.** `/dashboard` `/operations` `/factories` `/planning` `/execution`
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

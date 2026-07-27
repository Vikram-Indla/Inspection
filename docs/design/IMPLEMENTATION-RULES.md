# How to get this exact design into the Inspection platform

Revision R1 · for `Vikram-Indla/Inspection` (branch `setup/Inspection`)
Companion to `HANDOFF.md` (what to build) and `FINAL-CUT-REVIEW.md` (why it looks the way it does).

This file answers one question: **what do I do so the implemented screen matches the design?**

---

## The one sentence that matters

**Claude Code must not write CSS.**

Every screen in `Saqeel Revamp.dc.html` is styled with classes and tokens that already exist in
`apps/web/src/app/` — `.panel`, `.badge`, `.table`, `.nav-item`, `.seg-opt`, `.btn`, `--surface-*`,
`--text-*`, `--space-*`, `--radius-*`. Nothing was invented. So the implementation job is
**markup and wiring, not styling**.

Fidelity is lost at exactly one step: when an agent reads a description of a design and writes new
styles to match it. Remove that step and the drift disappears.

---

## 1. Put this in the repo before you start

Copy into the repository root or `apps/web/`:

| File | Purpose |
| --- | --- |
| `export/Saqeel Revamp (standalone).html` → `design/final-cut/saqeel-revamp.html` | The running design. Claude Code opens it, not a description of it. |
| `HANDOFF.md` → `docs/design/HANDOFF.md` | Route contracts, states, RBAC. |
| `FINAL-CUT-REVIEW.md` → `docs/design/FINAL-CUT-REVIEW.md` | Every visual decision and why. |
| `IMPLEMENTATION-RULES.md` → `CLAUDE.md` (or append to it) | These rules. Loaded automatically every session. |

The standalone HTML is the important one. It is self-contained and runs offline — Claude Code can
open it in a browser, inspect any element, and read the real computed values instead of guessing.

---

## 2. The rules to paste into `CLAUDE.md`

```
## Saqeel design implementation rules — non-negotiable

The approved design is design/final-cut/saqeel-revamp.html. Open it. Do not work from
screenshots or from prose descriptions of it.

1. NO NEW CSS. Do not write a new class, a new CSS file, a styled-component, a Tailwind
   utility, or a style={{ }} prop. Every element must render with a class that already
   exists in apps/web/src/app/saqeel-components.css.

2. NO NEW TOKENS. Use var(--surface-*), var(--text-*), var(--action-*), var(--status-*),
   var(--space-*), var(--radius-*), var(--shadow-*). Never a raw hex, rgb, px font size,
   or px radius. If a value looks bespoke, it is a token you have not found yet.

3. IF A CLASS IS MISSING, STOP. Do not style the page locally to work around it. Report
   the gap. A missing class is a design-system change request, not a page-level fix.

4. COPY THE MARKUP STRUCTURE. Element order, nesting depth, and class names in the design
   are the contract. Match them. If the design has
   div.panel > div (header) > span + span, produce the same.

5. NO ASTRYX. No ax- class, ax- token, or astryx.css import. Zero references. If you find
   one, it is a defect.

6. STATUS IS TEXT PLUS SHAPE, NEVER COLOUR ALONE. Every status renders as a .badge with a
   text label. Do not replace one with a coloured dot.

7. RTL VIA LOGICAL PROPERTIES ONLY. padding-inline, margin-inline-start, inset-inline-start,
   border-inline-end. Never left/right. Never a [dir="rtl"] override that flips a value.

8. ARABIC LIVES IN i18n RESOURCES. The design carries ~725 approved Arabic strings; they
   move into the repo's i18n layer, not into components. Never translate in a component.

9. ROUTES ARE FIXED. /dashboard /operations /factory-360 /planning /execution /reviews
   /compliance /compliance/approvals /enforcement-library /analytics /admin/*. Do not
   rename, add, or nest. Tabs and filters are query state, never subroutes.

10. NEVER INVENT A GOVERNED VALUE. No risk weight, penalty amount, SLA, threshold, or
    approval rule. Absent data renders as a state: Not configured / Unavailable /
    Insufficient evidence.
```

---

## 3. The prompt to give Claude Code, per screen

Do not ask it to build several screens at once. One route per session.

```
Implement the Review & Approval screen.

Design:  design/final-cut/saqeel-revamp.html  → open it, navigate to Review & Approval
Contract: docs/design/HANDOFF.md § Review & Approval
Route:   apps/web/src/app/(app)/reviews/page.tsx
Rules:   CLAUDE.md § Saqeel design implementation rules

Before writing code:
1. Open the design file and navigate to this screen.
2. For each region, list the elements and the CLASS each one uses.
3. Show me that list and stop.

After I confirm, implement using only those classes. Write no CSS.
```

That "list the classes and stop" step is what prevents the rebuild-from-memory failure. It forces
the agent to read the real DOM before it writes anything, and it gives you a cheap checkpoint —
if the class list is wrong, you have lost thirty seconds instead of a screen.

---

## 4. How to verify without reviewing pixels

Three levels, cheapest first.

**Level 1 — grep. Run after every screen. Ten seconds.**

```bash
# no new CSS
grep -rn "style={{" apps/web/src/app/(app)/reviews/ && echo "FAIL: inline styles"
# no raw colour
grep -rEn "#[0-9a-fA-F]{6}|rgb\(" apps/web/src/app/(app)/reviews/ && echo "FAIL: raw colour"
# no astryx
grep -rn "\bax-\|astryx" apps/web/src/ && echo "FAIL: astryx reference"
# no physical direction
grep -rEn "(padding|margin)-(left|right)|\bleft:|\bright:" apps/web/src/app/(app)/reviews/ && echo "FAIL: not RTL-safe"
```

Four commands. They catch the majority of drift, because drift almost always announces itself as a
hardcoded value.

**Level 2 — class diff.** Open the design and the built page side by side, and compare the set of
classes used per region. Same classes, same order = same rendering, because the CSS is shared.

**Level 3 — computed-style assertions.** Playwright test that loads both, walks matching selectors,
and compares `getComputedStyle` for font, colour, spacing, radius and border. Failures read
`queue-row: expected padding 11px 14px, got 16px`. This is the one that actually converges, and it
is worth building once for a reference screen and then generating for the rest.

---

## 5. Order to implement

Structure first, then the screens that reuse it.

1. **Shell** — side rail, topbar, nav hierarchy. Everything else sits inside it, so getting it
   wrong contaminates all fifteen routes.
2. **Review & Approval** — the densest workspace. If the three-column pattern, queue rows, tier
   strip and record panels come out right, the rest of the platform is variations on it.
3. **Planning, Execution** — same table and record-drawer anatomy.
4. **Compliance Library, Approval Queue, Enforcement Library** — same again.
5. **Dashboard, Operations Center, Factory 360, Analytics** — KPI, map and chart surfaces.
6. **Administration** — six surfaces, one pattern.

---

## 6. What will still not transfer, honestly

- **React architecture.** Component boundaries, hooks, data fetching and state are Claude Code's
  to design. The artifact is one streaming HTML file; it cannot dictate that, and shouldn't.
- **Real data.** Every figure is design preview data. Wiring changes what is displayed, and some
  layouts will need to tolerate longer strings and larger numbers than the fixtures carry.
- **The map.** Mapbox renders live; only the panel chrome, legend and states come from the design.
- **Motion.** The design has 120/200ms transitions on hover, tabs and drawers. These are easy to
  drop silently during implementation — check them explicitly.

---

## 7. If a screen comes back wrong

Do not ask for "make it match the design more closely". That invites another rebuild from memory.

Ask instead:

> Element X uses class `.foo` in `design/final-cut/saqeel-revamp.html`. Your implementation uses
> `.bar`. Change it to `.foo`. Do not adjust any other value.

Name the element, name the class, name the file. One property at a time. Every round of vague
feedback costs more than the specific correction it replaces.

# WEB-012 — The DOM is render output, never a mutation target

> Status: **BINDING — the hardest line in this rulebook. Never drift.**
> The rendered DOM is produced by React from props and state. The **only** way
> the DOM changes is by changing what a component returns. Application code never
> reaches into the live document and mutates it by hand. There is no task, no
> deadline, and no "just this once" that licenses it.

---

## 1 · The rule

Never mutate the DOM imperatively. If a change should appear on screen, it is a
change to **state** (walk the ladder, WEB-004 §1) that **render** expresses — not
a node you poke after the fact.

Banned in all of `apps/web/src/**`, with no exception granted at task level:

- `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `textContent` / `innerText`
  **writes**
- `createElement`, `createTextNode`, `appendChild`, `removeChild`,
  `replaceChild`, `insertBefore`, `append`, `prepend`, `remove`, `replaceWith`,
  any node reordering
- `setAttribute` / `removeAttribute`, and property-style attribute writes
  (`el.id =`, `el.href =`, `el.dataset.x =`)
- `classList.add` / `remove` / `toggle` / `replace`, or assigning `el.className`
- `el.style.x =` and `el.style.setProperty(...)`
- `document.write`, cloning-and-injecting nodes, template stamping
- any DOM-mutating library (jQuery-style) or a hand-rolled equivalent

A value that would drive one of these is **state wearing a disguise**. The fix is
never the mutation:

- want to toggle a class → a `data-*` attribute or a conditional `className` in
  JSX, driven by state, styled by a CSS rule keyed on that attribute
- want to set a style → a **token-valued** custom property in JSX
  (`style={{ "--x": … }}`, WEB-002 §4) or a CSS rule, never an inline literal
- want to insert or remove a node → render it conditionally
- want to reorder → reorder the array you map over, with stable keys

If it cannot be expressed through render and the state ladder, that is a signal
the design is wrong, not that the rule should bend.

---

## 2 · What this rule does **not** forbid

This rule governs **mutation**. It does not touch the framework's own sanctioned
escape hatches, each already bounded by another binding rule:

- **Reading the DOM.** Refs, `getBoundingClientRect`, `FormData`, uncontrolled
  inputs. Reads are not mutation (WEB-004 §1.4, WEB-010 §5). Read once, never in
  a loop, never interleaved with writes.
- **Focus management.** `element.focus()` / `.blur()` where an overlay's APG
  contract requires it (WEB-004 §3, WEB-003). Moving focus is not authoring
  markup.
- **Imperative library handoff.** Handing a React-owned container to Leaflet,
  Mapbox, Three, Twilio, or a canvas, which then renders into **its own**
  subtree (WEB-004 §3). React does not own that subtree; the library does, and
  disposes it (WEB-010 §2).

If you are reaching for the DOM for any reason **other** than these three, stop.

---

## 3 · The one systemic exception: the document root

Theme, direction, and global chrome flags on `<html>` (`data-theme`, `dir`,
`data-shell-rail`) are set imperatively **only** as synchronisation with the
document itself — there is no pre-paint declarative way to prevent a theme flash,
and the toggle must take effect without a server round-trip.

This is permitted **only** when all of the following hold:

1. the target is `document.documentElement` (the `<html>` root), never an
   application node inside a component's render tree;
2. the write lives in the **one** module that owns that flag (`ThemeScript` /
   the theme toggle, the rail toggle) — never scattered across components;
3. it writes a single attribute, and components react to it through CSS or
   `useSyncExternalStore`, never by reading it back and mutating further.

Anything beyond the document root is §1, not this exception.

---

## 4 · Why it is absolute

Imperative DOM mutation fights the reconciler: React overwrites the change on the
next render, or hydration mismatches on the first, or the change silently
survives as state that lives nowhere the ladder can see. Every one of those is a
class of bug that is invisible in review and expensive in production, and none of
them is ever fixed by "being careful" — only by never writing the mutation.

It is also the load-bearing assumption behind every other rule here: the state
ladder (WEB-004), the no-leak commitment (WEB-010), server-first rendering
(WEB-001), and accessibility-by-construction (WEB-003) all assume the DOM is a
pure function of state. One hand-mutation breaks that assumption for the whole
screen.

---

## 5 · Known conflicts in the current tree (flagged, not waived)

Recorded here so the rule is not drifted **quietly** (WEB-008 §5). These predate
the rule and are migration debt, not licence:

- **`components/saqeel/menu-surface/menu-surface.tsx`** sets `--sqx-menu-shift`,
  `--sqx-menu-avail-*` via `style.setProperty` and flips `dataset.align` while
  positioning. This is §1 mutation on a rendered node. It measures then writes
  back to avoid viewport overflow. Until it is migrated (CSS anchor positioning,
  or a state-driven placement) or granted an explicit, recorded owner exception,
  it is the one known §1 violation and no new code may copy the pattern.
- The `<html>`-root writers (`ThemeScript`, the theme toggle, the rail toggle)
  are covered by §3 and are **not** violations, provided they stay within §3's
  three conditions.

A new task that touches either file must not add to the debt.

---

## 6 · Review gate

Every diff answers:

- [ ] Does any application code write `innerHTML`, create/append/remove/reorder a
  node, set an attribute/class/style, or otherwise mutate a rendered node?
- [ ] Is every DOM touch a **read**, a `focus()`, or a library handoff (§2) — or a
  document-root flag through its owning module (§3)?
- [ ] Could a value driving a DOM change instead live on the state ladder and be
  expressed by render?

An unchecked first box is a blocker, not a note. `gate:no-dom-mutation` (a
future T-000 addition) fails the build on the §1 API surface outside the §2/§3
allowances.

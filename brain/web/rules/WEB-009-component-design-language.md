# WEB-009 — Component Design Language

> Status: **BINDING**.
> The visual grammar every component obeys, in every task. These are the rules
> that make a component family look designed rather than assembled. A prompt
> names a component and its specifics; it never restates this document.

---

## 1 · One height per row

```
--sqx-control-h-sm  2rem      --sqx-control-h-md  2.375rem      --sqx-control-h-lg  2.75rem
```

`md` is the default everywhere. Every control that can stand beside another in a
toolbar row — text input, select, date trigger, icon button, button, segmented
control — is **exactly the same height**, on the same baseline, separated by
`--sqx-space-3`.

Mismatched control heights are the single largest cause of an interface looking
amateur, and they are the first thing checked in review. A task that touches a
toolbar reports the measured pixel height of every control in it.

---

## 2 · Borders whisper, surfaces speak

A resting border is `--sqx-border-subtle` — just enough to define an edge.

**Hover changes the surface, never the border.** A border that thickens or
darkens on hover reads as jitter. Only two states change a border: focus, and
invalid.

---

## 3 · Depth is a hairline, not a shadow

This is the language's central structural claim and the easiest thing to get
wrong, because every other design system teaches the opposite.

- A card is told apart from the canvas by **`--sqx-elevation-1`** — a 1px inset
  ring — plus its step on the surface ladder. **Not** by a drop shadow.
- Inputs and wells read **sunken**: `--sqx-surface-sunken`.
- Only genuinely floating layers — menu (`-3`), modal (`-4`) — carry a drop, and
  it is tight rather than soft.

A component that adds an ambient shadow to lift a card off the page is fighting
the language. If a surface is not reading, the fix is the ladder or the ring,
never a softer, larger shadow.

---

## 4 · The rim light is subordinate to the ring

`--sqx-rim-light` survives for surfaces that genuinely float — menus, popovers,
the switch thumb. It is **not** how a card separates from the canvas; §3 is.

A rim light on a sunken input is wrong, and a rim light standing in for a
missing hairline is wrong.

---

## 5 · Focus is a ring that moves nothing

```css
outline: var(--sqx-focus-ring-width) solid var(--sqx-border-focus);
outline-offset: var(--sqx-focus-ring-offset);
```

`:focus-visible` only — a mouse click must not draw a ring. Focus never changes
an element's size, position, padding, or font weight, and is never carried by a
colour change alone.

---

## 6 · Three radii

Controls `--sqx-radius-control` (6px). Menus, panels and cards
`--sqx-radius-card` (12px). Pills, badges and avatars `--sqx-radius-pill`.
Inline chips `--sqx-radius-inline` (2px). Nothing uses any other value.

**12px is the ceiling.** The language caps card radius there, so
`--sqx-radius-xl` and `-2xl` resolve to the same 12px rather than growing. A
surface that wants to look softer does not get a larger radius.

---

## 7 · Icons never scale with their control

Every icon is `--sqx-icon-md` regardless of whether its control is `sm`, `md` or
`lg`. An icon that grows with its container is the fastest way to make a large
button look inflated.

Decorative icons inside a control stay `--sqx-text-muted` at all times. An icon
goes to `--sqx-text-primary` on hover only when it **is** the control.

---

## 8 · Fixed spacing

```
control inline padding                --sqx-inset-control
inline padding with a leading icon    --sqx-control-pad-icon
icon → text gap                       --sqx-space-3
control → control gap in a toolbar    --sqx-space-3
menu outer padding                    --sqx-menu-pad
menu row height                       --sqx-menu-row-h
menu row inline padding               --sqx-space-3
card padding                          --sqx-inset-card
panel padding                         --sqx-inset-panel
```

Menu rows are deliberately **tighter** than the trigger that opens them. A menu
with 38px rows feels sluggish; 32px rows inside 6px of outer padding feels
precise. That asymmetry is intentional and is not to be "corrected".

---

## 9 · Typography inside components

| Element | Role | Colour |
| --- | --- | --- |
| Control value | `text.label` | `--sqx-text-primary` |
| Placeholder | `text.body` | `--sqx-text-muted` |
| Menu row label | `text.label` | `--sqx-text-secondary` |
| Menu row, selected | `text.label` w600 | `--sqx-text-accent` |
| Menu group heading | `text.overline` | `--sqx-text-muted` |
| Helper text | `text.caption` | `--sqx-text-muted` |
| Error text | `text.caption` | `--sqx-text-danger` |
| Section title | `text.heading` | `--sqx-text-primary` |
| Card title | `text.subheading` | `--sqx-text-primary` |
| Body copy | `text.body` | `--sqx-text-secondary` |

Every number, date, count, currency and identifier carries
`--sqx-numeric-tabular`, so figures never jitter in a column.

---

## 10 · Motion

`--sqx-duration-fast` on `--sqx-ease-standard`, and only on `background-color`,
`border-color`, `color`, `opacity`, `box-shadow`, `transform`.

**Never** on `width`, `height`, `padding`, `font-size`, or `inset`. Animated
geometry makes an interface feel unstable, and it costs layout on every frame.

Menus and popovers enter with opacity `0→1` plus `translateY(-4px)→0` over
`--sqx-duration-fast` on `--sqx-ease-decelerate`. Under
`prefers-reduced-motion: reduce`, opacity only.

Specular sweeps fire on `:hover` only, once — never on load. An unprompted
specular pass reads as a rendering error.

---

## 11 · Gradients are spent, not rationed

The budget is now **zero**. The language forbids decorative gradients on
buttons, cards and text outright, and the app has no hero band to spend the
exception on.

The active navigation indicator and the primary CTA are **flat IRP aubergine**:
the fill is `#7E61AC` (`--sqx-brand-400`) with **white** ink — measured 5.01:1 at
rest, 6.44:1 hover, 9.05:1 pressed, so the control darkens under the pointer and
contrast only ever improves.

Selection is expressed flat, with `--sqx-surface-accent` and
`--sqx-text-accent`.

**The brand may be text.** Unlike the retired acid lime (1.23:1 on white,
fill-only), aubergine `#413259` is dark and readable: links and text accents are
aubergine (`--sqx-text-link` / `--sqx-text-accent`), body copy is never
chromatic. The fill lightens to `#7E61AC`; text keeps the darker `#413259`.

---

## 12 · Selection is never colour alone

A selected row carries a leading check, a weight change, or an edge bar as well
as its colour. Reserve the check gutter on unselected rows so every label starts
on the same axis whether selected or not (WCAG 1.4.1).

---

## 13 · One popover surface

`MenuSurface` is the single raised panel behind **every** menu in the
application: select options, date panels, user menus, search results, filter
dropdowns, command palettes.

Building it once is what guarantees they cannot drift apart. **No component
builds its own popover.** If a menu needs something the surface does not offer,
the surface gains a prop — it does not get bypassed.

---

## 14 · Native form controls that cannot be styled are banned

`<select>` is the clearest case: the operating system renders its option list,
so it ignores every token, looks different on Windows, macOS, iOS and Android,
and cannot follow the dark theme. The same applies to `<input type="date">` and
`<input type="color">`.

Build a listbox or a picker on `MenuSurface` instead — and because you built it,
you owe it the full APG keyboard contract. Native `<input type="text">`,
`<textarea>`, `<button>`, `<input type="checkbox">` and `<input type="radio">`
remain mandatory; they style fine and their semantics are free.

---

## 15 · Layout primitives own all spacing

`Stack`, `Cluster` and `Grid` are the only source of space between elements. **No
component sets its own outer margin** — a component that does cannot be placed
anywhere without its author's assumptions coming with it.

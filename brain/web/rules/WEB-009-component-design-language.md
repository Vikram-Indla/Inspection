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

## 3 · Two depths, and no third

- Inputs and wells read **sunken**: `--sqx-surface-sunken`.
- Menus, popovers, panels and floating things read **raised**:
  `--sqx-surface-raised` + `--sqx-shadow-menu`.

That is the entire depth story. There is no third level and no in-between
shadow.

---

## 4 · The rim light

Every raised surface carries `--sqx-rim-light`, a 1px inner highlight on its top
edge — menus, popovers, the selected segment, the switch thumb, floating cards.

```
--sqx-rim-light
  dark:  inset 0 1px 0 rgb(255 255 255 / .045)
  light: inset 0 1px 0 rgb(255 255 255 / .85)
```

This is what makes a dark interface look lit rather than flat, and it costs one
token. Raised surfaces only — a rim light on a sunken input is wrong.

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

Controls `--sqx-radius-control`. Menus, panels and cards `--sqx-radius-card`.
Pills, badges and avatars `--sqx-radius-pill`. Inline chips
`--sqx-radius-inline`. Nothing uses any other value.

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

## 11 · Gradients are rationed

The entire application budget is **two places**:

1. the active navigation indicator
2. the one primary CTA per screen

No other component carries a gradient — not a search field, not a selected menu
row, not a switch, not a selected segment, not a badge, not a card. The reason
neon looks cheap is almost never the colour; it is the quantity.

Selection is expressed flat, with `--sqx-surface-accent` and
`--sqx-text-accent`.

Ambient chrome gradients (the shell rail and topbar) are a separate, static,
theme-following tint — never animated, never neon.

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

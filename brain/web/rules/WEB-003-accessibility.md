# WEB-003 — Accessibility Law (WCAG 2.2 Level AA)

> Status: **BINDING**.
> Conformance target: **WCAG 2.2 Level AA**, which contains all of 2.0 and 2.1.
> This is a government inspection platform used in the field, one-handed, in
> sunlight, in Arabic and English. Accessibility here is not compliance
> theatre — it is whether an inspector can file a finding.

An inaccessible screen is a broken screen. It does not ship.

---

## 1. Images and alternative text

**`alt=""` is banned.** So is `alt` that is absent, whitespace, a filename, a
dimension, or begins with "image of" / "picture of" / "icon of".

Every `<img>` and `next/image` carries alt text that conveys the **purpose** of
the image in its context — what a person who cannot see it needs to know in
order to act.

The corollary that makes this rule coherent: **if an image is purely
decorative, it must not be an `<img>` at all.** A decorative graphic becomes a
CSS background, a `::before`, or an `Icon` with `aria-hidden="true"`. It is
never an image element with an empty alt, because a decorative image element
should never have existed.

| Context | Correct alt |
| --- | --- |
| Evidence photo on a finding | `Cracked guard rail on line 3, photographed 14 March 2026` |
| Factory exterior in a card | `Al-Faisal Plastics facility, Riyadh Second Industrial City` |
| Chart rendered as an image | the finding the chart shows, plus a link to the data table |
| A signature capture | `Signature of inspector Layla Al-Harbi` |
| A background texture | not an image — CSS |

Charts, maps, and diagrams additionally expose their data as text: a table, a
description list, or a summary sentence. A visual-only chart fails 1.1.1
regardless of its alt text.

---

## 2. Colour and contrast

- Text contrast ≥ **4.5:1**; large text (≥ 24px, or ≥ 19px bold) ≥ **3:1**.
- UI component boundaries, focus indicators, chart series, and icons that carry
  meaning ≥ **3:1** against their neighbours (1.4.11).
- Both themes pass. Dark mode is not exempt.
- **Colour is never the only channel** (1.4.1). Status carries a text label.
  Chart series carry direct labels or distinct shapes. Errors carry text. A
  required field carries the word, not just a red border.
- Any new token records its measured ratio in `tokens.css` at the point of
  definition. An unmeasured colour is not a token.

---

## 3. Keyboard and focus

- Every interactive element is reachable and operable by keyboard alone, in DOM
  order, with no traps.
- **Visible focus on everything**, using `--focus-ring`. `outline: none` without
  an equal-or-better replacement is banned.
- Focus indicator is not obscured by sticky headers, footers, or drawers
  (2.4.11, 2.4.12).
- Overlays: focus moves into the overlay on open, is trapped while open, returns
  to the trigger on close, and `Escape` closes.
- Composite widgets follow the APG keyboard contract: arrow keys move within,
  Tab moves out. Tabs, menus, comboboxes, grids, and segmented controls all obey
  this and the Saqeel primitive owns it so callers cannot get it wrong.
- `tabIndex` greater than 0 is banned. `tabIndex={-1}` only for programmatic
  focus targets.
- A skip link to `#main` is the first focusable element on every page.
- Dragging always has a single-pointer alternative (2.5.7). The map, the
  reorderable checklist, and the annotator each need one.

---

## 4. Semantics

- One `<h1>` per page. No skipped heading levels. Headings describe the section,
  not the style.
- Landmarks on every page: `header`, `nav`, `main` (with `id="main"`), `aside`,
  `footer`. Multiple landmarks of the same type get distinct `aria-label`s.
- **`<button>` for actions, `<a>` for navigation.** A `div` or `span` with
  `onClick` is banned outright — it is the single most common failure in this
  codebase's current state.
- Lists are `<ul>`/`<ol>`. Tabular data is `<table>` with `<caption>` and
  `<th scope>`. A grid of `div`s pretending to be a table fails.
- Native elements before ARIA. The first rule of ARIA is not to use ARIA.
- No `role` that restates the element. No `aria-label` on a non-interactive,
  non-landmark element. No `aria-hidden` on anything focusable.

---

## 5. Forms

- Every control has a programmatically associated `<label>`. Placeholder text is
  not a label and never carries the only instruction.
- Required state is conveyed in text and with `aria-required`.
- Errors: `aria-invalid` on the control, message linked with
  `aria-describedby`, an `role="alert"` summary at the top of the form on
  submit, and focus moved to the first error.
- Error text names the field and states the fix: *"Finding severity is required.
  Choose Critical, Major, or Minor."* — never *"Invalid input."*
- Help text is linked with `aria-describedby`, not left visually adjacent and
  programmatically orphaned.
- Nothing submits on change. No context change on focus (3.2.1) or input
  (3.2.2).
- Destructive and legally significant submissions are reversible, checked, or
  confirmed (3.3.4 / 3.3.6).
- Authentication offers no cognitive-function test without an alternative
  (3.3.8) — the field flow must never depend on transcribing a code from memory.
- Consistent help placement across the app (3.2.6).

---

## 6. Dynamic content

- Async status is announced through a polite live region: saving, saved, sync
  complete, upload failed, results updated. `LiveRegion` exists — use it.
- Errors and blocking conditions use `role="alert"` (assertive), sparingly.
- Route transitions move focus to the new page's `<h1>` or `<main>`.
- Loading states are announced, not merely animated.
- Nothing auto-updates, auto-carousels, or auto-refreshes without a pause
  control (2.2.2).
- Timeouts warn and can be extended (2.2.1). Field sessions must not silently
  discard work.

---

## 7. Target size and field ergonomics

- Minimum interactive target **44 × 44 px** (`--touch-target`) throughout the
  field surfaces; WCAG 2.2's 24 × 24 floor (2.5.8) is the absolute minimum for
  dense desktop grids and is never used on a mobile surface.
- Adjacent targets have at least `--space-2` between them.
- Primary field actions sit within thumb reach at the bottom of the viewport.
- Everything works one-handed, in portrait, with gloves.

---

## 8. Motion, orientation, and zoom

- `prefers-reduced-motion: reduce` removes transform and opacity animation
  everywhere. Non-negotiable (2.3.3).
- No content flashes more than three times per second (2.3.1).
- Both orientations supported (1.3.4).
- Content reflows at 320 CSS px wide with no horizontal scrolling (1.4.10).
- Text scales to 200% without loss of content or function (1.4.4), and
  text-spacing overrides do not clip content (1.4.12).

---

## 9. Language and direction

- `<html lang>` and `dir` reflect the active locale.
- Inline text in the other language carries its own `lang` attribute so screen
  readers switch voice.
- Arabic is a first-class layout, not a mirrored afterthought: logical
  properties only, numerals formatted through the shared formatter, and the
  Arabic type ramp verified separately for contrast and line height.

---

## 10. Verification — automated is a third of the job

**Automated (blocking, every task):**

- `axe-core` via Playwright on every route touched — **zero violations**, no
  disabled rules.
- `gate:a11y-static` — greps for `alt=""`, missing `alt`, `div` with `onClick`,
  `tabIndex` > 0, `outline: none`, physical direction properties.
- Contrast check on any token touched.

**Manual (blocking, every task) — automated tools catch roughly a third of WCAG
failures. The checklist is not optional:**

- [ ] Traverse the whole screen with Tab and Shift+Tab only. Order is logical,
      focus always visible, nothing unreachable, nothing trapped.
- [ ] Operate every control with the keyboard: open, choose, dismiss, submit.
- [ ] Screen-reader pass over the primary flow (NVDA or VoiceOver). Every
      control announces a name, a role, and its state.
- [ ] Zoom to 200% and to 320 px width. Nothing clipped, nothing horizontal.
- [ ] Switch to Arabic. Layout mirrors correctly, no flipped icons that convey
      direction incorrectly, no clipped text.
- [ ] Switch to dark theme. Contrast holds.
- [ ] Enable reduced motion. Nothing animates.
- [ ] Disable colour (greyscale). Every status is still identifiable.

Results of this checklist go into the session neuron. "Looks fine" is not a
result.

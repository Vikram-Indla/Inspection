# WEB-014 — Typography Contract

> Status: **BINDING**. Supersedes every typography clause in WEB-002 §5 and
> WEB-009 that contradicts it.
> Enforced by `npm run gates:typography` (static, ratcheted) and
> `e2e/typography-scale-contract.spec.ts` (runtime, per route).
> This rule exists because the previous one was followed and the output was
> still inconsistent. Read §1 before you decide it does not apply to your task.

---

## 1. Why this rule is shaped differently

Every screen in this app used `var(--sqx-text-*)` tokens. Every screen passed
every gate. The result still had two prose sizes inside a single card, four
roles inside a 2px band, and 72% of all type below 12px.

The failure was not disobedience. The old system offered twelve roles with no
selection rule, so twelve agents made twelve defensible choices and the app
looked assembled by twelve people. **A rule that can be satisfied many ways is
not a rule.**

So this contract does two things the old one did not:

1. It removes the choice. Nine roles, one prose size, one card-title size.
2. It removes the reach. Feature code cannot express typography at all — the
   properties are unavailable to it, and the build fails if you write one.

Do not attempt to restore expressiveness. If a screen seems to need a size that
is not here, the screen is wrong, not the scale.

---

## 2. The scale — nine roles, and nothing else

Defined in `apps/web/src/app/saqeel.css`. These are the only text appearances
the application has.

| Role | Size | Line | Weight | Tracking | Used for — and nothing else |
|---|---|---|---|---|---|
| `display` | 32px | 1.13 | 510 | -0.022em | The page title. **Exactly one per route.** |
| `heading` | 24px | 1.33 | 400 | -0.012em | Card and section titles. The only card-title size in the app. |
| `subheading` | 20px | 1.33 | 510 | -0.012em | A named group *inside* a card. |
| `body` | 15px | 1.60 | 400 | -0.011em | **Every sentence of prose, everywhere.** |
| `body-strong` | 15px | 1.60 | 590 | -0.011em | Emphasis inside body; the value in a key–value row. |
| `label` | 13px | 1.20 | 510 | 0 | Form labels, table column headers, the key in a key–value row. |
| `overline` | 13px | 1.20 | 510 | 0.06em | The uppercase eyebrow above a card title. |
| `metric` | 32px | 1.13 | 510 | -0.022em | KPI numerals. Every number in the app is this one size. |
| `mono` | 13px | 1.50 | 400 | -0.013em | CRs, plant numbers, notice numbers, model versions, IDs. |

**The scale caps at weight 590.** The language forbids 700+ outright, so
`--sqx-weight-bold` is an alias of `semibold` rather than a heavier cut. If a
heading is not carrying enough emphasis, the fix is size or tone — never weight.

**13px is the floor.** There is no size below it, and `body` at 15px is the
smallest prose. A screen that wants something smaller wants `label`, or wants
less on it.

### 2.0 Two typefaces, split by script

`--sqx-font-sans` resolves to `var(--font-inter)` then `var(--font-plex-arabic)`
— both **next/font scoped families**, both self-hosted, and the only webfonts
this application loads. Inter carries Latin; IBM Plex Sans Arabic carries
Arabic.

**The split needs no `[lang]` selector and must not acquire one.** Inter ships
no Arabic coverage, so Arabic glyphs fall through to Plex on their own, per
glyph, inside the same string. A `:lang(ar)` font override would break mixed
runs — a CR number inside an Arabic sentence — and is a defect.

**That only holds because Inter is loaded with `adjustFontFallback: false`, and
it is load-bearing.** `next/font` otherwise synthesises an `"<name> Fallback"`
face from a local system font and inserts it into the stack immediately after
the real one. That synthetic face **does** carry Arabic, so it captures every
Arabic glyph before the chain ever reaches Plex — measured at 49.81px against
Plex's 55.33px, i.e. Arabic silently rendering in a system face with the wrong
metrics, on every route, while the stack still *named* Plex.

```
adjustFontFallback default   inter, "inter Fallback", plexArabic, …   Arabic = 49.81  WRONG
adjustFontFallback: false    inter, plexArabic, …                     Arabic = 55.55  Plex
```

**Never trust a font stack by reading it.** This defect shipped for two tasks
because the stack named Plex and looked correct; only a width measurement of
Arabic text found it. Measure each script separately — Latin passing tells you
nothing about Arabic.

`--sqx-font-mono` is a real monospace stack: the `mono` role differs from `body`
by typeface *and* tabular numerals. The language reserves it for issue-ID-shaped
text — never headings, never prose.

This is stated as law because it was silently broken for a long time and nobody
could see it. The token used to read
`"Readex Pro", "IBM Plex Sans Arabic", system-ui, sans-serif` — **neither named
family was ever loaded**, because next/font registers its own scoped name. Every
token-styled element therefore fell through to `system-ui` while elements using
`--font-plex-arabic` directly got the real face, and the app rendered in **four
typefaces at once**: Segoe UI (224 elements), IBM Plex Sans Arabic (209), Times
New Roman (4 unstyled), and Consolas (every `mono` site, because JetBrains Mono
was never loaded either).

**Never name a font family as a string literal.** A literal family name is a
claim that the font is loaded, and CSS gives you no error when it is not — it
just quietly renders something else. Only `var(--sqx-font-sans)` /
`var(--sqx-font-mono)` are permitted, and adding a second family is a change
request that must also add the `next/font` loader in `app/layout.tsx`.

To verify the face actually in use, measure it rather than reading the stack —
and **do not use `document.fonts.check()` or a canvas `ctx.font` probe.** Both
are unreliable and both produced a wrong answer in this repository: the canvas
API silently mis-parses a quoted family and falls back, so the width matches a
bogus baseline and appears to confirm the font is missing.

Lay out a hidden span carrying the element's own computed size and weight, then
compare rendered widths across candidate families:

```js
const el = document.querySelector('h1'), cs = getComputedStyle(el);
const probe = (family) => {
  const s = document.createElement('span');
  s.textContent = 'Probe 0123456789';
  s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:${cs.fontSize};font-weight:${cs.fontWeight}`;
  s.style.fontFamily = family;
  document.body.appendChild(s);
  const w = s.getBoundingClientRect().width; s.remove(); return w;
};
probe(cs.fontFamily) === probe(getComputedStyle(document.documentElement).getPropertyValue('--font-inter'))
```

This is the check that caught Inter **not rendering at all** while the stack
named it, and the same check that confirmed it once self-hosted. A font claim is
a width measurement or it is a guess.

Arabic line-heights are overridden per role in the `:lang(ar)` block of
`saqeel.css`. You never set them at a call site.

### 2.1 Retired roles

`caption`, `body-lg`, `title` and `code` are **retired**. Their tokens still
resolve — `caption` and `body-lg` to `body`, `title` to `display`, `code` to
`mono` — so that unmigrated screens keep rendering. That aliasing is scaffolding
for the migration, not a supported API.

**Never write a retired role into a new or edited file.** The gate rejects it.
When your task touches a file that references one, replace it with the canonical
role — that is part of the task, not a follow-up.

---

## 3. The three selection rules

Almost every past inconsistency dissolves under these. Apply them in order and
do not deliberate further.

1. **If it is a sentence, it is `body`.** There is no smaller prose size. Not
   for footnotes, not for helper text, not for provenance lines, not for
   "secondary" explanation, not because the card is narrow. If two sentences sit
   in one card they render identically. Reduce emphasis with `tone`, never with
   size.
2. **Size ranks importance; it is never decorative.** Two numbers shown at two
   sizes assert that one matters more. If that is not true, they are both
   `metric`. Never scale text to fill or fit a container.
3. **Semantics pick the element; the role picks the appearance.** `<Heading
   level>` is chosen by document outline, `visual` only when the outline and the
   appearance genuinely diverge. Never skip a heading level to get a size.

---

## 4. How text is rendered

Only `components/saqeel/type/` may declare a typography property. Everything
else composes its primitives.

```tsx
import { Heading, Text, Overline, Mono, Metric } from "@/components/saqeel";

<Overline>Opened from Factory 360</Overline>
<Heading level={2}>{t("factory.riskOutlook.title")}</Heading>
<Text>{t("factory.riskOutlook.explanation")}</Text>
<Text role="label" tone="muted">{t("factory.fields.plantNumber")}</Text>
<Text role="bodyStrong" numeric>{plantNumber}</Text>
<Mono>{modelVersion}</Mono>
<Metric tone="warning">{riskScore}</Metric>
```

`tone` — `primary` · `secondary` · `muted` · `accent` · `success` · `warning` ·
`danger` · `info` · `inverse`. Tone is how you de-emphasise. Size is not.

### 4.1 Banned in feature code, without exception

- `font-size`, `font-weight`, `font-family`, `font-style`, `line-height`,
  `letter-spacing` in any `.css` outside `src/components/saqeel/`
- `font: var(--sqx-text-*)` outside `src/components/saqeel/`
- `style={{ fontSize }}`, `style={{ lineHeight }}`, `style={{ letterSpacing }}`
  anywhere at all
- any reference to `--sqx-text-caption`, `--sqx-text-body-lg`,
  `--sqx-text-title`, `--sqx-text-code`

The four legacy sheets (`tokens.css`, `saqeel-components.css`,
`saqeel-runtime.css`, `v2-components.css`) are frozen and exempt. You do not add
to them; each migrated screen deletes the rules it exclusively owned.

---

## 5. Card anatomy is fixed

Cards are `Card` / `CardHeader` / `CardBody` / `CardFooter` from
`components/saqeel/card`. **Do not hand-roll a card in a CSS module.** The
subtitle-before-title inconsistency was caused entirely by screens building
their own.

`CardHeader` slot order is structural and not negotiable:

```
title  →  description  →  [trailing]
```

- **The title always comes first, and is always the largest text in the card.**
  It is `heading` (20px), `--sqx-text-primary` (white in dark theme). There is
  no "small card" variant.
- **The description always comes second, and is always smaller and quieter.**
  It is `body` (14px), `--sqx-text-secondary`. It never renders above the title,
  in any card, on any screen. A reader must never meet the supporting line
  before the thing it supports.
- Padding is `--sqx-inset-card`, header-to-body gap is fixed by the component.
  You do not override either.

### 5.1 The eyebrow is retiring

`CardHeader` still accepts `eyebrow`, which renders an `overline` **above** the
title. **Do not pass it.** It is the exact pattern the owner rejected: a long
question or category set in 11px uppercase grey, sitting above the title and
read first.

When you find a card passing `eyebrow`, move that string to `description` — it
is almost always a subtitle wearing the wrong slot, and the i18n key already
exists so the move costs nothing.

The prop is kept only so unmigrated screens keep compiling. It is deleted when
no call site passes it.

### 5.2 KPI tiles are not this pattern

A tile whose subject is a number — `Visit pipeline` / **217** — is
**label → value**, not title → subtitle. The label is `label` (12px,
`--sqx-text-muted`); the value is `metric` (28px, primary) and stays the largest
thing in the tile. Do not "correct" a KPI tile by making its label the title:
that demotes the number the tile exists to show. `MetricStrip` is the reference
implementation.

---

## 6. Spacing derives from role

Vertical rhythm is not chosen per screen. Use the stack tokens:

| Relationship | Token |
|---|---|
| Label to its value | `--sqx-space-2` |
| Heading to the content it introduces | `--sqx-stack-tight` |
| Between sibling blocks in a card body | `--sqx-stack-default` |
| Between cards | `--sqx-gutter` |
| Between page sections | `--sqx-stack-section` |
| Card padding | `--sqx-inset-card` |

A gap that is not one of these is a gap you invented. Remove it.

---

## 7. Accessibility floor

- 11px `overline` is the smallest text the application may render, it is always
  uppercase, always short, and never carries a sentence.
- Prose never renders below 14px, in either locale.
- `tone="muted"` is for supporting text on a default surface. It is not
  permitted for the only copy in a container, nor on `--sqx-surface-sunken`
  without a recorded contrast measurement.
- Arabic inherits the `:lang(ar)` line-heights automatically. Never set a line
  height to "fix" Arabic at a call site.

---

## 8. Migration duty of a screen task

When your task touches a screen, that screen leaves your hands fully migrated.
Not partially, not "the parts I edited".

1. Delete every typography property from the screen's CSS modules.
2. Replace the markup with type primitives.
3. Replace hand-rolled cards with `Card` / `CardHeader`.
4. Replace retired-role references with canonical roles.
5. Run `npm run gates:typography`. It must report violations **removed**.
6. Run `npm run gates:typography:update` to lock the improvement into the
   baseline, and commit the baseline change with the screen.

The baseline is a ratchet. It may only ever go down. A task that raises it is
rejected on sight.

---

## 9. Review gate — answer these in the session record

A task touching any user-visible text is not done until these are answered in
writing:

1. How many typography violations did this task remove? (baseline before →
   after)
2. Does every sentence on the screen render at `body`? Name any exception and
   the rule that permits it. (There are none.)
3. Is there exactly one `display` on the route?
4. Are all card titles `heading`, via `CardHeader`?
5. Did you introduce any new size, gap, or padding that is not a token in §2 or
   §6? If yes, the task stops and the gap is raised as a change request — it is
   never filled inline (WEB-002 §2).
6. Did you add any retired-role reference? (Must be no.)

---

## 10. If you believe you need something not in this scale

You do not. In order of likelihood:

- You want smaller prose → you want `tone="muted"`, at `body`.
- You want a smaller card title → you want the card to be nested, or you want
  `subheading` on a group inside the card body.
- You want a bigger number → the number is already `metric`; what you want is
  more whitespace around it.
- You want to fit more in → the container is too small or the copy is too long.
  Fix the layout or the copy.

If after all four you still believe the scale has a genuine gap: **stop the
task**, record the case in the tracker's PARKED section with a screenshot, and
raise it. Do not add a token. Do not add a one-off. Do not ship a literal value
"just for now" — that is how the previous 1,130 violations were created, one
reasonable exception at a time.

---

## 11. Migrating legacy UI — do not redesign the typography

> **This section is addressed to whoever migrates a legacy screen** off the
> pre-Saqeel `--type-*` tokens, off the frozen `.sq-*` globals, or out of an
> oversized route file. Read it before you start. It is the difference between
> a migration that lands and one that gets reverted.

Several screens are scheduled for structural rebuild — `/factories/cr/[id]`
(T-020), `/factories/[id]`, the `field/factory-360/*` surfaces, the orphaned
`DashboardView` and `FactoryList` trees. **Their typography has already been
brought onto the scale by a separate pass.** Your job is the structure. The
typography is done, and it is not yours to revisit.

### 11.1 The rule

**Carry the typography across unchanged. Do not re-decide a single size.**

When you move a section out of a 409-line route file into
`components/sections/<screen>/`, the markup you move already renders correctly:
the headings are `Heading`, the numbers are `Metric`, the prose is `Text`. Move
them as they are.

- Do **not** "tidy" a `Heading level={2}` into an `<h2>` with a class.
- Do **not** replace a `Metric` with a styled `<strong>` because the new
  component "only needs one number".
- Do **not** introduce a `font:`, `font-size`, `font-weight`, `line-height` or
  `letter-spacing` declaration in the new component's CSS module. §4.1 applies to
  new files exactly as it applies to old ones — a rebuild is not a fresh start.
- Do **not** reach for `subheading` because the new card "feels like it wants a
  bigger title". If the size changes, the migration has changed the design, and
  that is a separate decision needing an owner ruling.

### 11.2 Why this is stated so bluntly

Every route in this programme reached the scale by being **rendered and
measured**, not by being read. The sizes you inherit are the result of specific
measurements — several of them counter-intuitive, and all of them recorded:

- `body-strong` (14px), not `subheading` (16px), for a picker row — 16px was
  tried and it put the same factory name at three sizes on one screen (T-064).
- `label` (12px), not `overline` (11px), for table headers and key-value keys —
  `overline` is *only* the eyebrow above a card title (T-059, T-064).
- `metric` (28px) for **every** number, including ones that look like they want
  to be bigger. Two hero figures at two sizes was the owner's original complaint
  and it survived four tasks (T-067).
- `font: inherit` on `<button>`, `<input>`, `<select>`, `<textarea>` — these do
  **not** inherit `font`, and without it they silently render in the UA's Arial
  (T-064). **If your rebuild introduces a new button wrapping text, it needs
  this.**

A rebuild that re-decides any of these reintroduces a defect that took a
measured render to find, and the static gate will not catch it — a legal token
in the wrong place is still legal.

### 11.3 What "done" looks like for your migration

Before and after your change, on the route you touched:

1. `npm run gates:typography` reports **violations removed, never added**. If
   your new component's CSS module has a font declaration, you have gone wrong.
2. The rendered route has the **same set of distinct font sizes** as before, or
   fewer. Measure it — do not read the diff:
   ```js
   new Set([...document.querySelectorAll('main *')]
     .filter(el => el.children.length === 0 && el.textContent.trim())
     .map(el => getComputedStyle(el).fontSize))
   ```
3. Every `<h1>`–`<h4>` still carries a role, and every `id` referenced by an
   `aria-labelledby` still exists on the same element.
4. Answer §9's review gate in your session record, plus one extra line: **"font
   sizes before → after"**. Equal or fewer. Never more.

### 11.4 If the typography genuinely blocks your migration

It sometimes will — a primitive may not yet express what the restructured markup
needs. That happened three times during the `/factories` migration and each was a
real gap (`Text` had no `dir`, `role="alert"` collided with the `role` prop,
`Heading` could not render small). **Extend the primitive; do not work around it
in feature CSS.** Then record the gap in your session record so the next
migration inherits the fix.

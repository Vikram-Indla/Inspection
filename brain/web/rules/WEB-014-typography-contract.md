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
| `display` | 30px | 1.15 | 700 | -0.02em | The page title. **Exactly one per route.** |
| `heading` | 20px | 1.30 | 600 | -0.01em | Card and section titles. The only card-title size in the app. |
| `subheading` | 16px | 1.40 | 600 | 0 | A named group *inside* a card. |
| `body` | 14px | 1.60 | 400 | 0 | **Every sentence of prose, everywhere.** |
| `body-strong` | 14px | 1.60 | 600 | 0 | Emphasis inside body; the value in a key–value row. |
| `label` | 12px | 1.40 | 600 | 0.01em | Form labels, table column headers, the key in a key–value row. |
| `overline` | 11px | 1.30 | 700 | 0.08em | The uppercase eyebrow above a card title. |
| `metric` | 28px | 1.10 | 700 | -0.02em | KPI numerals. Every number in the app is this one size. |
| `mono` | 13px | 1.50 | 500 | 0 | CRs, plant numbers, notice numbers, model versions, IDs. |

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
overline (eyebrow)  →  title  →  description  →  [trailing]
```

- The eyebrow is optional; when present it always precedes the title.
- The title is always `heading` (20px). There is no "small card" variant.
- The description is always `body`. It never renders above the title.
- Padding is `--sqx-inset-card`, header-to-body gap is fixed by the component.
  You do not override either.

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

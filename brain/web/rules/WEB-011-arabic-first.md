# WEB-011 — Arabic First

> Status: **BINDING**.
> This is a Saudi Ministry of Industry and Mineral Resources platform. Arabic is
> the primary language of the people who use it. English is the second language,
> not the source language. **We do not compromise on Arabic.**

---

## 1 · What "Arabic first" means

It does not mean Arabic is translated well. It means Arabic is designed for, and
English is the one that has to fit alongside it.

- A screen is not done when it looks right in English. It is done when it looks
  right in **Arabic**, and English has been checked afterwards.
- Review every new screen in `?locale=ar` **before** review in English.
- If a layout works in one language and breaks in the other, the language that
  gets the compromise is English.
- No feature ships English-only "for now". There is no "for now".

---

## 2 · Every string exists in both locales, in the same commit

- All user-facing text lives in `src/i18n/locales/<locale>/<namespace>.json`.
  Never inline, never `locale === "ar" ? … : …` in a component.
- `Messages` is typed from the English files, so a missing Arabic key is a
  **type error**, not a runtime fallback. Never silence it with a cast.
- A commit that adds an English key without its Arabic pair is incomplete.
- Arabic is **written**, never machine-translated. Arabic word order is not
  English word order with Arabic words in it.

---

## 3 · Arabic punctuation is Arabic

| Use | Never |
| --- | --- |
| `؟` question mark (U+061F) | `?` |
| `،` comma (U+060C) | `,` |
| `؛` semicolon (U+061B) | `;` |
| `«` `»` quotation | `“` `”` |

A question in Arabic ends in `؟`. If the English string is a question, the
Arabic must be a question too — not a noun phrase with a mark bolted on.
"How is this calculated?" is `كيف يُحتسب هذا؟`, not `طريقة الاحتساب؟`.

---

## 4 · Never apply `letter-spacing` to Arabic

Arabic is cursive. Letters join. Any positive or negative tracking severs those
joins and renders a word as a row of disconnected glyphs. This is not a matter
of taste — it makes the text wrong.

`saqeel.css` enforces this globally:

```css
[lang="ar"],
:lang(ar) {
  letter-spacing: normal !important;
}
```

This is the **one** sanctioned `!important` in the design system. It is a script-
correctness guard, so it must outrank every component that sets a tracking token.

Consequences to design around:

- `text-transform: uppercase` does nothing in Arabic. An overline/eyebrow style
  that relies on caps **plus** tracking to read as a label carries neither in
  Arabic — give it weight and colour so it still reads as an eyebrow.
- Never use tracking as the only signal that distinguishes two type roles.

---

## 5 · Layout

- **Logical properties only** — `inline-start`, `inline-end`, `padding-inline`,
  `margin-block`, `border-inline-end`. Never `left`/`right`/`padding-left`.
  The single sanctioned exception is `:dir(rtl)` (WEB-001 §9).
- Direction-encoding icons (chevrons, arrows, back) mirror via the icon layer's
  `mirrored` prop. Icons that do not encode direction never mirror.
- Anything positioned by JavaScript reads `--sqx-mirror` (1 / −1) rather than
  branching on locale.
- Numbers stay LTR inside Arabic text. Keep `font-variant-numeric: tabular-nums`
  on both locales so columns align identically.

---

## 6 · Type and vertical rhythm

- The bilingual voice is **IBM Plex Sans Arabic**, one family for both scripts,
  so metrics stay aligned.
- Arabic needs more leading than Latin. `:lang(ar)` raises the line-height of
  every text role in `saqeel.css`. Never set a fixed `line-height` on a component
  that would clip Arabic ascenders, descenders or diacritics.
- Never clamp Arabic to fewer lines than English to make a card fit. Size the
  container for the Arabic string.

---

## 7 · Truncation and overflow

- Arabic renders longer than English for the same content far more often than
  the reverse. **Test every fixed-width control with its Arabic string.**
- If a label truncates in Arabic, the control is too small — widen the control.
  Do not shorten the Arabic.
- A `title` attribute is not a fix for truncation, it is a supplement to one.

---

## 8 · The review questions

Every diff that touches user-facing text or layout answers all seven:

- [ ] Did I open this screen in Arabic before calling it done?
- [ ] Does every new key exist in both `en` and `ar`?
- [ ] Is the Arabic written, not translated word-for-word from English?
- [ ] Does every Arabic question end in `؟`, every list use `،`?
- [ ] Is any Arabic text receiving `letter-spacing`?
- [ ] Are all physical CSS properties gone — no `left`, `right`, `padding-left`?
- [ ] Does the longest Arabic string fit without truncation?

An unchecked box is a blocker, not a note.

---

## 9 · Why this is a rule and not advice

The people this platform is built for read Arabic. A screen that is beautiful in
English and cramped, clipped or disjointed in Arabic is a screen that fails the
users it exists for — and it fails them invisibly, because the people reviewing
the English build never see it.

The only defence is to make Arabic the first thing we look at, not the last.

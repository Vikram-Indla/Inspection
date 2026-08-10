# WEB-013 — Every user-visible word comes from a locale resource

> Status: **BINDING — no exception at task level.**
> This application is bilingual. Every string a person can read, hear from a
> screen reader, or see in a tooltip lives in
> `apps/web/src/i18n/locales/<locale>/<namespace>.json` — in **both** `en` and
> `ar` — and is loaded by key. No user-visible English or Arabic text is ever
> written inside a `.ts`, `.tsx`, or `.css` file. Not as a default, not as a
> fallback, not "temporarily", not "just this one label".

WEB-011 governs *how the Arabic must read*. This rule governs *where every
string lives*. A screen can satisfy WEB-011's Arabic quality and still violate
this rule by holding that Arabic in a component.

---

## 1 · The rule

**Copy is data. It lives in a resource file. Code refers to it by key.**

```
apps/web/src/i18n/locales/
  en/<namespace>.json      ← the English resource
  ar/<namespace>.json      ← the Arabic resource, same key tree, same shape
apps/web/src/i18n/messages.ts   ← the only loader: getMessages(locale)
```

The only sanctioned read path in new and migrated code:

```tsx
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

const { planning } = getMessages(await getLocale());
// planning.single.title
```

Client components never call `getMessages` themselves — a Server Component
resolves the strings and passes a typed strings object down as props (the
`buildScreenStrings(locale)` / `buildXStrings(locale)` pattern in
`features/<domain>/strings.ts`). Copy resolution is a server concern; shipping a
locale catalogue to the browser is a bundle cost with no benefit.

---

## 2 · Banned, without exception

Every one of these is a blocker on sight, in any file under `apps/web/src/**`:

```tsx
<h2>Plan a single visit</h2>                         // literal copy in JSX
<p>لا توجد نتائج</p>                                  // Arabic literal in JSX
title: "Visit window"                                // literal in a strings object
label={locale === "ar" ? "إلغاء" : "Cancel"}          // inline locale branch
t("plan.single.title", "Plan a single visit")        // English default in code
tr(dict, "nav.planning", "Planning")                 // same, via tr()
const AR_FALLBACK = { "x.y": "…" }                   // a translation map in code
placeholder="Search factory, CR, license…"           // attributes count
aria-label="Close"                                   // a11y strings count
alt="Factory location map"                           // alt text counts
.empty::after { content: "No data"; }                // CSS content counts
"No inspection package is published for this scope." // error/blocker copy counts
```

The rule covers **every** user-visible surface, not just headings:
`aria-label`, `aria-description`, `alt`, `title`, `placeholder`, `label`,
validation and blocker messages, empty/error/loading/unauthorized states, status
and enum labels, toast and notification text, `<option>` labels, chart axis and
legend labels, PDF/report headings, email and SMS bodies, and any CSS
`content:` that renders a word.

**A default is still a hardcoded string.** `t("some.key", "English text")` puts
English in the code and ships it whenever the key is missing — which is exactly
when nobody notices. The English belongs in `en/<namespace>.json`, where a
missing counterpart in `ar/` is a **type error** rather than a silent English
leak into an Arabic screen.

---

## 3 · What is **not** copy

These are machine values and stay in code:

- route paths, query-parameter names, form field `name` attributes
- database enum tokens and status keys (`"pending_supervision"`, `"high"`) —
  the *token* is code, its **label** is a resource key
- correlation IDs, error codes (`PLN-READ-GRANT`), plan/visit references
- `data-testid` values and CSS class names
- typographic separators used as structure, not language: `—`, `·`, `/`
- numbers, dates and currency — formatted through `Intl` with the active locale,
  never assembled from translated fragments

Rule of thumb: **if changing it changes what a reader understands, it is copy.**
If changing it breaks a query, a lookup, or a selector, it is code.

---

## 4 · No namespace for the page? Create one. Both locales. Same commit.

Never hang a screen's copy off an unrelated namespace because a file is missing,
and never leave the strings in the component "until the file exists". Creating
the namespace is four steps and belongs to the task that needed it:

1. **Create `apps/web/src/i18n/locales/en/<namespace>.json`.** One namespace per
   domain, named for it — `execution.json`, `reviews.json`, `compliance.json`,
   `analytics.json`, `admin.json`, `field.json`, `visits.json`. Not per route,
   not per component. Group keys by screen, then by purpose:

   ```json
   {
     "single": {
       "title": "Plan a single visit",
       "loading": "Loading the single-visit planner…",
       "gates": { "met": "Met", "unmet": "Not met" }
     }
   }
   ```

2. **Create `apps/web/src/i18n/locales/ar/<namespace>.json`** with the identical
   key tree and written Arabic (WEB-011 §2 — written, never machine-translated;
   `؟` and `،`, WEB-011 §3).

3. **Register both in `apps/web/src/i18n/messages.ts`** — the import pair, the
   `Messages` type member, and both entries in `MESSAGES`. The type is derived
   from the English file, so once registered, a missing or misspelled Arabic key
   fails `tsc`. That type error is the safety net; never silence it with a cast
   (WEB-000 forbids `as any` / `as unknown as` regardless).

4. **Consume it through `getMessages(locale)`** and, for a client screen, a
   `features/<domain>/strings.ts` builder that returns a typed strings object.

Interpolation uses the `fill()` helper and `{name}` placeholders — never string
concatenation, because Arabic word order is not English word order:

```ts
fill(messages.visits.assignedTo, { name: inspector.fullName })
```

Pluralisation gets explicit keys (`resultOne` / `resultOther`). Arabic has more
plural forms than English; a hand-rolled `n === 1 ? … : …` is wrong in Arabic
and is banned.

---

## 5 · The legacy tree: what you inherit and what you owe

Most of this application predates the rule. Measured on the current tree:

| Debt | Count |
| --- | --- |
| `.ts` / `.tsx` files containing Arabic literals | **177** |
| `t("key", "English default")` call sites | **3,853** |
| `locale === "ar" ? … : …` branches in `components/Shell.tsx` alone | **83** |
| namespaces that exist | 9 (`approvals` `common` `dashboard` `enforcement` `factories` `operations` `planning` `regulations` `shell`) |
| governed routes with **no** namespace | `/execution` `/reviews` `/compliance` `/analytics` `/admin/*` `/field/*` `/visits` |

The legacy `t()` runtime in `lib/i18n.ts` resolves Arabic from the `ui_strings`
database table with in-code fallback maps (`PLAN_MAP_AR_FALLBACK`,
`FIELD_AR_FALLBACK`, …). It is **retiring**. Treat it as read-only history:

- **Never add** a new `t(key, "English")` call site, a new entry to an in-code
  `*_AR_FALLBACK` map, or a new `locale === "ar" ? … : …` branch.
- **Never delete** a `ui_strings`-backed key while code still reads it.

Scope discipline, so this never becomes an excuse to stall a task or to balloon
one (WEB-008 §5):

- **Any string you author, edit, or move is extracted to resources.** Moving a
  hardcoded string from one file to another does not launder it — if your diff
  touches that line, it goes to JSON.
- **A screen migration extracts that screen's copy in full.** "Migrated" means
  the route's namespace exists in both locales and the screen holds no literals.
  A screen migration that leaves copy in the component is not done (WEB-006 §5).
- **Untouched files stay untouched.** Do not open an unrelated legacy screen to
  extract its strings mid-task. Park it on the tracker.
- If extraction is genuinely larger than the task — a 500-line legacy screen
  behind a one-line fix — **say so and park it**, with the file named. Do not
  silently leave new hardcoded copy behind, and do not silently expand the task.

---

## 6 · Finding violations

```bash
# Arabic literals in code (should only ever match locales/**.json)
grep -rnP '[\x{0600}-\x{06FF}]' apps/web/src --include=*.ts --include=*.tsx

# English defaults smuggled through the legacy translator
grep -rnE '\bt\("[a-zA-Z0-9._]+", "' apps/web/src --include=*.ts --include=*.tsx

# inline locale branching
grep -rn 'locale === "ar"' apps/web/src --include=*.ts --include=*.tsx

# en/ar namespace parity
diff <(ls apps/web/src/i18n/locales/en) <(ls apps/web/src/i18n/locales/ar)
```

Key-tree parity between `en` and `ar` is enforced by the `Messages` type at
compile time — `npm run typecheck` is the gate, and it must be green before any
task is called done.

---

## 7 · Review gate

Every diff that touches user-visible text answers all of these:

- [ ] Does any file I changed contain an English or Arabic word a user can read?
- [ ] Does every new key exist in **both** `en/` and `ar/`, with the same tree?
- [ ] Did I add a namespace file rather than borrowing an unrelated namespace?
- [ ] Is the new namespace registered in `messages.ts` (import, type, `MESSAGES`)?
- [ ] Did I avoid introducing any new `t(key, "English")`, `*_AR_FALLBACK`
      entry, or `locale === "ar" ? … : …`?
- [ ] Is interpolation done with `fill()` and `{placeholders}`, never `+`?
- [ ] Is the Arabic written by a human, with `؟` and `،` (WEB-011 §3)?
- [ ] Did I open the screen in Arabic before calling it done (WEB-011 §1)?

An unchecked first or second box is a blocker, not a note.

---

## 8 · Why this is absolute

A hardcoded string is invisible debt. It does not fail a build, it does not
throw, and it does not look wrong to a reviewer reading the English. It surfaces
only in front of an Arabic-speaking user, as one English word in the middle of
their screen — and by then it is scattered across 177 files and nobody can find
them all.

The resource file is also the only place a translator, a reviewer, or the
Ministry can *see* the copy. Text buried in a component cannot be reviewed by
the people who own the words, cannot be corrected without a code change, and
cannot be proven complete. Keys make coverage checkable; literals make it a
matter of hope.

# 01 — Project Status

`Last updated: 2026-08-17` · `Updated by: T-132 — type scale repoint`

## The typography divide is closed, and the risk was where nobody looked (2026-08-17)

T-132 repointed the frozen `--type-*` scale at `--sqx-text-*`. One file, no
component touched, and the app now has **one typeface, one scale and one palette
across migrated and legacy routes alike**.

T-131 flagged the **heading jumps** (17→24px, 22→32px) as the danger. Measuring
consumption first showed they are ~32 call sites, while the real mass is
**208 consumers below 13px** — `--type-caption-font` alone has **105**:

```
caption-font 105 (12px) · micro 76 (11.5px) · body-strong 39 · compact-size 29
body-font 22 · label-size 18 · heading-lg 15 · title 11 · display 6
```

**Count the consumers before you rank the risk.** The scary-looking change was
marginal; the boring one was the whole job.

Result, measured: `/factories` renders 13 · 15 · 20 · 24 · 32 with a 13px floor
and weights ≤ 590; **zero elements past the viewport at 960px, and at 320px the
document scrollWidth is exactly 320.** Arabic keeps the same sizes with looser
leading (1.55 / 1.80) because `tokens.css`'s RTL block overrides line-heights
only, never sizes — the one thing most likely to have broken.

## Aliasing a pinned value beats swapping it (2026-08-17)

Four specs across T-131 and T-132 pinned literal values in `tokens.css`
(`--font-body: var(--font-plex-arabic`, `--type-display-size: 28px`,
`--type-page-title-size: 22px`, `--type-body-size: 14px`). Every one was
**strengthened rather than edited down to whatever shipped**: they now assert the
frozen sheet *aliases* the design system, plus that `saqeel.css` holds the
approved value. That fails if the frozen sheet ever re-acquires an independent
scale, which the literal could never detect.

Two of those assertions carried comments asserting the *previous* decision —
"SAQEEL scale supersedes 32px", "14px body supersedes 16px minimum". Those are
now false. **When you re-point an assertion, re-read its comment: a stale comment
on a passing test is worse than a failing one.**

## `next/font`'s synthetic fallback silently ate Arabic for two tasks (2026-08-17)

`--sqx-font-sans` named `inter, plexArabic, …` and looked correct. It rendered:

```
stack in the DOM   inter, "inter Fallback", plexArabic, "plexArabic Fallback", …
Arabic measured    49.81px   ← a local system face
Plex would be      55.33px
```

`next/font` synthesises an **`"<name> Fallback"`** face from a local font and
inserts it immediately after the real one. That synthetic face **carries
Arabic**, so it captured every Arabic glyph before the chain ever reached Plex.
**Arabic rendered in the wrong face, with the wrong metrics, on every migrated
route from T-129 until T-131** — while the stack still named Plex.

Fixed with `adjustFontFallback: false` on the Inter loader: Arabic now measures
55.55px, Latin 101.61px ≡ Inter.

**Nothing could have caught this by reading.** The stack was right, Latin was
right, the typography gate checks declarations rather than rendering, and
T-129's own Arabic pass measured letter-spacing and digit shape — not the
typeface. **Measure each script separately; Latin passing tells you nothing
about Arabic.**

## The legacy routes already had the new palette (2026-08-17)

T-131 opened as "migrate ~80 legacy routes" and found the job mostly done:
`tokens.css` holds **149 custom properties, 64 of which already alias
`--sqx-*`** and 4 of which carry a raw value. T-129's palette reached every
legacy route the day it landed.

What was left was typography — and it split cleanly in two. The **typeface** was
two token lines. The **sizes** (14px body vs 15px, 28px display vs 32px) are
layout-affecting across ~80 routes and were deliberately deferred rather than
bulk-edited.

**Measure the gap before scoping the sweep.** The route-by-route plan would have
been eighty tasks for a job that was two lines plus one deferred decision.

## A token that resolves to `none` poisons a comma list (2026-08-17)

`card.module.css` declared `box-shadow: var(--sqx-shadow-card), var(--sqx-rim-light)`
and `--sqx-rim-light` is `none` in **both** themes. `none` is only valid as the
*sole* value of `box-shadow`, so the declaration was invalid and dropped —
**every Card in the application has been rendering with no box-shadow at all.**

```
inset 0 0 0 1px #23252A, none   →  computed: none
inset 0 0 0 1px #23252A         →  computed: rgb(35,37,42) 0 0 0 1px inset
```

Nothing looked wrong, because the card's `border` was already drawing the single
hairline the language wants. It would have looked wrong the moment anyone gave
`--sqx-rim-light` a value: every card would have silently gained a doubled edge.

**A CSS custom property is not inert when it resolves to a keyword.** If a token
can be `none`, it cannot sit in a comma-separated list.

## A contrast check is only as good as its background resolution (2026-08-17)

Two false failures in two tasks, from opposite directions:

```
T-129  selected segment read 1.3:1   the lime pill is a SIBLING span — walking up misses it
T-130  11 pills read 4.16:1          the rows were inner label spans whose own bg is transparent,
                                     and transparent parses to black
```

Resolved to the nearest **painted** ancestor, the real numbers are 4.61 and
10.22, and the page measures **0 failures across 302 elements**. T-130 nearly
"corrected" a palette that was already correct; what stopped it was recomputing
the same pair three ways — from hex, from the computed strings, and live — and
getting 4.61 every time.

**Never compare against a transparent element's own background, never assume the
painted surface is an ancestor, and re-measure a failure before fixing it.**

## The no-literals rule is what let art direction change in one file (2026-08-17)

T-129 replaced the entire visual language by retargeting **128 values in
`saqeel.css`**. **254 files consume `var(--sqx-*)`; none was edited**, and 28
migrated routes adopted the new language for free. `/operations` was verified
rendering it having never been opened.

The rule had always been justified as tidiness. It is actually the thing that
lets the system survive a change of art direction, and WEB-002 §1 now says so.

**The corollary is the warning:** a component holding one hardcoded value opts
that route out of the *next* change, silently.

## A theme-asymmetric token is invisible unless both themes are measured (2026-08-17)

`--sqx-text-link`, `-accent`, `--sqx-action-tertiary-text` and
`--sqx-segment-label` pointed at pale lime **in the dark block only**, so links
rendered chromatic — against the rule written in the same session. The light
block was already neutral and correct, **which is exactly why it survived**:
every check that looked at light passed.

Same shape one level up: **white ink on a lime fill measured 1.1:1**, because
repointing brand to a *light* colour broke every token that assumed "brand fill
is dark, so ink is white".

**Measure both themes, or measure nothing.**

## An ancestor walk is not a background test (2026-08-17)

A contrast scan reported the selected segment at **1.3:1** and was wrong. The
lime pill is a **sibling `<span>`** that slides behind the segment, so walking
the ancestor chain for a non-transparent background finds the graphite root and
misses the pill entirely. `::before` / `::after` were empty too.

When a design paints selection with a sliding indicator, query for the painted
colour rather than walking up — and re-check a "failure" before fixing it.

## `inline-flex` inside a column flex container is full-width, and it looked like a design choice (2026-08-17)

Owner-reported on `/dashboard`: every status label — *Not configured*,
*Unavailable*, *Decision required* — rendered as a **full-width bar** instead of
a chip. The badge was `display: inline-flex`, which reads as "hugs its content",
but a flex item's cross size defaults to `stretch`, and in a **column** container
the cross axis is the inline one.

```
before   badge 225px in a 225px card
after    badge 118–145px in a 225–257px card
```

**Fixed with `inline-size: fit-content`, not `align-self: flex-start`** — the
latter fixes the column case and silently breaks baseline alignment wherever the
same primitive sits in a row. Applied to `Badge` and `Button` so the whole class
is closed at the primitive.

**No gate can see this**, and it does not look like a bug in a screenshot — it
looks like a deliberately full-width status strip.

## Two features vanished again, and again only the T-111 audit saw them (2026-08-17)

T-128 rebuilt `/dashboard` and dropped **`ExecutiveBrief`** and
**`SearchResults`** without noticing. Typecheck, lint, typography, v5 and the
408-test static suite were all green on the result.

`ExecutiveBrief` carries `MVP2-REQ-0056,MVP2-REQ-0057,SCR-WEB-010`, so removing
it is a **contract change, not a design one** (T-109). `SearchResults` is the
only thing that renders for `?q=`, so the topbar search would have gone silently
dead.

This is the fourth instance of the same shape — T-111, T-124, T-126, now T-128.
**The audit is the only control that has ever caught it:** diff the *old*
component tree against the new, because a screen's feature set is visible only in
its previous version. It is now cheap enough that there is no excuse:

```
ls the old component directory  →  18 live components
grep the new tree for each      →  2 with no counterpart
```

## A categorical palette is three colours, twice now, for measured reasons (2026-08-17)

The Linear reference offers six accent colours. Run through contrast-as-fill and
pairwise ΔE with deutan/protan simulation, **three survive**:

```
iris ~ lavender     ΔE 1.6 deutan     indistinguishable
green ~ red         ΔE 5.8 deutan     the classic pair
acid-lime           1.23:1 on light   invisible as a fill
signal-teal         2.41:1 on light   fails
```

`iris`, `pulse-green` and `fog` are ≥3:1 as fills in **both** themes with a
minimum pairwise ΔE of 19.7. **SAQEEL's own palette capped at three for the same
reason** — this is not a quirk of one system, it is what a two-theme categorical
scale costs. A fourth category folds into a rest slot or facets.

## A style reference is not a design system until someone measures it (2026-08-17)

T-127 built `/admin/planning/expiry` in the experimental Linear language at
`apps/web/experimental/`. **Two of its own specifications fail WCAG AA**, and
both were found by measuring the rendered page, not by reading the palette:

```
badge spec   rgba(255,255,255,0.05) ground + #8a8f98 text   3.25:1   FAIL at 13px
"muted body text" role   ash #62666d on void                3.45:1   large-text only
```

The badge number is the nastier one: **the tint lightens the ground**, so a pair
that measures 5.86:1 on the card measures 3.25:1 inside the badge. A palette
check against surface colours would have passed it. **Composite the alpha against
the real ancestor chain, or the number is fiction.**

Three more results worth carrying forward. **The light theme needed no invention
— the ladder inverts**: `fog` is muted text on dark, `ash` is muted text on
light, `graphite`/`smoke` hairlines become `bone`/`mist`, all from the reference's
own 16 colours. **The accent survives both themes only as a fill**: `#e4f222` is
1.23:1 as text on white and 16.15:1 as a fill with near-black ink. And
**decorative hairlines are not control borders** — `graphite` on `void` is 1.30:1,
correct for a divider under 1.4.11 and insufficient for an input edge.

## Four token names collided with the frozen sheet, and a `:root` block would have hit every route (2026-08-17)

`apps/web/experimental/variables.css` defines `--radius-sm`, `--radius-md`,
`--shadow-sm` and `--shadow-md` — **all four already exist in `src/app/tokens.css`**.
Dropped into `:root` as written, an experiment scoped to one route would have
changed radii and shadows application-wide.

**Prefix and class-scope any parallel token set before it renders once.** T-127
uses `--lnr-*` on a wrapper class, so deleting the directory removes the
experiment completely. Also discarded: `experimental/theme.css` is a **Tailwind
v4 `@theme` block** duplicating `variables.css` verbatim, and this repo has no
Tailwind (WEB-002 §3).

## A font claim is a width measurement — and the headline typeface is not rendering (2026-08-17)

T-095's rule paid out again. The experimental system's identity is *"Inter
Variable with cv01, ss03 and zero on"*; measured:

```
as declared   500.20      ← identical to Plex Arabic: that is what renders
plexArabic    500.20
Inter         435.25      ← absent, not resolving
```

`app/layout.tsx` self-hosts IBM Plex Sans Arabic **deliberately**, so the build
never depends on a Google fetch — which means Inter cannot simply be linked; it
must be self-hosted the same way. **Anyone judging the experiment today is seeing
its colour, spacing, shape and hierarchy in the ministry typeface, not its
typography.** Say so before asking for a verdict.

## `hasText` is a substring match, and `cd-044` was one version away from failing (2026-08-17)

`section(page).locator("tr", { hasText: "v1" })` matches any row containing
`v1` — including `v10`. The spec's own create-version test grows that section on
every run and it is **already at v9**, so the next run fails Playwright strict
mode with an error indistinguishable from a migration regression.

**Found only because the rebuilt page was read in the browser.** Re-pointed to an
exact cell match. Worth a sweep: any `hasText` carrying a short prefixed
identifier (`v1`, `P1`, `R1`) has this defect latent in it.

## A component that compiles, typechecks and passes every gate can still be rendered by nothing (2026-08-16)

T-124 rebuilt `/admin/packages` and **stopped rendering two components**.
`NewDraftForm` and `TemplateRegistry` kept compiling, kept typechecking, kept
passing lint, typography and v5. Nothing pointed at them.

```
git show <base>:page.tsx  →  NewDraftForm  TemplateRegistry  + 6 others
grep the new sources      →  6 others
```

`PublishControls.tsx:90` is the only path to `createDraftVersion`, so for two
sessions **a writer could not create a version for an existing package** —
exactly the state the "No versions" filter selects for. T-124's record certified
"no functional regression."

**Every gate in this repo asks whether the code is well-formed. None asks
whether it is reachable.** WEB-008's first standing sweep is the one that does —
*diff what the page loads against what it renders* — and it is the two-line grep
above. Run it on any task that moves a render tree, and run it **before**
claiming no regression, not after review.

## `getBoundingClientRect()` is not a visibility test (2026-08-16)

T-126 measured the rebuilt register and read **12 visible required fields** on a
page whose forms are all inside closed disclosures. `checkVisibility()` reports
**0**, and it is right: content under `content-visibility: hidden` keeps a
layout box and a non-null `offsetParent` while being unrendered and unfocusable.

**Ask the browser the question you mean.** `checkVisibility({ checkVisibilityCSS: true })`
for "can the user see it", rects only for "how big is it".

The same session twice read a **mid-compile dev-server state as a defect** — a
second `<main>` from the loading boundary, and a route that looked wedged. Both
were gone on a settled load. **Re-measure before filing; a dev server mid-compile
is not evidence.**

## "The static suite is unchanged" does not mean the pinned specs still pass (2026-08-16)

T-124 ran the WEB-008 sweep, found **9 specs** pinned to `admin/packages`,
concluded none needed re-pointing, and verified it by running
`npm run test:static` before and after — **408 passed both times**. The
conclusion was wrong: it had broken **ten** assertions in
`cd-008-009-packages.spec.ts` — T-125 found and re-pointed all ten.

**The sweep worked. The verification did not.** That spec is not in
`playwright.static.config.ts`'s hand-maintained allowlist, so the static suite
was never going to execute it — and the spec cannot be run here at all, because
its describe block needs a browser this workstation does not have.

```
sweep says      9 specs pinned
static covers   only the ~70 in the allowlist
therefore       "static unchanged" ⊅ "the pinned specs pass"
```

**When a sweep names a spec the static config does not run, check the assertions
directly** — read the file and grep the strings against the new source. That is
a five-line script and it is the only thing that settles it while the browser
half of the suite is blocked (T-119).

## A collapsed `<details>` is a visual fix, not a payload fix (2026-08-16)

T-124 took `/admin/packages` from eleven simultaneously-expanded publish-impact
reports to eleven collapsed disclosures. The screen reads completely differently.
**The document is still ~498 KB**, because `<details>` hides content, it does not
withhold it.

**Say which one you fixed.** Collapsing is the right first move — it costs
nothing and it is what the reader experiences — but a task that reports
"decluttered" while the payload is unchanged has answered a different question
from the one WEB-005 asks. Genuine deferral needs the content to not be rendered
at all, which for per-row detail means a server action.

## Charts: sometimes the honest answer is none (2026-08-16)

T-124 judged six chart candidates for `/admin/packages` and built **zero**.

```
10 packages · 11 versions · 9 items
version status   9 published / 2 draft / 0 locked   2 non-zero, one dominant
items in use     denominator 9                      the sentence says more
by scope         free text, not a governed enum     charting invents a taxonomy
items/package    10 bars of config counts           nothing a designer can act on
```

**A configuration workbench is not an analytics surface.** The reader's job is
to assemble and publish a package, and no distribution helps with that. The two
gauges on `/admin/localization` earned their place because they were governed
ratios that changed what the reader understood — that is the bar, and it is
worth failing openly rather than shipping a gauge on a denominator of nine.

## A filter is not a partition (2026-08-16)

T-124 rebuilt the package states as mutually exclusive, so a package holding
**both** a current publish and an open draft counted only as published — and the
Draft filter read **0** where the old screen said **2**.

Mutual exclusivity is right for a *badge* and wrong for a *filter*: filters are
views, they may overlap, and they do not have to sum to the total. `draft` now
means *has an open draft*, which is the question a configuration author actually
asks. **No gate can see this** — it was found by comparing the rendered count
against the screen being replaced, which is the audit T-111 established.


## A screen can ship 1,821 rows to draw 12, and nothing will tell you (2026-08-16)

`/admin/localization` kept search, filter and pagination in `useState`, so the
entire `ui_strings` dictionary was serialised into the document for the client to
slice:

```
document        755 KB → 336 KB     rows in payload  1,845 → 41
```

**No gate can see this.** Typecheck, typography, lint and the design-system gate
were all silent; the number appears only if you measure the response. WEB-004's
ladder already put URL state above `useState` and WEB-005's budgets already made
755 KB indefensible — the rules were right and nothing enforced them.

**The measurement is one line and belongs in every migration inventory:**
`fetch(route).then(r => r.text()).then(h => h.length)`. A route whose document
runs to hundreds of KB is paginating in the wrong place.

**Second-order consequence worth expecting:** once the client stops holding the
rows, anything it used to *build* from them breaks. CSV export was
`document.createElement("a").click()` over the in-memory array; it became a route
handler, which is better on every axis — no DOM mutation, no JavaScript, and the
file now honours the current filter rather than client memory.

## `CountBadge` cannot localise its own number, and five screens are wrong today (2026-08-16)

T-123 shipped Latin digits into the Arabic filter tabs from one line —
`<CountBadge value={counts[filter]} />`. Fixed with `formatCount`, and the
Arabic page now measures **0 Latin-digit nodes**. The instance is trivial; the
class is not.

`CountBadge` renders `{value}` verbatim and accepts `number | string`, so **every
caller passing a number ships Latin digits under Arabic**:

```
regulation-authority-nav  value={total}          /regulations
review-tabs               value={tab.count}      /reviews/[id]
factories-scope-bar       value={shown}          /factories
more-filters              value={activeCount}    /planning
approval-request-rail     value={entries.length} approvals queue
```

**The fix that closes the class is a one-word API change**: narrow `value` to
`string`. It already accepts one, so the compiler then finds all eleven call
sites for you. This is T-114's `Donut` ruling applied again — a design-system
primitive must not acquire a locale, so it must be handed text that is already
formatted.

## Charts: the honest answer is usually fewer than the data suggests (2026-08-16)

T-123 judged six candidates and built two.

```
built     Arabic coverage 99%  ·  Reviewed 0%     two Gauges, two governed ratios
declined  status distribution  5 states, 2 non-zero, one at 98.7%
declined  donut of statuses    same skew, Donut caps at 3
declined  activity over time   updated_at is last-touched, not an event log
declined  length histogram     bands past the existing 1.3 ratio would be invented
```

The pair earns its place because together they say what the screen hid:
**everything is translated and nothing is reviewed.**

**The reusable test is the one T-113 and T-115 already used:** count the non-zero
categories before choosing a form. Two non-zero states, one at 98.7%, is not a
distribution — it is a headline and a footnote.


## `shell-page-frame` was the route-owned frame all along (2026-08-16)

T-122 needed a frame that owns the page gutter. It built one — and two thirds of
it already existed. **`shell-page-frame` has sat at zero importers since T-004**,
which `05-RETIREMENT-LEDGER.md` records as its *expected* state, and it already
implements the gutter clamp, the breadcrumb, the title and the description.

```
padding-inline: clamp(var(--sqx-page-inline-sm), 4vw, var(--sqx-page-inline))
measured on /admin/access   0px / 0px  →  32px / 32px
```

`access-frame` composes it and adds only what is route-specific. **This is the
swap the ledger has prescribed all along and the first one anyone has taken.**
The next migration should reach for it before writing a `padding-inline`.

**Corollary worth generalising: `app-shell`'s `.main` has no padding**, so a
route that supplies none sits flush against the viewport edge. That is a
one-line shell fix serving every route at once, and it was deliberately **not**
taken — the owner's brief said not to touch the shell.

## Checking the payload is not checking the render, and it cost two rounds (2026-08-16)

T-122 wired a secondary line into two dropdowns and verified it by asserting the
**RSC payload** carried `{label, note}` for all 30 options. It did. The rendered
result was `Manage Access Grantsadmin.access.manage` — `MenuRow` puts `note`
inside `.label` as a bare `<span>` with **no margin, no separator and no
display**, so the two strings concatenate.

**The owner found it by looking; the payload check could never have.** This
document already says *render it and look at it* (T-090 … T-097, four tasks),
and the check that was run was one level short of that: it proved the data
reached the component, not that the component drew it.

**A prop is verified when it is measured on screen.** For a menu, that means
opening it in the pane and reading `getComputedStyle`, not reading the flight
data. The measurement that settles it:

```
before  note display inline · onOwnLine false · rows concatenated
after   note display block  · onOwnLine true  · row height 40px
```

**`.note` was broken for its own documented purpose too** — the TSDoc calls it
"a short reason shown beside a disabled label", which would have rendered
`Riyadhoption Not available`. It has exactly two consumers (`Select`, itself),
so nothing else was relying on the old behaviour.

## A hyphenated JSX attribute is never type-checked, so `aria-*` on a primitive silently vanishes (2026-08-16)

T-122's first `Breadcrumb` put `aria-current="page"` on `<Text>`, whose prop API
is deliberately closed (WEB-002: no escape hatch). **TypeScript accepted it and
the attribute never rendered** — JSX attributes containing a hyphen are exempt
from prop-type checking. `tsc` clean, gates green, and the current page unmarked
in the accessibility tree.

**No check in this repository can see this.** It was found by reading the
rendered markup. The rule: an `aria-*` or `data-*` prop on a design-system
primitive is a no-op unless that primitive declares it — put it on an element you
control, or extend the primitive deliberately.

## `usePathname()` disagrees with the server wherever middleware rewrites (2026-08-16)

Owner-reported hydration error on `/admin/access`, and it predates the migration
that surfaced it. `AdminScreenRegistry` matched `usePathname()` against a table
of unprefixed routes:

```
server   /admin/access      ADM-S01        middleware rewrites /en/admin/x → /admin/x
client   /en/admin/access   ADM-UNMAPPED   usePathname() reads the browser URL
```

Every `/admin/*` route reached with a locale prefix hydrated mismatched. Fixed
with `stripLocale(usePathname())` — the helper already existed for exactly this.
**Any client component in this app that branches on `usePathname()` has the same
defect**, because the locale prefix is stripped by middleware on every route.

**Found while checking it: the `/ar/` path prefix does not switch the locale at
all** — `/ar/dashboard` and `/ar/analytics` both render `lang="en"` `dir="ltr"`
in a session whose `locale` cookie is `en`, though `middleware.ts` reads
`pathLocale` **before** the cookie. Platform-wide, pre-existing, and unrelated to
any current task — but it means **a path-prefixed Arabic URL is not a way to
review Arabic**; use the language toggle.

## The 146-spec tax arrived on the very first migration after it was predicted (2026-08-16)

T-119 recorded that 146 of 252 specs assert the spelling of source files, and
that every migration would break the ones pinned to its markup. T-122 broke
**two**, and only one was found by the pre-flight sweep — the other surfaced as
3 new static failures after the code was already written.

**The sweep missed it because the grep was route-path-shaped** (`/admin/access`)
and the spec's assertions are file-path-shaped. **Add "grep `e2e/` for the source
paths, not the route paths" to every migration inventory** — it is one command
and it is the difference between re-pointing a spec deliberately and discovering
it in a failure list.

## A gate banner nobody gated (2026-08-16)

`/admin/access` rendered *"Role changes are guarded and audited — every write is
checked again on the server"* **unconditionally**, to read-only viewers who
cannot write at all. Not a fabrication like T-110's outage banner, but the same
family: **a reassurance about a capability the reader does not have.**

Found by asking, per surface, *who is this sentence for?* — which also collapsed
**six restatements of three facts into one role-aware card**, and deleted a
"Reconstruction note" that was **internal build commentary rendered to ministry
users**.

## `npm run lint` exists now, and it is a ratchet because it had to be (2026-08-16)

ESLint 9 flat config expressing WEB-000, with the rule citation in every
message. **A fresh run reports 8,114 errors**, so a threshold gate would have
been red on day one — the exact defect already recorded against `npm run gates`.
`check-eslint.mjs` mirrors `check-typography.mjs` key-for-key, and **WEB-014 §8
carries over verbatim: the baseline may only go down.**

```
web/no-comments 7,334 · no-restricted-syntax 413 · non-null 123 · max-lines 97
```

**Migrated code is nearly clean, which is why enforcement costs nothing today:**
`max-lines` is **already 0** across the design system, `features/*`, `i18n`,
`lib` and every migrated section, and **`jsx-a11y/alt-text` is 0 across all 814
`.tsx` files**. The debt is 90% comments, densest in `/field` and `i18n + lib`.

**Two rule tallies were artifacts, and both are findings:**

```
189  <Text role="bodyStrong">   SAQEEL's typography `role` prop collides with ARIA
124  useT()                     an async SERVER helper named like a React hook
```

The first is fixed with `ignoreNonDOM`. The second is demoted to `warn` because
**the rule is right and the name is wrong** — renaming `useT` across 81+ call
sites is its own task.

**The ratchet was proved by injecting a defect, not by reading an exit code.**
Probe with a `let`, an `as unknown as` and a needless binding → exit 1, all three
named with citations → probe deleted → PASSED. The injection was confirmed to
have landed (T-090/T-107's shape, hit four times before).

## There are two `package.json` files and nothing links them (2026-08-16)

The repository root and `apps/web` are **separate npm projects with no
`workspaces` field**. T-121's install landed at the root and had to be undone.

**Use `npm --prefix apps/web` for every npm command in this repository.**

## CORRECTION — `/field` was never blocked by a token override (2026-08-16)

**The entry below headed *"`/field` is a second design system, and the baseline
does not know it"* is wrong on its central claim, and it has been holding back
43% of the typography baseline since 2026-08-12.** It states that migrating
`/field` is work against a live override because `public/saqeel-ds` redefines the
tokens the primitives consume. Measured, both directions:

```
tokens defined by public/saqeel-ds/**       113
tokens defined by src/app/saqeel.css        479
  ↳ intersection                              0     ← the claimed override
tokens of the FROZEN src/app/tokens.css
  ↳ intersection                            109     ← the actual one
occurrences of "sqx" in public/saqeel-ds      0
```

The primitives consume `--sqx-*`. The parallel system **has never heard of
them** — it overrides the frozen legacy sheet, which is being deleted anyway.
`saqeel.css` is imported at `src/app/layout.tsx:2`, above `/field` like every
other route.

The parallel sheet styles **element** selectors (`body`, `h1`–`h6`, `p`, `a`,
`::selection`); a primitive's CSS Module **class** beats all of them on
specificity, load order irrelevant. So it governs bare elements and legacy `t-*`
classes — *exactly what a migration removes* — and stops governing each element
the moment that element becomes a primitive. **The migration is incremental and
self-limiting; the `<link>` comes out last, not first.**

**The measurement still owed** (this is a specificity argument, and T-095's rule
is that a font claim is a width measurement or it is a guess): one computed-style
read of a primitive on `/field` against the same primitive on `/dashboard`.
Blocked only on an Inspector session — see below.

## The whole e2e suite is unrunnable, and it is not the production build (2026-08-16)

Three separate causes, found while closing T-111 … T-117's owed e2e:

```
browsers    npx playwright install never run — chromium-1228 has no binary
credentials SAQEEL_TEST_PASSWORD and SAQEEL_TEST_<ROLE>_EMAIL unset; no .env.local
specs       146 of 252 assert the spelling of source files
```

Every spec in the `e2e` project depends on `auth.setup.ts`, and `personas.ts`
fails closed on the missing password, so **nothing authenticated runs at all**.

**Correction to a standing assumption:** the suite does *not* need a production
build. `playwright.config.ts` runs `node .next/standalone/server.js`, but
`reuseExistingServer` defaults on and reuses a dev server on 127.0.0.1:3000.
**WEB-006 §3 does not block e2e — missing credentials do.**

**The structural cost, which matters most for the migration about to scale up:
146 of 252 specs assert source text.** Every screen migration breaks the ones
pinned to its markup, nothing re-points them, and the red is indistinguishable
from a real regression. A spec asserting `className="kpi-grid"` proves nothing
about what a user sees — the class of assertion T-063 and T-078 each retired
once already.

## A guard can fail on Windows and pass on CI, for reasons unrelated to what it guards (2026-08-16)

`platform-design-system-contract.spec.ts` compared `path.relative(root, file)`
against `"src/app/layout.tsx"`. On Windows that is `src\app\layout.tsx`, so
**two tests failed on a workstation and passed on Linux CI**, and the message
pointed at the design system rather than at path separators.

Repairing it exposed a real finding no gate can see: **`src/app/global-error.tsx`
carries 7 literal hex colours.** It is **allowlisted rather than stripped** — it
renders its own `<html>`/`<body>` for the case where the root layout itself
threw, so no stylesheet is guaranteed loaded and no `var(--sqx-*)` is guaranteed
to resolve. Same argument that admits `layout.tsx`; the only other such file.

## Two committed files still carry plaintext credentials (2026-08-16)

```
scripts/verify-admin.mjs:8        admin@mim.gov.sa   1 password
scripts/audit-v5-a11y.mjs:14-19   five personas      5 passwords
```

`e2e/personas.ts` was deliberately rewritten to remove exactly this, and its own
header explains the consequence: **the values are in git history, so this needs
rotation, not deletion.** Neither file was wired into an npm script by T-118.

## `verify`, `lint`, `test`, `unit`, `budgets` now exist — two of them cannot pass (2026-08-16)

Closing the gap this document recorded on 2026-08-14. **`lint` is a failing stub
because ESLint is absent, not unwired** — no dependency, no config, no binary,
and `next lint` is gone in Next 15, so a script cannot create a toolchain.
**`budgets` is a failing stub for a structural reason**: WEB-005 §1's numbers
come from a production build, which is human-only, so it is a measurement
request and can never be an agent command. `verify` excludes both deliberately —
a permanently red `verify` is an ignored one.

**`npm run gates` is still red for everyone** at the same 77 pre-existing
`check:design-system-v5` findings. Nobody can satisfy WEB-006 §5.

## `toLocaleString("ar")` returns Latin digits. Only `"ar-SA"` returns Arabic ones (2026-08-15)

```
(58).toLocaleString("ar")     "58"
(58).toLocaleString("ar-SA")  "٥٨"
```

The bare `ar` tag defaults to `latn` numbering. This is the entire defect behind
**49 Latin-digit nodes on the Arabic `/analytics`**, and it is nastier than a
missing formatter, because `value.toLocaleString(locale)` **reads as
locale-aware code**. Two call sites looked already-correct and were not.

Worse in `metric-registry.ts`: `const count = v => v.toLocaleString("en")` —
hardcoded, so every count on the route rendered English digits in both locales,
with *"factories"* and *"inspectors"* as English literals inside the format
functions.

**Every number now goes through `i18n/numbers.ts`**, the parallel of
`lib/dates.ts`. Any `toLocaleString` outside it is a defect; a gate rule matching
a bare `ar` tag is cheap and is not written yet.

## A kind derived from a rendered string breaks when you translate the string (2026-08-15)

`features/analytics/view.ts` classified every metric with:

```ts
kind: display.endsWith("%") ? "rate" : "count"
```

Arabic renders `٪٣٤٫٥` — the sign leads. So localising the percent sign would
have made that test false for **all ten rates and silently moved them into the
counts band**, restructuring the page in one locale only. Nothing would have
failed; the screen would simply have been wrong in Arabic.

Replaced with `isRateMetric(key)`, derived from the formatter each registry entry
already declares. **The lesson generalises past i18n: a branch that reads
rendered output is a branch that breaks the first time presentation changes.**

## Absence is not the only thing a screen discards — distributions are too (2026-08-15)

Three routes in a row have now been found rendering a total while holding its
breakdown:

```
/dashboard   217 rendered   pipeline held cancelled 117 · published 52 · draft 40 · returned 8
/operations    4 rendered   states held new 24 · submitted 15 · prepared 10  = 49 in scope
```

On `/operations` the `counts` object was already **passed into the component and
indexed twice**; the other five states travelled the whole way and were dropped.

**Before designing a chart, diff what the data layer computes against what the
screen renders.** Both of these were free — no new query, no new RPC — and both
were invisible until someone read the model rather than the markup.

## RTL inverts `text-anchor`, and it broke every Arabic bar chart for a whole task cycle (2026-08-15)

`BarSeries` sets `text-anchor: end` on its axis ticks. The SVG inherits
`direction: rtl` from `<html dir="rtl">`, and **`text-anchor` is resolved against
the inline base direction**, so "end" became the left side and Arabic labels
extended *rightwards* from the axis, straight under the bars:

```
/analytics ar   label 168 → 203    bar starts 176    OVERLAP
after fix       label 103 → 168    bar starts 176    7px clear
```

The same on the value labels — `١١٧` occupying 669-682 against a bar ending 677.
Fixed with `direction: ltr; unicode-bidi: isolate` on `.tick` and `.value`.

**It shipped with T-111 and survived that task's whole review.** No gate can see
it: the CSS is legal, the typography is legal, the markup is correct, and the
English render is perfect. It is only visible as a *measurement of two bounding
boxes in RTL* — which is now the check any chart primitive owes before it is
called done.

**Caveat recorded rather than hidden:** `direction: ltr` is right for pure-Arabic
labels and could misorder one that mixes scripts at its boundary. The
direction-aware alternative needs a `[dir="rtl"]` rule, which WEB-002 §6 forbids.

## A number is not formatted until it is formatted in both locales (2026-08-15)

T-112's new widgets rendered `50%` and `2 of 4` on the Arabic dashboard, beside
the screen's own `٠`. The cause is the ordinary one — `String(value)` and
`` `${value}%` `` — and it was **already present in the code being extended**:
`formatValue` held the only correct implementation, `metricDisplay`'s sub-line
did not (`7 من 85`), and neither view's KPI values did.

Extracting `formatCount` / `formatPercent` out of `formatValue` and routing every
site through them fixed the new code **and** the old:

```
٪50 → ٪٥٠        7 من 85 → ٧ من ٨٥        9 · 10 · 0 → ٩ · ١٠ · ٠
```

**Fixing only the new widgets was the wrong option** and was rejected: it leaves
one screen rendering two numbering systems, which reads as a bug in whichever
half the reader notices second. When a task's fix exposes the same defect beside
it, the blast radius is the screen, not the diff.

## The gate chain has been red for everyone, and it is not a regression (2026-08-15)

`npm run gates` exits **1** on `check:design-system-v5` at **77 findings** —
`raw-input-radius-12px` 30, `emoji-as-icon` 28, `utc-slice-date-format` 19. That
figure was 77 before T-112 began and 77 after, with **none of the 77 naming a
file that task touched**.

Worth stating plainly because the Definition of Done requires a green chain:
**nobody can currently satisfy it**, and every task that reports "gates green" is
either not running them or reading past the exit code.

## The chart palette exists and has never been validated (2026-08-15)

`--sqx-chart-1…8` have been in `saqeel.css` all along, defined for both themes. They
are **not a categorical scale**. Run through the validator:

```
light  chart-5 ↔ chart-4   ΔE 3.0 deutan · 5.1 normal   FAIL
dark   chart-6 ↔ chart-5   ΔE 3.0 deutan · 4.3 normal   FAIL
       lightness band and chroma floor           FAIL in both modes
```

They are `-darker` / `-light` **status tokens** — text-grade colours pressed into
service as fills. A normal-vision ΔE of 5.1 means a full-colour reader cannot tell the
two apart, so this is not a colour-blindness edge case.

**Only slots 2, 4 and 3 pass** (light 16.0 normal / 12.4 protan; dark 20.8 / 18.1), so
`CHART_SERIES` ships three, with the measurements written into its TSDoc so nobody
widens it casually. **A fourth category is never a fourth colour** — it folds into a
rest slot or facets.

Fixing the eight-slot palette is a **token change request carrying measured contrast**
(WEB-002 §2), and until it lands every chart in this application is capped at three
categories.

## "Declutter" was read as "delete", and it removed working features (2026-08-15)

T-111's first pass took `/analytics` from 26 cards to a clean chart layout and silently
dropped **the entire filter form, all 26 drill links, the ten-row bottleneck list,
every lineage code and every metric definition**. The route still *parsed*
`periodFrom`/`region`/`method`, so a user was locked to the default 30-day window with
no UI to change it.

Nothing caught this. Not typecheck, not the gates, not the rendered check — the screen
looked better. **The owner asked "have you lost any data?" and the audit said yes.**

The reusable part is the audit, not the apology: `git show <pre-rebuild>:page.tsx`,
grep it for every rendered fact, grep the rebuild for the same, and diff the lists.
**A screen's feature set is not visible in its final render — only in its previous
one.**

## Charting is a set of refusals before it is a set of charts (2026-08-15)

Three requested forms were declined with evidence rather than built:

- **Line / area / sparkline** — `analytics_metric_snapshot` returns one row per metric
  per period. `p_group_by` looked like a free second dimension; lines 518-520 show it
  only **filters which metric rows return**. A time series needs a new RPC.
- **Funnel** — 58 visits → 9 published → 8 active are not stages of one cohort.
  Composing them asserts a conversion the RPC never made (WEB-002 §9).
- **2-slice donut** — a catalogued anti-pattern. A single ratio against its own track
  is a **meter**; circular is a gauge, and a gauge compares worse than a bar because
  arc length also encodes radius.

And one that had to be re-formed: **eleven counts do not share a unit.** 54 factories
against 58 visits on one axis is the dual-axis error wearing a different hat, so counts
became grouped small multiples, each scaled to its own group's maximum.

## A chart library cannot make a bar a link, and that matters here (2026-08-15)

Recharts draws bars as SVG `<path>` inside `<Bar>`; there is no prop that makes one a
focusable anchor. Dropping per-metric drill-through was not an option — it was a
restored regression — so the **axis tick is a custom renderer emitting `<a href>`**.
SVG anchors take keyboard focus: verified live, focus lands, the name reads
"Visit volume 58", the ring shows.

Also learned the hard way: **`title` on a link becomes its accessible name.** Putting
`title={metric.definition}` on a drill link renamed it to
`"Visits at planning status expired ÷ visits in the period…"`. An explicit `aria-label`
fixes the name while `title` keeps the tooltip. The accessibility tree found this; no
grep would have.

## Design-system tokens carried chart theming with zero JavaScript (2026-08-15)

Recharts writes `fill="var(--sqx-chart-2)"` straight into the SVG and the browser
resolves it per theme:

```
declared            light            dark
var(--sqx-chart-2)  rgb(33,92,102)   rgb(126,228,246)
```

No colour-mode hook, no re-render on theme switch, no duplicated palette. **This was
verified with a throwaway smoke test before any component was built on it** — and the
same render immediately exposed a label overflowing the donut ring, which no amount of
code review would have shown. The skill's rule holds: *render it and look at it.*

## `npm run gates` now typechecks — after a non-compiling file shipped (2026-08-14)

**Closed the same day it was found.** `gates` is now
`typecheck && gates:typography && check:design-system-v5`, typecheck **first**,
so the chain short-circuits before style-checking code that does not compile.
Verified by re-introducing the defect: exit **2**, style gates never run.

**Two things that verification taught, both worth more than the fix.** The first
attempt to prove it used a `\n`-terminated replace against a **CRLF** file,
matched nothing, left the file untouched, and *reported that typecheck passed* —
T-090's zero-match shape, walked into while building the control meant to catch
this exact class of defect. **A test that injects a defect must assert the
injection landed**, not just read the exit code. And the v5 gate's real figure is
**77 findings**, not the 103 quoted through this session: 103 counted bracketed
tags in the output and over-counted multi-line entries.

**`verify`, `lint`, `test`, `unit` and `budgets` are still absent.** The history
below is why that matters.

---

### The original finding

`explain-panel.tsx` used `Heading`, `Mono` and `Text` across nine call sites and
**imported none of them**. It reached the branch in `1bd7abdd
refactor(typography): clear operations and explain-panel to zero` — a commit that
**turned the typography gate green and shipped a file that does not compile.**
The explain popover threw a `ReferenceError` at runtime.

This document already records that the gate cannot see a rendered defect (T-090,
T-091, T-092, T-097, closed by T-102). **This is the same hole one level lower:
the gate does not compile the code either**, so `npm run gates` passes on a file
`tsc` rejects outright.

**And the command that would have caught it does not exist.** `CLAUDE.md`
requires `npm run verify` before any task is done, and the session template has
checkboxes for `lint`, `unit` and budgets. `package.json` has **none of
`verify`, `lint`, `test`, `unit`, `budgets`** — T-102 recorded the missing
`lint`, and it is actually all five. **A rule that names a command nobody can run
is not a control.** The `typecheck` half is now closed; the other four are not.

## An always-on banner is a fabrication, not a state (2026-08-14)

`/execution` rendered *"Submission service unavailable"* **unconditionally** —
no query, no prop, no data source — styled critical, announced `role="status"`,
on every load since it was written. Every user was told the submission service
was down, permanently, by a string literal.

WEB-002 §9 says absent data renders as a state: *Not configured* / *Unavailable*
/ *Insufficient evidence*. **It does not license asserting an outage nobody
measured.** The tell is cheap to grep: an alert whose JSX has no conditional and
no prop feeding it. **Worth sweeping for — this one survived every audit of the
route because it looked like a legitimate degraded state.**

## A native `<dialog>` deletes the focus trap instead of migrating it (2026-08-14)

T-110 replaced a 35-line `useDialogFocus` hook — `useEffect`,
`document.addEventListener`, `querySelectorAll` traversal, first/last focus
arithmetic, `origin?.focus()` restoration — with:

```
const openModally = (node) => { if (node && !node.open) node.showModal(); };
```

Containment, Escape, background inertness and focus restoration become platform
guarantees. **Two things that are not automatic:** a native `<dialog>` receives
**no accessible name**, so `aria-labelledby` must be wired explicitly; and
`z-index` is ignored in the top layer, so a modal z-index token does nothing.

`showModal()` is the WEB-012 **library-handoff exception**, not a breach — there
is no React API for opening a modal, and everything the reader sees stays render
output. **Every hand-rolled focus trap in this repo is now a deletion candidate.**

## A source-text spec must be re-pointed *before* the file it reads is deleted (2026-08-14)

`execution-revamp-accessibility-contract.spec.ts` `readFileSync`s its target **at
module scope**. Deleting the workspace first would have thrown before a single
assertion ran — the T-078 shape, avoided only because the order was checked.

Its 14 assertions tested the **spelling** of a focus trap (`"origin?.focus()"`,
`'dialogRef.current?.querySelectorAll<HTMLElement>'`). None of them proved the
behaviour reached the DOM. Re-pointed to five browser tests — named dialog, focus
lands inside, Escape closes **and restores focus to the originating control**,
Tab stays inside across 12 presses, reschedule reachable by keyboard. **T-063's
rule stands and gains a corollary: when a re-point is forced, ask whether the old
assertion tested the claim or just a spelling — and check the read order before
deleting anything.**

## There is no `LocaleProvider`, and ~25 error boundaries pay for it (2026-08-14)

`error.tsx` must be a client component, so it cannot await `getLocale()`. Every
one in this repo either **hardcodes English** or sniffs `document.documentElement.lang`
**in a `useEffect`**. T-110 used `useSyncExternalStore` instead — effect-free and
read-only, the T-106 `compact` pattern — but its **server snapshot returns `en`**,
so a server-rendered error boundary shows one English frame to an Arabic user.

That is the best available answer at the leaf. **The real fix is one provider
rendered by `AppShell`**, which is a server component that already knows the
locale, and it would serve every error boundary at once. Rule 16 says English
gets the compromise, never Arabic — today, on every error surface, it is the
other way round.

## A private date formatter is the same defect as a private type scale (2026-08-14)

`dashboard-sections.tsx:28` carried its own `Intl.DateTimeFormat("en-GB", …)`, so
**the Arabic dashboard rendered Latin digits in British format regardless of
locale**. `/execution` carried three more of the same shape.

`lib/dates.ts` exists precisely because `ar-SA` silently defaults to
`islamic-umalqura`; a bypass loses that guarantee without any gate noticing.
`check:design-system-v5` catches `toISOString().slice()` and **not** a bare
`new Intl.DateTimeFormat` — 6 occurrences remain outside `lib/dates.ts`, and a
gate rule for them is cheap.

**Extending the shared formatter beat changing it:** `formatDateTime` gained
`{ hour12 }` defaulting to `false`, so **all 94 call sites stayed byte-identical**
while the one screen that asked for 12-hour got it. **Parked and real:
`formatDateTime` joins date and time with a Latin comma, and Arabic takes `،` —
a WEB-011 defect on all 94.**

## Removing a widget can be a contract change (2026-08-14)

The AI advisory on `/planning/bulk` looked like a UI element. It was
`MVP1-M01-016` / `MVP1-M01-026`, **MVP1 Mandatory** in `atomic_scope.csv`,
accepted as `AC-0016`/`AC-0026`, and governed by change ticket `DEC-026` whose
status is **OPEN** and whose `scope_forbidden` says no code change is authorized
by it alone.

The owner directed removal and it was done. **`AC_LEDGER.csv` still marks both
rows `implemented` and now overstates the build**, and was deliberately not
edited because `product-contract.md` requires an approved change ID.

**Before deleting any surface, grep `product-contract/` for what it renders.**
The check costs one command; the widget carried its own evidence refs
(`AC-0016,AC-0026,M01-016,M01-026,SCR-WEB-110`) in a constant at the top of the
file.

## The shell was charging every route 61 violations, and the tracker said 1 (2026-08-14)

`app/(app)/layout.tsx:2` imports `components/app-shell/app-shell`. Its **66
violations were live on every route in the application** — including the thirteen
planning routes this document recorded as *"1 violation each — `NotificationBell.tsx:270`,
the shell"*. That count caught the shell's one **inline style** and none of its 59
**CSS declarations**.

T-104 took it to **2**. Every migrated route's shared floor is now 61 → 2, which
is more violations closed than the next five route tasks combined.

**This is T-083's lesson arriving a second time.** That task established *"a
shared primitive's debt is every route's debt"* and cleared the floor from
`components/saqeel/*`. Nobody applied it to the shell, because the per-route count
never showed it. **When a route reports a suspiciously round number, ask what the
counter was scoped to.**

## `font: inherit` inherits the frozen sheet, and that is app-wide (2026-08-14)

An `<input>` has no children, so it cannot host a type primitive; §11.2's
`font: inherit` is the only available fix, and it is legal in feature CSS —
it matches neither `raw-typography-property` (which lists the longhands) nor
`font-shorthand-outside-design-system` (which requires `var(--sqx-text-`).

Measured after applying it: both shell inputs render **14px/21px**. Family and
size are right; the leading is **1.5**, the legacy value, because
`saqeel-runtime.css:19` still beats `saqeel.css:869` on `<body>`. On a
single-line control that is inert — **but every `font: inherit` this programme
writes from now on resolves against the frozen sheet until the two-body-rule
conflict is ruled on.** That conflict was already recorded; its blast radius was
not.

## A partial replace looks like success; a zero-match does not (2026-08-14)

`shell-nav-item.tsx` renders the same two lines twice — a disabled `<span>` branch
at 8-space indent, an enabled `<Link>` branch at 6. A `replace_all` on the 8-space
form matched **one** occurrence and reported success. The CSS had already lost its
`font`, so **every clickable nav item in the application rendered at inherited
14px/400 instead of 12px/600**, and the typography gate reported *9 violations
removed* and stayed green — it counts declarations deleted, not text rendered.

This is the fourth instance of a shape recorded three times already (T-058's rule
matching 0 of 24, T-076's regex 0 of 7, T-090's CRLF replace on an unchanged
file). The earlier three were **zero**-match, which announces itself. **A partial
match is strictly worse: the tool reports success and the diff looks right.**
After a multi-site edit, count the sites you expected against the sites you
changed — and re-render.

## Zero importers is not evidence of death when the ledger says otherwise (2026-08-14)

`shell-page-frame` was deleted as dead code and restored. It has no importers, no
spec reads it, no script names it — and `04-COMPONENT-LEDGER.md:180` says
*"Supersedes the default `Shell` export; adopting it in the 55 route files is
future work."* **Zero importers is its expected state.**

T-077's checklist for "is this really dead" covers `e2e/` and `scripts/` because
a spec that reads a file as text pins it. **The ledger belongs on that list, and
it is the cheapest check of the three** — one row states the component's intended
future.

## Reuse is conditional on the primitive being clean (2026-08-14)

The ledger rule is *never build what already exists*. T-104 hit two components
that existed and used neither:

- **`Avatar`** renders `className="avatar"` — a **frozen-sheet global** — plus an
  inline `style`, and its `UserChip` sibling carries `t-caption` and
  `fontWeight: 500`. Composing it would have imported three legacy constructs to
  remove one.
- **`CountBadge`** renders identical type and the identical danger tokens, but
  `--sqx-radius-sm` against the rail badge's `--sqx-radius-pill`, plus different
  min-width and padding — a **shape** change riding inside a typography task.

`Kbd` and `Heading` were adopted on the same test. **Read the primitive's own
stylesheet before composing it; the ledger tells you a component exists, not that
it is fit to reuse.**

## Is a logotype typography at all? (2026-08-14)

Two violations survive in `shell-brand.module.css` deliberately. `صقيل` renders at
`font: var(--sqx-text-subheading)` (16px). `Text` cannot express `subheading` —
`TextRole` is body · bodyStrong · label · overline · mono — and `Heading` can, but
only by emitting an `<h1>`–`<h6>`, which would inject a heading into the outline
of **every page** and break "exactly one `display` per route".

§11.4 says extend the primitive. That was not done, because §2 defines
`subheading` as *"a named group inside a card"* and a bilingual wordmark is not
one. **Adding `subheading` to `TextRole` would settle the question by accident**
and hand every feature a 16px non-heading — precisely the expressiveness §1
removed on purpose.

The decision needed is not *how do we reach 16px from `Text`*. It is **whether a
logotype is governed by the type scale, or is a mark that happens to be set in the
UI face.** WEB-002 §2 and §10 both say a gap stops the work and is raised.


## 1,142 shipped defects were invisible, and four tasks paid for it one at a time (2026-08-14)

This document already recorded the hole three times and the tracker a fourth:
T-090, T-091, T-092 and T-097 each found their real defect by **measuring a
render**, after the gate had reported the route clean. Reading it as four unlucky
sessions was the mistake. It was one tooling defect, charged four times.

T-102 closed it. `check-typography.mjs` now detects legacy type classes used from
JSX, `--type-*` outside the frozen sheets, and inline font styles spanning more
than one line — the last of which was never a rule failure at all: **the rule was
correct and the engine tested single lines, so `[^}]*` could never cross a
newline.**

```
baseline 733 → 1846      +1142 newly detected      −29 from the concurrent T-101
legacy-type-class-in-jsx +944   legacy-type-token +179   inline-font-style +18
```

**The ratchet governs regressions, not detection.** WEB-014 §8 says a task
raising the baseline is rejected on sight; applied to a *detection* improvement
that makes every blind spot permanent by construction. The rule text needs the
distinction written into it.

**Derive the list, do not invent it.** The fourteen banned classes came from
parsing all four frozen sheets for blocks whose body is *only* typography —
`tokens.css:219-230`, `saqeel-runtime.css:61`, `saqeel-components.css:163`. The
same sheets define ~180 further classes carrying a font (`.kpi-label`,
`.spine-title`); those are **component** classes, and banning them from JSX is a
migration decision wearing a typography costume. A detection rule is only as
defensible as its derivation.

## Two sessions ran at once and the working tree is entangled (2026-08-14)

A second session completed a task **also numbered T-101** while this one was
running. That work is good and clean — `components/notifications/*` scores zero —
but two consequences need a human:

**`typography-baseline.json` is co-owned by two uncommitted tasks.** The 1846
figure includes T-101's −29 for the deleted `NotificationBell.*`. Revert one
without the other and the gate fails with 29 phantom "new" violations. **The two
changes land in the same commit or not at all.**

**This is the third ID collision** — T-076 twice, now T-101 twice. This document
already prescribed the fix after the first one — *claim the ID in the tracker at
the start of a task* — and nothing implements it. A prescription nobody
implements is not a control; the tracker needs the reservation or the collisions
continue.

## `npm run lint` has never existed (2026-08-14)

`package.json` has `typecheck`, `gates`, `gates:typography`, `check:design-system-v5`,
`verify:dates` — and no `lint`. WEB-008 §3 and `CLAUDE.md` both require
`npm run lint` clean before a task is done, and the session template has a
checkbox for it. **Every session that ticked it ticked something it could not
have run.**

Second instance of the same shape after T-077 found `gate:retirement` missing
while WEB-006 §4 mandated it. **When a rule names a command, run the command
before trusting the tick** — and `npm run gates` is currently red for everyone on
a pre-existing `check:design-system-v5` finding in
`src/lib/analytics/query-state.ts:18`, a file no current session has touched.

## A duplicated string map hid in the shell for the whole programme (2026-08-14)

T-101 found the 56-key notification string map written out **twice, verbatim** —
`components/Shell.tsx:162-218` and `features/shell/notification-strings.ts` —
each using both patterns WEB-013 bans outright (`t(key, "English")` *and*
`locale === "ar" ? … : …`). Neither copy could drift visibly, because the two
shells are never rendered on the same route, so nothing would ever have surfaced
it.

**Look for the same shape elsewhere.** `Shell.tsx` (legacy) and
`components/app-shell/` (T-004 rebuild) are two live shells serving different
route sets. Anything the topbar renders is a candidate for having been written
twice — `shellStrings` in `Shell.tsx` still holds **~83** `locale === "ar"`
branches, and `shell-topbar.tsx` reads the same concepts from `getMessages`.

## A nested scroller leaks into `menu-surface` without `contain` (2026-08-14)

`menu-surface`'s root is `overflow-y: auto`. Any panel that puts its own
`overflow-y: auto` region inside it **must also carry `contain: paint`**, or the
inner list's full height counts toward the root's scroll height even though the
inner box already clips it. Measured on the notification panel: **1473 against a
435px client**, so the panel scrolled its own header and tabs out of view into
1038px of nothing.

A definite height on the inner scroller, `overflow: hidden` on the panel, and
`overflow-y: clip` on the root **all measured no change.** Only containment
worked. Every future `MenuSurface` consumer with a scrolling region inherits
this — check `scrollHeight − clientHeight` on the root, not the appearance.

## A gate cannot see a wrong plural (2026-08-14)

The Arabic relative time read `قبل ٥ ساعة` — the singular, for every count above
two — because `hoursAgo: "قبل {n} ساعة"` interpolated a bare noun. It lived in a
resource file, in written Arabic, with the key present in both locales: **every
i18n check this repository has was green on it.** Hand-rolled plurals are banned
by WEB-013 §4 and this is why. Where a count meets a noun, use
`Intl.RelativeTimeFormat` / `Intl.PluralRules`, not a template.

## A parent `loading.tsx` may be hiding every nested skeleton (2026-08-12)

T-096 built a skeleton for `/planning/immediate` that mirrors the form, then
found that a cold navigation to that route shows **`PlanningSkeleton`** — the
11-column data-table skeleton belonging to `/planning` — from the **parent**
segment's boundary. Identified by its label ("Loading visit planning" =
`planning.home.loading`) and its 122 bones.

If that holds generally, then **every per-route skeleton built under `/planning`
is unreachable**, and the several tasks that sized bones against their screens
were measuring something the user never sees. It also means a form route
currently announces itself with a table.

**Caveat, stated because it changes the answer:** the observation was made in a
tab whose `visibilityState` was `hidden`, where the route transition stalled and
never revealed. A stalled transition can hold the *outer* fallback open, so this
may be an artefact of the harness rather than the router.

**Answer this before building another skeleton.** It is a routing question, not a
design one, and it is cheap to settle: with the pane displayed, navigate to two
nested planning routes and read the label out of the `SkeletonRegion`.

## `RouteLoading` is an ARIA landmark defect on ~25 routes (2026-08-12)

`components/RouteLoading.tsx` renders `<main className="sq-content">`. It is
mounted **inside** `ShellClient`'s `<main id="main-content">`, so every segment
using it puts **two `main` landmarks** in the document. It also carries hardcoded
`en`/`ar` literals and a `locale === "ar"` ternary (rule 18), `glyph="◫"`,
`t-caption` at 11.5px, and no `Shell` — so the page title appears only after the
load finishes.

T-096 took it off `/planning/immediate`. **~25 segments still import it**, and
each is one small file. This is the cheapest large a11y win left on the board.

## `/field` is a second design system, and the baseline does not know it (2026-08-12)

`app/(app)/field/layout.tsx:30` links `/saqeel-ds/saqeel/styles.css` from
`public/`. That one tag brings a complete parallel design system — its own
`tokens/{fonts,colors,typography,layout}.css` and a `components.css` — with a
**thirteen-step** type scale:

```
28 · 22 · 17 · 15 · 14 · 13 · 13 · 12.5 · 12 · 11.5 · 30
```

None of those are SAQEEL's nine. Every off-scale size measured on `/field` comes
from there, not from unmigrated feature code.

**So `/field`'s 226 counted violations are not a migration backlog in the sense
the rest of the baseline is.** Migrating those 38 files onto type primitives
while that stylesheet redefines `--font-*` and `--type-*` for the whole subtree
is work against a live override: the primitives would render inside a scope that
has already replaced the tokens they consume.

Add the **502 gate-invisible** occurrences there (`t-caption` 329, `id-code` 164,
`t-label` 9) and roughly a third of the remaining 734 belongs to a system this
sweep is not migrating. **The number overstates what the programme owns until
someone rules: does `/field` join SAQEEL, or is it declared separate and its
count removed?**

## `document.fonts.check()` does not tell you whether text renders (2026-08-12)

It reports the document's `FontFaceSet`. It returned `false` for
`"IBM Plex Mono"` on `/field` and T-095 reported, wrongly, that sixteen elements
were rendering in a font that did not exist. They were rendering in it perfectly.

Two probes are unreliable and both were used to reach that wrong answer:

- `document.fonts.check("16px X")` — false for anything not in the FontFaceSet.
- `ctx.font = '400 16px "IBM Plex Mono"'` on a canvas — **silently mis-parses a
  quoted family** and falls back, so the width matches a bogus baseline and
  appears to confirm the font is missing.

The check that holds: lay out a hidden `<span>` carrying the element's own
computed `font-size`, `font-weight`, `letter-spacing` and `font-variant-numeric`,
then compare `getBoundingClientRect().width` across candidate families against
the element's declared stack.

```
as declared      247.50
"IBM Plex Mono"  247.50   ← identical: it is what renders
ui-monospace     209.84
Consolas         226.80
```

**A font claim is a width measurement or it is a guess.**

## Self-hosting is a decision the whole app has to make, not one layout (2026-08-12)

`app/layout.tsx` self-hosts IBM Plex Sans Arabic through `next/font/local` and
says why in the file: the build must not depend on a Google fetch that fails in
restricted environments. `public/saqeel-ds/saqeel/tokens/fonts.css` then
`@import`s all three families straight from `fonts.googleapis.com`.

So the channel most likely to be **offline** — the field app, which registers a
PWA — carried the exact runtime network dependency the rest of the application
had deliberately removed. Nothing failed loudly; the fonts simply came from
somewhere else.

**When a policy is set in `layout.tsx`, check the stylesheets a route links
directly.** A `<link>` in a nested layout bypasses every convention the root
layout establishes.

## The clutter was duplication, and duplication is a code smell you can count (2026-08-12)

T-094 took `/planning/bulk` from **ten stacked blocks and zero rows of data** on
first load to five, and **removed no fact whatsoever** — every deletion was a
second copy of something still on screen. The counts are the point:

```
renderings of view.eligible   4 → 1     criteria footer · ledger · toolbar badge · pager
copies of the "no criteria" copy 3 → 1  two shared a sentence verbatim
copies of the risk advisory   2 → 1     differing by the word "only"
```

**Two facts a future declutter must not get wrong.** The ledger's
denominator/eligible/excluded triple looks like a fourth duplicate — `excluded`
is arithmetic — but CD-021 states plainly that showing the three together is the
signature of the screen, so it stays. And the five "Not available" rows were not
extra information: `fieldChoices` already sets `disabled` + `note` on every
unsupplied option, so the block below was the **second** telling and collapsed
into one disclosure.

**Blocks that carry nothing at zero are gated, not deleted.** The pager, campaign
summary and toolbar badge were correct components rendering an empty truth.

**The screen body was never rendered** — the dev session is an Inspector and
`/planning/bulk` needs `planning.create.bulk`. Axe, the manual checklist and the
Arabic pass are owed under a Planner or Supervisor session before T-094 is `done`.

## The planning family is closed (2026-08-12)

All **thirteen** planning routes now report **1 violation each** —
`NotificationBell.tsx:270`, the shell — and nothing else:

```
/planning · /single · /bulk · /bulk/review · /immediate · /plans · /plans/[id]
/visits · /visits/[id] · /calendar · /map · /workload · /supervision
```

Seven tasks, T-085 through T-093, moved the repo baseline **863 → 734** and took
the family's route-owned count to zero. What actually closed it was not the gate
— three of those tasks found defects the gate could not see (11.5px `t-caption`
from JSX, a second typeface injected by Mapbox, a legacy weight assembled by
hand) and one found a defect that was never counted at all.

**The remaining pockets are `/field/*` (226, needs an inspector persona per
T-069), `sections/approvals` (68), `sections/regulations` (63) and
`sections/enforcement` (52).**

## A hand-assembled weight is not a role, in either direction (2026-08-12)

Three tasks hit the same shape and corrected it two different ways:

- T-087, T-091 — KPI values at `font-size: metric-size` + `weight: semibold`
  → **600 → 700**, because `metric` *is* bold.
- T-093 — a selected row at `font-weight: bold` on body text
  → **700 → 600**, because the scale has no 700 at body size and `bodyStrong`
  is the only emphasis role for body.

The tell is identical each time: **`--sqx-text-*-size` and `--sqx-weight-*`
reached for separately.** A role is four values that travel together; composing
three of them by hand yields something that passes every gate and renders wrong.
The direction of the fix follows the scale, never a preference about how bold it
should look.

## "Not found" from your own tooling is a question, not an answer (2026-08-12)

T-093's selector→element map reported **every** class in
`components/sections/visits/` as `(not found)`. The obvious readings were "these
modules are dead" — which had just been true of `BulkForm.tsx` in T-091 — or
"the CSS is orphaned". Both were wrong: the classes live in **sibling** files
rather than the directory's namesake component, and the map only searched the
namesake.

One grep settled it. Acting on the tool's answer would have deleted three live
stylesheets.

## "Fixed centrally" is a claim about a component, and it needs checking there (2026-08-12)

T-074 found Mapbox injecting `"Helvetica Neue"` into its attribution, moved the
normalisation into `components/saqeel/map/map-chrome.module.css`, and recorded
that **"any future map inherits the same chrome."**

It did not. Two files composed that module — both operations canvases. **`GeoMap`,
which has 18 consumers, was never wired up**, so every other map in the
application kept rendering a second typeface for as long as the fix was believed
to be in place. T-092 found it by measuring `/planning/immediate`, a route whose
own tree is provably clean.

**A central fix is only central once every consumer composes it, and nothing
checks that.** There is no gate for "component X imports module Y". When a task
moves a fix into a shared module, the closing step is enumerating the consumers
and confirming each one reaches it — not verifying the route you happened to be
working on.

## A clean tree is not a clean screen (2026-08-12)

`/planning/immediate` passed every static check available: the gate counted only
the shell, and greps for `.t-*` legacy classes, string-literal `className`
attributes and CSS typography declarations all came back **empty**. The rendered
page still had two typefaces.

The defect lived in a dependency's stylesheet, reachable from no source file in
the route. **The three questions that actually settle a route are all measured:**

```js
new Set([...document.querySelectorAll('main *')]
  .filter(el => !el.children.length && el.textContent.trim())
  .map(el => getComputedStyle(el).fontFamily.split(',')[0]))   // typefaces
```

plus the distinct size set and the off-scale list. Two tasks running (T-091's
11.5px `t-caption`, T-092's Helvetica Neue) were invisible to every grep and
every gate, and obvious in one line of measurement.

## The gate counts CSS. It cannot see a legacy class used from JSX (2026-08-12)

`/planning/bulk` reported **1 violation** — the shell — and still rendered four
elements at **11.5px**, off every scale. The source was
`DistributionPanels.tsx`:

```tsx
<p className="t-caption">{strings.riskAdvisory}</p>
```

`.t-caption` lives in `tokens.css` (`--type-caption-size: 11.5px`), which is
**frozen and therefore exempt**. Every rule in `check-typography.mjs` scans CSS
files for *declarations*; a `className` string in a `.tsx` matches none of them.
So the count was truthful about the CSS and wrong about the screen.

**`t-caption` appears in 162 `.tsx` files.** Until a rule matches
`className=".*\bt-(caption|body|label|meta|micro)\b"`, **a route at "1 violation"
is not evidence that it renders on-scale** — only a measured render is. Two
tasks in a row (T-090, T-091) found their real defects by measuring, not by
counting.

## A token outside the tone list is not automatically a different colour (2026-08-12)

T-090 established the wrapper pattern for a colour the nine tones cannot express
(`--sqx-accent-ai`). T-091 nearly applied it again to
`--sqx-status-critical-on-soft` — and did not, because checking the definitions
showed **both it and `--sqx-text-danger` resolve to `--sqx-error-darker` in light
and `--sqx-error-light` in dark.** Identical in both themes, so `tone="danger"`
is exact and the class could be deleted outright.

**Resolve the token before designing around it.** The wrapper costs a DOM node
and a surviving class; it is only warranted when the values genuinely differ.

## A class that goes unused after a migration is a signal to re-read it (2026-08-12)

`.filterStatus` carried `display: inline-flex; align-items: center; gap` **and**
a font. The migration replaced the whole span with `<Text>`, which would have
collapsed a CountBadge row — a layout regression with no typography symptom.

Nothing caught it except the **unused-class check**: the class showed as defined
but unreferenced, which prompted re-reading the block and finding the layout.
The reflex at that moment is to delete the class; the correct move is to read it
first and ask what else it was doing.

Run both directions after every migration — orphaned `styles.x` **and** unused
classes — and treat each hit as a question, not a chore.

## Exactly four elements need `font: inherit`. Check, don't guess (2026-08-12)

Only `<input>`, `<button>`, `<select>` and `<textarea>` fail to inherit `font` —
they carry a UA font, so deleting a declaration from one renders **Arial**, not
the inherited face. That is the T-064 defect, and it has now been hit or avoided
in four separate tasks.

The mirror-image error is just as real: `<a>`, `<label>`, `<summary>`, `<th>` and
`<td>` **do** inherit, and giving them `font: inherit` adds a line that does
nothing while implying the element is a control.

T-090 resolved it by **mapping selector → rendered element with a script before
touching anything** — parse the CSS for blocks containing typography, then find
each class in the JSX and record the tag it lands on. Eleven modules, 45
declarations, four genuine controls, and two classes that lived in a sibling file
rather than the directory's namesake component. **The map is cheap and it is the
whole task's risk in one table.**

## The primitives take no `className`, and that decides your markup (2026-08-12)

`Text` and `Heading` expose no class hook. So a CSS class that mixes layout with
typography — `.pagerLink` (border, padding, flex **and** `font: label`),
`.fieldValue` (`text-align: end` **and** `font: body`) — cannot simply become a
primitive.

The rule that fell out of T-088 and hardened in T-090:

> **The element keeps its layout class; the primitive goes inside it as a span.**

Purely typographic classes get deleted outright; mixed ones shed only their
type. Applied consistently this produces no orphaned classes in either
direction, and it is why `<legend>`, `<th>`, `<summary>`, `<button>` and `<a>`
all kept their elements through the migration.

**A tempting shortcut to avoid:** moving the layout onto the parent instead. It
works until a second child needs different layout, and it makes the CSS lie
about which element it describes.

## A zero-match bulk edit is a signal, not a retry (2026-08-12)

A scripted seven-pattern replace on `visit-drawer.module.css` matched **none** of
them — the file is CRLF and the patterns were `\n`-joined — and the script
**reported success on a completely unchanged file**. Had the verification been
"did the script run?" rather than "did the count go down?", the task would have
shipped believing the file was migrated.

This is the third instance of the same shape: T-058's gate rule that matched 0 of
24, T-076's structural regex that matched 0 across 7 sites. **Stop tuning the
pattern and change approach.** T-090 switched to per-block edits and finished
immediately.

Related, from the same task: **the typography gate reads CSS and single lines, so
it stays green on broken JSX.** An unbalanced `</span>` left by a conversion was
caught by re-reading the file, not by any gate — the same failure T-069 recorded.

## The app has two body line-heights, and the frozen sheet is winning (2026-08-12)

`<body>` is matched by **two** `font:` shorthands:

```
saqeel.css:869          font: var(--sqx-text-body)    → 1.6 → 22.4px
saqeel-runtime.css:19   font: var(--type-body-font)   → 1.5 → 21px   ← wins on load order
```

So the design system's own body rule loses to a **frozen legacy sheet**, on
`<body>` itself. Everything that inherits renders at 1.5 leading; every type
primitive renders at 1.6. Measured on `/planning/bulk/review`: an unmigrated
`.note` at **14px/21px** sitting beside a migrated `PlanningNotice` at
**14px/22.4px** — two leadings for the same prose on one screen.

**This is why a `font-size`-only class is not "already correct".** Twelve classes
in that route set `font-size: var(--sqx-text-body-size)` and nothing else, which
looks like on-scale body text and is not: it is the body *size* with legacy
*leading*. Migrating them to `<Text>` is a **visible** change of +1.4px per line.

The conflict itself is **app-wide and unresolved** — fixing it means a ruling on
load order or on deleting the legacy `body` rule, and it would shift leading on
every unmigrated surface at once. Do not fix it inside a route task.

## A class assembled from parts is not the role (2026-08-12)

`review-outcome` and `review-assignment-split` styled their KPI numbers as
`font-size: var(--sqx-text-metric-size)` + `font-weight: var(--sqx-weight-semibold)`.
That is metric *size* at 600, but `--sqx-text-metric-weight` is
`--sqx-weight-bold` (**700**) — so the number had never rendered the `metric`
role, only an imitation of it, and no gate could see the difference because both
tokens are legal.

**Reaching for `--sqx-text-*-size` and `--sqx-weight-*` separately is the tell.**
A role is a set of four values that travel together; composing three of them by
hand produces something that passes review and renders wrong. `<Metric>` is 700,
and moving to it is a deliberate, visible correction.

## Ask, then take the reversible option (2026-08-12)

T-087 hit a real §11.4 gap: two headings needing `subheading` **plus** `ref`
**plus** `tabIndex`, which neither `Heading` nor `Text` can express. §11.4 says
extend the primitive; the owner has asked to be consulted on design-system
changes. The question was put and **not answered**.

The tie-break was reversibility: a `<div tabIndex={-1} ref>` wrapper around
`Heading` touches nothing shared, matches a pattern already in four files here,
and reverts cleanly if the owner prefers the extension. It also happened to fix a
defect the extension would not have — `<h3 role="status">` is **not a heading**,
because `role` replaces the implicit one.

**When a blocked decision has a contained option and a permanent one, take the
contained one and record the question.** The permanent option stays available;
the reverse is not true.

## Measure the clutter before you cut it (2026-08-12)

"Too cluttered" is a feeling until it is a count. Dumping every leaf text node in
the rendered subtree and tallying repeats turned a vague complaint into a list:
**14 strings rendering more than once**, including one sentence **4×** because a
component put it inside each `<details>` instead of once above the group.

That list is also the acceptance criterion — 14 → 9, with the 9 survivors named
and justified. **A declutter without a before-count cannot be reviewed and cannot
be defended.**

## When a sibling route already fixed it, extract — do not copy (2026-08-12)

`/factories` shipped an AI panel that printed its provenance and confidence lines
above an *empty* advisory. T-060 had removed exactly that from `/dashboard` months
of tasks earlier.

The tempting fix is to copy the dashboard's stylesheet into the factories folder.
That produces the second implementation this programme has already paid for twice
(T-071's live map, T-076's hand-rolled table) — **it inherits the bug it started
with and none of the later fixes.** The strip moved to `components/ai/` and both
surfaces compose it. Two stylesheets and one duplicated hook disappeared.

**A defect on route B that route A already solved is not a bug report. It is a
missing shared component.**

## A "none" sentence is a duplicate waiting to happen (2026-08-12)

`latestChange` returned *"No risk calculation has been recorded for this factory."*
when there was no movement — word for word what the Risk trend card renders as its
empty state. Two cards, one fact, twice on screen.

Making it `string | null` and rendering the line only when present removes the
duplication **by construction**. **Prefer absent to a sentence meaning absent:** a
null cannot drift out of sync with the other component's copy, and it cannot be
rendered by accident.

## Changing a shared component changes every surface that composes it (2026-08-12)

Two near-misses in one task, both caught by measuring the *other* route:

- Setting `visual="bodyStrong"` on the shared strip's heading would have shrunk
  the dashboard's brief title 20px → 14px, disturbing a route T-059 closed out at
  four sizes.
- Moving the action below the paragraph — the owner's ruling for `/factories` —
  grows the dashboard's brief 44 → 74px.

The first was reverted; the second was accepted and **written down** rather than
shipped silently. **After editing a shared component, render every consumer and
diff it. The route you were asked about is not the only one you changed.**

## Check the primitive's stylesheet before deleting the class, not after (2026-08-12)

`/planning/single`'s eight declarations came out in one pass with four classes
deleted **entirely**, because the replacement was checked property-by-property
against `type.module.css` first. `.text` already sets `margin: 0`;
`.text[data-role="body"]` already sets the font, its tracking **and**
`text-wrap: pretty`; `[data-tone="muted"|"secondary"]` set exactly the colour
tokens the classes named. Nothing was left to keep.

The reverse mistake is the expensive one: trimming only the banned property and
leaving `margin: 0; color: …; text-wrap: pretty` behind as a class that now
duplicates the primitive and will drift from it.

**And read the token before believing the diff.** `.legend` declared
`font: var(--sqx-text-label)` *and* `font-weight: var(--sqx-weight-semibold)` —
the `label` role is already semibold, so the second line was a no-op that looks
like a deliberate weight override in review.

## A four-step wizard hides most of its own typography (2026-08-12)

Three of the five components T-088 migrated **never rendered**. `/planning/single`
opens on *Find the factory*; the configuration fieldsets, the dossier and the
portfolio picker are steps 2–4, and the client wizard would not hydrate past the
loading skeleton — the Factory 360 handoff URL
(`?cr=…&license=…&source=factory360`) was tried and did not shortcut it.

`<legend>` was confirmed **absent from the DOM**, so the one structural change in
that task — a `<Text as="span">` nested inside the legend — is unverified.

**A route is not one screen.** When the surface is a wizard, a queue with an empty
state, or anything gated on data this workstation has none of, say which states
were rendered and which were reasoned about. T-075 owed the populated exception
board, T-069 owed every `/field/*` surface, and this owes three wizard steps.
Structural equivalence is a good argument; it is not a measurement.

## A `t()` default is not a fallback — it is the English build (2026-08-12)

`f360.actions.planSingle` rendered **"Plan single visit"** on one screen and
**"Plan one visit"** on two others. The key looks translated — it is called
through `t("f360.actions.planSingle", "…")` — but it has **no entry in either
locale file**, and `getDict("en")` returns `{}`. In the legacy `t(key, en)`
system there is no English dictionary at all: `tr()` resolves every key to its
second argument. **The literal in the call site *is* the shipped English**, so
three call sites meant three independently editable copies of one label.

This is why WEB-013 bans `t("key", "English")` rather than merely discouraging
it. The pattern does not degrade gracefully to a shared string — it silently
forks one label per call site, and nothing reports the divergence.

**When a control's label is asserted or referenced by other copy, the reference
decides the wording.** Here `planning-single/strings.ts:264` renders *"Only
planning staff can use **Plan a single visit**"* — a denial that names the
control. A button and the sentence naming it are one contract; the sentence had
been right all along and two buttons had drifted off it.

**Corollary found the same hour:** `cd-022-identity-lens.spec.ts:422` still
asserted the *old* wording while the source string had already moved. A rename
had landed in code with its spec left behind, and only grepping the obsolete
phrase surfaced it. **Grep the string you are replacing across `e2e/` as well as
`src/` — the spec is where the previous rename went to hide.**

## A control that cannot POST is why the banned one is still there (2026-08-12)

`Select` is a `<button>` plus a listbox, so it submits nothing. T-080 found that,
raised it, and kept the native `<select>` WEB-009 §14 bans. Nothing filled the gap,
so the defect sat on a **write path** for four tasks.

Filling it took two props. `name` renders a hidden input carrying the value —
**without it the swap compiles, renders correctly and silently submits an empty
field on every governed transition.** `defaultValue` is the half that matters
more: an uncontrolled control means the forms hold **no state at all** and the
answer is read once from `FormData` (WEB-004 §1 rung 4).

**When a primitive gap blocks a rule, fill the primitive. Working around it puts
the violation somewhere a future task has to find again.**

## Check the primitive's props before building a parallel one (2026-08-12)

The reschedule window looked like it needed a datetime picker that did not exist.
`DateRangePicker` already had `withTime`, `timeStep` and `timeLabels`, and already
emitted `YYYY-MM-DDTHH:mm`. It needed **two submit-name props**, not a new
component.

Read the whole prop list — including the TSDoc — before concluding something is
missing. This repo's recurring failure is the opposite one: a second
implementation that inherits the original's bugs and none of its fixes.

## Migrating off a native control breaks `selectOption()` (2026-08-12)

`page.selectOption()` only drives a native `<select>`. Every spec that uses it
against a control you are about to migrate **breaks at runtime**, and the type
checker cannot see it.

Budget for the rewrite before promising the migration: the row must be clicked by
the label the screen shows, which means the spec needs that label — take it from
**the same source the page reads** so the two cannot disagree. Also re-check every
`form >> button` locator, because the listbox trigger is now a button inside the
form and the old locator raises a strict-mode violation.

## An empty listbox is worse than the native control it replaced (2026-08-12)

A native `<select>` with no options still renders its placeholder. A custom
listbox opens onto an empty floating panel, which reads as a failure to load
rather than as unconfigured data.

`Select` now takes `emptyLabel` and renders a disabled row. **A migration is not
finished until its empty, error and unconfigured states are at least as good as
the control's.**

## An i18n object is a contract, and `Object.entries` assumes one you never wrote (2026-08-12)

`/planning`'s Method filter offered ten options and six of them could never match
anything. The cause was one line — `Object.entries(messages.methods)` — reading a
JSON object as a value→label map when it actually held **nine** keys: three real
method values *and* six title/description strings for a different surface's card
picker. Selecting *"Plan bulk visits"* filtered visits by `method = 'bulkTitle'`
and returned an empty list **with no error**, which reads as *no visits match*
rather than *that is not a filter*.

Nothing catches this. It typechecks (`Object.entries` over a JSON object is
well-typed), it passes every gate, and it renders without a warning. The same
object was **simultaneously correct** at `planning-drafts.tsx:38`, which does
`methods[draft.method]` — one object, two contracts, only one of them true.

**Never iterate an i18n namespace to build a control's options.** A locale file
groups strings by *screen area*, not by *domain enum*. Derive options from a
canonical constant and index the namespace by key; then a new string can never
become a selectable value.

**And validate the parameter as well as the control.** Cleaning the JSON alone
would have made the filter correct *by coincidence*. `parsePlanningParams` was
already whitelisting `tab` against `PLANNING_TABS` three lines above the
unvalidated `method` — the fix was the existing pattern applied to the field
that was missed.

## When a number contradicts an invariant, re-measure before explaining it (2026-08-12)

T-085's first measurement said the unfiltered planning list held **2** visits.
The real figure is **101**. A loose regex had matched a bucket counter instead of
the list total, and the mistake nearly reached the session record.

What exposed it was not care — it was an impossibility: a *filtered* query
returned **8** against a supposed unfiltered total of **2**. A filter cannot add
rows. The instinct at that moment is to explain the anomaly; the correct move is
to distrust the instrument. The rendered `Showing N of M scoped visits` counter
was the only trustworthy signal, and the `V-\d+` reference regex was as unreliable
as the first one.

**A measurement that violates an invariant is evidence about the measurement,
not about the system.**

## A shared primitive's debt is every route's debt (2026-08-12)

Until T-083, **no route in this application could reach zero typography
violations**, because each inherited a 6–9 violation floor from eight shared
`components/saqeel/*` stylesheets it does not control. `/factories` had migrated
its own code to **zero** — `components/sections/factories/` scans clean across 35
component directories — and still measured 7, none of them its own.

That makes "is this route done?" unanswerable, and it is the same argument
T-058/T-059/T-072 reached three times from the other direction: **fix a shared
primitive centrally, because a per-screen fix multiplies the same edit by the
number of consumers and still leaves the primitive wrong.** 12 declarations
cleared the floor from every route at once.

**Corollary for scoping a route audit:** always split the count into *own* /
*design-system* / *other-shared* before deciding a route is unmigrated. `/factories`
and `/planning` looked 7 and 52; the honest reading was 0 and 45.

## A retired-role rename is only a no-op if `lang` sits on `:root` (2026-08-12)

`--sqx-text-caption-*` are declared as `var(--sqx-text-body-*)`, so swapping
`caption → body` looks unconditionally safe. It is not. `:lang(ar)` overrides
`--sqx-text-body-line` to `1.8`, and **custom properties substitute at
computed-value time on the element the declaration applies to**. Had `lang="ar"`
sat on `<body>` while the aliases were declared on `:root`, `--sqx-text-caption-line`
would have resolved `1.6` against body's `1.8`, and the rename would have
**silently lengthened every affected line in Arabic** — no gate, no typecheck, no
English render would have shown it.

`layout.tsx:72` puts `lang` on `<html>`, which *is* `:root`, so both declarations
land on the same element and resolve together. Verified by measurement, not by
reading: with `locale=ar`, `--sqx-text-caption-line` reads `1.8` and
`caption === body` compares `true`.

**The general rule: an alias is only transparent while nothing re-declares what
it points at.** Before treating any `--sqx-text-*` alias swap as cosmetic, check
every block that redefines the target token — today that is `:lang(ar)`, and it
covers seven of the nine roles.

## `align-items` on a column is a cross-axis rule, and it sizes every child (2026-08-12)

T-081 added `align-items: flex-start` to two `flex-direction: column` forms so the
submit button would stop stretching. It did that — and it also collapsed **every
field above the button** to intrinsic width. T-082 measured the result on the live
route: a textarea at **178px** (the `cols=20` UA default) inside a 444px form, and
a drop zone at **229px**, its longest text line.

The field's own `inline-size: 100%` cannot win this: it resolves against a
shrink-to-fit parent.

**Give the one child that needs an exception its own row; do not align the
container.** The forms are `stretch` again and the button sits in a `.formActions`
row, keeping its natural width because it is `inline-flex`.

## `minmax(18rem, 1fr)` is a 320px reflow failure waiting to happen (2026-08-12)

`repeat(auto-fit, minmax(18rem, 1fr))` reads as responsive and is not: the 288px
track floor is a hard minimum, so in any container narrower than that the item
overflows its own grid. T-082 hit it at 183px and only a measured `offsetWidth`
comparison showed it — it is invisible in source, to the type checker and to every
gate.

**Write `minmax(min(18rem, 100%), 1fr)`.** Same collapse behaviour, never
overflows.

And note what `auto-fit` buys: with one child the surplus track collapses to 0 and
that child spans the row. **An empty second cell is what makes a full-width empty
state and a two-column filled state the same declaration** — no media query, no
conditional class.

## An object URL can be disposed by the element that consumed it (2026-08-12)

The reflex for `URL.createObjectURL` is an effect with a cleanup. It is not
needed. Create the URL in the change handler, revoke it in the image's own
`onLoad` once the bitmap has decoded, and key the `<img>` by the URL so a new file
mounts a new element. Verified live: `src` scheme `blob`, image still painted, and
a `fetch` of that URL fails.

WEB-004 §3's disposal case never had to be opened. **A disposal a DOM event can
express is not a reason to add an effect.**

## Check what a primitive already promises before translating a string for it (2026-08-12)

`notes.saving` and `att.uploading` existed in both locales, were mapped in
`strings.ts` and declared on two prop types — and rendered nowhere. `Button`'s own
TSDoc says `busy` keeps the label *"so the button does not resize or change
wording mid-action"*. Three layers of plumbing for copy the design system had
already decided not to show.

Both keys deleted. The primitive was right.

## Check that a spec's files exist before re-pointing anything (2026-08-12)

T-078 set out to re-point assertions and found **two tests already throwing**.
`responsive-dashboard-operations.spec.ts` reads two files the live-ops rebuild
deleted; `read()` is a bare `readFileSync`, so the tests die before asserting.
The rebuild that wrote the lesson *"a spec that names a file rots when the
behaviour moves"* missed one of its own call sites.

**First step of any spec work: existence-check every `read()` path.** It is one
script and it tells you what is already broken versus what you are about to
break.

## Cross-reference a re-pointed claim; do not duplicate it (2026-08-12)

The live route's responsive and direction claims had already been re-pointed
into `web-admin-m3-operations.spec.ts`. Copying them into a second spec would
make **both** weaker — either can drift while the other still passes.

The rule sits beside T-063's *re-point the assertion, do not delete it*:
**re-point it once, and cross-reference from anywhere else that used to assert
it.** De-duplicating a claim that is asserted elsewhere is not dropping it.


## Dress the native control; do not replace it (2026-08-12)

T-081 built the `FileUpload` primitive one task after T-080 found that `Select`
cannot participate in a form. The same trap was waiting: a JavaScript picker with
a styled button would look right and **submit nothing**.

The shape that works is **the native input, visually hidden but never replaced,
inside a `<label htmlFor>`**. That one decision buys click-to-browse, keyboard
operation and form participation for free — no `ref.click()`, no key handler, no
hidden mirror field. The zone is clothing; the input is the control.

**And the ring follows the control.** A 1px clipped input still takes focus, so
`:focus-within` draws the ring on the zone — otherwise a keyboard user is focused
on something invisible.

**WEB-012 and a file drop.** `inputRef.current.files = dataTransfer.files` is a
property write on a rendered node. It is the *library-handoff* exception, not a
breach: there is no React API for populating a file input, everything the reader
sees stays state, and without it a dropped file displays and then submits nothing.
**The rule bans DOM writes that stand in for render.**

## A form is a column of fields, not a block (2026-08-12)

*Save notes* sat flush against its textarea with **zero** gap. The reflex is a
margin on the button; the cause is that `<form>` is a block element and nothing
had given it a layout. One `flex-direction: column` and one gap token fixed it for
every field in that form, and the same class fixed the upload form beside it.

**When two adjacent controls touch, look at their container before their margins.**

## Dead code is rarely as dead as the note says (2026-08-12)

T-077 set out to delete four orphan trees and could only delete one.

1. **A spec that reads a file as text pins it.** Four spec files `readFileSync`
   `DashboardView.tsx`; two more read `dashboard.module.css`; two read
   `FactoryList.tsx`. **Deleting any of them fails the suite at runtime, not at
   compile time** — invisible to `tsc`, to the typography gate, and to a grep
   for `import`. Always search `e2e` and `scripts`, not just `src`.
2. **A type-only cycle reads as "still referenced".** Three planning components
   were imported for types by `assistant-view.ts`, which was imported only by a
   fourth dead component. Resolve it by asking what imports the set from
   *outside* the set.
3. **Check basenames for collisions before deleting.** `planning-assistant`
   existed in two directories — one live, one dead.
4. **`operations.module.css` was not dead**, contrary to T-072's record (now
   amended). Its typography was all on dead classes; the file itself is live.

**And the enforcement the rule assumes is missing:** none of the deleted files
carried the `@retiring` banner WEB-006 §4 mandates, and `gate:retirement` does
not exist in `package.json`.


## Task-ID collision: T-076 is used twice (2026-08-12)

Two concurrent sessions both claimed **T-076** — `/visits/[id]` foundation and
`planning family — typography, visible pass`. Both are recorded, both have
session files, and the tracker now lists two `### T-076` headings.

**Not renumbered unilaterally.** Renaming either chain breaks the cross-references
already written into the other's records, the retirement ledger and the session
log. A human should pick which chain moves. **The tracker has no ID reservation,
so parallel agents will keep colliding** — claiming the next id at the *start* of
a task, in the tracker, would prevent it.

## A primitive that cannot carry a `name` cannot be in a form (2026-08-12)

T-080 nearly swapped four native `<select>`s for the SAQEEL `Select`. It is a
controlled listbox — `value` + `onChange`, **no `name`, no hidden input** — and
those four controls submit through server actions that read `FormData` by name.
The swap would have **compiled, rendered correctly, and silently sent an empty
field on every governed write**: return, reassign, visit type, repackage.

`TextInput` has the same shape problem in miniature — no `datetime-local`.

1. **Before migrating a control, ask what reads it.** A form POST reads the DOM,
   not the React tree. This is T-043's portalled-control lesson with a second
   victim, now covering `<select>` and `<input>`.
2. **Keep the native control inside `Field` and hand-reset it** — the fourth
   recorded instance of *`saqeel.css` has no global control reset by design*.
3. **Both gaps are raised, not filled.**

## A per-file sweep misses what a per-route sweep catches (2026-08-12)

T-076 fixed thirteen UTC timestamps in `visits/[id]/page.tsx` and verified zero
`YYYY-MM-DD HH:MM` in the rendered DOM. T-080 found a **fourteenth** —
`uploadedAt.slice(0, 16)` in `Attachments.tsx`, two components down. It never
showed in the DOM check **because that visit had no attachments**.

**A render check only covers the states that rendered.** Pair it with a source
sweep across every child component, and provoke the states that carry the rest.

## Re-pointing an assertion can strengthen it (2026-08-12)

`cd-027` asserted the literal `role="status"` in `ActionBar.tsx`. After the
rebuild those roles come from `Text`'s `live` prop. The replacement asserts
**three** things — the call site's prop, the `aria-live` wrapper, and that `Text`
renders `role={live}` — which the original could not: a literal `role=` in a file
proves nothing about whether it reached the DOM.

**When a re-point is forced, ask whether the old assertion tested the claim or
just a spelling.**

## A hand-rolled copy inherits the bugs, never the fixes (2026-08-12)

`DataTable.head` used `overline` where WEB-014 assigns `label`; T-059 fixed it
in the primitive. T-076 then found `planning-visit-table` **hand-rolling its own
`<table>`** with the same defect, and three `planning-bulk` components repeating
it for KPI labels — the **fifth and sixth** instances.

The primitive was fixed once. Every copy of it still carries the original bug,
and will keep carrying it, because a copy is frozen at the moment it was made.
**Before fixing a rendering defect, look for the primitive it should have been.**

## Four dead trees are now known (2026-08-12)

`DashboardView` (13), `FactoryList` (3), `operations.module.css` +
`operations-details.tsx` (26), and `components/sections/planning/*` (30) — **72
violations in code with zero importers.** They surface in every audit and cost
real time to re-diagnose each pass. One deletion task clears all four.


## A string is written for a slot; moving it breaks it (2026-08-12)

T-079 fixed four defects T-078 introduced, and they were **one defect wearing four
hats**: a string reused somewhere it was not written for.

- `auditHeading` passed as *both* the history card's title and its fourth
  section's heading — so the card printed its own name twice.
- `noJourney` used as the empty state for **Location & provenance**.
- Four sections each carrying their own immutability caveat, so one card said
  "append-only / cannot be edited / only added to" four ways.
- `"Assignment:"`, `"created by"`, `"review:"` — written for sentences
  (`Assignment: Maha`) and dropped into `<dt>`, colons and all.

**A migration moves strings into new slots, and a slot has a shape**: a label is
capitalised, carries no colon and carries no data; a value carries the data; a
caveat is stated once at the level that owns it. **Re-read the copy in its new
position, not in the diff.**

**`{n} visits under this plan` was a label containing a count** and it
mispluralised to *"1 visits"*. Splitting it into `Status` and
`Visits under this plan = 1` fixed the plural **by construction** — no plural
rule needed, because the number moved to where numbers go.

## Search for the helper before writing the fallback (2026-08-12)

The same task rendered `published` and `periodic · physical` because the route
used `t(\`enum.${v}\`, v.replace(/_/g, " "))`. `lib/text.ts` has exported
`humaniseEnum(value, locale)` and `sentenceCase(value, locale)` all along, and
`features/operations` has used
`sentenceCase(t(\`enum.${v}\`, humaniseEnum(v)))` since T-042 — the local version
was the same idea with the sentence-case missing.

**And humanisation is not translation.** It makes an untranslated column
*readable*, not localised: those 26 `enum.*` values now read *Follow up* and
*Pending supervision* on the Arabic screen too. The app-wide `enum.*` gap is what
would fix that, and it is still open.

## Split a component by what it is, not by where the line count lands (2026-08-12)

T-078's first cut of `visit-detail.tsx` was 239 lines, over the 200-line soft cap.
The tempting fix is to slice off whatever gets it under. The excess turned out to
be **ribbon track construction** — reading the data layer and the messages to
build five view models, which is not composition at all. Moved to
`features/visits/detail/ribbon.ts`, the component fell to 180 and nothing was
deleted or duplicated.

**A component over the cap is usually holding something that belongs in another
layer.** The line count is the symptom; the misplaced responsibility is the
defect. Ask what each block *is* before asking which block to cut.

## Deferring a rule violation is legitimate when the fix would be done twice (2026-08-12)

T-076 left `/visits/[id]`'s route file at 443 lines against a 40-line cap, and
said so plainly rather than letting it pass. Reaching the cap then would have
meant extracting ~240 lines of legacy JSX into components that T-078 rewrites on
SAQEEL — the same work twice, with a real chance of a silent transcription error
in between. T-078 did it once: **546 → 43**.

**State a deferred violation, name what unblocks it, and land it in the slice
that was always going to touch that code.** A quiet miss and a recorded deferral
look identical in the diff and are opposite in kind.

## Ordering can be the defect (2026-08-12)

The visit detail screen put its management actions — return, republish, reassign,
reschedule, cancel — in an `<aside>` **after five history timelines**, roughly
2,500px below the fold, while the lifecycle ribbon's *"Allowed from here"* line
sat at the top telling the reader what they were permitted to do. Nothing was
missing and nothing was mislabelled; the sequence was wrong.

**Audit the order of a screen against the reader's task, not just its contents.**
The fix moved one node and needed no new data, no new copy and no new component.


## Counting a prefix is not counting coverage (2026-08-12)

T-076 sized `/visits/[id]`'s i18n work by running `grep -c "'visit\."` over the
migrations, got 93, and wrote into the record and the tracker that slice 2 would
be *"a port of existing reviewed Arabic, not re-authoring"*. That was approved on
those terms. Checking `used ∩ seeded` **per key** before starting T-077:

```
139 keys used by the route · 21 seeded with Arabic · 3 inline · 115 with none
```

The 92 seeded `visit.*` keys belong to *other* visit surfaces — the board, the
spine, the ledger. Not one of `visit.ribbon.heading`,
`visit.detail.configuration`, `visit.att.heading` or `visit.actions.returnBtn` was
among them. The slice was not a port; it was the largest Arabic authoring job in
this programme.

**A prefix count answers "how many rows mention this", never "is my screen
covered".** Intersect the keys the code actually calls with the keys that exist.
And when an estimate that was approved turns out wrong, say so and re-agree the
scope before spending the effort — the number changed what the work *was*.

## Reviewed copy is not automatically clean copy (2026-08-12)

Nine engineering identifiers were shipping to users on that route in both
locales — `FLD-VIS-001`, `set_operational_state` and `(M8)` in English;
`PLN-REQ-011`, `M02-006`, `M02-006/008`, `M01-050` in the **seeded, reviewed**
Arabic. That is exactly the defect
`20260731120000_simple_english_terminology_redo_ar_strings.sql` exists to fix —
its own notes read *"raw '(RLS)' was directly user-visible"* — on rows that pass
never reached. **A `status: draft` review stamp is not a guarantee about content.**

## A typed namespace converts a silent-fallback class into a build failure (2026-08-12)

All 144 `V.*` references type-checked on the first run after the rewrite. That is
the property `t(key, "English")` can never have, and it is *why* 115 strings on
this route had no Arabic while nothing ever failed: the fallback is the feature.
Once the namespace is typed, a renamed or dropped key is a compile error.

This is the third route where moving copy into a resource is what made the gap
countable (WEB-013 §8) — after `/planning/immediate` and `/operations/live`.


## A screen that disagrees with itself is telling you where the bug is (2026-08-12)

T-076 found `/visits/[id]` rendering **every** timestamp in UTC — three hours
early on a Saudi ministry record. Twelve `toISOString().slice()` sites: the visit
window, submission versions, plan dates, and four event streams.

**The proof was already in the file.** `cutoffDisplay` used `Intl.DateTimeFormat`
with `timeZone: "Asia/Riyadh"` — one correct timestamp among twelve wrong ones, in
the same component, while `formatDateTime()` had been sitting in `lib/dates.ts`
the whole time. **When one instance of something is right and the rest are wrong,
the right one is the specification.** A thirteenth site was the `riyadhToday()`
defect this document already records, bounding the repackage options by the UTC
day so a package version could be judged out of its window three hours early.

**Verify a date fix in the rendered DOM, not the diff.** The check that settled it
was "zero `YYYY-MM-DD HH:MM` matches in the whole document" — a formatter that
missed a call site would still have compiled and still have passed the gate.

## `as unknown as` hides nullability, and nullability is a crash (2026-08-12)

The same route carried eight casts. Moving its reads onto `readRows`/`readSingle`
with a `Shape<T>` made the compiler report what they had suppressed: `factories`
and `package_versions.packages` are **nullable**, and both were dereferenced
unconditionally. A visit whose factory RLS hides would have thrown a runtime
`TypeError` inside a Server Component — a blank error page, not a degraded read.

T-042's rule was "every `as` in a data layer is worth re-deriving". The sharper
version: **a cast does not silence a type error, it defers it to a user.**

## Check what an assertion protects before generalising it (2026-08-12)

Re-pointing `cd-027`'s "no raw provider text" check, the obvious move was to widen
it from `page.tsx` to the whole feature source and match `/\.error\.message/`. It
failed immediately — `queries.ts` logs provider messages to the **server console**
on purpose, which is the narrowing boundary reporting *why* a read failed. The
rule was never "the string must not appear"; it is "none of it reaches the reader".
The broad check stayed on the rendered surface and only `vErr`/`attErr` widened.

**A generalised assertion that fails on correct code was the wrong generalisation.**


## A size-only audit misses an inverted hierarchy (2026-08-12)

T-075 found `EmptyState` — a shared primitive with **44 consumers** — rendering
its title at **12px/600 above a description at 14px/400**. The heading was
smaller than the text it introduces.

**Both values are on-scale, so nothing flagged.** No gate, no token audit and no
list of distinct sizes shows this; it is only visible when a title is compared
against its *own* description. With the explain-panel key/value inversion
(T-059) and the factory-portfolio heading (T-064), that is three of these found
so far.

**Dump weight and colour alongside size when auditing a route**, and compare each
heading against the thing it introduces — not against the scale.


## A dependency can put a second typeface on your screen (2026-08-12)

T-074 found `/operations/live` rendering its Mapbox attribution in
`"Helvetica Neue", Arial`. The route's own CSS module was **completely clean** —
13 lines, no typography, zero static violations. The declaration came from
`mapbox-gl`'s stylesheet, so it exists in no source file, no token and no gate
rule this repository can write.

**Third-party chrome is still your typography.** Any dependency that injects DOM
— maps, editors, charts, date pickers — ships its own font stack. Measure the
rendered families; the source will never tell you.

**And normalise it in one place.** The fix went into a new
`components/saqeel/map/map-chrome.module.css` that both map canvases compose,
which *removed* the duplicated per-route `:global()` block instead of adding a
second one.

## When a route hangs on its fallback, check the session first (2026-08-12)

T-072's record blamed the Browser pane for `/dashboard` and `/factories` sitting
on `loading.tsx` forever. The real cause, found in T-074, was **the browser
session expiring mid-task**: the routes returned the login page and the fallback
never swapped. That record has been amended.

```js
const r = await fetch(location.pathname, { credentials: 'include' });
(await r.text()).includes('Keep me signed in')   // → session is gone
```


## A raw enum is why a heading cannot be translated (2026-08-12)

T-073 found `/operations/exceptions` rendering
`<h2>{category.replace(/_/g, " ")}</h2>` — `correction overdue`, lowercase,
straight from the column. WEB-000 §9 already bans `{value: v, label: v}`, but the
reason worth remembering is the **second-order** one: a screen that prints a
column has *nothing to translate*. There is no label, so there is no Arabic, and
no amount of i18n work on that file would have produced any. **Check enum
rendering when a screen resists translation.**

## Check that an error state is reachable before designing it (2026-08-12)

The same board displayed `{invariantOk ? "✓" : "⚠"}` — a check that grouped
counts equal the source count. The first proposal replaced the tick with a proper
fail-closed state that withdraws the counts. Re-reading `groupExceptions` showed
it **partitions every source into exactly one bucket**, so the sum always equals
the length and the `⚠` branch is unreachable by construction. The redesign would
have been untestable code guarding an impossibility.

1. **A status that can only ever have one value is not a status.** It was removed,
   not restyled.
2. **Deleting it from the UI did not weaken the guarantee** — the invariant stays
   proven in `mvp2-m2-09-exceptions.spec.ts`, which is where a partition bug would
   actually be caught. A unit test is a better home for a correctness invariant
   than a glyph a supervisor cannot act on.

## Widen a shared assertion per-route, never in one string (2026-08-12)

`mvp2-modules-live.spec.ts` asserts a visible `.sq-banner, .sq-state, .alert,
.panel` across **seven** routes — the claim being *a hard state is always present,
never a blank page*. A migrated route carries none of those classes. Appending
SAQEEL selectors to the shared string would have let any of the six unmigrated
routes lose its panel and still pass on a SAQEEL match. The table now takes an
optional per-route selector; each route brings its own as it migrates, and the
default stays byte-for-byte what it was.


## The same primitive mistake, three times (2026-08-12)

`MetricStrip` (T-058), `DataTable.head` (T-059) and now `StatCard.label`
(T-072) all used `overline` (11px) for something WEB-014 §5.2 defines as
`label` (12px). Three shared primitives, one misreading of the role.

**`overline` is *only* the uppercase eyebrow above a card title.** A KPI tile
label, a table column header and a key in a key–value row are all `label`. When
a defect appears in a shared primitive, fix it there — the same bug in three
primitives cost three separate route audits to find.

## Provoke the empty and error states (2026-08-12)

T-072's fourth unstyled-heading find — `GeoMap`'s `<h4>Map unavailable</h4>`
falling to the browser default — appeared **only because the map happened to
fail on one render**. It had been invisible in every earlier pass of every
route that embeds a map.

**A route audit that only sees the happy path is incomplete.** Error, empty,
loading and permission-denied states carry their own headings and their own
absent declarations.


## A second implementation inherits only the bug (2026-08-12)

T-071 found the Live Operations map hardcoding `lightPreset: "day"`, so on this
dark application the **largest element on the screen was a white slab**. The fix
had existed for months: `GeoMap`, the map `/operations` uses, tracks `data-theme`
on `<html>` with a `MutationObserver` and re-applies `setConfigProperty` when the
user toggles. `/operations/live` re-implemented the map and carried none of it.

**Every fix made to the original since the fork was a fix this screen did not
get.** When two files render the same thing, the second one is not "similar" —
it is frozen at the moment it was copied. Look for the sibling implementation
before debugging a rendering defect.

**A disclosure that is always true is not a legend entry.** The screen rendered
all three position-provenance states as a permanent rail, including
"Rejected implausible telemetry" in critical red, **with zero inspectors on
screen** — a colour-coded alarm for a condition that was not occurring. The split
that resolved it: *"Last recorded position — not guaranteed live"* is a claim
about the whole screen and is always shown; `unavailable` and `rejected` describe
individual rows and appear only when a row is in that state.

**Two empty states are one defect until you separate the two facts.** "Nothing in
scope" and "in scope but unmapped" had been conflated in a single
`noScopeRows || hasNoPositions` condition and printed the same sentence in two
places. They are different states — the second can be true while the list is
full — so the list states the empty case once and the map discloses the unmapped
case **only when the list is not empty**. Neither can now speak over the other.

**Fold a notice into the surface it describes rather than stacking it.** Four
amber bars above the content were all disclosures *about the map's data*; they now
render in the map card, keeping their `role="status"`/`role="alert"`. That also
**avoided adding a fourth copy of the Notice component this repo already has three
of** (`dashboard-notice`, `planning-notice`, `regulation-governance-notice`) — the
primitive gap stays raised rather than quietly filled a fourth time.

**A spec that asserts nesting outlives its usefulness the moment the nesting is
right.** `aside[…] button[aria-pressed] > bdi` pinned three structural accidents
at once and blocked making the row itself the control. Re-pointed to the row: the
guarantees are that the inspector name is direction-isolated and that the row
selects — not which element contains which.


## A spec that names a file rots when the behaviour moves (2026-08-12)

T-070 moved `/operations/live`'s reads out of a 412-line route file. Every
assertion in the "Live composition contract" — access ordering, integrity
filters, geography scoping, position provenance — was written against
`live/page.tsx` **as a single file**, so twenty claims that were all still true
would have gone red. `livePageSource` is now the route **plus its feature
modules**, which is exactly how `pageSource` had already been built for
`/operations` three hundred lines up in the same spec file.

1. **Read the spec's own precedents before re-pointing it.** The right pattern
   was already in the file; inventing a new one would have made the two routes
   inconsistent.
2. **Verify a re-pointed assertion against the real file, not by eye.** All 52
   were checked by script — every substring, both ordering checks, and the
   `/operations` assertions that had to survive the shared `AccessNotice` change.
   Three would have failed silently (`latestPositionByVisit.get(v.id)` became
   `.get(visit.id)`; two English literals had moved into the locale files).
3. **Re-point a claim, and check whether it is still the right claim.**
   `live.module.css` asserted `[dir="rtl"]` — a rule WEB-002 §6 **forbids**. The
   replacement asserts the opposite: logical properties, no direction override,
   no physical `left`/`right`.

**The Arabic language was living in a route file.** ~90 strings as
`t(key, locale === "ar" ? ar : en)`, and three with no Arabic in code, in the
locale files, or in `ui_strings` — so an Arabic reader got English and nothing
ever failed. Only moving copy into a resource makes the gap countable
(WEB-013 §8), which is now the third route where that has been true.

**A streaming fallback that never swaps is the hidden pane, not a bug.** With the
Browser pane undisplayed, the rendered DOM keeps each route's `loading.tsx` in
`<main>` with the resolved subtree in a body-level div. It reproduces on routes
the task never touched. Same limitation as the zeroed layout rects already
recorded below — **check an untouched route before diagnosing your own change.**


## Deleting a font-size from a button does not make it inherit (2026-08-12)

It makes it **Arial**. T-069 hit the T-064 bug again in a new place —
`factory-verification.module.css`, where most sized classes sit on `<button>`
and `<label>`. Stripping their `font-size` to satisfy the gate would have
dropped every chip, checkbox and attach control on the iPad inspection form to
the UA default face.

**`font: inherit` is the fix, and it is gate-legal.** Use it on any control
carrying text. Delete the declaration only for pure text, which inherits `body`.

**A green gate is not a green build.** Two bulk-regex mistakes in this task —
three unbalanced JSX tags and duplicate `font: inherit` declarations — were
caught by `typecheck`, not by `gates:typography`, which reads CSS and matches
single lines. After a bulk edit: compile, then read the diff.

**`/field/*` is a role boundary, not a lost session.** It returns
`login?reason=unauthorized` for a Planner. Verifying any field surface needs an
**inspector** persona — re-authenticating as the same user will not help, and a
redirect to `/login` there must not be read as a broken session.


## Two branches can read two variables and nothing will tell you (2026-08-12)

T-068 found the Operations Center's perspective toggle changing **half** the
screen. `activeView` (client state) drove which pins the map received; the
"National performance by region" section was gated on `view` — the URL prop the
toggle never updates. Selecting *National performance* swapped the dataset and
rendered no national content at all, and arriving at `?view=performance` then
clicking back stranded the section on screen.

**Both branches existed, both compiled, both passed every gate.** The approved
design has a single flag (`opsIsNational`) gating both. Three rules follow:

1. **A control that owns half a screen owns all of it.** When one piece of state
   has two representations, the bug is not which branch is wrong — it is that
   there are two.
2. **The state ladder ranks sources of truth, not storage mechanisms.** WEB-004 §1
   puts URL state above `useState`, and `/planning` (T-055) moved up that rung
   correctly. Here it is the wrong trade: **both datasets are already props**, so
   navigating on a tab click would re-run ten server reads and a signed-URL round
   trip to render what the browser already holds. Client state was kept
   deliberately, and there is now exactly one source of truth. **Record the reason
   when you decline a rung, or the next agent will "fix" it.**
3. **Duplication is counted in destinations, not in buttons.** The exception board
   had three entry points on one screen — a toolbar button, a KPI card CTA, and
   the section listing its rows — while `saqeel-revamp.html`'s ops toolbar carries
   **one** button and no route buttons at all. The fix was not deletion: each
   addition moved onto the surface it describes. Controls 4 → 2, **destinations
   lost 0**.

**A list sorted by a key it never shows is unreadable, and a status that never
varies is not a status.** `buildHighlights` computed a timestamp for every
exception, sorted by it, and the row type had no field for it — the design's
highlight row carries that line. Every leading pill read the same word, "Open".
The pill now carries the row's kind and the title carries the record, which is a
slot re-assignment, not new copy.

**Promoting a string makes its translation gap yours.** The eight highlight kinds
were `t(key, "English")` against `ui_strings` rows that do not exist, so they
rendered English on the Arabic screen — pre-existing, and invisible inside a
run-on description. Moving them into a prominent pill is what exposed it, so they
moved into `operations.highlights` in both locales rather than being parked.

**`DashboardView.tsx:426`'s lesson needed restoring a second time.** Every region
card wore a **pinging** "Compliance unavailable" pill — eight of them, the loudest
thing on the view, saying nothing. State an absence once, at the level that owns
it, and give the card back its real number.

## A fix verified on one screen says nothing about the others (2026-08-12)

T-067 found the owner’s **original** complaint — "the font 81.5 is so big
compared to the rest" — still live on `/factories/cr/[id]`, four tasks after it
was reported. `81.5` rendered at 26px and `Not Available` at 32px from an
inline `style={{ fontSize: "2rem" }}`, two panels apart.

The scale, the primitives and the gate were all in place. This route simply had
never been opened. **Route coverage is not a property of the design system; it
is a per-route fact that has to be measured.**

**24 of its 26 headings carried no class at all** — 18 `<h2>` at the browser
default 22px, 5 `<h3>` at 17px. With T-059’s page title and T-064’s Arial
button that is now three instances of the same defect class: **the value was
decided by an absent declaration.** No grep, no token audit and no gate rule
sees a missing property. Only measuring the render does.

**A gate that blocks the easy fix is working.** The two-line repair was
`.panel h2 { font: var(--sqx-text-heading) }` in the route’s CSS module — which
would have *raised* the ratchet. Converting the markup to `Heading` cost no
more and paid down debt instead of adding it.


## A primitive's gaps only show up during migration (2026-08-11)

T-065 moved 20 `/factories` components onto the type primitives and found three
gaps the inventory had missed, each of which would have caused a silent defect:

1. **`Text` had no `dir`.** Nine call sites carry `dir="auto"` on user data. In
   an Arabic-first app that is correctness, not decoration — without it a mixed
   Arabic/Latin string renders in the wrong visual order.
2. **`role="alert"` collided with `Text`'s own `role` prop**, which names the
   typography role. Added `live` rather than renaming `role` everywhere.
3. **`Heading` could not express a heading that renders small.** A heading's
   semantic level and its visual weight are independent — that is the point of
   `visual`, so it must cover the whole scale, not just the large end.

**A violation count is never worth a real heading.** The portfolio summary was
an `<h2 id>` serving as its card's `aria-labelledby` target; converting it to
`<Text as="span">` satisfied the gate and removed a heading from the document
outline. Reverted, then done properly once `Heading visual="label"` existed.

**Do not change colours while migrating typography.** A regex strip removed
`font: var(--sqx-text-metric)` from the portfolio KPI values with nothing
replacing it — every number would have shrunk 28px → 14px. The fix used
`Metric tone="inherit"` so the status colours stayed exact rather than being
swapped for the `Text` tone family.

Both near-misses were caught by **measuring the render, not reading the diff**.

## A typeface can be decided by something absent (2026-08-11)

T-064 found the factory name on `/factories` rendering in **Arial**.
`button.factories-portfolio_select` never declared `font: inherit`, so it took
Chrome's UA button default of 13.33px Arial, and the `.name` span inside set
only `font-weight` and inherited it. The most important string on the route, in
a different typeface from the rest of the application.

**Nothing in the source looks wrong.** There is no bad value to grep for, no
token misused, nothing for the gate to flag — the defect is a *missing*
declaration. With T-058's `--sqx-font-sans` bug this is now a pattern, and the
rule that follows is: **`button`, `input`, `select` and `textarea` do not
inherit `font`. Any of them carrying text needs `font: inherit` or an explicit
role.**

**Measure the alternative before committing to it.** `subheading` (16px) was
tried for the picker row and reads as obviously correct in source; measured, it
added a fifth size to the route and rendered the same factory name at 20px, 16px
and 14px on one screen. `body-strong` keeps `/factories` at the same four sizes
as `/dashboard`.

**A gate rule can flag but must not auto-fix.** The five `eyebrow` call sites
needed three different answers — a subtitle in the wrong slot, a **title** in
the wrong slot, and a provenance line whose card already had a description.

## Deleting a panel is a contract change (2026-08-11)

T-062 removed the Operational priorities panel on an owner ruling, after T-060
had refused to remove it unilaterally because two e2e specs asserted it as a
**canonical panel**. Two rules came out of doing it properly:

1. **Move the information before deleting the container.** The panel's summary and
   governance footnote now live on Today's operations. A card can be redundant
   while the sentences inside it are not.
2. **A spec update records the deletion; it does not drop the assertion.** The
   heading is asserted at **count 0** *and* both moved strings are asserted
   visible, so the contract states what went and what survived. Deleting the
   line instead would have left the contract silent.

**Do not re-baseline the typography ratchet as a side effect, and do not claim
another agent's improvement.** During T-061/T-062 the gate reported "7
violation(s) removed since the baseline" and invited `gates:typography:update`.
Neither task touched a single typography declaration — the removals came from a
**concurrent typography pass sharing the same uncommitted working tree** (27 files
under `components/sections/factories/**`, `saqeel/definition-list/` and
`app/(app)/factories/**`). Two rules: read a gate's delta against `git status`
before attributing it, and never re-baseline a ratchet mid-pass on someone
else's work. A green gate needs no re-baseline, because the ratchet only fails on
additions.

## Colour is a claim (2026-08-11)

T-061 found the enforcement trend colouring a fall in penalty notices `success`
and a rise `warning`, one line below a comment insisting the movement "is a
signal to read, not a score". Fewer penalty notices can mean improved compliance
or reduced enforcement coverage; the screen cannot know which, and the executive
brief on the same screen promises it "does not attribute a cause".

**A tone is a governed judgement, and CLAUDE.md §9 bans inventing one.** Three
rules follow, all of them now in code with the reasoning attached:

1. **Neutral until the ministry publishes a direction.** Movement gets a
   magnitude and a period, never a verdict. The reasoning lives in the function's
   doc comment, because a future agent will otherwise restore the colour as a
   nice touch.
2. **A tone applied to a series paints every point.** The decline was drawn by
   colouring the *previous* period — the one with more enforcement — green.
   Check what a tone lands on, not just what it means.
3. **Zero is not a small quantity.** `TrendBars` floored every bar at 4px in the
   value colour, so a period with no enforcement looked like a period with a
   little. A zero point is now a dashed baseline with a printed `0`.

**A chart also needs its labels visible, not only announced.** The period dates
existed solely in `sqx-visually-hidden`, so a screen-reader user could tell which
bar was the current period and a sighted user could not — the approved design had
specified a visible label and value under every bar all along.

## A verification limit to know about (2026-08-11)

With the Browser pane undisplayed the page stops compositing, so screenshots time
out and **every `getBoundingClientRect()` returns 0**. Computed styles and DOM
structure are unaffected. If layout numbers come back as zeroes, the pane is
hidden — do not conclude the element is missing.

## A rebuild can drop a lesson its predecessor wrote down (2026-08-11)

T-060 found the dashboard's reported clutter was **not** accumulated debt. The
retired `DashboardView.tsx:513` passed `excluded={representedIds}` into its
coverage grid so no measure rendered twice, and `:426` recorded why the blocked
states had been consolidated: *"repeated warning pills made disciplined absence
read as a broken product."* The rebuilt `strategic-view` passed all twelve ids and
gridded every blocked one. Both lessons were in the file being replaced.

Two rules follow:

1. **One governed measure renders once per view.** `STR-KPI-001` was showing as
   "Compliance rate trend" and "National compliance rate" with the identical
   numerator and denominator. Two names for one figure is a governance defect,
   not a layout one — the reader cannot tell whether they are two measures that
   agree. `features/dashboard/strip.ts` now owns the exclusion sets.
2. **Read the retiring file for its recorded reasoning before replacing it.** A
   comment explaining a deletion is the most expensive kind of knowledge to
   rediscover, and it is deleted along with the code that carries it.

## Read the e2e specs during inventory, not after review (2026-08-11)

Two of T-060's planned changes were wrong and the specs said so before any code
was written. "Operational priorities" holds no control and duplicates two tiles
below it, but `web-admin-m1-dashboard.spec.ts:217` and
`dashboard-business.spec.ts:124` assert it as a **canonical panel** — deleting it
is a contract change needing a ruling. And promoting "Your work" to the card
title would have broken three exact-heading assertions on the persona name; the
actual defect was that **`yourWork.scoped` was defined in both locales and
rendered nowhere**, while `:166` asserts it is visible.

**A spec is part of the inventory.** It also revealed that
`web-admin-m1-dashboard.spec.ts:200-215` asserted a heading and body copy that
exist only in the retired `RevampStrategicView` — already failing before any of
this work. **T-063 fixed it, and found the same rot in two more specs**
(`dashboard-business.spec.ts:92-93`, `exec-hard-states.spec.ts:103`).

## Read the design's data model, not only its markup (2026-08-11)

T-066 found the Operational View rendering seven metrics under one heading where
`saqeel-revamp.html` defines **four labelled groups** — Today's operations,
Execution status, Approvals, Operational exceptions. Every previous dashboard task
had read the design's *markup* for card anatomy and section order; the grouping
lives in its `OPERATIONAL` **data model**, further down the same file, and had
never been read.

Three things followed from it, and they are the pattern to expect:

1. **The heading was factually wrong for four of its seven cards.** Returned
   reports are not "today's operations". A heading that misdescribes its contents
   is worse than no heading.
2. **The visual defect was a symptom, not the fault.** Seven cards in a
   six-column grid stranded the seventh beside ~1100×180px of dead space. Fixing
   the grid would have hidden the mislabelling.
3. **The fix was free of functional risk because the order already matched.** The
   metric array was already in the design's group order — only the boundaries had
   been lost, so the diff is pure composition.

**A spec that asserts a sentence is hostage to copy.** T-062 asserted the summary
sentence was visible; T-066 deleted that sentence one task later, so both specs
were re-pointed at the four group headings instead. Assert structure.

## A spec that greps source can rot without the DOM changing (2026-08-11)

Two of the six dead assertions T-063 repaired were **static**: that spec reads
source files as text, and asserted `en/dashboard.json` contained two governance
sentences that live only in the retired component. `grep -c` over the locale file
returns **0** for both. A DOM-only fix would have sailed straight past them, and
the failure reads like a copy regression rather than a stale test.

1. **Re-point the assertion; do not delete it.** Each dead line was moved to
   where its claim actually lives — "no quarterly series is inferred" onto
   `STR-KPI-003`'s registry note, "no generated claim until a configured
   provider" onto `STR-KPI-012`'s.
2. **A claim about what the platform refuses to compute belongs on the registry,
   not in a locale file.** A redesign can move a string; it cannot move an
   immutable formula note — and these two assertions had already been broken once
   by exactly that. Copy assertions are for reader-facing honesty.
3. **`innerText` lies when the page is not compositing.** With the Browser pane
   hidden it returns empty for genuinely rendered nodes while `textContent` is
   unaffected. Three assertions looked absent until re-checked.

## `/dashboard` typography is closed (2026-08-11)

Both views render the **identical** size set — 28 · 20 · 14 · 12 — with zero
off-scale values and one typeface. Verified signed-in in a browser, not read
from source.

**A static gate cannot catch a disagreement between two valid tokens.** T-059
found KPI numbers rendering at 30px and 28px on the same screen — the owner's
original "81.5 is so big compared to the rest" complaint, still live after two
tasks aimed squarely at it, because both call sites were token-clean and the
gate had nothing to flag. Two more defects surfaced the same way: table headers
at 11px against every other label's 12px, and a page title with **no font rule
at all**, falling back to the browser default on every route.

The lesson is now WEB-008 practice: **a screen is not done until it has been
rendered and measured.** Source reading and a green gate are necessary and not
sufficient.

Remaining on the route: 21 violations — 13 in the dead `dashboard.module.css`
(deletion, not migration) and 8 in `explain-panel`, blocked on `Heading` needing
`ref`/`tabIndex`.


## The app had four typefaces (2026-08-11)

T-058 found `--sqx-font-sans` pointing at two fonts that were **never loaded**.
`next/font/local` registers a scoped family (`plexArabic`); the token named
`"Readex Pro", "IBM Plex Sans Arabic"` as string literals, so every
token-styled element fell through to `system-ui` while elements referencing
`--font-plex-arabic` directly rendered the real face. Result: **Segoe UI on 224
elements, IBM Plex on 209, Times New Roman on 4, Consolas on every mono site.**

Two lessons that outlive this fix:

1. **CSS never errors on a missing font family.** It renders something else, and
   the token still reads correctly to anyone reviewing it. Verify a typeface by
   measuring rendered glyph widths, not by reading `fontFamily` (WEB-014 §2.0).
2. **A gate that matches nothing looks identical to a gate that passes.** The new
   `card-eyebrow-above-title` rule found 0 of 24 real call sites on its first run
   because it was line-scoped against multi-line JSX. Prove a new rule fires
   before trusting its green.

Now one typeface app-wide, `--sqx-font-mono` aliased to it, verified in a
browser.

## Card slot order — owner ruling (2026-08-11)

**Title first, always larger and `--sqx-text-primary`. Description second,
`body` and `--sqx-text-secondary`.** This inverts WEB-014 §5 as first written;
the rule document is updated and is the authority. `CardHeader.eyebrow` renders
the rejected pattern and is retiring behind a gate rule — 24 call sites left.

**KPI tiles are exempt** (WEB-014 §5.2): a tile whose subject is a number is
label → value. Do not promote the label above the number.

## Where typography stands (2026-08-11)

T-057 rebuilt the type system after the owner reported, from a `/factories`
screenshot, that the app did not look like an enterprise product. The finding
that matters to every future task: **the rules were being followed and the
output was still inconsistent.** Both components named in the report used only
`var(--sqx-text-*)`, held zero hardcoded values, and passed every gate — one
rendered its prose at 14px and the next line at 11.5px, and the design system
allowed it.

The scale had twelve roles with four inside a 2px band and no rule for choosing
between them, so agents defaulted to the smallest that fit: `caption` was used
164 times against `body`'s 59. **72% of all type usage sat at ≤12px and 3.5%
above 16px** — the app had no typographic top end. Alongside it, **203 raw
`font-size` declarations** were already shipped against CLAUDE.md rule 7, which
is the real mechanism of drift: an agent reads the rulebook, then reads the
neighbouring file, and **precedent beats prose**.

What is now true:

- **Nine roles, one prose size.** `caption`, `body-lg`, `title` and `code` are
  retired, but resolve as aliases so no unmigrated screen breaks. The aliasing
  *performed* the migration — all 164 caption sites became 14px in one edit.
- **Feature code cannot express typography.** Only
  `src/components/saqeel/` may declare a font property; screens compose `Text`,
  `Heading`, `Overline`, `Mono`, `Metric`.
- **`npm run gates:typography` is a ratchet.** 1,130 known violations across 380
  entries are baselined; new ones fail the build and the count may only fall.
- **`WEB-014` is binding law** and is linked from CLAUDE.md rule 7b. Its §9 is a
  review gate every text-touching task answers in its record.

Body stayed at 14px for demo-night safety; **15px remains the recommendation**
for a system read on office monitors, and is a one-token change.

Still owed on this task: axe, 320px, and a browser pass on the authenticated
screens — specifically checking dense tables for reflow now that 11.5px text
renders at 14px.

## Where `/planning/single` stands (2026-08-11)

T-056 took the first-run state after the owner reported it: one search card, a
gap, then a raised sticky bar carrying **Save draft** and **Submit for
supervision**, both permanently disabled, and nothing else on the page. The bar
now renders only when a target exists.

Three rulings from this task generalise:

- **A permanently disabled control is not a preview of an action, it is dead
  UI** — and worse than a hidden one, because a disabled control leaves the tab
  order, so the keyboard user cannot reach the thing that would explain why it
  is disabled. `PublishReadiness` and `PublishBlockers` on this same screen were
  already gated on a target; the bar was the outlier, not the pattern.
- **Deleting a submit button changes how Enter behaves.** A form with no submit
  button submits on Enter when exactly one field blocks implicit submission —
  and on this screen that field was the search box, so the disabled button had
  been suppressing Enter by accident. The fix was structural: search and
  portfolio selection moved **outside** the `<form>`, which is what they are.
  Safe only because the published target has always been built from hidden
  fields rather than read back out of the radios. **Check the implicit-submission
  consequence before removing a submit button from any form.**
- **A step number inside a translated string is data in the wrong file.** Two
  cards both read "2 ·" — `portfolioStep` and `licenseStep`, in `en` and `ar`,
  because they are the same step on two paths and nobody could see both at once.
  Numbers moved to a `CardHeader` eyebrow; the copy holds only the name.

Also fixed: the search input was named three times (heading, `aria-label`,
placeholder) with no visible `<label>`, against `TextInput`'s own TSDoc; the
first run now states what to type and what follows; the skeleton drew three
cards where the screen renders one.

**Owed:** browser, keyboard, Arabic/RTL and axe passes — no dev server was
started. **10 new Arabic strings need a native review.** The screen's other ~110
strings are still `t(key, "English")` on the `ui_strings` table.

## Where `/planning` stands (2026-08-11)

T-055 took the filter bar after the owner reported it still read as cluttered.
The cause was structural, not cosmetic: **`Field` renders `<label htmlFor>` and
`Select` exposed no id to point at**, so every filter printed its name twice —
an unassociated caption plus an `aria-label`. That is a design-system defect with
**12 call sites**, not a planning one; `Select` gained `id?` after an owner
ruling and drops its `aria-label` when passed. The other 11 sites are untouched
until each wires it.

The bar went to search · Status · More filters · Clear all, the remaining nine
filters moved into the panel, and every control now names itself when empty
instead of captioning a box that says "All". **Apply was deleted and filter
state moved from `useState` to the URL** — a rung *up* the WEB-004 ladder, since
that state had only ever mirrored the URL. Filtering was already server-side in
`visit-list.ts` and stays there; instant-apply changes when the server is asked,
not who filters.

One ruling generalises beyond this screen:

- **A caption that is not programmatically bound is not a label, it is
  decoration — and a second copy of the name.** The tell is a component pairing
  a label wrapper with a control that owns its own `aria-label`: the announced
  name is right, so nothing fails a smoke test, while the visible text is inert
  and the screen carries every caption twice. Check that the wrapper can
  actually reach the control's id before assuming a `Field` is doing anything.

**Unverified and highest risk:** the More filters panel must stay open across the
navigation each filter change triggers. If it does not, the screen is worse than
it was with Apply. The owner's Chrome extension is not connected, so this could
not be checked.

T-053 fixed the defect the owner screenshotted: the list route reported
**"No visits match" inside the cells of rows that had matched**, in the KPI
tiles, and in every status-filter option. One binding caused all of it —
`view.ts` had `const dash = labels.empty`, where `labels.empty` is the
empty-*list* sentence.

Two rulings from this task generalise:

- **An empty-state sentence and a null-value placeholder are different strings.**
  Sharing one key makes a screen contradict itself the moment data arrives, and
  the failure is silent: types pass, gates pass, nothing throws. `/planning` now
  distinguishes `table.noValue` ("Not assigned") for a genuinely absent value
  from `table.notConfigured` for a field with no data source wired at all — the
  WEB-009 vocabulary, applied per-field rather than per-screen.
- **A control that can never hold a value is not an empty state, it is dead
  UI.** Four of eight KPI tiles and three of thirteen table columns were
  hardcoded `null` — no source existed for any of them — and they were rendering
  an apology in half the space above the fold. They were deleted, not restyled.
  The check is whether a data path exists, not whether today's payload is empty.

Also removed: the AI band's two panels (hardcoded `<EmptyState>`, no data prop,
could never render content) and the Quick Actions grid, whose entries duplicated
the header create-menu's hrefs exactly and the KPI tiles' counts — Draft and
Returned had each been rendering three times on one screen. Net **−243 lines**.

**Owed on this route:** browser pass, axe, e2e. Same blocker as everything
below — no seeded account.

## Where `/planning/immediate` stands (2026-08-11)

**T-051 was rejected by the owner and reverted in full.** The route is back to
its legacy state — 5 files, 913 lines, zero SAQEEL imports — and is being
rebuilt in five slices. Slice 1 (T-052) took the foundation: `page.tsx`
**252 → 26**, every read behind an `unauthorized | ready` union, and all
**128 strings into `planning.immediate` in both locales**, which took the screen
off `ui_strings` entirely. **Slice 2 (T-054) is the first visible one** — the
nine dispatch protections and the R05 notice, with `AuthorityBar.tsx` deleted at
**6 hooks → 0** and the emoji states replaced by `StatusPill` text-plus-shape.

Two more rulings worth carrying:

- **`saqeel.css` has no global `button` reset, by design.** A `<button>` styled
  as a surface carries a UA border and inherits neither `font` nor `color`, so
  every migrated component that does this resets it by hand. Copying a rule set
  onto a different tag is not copying the solution — ask what the user-agent
  stylesheet already paints on that element.
- **An announcement is usually a derived string, not an effect.** React mutates
  a text node only when the string changes, which is precisely "announce when
  the set changes, not on every keystroke". Two `useEffect`s and a `useRef`
  existed to reproduce what render already does.

Three rulings from this slice generalise:

- **A constant that policy owns does not belong in the component.** `actorMode`
  as a local `const` is narrowed by TypeScript to its literal, so every
  `=== "inspector"` branch becomes a compile error. Moving it to the query layer
  fixed the type error *and* put the policy where policy lives — the type system
  was pointing at a layering mistake, not asking for an annotation.
- **`as never` and `as unknown as` were hiding a real shape.** PostgREST types
  an embedded to-one relation as an **array**; both casts existed to silence
  that. Every `as` in a data layer is worth re-deriving rather than carrying.
- **A screen can be fully "translated" and still ship English.** 58 of the 128
  keys had no Arabic anywhere — in code, in the locale files, or in the seeded
  `ui_strings` migrations — so `t()` fell back to English on an Arabic screen and
  nothing ever failed. Only moving the copy into the resource made the gap
  countable (WEB-013 §8).

> **The workstation blocker is stale.** `next dev` ran on 2026-08-10 and
> compiled `/planning/bulk` clean; the SWC Application Control error did not
> reproduce. What still prevents a rendered pass is **a seeded account** —
> `planning_access_class` denies the anonymous caller, so every authenticated
> route 307s to `/login`. Do not repeat "static verification only" without
> re-testing it. See BLOCKED in `03-REDESIGN-TRACKER.md`.

## Where `/planning/bulk` stands (2026-08-10)

Slices **1a** (data layer behind the T-042 narrowing boundary), **1b** (route
file 348 → **27**) and **1c** (criteria builder — 13 native controls and 24
legacy classes to zero) are done, plus the shared AI advisory. Slices **2** (the evidence form) and **3** (the review route, 288 → 30) are done
too. **Slice 4 is done — the review screen is fully migrated.** `ReviewClient`
855 → 647, `EvidenceLedger` 128 → 112, and **`review.css` is deleted**: legacy
classes 243 → 0, inline styles 52 → 0, native controls 5 → 0, emoji-as-icon
25 → 0. **Only `actions.ts` (846 lines) remains** on this route.

The entry screen is now server composition: `features/planning-bulk/` holds the
reads, the view models and three string modules; `resolveBulkTargeting()`
returns the criteria tree, match set, suggestion lists, focus contributions,
freshness and counts as one value, which is what keeps the screen component's
body at 44 lines. Two rulings from this slice generalise:

- **A type lie relocated is a type lie.** `factories as never` existed because
  `BulkForm` demanded non-null `factory_code`, `cr_number` and `visits` that the
  query has always been able to return null for. Widening the row type at four
  use sites removed the cast; passing it down one level would not have.
- **Arabic is a resource, not a fallback.** ~130 strings moved into
  `planning.bulk` in **both** locale files at asserted key parity, and the JSON
  shape was authored to match the four string contracts — so the three string
  modules fell 272 → 77 lines and a drifted key is now a **type error** instead
  of a silent English fallback. This screen no longer needs a `ui_strings` row.
  `/planning/single` and the review step still do.
- **Derive the list the registry already implies.** The nine value-suggestion
  fields were hardcoded beside a `FIELD_REGISTRY` that documents itself as the
  single place a field is added. They are now
  `filter(supplied && (text | enum))`.

Two primitives were extended to unblock this work, both raised as gaps first and
built only after a ruling (WEB-002 §2): `Button.busy` and
`SelectOption.disabled`. **Neither gap was filled inline** — that is the pattern
to repeat.

Rulings worth carrying forward:

- **"Recorded but unavailable" and "never offered" are different facts.** A
  disabled option stays visible, readable and announced, with its reason. Only
  the first of those two states is something a user can act on.
- **A disabled flag must guard every path in** — click, Enter/Space, arrow keys,
  Home/End, type-ahead, and the initial open. Guarding `onClick` alone leaves a
  row reachable that then refuses to activate.
- **Check specificity before writing a CSS override.** Three separate defects in
  this codebase now trace to an equal-or-higher-specificity rule silently
  beating a variant (`Card`'s AI accent on hover, the frozen sheet's
  `a { color }`, and `Button`'s busy state stripping the AI accent).

**Still unrecorded:** the eight pre-session wizard commits
(`754c5f1c` … `462e3675`, `cf36da85`). Also note `21d92022`'s message describes
only a visit-list fix while actually containing the whole T-042 boundary.

## Where planning stands (2026-08-10)

`/planning` itself is migrated: 10 native controls gone, More Filters portalled,
AI columns accented (T-043). `/planning/single` has honest search states and
correct pill tones (T-045). **`/planning/bulk` is where the legacy mass is** —
before T-046 it had **zero SAQEEL imports** across 14 files and 3,512 lines.
Slice 1a moved its reads behind the narrowing boundary; the other five slices
are on the board.

Three rulings from this run generalise:

- **A portalled control cannot participate in a GET form.** Its DOM sits outside
  the `<form>`, so native submit skips it. Keep the state in one island and
  render every hidden input inside the form; the panel is presentation only.
- **Two portals into `document.body` are DOM siblings** however deeply nested
  they are in React. `contains()` cannot express menu ownership — React context
  can, because it follows the React tree. This caused a hard crash before it was
  found (T-044).
- **Read the nearest existing solution before designing a new one.** The
  `/planning` filter bar was built twice because `enforcement-filter-bar` had
  already solved the same problem, and the first attempt invented a chip that
  double-bordered every control.


## Where the data layer stands (2026-08-10)

**Every `as unknown as` is gone from the migrated data layer** — 48 casts across
21 files, replaced by `lib/postgrest/{shape,read}.ts` and a `Shape<T>` per row
type. Reads narrow once at the boundary and **fail closed**: a malformed row
fails the whole read into the screen's existing *unavailable* state, never into
a silently smaller number.

Two things generalise from that work:

- **`supabaseServer()` has no `Database` generic**, so `.select()` infers every
  column as `any` **and every embedded relation as an array** — including
  to-one embeds PostgREST returns as objects. That is why the casts existed, and
  why `typecheck` passing did not mean the reads were type-safe. Generating
  database types (`supabase gen types typescript`) is the real fix and needs a
  live database.
- **A row type must declare what the query selects, not what the screen wants.**
  The dashboard's types described the *post-hydration* shape, so every read had
  to be asserted into it. Splitting `VisitScopeRef` out — `factory_id` from the
  query, `factories` filled by `hydrate.ts` — removed six casts without changing
  a line of behaviour.

**150 casts remain in unmigrated legacy** (`field/**`, `admin/**`,
`reviews/[id]`, `visits/[id]`, `reports/**`, `lib/factory360/dossier.ts`). Each
screen migration should convert its own reads onto the boundary.


## Where enforcement stands (2026-08-10)

Both screens behind `/admin/violations` are migrated: the enforcement library
(410 → 24) and the catalogue admin (511 → 26). **All three rewritten routes are
now done** — compliance library, approval queue, enforcement.

The recurring lesson across T-036…T-041 is that **the schema holds more than the
screens admit**. Every one of these migrations found recorded columns the UI was
ignoring while showing a placeholder or a UUID: `inspections.inspection_no`,
`inspection_penalties.status`, penalty `amount`, `violation_codes.corrective_action`,
`compliance_configuration_requests.description`. Read the migrations before
concluding a value is unavailable — `0001_foundation.sql` alone understates the
schema badly.

**Dates:** `new Date().toISOString().slice(0, 10)` appears in unmigrated code as
a "today" for date-bounded comparisons. It is the UTC day and rolls over three
hours early in Riyadh. `riyadhToday()` in `lib/dates.ts` is the correct one.

---

## Where the approval queue stands (2026-08-10)

`/compliance/approvals` is migrated — 499 → 25 lines — with the request rail,
review sequence, field diffs, per-object and package decisions, progress and a
timeline that now includes submission and return. Reached from
`/admin/compliance-approvals`, which the middleware rewrites **unconditionally**;
those four files are marked `@retiring` because that segment never runs at all.

Three live defects were fixed on the way, all of the same shape — **a value that
looked wired but was never read**: `?view=pending` from the admin home, a
correlation id minted fresh on every failed render (so the reference shown to the
user matched nothing in the logs), and `toLocaleString(locale)` instead of
Asia/Riyadh. Worth a look on any screen not yet migrated.

---

## Where the compliance library stands (2026-08-09)

**The compliance library is fully migrated.** `app/(app)/compliance/page.tsx`
**303 → 27** and `/admin/regulations` **546 → 21**. Catalogue, six-tab workspace
and the governed record are all on SAQEEL, and **every `@retiring` file is
deleted** — the retirement ledger's Marked section is empty. Search, filters and
the active tab are all `searchParams`; the only client code left on either screen
is the lifecycle form.

The pattern worth reusing: `WorkspaceTable<T>` is
`{kind:"rows", rows} | {kind:"unavailable"}`, so a failed read **cannot** be
handed to a table as an empty array. Prefer that to a boolean beside the data —
the two drift, the union cannot.

**Three admin routes do not render their own page.** `middleware.ts` rewrites
`/admin/regulations` → `/compliance`, `/admin/compliance-approvals` →
`/compliance/approvals`, and `/admin/violations` → `/enforcement-library`,
passing the typed path in `__shellRoute`. T-036 was first built against
`/admin/regulations` and the entire rebuild was unreachable. **Read
`middleware.ts` during inventory, before deciding which file a screen lives in.**

**The schema is richer than any admin screen currently admits.** `violation_codes`
already carries `level`, `corrective_action`, `grace_period_days`, `category` and
`applicability`; `penalty_mappings` carries `penalty_type`, `amount`,
`grace_period_days`, `due_period_days`, `legal_basis` and a `template_version_id`
naming the action form; and `inspection_items.response_model.mapping` holds a
**direct item→violation link**. All of it is governed with maker-checker and
immutability triggers. Before concluding a field is missing, read
`supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql` —
the foundation migration alone understates what exists.

---

## Where the dashboard stands (2026-08-09)

`/dashboard?view=strategic` no longer ends in two placeholders. The
**enforcement action trend** is computed from `penalty_notices.issued_at` over
the scoped period against the immediately preceding period of equal length, and
the **executive AI brief** is a real governed advisory on the `executive_brief`
surface, generated on demand.

Two rulings from that work generalise:

- **An empty result under RLS is not an absence of facts.** `penalty_notices` is
  invisible to most roles and returns an empty set rather than an error. Any
  query over a role-gated table must carry a `readable` flag, and the screen
  must render a restricted state — not a zero. The same flag goes into any AI
  context built from that table.
- **A client field may be a filter; it is never a fact.** The executive brief's
  hidden `context` is convenience only: `generateContextualInsight` re-reads
  every figure under the caller's RLS and accepts from the client only the
  reporting period, validated as an ISO day with `from <= to`.

`RevampStrategicView.tsx` and `DashboardView.tsx` still hold the old
placeholders in legacy markup, but both are unreachable — `DashboardView`
returns before its remaining hundred-plus lines, and `page.tsx` imports neither.
They belong to the retirement sweep.

---


> **The tracker's NOW section below is older than the work.** Since the last
> status refresh, `/dashboard`, `/operations`, `/factories` (list **and**
> `[id]` dossier), the `/planning` list, and now **Visit Management**
> (`/planning/visits` + `/visits`) have all been migrated onto SAQEEL. Several
> of those tasks have session records; the dashboard and operations migrations
> still do not. Read `02-SESSION-LOG.md` for what actually happened.

## Where Visit Management stands (2026-08-09)

The screen behind `/planning` → **Visit management** is migrated. The 706-line
`VisitsBoard` client monolith is superseded by six components under
`components/sections/visits/**` (none over 182 lines) plus a five-module data
layer at `features/visits/**`; both route files are 36 lines.

**The list is now server-driven.** Nine client filter states became
`searchParams`, implemented by reusing `queryPlanningVisits` — the hardened
query already behind `/planning` — extended additively with
`requireReference: false` so Visit Management keeps the reference-less visits it
exists to correct while `/planning` stays provably unchanged. 14 `useState` → 2,
3 effects → 2, 37 inline style objects → tokens, one inline `<svg>` → the new
`externalLink` registry name, and 259 i18n keys at exact `en`/`ar` parity.

`VisitsBoard.tsx` has **zero importers** and is marked `@retiring`. It is the
only retirement row with an empty `pending` list — deleting it needs the e2e
specs updated, nothing more.

**`npm run typecheck` is clean across the whole repository (2026-08-09).** It had
not been: `shell-topbar.tsx:81` failed for several sessions and was carried as
"pre-existing". T-021d found it was masking two live defects in the topbar's date
scope — five of seven presets rendering `undefined` labels, and a `locale` that
was never passed, so the shell never rendered Arabic-Indic digits. Treat a
standing type error in a shared component as a defect, not as noise.

---

---

## What this is

`apps/web` — the MIM Inspection Platform web application. Next.js 15 (App
Router), React 19, TypeScript strict, Supabase, PWA with offline field
capture, bilingual English/Arabic with RTL, maps (Leaflet + Mapbox), 3D
(Three), video (Twilio).

The application **works**. This programme is a redesign and a disciplining, not
a rebuild.

---

## Where we stand

**Phase: 2 — the shell consumes the system; pages do not yet.**

`apps/web/src/app/saqeel.css` is the design system: one file, three cascade layers
(`sqx.tokens`, `sqx.base`, `sqx.components`), 339 custom properties, 59
classes, 3 keyframes, imported once from `app/layout.tsx`. Variants are data
attributes. It sits entirely inside cascade layers while the three legacy sheets
are unlayered, so it cannot override them and the visual diff of adding it is
zero — a migrated screen must *delete* the legacy rule, not out-specify it.

**T-004 rebuilt the authenticated shell on it.** `components/app-shell/**` (15
files) plus `features/shell/**` (4) render the rail and topbar as Server
Components; eight scoped client islands replace the single 839-line
`ShellClient`. The icon layer is `lucide-react` behind one registry —
`components/saqeel/icon/icon-registry.ts` is the only file allowed to import it.
`app/(app)/layout.tsx` is six lines.

No **page** uses the system yet. The typed primitive layer is now **T-006**,
adopting `ShellPageFrame` across 55 route files is **T-007**, and finishing the
two out-of-group admin layouts is **T-008** — until T-007 and T-008 land,
`ShellClient.tsx` and `Shell.tsx` are marked but not deletable, and none of the
46 KB is actually recovered.

**The shell has never been rendered.** See the blocker below.

The rulebook is still not machine-enforced. No lint config, no gate scripts —
every rule T-002 obeyed was checked by hand. That is **T-000**, and it remains
the highest-priority unblocked item.

> ~~**The app does not run on this workstation.**~~ **DID NOT REPRODUCE
> 2026-08-10 — see the note at the top of this file.** Windows Application
> Control was blocking `@next/swc-win32-x64-msvc`, so `next dev` served nothing and
> `next build` hangs. No browser verification, no e2e, no axe, no bundle
> numbers — every task is currently limited to static verification, and the
> Definition of Done cannot be fully ticked by anyone working here. See
> BLOCKED in `03-REDESIGN-TRACKER.md`. This outranks T-000.
>
> **This is now urgent, not merely inconvenient.** T-004 replaced the chrome on
> every authenticated route and not one page was ever rendered to check it.
> `tsc` passes; nothing else was possible. If the first render is wrong, the
> revert is one line — point `app/(app)/layout.tsx` back at `AppShell` from
> `@/components/Shell`. Nothing was deleted.

---

## Baseline — measured 2026-08-06

| | |
| --- | --- |
| Files under `apps/web/src` | 814 |
| Source bytes | ≈ 5.9 MB |
| Route files under `app/(app)` | 495 |
| Saqeel primitives already built | 60 |
| Global CSS | `saqeel-runtime.css` 170 KB · `saqeel-components.css` 50 KB · `login.css` 57 KB · `tokens.css` 18 KB · **`saqeel.css` 59 KB (added 2026-08-07, 8.7 KB gzip)** |
| Lint config | none |
| CI gates | none beyond a PR contract check |

### The ten files that hold most of the problem

| File | Size | Principal violation |
| --- | --- | --- |
| `app/(app)/field/inspection/[id]/Workspace.tsx` | 136 KB | ~34× the component ceiling |
| `app/(app)/field/[visitId]/Startup.tsx` | 85 KB | client component on the strictest perf surface |
| `app/(app)/operations/page.tsx` | 79 KB | route file carrying an entire application |
| `app/(app)/field/inspection/[id]/page.tsx` | 70 KB | route file, same |
| `app/(app)/field/[visitId]/page.tsx` | 61 KB | route file, same |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | 53 KB | |
| `app/(app)/field/page.tsx` | 49 KB | route file |
| `app/(app)/factories/cr/[id]/page.tsx` | 49 KB | route file |
| `components/ShellClient.tsx` | 46 KB | client JS on **every** route |
| `app/(app)/dashboard/DashboardView.tsx` | 45 KB | |

### Known systemic issues

- Route files contain application logic and client code (WEB-001 §2).
- Icons are ~90 hand-authored inline SVG components in `app/icons.tsx` and
  scattered through screens (WEB-002 §5).
- `saqeel-runtime.css` at 170 KB loads globally; most of it is unused per route.
- Heavy libraries (`mapbox-gl`, `leaflet`, `three`, `twilio-video`) are not
  confirmed to be code-split.
- No lint configuration, so none of the code law is currently enforceable.
- Component directories mix primitives, domain components, and one-off screens.

---

## Assets we are keeping

- **`app/tokens.css`** — an audited, owner-approved semantic token sheet with
  recorded contrast ratios, a dark theme, and RTL support. This is the expensive
  half of a design system and it already exists. It is the single source of
  visual truth going forward.
- **`components/saqeel/**`** — 60 primitives already organised by concern
  (actions, inputs, data, feedback, navigation, grid, map, inspection,
  signature). They need hardening against the WEB-002 §4 contract, not replacing.
- The existing e2e and axe Playwright configuration.

---

## Decisions on record

| Date | Decision |
| --- | --- |
| 2026-08-06 | Design system is **SAQEEL**. Astryx stays banned. Existing tokens are kept; the component layer is hardened on top of them. |
| 2026-08-06 | Icons: **`lucide-react`** behind a semantic registry and one `Icon` primitive. Hand-authored `<svg>` banned in application code. |
| 2026-08-06 | ~~Styling mechanism for new work: **CSS Modules** colocated with the component.~~ **Superseded 2026-08-07.** |
| 2026-08-07 | Styling mechanism, **final**: `app/saqeel.css` holds **only tokens, base, keyframes and reduced motion** (801 lines, `@layer sqx.tokens, sqx.base`). Every component class lives in a **CSS Module paired with its component in the same directory** (`shell-rail/shell-rail.tsx` + `shell-rail/shell-rail.module.css`). Modules are never imported across directories — cross-component styling uses data attributes (`[data-brand-name]`), never a foreign class. Modules are unlayered so they can out-specify the legacy unlayered `a { color }`. Reverses the one-stylesheet decision below. WEB-002 §6 rewritten. |
| 2026-08-07 | ~~Styling mechanism: **one system stylesheet**, `apps/web/src/app/saqeel.css`.~~ **Superseded the same day.** Tokens, base and every component class in one file under `@layer sqx.tokens, sqx.base, sqx.components`. Components ship no CSS — they apply `.sqx-*` classes and data attributes. No `.module.css`, no CSS-in-JS, no Tailwind. WEB-002 §6 rewritten. |
| 2026-08-07 | Prefix is **`--sqx-` / `.sqx-`**. `--sq-` is still live in `saqeel-runtime.css` (seven nav/map custom properties) and `.sq-` owns 281 legacy classes there; `.saqeel-` is taken by `.saqeel-state` / `.saqeel-reference`. `sqx` collides with nothing — `grep -c sqx` is 0 in every legacy sheet. One prefix across custom properties, classes, cascade layer names and keyframe names. |
| 2026-08-07 | Direction is a **six-token set** declared at `:root` and `:root:dir(rtl)` in `saqeel.css` — the only `dir()` / `[dir]` rules permitted in `apps/web/src`. CSS has no `to inline-end`, so a gradient angle cannot be logical. WEB-001 §9. |
| 2026-08-07 | The three legacy sheets stay **unlayered** for now, so they outrank `saqeel.css` by construction. Migration deletes legacy rules; it never overrides them. |
| 2026-08-07 | ~~Shell active state is **server-rendered** via the `x-pathname` request header.~~ **Superseded the same day.** `app/(app)/layout.tsx` is a persistent layout — Next does not re-render it on navigation between child routes, so `headers()` is read once and the highlight never updates without a refresh. Server-computed active state is incompatible with a persistent layout. `shell-nav-group.tsx` is now a client component reading `usePathname()`; the rail, brand, topbar and page frame stay Server Components. This is the fallback T-004's §6.1 anticipated, taken as narrowly as possible. |
| 2026-08-07 | Icons are **`lucide-react` behind `components/saqeel/icon/icon-registry.ts`** — the only file permitted to import it. 34 semantic names. Hand-authored `<svg>` is banned in application code. |
| 2026-08-07 | The shell's scroll model is fixed: `.sqx-shell` is `100dvh`/`overflow:hidden`, `.sqx-shell__main` owns `overflow-y`, the topbar is a non-sticky sibling above it. This is **required**, not stylistic — the legacy `.sq-pagehead` is sticky and 55 pages still render it. |
| 2026-08-07 | **Chrome is a flat colour, not a gradient.** Rail, topbar and drawer use `--sqx-surface-chrome` — `#EAF8F0` light, `--sqx-green-950` `#001F11` near-black green dark. Gradients are reserved for small surfaces: the CTA, the active-row edge, labels and cards. Supersedes §4.1 of the T-004 brief. "Deep green" here means **near-black green**, not a brighter forest green — `--sqx-green-800` was tried and is the wrong direction. The rail and topbar dividers use `--sqx-border-strong` and are load-bearing in both themes; `--sqx-border-subtle` scores 1.14:1 on the dark chrome and disappears. |
| 2026-08-07 | `<main>` keeps `id="main-content"`. The T-004 brief asked for `id="main"`; three assertions in `e2e/ui-compliance-runtime.spec.ts` pin the existing id and e2e was out of scope. |
| 2026-08-06 | Accessibility target raised to **WCAG 2.2 Level AA**. |
| 2026-08-06 | Rulebook and session memory live in `brain/web/`. Root `CLAUDE.md` is the onboarding pointer. |

---

## Open change request — 13 tokens (blocks T-005)

T-005 stopped on WEB-002 §2: a missing token is raised, never added inline. Eight
of its ten primitives are blocked, and `menu-surface` alone blocks five of them.
The exact declarations are in
[the T-005 record](sessions/2026-08/2026-08-07-T-005-header-controls.md).

One of the thirteen needs a **decision**, not just a value:
`--sqx-rim-light` already exists as a colour and is consumed by
`--sqx-elevation-1…4`, but WEB-009 §4 specifies it as a per-theme box-shadow.
Redefining it in place breaks all four elevation tokens. The record proposes
renaming the colour to `--sqx-rim-tint`.

---

## Next action

**T-000 — Guardrails: gate scripts, lint, verify pipeline.**
See `03-REDESIGN-TRACKER.md`.

T-000 now also owes two gates that T-002 created the need for:
`gate:one-stylesheet` (no new `.module.css`; no `--sqx-*` or `.sqx-*`
declared outside `saqeel.css`) and the `dir()` check that enforces WEB-001 §9.

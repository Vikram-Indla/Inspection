# 2026-08-12 · T-094 — `/planning/bulk` declutter: the same four facts, said four times

`task: T-094` · `status: partial` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Remove the duplicated UI on the bulk targeting screen without removing a single
fact, and without touching the shell.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/planning/bulk/page.tsx` | edited — dropped the `context` pill and the `StatusPill` import | 27 → 22 |
| `app/(app)/planning/bulk/CriteriaBuilder.tsx` | edited — count, hint, tree ARIA, disclosure, Match as radios | 363 → 360 |
| `components/saqeel/choice-group/choice-group.tsx` | **created** — the labelled choice set | — → 64 |
| `components/saqeel/choice-group/choice-group.module.css` | **created** | — → 35 |
| `app/(app)/planning/bulk/criteria-builder.module.css` | edited — disclosure chrome added, `.notice` colour dropped | 81 → 120 |
| `app/(app)/planning/bulk/TargetingLensClient.tsx` | edited — drops `matchCount` | 57 → 56 |
| `app/(app)/planning/bulk/DistributionPanels.tsx` | edited — duplicate risk advisory removed | 71 → 68 |
| `components/sections/planning-bulk/bulk-screen/bulk-screen.tsx` | edited — banner removed, advisory rebuilt as a strip at the top | 71 → 59 |
| `components/sections/planning-bulk/bulk-ai-advisory/bulk-ai-advisory.tsx` | **created** — `AdvisoryStrip` wrapper, mirrors `factory-ai-advisory` | — → 39 |
| `components/ai/advisory-strip/advisory-strip.tsx` | edited — optional `unavailable` string | 59 → 64 |
| `components/sections/planning-bulk/bulk-targeting-form/bulk-targeting-form.tsx` | edited — three gates, `clearSelection` reuse, notice actions moved to the slot | 236 → 252 |
| `components/sections/planning-bulk/bulk-targeting-form/bulk-targeting-form.module.css` | edited — `.noticeActions` deleted, superseded by the notice's own slot | 17 → 11 |
| `components/sections/planning-single/planning-notice/planning-notice.tsx` | edited — `actions` slot, contract documented | 27 → 33 |
| `components/sections/planning-single/planning-notice/planning-notice.module.css` | edited — `.actions` row | 26 → 33 |
| `components/sections/planning-bulk/bulk-campaign-summary/bulk-campaign-summary.tsx` | edited — `&nbsp;` spacer and `summaryEmpty` removed | 59 → 57 |
| `components/sections/planning-bulk/bulk-selection-bar/bulk-selection-bar.tsx` | edited — permanent info pill removed | 63 → 62 |
| `components/sections/ai/ai-advisory/ai-advisory.tsx` | edited — evidence refs now rendered | 114 → 117 |
| `components/sections/ai/ai-advisory/ai-advisory.module.css` | edited — `.evidence` row | 8 → 16 |
| `features/planning-bulk/strings.ts` | edited — `context` and `riskAdvisory` dropped | 64 → 63 |

Counts measured, not estimated. **`CriteriaBuilder.tsx` remains at 361 lines —
over WEB-000's 200-line soft budget, under the 400 hard ceiling.** It arrived that
way (363) and this task reduced it; splitting it is a rebuild of a route-folder
legacy component and belongs with the parked `EligibilityLedger` /
`DistributionPanels` item, not here.
| `i18n/locales/en/planning.json` | edited — 8 keys removed, 1 added, 1 reworded | — |
| `i18n/locales/ar/planning.json` | edited — same 8/1/1, in Arabic | — |

## Decisions

**A count rendered twice is not redundancy for safety — it is drift waiting to
happen.** `view.eligible` reached the screen four times: the criteria footer, the
ledger's *Eligible*, the toolbar `CountBadge`, and the pager's *of {n}*. The
ledger keeps it, because CD-021 exists precisely so a planner never sees a bare
result count. The toolbar badge survives **only when the text filter narrows the
set** — at that point it is a different number and therefore new information.

**The eligibility ledger's denominator / eligible / excluded triple was not
touched.** `excluded` is arithmetic (`denominator - eligible`) and looks like a
fourth duplicate, but the CD-021 note in `EligibilityLedger.tsx` is explicit that
showing the three together is the signature of the screen. Reading the file is
what stopped that deletion. **Do not remove it in a future declutter.**

**Deleting the top banner and keeping the table's empty state, not the reverse.**
`notice.noCriteriaBody` and `empty.noCriteria.body` shared a sentence verbatim.
The empty state is at the point where the missing result actually is; the banner
sat above the form the planner has not filled in yet. `notice.unreadable*` was
kept — a corrupted criteria link is a real error, not the default state.

**Gating, not deleting, for blocks that carry nothing at zero.** The pager,
campaign summary and toolbar badge are correct components rendering an empty
truth. They now mount when they have something to say. Nothing was made
conditional that a planner could need at zero.

**The five "Not available" rows were already in the dropdown.** `fieldChoices`
gives every unsupplied field `disabled: true` and `note: notSuppliedTag`, so the
block below was the second telling. Collapsed into a native `<details>` reusing
`factory-sections`' `+`/`−` marker rather than inventing chrome — and the reason
sentence, previously a bare string child of `<li>`, now renders through `Text`.

**`role="tree"` was removed rather than repaired.** A `<span key={i}>` sat
between `role="group"` and `role="treeitem"`, which breaks the required
owns-relationship, and there was no roving `tabindex` — so it announced itself as
a tree while behaving as a list. Plain nested `<ul>`/`<li>`; keys moved onto the
`<li>` each renderer already returns. The `<form>` gained `aria-labelledby` to its
own `Heading`, which it never had.

**`ai-advisory` was edited despite being a shared component, because it has one
call site.** Checked, not assumed. It rendered "Source evidence" as a lone muted
line while the refs went into a hidden input — a label pointing at nothing. The
refs are governance identifiers, not translatable copy, so they render through
`Mono`. **That edit still stands and now benefits someone else** — see below.

**The advisory then moved to the top and became a strip, on request.** The screen
now opens with `AdvisoryStrip`, the component the dashboard's `executive-brief`
and `factories`' `factory-ai-advisory` already use — a single flex row (icon +
`Heading` + pill + body + link button) instead of `Card` + `CardHeader` +
`CardBody`. **Not a restyle: `bulk-ai-advisory` is a 39-line wrapper in the exact
shape of `factory-ai-advisory`**, so bulk is the third consumer of one strip
rather than the second implementation of one idea.

**`AdvisoryStrip` gained one optional string, and only to avoid a regression.**
It rendered `result.error` raw, and `generateContextualInsight` returns
**untranslated English sentences** ("AI provider unavailable — no advisory was
generated or stored."). The card it replaced mapped those to `strings.unavailable`.
`unavailable` is now optional on `AdvisoryStripStrings`: bulk passes it, dashboard
and factory do not, so their behaviour is byte-identical. **The wider problem —
a server action returning user-visible English prose — is parked, not solved.**

**Match became radios, and the radio was already built.** Asked for "a reusable
radio component if not already". It already exists: `components/saqeel/choice`
takes `kind="radio"`, is fully token-driven, and has 9 call sites — **so nothing
new was built for the control itself.** What did not exist was the *group*:
`review-context`, `identity-section`, `location-dispatch` and
`visit-configuration` had each hand-rolled the same `<fieldset>` + `<legend>` +
`<Text role="label">` and its CSS. `components/saqeel/choice-group` promotes that
shape — **past the Rule of Two twice over**, so it is a promotion, not an
invention.

**The Match labels were sentences pretending to be options, and no control makes
a sentence look like a choice.** `"ALL of — every child must match"` was a label
doing two jobs — naming the option and defining it — in caps, at **every nesting
level**, so the definition was paid for again on every group the planner opened.
Now `All conditions` / `Any condition`, the two words every query builder people
already use. The Arabic already opened with exactly `كل الشروط` / `أي شرط`, so it
was a clean truncation rather than a retranslation. **Checked, not assumed:** a
script scanned both files for Latin glyphs in `ar` and Arabic glyphs in `en`,
ignoring `{n}` placeholders — zero in each direction.

**The screenshot that prompted this was a stale bundle, and that was proved
rather than guessed.** It showed the browser-default `fieldset` frame and the
options stacking despite `layout="inline"` — two symptoms of one cause. Fetching
the dev server's own build settled it: the compiled route CSS carries
`.choice-group_group__Z0DQS { border: 0; display: flex }` and the shipped
`page.js` chunk applies that class. **The rendered client was older than the
build.** A grep of every `.css` in the app had already ruled out a competing
`fieldset` rule, so specificity was never a candidate.

**`Field` is not the group label, and that is the point.** The old markup wrapped
`SegmentedControl` in `<Field label={combineLabel}>`, which renders a `<label>` —
and a `<label>` names exactly one control. A set of radios needs
`<fieldset>`/`<legend>`, which is what `ChoiceGroup` renders. The swap fixes an
accessibility defect that was invisible while the control was a segmented button.

**A third radio implementation exists and is dead — do not use it.**
`components/saqeel/inputs/Choice.tsx` exports a `RadioGroup` reachable from the
saqeel barrel, with **zero usages** and, in nine lines, `style={{ gap:
"var(--space-2)" }}` (inline style, legacy token), `className="stack"`,
`className="radio"` globals and a `t-caption` retired type class. It is the
`inputs/` legacy family. Parked.

**Radio `name` had to carry the tree path.** `SegmentedControl` needed no `name`;
radios do, and nested criteria groups render the same control repeatedly — one
shared `name` would have fused every nesting level into a single radio group, so
selecting ANY in a child would clear the parent. It is
`criteria-combine-${pathKey(path)}`, and the primitive's TSDoc states the trap.

**`segmented-control` was `blocked` in the ledger anyway** — "Needs
`--sqx-segmented-pad`" — so this removes a call site from an unfinished
primitive rather than abandoning a finished one.

**`PlanningNotice` was putting a `<div>` inside a `<p>`, and it fails hydration.**
Reported from a real Planner session. `PlanningNotice` rendered `children` inside
`<Text tone="secondary">`, which is a `<p>` by default, and the select-all confirm
notice passed a `Field` — a `<div>` — into it. React refuses to reconcile that
nesting, so **the whole notice was a hydration error, not a styling nit.**

**Fixed at the component, not the call site.** `PlanningNotice` gained an
`actions` slot rendered as the paragraph's **sibling**, and its TSDoc now states
the contract: `children` is the sentence and takes phrasing content only;
controls that answer the notice go in `actions`. Patching only the one call site
would have left the same trap armed for the other **twenty-three** consumers —
the same argument T-092 used for `GeoMap`.

**Both bulk notices moved, though only one was invalid.** The dropped-selection
notice held only `Button`s (`<button>` is phrasing content, so it was legal), but
interactive controls inside a paragraph is the shape of the bug, not an instance
of it. `.noticeActions` was then unused; **re-read before deleting** (T-091's
rule) — it was `flex` + `gap` + a `margin-block-start`, all of which the notice
root's own `gap` and new `.actions` now provide, so it was superseded rather than
merely unreferenced.

**Audited the other consumers rather than assuming.** `PlanningNotice` has 24
call sites; `grep` plus reading each candidate found `review-publish-form`'s
`Choice` (renders `<label>`) and `ImmediateForm`'s `<strong>` are phrasing
content and legal. **`bulk-targeting-form` was the only invalid one in the app.**

**`AiAdvisory` was NOT retired, and the ledger is why.** It looks orphaned after
this change, but `05-RETIREMENT-LEDGER.md` names it the `replaced-by` target for
`ContextualAiPanel`, whose 6 remaining consumers reach it — `grep` confirms
`ContextualAiPanel.tsx` imports it today. Banner-marking it would have stranded
that migration. **This does leave the app with two AI advisory components and no
recorded ruling on which is canonical** — raised, not decided (see Blocked).

## Inventory taken before writing code

- **State and effects:** none added, none moved. The three new conditions are
  derived from values already computed in render (`pageCount`,
  `selectedFactories.length`, `matched.length !== factories.length`) — rung 3 of
  the ladder, no `useState`, no `useEffect`.
- **Literals mapped to tokens:** all new CSS consumes `var(--sqx-*)` only —
  `--sqx-surface-subtle`, `--sqx-radius-control`, `--sqx-space-3`, `--sqx-icon-md`,
  `--sqx-text-muted`, `--sqx-focus-ring-width`, `--sqx-border-focus`,
  `--sqx-focus-ring-offset`. No token added; none was missing.
- **`<svg>`:** none introduced. The disclosure marker is the CSS `content` pattern
  already used by `factory-sections`, not an icon.
- **Accessibility failures found:** malformed `role="tree"`; `<form>` with no
  accessible name; a reason sentence rendered as a bare text node.
- **Copy:** 8 keys removed from both locales, 1 added to both, 1 reworded in both.
  No literal introduced in any `.ts`, `.tsx` or `.css`.

## Numbers

```
Route: /planning/bulk
blocks rendered at first load   10 → 5
renderings of view.eligible      4 → 1
copies of the "no criteria" copy 3 → 1
copies of the risk advisory      2 → 1
i18n keys (en)                 179 → 172   (ar identical, parity checked by script)
typography baseline            734 → 734   none new, none removed
AI block                       Card+CardHeader+CardBody → one AdvisoryStrip row
first-load JS                    —          not measured (production build is the human's, WEB-005 §8)
route CSS                        —          not measured
LCP / INP / CLS                  —          not measured
client islands                   3 → 3      unchanged
```

The AI block's height is not measured — the screen never rendered. The claim is
structural: it went from a `Card` with a header block, a description line, a
status line, an evidence line and a button row, to `AdvisoryStrip`'s single
wrapping flex row plus a button row, with the two governance notes shown **only
after a summary exists**. `planningAiContext(view)` is still evaluated on the
server and handed to the client wrapper as a string, so **no new client island**.

## Accessibility

- axe violations: **not run** — the screen body never rendered under this session.
- Manual checklist (WEB-003 §10): **not run**, same reason. Keyboard · screen
  reader · 200% zoom · 320 px · Arabic/RTL · dark · reduced motion · greyscale all
  remain owed.
- Found and fixed by reading: malformed `role="tree"`/`role="group"` nesting;
  `<form>` with no accessible name (now `aria-labelledby`); an untyped text node
  now rendered through `Text`.
- The new disclosure is a native `<details>`/`<summary>` — keyboard-operable with
  no JS — and carries an explicit `:focus-visible` ring.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **no such script in `apps/web`** (`dev`, `build`, `typecheck`,
      `gates`, `gates:typography`, `check:design-system-v5`, `test:e2e`, …)
- [x] `npm run gates:typography` — **PASSED**, 734 known, none new
- [~] `npm run gates` — exits 1 on **78 pre-existing `check:design-system-v5`
      locations across 48 files** (`emoji-as-icon`, `utc-slice-date-format`) in
      `admin/*`, `visits`, `supervision`, `analytics`, `lib/*`. **Zero are in any
      file this task touched** — verified by grepping the gate output for every
      changed path. Pre-existing failure, not introduced here.
- [ ] `npm run test:e2e` — not run
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**; see Blocked.

## Retirement

Nothing marked, nothing deleted. `BulkForm.tsx` remains `@retiring` with zero
importers — confirmed still dead, and confirmed to hold its own local
`BulkFormStrings`, which is why removing `invalidClear` and `summaryEmpty` from
the live type did not touch it.

## Parked

Both copied into the tracker's PARKED section:

- **`EligibilityLedger.tsx` / `DistributionPanels.tsx` need a rebuild** — banned
  `.sq-` prefix, frozen-sheet globals, raw `<h3>`, glyphs-as-icons, comment
  blocks. `StatCard` is what the ledger is. Kept out of this task deliberately:
  it is a rebuild, and folding it in would have made the commit line undescribable.
- **`BulkForm.tsx` should be deleted, not migrated.**
- **`components/saqeel/inputs/` is a second, legacy primitive family reachable
  from the saqeel barrel** — its `RadioGroup` has zero usages and carries an
  inline `style`, `--space-*` legacy tokens, global `stack`/`radio` classes and a
  retired `t-caption`. Seven route files still import from the barrel. Either
  retire the family or stop exporting it, before someone reaches for `RadioGroup`
  believing it is the design system.

Not parked but worth a future look: the "Save draft" button is permanently
`disabled` while `DRAFT_PERSISTENCE_EXECUTABLE` is `false`.

## Blocked / open questions

**The screen body was never rendered.** The dev session is signed in as
*Synthetic inspector1 · Inspector*, and `loadBulkTargeting()` requires
`planning.create.bulk`, so `/planning/bulk` returned its unauthorized state. That
path did render correctly and **did confirm the header change — title alone, no
context pill** — but the criteria builder, disclosure, ledger, gated blocks and
the Arabic render are all unverified.

There is no dev role override in the codebase (grepped: no `DEV_ROLE`, no
impersonation hook), so this needs a **Planner or Supervisor session**. Signing in
is the human's to do.

**Before this task moves from `partial` to `done`:** render under a Planner or
Supervisor session, run axe, walk the WEB-003 §10 manual checklist, and review the
screen in Arabic first (WEB-011).

**Open question for a human — there are now two AI advisory components and no
ruling on which is canonical.** `AdvisoryStrip` has three consumers (dashboard,
`/factories`, and now `/planning/bulk`); `AiAdvisory` has one
(`ContextualAiPanel`, itself `@retiring`, carrying 6 downstream consumers). The
retirement ledger points `ContextualAiPanel` at `AiAdvisory` — but the one route
that had migrated to `AiAdvisory` has now moved to `AdvisoryStrip`, so that arrow
points at a component nothing is choosing. **Either the ledger's `replaced-by`
should become `AdvisoryStrip` and `AiAdvisory` joins the retirement list, or
`AiAdvisory` is the intended card-shaped variant and that needs writing down.**
This task did not decide it.

**Behaviour dropped with the card, worth a decision:** `AiAdvisory` watched
`navigator.onLine` and pre-emptively disabled Generate when offline.
`AdvisoryStrip` does not, so an offline click now fails at the server and surfaces
an error rather than being prevented. The failure is still surfaced; the
pre-emption is gone. Dashboard and `/factories` have always worked this way.

## Proposed commit

```
refactor(planning): drop duplicated blocks from bulk targeting
```

## Next

Render `/planning/bulk` under a Planner or Supervisor session and complete the
accessibility pass — same task, T-094.

# 2026-08-09 · T-022 — Planning assistant: insights, recommendations, quick actions, stats

`task: T-022` · `status: done (static verification only)` · `duration: ~2.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011`

---

## Goal

Land the AI Insights / AI Recommendations / Quick Actions band and the stat-card
row from the vendor mock onto `/planning`, using SAQEEL components and the
platform's existing governed AI foundation.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `features/planning/assistant.ts` | created | 108 |
| `features/planning/assistant-view.ts` | created | 73 |
| `components/sections/planning/planning-assistant/` (+ module) | created | 17 + 33 |
| `components/sections/planning/planning-insights/` (+ module) | created | 40 + 32 |
| `components/sections/planning/planning-ai-advisory/` (+ module) | created | 50 + 38 |
| `components/sections/planning/planning-recommendations/` (+ module) | created | 62 + 57 |
| `components/sections/planning/planning-quick-actions/` (+ module) | created | 42 + 47 |
| `components/sections/planning/planning-stat-cards/` | created | 31 |
| `components/sections/planning/planning-skeleton/` (+ module) | extended | 125 + 129 |
| `components/saqeel/card/card.tsx` (+ module) | modified — `accent="ai"` | 95 + 187 |
| `app/(app)/planning/page.tsx` | modified | 480 → 556 |
| `i18n/locales/{en,ar}/planning.json` | extended — 47 keys each | 309 keys, parity |

## Decisions

### The mock's numbers could not be copied

Four values in the vendor design do not exist as governed data, and inventing
them is banned outright (CLAUDE.md §9, WEB-008 §1):

| Mock | Reality | Shipped as |
| --- | --- | --- |
| "92% confidence", "Confidence 96%" | Gemini returns **no calibrated confidence**. The platform already records `confidence: null, confidence_status: "provider_not_supplied"` in `ai_suggestions` | **Recorded risk score**, labelled *Risk score* — a real figure with a model version and drivers. Plus an explicit line stating no confidence score is available |
| Per-visit "AI Score" 96/93/91/88 | No such column | `factories.risk_score`, used for ranking |
| "Needs Planning" bucket | No such `planning_status`; in the mock it means a factory with no visit | Card renders **"Not configured"** |
| "Expiring Windows" bucket | Needs an SLA threshold — a governed value | Card renders **"Not configured"** |

Owner ruling on all four: show risk instead of confidence, and render the two
undefined buckets as *Not configured* rather than omitting or faking them.

### No edge functions — the governed path already existed

The ask was two Supabase edge functions on `GEMINI_API_KEY`. Investigation found
the platform already has the whole contract:

- `ai_suggestions` / `ai_events` — the AI docket. Append-only events, mandatory
  **human disposition**, `provider_status`, and the explicit rule that *AI never
  writes a business decision*.
- `lib/providers/ai-gemini.ts` — the Gemini adapter, **fail-closed** without a
  key, and hard-refuses to generate legal source text.
- `lib/ai/contextual-actions.ts` — a server action that **re-reads the source
  under the caller's RLS session** before prompting, and already carries a
  `planning_summary` surface.

An edge function would have had to re-implement JWT verification, RLS scoping
and the docket write, and would sit outside those guardrails. Owner chose to
extend the existing path. **Nothing needs deploying.**

`planning-ai-advisory` is a thin client island over that same action — new
presentation on SAQEEL primitives, zero new logic. Without a key the action
returns its neutral "provider unavailable" message, which the island renders in
a `role="alert"`; nothing is generated or stored.

### "Generate Weekly Plan" does not generate anything

Having AI create visits would breach the docket's core rule. The button links
into `/planning/bulk`, where a human builds and publishes through the governed
flow. Owner-confirmed.

### "Assign Unassigned Visits" was dropped

The count is computable but **no filter exists** for it — `PlanningListFilters`
has `inspectorId`, not "has no assignment", and a PostgREST "not exists" over an
embedded resource could not be verified without a database. A quick action that
links somewhere other than what its label promises is worse than one that is
absent. Replaced with *Review visits awaiting supervisor*, which is real and
filterable. Parked.

## Corrected after owner review

Five presentation defects, four fixed at the source rather than in the panels:

1. **Icon and title were on separate lines.** The icon was passed as `eyebrow`,
   which `CardHeader` stacks *above* the title. It now sits inside the `title`
   node in an inline-flex span, adjacent to the text. This also removed an
   accessibility flaw: the icon carried `label={title}`, so it announced as an
   image repeating the heading it sat next to. It is decorative beside its own
   label, so it is `aria-hidden` now.
2. **Insight counts were bare bold numerals.** They are now
   `CountBadge superscript` — the same treatment T-021c built for the select, so
   a count looks the same everywhere in the app.
3. **The middle panel was taller, leaving dead space under the other two.** The
   grid was `align-items: start`. It is now `stretch`, and each `.column` is
   `display: grid` so its single child fills the row height — which stretches
   the card **without the section reaching into `Card`**, since a primitive
   accepts no class from outside (WEB-002 §4.5).
4. **The risk-band pill printed the raw enum (`high`).** It now goes through the
   app's common `enumLabel` path — `sentenceCase(t("enum.<value>",
   humaniseEnum(value)))` — the same function every other screen uses. The
   labelling happens in `assistant-view.ts`, keeping `assistant.ts` free of i18n.
5. **AI surfaces were visually indistinguishable from recorded data.** `Card`
   gained an `accent?: "ai"` prop — a **stroke only**, on `--sqx-accent-ai`
   (declared in both themes), plus the title in the same colour. The fill stays
   neutral deliberately: tinting the surface would make advisory content read as
   a status.

**One deliberate deviation from the mock:** Quick Actions does **not** get the AI
accent or the sparkle icon, and now uses `workflow`. It is deterministic
navigation with counted links — nothing about it is generated. Marking it as AI
would defeat the point of the accent, which is to let a reader tell generated
content from recorded content at a glance.

## Inventory taken before writing code

- **State/effects:** one `useActionState` in the advisory island. Everything else
  is a Server Component. No `useEffect`, no client state added.
- **Client islands:** +1 (`planning-ai-advisory`).
- **Literals:** none. The only raw values in the new CSS are media-query
  breakpoints (`90rem` / `60rem`, the assistant's two collapse points, mirrored
  exactly in the skeleton; `75rem` matches `DataTable`). Media queries cannot
  read custom properties.
- **`<svg>`:** none — the panel eyebrows use `Icon name="ai"` from the registry.
- **Accessibility:** each panel is a `Card as="section"` with `aria-labelledby`
  on an `h2` `CardHeader`; the stat row is a labelled `role="group"`; facts are a
  `<ul>` with an accessible name; quick actions are real `<Link>`s, not
  `div onClick`. Counts that are unavailable render as text, never as `0`.
- **Counts are never fabricated:** every figure honours `countsAvailable`, and a
  failed read renders "Unavailable" rather than zero.

## Numbers

```
Route: /planning
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
client islands  4 → 5 (planning-ai-advisory)
new queries     3 (high-risk count, AI-suggestion count, top-4 risk candidates)
                + 1 conditional (visit statuses for those 4 factories)
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Wants a pass in both themes
  and RTL — the assistant is a 3-column grid with two collapse points, and the
  recommendation cards mix an LTR numeric score with `dir="auto"` factory names.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in new files.
- [x] i18n parity — 309 keys, `en` + `ar`.
- [x] Rule sweep on new files — no comments, no `let`, no `any`, no `<svg>`.
- [ ] `npm run lint` / `npm run gates` — still no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Retirement

Nothing marked. `ContextualAiPanel` gains no new consumer here, but is not yet
retirable — the factories and visits screens still use it.

## Parked

- **`app/(app)/planning/page.tsx` is now 555 lines against a 40-line cap
  (WEB-001 §2), and this task made it worse by ~75.** The remedy is the same
  shape that worked for Visit Management: a `planning-workspace` screen
  component owning composition and string mapping, with the route reduced to
  access + query + render. That is its own task and should be the next one.
- **"Assign unassigned visits" needs an `unassigned` planning filter** before it
  can return as a quick action.
- **"Needs Planning" and "Expiring Windows" need governed definitions** — a
  factory with no visit in the inspection year, and a day threshold before
  window end. Both render *Not configured* until then.
- **The AI advisory is generated on demand, not on load.** Deliberate: a Gemini
  call per page render would be slow and costly. If the product wants it
  pre-generated, that is a cached/scheduled job writing `ai_suggestions`, and the
  panel would read the latest row instead of calling the provider.
- **Recommendations rank by `factories.risk_score` only.** A factory already
  covered by a published upcoming visit can still appear. Excluding those needs
  a "has an open visit in window" predicate that is worth doing properly.

## Blocked / open questions

None — the four governed-value gaps were ruled on by the owner and are recorded
above.

## Proposed commit

```
feat(planning): add AI insights, recommendations, quick actions and stats
```

## Next

**T-023 — slim `app/(app)/planning/page.tsx`.** At 555 lines it is the largest
route-file violation on the migrated surface, and every future planning change
makes it worse.

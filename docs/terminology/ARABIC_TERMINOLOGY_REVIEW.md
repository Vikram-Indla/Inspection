# Arabic Terminology Review

## Mechanism

The app is bilingual via a single governed `ui_strings` table
(`supabase/migrations/0013_ui_strings_localization.sql`): English lives in
code as the `t(key, "English fallback")` call; Arabic is a DB row keyed by
the same `key`, with a `status` of `draft` (machine/unreviewed) or
`reviewed` (human-approved). New Arabic values are seeded via guarded
upsert migrations (`insert ... on conflict (key) do update ... where
ui_strings.status = 'draft'`) — this project follows that exact existing
pattern and never overwrites a `status='reviewed'` row.

## What was done

- Waves 1-3 changed the English fallback string in code for every affected
  `t()` key. Arabic was explicitly deferred to Wave 4 in each of those
  waves, per the task's own instruction.
- Wave 4 ran 4 parallel translator agents (one per Wave 1-3's surface
  grouping) that each: read the CSV inventory for their surface, opened the
  *live* source file to get the exact current English string (not the CSV,
  which had minor HTML-entity artifacts from `&amp;`), authored formal
  Modern Standard Arabic matching the register of existing `ui_strings`
  rows, and preserved every interpolation placeholder (`{v}`, `{n}`,
  `{shown}`, `{total}`) verbatim.
- Result: 95 unique keys translated, zero conflicting values where two
  translators' surfaces shared a key (e.g. `visit.detail.immutable`,
  `visit.ribbon.operational` appear in both the Factory360/Visits agent's
  and the Submission/Review agent's output — both produced the same
  Arabic).
- New migration:
  `supabase/migrations/20260721020000_plain_language_terminology_ar_strings.sql`.
  **Not applied to any remote database** — file only, per instructions.

## Coverage gaps (explicitly known, not silently dropped)

Some rows in `PLAIN_LANGUAGE_INVENTORY.csv` have `implementation_status=implemented`
but no `localization_key` because the English string is hardcoded JSX text,
not routed through `t()` (e.g. `admin/integrations/factory-data/page.tsx`'s
banner text, several Wave 2/3 findings noted this explicitly in their
`skippedOrDeferred` field). These have no Arabic counterpart to seed because
there is no localization mechanism wired for them at all — that is a
pre-existing localization gap in those specific strings, not something this
project introduced or was scoped to fix (wiring new strings through `t()`
is an application-behavior change, out of scope for a terminology-wording
project).

Two Wave 0 findings (`F0-028`/`F0-029` "Portfolio facts only..." caption)
had no pre-existing Arabic to diff against — Wave 4's translators authored
new Arabic from scratch for these rather than "correcting" anything.

## Placeholder integrity

Spot-checked every entry containing `{...}` tokens:
- `field.ws.submitting`: `"Submitting final version v{v}..."` → AR keeps `{v}` — ✓
- `report.items.heading`: `"Checklist responses — final v{n}"` → AR keeps `{n}` — ✓
- `visit.list.scope`: EN uses `.replace("{shown}", ...)"`/`.replace("{total}", ...)"`
  — not sent to a translator (this was one of the direct manual fixes in
  Wave 4, not a translated `ui_strings` row); placeholders unaffected by the
  wording change (only "RLS-scoped — showing" was reworded to "Showing ...
  (filtered to your access)", tokens untouched).

## RTL

No RTL layout, direction, or truncation logic was touched by this project —
Arabic values were added to an existing bilingual dictionary the app
already renders RTL correctly for other keys in the same table. No new RTL
component or layout code was introduced. Full-browser RTL rendering
verification (visual screenshots per the task's Section 11 browser
acceptance checklist) was **not performed** in this session — no live
Supabase-backed dev server was available in the worktree (see
`VALIDATION_REPORT.md`). This is a known limitation, not a completed check.

## Legal-term Arabic

Where a finding touched text adjacent to a legal term (Commercial
Registration, Violation, Penalty, Compliance, Corrective Action), the
translator agents were instructed to reuse the already-established Arabic
for that legal term (grepped from existing `ui_strings` migrations) rather
than invent new legal terminology. No new legal-term Arabic was coined.

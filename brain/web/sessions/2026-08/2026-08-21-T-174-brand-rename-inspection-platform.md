# 2026-08-21 · T-174 — Rename product brand to "Inspection Platform", drop dashboard "Your work" eyebrow

`task: T-174` · `status: done` · `duration: ~1h`
`rules applied: WEB-002, WEB-013, WEB-014`

---

## Goal

Two manager-directed copy changes: (1) remove the "Your work" eyebrow from the
first dashboard card (EN + AR); (2) rename every user-visible occurrence of the
brand — "Saqeel صقيل" combined, or "Saqeel"/"SAQEEL"/"صقيل" alone — to the literal
**"Inspection Platform"**, in both languages.

## What changed

| File | Action | Note |
| --- | --- | --- |
| `components/dashboard/role-summary/role-summary.tsx` | removed `trailing` slot + orphaned `Text` import | "Your work" eyebrow gone |
| `i18n/locales/{en,ar}/dashboard.json` | removed `yourWork.eyebrow` key | `scoped` kept |
| `app/layout.tsx` | metadata `title` / `description` / appleWebApp title → "Inspection Platform" | browser-tab + PWA name |
| `components/app-shell/shell-brand/shell-brand.tsx` (+`.module.css`) | collapsed صقيل/SAQEEL stack to one "Inspection Platform" wordmark; removed orphaned `.brandAr` (−1 raw `font:`); wordmark now `--sqx-text-primary` | active shell |
| `components/ShellClient.tsx` | collapsed legacy brand stack to single wordmark | retiring shell |
| `components/Shell.tsx` | admin-shell brand string defaults → "Inspection Platform" | legacy |
| `lib/i18n-keys.generated.ts` | `admin.shell.brand*` registry entries → "Inspection Platform" | keeps registry consistent |
| `components/field/FieldShellDrawer.tsx` | drawer brand → "Inspection Platform" | |
| `app/login/page.tsx` | field `brand1` (×2) + `copyright` (EN + AR) → "Inspection Platform" | |
| `app/login/field/FieldLoginClient.tsx` | removed hardcoded Arabic `صقيل` mark (lockup now single wordmark) | |
| `app/reset/page.tsx` | `brandTitle` → "Inspection Platform" | |
| `app/reports/inspection/[id]/page.tsx` | header platform caption + Arabic brand mark → "Inspection Platform" | |
| `app/(app)/field/account/page.tsx` | footer `tr()` EN + AR defaults → "Inspection Platform" | |
| `i18n/locales/{en,ar}/field-settings.json` | copyright → "Inspection Platform" | |
| `i18n/locales/{en,ar}/admin-senai-data.json` | 4 in-sentence "SAQEEL"/"صقيل" each → "Inspection Platform" | governed copy |
| `i18n/locales/{en,ar}/admin-factory-data.json` | `noWritebackHelp` → "Inspection Platform" | governed copy |
| `i18n/locales/{en,ar}/factories-cr.json` | `localCopy` + `source` → "Inspection Platform" | governed copy |
| `i18n/locales/en/planning.json` | `neList` "no Saqeel source" → "no Inspection Platform source" | |
| `lib/factory360/arabic.ts` | 3 Arabic provenance strings → "Inspection Platform" | in-code AR map |

## Decisions

- **Brand vs. design-system name.** The product brand shown to users was renamed;
  the internal **SAQEEL design-system** name was NOT. Deliberately left: component
  imports / `--sqx-` prefixes / `.sq-*` classes / storage keys / data schemas /
  env vars / filenames (all internal), the `tokens.css` header comment, the
  env-gated `ReferenceRenderer` ("SAQEEL foundation/interface reference" — an
  internal DS dev tool), and `landing.footer.line` in the generated registry
  ("MIM Saqeel design system" — the DS name, and not rendered anywhere).
- **Locale-appropriate brand, never mixed (final).** The rename first landed as
  the English string everywhere (incl. inside Arabic copy). A follow-up reversed
  that: **English UI → "Inspection Platform"; Arabic UI → "منصة التفتيش"**, keeping
  each locale in its own language ([[locale-files-never-mixed]] upheld). Arabic
  copy uses feminine verb agreement (منصة is feminine): `تقرأ / تسوّي / تكتب /
  تستخدم`, and `لمنصة التفتيش` for the ل-prefix case. Bilingual brand lockups
  (shell brand, field login, report header, admin `brandLabel`) show BOTH names,
  each in its own `lang`-tagged span — a deliberate bilingual lockup, not mixing.
- **Bilingual lockups kept bilingual.** Every صقيل/SAQEEL stacked lockup (shell
  brand, field login, report header) now stacks `منصة التفتيش` over `Inspection
  Platform`, each `lang`-tagged. The wordmark renders through the `Overline`
  component (not raw CSS `font:`), so the typography ratchet stays green (−260).
  The `SENAI`/`صناعي` source name was left intact — a different system, not the brand.
- **`صناعي` (SENAI) never touched.** Only the `صقيل` token was replaced; the
  adjacent Arabic `صناعي` (the source-of-truth system) stays.

## Inventory taken before writing code

- state/effects: none introduced or moved (copy-only + one removed JSX slot).
- literals → tokens: n/a (copy change); removed one raw `font:` from
  `shell-brand.module.css` (typography ratchet improved).
- `<svg>`: none touched.
- a11y: shell/login lockups keep the shield mark + accessible wordmark; report
  brand mark stays `aria-hidden`. Removed a now-single-language `lang="ar"` on the
  report mark since its text is English.

## Numbers

```
Copy/branding change only — no route rebuild, no JS delta.
files changed: 25 (2 tsx removals of slot/mark, 1 module css, 22 copy/brand)
brand occurrences renamed (user-visible): ~30 across EN + AR
raw font: declarations removed from feature CSS: 1 (.brandAr)
```

## Accessibility

- Live EN /dashboard: body carries **no** "Saqeel"/"صقيل"/"Your work"/"عملك";
  brand elements render "Inspection Platform"; tab title "Inspection Platform".
- Manual (WEB-003 §10): brand marks retain non-text shield glyph + text wordmark
  (text-plus-shape); no colour-only change. Full SR/zoom/RTL pass not re-run — copy
  only, no structural/markup change beyond removing two brand sub-spans.

## Verification

- [x] `npm run typecheck` — 0
- [x] `npm run lint` — PASSED (ratchet held, −371)
- [x] `npm run gates` — typecheck / typography / date-inputs green; only
      pre-existing `check:design-system-v5` findings remain (date-format in
      analytics/field/planning/visits — untouched here)
- [x] Live EN dashboard verified (see Accessibility)
- [ ] `npm run test:e2e` — not run in-session (pane not displayed); if any brand
      contract asserts the old "SAQEEL"/"صقيل" string it must be repointed (none
      found in `e2e/**` for these tokens during the sweep)

## Retirement

None. Legacy `ShellClient`/`Shell` brand text updated in place (still retiring,
not deleted here).

## Parked

- Two other small edits landed this session and are **not yet recorded**: the AI
  Insights topbar entry-point removal, and the card `metric` size reduction
  (32 → 28 → **1.1rem**, WEB-014 synced). Capture as their own records if they
  are to ship separately from T-174.
- `landing.footer.line` still says "MIM Saqeel design system" in the generated
  registry — intentional (DS name, unrendered), revisit only if that landing
  footer is ever rebuilt.

## Blocked / open questions

- None. The Arabic form (`منصة التفتيش`) is now in place across all Arabic copy
  and the bilingual lockups; `en`/`ar` are each single-language (verified: zero
  "Inspection Platform" left in `ar/*.json`).

## Proposed commit

```
feat(web): rename product brand to Inspection Platform, drop dashboard "Your work" eyebrow
```

## Next

T-175 — next unblocked NOW item. No follow-up required unless the Arabic-form
decision is revisited.

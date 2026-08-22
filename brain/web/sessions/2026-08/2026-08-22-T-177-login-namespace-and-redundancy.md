# 2026-08-22 · T-177 — /login copy redundancy, and the first L2-standard i18n namespace

`task: T-177` · `status: done` · `duration: 1.5h`
`rules applied: WEB-000, WEB-004, WEB-008, WEB-013, WEB-014`

---

## Goal

Say the product name once instead of six times, and move every `/login` string
out of component literals into a bilingual i18n namespace written for an
elementary second-language English reader.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/i18n/locales/en/login.json` | created | 0 → 63 |
| `src/i18n/locales/ar/login.json` | created | 0 → 63 |
| `src/i18n/messages.ts` | registered the namespace | +5 |
| `src/app/login/page.tsx` | rebuilt as composition only | 159 → 37 |
| `src/app/login/field/FieldLoginClient.tsx` | strings type + every usage remapped; pill and offline note gated on `!online`; footer shortened | 565 → 559 |
| `src/app/login/StoryPanel.tsx` | title removed, stages read from the namespace by scene order | 104 → 106 |
| `src/app/login/login.css` | deleted the now-unused `.lg-story__title` rules | −3 |

## Decisions

**The lockup keeps both wordmarks; everything else gives up the name.** Identity
is stated once, bilingually, in the shield lockup. The tagline now carries the
authority only (`Ministry of Industry & Mineral Resources`). The atlas panel
title is deleted — its overline already says what the panel shows and the name
sat 40px to its left. The footer is `© 2026`.

**Status that is always green is not status.** The network pill renders only when
the device is offline, and the offline assurance note with it. When there is a
network, neither appears. This removed a permanent green chip and a permanent
four-line note from a sign-in screen.

**Copy is written to the L2 standard, not to plain American English.** The
audience is Riyadh staff reading English as a second language. Every string was
measured against word-frequency rank, a job glossary and a UI glossary, with a
15-word sentence cap, no phrasal verbs, no idioms, no formal connectors. 36 of
46 strings passed clean on the first measurement; two were rewritten
(`check in` is a phrasal verb; `server` ranks #8,513). The rest of the flags are
proper nouns (Riyadh, Jazan, AR) and auth-idiomatic passives.

**Arabic is authored, not translated.** The Arabic file was written against the
new English rather than machine-translated. **It still needs a native reviewer's
sign-off before release** — this task did not obtain one.

## Inventory taken before writing code

- `page.tsx` held ~60 strings per locale behind `locale === "ar" ? … : …`, the
  exact pattern WEB-013 bans. All moved.
- `FieldLoginStrings` was a flat 31-key type; remapped to the namespace's nested
  shape across every `s.*` usage in the client.
- `AtlasStageId` includes a `review` stage that is not in `STORY_SCENE_ORDER`,
  so `Record<AtlasStageId, …>` was too wide. Narrowed to a `StoryScene` union
  derived from the scene order.
- e2e sweep by source path: no spec asserts `.lg-story__title`, `.fl-tagline`,
  the ministry line, `fl-net-online`, the copyright, or the atlas title. Nothing
  to re-point.
- No `<svg>` added. No `alt` added. No new literal visual value.

## Numbers

```
Route: /login
product name on screen        6 instances → 1  (+1 browser tab title)
page.tsx                    159 → 37 lines  (route ceiling is 40)
hardcoded user-visible strings on this route   ~60 → 0
Arabic coverage for this route                  0% → 100% (48/48 keys)
persistent chrome removed     network pill (when online), 4-line offline note,
                              atlas panel title, 5-word footer → "© 2026"
L2 standard on the new namespace   36/46 clean at first measurement
```

## Accessibility

- axe-core: **not run** — stated as a gap.
- Manual: verified live in both locales. EN — one name instance, tagline is the
  ministry line, footer `© 2026`, no online pill, no offline note, tabs
  `Map · On the way · Arriving · Inspection · Zones`, atlas resting on `decide`.
  AR — `dir=rtl`, `lang=ar`, every string Arabic including the tabs
  (`الخريطة · في الطريق · الوصول · التفتيش · المناطق`), lockup one line per
  language. Keyboard behaviour unchanged from T-176.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run lint` — `ESLint: No issues found` on `page.tsx` and `StoryPanel.tsx`
- [x] `npm run gates` — typography and date-input PASSED; `check:design-system-v5`
      fails on pre-existing debt with zero hits on any file in this task.
      Not ticked as green.
- [ ] `npm run test:e2e` — not run this session
- [ ] Definition of Done — axe, e2e and Arabic sign-off outstanding

## Retirement

`.lg-story__title` and its RTL rule deleted from the frozen `login.css`.

## Parked

- `FieldLoginClient.tsx` is 559 lines, over the 400 hard ceiling, and carries
  117 comment-lint violations. Splitting it is its own task.
- `FieldLoginStrings.atlas` is typed `unknown` because the client does not read
  it; tightening that belongs with the split above.
- Arabic sign-off for this namespace by a native reviewer.

## Blocked / open questions

Arabic wording is authored but unreviewed. It must not ship without sign-off.

## Proposed commit

```
feat(login): move copy to a bilingual namespace and say the name once
```

## Next

Rebuild the content-audit workbook as v2 on the L2 instrument.

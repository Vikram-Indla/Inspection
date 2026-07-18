# TASK-I18N-RTL-AUDIT-001 — Arabic localization / RTL coverage audit

## Scope
Sponsor request: verify RTL rendering and Arabic-label coverage across every route
now that MVP1/MVP2/MVP3 are merged; identify and correct hardcoded-English gaps.

## Method
The app already has an enforced static checker, `scripts/i18n_coverage.py`
(`SWEPT_ALL = True`), scanning all `.tsx` under `apps/web/src` for raw English JSX
text not routed through `t()`/a local bilingual dict. It was failing on **38 files**
at the start of this task. Every failing file was individually triaged (read in
context, not just from the regex match) into one of three classes:

1. **Scanner false positives** — the regex misread JSX/TS control-flow syntax
   (ternary-chain fragments spanning multiple lines, `Promise<T>` generics,
   Supabase query-builder chains, comparison operators on lines also containing
   an already-localized helper call) as raw text. Fixed by tightening
   `scripts/i18n_coverage.py`'s `CONTRACT_ID`/`ALLOW` regexes — **no application
   code changed** for these, since there was nothing wrong in the flagged files.
   Also added `CD`, standalone `REQ`, `DASH`, and broadened `M0\d` → `M\d+` to the
   contract-ID exemption list (the existing list only covered `M02`-style MVP1/2
   IDs, not MVP3's `M3-XX`/bare `CD-0XX`/`REQ-XXXX` badges).
2. **Reuse bugs** — hardcoded English duplicating a translation key that already
   existed elsewhere in the same file/app (e.g. a raw `<dt>Correlation</dt>` next
   to an existing `L.correlation` in the same file; the `/visits/map` tab labels
   duplicating keys already defined in `/visits`). Fixed by referencing the
   existing key — **zero new translation content**.
3. **Genuinely new strings** — no existing Arabic equivalent anywhere. Per
   sponsor direction, wrapped in the correct i18n pattern (global `t(key, en)` +
   `ui_strings` DB, or a file's existing local `{en, ar}` dict) and drafted literal,
   formal-register Arabic matching the surrounding file's terminology. **Every
   drafted string is listed below, explicitly unreviewed — not treated as final.**

Result: **0 failures**, `python3 scripts/i18n_coverage.py` exit 0.

## Files changed (24)
`AuditReplayWorkspace.tsx`, `admin/audit/page.tsx`, `admin/devices/page.tsx`,
`admin/integrations/page.tsx`, `admin/operations/page.tsx`,
`admin/packages/{DraftEditor,TemplateRegistry,page}.tsx`,
`admin/security-access/page.tsx`, `enforcement/page.tsx`,
`factories/[id]/{FactorySpatialMap,page}.tsx`,
`login/{SaqeelHero,StoryPanel,page}.tsx`,
`operations/live/{LiveMapInner,LiveOps,page}.tsx`,
`virtual/[id]/{Room,page}.tsx`, `visits/map/{VisitMap,page}.tsx`,
`components/GeoMap.tsx`, `scripts/i18n_coverage.py`.

Two files (`AuditReplayWorkspace.tsx`, `login/{SaqeelHero,StoryPanel,page}.tsx`)
use the codebase's local-dict pattern, where Arabic is authored directly in
source (existing precedent in these exact files) — those translations are
already committed as code, not pending DB sync.

**Update (post-merge with the concurrent MVP3 branch):** `apps/web/src/lib/i18n.ts`
carries a curated `MVP3_AR_FALLBACK` dict for `mvp3.*` keys specifically — a
`ui_strings`-DB-override-if-present, code-fallback-otherwise mechanism, enforced
by `mvp3-enterprise-contract.spec.ts`'s "ships reviewed Arabic fallbacks" test.
The 5 new `mvp3.*` badge keys from this audit (`mvp3.devices.badge`,
`mvp3.integrations.badge`, `mvp3.operations.badge`, `mvp3.security.badge`,
`mvp3.enforcement.badge`) were added there, each explicitly commented as
**draft, not yet reviewed** like that file's pre-existing entries — required
so the test suite and the live app both show correct Arabic immediately,
without falsely presenting these 5 as officially reviewed.

## Genuinely-new strings — DRAFT Arabic, pending human/authorized review
These use the global `t(key, "English")` pattern; the English fallback is live
immediately (already correct behavior), but the Arabic value lives in the
`ui_strings` Supabase table and is NOT set by this task — no Supabase PAT was
used, no live DB write occurred. Sync via `/admin/localization` → "Sync from
code" (inserts each key as `status: draft`) or `scripts/i18n_sync.py`, then an
authorized reviewer edits/approves each Arabic value below (offered as a
starting draft, not asserted as correct or final):

| Key | English | Draft Arabic |
|---|---|---|
| admin.audit.badge.appendonly | append-only | إلحاق فقط |
| mvp3.devices.badge | 14 controlled rows | 14 صفًا محكومًا |
| mvp3.integrations.badge | 14 controlled rows | 14 صفًا محكومًا |
| mvp3.operations.badge | fail-closed operations | عمليات مغلقة عند الفشل |
| mvp3.security.badge | purpose-bound evidence access | وصول للأدلة مقيّد بالغرض |
| mvp3.enforcement.badge | source-linked cases | حالات مرتبطة بالمصدر |
| admin.pkg.editor.evidence.photo | Photo | صورة |
| admin.pkg.editor.evidence.video | Video | فيديو |
| admin.pkg.editor.evidence.document | Document | مستند |
| admin.pkg.editor.evidence.comment | Comment | تعليق |
| admin.template.type.form | Form | نموذج |
| admin.template.type.report | Report | تقرير |
| admin.template.type.actionForm | Action form | نموذج إجراء |
| admin.template.type.penalty | Penalty | عقوبة |
| f360.geo.legend.official | official / planned pin | دبوس رسمي / مخطط |
| f360.geo.legend.arrival | observed arrival | وصول مُلاحَظ |
| f360.geo.legend.override | GPS override | تجاوز نظام تحديد المواقع |
| f360.geo.legend.empty | No observed inspection locations are recorded in your authorized scope. | لا توجد مواقع تفتيش مُلاحَظة مسجّلة ضمن نطاقك المصرّح به. |
| ops.live.map.unavailable | Map service unavailable | خدمة الخريطة غير متاحة |
| ops.live.map.notConfigured | Mapbox is not configured for this environment. | خرائط Mapbox غير مُهيَّأة لهذه البيئة. |
| ops.live.map.ariaLabel | Mapbox operations map | خريطة العمليات (Mapbox) |
| virtual.room.simulatedSession | SIMULATED VIDEO SESSION | جلسة فيديو محاكاة |
| visit.map.title | Visit management — map | إدارة الزيارات — الخريطة |
| visit.map.context | MVP1-M02-039 · RLS-scoped | MVP1-M02-039 · ضمن نطاق RLS |
| visit.map.error | Map data is temporarily unavailable. Please try again. | بيانات الخريطة غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى. |
| visit.map.region | Region | المنطقة |
| visit.map.allRegions | All regions | جميع المناطق |
| visit.map.legendFactory | factory / visit | مصنع / زيارة |
| visit.map.legendInspector | latest inspector position | آخر موقع للمفتش |
| visit.map.empty | No located visits in this region | لا توجد زيارات محددة الموقع في هذه المنطقة |
| visit.map.visit | Visit | زيارة |
| visit.map.factory | Factory | مصنع |
| visit.map.regionCity | Region / city | المنطقة / المدينة |
| visit.map.inspectorLocation | Inspector location | موقع المفتش |
| visit.map.state | State | الحالة |
| visit.map.assignedInspector | Assigned inspector | المفتش المكلف |
| visit.map.inspectorFallback | Inspector | مفتش |
| visit.map.unavailableScope | Unavailable under current scope | غير متاح ضمن النطاق الحالي |
| visit.map.latestLocation | latest location | آخر موقع |

## Explicitly exempted (never translated by design)
Added to `scripts/i18n_coverage.py`'s proper-noun allowlist: `Saqeel` (product
name), `CARTO`/`OSM` (required external map-tile attribution text).

## Verification
- `python3 scripts/i18n_coverage.py` — 0 failures (was 38).
- `npx tsc --noEmit` — 0 errors.
- `npx next build` — 0 errors, 0 warnings.
- Manual RTL spot-check via `/locale?set=ar` cookie against a running production
  build: `dir="rtl"` applied correctly on `/login` (and `dir="ltr"` on
  `/locale?set=en`); new Arabic Riyadh-badge string (`الرياض · مسيّجة جغرافيًا`)
  rendered correctly.
- `apps/web/e2e/dashboard-business.spec.ts` Arabic RTL/mobile-reflow/keyboard-focus
  test: all functional assertions (RTL layout, horizontal-overflow ≤ 1px) passed;
  the test's final evidence-screenshot write failed with `EPERM` writing to
  `~/Desktop/Inspection Documentation/...` — a sandbox filesystem permission
  boundary in this environment, not a code regression.
- Full static suite (`playwright.static.config.ts`): 65 passed / 4 skipped
  (pre-existing env-gated skips), 0 regressions from these changes.

## Known residual gap (not in scope, documented honestly)
The regex-based checker cannot see text inside JSX expression braces
immediately following a tag (e.g. `<h3>{count} reconstructed aggregate
states</h3>` — the `{count}` breaks the `>text<` pattern the scanner matches).
A small number of such strings were spotted incidentally while fixing adjacent
flagged lines (and fixed where trivial), but a full hand-audit beyond the
checker's own detection was outside this task's approved scope. Improving the
checker to a real JSX/AST parser (instead of regex) would close this gap
completely — flagged here as a follow-up, not fabricated as already done.

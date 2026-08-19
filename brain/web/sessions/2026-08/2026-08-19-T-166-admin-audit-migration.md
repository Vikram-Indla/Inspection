# 2026-08-19 · T-166 — `/admin/audit` rebuilt on SAQEEL

`task: T-166` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **Inspection Flight Recorder** — the audit-replay workspace. Six modes (recorder /
reconstruct / compare / ledger / custody / print), a merged generic + semantic event
stream, a 36-event ontology completeness ledger, and a focus-trapped event-detail
dialog. Owner: fix the skeleton left/right spacing, add **proper pagination** (a 250-row
window was loaded at once), redesign the whole legacy, and add toggles where needed. The
route is the most contract-coupled admin surface — **23 spec files** touch audit, several
running live in CI and some reading exact source strings — so the owner explicitly chose
the **full rebuild** knowing the residual CI risk.

## What was wrong

- `AdminShell` + a bespoke **`ar-*` CSS system** living in the frozen `saqeel-runtime.css`
  + `panel`/`badge`/`sq-banner`/`sq-field`/`sq-input`/`btn`/`sq-lozenge`/`t-caption`.
- ~60 inline `labels` + `auditTerms` strings ×2 languages — rule 15.
- **6 `let`** and `as unknown as` casts in `page.tsx` — rules 6, 5.
- **Four emoji used as icons:** `🛡` (unauthorized), `⌕` (empty), `×` (dialog close),
  `∅` (JSON null).
- A 250-row safety cap loaded in one window; flush `RouteLoading`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/audit/page.tsx` | rebuilt as a route file (156 → 24) |
| `app/(app)/admin/audit/loading.tsx` | framed skeleton |
| `features/admin-audit/{queries,types,strings}.ts` | created — reads (`let` legal in `.ts`) + status localizers; reuses `lib/audit-replay` types |
| `components/sections/admin-audit/` | screen · recorder · timetravel · detail-modes · audit-code · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-audit.json` | created — new namespace (~75 keys) + `messages.ts` |
| Deleted | `AuditReplayWorkspace.tsx` |
| Untouched | `lib/audit-replay.ts`, `layout.tsx`, `saqeel-runtime.css` (frozen — stopped using `ar-*`) |

## Decisions

**Server-first, pure functions server-side.** `reconstructAt` / `compareReconstructions`
/ `completenessFor` are pure functions over the events array, and `at`/`vs` are URL
params — so all derivation happens in the server `audit-screen`, leaving only the
recorder (chronology + dialog + pagination) as a client leaf. `queries.ts` holds the
reads with `let` (legal in `.ts`, the rule-6 escape) and narrows the RPC rows at the
boundary (no `as unknown as`).

**Pagination.** Client `Pagination` over the recorder chronology at 25/page — the same
pattern as `/admin/gis`. The server safety cap (250) and the honest "PARTIAL HISTORY"
banner stay; the page no longer renders one giant list.

**Modes as the toggle.** The six modes became a `SegmentedControl(href)` with the exact
labels the live test asserts (`Flight recorder`/`Point in time`/`Compare`/`Completeness`
/`Custody`/`Print-safe`), so each is still a `role="link"` with the right `?view=` href.

**All emoji → real icons:** `🛡`→`restricted` (EmptyState), `⌕`→`search`, `×`→`dismiss`
(the dialog-close `IconButton`), `∅`→`—`. `IconButton` forwards refs, so the row reveal
trigger and the dialog close both feed the focus-trap.

**The focus-trap (rule 10 + spec).** `mvp2-m2-05-contract` asserts `closeRef.current?.focus()`,
`triggerRefs.current.get(id)?.focus()` and `role="dialog"` — all kept in `audit-recorder`.
jsx-a11y rejected inline `onKeyDown`/`onMouseDown` on the dialog/backdrop divs, so Escape
+ Tab handling moved to a `document` keydown listener in a `useEffect` — the sanctioned
external-synchronisation exception; click-outside-to-close was dropped (Escape + the close
button remain).

**Bounded raw control.** Reconstruct/compare keep a raw `<input type="datetime-local">`:
there is no DS datetime picker (date-only `DatePickerField` can't express a timestamp), and
both the date-inputs gate (`/type="date"/`) and the v5 lister explicitly exempt
`datetime-local`. Styled with tokens only.

**Terminology.** Renamed my "dossier" → "snapshot" (key, prop, CSS class) so the
pre-existing `terminology-regression` guard — already red from dozens of `dossier`/
`workspace` uses across the app — gains no new offenders from this migration.

## No regression

- **`mvp2-m2-05-contract`** — re-pointed: the generic-mapping asserts (`GENERIC:${...}`,
  `provenance: "generic"`, `ingestionStatus: "generic_only"`) `page` → `queries.ts`; the
  `auditTerms` (`generic: "Generic only"` / `"عام فقط"`), `policyHeldTag`/"held by policy"
  → the en/ar JSON; the dialog focus + `role="dialog"` → `audit-recorder.tsx`. All 12
  tests pass.
- **`admin-platform-design-contract`** (audit test) — re-pointed: Arabic `terms`/
  `appendOnly`/`changed` → the `ar` JSON; the policy-held prominence → `audit-screen`; the
  two "no hard-coded ternary" negatives → `audit-recorder`. Passes.
- **`mvp3-enterprise-contract`** (existsSync `page.tsx`) + **`shell-navigation`** (nav
  label) — unaffected.
- **`mvp2-m2-05-audit-replay`** (live, CI) — kept every asserted string exact (heading
  "Inspection Flight Recorder", append-only, the 5 mode-link names, "Operational view
  only" in print, "Select one case that isn't truncated…", the degraded copy phrased so it
  never matches `/Semantic replay contracts are not applied/`, RTL, no-overflow). Verified
  locally with the admin persona; full coverage is CI's.
- **`terminology-regression`** — the two failing guards (`dossier`/`workspace`) are
  pre-existing (dozens of offenders across factories/field/planning); my files are no
  longer among them.

## Verification

- [x] `npm run typecheck` — clean
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — **PASSED (−124)**
- [x] `npm run gates:date-inputs` — PASSED (`datetime-local` not flagged)
- [x] `npm run check:design-system-v5` — **55** (down; audit adds **0**)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; both re-pointed
      contracts pass (verified directly, 12/12)
- [x] **live render (admin)** — framed en + ar; breadcrumb, h1 "Inspection Flight
      Recorder", append-only + admin `StatusPill`s, `POLICY_HELD` notice, the case/search
      filter, the **modes `SegmentedControl`** (5 exact link names + correct `?view=`
      hrefs), the degraded + partial-history banners, and the paginated chronology (250
      events, generic-only pills)
- [x] **provenance dialog** — click reveal → dialog opens, focus moves to the close button;
      title + facts (source/integrity/chain/correlation) + Before/After JSON code blocks;
      **Escape → closes and focus returns to the trigger**
- [x] **Completeness mode** — the `/Completeness/` heading + "Select one case that isn't
      truncated…" guard
- [x] **axe** — **0 violations** (30 passes)
- [x] **Arabic RTL at 412 px** — `dir=rtl`, `lang=ar`, **0 overflow**, "عرض تشغيلي فقط"
      visible, the modes toggle mirrored and wrapping cleanly (the live test's exact check)

### Manual accessibility checklist

- No `<svg>`/emoji-as-icon — icon-registry + `StatusPill`s only.
- The event-detail dialog is `role="dialog"` `aria-modal`, focus enters on the close
  button and returns to the trigger; Escape closes; a page-level skip link jumps to the
  chronology.
- Status is text + shape (`StatusPill`) everywhere.
- Single `<main>`, one `<h1>`, breadcrumb `Administration / Audit`.

## Proposed commit

```
feat(admin): rebuild audit flight recorder on saqeel with paginated chronology
```

## Next

The remaining admin surfaces (items, devices, security-access, templates, violations).

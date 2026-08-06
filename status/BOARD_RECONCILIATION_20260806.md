# SAQEEL board reconciliation — 6 August 2026

**Reconciled against:** `main` @ `2f28a14`
**Board before:** `SB-r28`, updated 2026-07-26, branch `feat/saqeel-shell-rail-profile-switch`, `committed: false`
**Board after:** `SB-r29`, updated 2026-08-06T19:22+03:00, branch `main`, `committed: true`
**Method:** static verification against the repository. No browser was run.

## Why this was needed

`SB-r28` was eleven days stale and pointed at a branch that no longer exists. It
predated the entire integration wave now in `main` — planning-map coverage,
supervisor assignment, inspector lifecycle, administration shell convergence,
localization reconciliation. Its lane numbers could not be trusted in either
direction, and the board's own law forbids moving a number without evidence.

## What changed

Pending items: **121 → 111**. Ten cleared, each with an `evidenceLog` entry.

| Card | Lane | Why cleared |
|---|---|---|
| `m6-enforcement` | code | STALE. Item said "`/enforcement` has page.tsx only — no actions.ts". At `2f28a14` the directory contains `actions.ts` and `EnforcementDecisionForm.tsx`. |
| `admin-access` | code | STALE. Item said "No `/delegation` route". At `2f28a14` `(app)/admin/delegation/` exists with `page.tsx`, `actions.ts`, `DelegationForms.tsx`, `layout.tsx`. |
| `pwa-shell` | code | Bookkeeping — text already began `CLOSED`. |
| `pwa-search` | design | Bookkeeping — text already began `CLOSED`. |
| `pwa-startup` | design | Bookkeeping — text already began `RESOLVED`. |
| `pwa-samples` | code | Bookkeeping — text already began `RESOLVED`. |
| `pwa-ocr` | code | Bookkeeping — text already began `RESOLVED`. |
| `pwa-conflicts` | wiring | Bookkeeping — text already began `FIXED`. |
| `pwa-completion` | wiring | Bookkeeping — text already began `RESOLVED`. |
| `pwa-completion` | code | Bookkeeping — text already began `RESOLVED`. |

Two items were **misstated rather than done**, and were reworded, not cleared:

- **`brand` [code]** — the recorded defect names `.legacy-shell__brand-wordmark`
  and `__brand-sub`, classes that no longer exist, and prescribes
  `saqeel-wordmark-dark-mode.svg` as an `<img>`. `ShellClient.tsx:600-619`
  deliberately rejects that prescription with a written rationale (SVG `<text>`
  inside `<img>` is an isolated document and cannot reach page webfonts, so both
  scripts fell back to system faces) and renders an inline `SaqeelBrandMark`
  plus a two-line `sq-shell__brand-ar`/`-en` name. **`code: 0` does not reflect
  the tree.** A Product Owner ruling is needed on which approach is canonical.
- **`tasks` [code]** — recorded as "`FEATURE_TASKS_WORKSPACE` is off";
  `.env.example:58` sets it `on`. The deployed value was not read. Needs
  environment confirmation.

## The 111 remaining, by what actually blocks them

| Class | Count | What unblocks it |
|---|---:|---|
| **RENDER** | 66 | A running, authenticated app. Blocked on the non-production environment. |
| **BUILD** | 26 | Ordinary development. |
| **GOVERNANCE** | 11 | A Product Owner or source decision — a value, rule or threshold. |
| **PROVIDER** | 8 | Credentials or a live third-party integration. |

**59% of the backlog cannot be closed by writing code.** RENDER is the single
largest class, and every item in it is downstream of the same missing
non-production Supabase environment that blocks the UAT journey. Provisioning
that environment is the highest-leverage action available.

Note on the BUILD column: roughly a third of it is *invariant assertions*
rather than work — `pwa-workspace` "re-assert immutable submit on any further
change", `pwa-verification` "re-assert the P1 latch", `admin-risk` "Health ≠
Risk must hold", `pwa-completion` "Feedback QR NOT built and must not be".
These are guardrails to preserve, not features to deliver, and should not be
counted as remaining effort.

### Confirmed still open, verified this session

- `pwa-reopening` — no route. Confirmed absent.
- `pwa-ops-console` — no route. Confirmed absent.
- `feedback` — `FieldQrPlaceholder.tsx` is still a self-documented `O-15 STUB`,
  and `inspector_qr_token` has no schema anywhere under `supabase/`.
- `admin-geo` — the `.sq-pin--observed` CSS primitive exists in
  `saqeel-runtime.css:1407`, but `GisStudio.tsx` does not use it; the dual-pin
  registered-vs-actual view is not built.
- `exec` — no dedicated executive route; it renders as a dashboard persona
  view, which the card itself flags as needing confirmation.

## Lane numbers were not moved

Deliberately. The board's law is: *"A card is 100% on Design only when the
shipped route matches its .dc.html pixel-to-pixel at every declared width, in
EN/LTR and AR/RTL. No number may be raised without evidence."*

Static verification is sufficient to retire a specific false claim. It is not
evidence of pixel parity, and it does not support a holistic percentage. Every
lane value therefore still carries its `SB-r28` figure, and those figures are
now known to be **stale in both directions** — `brand` `code: 0` is too low,
and the design lane is unverified rather than earned.

Recomputing lane numbers honestly requires the render gate. Until then the
defensible statement is the pending list, not the percentages.

## Two structural gaps found outside the board

1. **GIS Studio was built off-design.** Its canonical page,
   `designs/admin/admin/SAQEEL Admin Geofence.dc.html`, is built on a `gf-*`
   class family (`gf-panel`, `gf-cols`, `gf-scroll`, `gf-tbl`, `gf-kv`,
   `gf-set`) that appears nowhere in `apps/web/src/app/*.css`. The screen does
   not merely diverge from its design — it never adopted it.
2. **The Visits calendar has no canonical design.** `SAQEEL Visits.dc.html`
   contains no calendar markup and nothing under `designs/` covers a month or
   week grid, yet `/visits/calendar` ships one. It is an undesigned surface.

Neither is represented as a pending item on any card.

## Development completion

One card of fifty-seven is at 100/100/100: `shell-f0`, the shared authenticated
shell. Under the board's own completion law, **development is not complete**,
and no defensible aggregate percentage can be produced until the render gate
can run.

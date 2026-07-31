# SAQEEL Figma — UI/UX audit and fix plan

Full sweep of the web screens, 2026-08-01. Every count below is measured from the file,
not estimated. Screens were reviewed visually as well as programmatically, because the
programmatic passes are what missed these defects the first four times.

## Ratings

| | Score | Basis |
|---|---|---|
| **UI — EN** | **5 / 10** | Good bones and token discipline; 376 visible placeholders and non-deterministic status colour keep it from reading as finished |
| **UI — AR** | **3 / 10** | Component semantics diverge from EN; a third of rows are mixed-script |
| **UX** | **4 / 10** | Information model is strong. Undermined by empty columns, unlabelled colour encodings and a placeholder map |
| **Design-system fidelity** | **6 / 10** | Tokens are clean; component *contracts* do not survive the AR mirroring |

---

## Systemic defects — one fix, many screens

### S1 · 376 literal `Placeholder text` strings across 58 frames 🔴
Every search field and most inputs read `Placeholder text`. It propagated from the `Input`
component default, and my QA counted each one as a healthy text node.
**Fix:** add a required `placeholder` text property to `Input`/`Select` so an instance
cannot inherit a default; write real domain copy per field.

### S2 · Status colour is not deterministic 🔴
The same label renders in different colours:

| Label | Colours | Section |
|---|---|---|
| `Submitted` | `#8a4207`, `#8c1d17` | EN |
| `Published` | `#1b544a`, `#1d4d7c` | EN |
| `Draft` | `#6f5324`, `#565248` | EN |
| `Not started` | `#454d59`, `#565248` | EN |
| `منشورة` | **three** colours | AR |
| `مُعاد` | **three** colours | AR |
| `مُسلَّم` | amber **and blue** | AR |

Colour is silently encoding something the text never says — probably SLA age. A badge
reading `Submitted` in red tells an inspector the submission failed.
**Fix:** one label → one colour, always. Urgency becomes its own element (`Submitted · 9d
overdue`), never a recolour of the status.

### S3 · Identifier typography is inconsistent 🔴
66 identifiers in EN; **only 5 are monospace**, 61 are IBM Plex Sans. In AR: **45 are set
in Noto Sans Arabic** — an alphanumeric code like `INS-04412` rendered in an Arabic face —
**3 sit inside badges** (EN: zero) and **3 carry semantic colour** (EN: zero).
**Fix:** one `Identifier` component — mono, `--text-secondary`, never in a badge, never
coloured, never localised.

### S4 · AR components diverge structurally from EN 🔴
On the review queue card the badge treatment is **swapped**: EN badges the status and
leaves the ID plain; AR badges the ID and leaves the status plain. The two metrics are in
**opposite order**. Cause: my mirroring reverses children of horizontal auto-layouts, which
is right for geometry and wrong for meaning — reversing `[status][id]` changed which
sibling the badge wrapped.
**Fix:** stop mirroring in place. Rebuild EN correctly, then regenerate AR from it with
`tooling/regenerate-ar-sections.js`, and add a post-run assertion that every component's child
*roles* match EN.

### S5 · 223 of 701 AR visual rows are mixed-script (32%) 🔴
Not per node — per rendered line. `الرياض · submitted 9 days ago · ن. الحربي` is one node
mixing scripts, so bidi reorders it differently depending on content, and identical fields
land in different visual positions row to row. The column cannot be scanned.
**Fix:** finish the 213 outstanding translations; for unavoidable Latin (IDs, `Mapbox GL`)
use the `bdi` pattern the runtime already has, and mark those nodes as intentional.

### S6 · Type and colour proliferation 🟡
10 distinct type sizes — `10 11 12 13 14 17 18 22 24 30` — five of them inside a 5px band.
19–20 distinct text colours per section.
**Fix:** collapse to a 6-step ramp (11 / 12 / 14 / 18 / 22 / 30) and 6 text colours.

### S7 · Truncated column headers 🟡
Execution truncates five: `Planning wi…`, `Executi…`, `Operati…`, `Prepara…`, `Repor…`.
Compliance Library truncates two.
**Fix:** shorter header words, or the column-manager pattern that already exists on
Planning. A header a user cannot read is a column they cannot use.

### S8 · Columns that are entirely empty 🟡
Planning `Risk` and `Priority`, Enforcement Library `Status`, Analytics `Exceptions` and
`Review quality` — every cell `—` or blank.
**Fix:** if a column has no data in the design, either populate it or remove it. An empty
column teaches a developer to build a field nobody fills.

### S9 · Four conventions for absent data 🟡
`—`, `Not configured`, `None`, `Not source-backed` all appear.
**Fix:** `—` for genuinely empty, `Not configured` for ungoverned, and nothing else.

---

## Screen-specific findings

| # | Screen | Finding | Sev |
|---|---|---|---|
| P1 | Operations Center | **The map is an ellipse.** A green oval with five dots and a floating "Saudi Arabia" label, standing in for the live operations map — the single biggest premium-look defect in the file | 🔴 |
| P2 | Dashboard | Region bars are green or orange with **no legend**. The threshold (~85%) is invisible | 🔴 |
| P3 | Dashboard, Factory 360 | Trend charts have **no axis, no gridline, no scale**. Four bars and a caption | 🟡 |
| P4 | 6 admin frames | Users & Roles, Lookup, Risk Config, Survey Config, Notification Config, Integration Management in EN·Light are **six identical RBAC refusal screens** — no admin UI. The real ones are on page `Admin Shell` | 🔴 |
| P5 | Enforcement Library | Sparse: filter bar, six rows, empty `Status` column, no pagination or summary. Reads unfinished beside its neighbours | 🟡 |
| P6 | Execution | Empty week-board days render as filled grey blocks — indistinguishable from loading skeletons | 🟡 |
| P7 | Compliance Library | Rail reads `All regulations 6` above authorities totalling 85 | 🟡 |
| P8 | Analytics | Eight filters stacked vertically in a narrow column; every other screen uses a horizontal filter bar | 🟡 |
| P9 | Planning | `Confidence % 96` on cards, `92% confidence` on the badge — two formats for one metric | 🟢 |
| P10 | Factory 360 vs SCR-WEB-400 | Two frames for one screen at wildly different fidelity — legacy is 2,156px with portfolio rail, metrics, trends and accordions; mine is 929px of four plain tables | 🔴 |
| P11 | ~~Review queue selection~~ | **WITHDRAWN — misdiagnosis.** `#dfeee9`/`#176b52` *are* `accent-soft`/`action-primary`, correctly bound. The card only reads as compliance green because the SAQEEL brand accent and the compliant status share a hue family. Worth a palette conversation, not a defect | ⚪ |
| P12 | Review queue | `Penalty proposed` on **100%** of rows — a signal with no variance is noise | 🟡 |
| P13 | Dashboard | `Generated 6 min ago · Gemini provider` exposes the AI vendor in a government UI | 🟢 |

---

## Fix plan, in order

**Phase 1 — the cheap wins that change how the file reads** (≈1 session)
1. S1 placeholder purge — one component property, clears 376 defects
2. S2 status colour determinism — one label, one colour
3. S3 `Identifier` component — mono, neutral, never badged
4. ~~P11 selection re-token~~ — withdrawn, it was already correct
5. P12 remove the constant `Penalty proposed`, or make it conditional

**Phase 2 — the credibility fixes** (≈1 session)
6. P1 replace the ellipse with a real map frame — the `GeoMap` component and KSA region
   GeoJSON already exist in the repo
7. P2/P3 add legends, axes and thresholds to every chart
8. P4 decide the six admin duplicates: delete them, or point them at `Admin Shell`
9. P10 reconcile Factory 360 — one frame, the richer one, correctly named

**Phase 3 — the AR rebuild** (≈2 sessions, partly blocked)
10. S4 rebuild `InspectionCard` EN-correct, regenerate AR from it, assert role parity
11. S5 land the 213 translations *(blocked on the Arabic reviewer)*, then re-run
12. S3 AR identifier corruption clears with the regeneration

**Phase 4 — polish**
13. S6 collapse the type ramp and colour set
14. S7 header lengths, S8 empty columns, S9 absent-value convention
15. P5–P9, P13

**Phases 1 and 2 are what move UI from 5 to roughly 8.** Phase 3 is what moves AR from 3.

---

## Note on method

Four automated passes reported this file clean. They measured bounding boxes, node counts
and token bindings — never a rendered line, never a colour's meaning, never whether a
column had data. The defects above were found by looking at the screens.

Any future audit should assert semantics, not structure: same label → same colour,
identifiers never coloured, no column entirely empty, no literal `Placeholder text`, and
AR component roles matching EN.


---

## Phase 1 — done 2026-08-01

| Item | Result |
|---|---|
| S1 placeholders | **376 → 0.** 221 were the shell search (one component), 107 fields got domain copy, 32 AR fields echo their own Arabic label rather than carry English, 16 generic `Search` |
| S2 status colour | **172 badges re-varianted, 0 conflicts left.** `Submitted`→Info, `Published`→Completed, `High`→Critical, `Medium`→Warning, `Draft`/`Not started`→Draft, plus the risk labels that were rendering grey |
| S3 identifiers | **343 normalised** — all IBM Plex Mono, all token-bound to `text-secondary`, badge fills stripped from the 6 that were pill-wrapped |
| P11 | Withdrawn — see above |
| P12 | `Penalty proposed` hidden on all but the first row, 10 instances, so it reads as a signal rather than furniture |

No new clipping. The 6 remaining clipped nodes are the pre-existing Factory 360 `identity`
and AR caret defects, unchanged.

**Two mistakes made and corrected inside this phase**, both worth recording because they
have the same root cause: `setBoundVariableForPaint` keeps a *cached literal* alongside the
binding. Passing a black base produced black cards; passing the light base produced a light
card inside a dark frame. The cached colour must match the mode the frame renders in. The
first attempt at both the identifier fills and the selection fill fell into this.


---

## Phase 2 — done 2026-08-01

| Item | Result |
|---|---|
| P1 map | **The ellipse is gone.** Replaced with real Saudi ADM1 geometry — all 13 regions, projected from `apps/web/public/geo/sau-regions.geo.json` (GADM v4.1) using the exact bounds in `lib/ksa-regions.ts`, so Figma frames the Kingdom the way the app does. Markers moved onto real cities (Riyadh, Jeddah, Dammam, Madinah, Abha, Tabuk). Replicated to all five sections with mode-correct land and border colours. Deliberately **not** mirrored in AR — geography is geography |
| P2/P3 charts | Compliance explorer gained a legend that reuses the bars' own paints, so the key cannot drift from the chart: *At or above the 85% national target* / *Below the national target*. Enforcement trend gained a scale line — *Scale 0–168 enforcement actions per quarter, bars are proportional*. Added at component level, so all four locale/theme variants inherit |
| P4 admin | The six frames are the RBAC refusal a non-admin meets at an admin route — a real state, wrongly named. Renamed `RBAC refusal — <screen> — <route> — admin UI is SCR-ADM-0xx on page Admin Shell` |
| P10 Factory 360 | The rich 2,156px legacy frame now carries the governed identity `SCR-WEB-400 — /factories/[id]/360`. My thin 929px rebuild is marked `SUPERSEDED — regions-only draft` |
| Naming | Six frames that have no catalogue row but *are* justified by a Jira epic now carry it: Dashboard INSP-1, Execution INSP-5, Compliance Library INSP-7, Approval Queue INSP-8, Enforcement Library INSP-9, Analytics INSP-10 |

Clip census unchanged at 6 — the known Factory 360 `identity` and AR caret defects. No regression.

### Why the map is vectors, not a Mapbox raster

The design bundle renders a live Mapbox GL map, so there are no SVG paths to import, and
Figma's `createImageAsync` is unavailable in this environment — a Mapbox Static raster
could not be fetched into the file. Drawing the canonical GeoJSON as vectors is arguably
better for a design file anyway: it is crisp at any zoom, carries no API dependency, and
comes from the same source the application uses.

### Note on a credential

`designs/**/ksa-adm1-map.js` contains a Mapbox `pk.` token in plaintext, committed to the
repo. Mapbox public tokens are designed for client-side use so this is not a private-key
leak, but an unrestricted `pk.` token can be used by anyone who finds it and billed to this
account. Worth confirming it has URL restrictions set in the Mapbox dashboard. I did not
use it — no request was made to Mapbox.

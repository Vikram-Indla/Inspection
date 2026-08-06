# Before / after evidence — Figma remediation

File `ML2PNwfShlQM2k44MvSEw5`, page **— SCREENS —**. Applied 2026-08-05 by the Claude Figma UX audit, in place, with Product Owner authorisation.

All changes are **geometry only**. No string, colour, component structure, token, route or business-meaning change. No component was detached.

## Page-level measurement, same method before and after

Visibility-filtered overflow scan (text `absoluteBoundingBox` vs nearest `clipsContent` ancestor; nodes skipped if any ancestor is `visible === false`). 37,043 visible text nodes.

| | Before | After |
|---|---|---|
| Clipped visible text nodes | 381 | **345** |
| Distinct clipper/overflow groups | 62 | **53** |
| Groups named in INSP-777 | 7 | **0** |

## CFX-004 — Planning Map filter chips

Screens SCR-PLN-200 EN·Light (`433:49148`) and EN·Dark (`532:79607`), panel `Map filters and results` (288px, 16px padding → 256px usable).

| Chip | Before | After |
|---|---|---|
| `Button — Region: All` | 110px fixed | 88px hug |
| `Button — Risk: High and critical` | 160px Light / 110px Dark | 154px hug |
| `Button — Window: Next 30 days` | 160px Light / 110px Dark | 157px hug |
| `Button — Inspector status: Available` | 110px fixed — **label clipped 62px** | 184px hug — label complete |

Change: chip `layoutSizingHorizontal = HUG`; label `textAutoResize = WIDTH_AND_HEIGHT`, `layoutSizingHorizontal = HUG`.
Nodes: `433:49542`, `433:49544`, `433:49546`, `433:49548`, `532:79628`, `532:79630`, `532:79632`, `532:79634` and their labels.

**Incidental finding:** in Dark all four chips were 110px, but their labels were fixed at a narrower width, so they read as silently truncated rather than geometrically clipped — which is why the scan never flagged them. Truncation without an ellipsis and without a size that fits is the same failure wearing a different mask. Both themes are now consistent.

**Verified:** rendered `433:49540` at 2×. All four labels legible in full, consistent chip rhythm, no overlap, 72px headroom on the widest chip.

## CFX-006 — Planning Calendar Visit chips

Screens SCR-PLN-190 at 1024 (`439:51974`) and 768 (`447:57704`). 12 chips per screen.

**Horizontal:** the label node was 110px wide inside an 82px (1024) / 76px (768) content box. It already carried `textTruncation = ENDING`, but truncation applies at the text node's own width, so it hard-clipped mid-glyph instead of ellipsing. 48 labels set to `layoutSizingHorizontal = FILL`.

**Vertical (pre-existing, previously masked):** chip height was a fixed 38px; two label lines plus padding and gap need 46px, so the second line clipped by 4px. The scan reports only the largest overflow per node, so the 23–29px horizontal figure hid it. Surfaced only after the horizontal fix. All 24 chips set to `layoutSizingVertical = HUG`.

Day cells re-measured after the change: **none overflows** (132px cell, all content need inside it).

**Verified:** rendered `439:52008` and `447:57738` at 2×. Visit ID and time fully inside the chip tint at both breakpoints.

## CFX-007 — Inspector Workload

Screen SCR-PLN-220 @768 (`447:58161`). 35 `Cell — *` labels set to `FILL`:

| Cell | Cell width | Label before | Label after |
|---|---|---|---|
| `Cell — Inspector` | 140px | 132px | 124px |
| `Cell — Region` | 100px | 94px | 84px |
| `Cell — Assigned` | 76px | 66px | 60px |
| `Cell — Capacity` | 76px | 66px | 60px |
| `Cell — Utilization` | 94px | 84px | 78px |

`Button — Retry calculation` (`433:50770`) hugged: 110px → 125px.

**Verified:** rendered `447:58192` at 2×. Header and rows read cleanly.

## Regression check

The only new group in the intermediate scan was `Visit chip | 4px` (8 nodes). Investigated rather than assumed: it was the **pre-existing vertical overflow described above**, unmasked by the horizontal fix, not a regression introduced by it. Fixed in the same pass; final scan returns zero for it.

No other group increased between the before and after scans. Total fell by 36 nodes and 9 groups.

## Deliberately not fixed

The remaining 345 clipped nodes are almost entirely the `Table cell` / `tr` / `thead` responsive family tracked in **INSP-776**. Fixing those means deciding which columns survive at 768 — a column-priority decision, not a constraint fix. Touching it would mean inventing product judgement.

Visible in the workload render: the table row is 728px inside a 660px container, cutting the "Next available" column. Same INSP-776 root cause, left alone.

---

# Remediation 2 — contrast: black text on dark surfaces (2026-08-05)

Applied in place with Product Owner authorisation. Colour binding only — no size, weight, string, layout or component-structure change.

## Correction to the diagnosis before the fix

INSP-792 originally described this as "Dark theme lost its text tokens". That was wrong, and checking before editing is what caught it.

The **same-build light siblings carry the identical unbound `#000000` fills** — `SCR-FLD-610 EN·Light` (692:2), `AR·RTL` (719:31), `SCR-FLD-620 EN·Light` (696:229), `SCR-FLD-670 EN·Light` (704:95056). The real defect: this field-screen family was built with **no text-colour binding at all, in any theme**. Light passes contrast only because black on white is 21:1.

Consequence: **no variant in the file records the intended token.** A name-level mapping against the EN·Light twins matched only **4 of 116** nodes, because the Dark screens are a separate build using content-named nodes (`"Readiness"`, `"Window: 09:00 → 12:00"`) rather than structural ones (`nav-label`, `group-label`).

## What was applied

**115 text fills bound to the `text-primary` variable** across 22 frames — SCR-FLD-600/610/620/630/640/650/670 in EN·Dark and AR·RTL·Dark, plus the eight SCR-IPAD-6xx frames.

| Frame group | Nodes bound |
|---|---|
| SCR-FLD-610 Startup Pack (EN·Dark + AR·Dark) | 37 |
| SCR-FLD-620 Journey & Check-In (EN·Dark + AR·Dark) | 36 |
| SCR-FLD-670 Returned Correction (EN·Dark + AR·Dark) | 18 |
| SCR-FLD-640 Evidence Capture (EN·Dark + AR·Dark) | 8 |
| SCR-FLD-650 Findings (EN·Dark + AR·Dark) | 4 |
| SCR-FLD-600 / 630 (EN·Dark + AR·Dark) | 4 |
| SCR-IPAD-600…670 | 8 |

**Why `text-primary` and not a finer mapping.** Its Light value `#1b242c` is what raw `#000000` already renders as, so Light appearance is preserved essentially pixel-for-pixel while Dark resolves to `#f1f4f6`. Choosing `text-secondary` for subtitles or `text-muted` for captions would have meant inventing a colour hierarchy the file does not record anywhere. Type size already carries hierarchy on these screens (30/22/15/14/13/11.5px); colour does not, and I did not add one.

## Verification

| | Before | After |
|---|---|---|
| Failing nodes, page — SCREENS — | 149 | **34** |
| Failing groups | 8 | 6 |
| `raw on surface-primary` (80 nodes @ 1.24:1) | present | **gone** |
| `raw on surface-canvas` (35 nodes @ 1.13:1) | present | **gone** |

Rendered SCR-FLD-610 EN·Dark (709:378) and SCR-FLD-600 EN·Dark (683:52) at full size and read them — previously invisible content is legible throughout.

## Deliberately not fixed

- Root cause 2 (dark text on frames with no `surface-*` fill) — 30 nodes; the fix is frame styling, not text binding.
- Root causes 3 and 4 (`text-disabled` inversion, `chart-label`, `status-disabled-text`, `nav-indicator`) — token re-values needing design ownership.
- The **Light and AR·RTL siblings** of the fixed screens still carry unbound raw black. They pass contrast, so they are not an accessibility defect, but they are the same design-system defect. Out of the requested scope; flagged for follow-up.

## Concurrent-edit warning

Page *— SCREENS —* grew from **36 to 86 top-level children** during this session. **44 new frames** prefixed `AUDIT REMEDIATED — SUPERVISOR — …` (3,143 text nodes) were added by a parallel audit — e.g. 937:147889 Operations Center, 937:147951 Review & Approval. Page text nodes went 38,736 → 41,879.

- That audit is **duplicating screens rather than fixing in place**, a different strategy from the one used here. There are now two Operations Center EN·Light frames with different content; which is canonical needs deciding before either is implemented.
- **Page-level totals in this document are therefore not a clean before/after.** The 149→34 delta holds because the 115 changed nodes are individually identified and re-measured, and none sits inside an `AUDIT REMEDIATED` frame — but the "evaluated" count rose from 37,603 to 40,424 purely from the other agent's additions.
- No `AUDIT REMEDIATED` frame was touched by this remediation.

---

# Remediation 3 — extending the binding to Light and AR·RTL siblings (2026-08-05)

Colour binding only. No size, weight, string, layout or component-structure change.

## What was applied

**144 further text fills bound to `text-primary`** across 46 frames in the `SCR-FLD-*` / `SCR-IPAD-*` family — the EN·Light and AR·RTL variants carrying the same unbound `#000000` that passed contrast only because black on white is 21:1.

**Running total for this defect: 259 nodes** (115 failing Dark + 144 passing Light/AR).

Newly covered beyond the original failure set — eleven Light field screens that never appeared in any contrast failure list: SCR-FLD-DASH, ESTAB, NOTIF, VISITS, ACCOUNT, REPORTS, VIRTUAL, INCIDENT, SEARCH, SETTINGS, COMPLETED.

## Three nodes deliberately NOT bound

The script computed what contrast **would become** after binding and skipped any node that would fail. Three did:

| Node | Frame | Would have become |
|---|---|---|
| `709:411` "Geofence — Al-Fahad Textiles Factory" | SCR-FLD-610 EN·Dark | **1.10:1** |
| `716:45` "subtitle" | SCR-FLD-660 EN·Dark | **1.10:1** |
| `767:343` "subtitle" | SCR-FLD-660 AR·Dark | **1.10:1** |

These sit on **light containers inside Dark screens** — a map-panel header and a subtitle strip whose frames never received a `surface-*` fill. Binding them would have resolved `text-primary` to `#f1f4f6` on white and **manufactured three new instances of root cause 2**. They remain raw black, which currently renders correctly, and belong to the root-cause-2 fix (give the container its surface token), not to this one.

## Verification

| | Before | After |
|---|---|---|
| Contrast failures, page — SCREENS — | 34 | **34** (no regression) |
| Unbound near-black in SCR-FLD-* / SCR-IPAD-* | 147 | **3** (the guarded skips) |

Rendered SCR-FLD-DASH EN·Light (`808:81`) and SCR-FLD-620 AR·RTL (`724:81`) and read them. Appearance unchanged — `text-primary` Light is `#1b242c` against the previous `#000000` — and the Arabic RTL layout is intact.

## Why do this when nothing was failing

Each of these 144 nodes was one surface change away from becoming an accessibility defect — which is exactly how the 115 Dark failures arose. Bound to the token, they now move correctly with the theme instead of being stranded by it.

---

# Remediation 4 — root cause 2: containers missing their surface token (2026-08-05)

**Page contrast failures: 34 → 7.** 278 nodes changed. Colour/fill binding only.

## The containers were three different defects, not one

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | **SCR-FLD-660 frames had NO fill** (`702:107785`, `716:39`, `767:338`) — text fell through to the white section canvas | Every other FLD screen frame carries `TOKEN surface-canvas` | Added `surface-canvas` |
| 2 | **Raw `#ffffff` containers** — `panel-header`, calendar day cells, a 976×639 `Frame` in SCR-IPAD-630 | `surface-primary` Light **is** `#ffffff` | Bound to `surface-primary` |
| 3 | **`sq-content` carried raw `#f6f9fa`** — invisible in Light, strands white text in Dark | `surface-canvas` Light is `#f5f7f8`, visually identical | Bound to `surface-canvas` |

## A regression I introduced, and closed out

After binding the day cells, page failures went **34 → 35**. Theming the containers stranded the screen's *text*, which was also raw. The Dark and Light Planning Calendars are **byte-identical raw builds** — `#576370` ×51, `#08634d` ×12, `#17212e` ×4 — never themed in either mode. Half-fixing made it worse.

Completed rather than reverted, each raw value mapped to the token whose **Light value is closest**, so Light appearance is preserved:

| Raw | Token | Light value | Nodes |
|---|---|---|---|
| `#17212e` | `text-primary` | `#1b242c` | 8 |
| `#576370` | `text-muted` | `#5f666c` | 102 |
| `#08634d` | `accent-text` | `#104f3d` | 24 |
| `#e8f5f0` (chip fills) | `accent-soft` | `#dfeee9` | 24 |
| `#ffffff` (headers, week rows, chips) | `surface-primary` | `#ffffff` | 36 |

**Left alone:** two `Month` nodes at raw `#ffffff` (`532:79475`, `433:49016`) sit on a selected chip and need `text-on-action` or `text-inverse` depending on intent. Guessing would have been inventing.

## Verification

Rendered both calendars. Light unchanged. Dark now renders title, subtitle, controls, weekday headers, day numbers and visit chips all legible — the title and toolbar were previously invisible.

The 3 nodes the earlier guard refused (`709:411`, `716:45`, `767:343`) were re-tried once their containers were themed and now bind at **15.33:1** and **16.86:1**.

## The 7 remaining failures — none are root cause 2

- **5 nodes**: root cause 4 token re-values awaiting design ownership — `status-disabled-text` on `surface-canvas` (4.17:1) and on `status-disabled-soft` (3.86:1).
- **2 nodes** (`962:235880`, `962:235881`): a **newly-created duplicate** of the Planning Calendar carrying the original unthemed defect. Node IDs in the `962:*` range that did not exist when this work began. The screen I fixed (`532:*`) is clean.

## Concurrent-edit escalation — now with a measured cost

During this remediation alone the page's evaluated text nodes rose **40,424 → 46,994**. The parallel audit has produced another Planning Calendar copy that **reintroduces the exact defect just fixed**, plus a `SCR-PLN-161` copy (`I962:231775`) carrying the `status-disabled-text` issue.

This is the concrete cost of duplicate-rather-than-fix: **remediation does not propagate to the copies, and the copies re-seed fixed defects.** A canonical-frame decision is needed before more work lands on either side.

## Systemic finding recorded while fixing

Page-wide: **31 `sq-content` nodes still carry raw `#f6f9fa`** against 14 correctly bound. Six sit on Dark screens — SCR-PLN-200 Planning Map and SCR-PLN-220 Inspector Workload beyond the calendar. They do not fail contrast today only because their text is raw dark too: consistently unthemed rather than correct. They will fail the moment anything on them is bound.

---

# Remediation 5 — theming Planning Map and Inspector Workload (2026-08-05)

**282 nodes. Page contrast failures held at 7 — no regression.**

## Method corrected from remediation 4

On the calendar I bound containers first and briefly made things worse, because the screen's text was raw too. Here both screens were censused end to end **before** any write, and text and fills were bound in a single pass.

Both showed the calendar's signature: **Light and Dark are byte-identical raw builds**, never themed in either mode.

## Mapping — closest Light token value, so Light is preserved

| Raw | Token | Nodes | Where |
|---|---|---|---|
| `#17212e` | `text-primary` | 92 | titles, control labels, table cells |
| `#576370` | `text-muted` | 34 | subtitles, captions, column labels |
| `#08634d` | `accent-text` | 14 | metric values, region counts |
| `#ffffff` (text) | `text-on-action` | 2 | "Unassigned" on the accent button |
| `#b81f1f` | `status-critical` | 2 | over-capacity "7" |
| `#ffffff` (fill) | `surface-primary` | 130 | cards, chips, table rows, map controls |
| `#f6f9fa` | `surface-canvas` | 4 | `sq-content` |
| `#08634d` (fill) | `action-primary` | 2 | Unassigned button |
| `#e8f0f2` | `surface-sunken` | 2 | Regional planning panel |

Frames: SCR-PLN-200 (Light `433:49148`, Dark `532:79607`), SCR-PLN-220 (Light `433:49569`, Dark `532:79655`). **Zero nodes skipped** — every raw value had an unambiguous closest match.

## Verification

Rendered both Dark screens. Planning Map: title, subtitle, filter chips, coverage filters, unassigned-visit cards, region chips — all legible. Inspector Workload: the four metric tiles (48 / 36 / 74% / 7), full table header and all four rows — all legible. Both were previously dark-on-dark across the header and control regions. Light variants unchanged.

## Refinement deliberately left open

The 15 `Map controls` fills went to `surface-primary` (exact Light match `#ffffff`). The system has a purpose-built `map-control-surface` token (`#fffffff5` / `#1e2126f5`) that is arguably more semantically correct for floating map chrome, but it carries 96% alpha and would change rendered appearance. That is a design call, not a defect fix.

---

# Remediation totals across this audit

| Remediation | Nodes | Verified |
|---|---|---|
| 1 — chip/cell clipping (INSP-777) | 115 | rescan 7 groups → 0, rendered |
| 2 — black-on-dark contrast | 115 | 149 → 34, rendered |
| 3 — Light/AR sibling binding | 144 | no regression, rendered |
| 4 — root cause 2 containers + calendar | 278 | 34 → 7, rendered |
| 5 — Planning Map + Workload | 282 | 7 → 7, rendered |
| **Total** | **934** | |

Page contrast failures overall: **149 → 7**. Of the 7, five are token re-values awaiting design ownership and two are in the parallel audit's duplicate frames.

---

# Remediation 6 — design-system token re-values (2026-08-05)

**Different class of change from everything above: this edits the design system itself.** The four values below propagate to every consumer of these tokens, in both themes, anywhere the library is used. Flagged as needing design ownership; Product Owner instructed the change.

## Safe because all four are literals

Verified before writing: `text-disabled`, `chart-label`, `status-disabled-text` and `nav-indicator` hold **literal** values in the Color collection, not aliases into Primitives. Retargeting them touches no other token and leaves the Primitives ramp untouched.

## Values changed

| Variable | Mode | Before | After | Effect |
|---|---|---|---|---|
| `text-disabled` | Light | `#4c5258` (7.91:1) | **`#72767b`** (4.57:1) | now weakest text token |
| `text-disabled` | Dark | `#c8c4bc` (9.74:1) | **`#868582`** (4.59:1) | now weakest text token |
| `chart-label` | Light | `#71787e` | **`#666c71`** | ≥4.5:1 on all five Light surfaces |
| `chart-label` | Dark | `#82888f` | **`#8c9298`** | ≥4.5:1 on all five Dark surfaces |
| `status-disabled-text` | Light | `#71787e` | **`#676d73`** | 4.51:1 on its soft background |
| `status-disabled-text` | Dark | `#82888f` | **`#878d93`** | 4.54:1 on its soft background |
| `nav-indicator` | Light | `#35b285` (2.67:1) | **`#32a77d`** (3.02:1) | meets 3:1 non-text |
| `nav-indicator` | Dark | `#3fbd8d` | *unchanged* | already 7.72:1 |

Each is the **minimum** shift along the token's own hue satisfying every surface it actually sits on — not a palette redesign.

## The inversion, resolved

Text ramp on `surface-primary`:

| | primary | secondary | muted | disabled |
|---|---|---|---|---|
| Light | 15.73 | 7.74 | 5.83 | **4.57** |
| Dark | 15.33 | 8.06 | 6.41 | **4.59** |

Correctly ordered in both modes. Previously disabled was second-strongest.

**Likely origin:** the original values were picked by mirrored *position* in the neutral ramp — Light took `neutral/700` (`#4c5258`), Dark took `neutral/400` (`#c8c4bc`). Symmetrical by index, inverted by perceptual weight.

## Verification

- **SCREENS: 7 → 2** failing nodes; all five `status-disabled-text` failures cleared.
- **Admin Shell: 29 → 29** — unchanged, confirming no regression from a global token change.
- Rendered Analytics EN·Light (`47:1258`), the densest `chart-label` consumer in the file: axis labels, regional performance table, KPI cards, state-count badges and the "Not configured" / "Decision required" chips all read correctly.

## Remaining contrast failures across both pages

- **2 nodes** — the parallel audit's duplicate Planning Calendar (`962:235880`, `962:235881`).
- **29 nodes on Admin Shell** — original root-cause-1 cluster, never in scope for the field-screen work: 25 nodes `raw on accent-soft` at **1.27:1** on SCR-ADM-001 Admin Home, 4 at 1.99:1 on SCR-ADM-040. Same defect, same fix as the 259 field nodes.

---

# Remediation 7 — Admin Shell raw text (2026-08-05)

**Admin Shell contrast failures: 29 → 0.** 58 nodes bound.

## The 29 were two different colours grouped under one label

My earlier report grouped by *background* token, merging two unrelated foregrounds.

**1. Raw `#1a4d8c` — annotation text (32 nodes, 9 screens)**
Labels like "2 work panels in your scope", "Change-request controlled", "Proven rule". Fine in Light (7.06:1 on `accent-soft`); collapses to **1.45:1** on `accent-soft` Dark and **2.00:1** on `surface-primary` Dark.

Bound to **`status-info-text`**, chosen on evidence:

| Candidate | RGB distance from raw | Dark on `accent-soft` |
|---|---|---|
| **`status-info-text`** | **19** | **6.61:1** |
| `status-info` | 45 | 3.93:1 — fails |
| `text-link` | 89 | 5.18:1 |

Light appearance effectively unchanged: 7.30:1 vs 7.06:1.

**2. Raw `#40454d` — status badge labels (26 nodes, 7 screens)**
"Draft", "Deactivated", "Returned", "Closed", "Expired", "Suspended", "Queued", "Awaiting enrolment", "Limited record" — one flat grey for every badge. Bound to **`status-pending-text`** (distance 25, vs 40 for `status-draft-text`, 41 for `text-secondary`).

## A semantic question left open, not decided

Binding all badge labels to one token is the faithful fix — they *were* all one grey, so the existing relationship is preserved while moving onto the system.

But the system carries a full status family, and a "Draft" badge arguably wants `status-draft-text`, "Deactivated" wants `status-disabled-text`. Per-label assignment would be more correct **and would make the badges distinguishable from each other, which they currently are not**. Not done because "Returned", "Limited record" and "Awaiting enrolment" have no obvious status class — that is a design decision.

Separately: several of these badges sit on `accent-soft` (green). A "Draft" or "Deactivated" badge on accent-green is questionable independent of text colour.

## Left alone deliberately

`ad-wordmark` holds raw `#1d1f20` (Theme=Light) and `#ffffff` (Theme=Dark), 3 nodes each — a brand lockup with per-theme variants that passes contrast. Brand marks are a legitimate place for fixed values.

## Verification

29 → 0 across 25,694 evaluated pairs. Rendered SCR-ADM-001 Admin Home EN·Dark and SCR-ADM-080 Notification & SLA Rules EN·Dark — the annotation chip and the Published / Draft / Deactivated badges all read clearly. The annotation text was previously invisible.

---

# Final contrast position

| Page | At start | Now |
|---|---|---|
| — SCREENS — | 149 | **2** |
| Admin Shell | 29 | **0** |

The remaining 2 are in the parallel audit's duplicate Planning Calendar (`962:235880`, `962:235881`) — not in any frame this audit owns.

**Every contrast failure in frames this audit owns is closed.**

| Remediation | Nodes |
|---|---|
| 1 — chip/cell clipping | 115 |
| 2 — black-on-dark contrast | 115 |
| 3 — Light/AR sibling binding | 144 |
| 4 — root cause 2 containers + calendar | 278 |
| 5 — Planning Map + Workload | 282 |
| 6 — design-system token re-values | 4 variables (8 mode values) |
| 7 — Admin Shell raw text | 58 |
| **Total** | **992 nodes + 4 tokens** |

---

# Remediation 8 — badge labels onto their proper status tokens (2026-08-05)

**26 text nodes + 26 backgrounds. Admin Shell stays at 0 failures.**

## The system already defined the pairing rule

The canonical `Badge` component (page *Badge, Tag & Chip*) has 11 variants, each pairing a soft background with its matching text colour — `status-critical-soft`/`-text` through `status-disabled-soft`/`-text`, plus an Outline variant on `text-secondary`. So the only open question was which status class each label belongs to, not how to express it.

## Why the background changed too

All 26 bespoke badges sat on **`accent-soft`** (brand green) regardless of what they said. Text-only binding would have put `status-draft-text` (warm brown) on a green chip — a pair the system never designed and one I could not contrast-verify. Changing both keeps every badge on a designed, pre-verified pair.

| Label | Status class | Basis |
|---|---|---|
| Draft | `draft` | direct |
| Deactivated | `disabled` | direct |
| Closed | `completed` | direct |
| Suspended | `onhold` | direct |
| Queued | `pending` | direct |
| Awaiting enrolment | `pending` | direct |
| Recording a decision… | `pending` | in-progress state |
| 2 components in R2 | `info` | informational count, not a status |
| **Returned** | **`warning`** | **judgement** |
| **Expired** | **`disabled`** | **judgement** |
| **Limited record** | **`info`** | **judgement** |

Distribution: pending 6, draft 4, disabled 4, warning 4, info 4, completed 2, onhold 2.

## The three judgement calls, flagged for override

- **Returned → `warning`** — a returned submission needs rework, so an attention state rather than terminal. `pending` is defensible if returns are just "back in the queue".
- **Expired → `disabled`** — treated as terminal and inactive. `warning` if an expired record should prompt action.
- **Limited record → `info`** — reads as a data-completeness note, not a workflow state.

None changes what a badge *says*, only its colour family. Each is a one-line mapping change.

## Verification

Admin Shell **0 failing nodes** across 25,694 pairs. Every badge pair in its designed range: `disabled` 4.51:1, `onhold` 6.06, `warning` 6.39, `draft` 6.48, `pending` 7.15, `completed` 7.29, `info` 7.39.

Rendered SCR-ADM-080 EN·Dark: Published reads green, Draft warm, Deactivated grey — **the badges are now distinguishable from each other**, which they were not when all 26 shared one grey on one green chip.

## Correction to an earlier figure

My "26 badge labels" bind returned 749 nodes on `status-pending-text` in a follow-up query. **723 were already correctly bound before I touched anything** — the "Not configured" / "غير مُهيَّأ" badges (363 EN + 360 AR), proper `Badge` instances on `status-pending-soft`. Only 26 nodes were ever changed by me.

## Left as-is

16 annotation chips ("2 work panels in your scope", "Change-request controlled") remain `status-info-text` on `accent-soft` at 6.61:1. Named `badge — real scope` / `badge — real status`, they are design annotations rather than product status badges. They pass comfortably — but whether annotation chrome should ship on a production screen at all is a separate question from colour.

---

# Remediation 9 — R2 chips removed, misleading layer names corrected (2026-08-05)

## Removed — internal release identifier (2 nodes)

Chips reading **"2 components in R2"** on SCR-ADM-250 Compliance Request Detail (EN·Light `854:38825`, EN·Dark `860:142943`), beside the "Components" section title.

`R2` is an internal release/phase identifier. Both `badge` frames removed entirely rather than just their text, so no empty chip remains. Parent `section-head` frames go 2 children → 1 (`title`); the horizontal auto-layout closes cleanly. Rendered before and after to confirm.

## Renamed — 29 layers (naming only, no content change)

| Old | New | Count |
|---|---|---|
| `badge — real status` | `badge — governance status` | 24 |
| `badge — real scope` | `badge — scope summary` | 5 |

## The near-miss this prevented

I originally reported all 38 of these as "annotation chrome" and recommended deleting them — **on the strength of the layer names alone**. That recommendation was wrong.

Reading each in rendered context before acting showed the content is load-bearing product UI:

- **"Takes effect immediately on save"** — beside the Risk Settings title; a behavioural warning for an admin editing risk weights.
- **"Proven rule" ×8** — row labels in the Mapping validation lens on Violation Catalogue.
- **"Change-request controlled"** — explains why the catalogue is read-only.
- **"Writer role required to change"**, **"Configuration writer"**, **"No published version"**, **"2 factories in your scope"** — permission and state statements.
- **"Regulations" / "Packages" / "Current step"** — a **stepper component**; deletion would have broken a navigation control.
- **"Limited record"** — data-state badge in a table cell on Audit Replay.
- **"Info"** — the badge inside the canonical Toast component.

Deleting on the original recommendation would have stripped genuine product guidance from seven admin screens. The word "real" in `badge — real status` reads as a reviewer's note ("this value is source-backed") — presumably its build-time meaning, but it made legitimate copy look disposable.

**Rule carried forward: layer names are not evidence of content type.** Anything proposed for deletion under INSP-754/755 must be read in rendered context first. The placeholder strings and the `shell-navigation.ts` sentence are safe to remove because their *text* is the problem; these were not.

Also corrected: I reported "16 annotation chips". The true count on `status-info-text` is **38**.

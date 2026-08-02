# REPAIR-V4 — Navigation chrome and icons

File: `ML2PNwfShlQM2k44MvSEw5` (SAQEEL Web master). Pass date 2026-08-01.
Property class: app shell chrome, icon sizing/alignment, badge placement on nav controls.

Territory not entered: section `339:42098`, section `384:45164`, anything on page `6:9`
below y=100000 (`423:47937`).

---

## 1. The defect: the sidebar rail was cut on 11 delivery frames

### Root cause, measured not assumed

The screen frame is a **horizontal** auto-layout with `layoutSizingVertical: HUG`.
`App sidebar` is a `FILL` child. So the rail does not set the frame height — it inherits
it from `main`, which hugs its own content. On a route whose page content is short, the
frame collapses and the rail collapses with it. `sq-shell__groups` clips, so the nav is
cut from the bottom.

The standard four-group rail is a fixed quantity:

| Part | Height |
|---|---|
| `sidebar-group` × 4 (140 + 176 + 140 + 68) | 524 |
| gaps, `itemSpacing` 11 × 3 | 33 |
| **`sq-shell__groups` intrinsic** | **557** |
| rail chrome (`brand` 69 + `sq-shell__footer` 42 + shell padding) | 159 |
| **minimum frame height** | **716** |

Confirmed against 34 healthy EN·Light shells: every frame ≥ 716 renders the rail whole;
every frame below it cuts nav. `1692 − 1533 = 159` reproduces the chrome constant on the
Dashboard frame, and on every other healthy frame.

This is the same defect class KNOWN-DEFECTS records against `SCR-WEB-320`. **That fix did
not hold.** It was set to 711, which is 5px short of the 716 the rail actually needs, so
the last group was still clipped by 5px. It is now corrected, and the same 5px shortfall
was found on two further routes that the original pass missed.

### Fix applied

`minHeight = 716` on the frame. The frame stays `HUG`, so it still grows with content;
it can no longer collapse below the rail. No frame was repositioned, no rail restyled, no
nav item removed, no value invented — 716 is derived from the rail's own content.

**Section `148:6893` — SCREENS EN · Light**

| Frame id | Route / screen | Before | After | Nav was cut after |
|---|---|---|---|---|
| `34:674` | Execution — /execution — INSP-5 | 711 | 716 | last group clipped 5px |
| `43:1037` | Enforcement Library — /enforcement-library — INSP-9 | 711 | 716 | last group clipped 5px |
| `192:18764` | SCR-WEB-320 Version Comparison — /reviews/[id] | 711 | 716 | last group clipped 5px |
| `378:44187` | SCR-PLN-160 Visit Plans register — /planning/plans | 492 | 716 | Compliance group, 224px cut |
| `378:44437` | SCR-PLN-170 Visit management — /planning/visits | 359 | 716 | Planning, 357px cut |
| `378:44637` | SCR-PLN-171 Visit details — /planning/visits/[id] | 483 | 716 | Compliance group, 233px cut |
| `378:44851` | SCR-PLN-180 Supervision queue — /planning/supervision | 516 | 716 | Compliance group, 200px cut |
| `380:44764` | SCR-PLN-161 Plan drill-down — /planning/plans/[id] | 597 | 716 | Insights group, 119px cut |

**Section `148:6894` — SCREENS EN · Dark**

| Frame id | Route / screen | Before | After | Nav was cut after |
|---|---|---|---|---|
| `95:7624` | Execution — /execution — INSP-5 | 711 | 716 | last group clipped 5px |
| `95:8165` | Enforcement Library — /enforcement-library — INSP-9 | 711 | 716 | last group clipped 5px |
| `199:20954` | SCR-WEB-320 Version Comparison — /reviews/[id] | 711 | 716 | last group clipped 5px |

The five `SCR-PLN-*` frames are the newest planner batch. They were authored after the
original `SCR-WEB-320` repair and reproduced the defect at much greater severity —
`SCR-PLN-170` was showing four of eleven nav destinations.

**Sections `148:6895` and `148:6896` — AR · RTL and AR · RTL · Dark: no repair needed.**
Both were censused and both are clean. Their rails need 545, not 557 — the Arabic labels
occupy fewer lines — and their frames are 704, which fits. Nothing was flipped, no
`left`/`right` value was authored, no `[dir="rtl"]` override added. The AR sections are
detached copies, so they were verified independently rather than assumed to inherit.

### Verification after repair

Rail overflow across all four sections, re-measured: **0**.

| Section | Shells | Overflowing | Tightest frame | Headroom |
|---|---|---|---|---|
| `148:6893` EN · Light | 34 | 0 | `34:674` h=716 | 0px |
| `148:6894` EN · Dark | 29 | 0 | `95:7624` h=716 | 0px |
| `148:6895` AR · RTL | 29 | 0 | `95:15721` h=704 | 0px |
| `148:6896` AR · RTL · Dark | 29 | 0 | `97:14280` h=704 | 0px |

Headroom 0 is exact fit, which is the intent — the rail is authored to fill the viewport.
Screenshot proof taken on `378:44437` (EN · Light, the worst case) and on `200:27769`
(SCR-WEB-320 AR · RTL), both showing the rail complete through `Administration` /
`الإدارة`.

---

## 2. Verified and found already sound — no edit made

**Notification badge — holds.** KNOWN-DEFECTS records a 14px badge hanging 4px above a
clipping `btn-notifications` on every frame. Every `btn-notifications` in all four
sections was re-measured against its badge children. **0 overhangs**, including in the
detached AR sections where the fix had to be repeated per frame. The per-frame AR repair
survived.

**Icon sizing and alignment — uniform.** Every icon instance inside `App sidebar`,
`App topbar`, `breadcrumb`, `tabs` and `page-back` across all four sections: **242
instances, all 18×18, all square.** Zero non-square, zero off-ramp sizes. Nothing to fix.

**Breadcrumb, tab strips and topbar — no overflow.** Every `breadcrumb`, `tabs`,
`App topbar` and `page-back` in all four sections was measured against its children's
extents. **0 right-overflow, 0 bottom-overflow.** The `SCR-WEB-300` tab-strip wrap
recorded in KNOWN-DEFECTS is holding.

**Deprecated components `15:44` (sidebar) and `15:45` (topbar) — genuinely dead.**
Swept for instances by main-component id across the four delivery sections and every
other screen-bearing page in the file — `Screen content` `152:7440`, `Admin Shell`
`111:2`, `Domain: Inspection` `158:2`, `00 — End-to-End Journey Navigator` `386:2`.
**Zero instances anywhere.** Nothing was rerouted. They can be deleted whenever the
owner chooses.

---

## 3. Icon gaps — confirmed, unchanged

No icon was drawn or invented. The library is page `73:2`. These glyphs are used by the
source designs and have **no equivalent in the Web icon library**; they are a
design-system change request, not a page-level fix.

| Gap | Source glyph | Web library `73:2` | Blocks |
|---|---|---|---|
| **Download** | `download-04` | no `icon/ui/download` | any export/download action |
| **Trash / delete** | `delete-02` | no `icon/ui/trash` or `icon/ui/delete` | delete actions, Media Minis, Multi Media Uploader |
| **Microphone** | `mic-01`, `mic-02` (two states) | no mic glyph | Mic Button, voice input, listening state |
| **Checkmark in circle** | `checkmark-circle-02` | only the plain `icon/ui/check` `73:6904` | success confirmation distinct from a plain check |

One further item needs a design ruling rather than a build: the source has
`file-attachment` as a glyph distinct from `icon/ui/paperclip` `74:71`. Whether paperclip
is an acceptable stand-in is a design decision — it was not assumed either way.
Cross-referenced against `BUILDPACK-W9-COMPONENTS-FORMS.md` §5, which reaches the same
list independently.

`Battery Icon` appears in the source but is device chrome, not a Web gap.

---

## 4. How to re-run this census

For every screen frame in the four locale/theme sections, find `sq-shell__groups`, sum
its children's heights plus `itemSpacing × (n−1)`, and compare against its own height.
Any positive difference is nav being cut. Then confirm the frame's `minHeight` is at
least that intrinsic height plus 159 for rail chrome. For badges, measure each
`btn-notifications` child against the button's absolute bounds. For icons, assert every
instance under a chrome node is square and 18×18.

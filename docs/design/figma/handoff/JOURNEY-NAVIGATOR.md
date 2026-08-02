# 00 — End-to-End Journey Navigator

**Page `386:2`** in `ML2PNwfShlQM2k44MvSEw5`. Non-destructive: **no canonical frame was moved,
renamed or deleted to build it.** Every card links to the real delivery frame — the navigator
contains no copied mock screens.

| Block | Node |
|---|---|
| README cover + legend | **`386:3`** |
| J-A Planned Inspection spine | **`386:17`** |
| Independent journey entry cards | **`386:162`** |

**21 cards**, each carrying step ID · action/outcome · persona · canonical screen name · route (with
the decision where catalogue and repo disagree) · Jira key or explicit gap · an `Open screen`
prototype link with an `ON_CLICK` → `NODE` reaction to the canonical frame.

## J-A — Planned Inspection, by persona lane

| Step | Action | Persona | Target |
|---|---|---|---|
| A.1 | Publish prerequisites — regulation, package version, rules | Admin | `40:913` Compliance Library |
| A.2 | Create Plan A from targeting criteria | Planner | `193:18887` SCR-WEB-110 |
| A.3a | Configure the visit and assign | Planner | `193:19644` SCR-WEB-140 |
| A.3b | Validate readiness and publish | Planner | `193:19875` SCR-WEB-150 |
| A.4 | Receive and accept the assignment | Inspector | `345:42242` SCR-FLD-600 |
| A.5a | Startup pack — package integrity and readiness | Inspector | `360:42863` |
| A.5b | Travel and geofenced check-in | Inspector | `305:40461` SCR-IPAD-620 |
| A.5c | Execute the checklist | Inspector | `345:42290` SCR-FLD-630 |
| A.5d | Capture evidence | Inspector | `306:40569` SCR-IPAD-640 |
| A.6 | Record findings, then submit the statement | Inspector | `306:40848` SCR-IPAD-660 |
| A.7a | Operations oversight | Supervisor | `25:221` SCR-WEB-500 |
| A.7b | Level 2 review decision | Supervisor | `192:18425` SCR-WEB-310 |
| A.8 | Outcome lands on the dashboard | Shared | `21:2` Dashboard |

Substeps use the required lettering — A.3a/A.3b, A.5a–A.5d, A.7a/A.7b — because those steps span
one screen each within a single stage.

## Independent journeys — 8 entry cards

J-B immediate planning `193:19408` · J-C bulk planning `29:528` · J-D returned correction
`362:42915` · J-E virtual inspection `195:20675` · J-F admin maker-checker `45:1146` ·
**J-G Factory 360 shared capability — two cards, one capability**: planner viewport `27:353` and
inspector viewport `356:42542`, which reuses the same ten region components · J-H Identify
Challenge `383:45019`, carrying **NO ROUTE / NONE FOUND** on its face.

## Defect fixed while building

Every card and lane row collapsed to ~10px. Cause: `resize()` called **after**
`primaryAxisSizingMode='AUTO'` re-fixes the axis. On a **horizontal** frame primary is *width*;
on a **vertical** frame primary is *height*. 72 nodes repaired deepest-first so parents resized
after their children.

This is the fourth time this exact trap has bitten in this programme. It is worth stating as a
rule: **set sizing modes after every resize, and repair depth-first.**

## Pages not yet renamed — deliberately

`10 — Supervisor`, `20 — Planner`, `30 — Inspector`, `40 — Admin`, `50 — Shared Capabilities`,
`90 — Reference & Superseded` are **not created yet**. The existing page structure is organised
by *component family and locale* (`Foundations: …`, `Badge, Tag & Chip`, `— SCREENS —`,
`Domain: Inspection`), not by persona, and every screen for all personas lives in the single
`— SCREENS —` page.

Renaming would not reorganise anything — it would only relabel component pages with persona names
they do not match, and a persona split needs frames moved between pages, which is exactly the
destructive step the brief forbids at this stage. **Recorded as the next decision, not silently
skipped.**

## Coverage, before any file rename

| | |
|---|---|
| Canonical inspector frames | **36** across 25 routes, all 0 clipped / 0 crunched at four widths |
| Source-import screens | **12** — 6 concept batches + 3 Identify Challenge + mismatch state + confirmation + establishment details |
| Planner frames | 6 pre-existing + **5 new** (SCR-PLN-160/161/170/171/180) |
| Components | **17** in `Domain: Inspection`, plus `CaptureControls` `382:286` and `ValidationGate` `369:284` |
| Source items classified | **356 of 356** |

## Unresolved source-to-Web screens

1. **Identify Challenge has no repo route and no Jira story.** Three faithful screens plus a
   mismatch state and a confirmation now exist with nothing to ship them against.
2. **Report-type selection** — six types drive the whole source visit flow and appear on no
   `/field/*` route.
3. **INSP-4's 16 Planning story keys** are not in the repo; `story-screen-map.csv` does not exist.
4. **14 of 36 inspector routes have no entry point**, `/field/inspection/[id]/results` worst —
   governed, designed, unreachable.
5. **`/planning/supervision`** implies a Supervisor persona the catalogue never defines.

## Visual QA status

| Area | Status |
|---|---|
| Inspector canonical + source-import | **0 clipped · 0 crunched · 0 off-ramp · 0 unbound · 0 placeholder** at 1280/1024/834/680 |
| Planner SCR-PLN-160/161/170/171/180 | clean at four widths |
| Planner SCR-WEB-120/130/140 | clean at four widths |
| Planner SCR-WEB-100 / 110 / 150 | **fail** — fixed-width `Table cell` at 166/198/248 cannot reflow. One column-strategy decision across three frames |
| Canvas hygiene | 25 loose components parked in `384:45164`; **0** loose nodes on `— SCREENS —` |

## On renaming the file to "Inspection — End-to-End Design"

**Not yet.** Three of eleven Planner frames still fail responsive QA, the persona page split has
not happened, and five source-to-Web items above are unresolved. The name would claim a
completeness the file does not have. Once the three table frames reflow and the persona pages
exist, the rename is justified — and I would rather say that than rename it now.

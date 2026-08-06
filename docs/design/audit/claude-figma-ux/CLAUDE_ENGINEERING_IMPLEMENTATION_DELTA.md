# Engineering implementation delta — Claude Figma UX audit

Source of truth: Figma `ML2PNwfShlQM2k44MvSEw5` — *Inspection — Web*, as of 2026-08-05.
**No application code was changed by this audit.** Everything below is a specification for engineering.

## Disposition legend

| Marker | Meaning |
|---|---|
| ✅ **FIGMA DONE** | Corrected in the live Figma file, rescanned and visually verified. The design is now implementable as drawn. |
| 🔧 **REPO CHANGE** | Application code must change to match. |
| 🔍 **CODE VERIFY** | Cannot be settled from Figma. Must be checked in the running product. |
| ⛔ **DECISION** | Blocked on a product or design decision. Do not implement until resolved. |

## Repo anchors confirmed by reading (not editing)

| Concern | File |
|---|---|
| Colour tokens, both themes | `apps/web/src/app/tokens.css` |
| Component classes | `apps/web/src/app/saqeel-components.css` |
| Runtime overrides | `apps/web/src/app/saqeel-runtime.css` |
| Routes | `apps/web/src/app/(app)/…` |

The repo mirrors the Figma token architecture closely: `tokens.css` carries a Light block and a Dark block with the same names as the Figma `Color` collection, and `.badge-*` classes already pair `--status-X-soft` with `--status-X-text` exactly as the Figma `Badge` component does. Most of this delta is therefore value and binding work, not restructuring.

---

## 1. Colour token re-values — 🔧 REPO CHANGE

**Jira:** INSP-792 · **Figma:** ✅ done (Color collection, both modes)

Four tokens were re-valued in Figma. `tokens.css` must match or the product will diverge from the design on every screen.

| Token | Theme block | Line | Current in repo | Change to |
|---|---|---|---|---|
| `--text-disabled` | Light | 54 | `#4c5258` | **`#72767b`** |
| `--text-disabled` | Dark | 180 | `#c8c4bc` | **`#868582`** |
| `--chart-label` | Light | 93 | `#71787e` | **`#666c71`** |
| `--chart-label` | Dark | 214 | `#82888f` | **`#8c9298`** |
| `--status-disabled-text` | Light | 88 | `#71787e` | **`#676d73`** |
| `--status-disabled-text` | Dark | 210 | `#82888f` | **`#878d93`** |
| `--nav-indicator` | Light | 42 | `#35b285` | **`#32a77d`** |
| `--nav-indicator` | Dark | 170 | `#3fbd8d` | *unchanged* |

**Why:** `--text-disabled` was the *second-strongest* text colour in both themes (7.91:1 Light, 9.74:1 Dark) — stronger than `--text-secondary` and far stronger than `--text-muted`. Disabled controls drew more attention than live supporting text. The other three failed WCAG on surfaces they actually sit on.

**After the change the ramp orders correctly:** Light 15.73 > 7.74 > 5.83 > **4.57**; Dark 15.33 > 8.06 > 6.41 > **4.59**.

**Acceptance:** `--text-disabled` contrast is lower than `--text-muted` in both themes. `--chart-label` ≥4.5:1 on all five surfaces. `--status-disabled-text` ≥4.5:1 on `--status-disabled-soft`. `--nav-indicator` ≥3:1 on `--surface-primary`.

**Scope note:** these are global tokens. Every consumer changes. No other token was touched, and all four are literals in Figma (not aliases), so the primitive ramp is unaffected.

---

## 2. Unbound colours — 🔍 CODE VERIFY, likely 🔧 REPO CHANGE

**Jira:** INSP-792 · **Figma:** ✅ done (1,022 node-level bindings across 8 passes)

Figma had large clusters of raw hex where tokens belong. The equivalent risk in code is any component using a literal colour instead of `var(--…)`.

| Figma cluster | Raw value | Routes to check |
|---|---|---|
| Field screens, all themes | `#000000` text | `/field`, `/field/my-tasks`, `/field/[visitId]`, `/field/[visitId]/travel`, `/field/inspection/[id]`, `/field/drafts`, `/field/establishments`, `/field/visits`, `/field/reports`, `/field/virtual`, `/field/search`, `/field/settings`, `/field/completed`, `/field/account` |
| Planning Calendar / Map / Workload | `#17212e`, `#576370`, `#08634d`, `#b81f1f`, `#ffffff`, `#f6f9fa`, `#e8f0f2` | `/planning/calendar`, `/planning/map`, `/planning/workload` |
| Admin annotation text | `#1a4d8c` | `/admin`, `/admin/regulations`, `/admin/items`, `/admin/packages`, `/admin/violations`, `/admin/workflows`, `/admin/risk`, `/admin/gis` |
| Admin badge labels | `#40454d` | `/admin/notifications`, `/admin/compliance-requests`, `/admin/enforcement-recommendations`, `/admin/audit`, and 3 more |

**Mapping applied in Figma** (each chosen as the token whose *Light* value is closest, so Light rendering is preserved and Dark follows):

`#000000`→`--text-primary` · `#17212e`→`--text-primary` · `#576370`→`--text-muted` · `#08634d`→`--accent-text` · `#b81f1f`→`--status-critical` · `#1a4d8c`→`--status-info-text` · `#ffffff` fill→`--surface-primary` · `#f6f9fa`→`--surface-canvas` · `#e8f0f2`→`--surface-sunken`

**Acceptance:** no literal colour values in component styles for these routes; the existing repo grep gate (see `CLAUDE.md` colour law) returns zero.

**Verify in code:** whether the app already uses tokens here and only Figma was stale. If so, this section closes as verification with no change.

---

## 3. Dark-theme surfaces — 🔍 CODE VERIFY

**Jira:** INSP-792

Several Figma frames had **no background fill**, so dark text fell through to a white ancestor. In code the equivalent is a container with no `background` that inherits the page.

| Figma container | Fix applied | Route |
|---|---|---|
| SCR-FLD-660 screen frame | added `surface-canvas` | `/field/inspection/[id]/submit` |
| `sq-content` | `#f6f9fa` → `--surface-canvas` | `/planning/calendar`, `/planning/map`, `/planning/workload` |
| `panel-header`, calendar day cells, IPAD `Frame` | `#ffffff` → `--surface-primary` | as above |

**Systemic:** 31 `sq-content` nodes page-wide still carried raw `#f6f9fa` at audit time; the three Planning screens are fixed, the rest were out of scope. **Check whether `.sq-content` in `saqeel-components.css` sets a token-backed background** — if it does, this is Figma-only drift.

---

## 4. Clipped controls — ✅ FIGMA DONE, 🔧 REPO CHANGE

**Jira:** INSP-777 (screens, fixed) · INSP-788 (component masters, not fixed)

| Component | Previous pattern | Approved pattern | Route |
|---|---|---|---|
| Filter chip | fixed width, hard clip (`Inspector status: Available` lost 62px) | **hug content**; wrap to a second chip row on overflow; never clip | `/planning/map` |
| Calendar visit chip | 110px label in an 82px box, clipped mid-glyph | label **fills** the chip; existing ellipsis truncation then applies; chip **hugs vertically** (was 38px fixed for 46px of content) | `/planning/calendar` |
| Workload cells | labels 2–4px over their cell | labels **fill** the cell | `/planning/workload` |
| `Button — Retry calculation` | fixed 110px for a 101px label | hug | `/planning/workload` |

**Still broken in Figma, needs fixing there first — ⛔ do not implement from current masters:** `filter-chip` (72:6736) and `seg-opt` clip their own labels in the component library; `Field.label` clips and pushes the **required asterisk entirely outside its box**; `Input` (9:66) ships the literal string `"Placeholder text"` in all five states. **INSP-788.**

**Acceptance:** no control truncates its own label at any supported width; required-field indicators always render.

---

## 5. Responsive tables — ⛔ DECISION, then 🔧 REPO CHANGE

**Jira:** INSP-776 · **Figma:** ❌ not fixed, deliberately

The 1280 column model was carried into 1024 and 768 unchanged. Measured overflow: **324px** on `/visits` @768, 5–30px across nine columns on `/planning` @1024 — including the **column headers themselves**. Present at 1280 too (12–20px), and the master `Table cell` component clips by 8px, so every table inherits it.

**Blocked on:** which columns are essential at 1024 and 768 for `/visits` and `/planning`. That is a product decision about what a planner must see; I will not invent it.

**Required once decided:** one canonical responsive table pattern — essential columns retained, secondary columns collapsed into an expandable row or detail view, remainder in a horizontal-scroll container. Fix `Table cell` at component level **first**, re-measure at 1280, then apply the breakpoint rule.

**Do not:** reduce font size to fit, or drop a column without a disclosure route to the same data. One clipped cell reads `"Not source-backed"` — a provenance state a reviewer needs.

---

## 6. Destructive confirmation dialog — ⛔ FIGMA FIX REQUIRED

**Jira:** INSP-785 (Stop-Ship)

`dialog` (15:30) holds 519px of body text in a 360px clipping frame at fixed 86px height. It renders:

> **Confirm reassignment**
> This visit will move to the selected inspector. This cannot b

The full string ends *"This cannot be undone once acknowledged."* **A confirmation dialog is truncating the sentence that justifies asking for confirmation**, and the line simply stops, so nothing signals the omission.

**Required:** body text fills the dialog width with height auto-resize; dialog hugs vertically. Never shorten the warning or shrink the type. Fix the component, then re-check the six OVERLAY frames that instantiate it.

**Applies to every confirmation in the product** — reassignment, publication, revocation, enforcement decisions.

---

## 7. Canonical state component — ⛔ FIGMA + CONTENT FIX REQUIRED

**Jira:** INSP-784

`saqeel-state--rls-denied` (179:12964) renders **"Ask a security to widen your data scope."** — 432px of text in a 344px clipping box deletes the word *administrator*. It also says **"Row-level security"**, a Postgres mechanism, as product copy.

Its own sibling `saqeel-state--unauthorized` already does it correctly: *"You do not have access to this destination — Ask a security administrator to grant the required role."*

**Required:** unclip; rewrite to the sibling's pattern; drop the database term. Final wording is a content decision, the two structural fixes are not.

**Adopt as canonical otherwise:** the `states` frame (14:119) carries nine well-written states — error, conflict, stale, provider-unavailable, degraded, not-configured, loading, empty, unauthorized. Severity is carried by border **and** words, never colour alone, and "Not configured" explicitly says *"No value is assumed."* This is the pattern every screen state should follow.

---

## 8. Typography binding — 🔧 REPO CHANGE (low risk)

**Jira:** INSP-783

563 text nodes across 17 inspector component sets (SignatureBlock, SignatureParty, SignaturePad, ConflictList, AttendeeRow, PermissionState, SyncQueueRow, OfflineNotice…) are set in **Inter**, which is not in the ramp. Their **sizes already match** the ramp exactly (17/15/14/13/12/11.5), so this is a binding exercise, not a redesign.

Ramp: `t-display` 28 · `t-page-title` 22 · `t-section` 17 · `t-heading` 14 · `t-body-lg` 15 · `t-body` 14 · `t-compact` 13 · `t-label` 12 · `t-meta` 12 · `t-caption` 11.5 · `t-metric` 30 · `t-mono` 12.5 — each with a paired `-ar` Arabic twin.

**Repo check:** confirm the field/evidence components use IBM Plex Sans / Noto Sans Arabic, not a default sans. **Ramp floor is 11.5px** — any 9px, 10px or 10.5px in code is outside the declared system (2,797 such nodes existed on Admin Shell in Figma).

---

## 9. Content removals — 🔧 REPO CHANGE

**Jira:** INSP-754, INSP-755

| Remove | Where | Note |
|---|---|---|
| `"Administration routes are guarded by the admin role family (security_admin / compliance_admin / risk_owner / form_admin / workflow_admin) in shell-navigation.ts. A Planner reaches the destination and is refused at the boundary."` | 24 nodes across 6 RBAC refusal panels × 4 locale/theme variants | source path + code identifiers + system-perspective narration |
| `"Region boundaries: GADM v4.1 · lib/ksa-regions.ts · projected positions…"` | EN and AR | source path in product copy |
| `"Read from the real drafts IndexedDB store (mim-field-v1, offline.ts)…"` | EN and AR | source path in product copy |
| `"2 components in R2"` | SCR-ADM-250 | internal release id — ✅ already removed in Figma |
| `"Placeholder text"` | `Input` master, all 5 states + 8 inherited instances | ⛔ fix the master or it returns |
| ~20 placeholder strings | Incident Report / Establishment build sections | "Narrative placeholder text.", "Reporter name placeholder" |

**A refusal screen owes the user:** what happened, why, what to do next. Whether to name a role is a product decision; **the file path and code identifiers are not** — they go regardless.

**⚠️ Do not bulk-delete by layer name.** I nearly removed 38 chips as "annotation chrome" based on layer names (`badge — real status`). Reading them rendered showed they were product UI — a stepper component, the Toast Info badge, "Takes effect immediately on save" on Risk Settings, eight "Proven rule" row labels. Layers have been renamed to `badge — governance status` / `badge — scope summary` to stop this recurring. **Read rendered context before deleting.**

---

## 10. Arabic / RTL — 🔧 REPO CHANGE

**Jira:** INSP-782

`ad-head__title` clips the Arabic GIS title by **23px** at compact and **75px** at 720 (`/admin/gis`). English fits; the header was sized on Latin metrics. A `control` on `/admin/bulk-violations` clips its option label by 25px.

**Required:** wrap to a second line rather than clip. ⛔ Only use a shortened Arabic title if a governed short form already exists — do not invent one.

**Also:** the Arabic type ramp is complete (13 of 14 styles have `-ar` twins) — a genuine strength. Arabic runs longer than English; any fixed-width container sized on English will fail in Arabic.

---

## 11. Unresolved decisions — ⛔ blocking

| # | Decision | Blocks |
|---|---|---|
| 1 | Which columns are essential at 1024 / 768 for `/visits` and `/planning` | INSP-776, the only remaining Stop-Ship |
| 2 | Final wording for the scope-refusal state | INSP-784 |
| 3 | Governed short form for the Arabic GIS title, if one exists | INSP-782 |
| 4 | Required-field convention: asterisk, explicit "Required", or mark optional | INSP-788 |
| 5 | Status class for **Returned**, **Expired**, **Limited record** badges | applied as `warning` / `disabled` / `info`; one-line override |
| 6 | `map-control-surface` (96% alpha) vs `surface-primary` for floating map chrome | cosmetic |
| 7 | **Which frames are canonical** — the parallel audit created 44+ `AUDIT REMEDIATED — SUPERVISOR` duplicates | **everything below** |

**Decision 7 is the significant one.** A parallel audit is duplicating screens rather than fixing them. During this audit the SCREENS page grew from 36 to 86 top-level children and 38,736 → 47,366 text nodes. It has already produced a Planning Calendar copy that **reintroduces a defect fixed hours earlier**. Fixes do not propagate to copies, and copies re-seed fixed defects. **Implementing from the wrong frame is now a live risk.**

---

## 12. What this delta does not cover

Stated so nobody reads absence as approval:

- **Accessibility beyond contrast.** Focus order, keyboard operation, target size, screen-reader naming, reflow and zoom are **not assessable from Figma**. No WCAG conformance claim is made for the product.
- **Semi-transparent tokens** (`surface-overlay`, `map-panel`, `ad-state-*` at 14–99% alpha) were excluded from contrast analysis — effective contrast depends on what sits beneath at runtime. **Must be checked in code.**
- **Prototype flows and interaction wiring** — not audited.
- **Five-second clarity, mental-model matrix, information-hierarchy register** — require per-screen human review, not measurement; not yet produced.
- **Pages not scanned:** Getting Started, ANNOTATIONS, AR-strings resource (deliberately untouched).

---

## Appendix — Figma remediation log

| Pass | Change | Nodes | Verified |
|---|---|---|---|
| 1 | Chip/cell clipping hug + fill | 115 | 7 groups → 0, rendered |
| 2 | Black-on-dark text bound | 115 | 149 → 34 failures, rendered |
| 3 | Light/AR sibling binding | 144 | no regression, rendered |
| 4 | Surface containers + calendar theming | 278 | 34 → 7, rendered |
| 5 | Planning Map + Workload theming | 282 | 7 → 7 (no regression), rendered |
| 6 | Token re-values | 4 tokens / 8 mode values | SCREENS 7 → 2; Admin 29 → 29 |
| 7 | Admin raw text bound | 58 | 29 → 0, rendered |
| 8 | Badge labels to status classes | 26 text + 26 bg | 0 failures, pairs 4.51–7.39:1 |
| 9 | R2 chips removed, 29 layers renamed | 2 removed, 29 renamed | rendered before/after |

*Passes 7 and 8 overlap on the same 26 badge labels — bound, then re-assigned — so these are node-level changes, not distinct nodes.*

**Contrast position:** — SCREENS — 149 → 2 · Admin Shell 29 → 0. The remaining 2 are in the parallel audit's duplicate frames, not in any frame this audit owns.

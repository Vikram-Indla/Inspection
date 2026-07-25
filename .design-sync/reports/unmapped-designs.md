# Unmapped and Ambiguous Designs

Full map: `mapping/design-to-code-map.csv`/`.json`, 98 rows. Cross-referenced
against the frozen `product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv`
(46 governed rows), then **all 8 originally-ambiguous pages were
content-read and resolved on 2026-07-24** (previously left unmapped due to
narrower session scope; resolved after Codex's independent review flagged
them as needing exactly this).

## Resolution of the 8 originally-ambiguous pages

| Page | Resolution | Evidence |
|---|---|---|
| `SAQEEL Delegation` | **NO CODE MATCH** — genuine gap | Content-read: full inspector-absence delegation/reassignment UI. `grep -ri delegat apps/web/src` → nothing. Confirmed by the design team's own `SAQEEL Web-Index.dc.html`: "⊘ not yet in repo (confirmed requirement)". |
| `SAQEEL Establishment Violations` | **CLOSE MATCH** → `/admin/bulk-violations` | File exists (`page.tsx`, `BulkViolationForm.tsx`, `actions.ts`, `loading.tsx`), already covered by governed `WA-DES-004`. **Note:** the design file's own embedded comment/`data-route` claims `/establishment-management/violations` — that's stale/wrong; `Web-Index` confirms `/admin/bulk-violations` is correct. |
| `SAQEEL Item Execution` | **CLOSE MATCH** → `/admin/items` | File exists, confirmed by both direct grep and `Web-Index`. |
| `SAQEEL Report Deltas` | **NO CODE MATCH** — genuine gap | grep → nothing. `Web-Index`: "⊘ unconfirmed — no matching folder found". |
| `SAQEEL Report Inventory` | **DESIGN ONLY**, reclassified | Content-read: this is not a screen — it's the design team's own "Figma → Requirements" gap-tracking document (implemented/missing/partial audit table). Same category as `SAQEEL Design System`/`Canvas`. |
| `SAQEEL Report Package Foundation` | **CLOSE MATCH** → `/admin/packages` | File exists, confirmed by grep and `Web-Index`. |
| `SAQEEL Web-Index` | **DESIGN ONLY**, reclassified | This page turned out to be extremely valuable — it's a design-maintained self-index of all ~98 business-web/admin screens with route/status claims per page. Used this pass to resolve every other row in this table. Not a product screen itself. |
| `SAQEEL iPad Dashboard` | **Still AMBIGUOUS** — genuinely unresolved, not just by us | Even the design team's own `Web-Index` marks it misc/reference and says "⊘ reconcile vs. SAQEEL PWA-Inspector iPad" — the ambiguity originates in the design source itself. Do not map until that's resolved upstream. |

## Stale governed entry — RESOLVED

`WA-DES-025 — SAQEEL Executive Overview` is **not missing**. It's a live
top-level page — just a plain `.html` file, not `.dc.html`, which is why
both this session's original scan and Codex's independent review missed it.
See `reports/inventory-reconciliation.md` for the full resolution (also
explains the 97-vs-98 discrepancy).

## Confirmed duplicate

`SAQEEL Admin Lookups copy.dc.html` — the design team's own `Web-Index`
confirms this explicitly: "Duplicate file — candidate for cleanup", "⊘
duplicate of Admin Lookups".

## Confidence correction (per Codex's independent review)

The 38 rows copied from the governed `DESIGN_ROUTE_MAP.csv` without
content-reading the live Claude Design page were downgraded from
`mapping_confidence: high` to `medium (repository-candidate: file path
verified in governed authority; NOT content-read against live Claude Design
page)`. The route/file evidence itself was not wrong — the confidence label
overstated what had actually been verified. See
`mapping/design-to-code-map.csv` for the corrected values.

## Batch upgrade pass — 2026-07-24 (post-notification)

Cross-referenced every remaining `repository-candidate` row against
`SAQEEL Web-Index.dc.html`'s independent route claims (captured earlier this
session) plus direct `find`/`grep` against the real filesystem — three
independent sources per row where all three exist. 34 rows upgraded to
`high (governed authority + design-team Web-Index + live file existence —
three-source agreement)`; 1 row (`SAQEEL Feedback`) confirmed `high` on
absence (both sources agree no code exists); 2 rows (`Admin SENAI Data`,
`Admin Virtual Premium`) stay `medium` — both sources flag scope
uncertainty, consistently, not contradicted.

**Three real conflicts surfaced by this pass — `Web-Index` is not
infallible either, don't trust any single design-side source blindly:**

| Page | Finding |
|---|---|
| `SAQEEL Admin Form Builder` | Neither `Web-Index`'s claimed `/admin/templates` nor `DESIGN_ROUTE_MAP`'s claimed `/admin/packages/:id/designer` exists (both grep-verified absent). Reclassified `NO CODE MATCH`. |
| `SAQEEL Admin Lookups` | Both `/admin/localization` (`DESIGN_ROUTE_MAP`'s claim) and `/admin/planning/lookups` (`Web-Index`'s claim) exist as real, distinct pages — genuine ambiguity, not an error. Reclassified `MULTIPLE POSSIBLE MATCHES`. Content not compared to determine which the design page actually matches. |
| `SAQEEL Admin Detail` | `DESIGN_ROUTE_MAP`'s 5 recorded files all confirmed to exist; `Web-Index`'s "⊘ unconfirmed" claim is itself stale/wrong. Upgraded to `CLOSE MATCH / high`. |

## `SAQEEL Admin` vs `SAQEEL Control Panel` — RESOLVED (as a confirmed conflict, not a false collision) — 2026-07-24

Content-read both pages directly (previous notice had only inferred the
collision from route strings, not verified it against content — corrected
per Codex's second re-review).

- `SAQEEL Admin.dc.html` is itself a comprehensive SPA-style admin shell:
  its own "ADMIN"-branded sidebar has 14 internal `onClick`-switched views
  (Compliance Library, Packages & Surveys, Inspection Items, Enforcement
  Library, Risk Configuration, Workflow Configuration, Notifications,
  Localization, Devices, GIS Configuration, Integrations, Users & Roles,
  Audit Trail, plus an overview). Reads as *the* intended general `/admin`
  landing.
- `SAQEEL Control Panel.dc.html` is a broader card-grid landing (5 groups:
  People & access, Inspection rules & forms, Scoring & intelligence,
  Operations setup, Records & oversight) whose cards link **out** to
  `Admin.dc.html`, `Admin Detail.dc.html`, `Risk.dc.html`, and others.
- **The conflict is real and originates in the design source itself:**
  Control Panel's own sidebar links to `Admin.dc.html` but labels that link
  "Inspection Rules" — which contradicts what `Admin.dc.html` actually
  contains (far more than inspection rules).
- **The previously-inherited governed mapping was also wrong on the
  merits:** `DESIGN_ROUTE_MAP.csv` claimed Control Panel → `/admin/operations`.
  The real `apps/web/src/app/(app)/admin/operations/page.tsx` is a narrow
  MVP3 "Platform operations and resilience" page (feature flags, error
  queue, integration endpoints) — nothing like Control Panel's broad
  config-landing content. That route claim is semantically wrong, not just
  unconfirmed.

**Disposition — RESOLVED by explicit sponsor decision, 2026-07-24:**
`SAQEEL Admin.dc.html` is designated canonical for `/admin`. Decisive
evidence: `/admin/page.tsx`'s own header comment identifies it as "CD-004 /
SCR-ADM-001 — Approval & Configuration home (Configuration Evidence
Spine)... Read-only control-plane gateway," checking 6 governed sources via
`buildShellNavigation(roles).find(g => g.id === "control")` — this matches
`Admin.dc.html`'s own internal "Approval & Configuration" overview item
(its default view under "Control plane," ahead of "Configuration" and
"Platform" groups) far more precisely than `Control Panel.dc.html`'s
external-link card-grid launcher. `SAQEEL Control Panel` is now `DESIGN
ONLY`, not mapped to any route — retained as an alternate exploration; its
individual card links (Users Roles, Risk, AI Studio, etc.) remain
independently mapped in their own rows, unaffected. See
`mapping/design-to-code-map.csv` for both rows' updated evidence.

## Confidence schema correction — 2026-07-24 (Codex second re-review)

Every mapping row now carries two distinct fields instead of one
conflated `mapping_confidence`:

- **`code_candidate_confidence`** — strength of the route/file-existence
  evidence (governed `DESIGN_ROUTE_MAP.csv` + `Web-Index` + filesystem
  grep, where available). This can legitimately be `high` from
  cross-referencing alone.
- **`design_content_verified`** — whether the live Claude Design page was
  actually read and semantically compared this session. Only **13 of 98**
  rows have this as `yes` (the two pilots, the 8 originally-ambiguous
  pages, Executive Overview, and the Admin/Control Panel conflict pair).
  The other 85 are `no — route/file existence only`.
- **`mapping_confidence`** (the overall/headline field) is now capped at
  `medium` unless `design_content_verified: yes` — a strong route
  candidate is no longer allowed to read as `high` on its own. This
  directly fixes the confidence-conflation problem flagged in the second
  re-review: 36 rows that previously said `high (... three-source
  agreement)` while their own evidence text said "not re-verified against
  current MCP content-hash" were downgraded to `medium`.

**Final exact counts** (`mapping_confidence`): 9 `high`, 44 `medium`, 44
`n/a` (out-of-scope PWA/non-screen), 1 `low`. **`design_content_verified`**:
13 `yes`, 85 `no`. Total 98 rows, both counts verified via direct `python3`
tally against the live JSON (not asserted).

## Out-of-scope PWA/Field pages (42)

37 `SAQEEL PWA-Field *` + 4 `SAQEEL PWA-Inspector *` + `SAQEEL PWA-Index`.
Read-only reference only, per this session's explicit scope reset. Not
mapped, not content-read beyond the earlier Field Login pilot (deferred,
preserved separately in `consent/field-login/`).

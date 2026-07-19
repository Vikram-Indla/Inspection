# DESIGN-OPS-004 — Priority Sequence (BATCH-DESIGN-001 lead consolidation)

Consolidates DESIGN-OPS-001 (code/runtime truth), DESIGN-OPS-002 (existing
evidence inventory), and DESIGN-OPS-003 (screen-state gap queue). No design
acceptance is granted here; this is a sequencing recommendation only.

## Headline finding

**All 8 formal design-acceptance evidence bundles (`EV-DESIGN-001..008` in
`VISUAL_EVIDENCE_REGISTER.csv`, covering all 38 governed screens / all 38
`DSG-*` outcomes) are `review_status=pending` with a blank `artifact_path` —
none has been captured.** Read naively, this looks like a blank-slate,
38-screen screenshot campaign.

It is not. DESIGN-OPS-002 found **47 present-and-located runtime/build
screenshots** already in git for several of these exact screens (CD-004,
CD-021, CD-023, CD-026, CD-027, plus the dashboard/KPI-seed captures), and a
further **39 present-but-unregistered** screenshots (CD-005/006, CD-007,
CD-008/009 v1+v2, CD-010/011, CD-025, CD-022/single-v2) that were never
folded into the design-acceptance register at all. The real first move is
**auditing how much of each screen's required evidence dimension list
(states × locales × themes × viewports) the existing captures already
satisfy**, and shooting only the delta — not starting from zero.

## Screens with real existing evidence vs. their gap-queue entry

| Screen | Gap-queue rank | Dependency | Existing evidence (from DESIGN-OPS-002) | Coverage read |
|---|---|---|---|---|
| SCR-ADM-001 (P00, DSG-001) | 1 | none | CD004-EV-003/005 — EN/AR, dark/light, 1024/1440, 18/18 PASS runtime | Strong — likely closest to a full golden set already |
| SCR-WEB-130 (P01, DSG-018, Immediate) | 18 | none | CD023-LIVE-REMEDIATION-\* — EN/AR × dark/light × desktop/narrow (8 frames) | Strong — matches most of the required state/locale/theme dims |
| SCR-WEB-200 (P03, DSG-021, Visit workspace) | 21 | none | CD026-EV-002..005 — primary, eligibility-preview, AR-RTL, narrow-412 | Moderate — populated + RTL + narrow covered; loading/empty/error states likely still missing |
| SCR-WEB-210 (P03, DSG-022, Visit detail) | 22 | none | CD027-EV-003/004 — ribbon primary + narrow-412 | Partial — only 2 frames; theme/locale variants likely missing |
| SCR-WEB-500 (P12, DSG-027, Operations) | 44 | none (base row) | DASH-EV-003..006, KPI-SEED-EV-002/003 — EN/AR, dark/light, live-map fixture | Moderate — base dashboard covered; the 5 composed `DSG-CMD-00x` rows (live map, inspector card, regional map, highlights) still need their own frames |
| SCR-ADM-010/011 (P00, DSG-002/003, Regulations) | 2, 3 | none | 4 unregistered CD-005/006 PNGs (detail-blocked, detail-lineage, register EN/AR) | Partial — no dark theme or loading/empty states captured yet |
| SCR-ADM-020 (P00, DSG-004, Items) | 4 | none | 4 unregistered CD-007 PNGs (EN/AR, dark/light) | Partial — desktop only, no RTL-with-dark combo confirmed |
| SCR-ADM-030/031 (P00, DSG-005/006, Packages) | 5, 6 | none | 11 unregistered CD-008/009 v1+v2 PNGs, incl. a 390px mobile frame in v2 | Moderate — v1 superseded by v2 on disk; v2 not yet in any registry |
| SCR-ADM-040/041 (P00, DSG-007/008, Violations/Penalty) | 7, 8 | none | 4 unregistered CD-010/011 PNGs | Partial — catalogue + writer-create + penalty EN/AR only |
| SCR-WEB-110 (P01, DSG-016, Bulk criteria) | 16 | none | CD021-EVIDENCE-primary/ar-rtl/narrow | Partial — EN/AR + narrow, but only light theme apparent |

All other gap-queue rows (SCR-ADM-050/051/060/070/080/090, SCR-WEB-100/120/150,
all SCR-IPAD-\*, all SCR-VIR-\*, SCR-WEB-300/310/320) have **no located
evidence at all** per DESIGN-OPS-002 — genuinely blank slate for those.

## Recommended sequence

**Tier 0 — housekeeping, unblocks nothing but is a real compliance gap
(from DESIGN-OPS-002's findings):**
- Resolve the `product-contract/evidence/screens/README.md` vs. reality
  conflict: 86 PNGs live in git when the documented policy says they belong
  only under `INSPECTION_DOCS_ROOT`. `repo-cleanup/documentation_inventory.csv`
  already has a `MOVE` disposition for 77 of them; 9 postdate that snapshot
  and need the same disposition applied.
- Resolve the 3 `EV-SHELL-00x` / `SHELL-EV-00x` dual-ID, path-mismatch rows
  (same physical file registered twice under different ID schemes, and the
  register's `INSPECTION_DOCS_ROOT` path doesn't match where the file
  actually lives in-git).
- Neither of these blocks screen work below; both are cheap and reduce
  confusion for whoever captures evidence next.

**Tier 1 — cross-map and fill the delta only (evidence-rich, zero
dependency):** SCR-ADM-001, SCR-WEB-130, SCR-WEB-200, SCR-WEB-210,
SCR-WEB-500 (base row). Fastest path to a real design-acceptance decision
because the screens are built, evidence-rich, and unblocked — the work is
auditing existing frames against the required dimension list and shooting
only what's missing, not a fresh campaign.

**Tier 2 — partial evidence, zero dependency:** SCR-ADM-010, SCR-ADM-011,
SCR-ADM-020, SCR-ADM-030, SCR-ADM-031, SCR-ADM-040, SCR-ADM-041,
SCR-WEB-110. Same audit-then-fill-delta approach, less existing coverage.

**Tier 3 — blank slate, zero dependency:** the remaining `none`-dependency
rows in DESIGN-OPS-003 (SCR-ADM-050/051/060/070/080/090; SCR-WEB-100/120/150;
SCR-WEB-300/310/320; all SCR-IPAD-\*; SCR-VIR-700). These need full capture
campaigns with no existing shortcut. Sequence within this tier by journey
order (P00 → P12) as DESIGN-OPS-003 already establishes.

**Tier 4 — do not start; real dependency exists (from DESIGN-OPS-003):**
SCR-WEB-140 (`correction_required` per CD-024 R1 — implementation itself is
blocked, not just evidence); the SCR-WEB-400 composed rows blocked on the
Senaei feed (SL-4/SL-5), the SL-3 CR-license relation, the SL-8 viewer
decision, and the BR-010 Phase-2 AI deferral; the SCR-WEB-500 composed rows
blocked on the SL-2 colour-banding decision. These need their named
decision or correction to land first, per the batch's own stop-boundary
rule — this consolidation does not attempt to resolve any of them.

## Cross-cutting truth constraints from DESIGN-OPS-001 (apply to any future capture)

- **Map rendering**: any evidence involving a live/inspector map (SCR-ADM-070
  GIS settings, SCR-WEB-200 visit-workspace map, SCR-IPAD-620 journey map,
  SCR-WEB-500 live/regional map) must describe the map as **Mapbox GL JS**
  (confirmed by reading `LiveMapInner.tsx`), not "Leaflet + CARTO tiles" as a
  stale comment in `map.ts` claims. Both sources agree inspector positions
  are projected, not live GPS — that part of any future evidence caption is
  fine as-is.
- **Provider-pending states must be captured as pending, not live.** Per
  DESIGN-OPS-001's provider truth table: live-video (SCR-VIR-720) is a
  staging stub off by default; SMS/email/push (any notification-state frame)
  are `not_configured` absent real credentials; AI suggestions/OCR
  (SCR-WEB-400's `DSG-CMD-019` AI Risk Explanation, any AI-summary frame) are
  fail-closed/advisory-only; e-signature (any acknowledgement frame) uses
  DocuSign as an explicit short-term substitute for the real KSA PKI
  provider, not the final provider. Evidence capture that shows these as
  fully live would misrepresent runtime truth.
- Virtual-room OTP (SCR-VIR-710) is a partial exception: verification itself
  is genuinely live via `vp_request_otp`/`vp_verify_otp` RPCs, but SMS
  transmission still runs through a DEV provider pending Unifonic — a future
  OTP evidence frame should caption the RPC as live and the SMS leg as
  DEV-provider, not fully production-live.

## What this consolidation did NOT do

- Did not grant, upgrade, or self-approve any design-acceptance status —
  `DESIGN_ACCEPTANCE_MATRIX.csv` is unchanged.
- Did not capture any new screenshot or create any new design frame.
- Did not resolve the Tier 4 blocking decisions — those remain for the
  sponsor/Codex per their existing hold reasons.
- Did not modify any application code, config, or migration.

## Stop-condition check (per BATCH-DESIGN-001)

No stop condition was triggered for the batch as a whole. One authority
conflict was found (map.ts comment vs. LiveMapInner.tsx) and is recorded
above and in DESIGN-OPS-001/its COMPLETE event as a finding for the lead,
not a route/runtime-truth gap that blocks this consolidation — the
runtime-truth *conclusion* (Mapbox, projected not live GPS) is not in
dispute between the two code sources, only a stale comment's phrasing is.

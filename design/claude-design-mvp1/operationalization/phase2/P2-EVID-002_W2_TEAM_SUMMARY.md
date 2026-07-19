# P2-EVID-002 — Wave 2 Team Summary (BATCH-PHASE2-EVIDENCE-002)

Status: **Complete. 42 frames captured across 7 of 8 assigned screens; 1
screen (SCR-ADM-031) BLOCKED for a real routing reason, not attempted.**

## Preflight (P2-EVID-002 preflight doc)

Read all 8 route files in full and checked the actual SQL definition of
every RPC found (not just its name). `admin_configuration_audit(text,uuid)`
is declared `stable` in `supabase/migrations/20260715200000_cd006_011_backend_completion.sql:516`
and is a pure `select ... from audit_events` — a real read-only guarantee,
not an assumption. All 7 admin/web routes cleared as SAFE; `SCR-ADM-031`
(Package & Form Designer) has **no literal URL** — it is a client-side view
rendered inside `/admin/packages` after selecting a package, which this
wave's capture rule (navigation/locale/theme only, no interaction) does not
authorize reaching.

**Route-catalogue discrepancy found and flagged, not fixed here:**
`screen_route_catalogue.csv` lists `/admin/packages/:id/designer` and
`/admin/penalties` as real routes. Neither exists literally in the running
app. Penalty mapping's actual route (`/admin/violations?mode=penalty`) was
discovered directly in the route file's own code comment and used for a
successful capture; the designer has no such fallback URL.

## Capture (all 3 worker packets)

| Packet | Screens | Frames captured | Frames blocked |
|---|---|---|---|
| P2-EVID-002.A | SCR-ADM-010, SCR-ADM-011, SCR-ADM-020 | 18 | 0 |
| P2-EVID-002.B | SCR-ADM-030, SCR-ADM-031, SCR-ADM-040, SCR-ADM-041 | 18 | 1 (SCR-ADM-031) |
| P2-EVID-002.C | SCR-WEB-110 | 6 | 0 |
| **Total** | **8 screens** | **42** | **1** |

All 42 frames use the profiles A-F (en/ar × light/dark × 1440x1024/1024x768)
per this wave's assignment (no G/H wallboard profiles this time). All 42
sha256 hashes independently verified pairwise-distinct, and every single
frame's rendered `data-theme` attribute was checked against its intended
profile before counting it as captured (recorded per-row in the manifest).

`SCR-ADM-011`'s detail-view content used a real regulation ID
(`a0000000-0000-4000-8000-000000000001`, code `SBC-801`) sourced via a
direct read-only PostgREST `GET` on the `regulations` table — no mutating
page or selection flow was navigated to find it.

Evidence root: `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/phase2-tier1/20260718T204316Z/`

Held from Wave 1, unchanged: `SCR-WEB-200`, `SCR-WEB-500`.

## What remains

- `SCR-ADM-031`: needs either a direct capture-mode URL authored for the
  designer (a product/design decision, not something to invent here) or a
  sponsor decision to accept a documented gap for this evidence wave.
- Wave 3 (`W3 Admin blank-slate`: SCR-ADM-050/051/060/070/080/090) per
  `PHASE2_FULL_38_CAPTURE_WAVES_20260718.md` is not yet issued as a
  claimable packet.

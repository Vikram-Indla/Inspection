# ROUTE_RUNTIME_TRUTH_MEMO_CD-004_R2.md
Verified 2026-07-14 (design lane; no repo writes outside this pack).

## Current /admin reads (the ONLY current facts)
One Promise.all resolving six per-source result objects:
1. engine_settings: engine, version_label, updated_at — engine keys are configuration DOMAINS (risk, gis, sla, evidence, otp, field), not ENG-* IDs.
2. regulations: exact head count only. No updated_at column is inspected on this route.
3. inspection_items: exact head count.
4. package_versions where status=published: exact head count.
5. violation_codes: exact head count.
6. audit_events: exact head count.

Defect (corrected diagnosis, replaces R1's "Promise.all fate-sharing"): each Supabase call resolves a result object; the route fails to inspect each result's error/null/count independently, renders count ?? 0, and shows a static "live database" success lozenge. Fix = explicit per-source result modelling (verified-with-count / verified-zero / unavailable).

## Lifecycle truth (exact words allowed in frames)
- package_versions: draft/published behavior, distinct-approver constraint, immutability after publication. NOT proven: four canonical transitions; any richer arrow is HANDOFF_BLOCKED.
- regulations: status field exposed; approver workflow NOT proven.
- config_versions: shared config_status maker-checker model where used.
- engine_settings: direct audited update; no per-setting draft/approval cycle; updated_at is provenance only.
- /admin home: read-only; no validate/approve/publish action.

## Authorization truth (P0-03)
- Configuration-read RLS policies permit broad authenticated reads (confirmed by inspection).
- Middleware checks authentication only; tests intentionally permit an Inspector to reach /admin.
- Route authorization and data RLS are separate layers; the Admin-family route guard DOES NOT EXIST.
- R1's "RLS denies data today" is withdrawn. The unauthorized state is designed; enforcement is HANDOFF_BLOCKED pending an authorized guard/policy decision. No UI-only guard is presented as enforcement.

## Removed from R1 frames (P0-01)
regulations "last updated" date · "ENG-05 · v2026.07.11" as an engine key · workflow "verified / versioned settings" · "latest SAQ-PKG-04 · v3" · "1 draft awaiting a distinct approver" · "draft → approve → publish → lock".

## Proposed additional reads (all HANDOFF_BLOCKED — IMPLEMENTATION/AUTHORIZATION REQUIRED)
See DATA_TRUTH_LEDGER rows marked proposed: per-family last-mutation provenance, package latest-version label, draft-queue count. Each names table/columns/filter/RLS/error contract/test/audit implications; none appears in a frame.

## Fonts / reproducibility (P2)
Capture fonts: Google-hosted retired input font, IBM Plex Sans Arabic, retired mono font. Offline fallback documented per image in EVIDENCE_MANIFEST: system-ui sans + monospace; layout tolerances noted.

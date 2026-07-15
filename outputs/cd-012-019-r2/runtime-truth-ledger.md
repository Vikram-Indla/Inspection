# RUNTIME TRUTH LEDGER + DEPENDENCY REGISTER — CD-012→019 R2

Classes: STATED_BY_CORRECTION (render as present truth, cite before build) · COMPUTED_FROM_<SOURCE>
(arithmetic/derivation over shown inputs, named in-frame) · HANDOFF_BLOCKED_<SEAM> / 
NEEDS_APPROVED_CONTRACT / BLOCKED_BY_DECISION (never rendered as live).

## Present truth (rendered as working capability)
- CD-012: library read; propose/save/approvePublish; SoD; immutability.
- CD-013: payload load/save; validation failure list; submitted/published read-only.
- CD-014: engine_settings read; direct save; weights-sum validation; RLS deny path.
- CD-015: coordinates read; radius edit via updateGeofenceRadius; input validation; RLS deny.
- CD-017: role-holdings read (RLS-scoped).
- CD-018: load/save/mark-reviewed/add-key/sync/history/restore-as-draft; RLS deny.
- CD-019: filtered, paginated event read; before/after JSON; RLS scope.

## Computed (named in-frame)
- CD-013 transition structure = COMPUTED_FROM_DRAFT_PAYLOAD (rendering, not a validator).
- CD-014 "Why this factory?" = COMPUTED_FROM_ENGINE_SETTINGS + factory record (full arithmetic shown; gaps scored 0 and shown).
- CD-017 explainer conclusion from holdings only — explicitly non-conclusive without policy citations.

## Blocked / contract-needed register (owner question per seam)
| Seam | Screens | Question to resolve |
|---|---|---|
| HANDOFF_BLOCKED_REPOSITORY_DISCOVERY | ALL | open + cite every symbol; record branch/commit |
| HANDOFF_BLOCKED_FABLE_LEDGER | ALL | filter 493/478 rows per screen; map each |
| NEEDS_APPROVED_CONTRACT canvas/graph/replay | CD-013 | canvas↔payload spec; named algorithm; sim engine + fixtures + persistence + audit |
| HANDOFF_BLOCKED_SLA_CALENDAR | CD-013/016 | DEC-003/007 work-calendar decision |
| NEEDS_APPROVED_CONTRACT risk approval workflow | CD-014 | whether live-model changes get a draft/review step |
| HANDOFF_BLOCKED_TILE_PROVIDER / geocoder / KSA boundary / evidence sync | CD-015 | provider adapters + authoritative boundary source |
| HANDOFF_BLOCKED_ROUTE + rule schema + recipient resolution + providers + outbox→delivery + dedup + RLS/audit/failures | CD-016 | the eight prerequisites listed on the screen |
| NEEDS_APPROVED_CONTRACT permission-change workflow; HANDOFF_BLOCKED_RLS_CITATION; BLOCKED_BY_DECISION fallback authority | CD-017 | change workflow; policy citations; fallback decision |
| (none new) | CD-018 | — priority BUILDABLE_NOW slice |
| NEEDS_APPROVED_CONTRACT correlation read model; BLOCKED_BY_DECISION privacy/retention (reveal/export) | CD-019 | read model; privacy + retention + audit contracts |

## R1 → R2 corrections applied
Removed: CD-014 invented maker-checker lifecycle; CD-016 functioning rule studio (live test/activate/pause/counts/providers); CD-017 enabled matrix editor + submit/approve + conclusive simulator; CD-019 fake event/correlation totals, masked-reveal action, export; CD-013 active replay/canvas as tools; generic KPI strips; raw seam-ID flooding in primary tables. Added: plain-language "Not available yet" boundaries with one seam id; fixture notes; real CD-018 action set + orphaned/sync-error/scan-failure states; CD-019 pagination + no-totals note; radius editor with real validation + RLS failure.
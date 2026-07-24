# SAQEEL Orchestration Status

Mandatory session bootstrap:
`product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`.

Generated control view for `BATCH-WEB-ADMIN-ORCHESTRATION-001`. Canonical
requirements, gate files, immutable events and screen ledgers remain authoritative.

## Access and onboarding

| Actor | Repository | Claude Design | Browser | Current role | Status |
|---|---|---|---|---|---|
| Codex | Verified canonical repo | Verified project read | Verified | Orchestrator and final reviewer | Active |
| Claude Code | Verified | Live native project read verified against project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` | Desktop session verified | M4 inventory plus M3 sponsor packetization | Running; no code lease |
| Claude Design | Not a product-code worker | Live project and history verified | Chrome | Design authority | Awaiting exact packet |
| ChatGPT | Live repo connection not proven | Via authored prompt only | Editable chat `6a6324f3…` verified | Research and critique | Handoff complete |
| Kimi | Canonical repo, branch, HEAD and 478 rows verified | No direct connector; WebBridge extension disconnected | WebBridge daemon only | Packetized M4 repository reviewer | `KIMI-M4-READINESS-001` active |

## Module lanes

| Lane | Requirements | Design | Frontend | Wiring | Tests | Browser proof | Decision |
|---|---|---|---|---|---|---|---|
| M3 Operations certification | CR-430..448 | C3 package present | PR #60 and #61 | Implemented candidate | 17/17 focused pass | Map marker and detail panel proven | Final sponsor/reviewer gate |
| M4 Factory 360 readiness | CR-410..429 | Existing inventory exported by Codex/Claude Design | No lease | Kimi read-only mapping active | Discovery active | Not started | Replacement slice required |
| Cross-actor design critique | CR-430..448 and CR-410..429 | Claude Design owns changes | No product write | N/A | N/A | ChatGPT handoff complete | Codex accepts or returns |

## Dirty laundry

1. Canonical root is dirty from audit/session files and `apps/web/node_modules`;
   no actor may stage those paths without classification.
2. `.design-sync/` exists only as untracked content in the design-sync worktree;
   it is not canonical revision memory yet.
3. The coordination protocol still says `PROPOSED_FOR_LIVE_TEST` although its
   event history proves the test completed.
4. Existing batch/cursor/derived ledgers are stale and must be regenerated from
   immutable events rather than hand-edited.
5. Kimi's Claude Design browser access test failed because its WebBridge
   extension is not connected. This is not delivery-blocking: Kimi receives
   revision-stamped design evidence inside each governed packet.
6. Claude Code's general Design-to-Code session is near its context limit and
   must not receive a product write lease. The bounded M3 session is used only
   for its Revision 3 design-package handoff.
7. Open decisions remain fail-closed, including `DEC-001`, `DEC-028` and the
   Factory Health Score boundary in M4.

## Operating rhythm

Live internal watch lanes are mandatory for Kimi, Claude Code and Claude
Design, and every independent Codex delivery task is directly monitored. The
two-hour control cycle remains the planning horizon, while the maximum
passive-idle tolerance is five minutes. A worker waiting for an answer, lease or
connector must record that dependency and move to a safe fallback packet.

1. Worker reads canonical authority and emits a handshake.
2. Codex issues one packet with exclusive output and file lease.
3. Worker emits progress only at material checkpoints.
4. Blocked details go to dirty laundry; unrelated READY work continues.
5. Worker submits the actor handoff with hashes/revisions and evidence.
6. Codex independently reviews and emits `ACK` or `RETURNED`.
7. Sponsor sees only verified browser output and decisions requiring authority.

The recurring heartbeat `saqeel-two-hour-orchestration-review` now checks live
actor utilization every five minutes and performs the complete reconciliation
every two hours. Idle is treated as a scheduling defect: the actor receives a
new bounded packet or a recorded blocker plus active fallback work.

## Active two-hour queue

| Packet | Actor/session | Work | Write authority | State |
|---|---|---|---|---|
| `KIMI-M4-READINESS-001` | Kimi engineering session 1 | M4 requirement, screen, engine, route, service, permission and evidence map | None | Running |
| `KIMI-M3-QA-001` | Kimi engineering session 2 | Independent M3 code, test, negative-path and evidence certification | None | Running |
| `CLAUDE-M3-STATUS-001` | Claude Code M3 session | Five-lane status packet and exact next Claude Design prompt | None | Complete; blocker review recorded |
| `CLAUDE-M4-DESIGN-INVENTORY-001` | Claude Code M3 session, reassigned | M4 design revision, frame/state and repository mapping | None | Running |
| `M3-SPONSOR-DIRECTION-20260725` | Claude Code M3 session, queued after M4 inventory | Seed source map, provenance-safe live-map design packet, and mutating-read fix packet | Packetization only | Dispatched |
| M3 primary-view critique | ChatGPT editable chat | Adversarial IA and authority critique | None | Handoff received; Codex review |

At the end of the cycle, Codex must ACK, RETURN or BLOCK each completed
handoff, update dirty laundry, reconcile the Claude Design status board and
issue the next queue.

Update: `CLAUDE-M3-STATUS-001` completed. Claude Code verified live, read-only
Claude Design access and found the M3 C3 files already materialized. Codex has
accepted the handoff for blocker review and reassigned the healthy 40%-context
session to `CLAUDE-M4-DESIGN-INVENTORY-001`, now running.

M3 cannot be certified yet:

- `M3-BLOCK-OPS-MUTATING-GET-001`: opening Operations appears to expire pending
  GPS-override requests.
- `M3-DEC-METRIC-CONTRACTS-001`: Submitted Today grain and Active Alerts
  taxonomy/deduplication are not governed.
- `M3-DEC-PROJECTED-ROUTE-001`: projected-route and no-route authorities
  conflict.

Sponsor direction has now been recorded in
`coordination/batches/M3-SPONSOR-DIRECTION-20260725.yaml`:

- deterministic governed seeding is approved after Claude maps the existing
  source queries;
- M3 shows last-recorded GPS or schedule/assignment-projected markers with
  explicit provenance, but no projected route or fabricated ETA;
- the read-triggered geo-override expiry mutation must be fixed under an exact
  implementation and data lease.

The direction was dispatched to Claude Code session
`local_f90cfcda-7e60-448f-a130-7280d6528341` at 46% context use. Claude must
finish the active M4 inventory, then return the three exact M3 packets. Product,
design and shared-data writes remain blocked in that design-only worktree until
Codex reviews the packets and issues isolated leases.

Claude's first M4 finding is accepted for correction: `WA-DES-027` represents
MODON as a live, versioned provider even though the current provider contract
does not support that claim. The design must use truthful unavailable,
configured-source or provenance-safe language; it may not invent a live MODON
integration.

## 478-row delivery score

Current certified end-to-end completion: **0 / 478 — PROVISIONAL**.

This is not a claim that no implementation exists. It means no requirement row
has yet been reconciled through the new combined design, development,
integration, negative-test, browser-evidence and acceptance gate. M3
`CR-430..448` and M4 `CR-410..429` are the first 39 rows under active
certification. The score may increase only from per-row evidence.

## Ready queue behind active work

1. `KIMI-M4-TEST-GAP-002`
2. `KIMI-M3-SECURITY-002`
3. `CLAUDE-M3-DESIGN-REVISION-002`
4. `CLAUDE-M4-DESIGN-INVENTORY-001`

## Verified actor facts

- Kimi independently resolved the canonical repo top, branch `docs/saqeel-inspector-inventory`,
  HEAD `3323a8ef`, five existing dirty paths, the current M2 stop gate, and
  `479` CSV lines (`1` header plus exactly `478` requirements). It made no edits.
- ChatGPT is onboarded in the editable chat `6a6324f3-37f0-83eb-ab62-dbc6054e89aa`
  as a source-marking critic and Claude Design prompt author, without product-code
  or self-approval authority.
- Claude Code session `local_f90cfcda-7e60-448f-a130-7280d6528341` was told to
  emit the M3 Revision 3 handoff and stop. It confirmed branch
  `catalyst/m3-operations-design-0f2c11` at `bb7836c2`, owns only the untracked
  M3 design package, and has no application-code lease.
- ChatGPT returned a bounded critique. Its most valuable first task is M3
  primary-view and information-architecture certification; it correctly
  refused to treat screen IDs, engine IDs, design revisions or runtime wiring
  as proven without evidence.
- Kimi has started `KIMI-M4-READINESS-001`: map CR-410..429 and
  WA-M4-AC-001..006 to canonical screens, engines, routes, services, controls,
  tests, evidence and shared-file overlap, without touching product code.

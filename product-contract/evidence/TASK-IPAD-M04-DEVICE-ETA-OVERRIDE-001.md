# TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 evidence

Date: 2026-07-16
Branch: `codex/g11-g12-integration`
Gate: G11 iPad functional hardening
Verdict: **FUNCTIONAL_E2E_STUB_COMPLETE_EXTERNAL_RELEASE_BLOCKED**

## Contract scope

| Requirement | Acceptance | Delivered functional behavior | Acceptance disposition |
|---|---|---|---|
| MVP1-M04-012 | AC-0125 | Stable per-install device ID, browser-reported OS and application version on journey and immutable geo records | **implemented** |
| MVP1-M04-017 | AC-0130 | Initial ETA, distance, provider timestamp/provenance and planned-window warning | **partial** — test-mode E2E complete; production provider pending DEC-008 |
| MVP1-M04-024 | AC-0137 | Periodic route refresh, durable last-known value, immediate stale state offline and later online refresh | **partial** — test-mode E2E complete; production provider pending DEC-008 |
| MVP1-M04-043 | AC-0156 | Outside-location dialog, cancel, mandatory reason, actual coordinates and governed-decision boundary | **partial** — simulated approval E2E complete; real Operations integration/policy pending |

Screens: SCR-IPAD-610, SCR-IPAD-620.
Process: P06A.
Engines: ENG-06, ENG-08.

## Delivered implementation

- `field-device.ts` creates and reuses a per-install `field-*` identifier and
  reports browser-derived OS plus the server-supplied application version.
- `field-integrations.ts` defines replaceable routing and override-approval
  boundaries. `production` returns unavailable without fabricated values.
  `test_stub` is deterministic and carries an explicit non-production label.
- The field startup flow stores provenance on journey and geo rows, computes
  the initial test ETA from the first valid fix, refreshes it, warns when the
  projected arrival exceeds the execution window and retains a visibly stale
  offline last value.
- The outside-fence path records the actual observed position, opens an
  alert-dialog, supports cancel, requires a reason and persists immutable
  override plus arrival events only after an approved adapter decision.
- Test mode can be enabled only by the server-side
  `FIELD_TEST_STUBS_ENABLED=true` boundary. A URL cannot opt production into
  test mode. Playwright enables the boundary only for browser verification.
- Production/default behavior fails closed when routing, approval or GPS is
  unavailable. Weak GPS is rejected before any check-in event is written.
- Forward migration
  `20260716102921_m04_device_eta_override_test_boundary.sql` adds only
  provenance/provider fields and checks. Existing RLS and immutability remain
  unchanged.

## Database evidence

### Disposable local database

- Full migration applied successfully.
- Same migration replayed successfully (idempotency).
- Valid device, ETA and test-approved override rows persisted.
- Negative ETA, test-stub override without an approval provider and invalid
  integration mode were rejected.
- Disposable database stopped after verification.

### Authenticated live project

- Project object-state preflight proved the new fields absent before the task.
- The forward migration applied and repeated idempotently.
- Readback proved ten additive columns and five constraints.
- `0033_m04_device_eta_override_contract.sql` passed through an authenticated
  Inspector rollback probe: device/ETA/provider/override positive paths,
  negative ETA, immutable geo history and zero residual profile/geo rows.
- Remote migration-history governance remains unresolved; this evidence proves
  live object state and behavior, not repaired history.

## Browser and build evidence

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| M04 focused browser suite | **4/4 PASS** |
| Authentication negative paths | **3/3 PASS** |
| Dashboard defect/recovery suite | **11/11 PASS** |
| Golden planner → field → return → correction → approval journey | PASS |
| Existing offline answer/replay drill | PASS |

The four M04 cases prove:

1. Labelled test adapters complete device capture, initial/refreshed/offline
   ETA, execution-window warning, cancel/retry override, mandatory reason,
   actual-coordinate persistence and inspection handoff.
2. Production mode exposes unavailable routing/approval and never
   self-approves an outside-fence check-in.
3. Production mode with unavailable GPS writes no synthetic check-in.
4. GPS accuracy outside the configured bound blocks before any location event.

Every one of the 298 enumerated application/setup checks has passing evidence.
The last unsharded attempt completed 290 checks and then recorded five
dashboard failures plus three dependent skips during an explicit external
provider `UND_ERR_CONNECT_TIMEOUT`. After connectivity recovered, the complete
affected dashboard set passed 11/11 on a fresh production server. This is
recorded as deterministic recovery evidence, not misrepresented as a single
uninterrupted 298/298 execution.

## Defects found and repaired during iteration

1. The old field flow substituted near-factory coordinates whenever a
   one-shot GPS request timed out. It now reuses the active real tracking fix;
   production never receives a synthetic fallback.
2. ETA warning initially compared only projected arrival time. It now also
   detects when ETA duration itself exceeds the execution window.
3. Offline transition initially waited for the refresh loop. It now marks the
   current estimate stale immediately.
4. An in-flight live ETA persistence request could reject during the offline
   switch and escape into the client error boundary. The background adapter now
   contains the rejection, retains the stale value and keeps the field page
   operational; the positive test asserts zero page exceptions.
5. Operations location history used a global fixed 200-row window. New test
   geo rows could hide legitimate older in-scope events. The immutable ledger
   is now stably paged and filtered to monitored visits before map/table use.
6. Live persona resolution sometimes exceeded the harness's 20-second
   allowance. Setup/dashboard waits now permit the observed live lookup time
   without retries or weakened role assertions.

## External release boundaries retained

- DEC-008: select/license the production road-routing provider and connect it
  to the existing adapter.
- Supply the real governed Operations override approval mechanism, approver
  scope and decision policy.
- DEC-002 remains authoritative for production GPS/geofence policy values; no
  values were invented by this slice.
- Repair remote migration-history governance before relying on automated
  migration promotion.

Test adapters are suitable for functional end-to-end testing only. They are
visibly labelled, server-gated and disabled by default; they are not production
routing truth or real Operations approval.

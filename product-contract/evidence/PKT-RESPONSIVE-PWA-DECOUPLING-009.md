# PKT-RESPONSIVE-PWA-DECOUPLING-009 — technical evidence

Status: `TECHNICAL_PASS_READY_FOR_REVIEW`

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/pwa-decoupling`

Baseline: `93d87fd34ca15ab6130fdd60eb568941f4938e4f`

Verified: `2026-07-27T00:57:36+03:00`

## Outcome

The active application is now ordinary responsive browser delivery:

- The root layout does not register a service worker.
- The install manifest, standalone metadata, update prompt and PWA lifecycle
  modules are removed.
- The remaining `public/sw.js` has no fetch handler, navigation fallback,
  static-asset cache or install shell. It handles Web Push and notification
  clicks only.
- Push permission and push-worker registration remain behind the explicit
  profile opt-in action.
- Activation deletes only obsolete `saqeel-shell-*` Cache Storage entries. It
  does not read or delete IndexedDB.
- Device readiness now reports real browser connectivity and measured storage
  truth. It makes no install, standalone, cold-shell or update-readiness claim.
- Existing `/field` routes remain business-capability routes inside the unified
  responsive shell; no separate frontend or active PWA navigation is created.

`DEC-PWA-WEB-PUSH-PRESERVATION-001` resolves
`DEP-WEB-PUSH-DISPOSITION` by preserving Web Push through the smallest
capability-specific worker. The server adapter, authenticated subscription
actions, RLS behavior, VAPID secret handling and notification policy were not
changed. Apple documents Web Push as a Service Worker–based browser capability,
including Home Screen web-app delivery on iOS/iPadOS and webpage delivery in
Safari on macOS:
[Apple Web Push documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers),
[WebKit Safari 26 web-app behavior](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).

## Archive preservation

Remote verification:

| Ref | Object | Peeled commit |
| --- | --- | --- |
| `refs/heads/archive/pwa-pre-responsive-revamp` | `54a139a9daf893babf16fa901755e61525f26f1c` | same |
| `refs/tags/pwa-pre-responsive-revamp` | annotated tag `dbb8d4b7945d5b9f613b5f196e1c12f1f5add527` | `54a139a9daf893babf16fa901755e61525f26f1c` |

The archive is not connected to active navigation or deployment.

## Protected preservation boundary

No change was made to:

- `apps/web/src/lib/offline.ts`
- `apps/web/src/lib/offline-package-integrity.ts`
- Factory 360 offline snapshots
- inspection execution actions or evidence queues
- outbox payloads, replay guards, conflict detection or idempotency keys
- submission locks, immutable versions or audit behavior
- Supabase migrations, RLS, RPCs, shared data or production DDL

The source and focused tests retain user-scoped IndexedDB namespaces, drafts,
packages, outbox entries, conflicts, pinned replay identity, exactly-once
command construction, checksum/version integrity and no-silent-overwrite
behavior.

`offline-drill.spec.ts` was not run in this packet because it creates a
sacrificial submitted version in the shared development project and `DEC-032`
remains the explicit real-submission stop line. This packet did not edit its
covered business logic. The non-mutating isolation, integrity, idempotency,
execution and network-interruption contracts were run instead.

## Verification

### Build

- `npm run typecheck` — PASS.
- `npm run build` — PASS with Next.js `15.5.21`; 58 static-generation steps
  completed and `/field/settings/readiness` remained a dynamic route.
- `git diff --check` — PASS.

### Focused Playwright suite

Command covered:

- `responsive-browser-delivery-contract.spec.ts`
- `mvp2-push-webpush.spec.ts`
- `field-offline-runtime.spec.ts`
- `field-offline-isolation.spec.ts`
- `ipad-startup-pack-offline-contract.spec.ts`
- `mvp2-m2-02-outbox-idempotency.spec.ts`
- `responsive-execution-field.spec.ts`
- `execution-access-contract.spec.ts`
- `shell-navigation.spec.ts`

Result: `64 passed`, `2 skipped`, `0 failed` in approximately 2.5 minutes.

The two skipped Web Push cases are intentionally environment-gated by absent
VAPID configuration: the recipient-empty live adapter case and real external
browser push-service delivery. The shipped push-only worker, explicit opt-in
registration, fail-closed missing-key path, no-recipient path, authenticated
subscription source and unchanged delivery adapter all passed their focused
contracts. No secret value was read or printed.

### Responsive, locale, theme and accessibility

The readiness route passed all 32 combinations:

- widths: `320`, `375`, `390`, `768`, `1024`, `1280`, `1440`, `1920`
- locales/directions: English/LTR and Arabic/RTL
- themes: light and dark
- horizontal document overflow: zero in every combination
- English and Arabic: keyboard focus present and zero Axe violations

Evidence directory:

`/Users/vikramindla/Desktop/Inspection Documentation/migration-evidence/pwa-decoupling/2026-07-26`

It contains 32 full-page PNGs. Human review confirmed the browser-readiness
content, bilingual copy, storage facts and status badges render correctly on
desktop and mobile.

Human review also exposed an inherited cross-platform shell defect: at narrow
mobile widths, a thin off-canvas navigation rail/topbar edge remains visible
and can overlap the content edge. It predates this packet, is not caused by PWA
decoupling, and cannot be corrected inside this packet's non-overlapping
allowed paths. It is carried as a required remediation and visual regression
for `revamp/cross-platform-qa`; it is not silently treated as accepted.

Real Safari smoke validation is likewise reserved for the final
cross-platform vertical. No Chrome screenshot is represented as real Safari
evidence.

## Acceptance disposition

| Acceptance | Result | Evidence |
| --- | --- | --- |
| No showcased/installable PWA delivery | PASS | Manifest, standalone metadata, global registration, update prompt and PWA lifecycle removed |
| No app-shell/static fetch interception | PASS | Push-only worker has no `fetch` listener or `caches.open` |
| Web Push preserved | PASS with environment-gated live delivery | Explicit opt-in registration, push/click handlers and unchanged server adapter; two VAPID-gated cases skipped |
| Offline business state preserved | PASS | Isolation, integrity, idempotency, execution and source-boundary contracts |
| Honest network interruption | PASS | Loaded Field browser route reports offline/online; no cold-shell claim |
| EN/AR, LTR/RTL, light/dark, widths | PASS | 32-state matrix, zero document overflow |
| Keyboard and accessibility | PASS | English/Arabic keyboard and zero Axe violations |
| Immutable archive refs | PASS | Remote branch and annotated tag peel to approved baseline |
| Real Safari | DEFERRED TO VERTICAL 10 | Required final Safari/WebKit plus real-Safari smoke gate |
| Inherited mobile shell rail defect | OPEN IN VERTICAL 10 | Recorded from human review of narrow screenshots |

## Rollback

Revert the packet commit to restore the previous delivery files. No database
or data rollback is required. The archive branch/tag provides the immutable
pre-migration recovery point and must remain disconnected from active delivery.

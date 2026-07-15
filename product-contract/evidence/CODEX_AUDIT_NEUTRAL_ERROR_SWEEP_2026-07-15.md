# Cross-cutting neutral-error sweep — delivered routes

Date: 2026-07-15  
Reviewer: Codex continuation audit

## Scope

The sweep covered delivered Operations, Factory Registry/Factory 360, Inspection Report,
and Admin control-plane pages/actions. Raw provider details are now diagnostic-only:
server-side `console.error`/`logProviderError` calls retain troubleshooting context,
while user-visible banners and server-action results use stable neutral copy.

## Changed surfaces

| Surface | Closure |
|---|---|
| `/operations` and monitoring actions | Panel names remain visible on partial failure; raw messages are logged only; action/monitor/notification writes return neutral copy |
| `/factories` | Registry load failure uses neutral alert copy |
| `/reports/inspection/:id` | Report load failure uses neutral copy; outside-scope/no-row remains explicit |
| `/admin/localization` | Dictionary/history/sync/restore failures use neutral copy |
| `/admin/audit`, `/admin/access`, `/admin/workflows` | Load failures use neutral alerts and server diagnostics |
| Admin violations/items/regulations/packages/GIS/risk/workflow actions | Provider failures are logged server-side and return neutral mutation/validation copy |

## Verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- `cd-004-admin-control-plane-home.spec.ts` + `dashboard-business.spec.ts` — **22/22 PASS** (3 auth setup + 19 product tests).
- Expanded static/runtime sweep: `neutral-error-sweep.spec.ts` plus the Admin and
  dashboard suites — **25/25 PASS** (3 auth setup + 22 product tests). The sweep now
  includes Admin Items/Violations/GIS, Package Publish, Workflow Draft, Notification
  Bell, field factory verification, offline replay, and virtual-session actions.
- No remaining provider-error text is rendered in these delivered surfaces; remaining
  `.message` references in those paths are server-side diagnostics only. Notification
  delivery failures persist as the stable `failed` state, never a provider-detail
  suffix.
- The shared factory-verification helper now returns only a stable `unavailable` marker;
  its provider error is logged at the server boundary and cannot be interpolated by a
  future caller.

This sweep does not change authorization, workflow transitions, provider contracts, or
policy values.

## Follow-up virtual-session error-path closure

The virtual-session route had one remaining user-visible sink outside the original
surface list: timeline append and notification failures were interpolated into a
successful reschedule/wait/join message. Raw provider text is now logged only on the
server, while the user receives stable follow-up-unavailable copy. This preserves the
best-effort notification contract without exposing PostgREST/RPC details.

Verification: `npm run typecheck` PASS; `npm run build` PASS; focused virtual,
visit-detail, and immediate-authority regression **33/33 PASS** (including auth setup).

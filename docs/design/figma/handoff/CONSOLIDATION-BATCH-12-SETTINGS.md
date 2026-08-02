# Batch 12 — Trusted Devices and Sync Conflicts

The two most stateful reachable routes that had no contract.

| | Trusted Devices | Sync Conflicts |
|---|---|---|
| Frame | **`355:42471`** | **`355:42570`** |
| Route | `/field/settings/devices` — 985 ln | `/field/settings/conflicts` — 568 ln |
| Reachable | yes — `FieldSettingsClient.tsx:131` | yes — `FieldSettingsClient.tsx:155` |
| Required states | empty, error, loading, offline, permission, validation — **6** | empty, error, offline, permission |
| Dependencies | `Badge` `9:25`, `Switch` `9:79`, `Button` `8:32`, `section-title` `70:12` | `Alert` `11:43`, `Badge` `9:25`, `Button` `8:32` |
| Jira | **no story in the inspector backlog** | **no story** |

**Device trust states are the shipped enum**, read from `TrustedDevicesClient.tsx:108-128`:
`pending` · `approved` · `revoked` · `wipe_pending` · `policy_pending`. Four are drawn; each is a
`Badge` with a text label, never colour alone.

**Conflict resolution mirrors the shipped contract**: per `inspection_items` row, a device value
against a server value, resolved by *Keep mine* / *Keep server*, recorded through
`record_sync_conflict_resolution`.

Every value that is governed renders `Not configured` — device identifiers, and both sides of
each conflict.

## Responsive

| Width | Devices | Conflicts |
|---|--:|--:|
| 1280 | 0 / 0 | 0 / 0 |
| 1024 | 0 / 0 | 0 / 0 |
| 834 | 0 / 0 | 0 / 0 |
| 680 | 0 / 0 | 0 / 0 |

*clipped / crunched.* Also 0 off-ramp sizes, 0 unbound fills, 0 placeholder literals on both.

## A copy delta worth raising

The shipped enrollment string is **"Enroll this iPad to request approval"**
(`TrustedDevicesClient.tsx`). The inspector channel is responsive web, and no iPad device chrome
is authoritative — so the contract renders **"Enroll this device to request approval"**.

This is a deliberate divergence from the shipped copy, not an oversight. **The repository string
should change**; the design should not encode a device that the channel decision has retired.
Recorded here rather than silently matched.

## Contracts built so far

| Route | Frame | Jira |
|---|---|---|
| `/field` | `346:42363` | — |
| `/field/establishments` | `336:45825` · Dark `336:46018` · AR `336:46351` + 3 states | INSP-588 |
| `/field/summons-notices` | `340:42098` · Dark `342:42172` · AR `342:44733` | INSP-558 |
| `/field/notifications` | `354:42408` | — |
| `/field/settings/devices` | `355:42471` | — |
| `/field/settings/conflicts` | `355:42570` | — |

**14 frames, all passing 0 clipped / 0 crunched at four widths.**

## Still without a contract

~22 routes. The next highest-value reachable ones are `/field/visits` (5 states),
`/field/search` (4), `/field/[visitId]` startup pack, and `/field/factory-360/[id]` — the last of
which the capability audit shows has **zero design representation** despite sharing a loader with
the web Factory 360.

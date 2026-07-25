# M3 Operations Sponsor Briefing

**Status:** Draft recommendation only — no decision applied
**Detailed choices:** `CODEX-M3-OPERATIONS-SPONSOR-BUSINESS-DECISIONS-014.yaml`
**Application map:** `CODEX-M3-OPERATIONS-DECISION-AUTHORITY-APPLICATION-MATRIX-015.yaml`

## Recommended business bundle

Approve the nine recommended Option A choices as one policy direction:

1. **Queue M3 immediately after M2.** Finish the current Planning approval before activating Operations.
2. **Use truthful tiered map provenance.** Show recorded GPS when available; otherwise show a clearly labelled schedule/factory fallback, unavailable state, or read-error. Never fabricate a route, ETA, drift, animation, or live claim.
3. **Authorize Operations and Leadership appropriately.** Operations receives scoped monitoring and separately permitted actions. Leadership receives authorized aggregate monitoring with sensitive details masked. Planner receives no implicit Operations entitlement. Auditor receives only separately authorized immutable history/audit access. “Supervisor” maps to the governed Operations boundary; no new role is invented.
4. **Default every user to assigned geography.** Region or branch scope applies to factories, visits, inspectors, cases, and exceptions. National visibility is exceptional.
5. **Restrict precise inspector location.** Only scoped Operations users may see precise identity and valid coordinates during approved active journey/execution states. Leadership remains aggregate or masked.
6. **Separate monitoring from action authority.** GPS overrides, cancellations, exception resolution, notification handling, and export each require their own capability, matching record scope, workflow guard, and audit.
7. **Make national access time-bound and auditable.** Require a named grantor, grantee, reason, expiry, review, revocation, session/cache handling, and immutable audit.
8. **Use one centrally governed GIS/Operations refresh policy.** The interface must disclose observation, freshness, stale, offline, and reconnect truth. No client constant becomes policy.
9. **Approve linked F0 and M8 follow-up planning.** F0 retains navigation and shared migration ownership. M8 retains `/admin/access`. M3 owns Operations consumers and acceptance.

## Choices that cannot safely take effect as part of the bundle

Two recommendations can be approved in principle but cannot be operationally completed by sponsor approval alone:

- **M3 activation:** Approval may queue M3 after M2, but cannot activate it now. Activation still requires M2 closure, applied authority records, one reconciled base, and independent pre-activation certification.
- **CR-431 / DEC-002 refresh policy:** The sponsor may approve central GIS/Operations ownership, but GIS/Operations must still provide the permitted range, stale threshold, offline/reconnect behavior, and provider/load constraints. Until then, CR-431 remains blocked.

The cross-package choice approves planning only. It does not create F0 or M8 leases or authorize implementation.

## Effect on users

- **Operations users:** See only assigned geography. They receive operational detail and precise active-work location only when policy permits. Every mutation remains separately authorized and audited.
- **Leadership users:** See national or authorized aggregate monitoring with sensitive identities and details masked. They remain read-only unless a separate action grant is approved.
- **Planner users:** Keep Planning authority but gain no implicit Operations monitoring, precise-location, execution, or review-decision power.
- **Auditor users:** Receive immutable history and audit evidence only within separately authorized scope; no operational mutation.
- **Inspectors:** Their precise location is exposed only during approved active work, to scoped authorized users, with timestamp, accuracy/freshness, privacy, and audit controls.

## Privacy effect

The bundle reduces exposure by default:

- assigned geography rather than national visibility;
- masked or aggregate Leadership views;
- precise location limited by role, scope, and active state;
- no false live tracking;
- explicit stale, unavailable, invalid, and read-error states;
- time-bound national grants instead of permanent broad access;
- immutable access and action audit.

## What remains blocked even after sponsor approval

Sponsor approval of this bundle will not, by itself, unblock:

- M3 activation before M2 closes;
- edits to the design acceptance and prompt before the decision is formally applied;
- Claude Code dispatch before the exact eight-file lease is registered;
- the unresolved dirty preview overlap;
- F0 navigation or shared migration implementation;
- M8 national-grant administration;
- changes to `apps/web/src/lib/execution/capabilities.ts` before one owner is recorded;
- migration filenames before the canonical-tail collision check;
- consumer branches before one reconciled immutable base exists;
- CR-431 certification before DEC-002 is fully resolved;
- implementation, database application, shared-data mutation, push, merge, deployment, or release;
- final acceptance before independent certification and browser evidence.

## Recommended sponsor response

> Approve the recommended M3 Operations Option A bundle in principle. Queue M3 after M2; do not activate it yet. Approve truthful tiered map provenance, scoped Operations access, masked Leadership monitoring, assigned geography by default, active-work-only precise location, separately permissioned actions, time-bound national grants, central GIS/Operations refresh-policy ownership, and linked F0/M8 follow-up planning. DEC-002 numeric and operational settings remain subject to GIS/Operations evidence. This approval does not authorize leases, implementation, Claude dispatch, database changes, merge, push, or deployment.

This statement is a draft for sponsor action. It is not an approval until the sponsor explicitly selects it and the decision is applied through the authority matrix.

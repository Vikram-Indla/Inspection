# Pilot delta review — Planning

## Decision

**APPROVE THE FOCUSED APPLICATION CORRECTION AND THE NEW DESIGN CANDIDATE FOR
SPONSOR CONSENT.**

## Stable design revision

The implementation comparison used frozen baseline `WA-DES-036` revision
`1784901048581707`. Claude preserved it and created list-first candidate
revision `1784904309230874`.

## Real application mapping

The pilot maps to real `/planning`, `/planning/visits`, and
`/planning/visits/[id]` application pages. It uses real authentication,
capability checks, RLS-scoped services, audit events, immutable versions, and
existing routes.

## Bounded delta

The implemented correction is limited to native SAQEEL presentation, Planning
layout modules, direction-neutral labels, localized dates, test contracts, and
the explicit read-only sponsor preview. It does not change APIs, schema,
permissions, workflow transitions, route cutover, or shared data.

## Tests

Typecheck and production build pass. The focused F0 and Planning M2 suite is
16/16 PASS. Required negative paths include admin denial and preview fail-closed
without the explicit query. Arabic RTL, narrow reflow, and automated
accessibility pass.

## Consent completeness

Application consent is complete for the original bounded correction. Premium
visual consent is not complete until the sponsor accepts or rejects candidate
revision `1784904309230874`. The candidate introduces a new composition delta;
current preview parity must not be claimed before that delta is separately
implemented and verified.

## Reviewer recommendation

**APPROVE FOR SPONSOR CONSENT** for candidate design revision
`1784904309230874`.

If approved, issue one bounded frontend correction lease for the list-first
composition. Keep APIs, backend, schema, RBAC/RLS, and routes unchanged.
